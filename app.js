/*jshint globalstrict: true, devel: true, browser: true, jquery: true */

var express = require("express");
var connect = require('connect');
var redis = require('redis');
var passport = require('passport');
var socketio = require("socket.io");
var passportSocketIo = require('passport.socketio');
var LocalStrategy = require('passport-local').Strategy;
var sessionStore = new connect.session.MemoryStore();
var less = require("less-middleware");
var path = require("path");

var sessionSecret = 'hYxpxmUPJG2ze2ZVCfwlAiZoS';
var sessionKey = 'connect.sid';

var rClient = redis.createClient();
var app = express();
var httpServer = require("http").createServer(app);
var io = socketio.listen(httpServer, { log: false });

var id_iterator = 0;
var players = [];
var activePlayer = 0;

var gameModifiers = {cardsToDraw:1,
	cardLimiter: false,
	colorLimiter: false,
	wayOfPlay:1
};

 //tablica z kartami karo-1, kier-2, pik-3, trefl-4
 var talia = new Array("as1", "as2", "as3", "as4", "dwa1", "dwa2", "dwa3", "dwa4", "trzy1", "trzy2", "trzy3", "trzy4", "cztery1", "cztery2", "cztery3", "cztery4", "pięć1", "pięć2", "pięć3", "pięć4", "sześć1", "sześć2", "sześć3", "sześć4", "siedem1", "siedem2", "siedem3", "siedem4", "osiem1", "osiem2", "osiem3", "osiem4", "dziewięć1", "dziewięć2", "dziewięć3", "dziewięć4", "dziesięć1", "dziesięć2", "dziesięć3", "dziesięć4", "walet1", "walet2", "walet3", "walet4", "dama1", "dama2", "dama3", "dama4", "król1", "król2", "król3", "król4");
 var kartyWybrane = [];

//dobor kart
function getCards(count){
  var card;
  var tab = [];
  for(var i = 0; i < count; i++){
	if(talia.length >= 1) {
		card = talia.pop();
		tab[i] = card;
	}
	else{
		resetDeck();
		i--;
	}
  }
return tab;
}

function changeActivePlayer(){
	activePlayer += gameModifiers.wayOfPlay;
	activePlayer = activePlayer % players.length;

	return players[activePlayer];
}

//resetowanie stolu
function resetDeck(){
	talia = kartyWybrane;
	shuffle();
}

//funkcja tasujaca karty
function shuffle(){
	var i = talia.length;
	while(--i){
		var j = Math.floor(Math.random() * (i + 1));
		var temp = talia[i];
		talia[i] = talia[j];
		talia[j] = temp;
	}
}

 //tasowanie kart na początek gry
 shuffle();
 var nowa = getCards(1);
 kartyWybrane.push(nowa);

//serializacja i deserializacja usera
passport.serializeUser(function (user, done){
	done(null, user);
});

passport.deserializeUser(function (obj, done){
	done(null, obj);
});

passport.use(new LocalStrategy( function (username, password, done){
		rClient.get(username, function (err, reply){
			if(reply && password === reply.toString()){
				console.log("Udane logowanie...");
				return done(null, {
					username: username,
					password: password
				});
			}
			else{
				return done(null, false);
			}
		});
}));

app.use(less({
	src: path.join(__dirname, 'less'),
	dest: path.join(__dirname, 'public/css'),
	prefix: '/css',
	compress: true
}));

app.use(express.cookieParser());
app.use(express.urlencoded());

app.use(express.session({
	store: sessionStore,
	key: sessionKey,
	secret: sessionSecret
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static("public"));
app.use(express.static("bower_components"));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//przekierowania do widoków(log, rej, gra)
app.get("/", function(req, res){
	res.redirect("/index");
});

app.get("/index", function(req, res){
	res.render("index");
});

app.get("/login", function(req, res){
	res.render("login");
});

app.get("/rejestracja", function(req, res){
	res.render("rejestracja");
});

app.get("/gra", function(req, res){
	if(!req.user) {
		res.redirect('/login');
	} else {
		res.render("gra");	
	}
});

app.post('/login',
	passport.authenticate('local', {
		failureRedirect: '/login'
	}),
	function (req, res) {
		var player = {username: req.body.username, id: id_iterator};
		id_iterator++;
		players.push(player);
		res.redirect('/gra');
});

//jeśli przy rejestracji pss1=pass2 to rejestruje gracza i przekierowuje na strone logowania
app.post('/rejestracja',function(req, res){
	if(req.body.password == req.body.password2)
		rClient.set(req.body.username, req.body.password, function(){
			res.redirect('/login');
		});
 //jesli nie to odswierza strone
 else{
   res.redirect('/rejestracja');
 }
 
});

//odsługa socet'ów
io.sockets.on("connection", function(socket){
	
	socket.emit("YourName", players[players.length-1]);

	socket.emit("CurrentModifiers", gameModifiers);

	socket.emit("ActivePlayer", players[activePlayer]);

	socket.on("NewModifiers", function (modifiers){
		var temp = modifiers;
		if(temp.cardsToDraw != 1 && gameModifiers.cardsToDraw != 1){
			temp.cardsToDraw = temp.cardsToDraw + gameModifiers.cardsToDraw;
		}
		gameModifiers = temp;

		io.sockets.emit("CurrentModifiers", gameModifiers);
	});

	io.sockets.emit("Glowna karta", nowa);

	socket.emit("Nowe karty", getCards(5));

	io.sockets.emit('Zalogowani gracze', players);
	
	socket.on("Dobieram", function(dobierana){
		io.sockets.emit("ActivePlayer", changeActivePlayer());
		
		gameModifiers.cardsToDraw = 1;

		io.sockets.emit("CurrentModifiers", gameModifiers);

		socket.emit("Podaje", getCards(dobierana));
	});
	
	socket.on("KartaNaStole", function(wylozona){
		io.sockets.emit("ActivePlayer", changeActivePlayer());
		nowa = wylozona;
		kartyWybrane.push(nowa);
		io.sockets.emit("Glowna karta", nowa);
	});

	socket.on("Color", function(color){
		io.sockets.emit("ColorRequest", color);
	});

	socket.on("Request", function(card){
		io.sockets.emit("CardRequest", card);
	});

	socket.on("EndOfGame", function(win){
		io.sockets.emit("Winner", win);
	});
});

httpServer.listen(3000, function () {
	console.log('Serwer HTTP działa na pocie 3000');
});