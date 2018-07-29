var express    = require('express');
var app        = express();
var server     = require('http').Server(app);
var io         = require('socket.io')(server);

var fs         = require('fs');
var path       = require('path');
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

    socket.on('newGame', function(data, callback){
    	var gameUUID = uuidv1().replace(/-/g, '');
    	var gameID = gameUUID.substring(0, 4)
    	var newGame = new Telestration(gameID);

		var newUser = {
    		username: data.username,
    		socketID: socket.id
    	}
    	newGame.addPlayer(newUser)
    	socket.gameID = data.gameID;

    	games[gameID] = newGame
        console.log(newGame.getGameID() + ' :game started');
        callback(gameID, socket.id)
        socket.emit("switchPanel", "lobbyPanel");
    })

    socket.on('joinGame', function(data, callback){
    	if (!data.gameID) {
    		console.log('No gameID provided');
    		return
    	}
    	if (!data.username) {
    		console.log('No username provided');
    		return
    	}
    	if (!games[data.gameID]){
    		console.log('Game not found');
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

    socket.on('disconnect', function(data){
        console.log(socket.un + ' has disconnected');
    	var gameID = socket.gameID;
    	if (!gameID) {
    		return
    	}
    	if (!games[gameID]) {
    		return
    	}
    	if (games[gameID].status == "lobby") {
    		games[gameID].removePlayer(socket.id)
        	socket.broadcast.emit("setPlayers", games[gameID].exportPlayers());
    	}
        console.log(socket.un + ' has disconnected');
    })

    socket.on('saveFile', function(data){
        saveFile(data, __dirname  + '\\gamePictures\\TestPicture.png',(err, data) => {
			if (err) console.log("saveFile - error", err);
		})
    })

    socket.on('enterGuess', function(data){
    	console.log(data)
    })
});

console.log('ready')


