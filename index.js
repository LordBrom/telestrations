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
app.use("/games",   express.static(path.join(__dirname, 'games')));

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
    		io.to(gameID).emit("setPlayers", games[gameID].exportPlayers());
        	// socket.broadcast.emit("setPlayers", games[gameID].exportPlayers());
    	}
    })

    socket.on('newGame', function(data, callback){
    	if (!data.username) {
    		console.log("debug", 'No username provided');
        	callback(false)
    		return
    	}

    	var gameUUID = uuidv1().replace(/-/g, '');
    	var gameID = gameUUID.substring(0, 4).toUpperCase();
    	var newGame = new Telestration(gameID);

		var newUser = {
    		username: data.username,
    		socketID: socket.id
    	}
    	newGame.addPlayer(newUser)
    	socket.gameID = gameID;
        socket.join(gameID);

    	games[gameID] = newGame
        console.log(newGame.getGameID() + ' :game started');
        callback(gameID, socket.id)
        socket.emit("switchPanel", "lobbyPanel");
    })

    socket.on('joinGame', function(data, callback){
    	if (!data.gameID) {
    		console.log("debug", 'No gameID provided');
        	callback(false)
    		return
    	}
    	if (!data.username) {
    		console.log("debug", 'No username provided');
        	callback(false)
    		return
    	}
    	if (!games[data.gameID]){
    		console.log("debug", 'Game not found');
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
        socket.join(data.gameID);

		io.to(data.gameID).emit("setPlayers", games[data.gameID].exportPlayers());
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
    	if (!data.fileData){
    		console.log("debug", "no file data.")
    		return
    	}
    	if (!data.gameRound){
    		console.log("debug", "no game round.")
    		return
    	}
    	var gameID = socket.gameID;
    	if (!gameID){
    		console.log("debug", "no gameID.")
    		return
    	}
    	var imageUUID = uuidv1().replace(/-/g, '');
        var fileName = data.gameRound + "_" + socket.id;
        var gamePath = '/games/' + gameID + '/';
        var imagePath = gamePath + fileName + ".png";
        saveFile(data.fileData, __dirname  + imagePath,(err, data) => {
			if (err) console.log("saveFile - error", err);
		})
    	if (!games[gameID]){
    		console.log("debug", "game not found.")
    		return
    	}

    	games[gameID].setRoundResult(socket.id, data.gameRound, imagePath, __dirname + gamePath);
    })




    socket.on('enterGuess', function(data){
    	if (!data.text){
    		console.log("debug", "no guess.")
    		return
    	}
    	if (!data.gameRound){
    		console.log("debug", "no game round.")
    		return
    	}
    	var gameID = socket.gameID;
    	if (!gameID){
    		console.log("debug", "no gameID.")
    		return
    	}
        var gamePath = '/games/' + gameID + '/';
    	games[gameID].setRoundResult(socket.id, data.gameRound, data.text, __dirname + gamePath);
    })



    socket.on('getNewPrompt', function(data, callback){
    	var gameID = socket.gameID;
    	if (!gameID){
    		console.log("debug", "no gameID.")
    		return
    	}
    	if (!data.prompt){
    		console.log("debug", "no prompt.")
    		return
    	}
    	fs.appendFile('removePromptList.txt', "\n" + data.prompt, function (err) {
			if (err) throw err;
			console.log('Adding "' + data.prompt + '" to the remove list');
		});

    	callback(games[gameID].getNewPrompt(socket.id));
    })
});

var sendMessage = function() {

}

console.log('ready')


