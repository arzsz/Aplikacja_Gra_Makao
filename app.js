var express = require("express");
var connect = require('connect');
var redis = require('redis');
var passport = require('passport');
var socketio = require("socket.io");
var passportSocketIo = require('passport.socketio');
var LocalStrategy = require('passport-local').Strategy;
var sessionStore = new connect.session.MemoryStore();

var sessionSecret = '123hbh321h3jHhjj123459900dsad09dad78s';
var sessionKey = 'connect.sid';

var rClient = redis.createClient();
var app = express();
var httpServer = require("http").createServer(app);
var io = socketio.listen(httpServer, { log: false });

var id_iterator = 1;
var players = [];

/**
* Cards maintance code
*
*/

 //tablica z kartami
var talia = new Array("ace1", "ace2", "ace3", "ace4", "two1", "two2", "two3", "two4", "three1", "three2", "three3", "three4",
						"four1", "four2", "four3", "four4", "five1", "five2", "five3", "five4", "six1", "six2", "six3", "six4",
						"seven1", "seven2", "seven3", "seven4", "eight1", "eight2", "eight3", "eight4", "nine1", "nine2", "nine3", "nine4",
						"ten1", "ten2", "ten3", "ten4", "jack1", "jack2", "jack3", "jack4", "queen1", "queen2", "queen3", "queen4", "king1", "king2", "king3", "king4");
var kartyWybrane = [];

//dobor kart
function getCards(count){
	var tab = new Array();
	for(var i = 0; i < count; i++) {
		if(talia.length >= 1) {
			card = talia.pop();
			tab[i] = card;
		} else {
			resetDeck();
			i--;
		}
	}

	return tab;
}

//resetowanie stolu
function resetDeck(){
	talia = kartyWybrane;
	shuffle();
}

//funkcja tasujaca karty
function shuffle(){
	var i = talia.length;
   	while (--i) {
      var j = Math.floor(Math.random() * (i + 1))
      var temp = talia[i];
      talia[i] = talia[j];
      talia[j] = temp;
   }
}

 //tasowanie kart na początek gry
shuffle();
var nowa = getCards(1);
kartyWybrane.push(nowa);

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

passport.use(new LocalStrategy(
    function (username, password, done) {
    	rClient.get(username, function (err, reply) {
    		if (reply && password === reply.toString()) {
            console.log("Udane logowanie...");
            return done(null, {
                username: username,
                password: password
            });
	        } else {
	            return done(null, false);
	        }
	    });

        
    }
));
//express + passport
app.use(express.cookieParser());
app.use(express.urlencoded());
app.use(express.session({
    store: sessionStore,
    key: sessionKey,
    secret: sessionSecret
}));
app.use(passport.initialize());
app.use(passport.session());

//Konfiguracja expressa
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
    	console.log(player);
    	players.push(player);
    	console.log(players);
        res.redirect('/gra');
    }
);
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

io.sockets.on("connection", function(socket){

	//odsługa socet'ów
	io.sockets.emit("Glowna karta", nowa);
	socket.emit("Nowe karty", getCards(5));
	io.sockets.emit('Zalogowani gracze', players);
	socket.on("Dobieram", function(dobierana){
		socket.emit("Podaje", getCards(1));
	});
	socket.on("KartaNaStole", function(wylozona){
		nowa = wylozona;
		kartyWybrane.push(nowa);
		io.sockets.emit("Glowna karta", nowa);
	})
});

httpServer.listen(3000, function () {
    console.log('Serwer HTTP działa na pocie 3000');
});