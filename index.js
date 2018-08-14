const express    = require('express');
const app        = express();
const server     = require('http').Server(app);
const io         = require('socket.io')(server);

const fs         = require('fs');
const path       = require('path');
const mkdirp     = require('mkdirp');
const loki       = require('lokijs');
const saveFile = require('save-file');
const uuidv1   = require('uuid/v1');

const logger     = require('logger').createLogger('development.log');

const Telestration   = require('./scripts/Telestration.js');

var games = {};

app.use("/styles",  express.static(path.join(__dirname, 'styles')));
app.use("/scripts", express.static(path.join(__dirname, 'scripts')));
app.use("/games",   express.static(path.join(__dirname, 'games')));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

var db = new loki('GameDB.json')
var gamesTable = db.addCollection('games')
var playersTable = db.addCollection('players')

server.listen(3000);

io.sockets.on('connection', function (socket) {
    logger.info('A user has connected');

    socket.on('disconnect', function(data){
        logger.info(socket.un + ' has disconnected');
        setPlayerDisconnected(socket.id)


    	var gameID = socket.gameID;
    	if (!gameID) {
        	logger.warn("no game id");
    		return
    	}
    	if (!games[gameID]) {
        	logger.warn("no game found");
    		return
    	}
    	if (games[gameID].status == "lobby") {
    		games[gameID].removePlayer(socket.id)
    		io.to(gameID).emit("setPlayers", games[gameID].exportPlayers());
    	}
    })

    socket.on('newGame', function(data, callback){
    	if (!data.username) {
    		logger.warn('No username provided');
        	callback(false)
    		return
    	}

        var gameID = createGame()

        addPlayer(data.username, gameID, socket.id)

    	var newGame = new Telestration(gameID);
		var newUser = {
    		username: data.username,
    		socketID: socket.id
    	}
    	newGame.addPlayer(newUser)
    	socket.gameID = gameID;
        socket.join(gameID);

    	games[gameID] = newGame
        logger.info(newGame.getGameID() + ' :game started');

        callback(gameID, socket.id)
        socket.emit("switchPanel", "lobbyPanel");
    })

    socket.on('joinGame', function(data, callback){
    	if (!data.gameID) {
    		logger.warn('No gameID provided');
        	callback(false)
    		return
    	}
    	if (!data.username) {
    		logger.warn('No username provided');
        	callback(false)
    		return
    	}
        var gameObj = gamesTable.findOne({"gameID": data.gameID});
    	if (!gameObj){
    		logger.warn('Game not found');
        	callback(false)
    		return
    	}

        addPlayer(data.username, data.gameID, socket.id)

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
    	logger.info("starting game")
    	games[socket.gameID].status = 'playing'

    	games[socket.gameID].socketIO = io
    	games[socket.gameID].fs = fs
        games[socket.gameID].mkdirp = mkdirp
    	games[socket.gameID].gamesDir = __dirname  + '/games/'

    	games[socket.gameID].startGame();

    })



    socket.on('saveFile', function(data){
    	if (!data.fileData){
    		logger.warn("no file data.")
    		return
    	}
    	if (!data.gameRound){
    		logger.warn("no game round.")
    		return
    	}
    	var gameID = socket.gameID;
    	if (!gameID){
    		logger.warn("no gameID.")
    		return
    	}
    	var imageUUID = uuidv1().replace(/-/g, '');
        var gamePath = '/games/' + gameID + '/';
        var imagePath = gamePath + imageUUID + ".png";
        saveFile(data.fileData, __dirname  + imagePath,(err, data) => {
			if (err) logger.error("saveFile - error", err);
		})
    	if (!games[gameID]){
    		logger.warn("game not found.")
    		return
    	}

    	games[gameID].setRoundResult(socket.id, data.gameRound, imagePath, __dirname + gamePath);
    })




    socket.on('enterGuess', function(data){
    	if (!data.text){
    		logger.warn("no guess.")
    		return
    	}
    	if (!data.gameRound){
    		logger.warn("no game round.")
    		return
    	}
    	var gameID = socket.gameID;
    	if (!gameID){
    		logger.warn("no gameID.")
    		return
    	}
        var gamePath = '/games/' + gameID + '/';
    	games[gameID].setRoundResult(socket.id, data.gameRound, data.text, __dirname + gamePath);
    })



    socket.on('getNewPrompt', function(data, callback){
    	var gameID = socket.gameID;
    	if (!gameID){
    		logger.warn("no gameID.")
    		return
    	}
    	if (!data.prompt){
    		logger.warn("no prompt.")
    		return
    	}
    	fs.appendFile('removePromptList.txt', "\n" + data.prompt, function (err) {
			if (err) throw err;
			logger.info('Adding "' + data.prompt + '" to the remove list');
		});

    	callback(games[gameID].getNewPrompt(socket.id));
    })
});

var createGame = function() {
    var gameUUID = uuidv1().replace(/-/g, '');
    var gameID = gameUUID.substring(0, 4).toUpperCase();

    gamesTable.insert({
        "gameID": gameID,
        "status": "setup"
    })

    return gameID;
}

var addPlayer = function(userName, gameID, socketID) {
    if (!userName || !userName.length) {
        return false
    }
    if (!gameID || !gameID.length) {
        return false
    }
    if (!socketID || !socketID.length) {
        return false
    }

    playersTable.insert({
        "gameID": gameID,
        "username": userName,
        "socketID": socketID,
        "connected": true
    })

    return true
}

var setPlayerDisconnected = function(socketID){
    var player = playersTable.findOne({"socketID": socketID})
    if (!player) {
        // player not found
        return false;
    }
    player.connected = false
    playersTable.update(player)

    return true;
}

console.log('ready')


