var express = require("express");
var connect = require("connect");
var redis = require("redis");
var passport = require("passport");
var socketio = require("socket.io");
var passportSocetIo = require("passport.socketio");
var LocalStrategy = require('passport-local').Strategy;
var routes = require('./routes');
var sessionStore = new connect.session.MemoryStore();

var sessionSecret = '123hbh321h3jHhjj123459900dsad09dad78s';
var sessionKey = 'connect.sid';

rClient = redis.createClient();
var app = express();
var httpServer = require("http").createServer(app);
var io = socketio.listen(httpServer, {log: false});

//konfiguracja pokoików
var history = {"global": []};
var rooms = [{id: "global", name: "Ogólny"}];

//konfiguracja expressa
app.use(express.static("public"));
app.use(express.static("bower_components"));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//routing
app.get("/register", routes.register);
app.get("/login", routes.login);
app.get('/', routes.index);
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/login');
});


io.sockets.on('connection', function (socket) {
	socket
	socket.emit('history', history);
});

httpServer.listen(3000, function () {
    console.log('Serwer HTTP działa na pocie 3000');
});
