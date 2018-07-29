var express    = require('express');
var app        = express();
var server     = require('http').Server(app);
var io         = require('socket.io')(server);

var fs         = require('fs');
var path       = require('path');
var mkdirp     = require('mkdirp');
const saveFile = require('save-file');
const uuidv1   = require('uuid/v1');

const Telestration   = require('./scripts/Telestration.js');

var games = {};

app.use("/styles",  express.static(path.join(__dirname, 'styles')));
app.use("/scripts", express.static(path.join(__dirname, 'scripts')));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

server.listen(8080);

io.sockets.on('connection', function (socket) {
    console.log('A user has connected');

    socket.on('disconnect', function(data){
        console.log(socket.un + ' has disconnected');
    	var gameID = socket.gameID;
    	if (!gameID) {
        	console.log("debug", "no game id");
    		return
    	}
    	if (!games[gameID]) {
        	console.log("debug", "no game found");
    		return
    	}
    	if (games[gameID].status == "lobby") {
    		games[gameID].removePlayer(socket.id)
        	socket.broadcast.emit("setPlayers", games[gameID].exportPlayers());
    	}
    })

    socket.on('newGame', function(data, callback){
    	var gameUUID = uuidv1().replace(/-/g, '');
    	var gameID = gameUUID.substring(0, 4).toUpperCase();
    	var newGame = new Telestration(gameID);

		var newUser = {
    		username: data.username,
    		socketID: socket.id
    	}
    	newGame.addPlayer(newUser)
    	socket.gameID = gameID;

    	games[gameID] = newGame
        console.log(newGame.getGameID() + ' :game started');
        callback(gameID, socket.id)
        socket.emit("switchPanel", "lobbyPanel");
    })

    socket.on('joinGame', function(data, callback){
    	if (!data.gameID) {
    		console.log('No gameID provided');
        	callback(false)
    		return
    	}
    	if (!data.username) {
    		console.log('No username provided');
        	callback(false)
    		return
    	}
    	if (!games[data.gameID]){
    		console.log('Game not found');
        	callback(false)
    		return
    	}
		var newUser = {
    		username: data.username,
    		socketID: socket.id
    	}
    	socket.gameID = data.gameID;
    	games[data.gameID].addPlayer(newUser)
        callback(socket.id)
        socket.emit("switchPanel", "lobbyPanel");

        socket.broadcast.emit("setPlayers", games[data.gameID].exportPlayers());
        socket.emit("setPlayers", games[data.gameID].exportPlayers());
    })



    socket.on('startGame', function(data){
    	console.log("starting game")
    	games[socket.gameID].status = 'playing'

    	games[socket.gameID].socketIO = io
    	games[socket.gameID].fs = fs
    	games[socket.gameID].mkdirp = mkdirp
    	games[socket.gameID].gamesDir = __dirname  + '/games/'

    	games[socket.gameID].startGame();

    })



    socket.on('saveFile', function(data){
        saveFile(data, __dirname  + '/gamePictures/TestPicture.png',(err, data) => {
			if (err) console.log("saveFile - error", err);
		})
    })




    socket.on('enterGuess', function(data){
    	console.log(data)
    })
});

console.log('ready')


