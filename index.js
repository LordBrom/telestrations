const express       = require('express');
const app           = express();
const server        = require('http').Server(app);
const io            = require('socket.io')(server);
const fs            = require('fs');
const path          = require('path');
const mkdirp        = require('mkdirp');
const loki          = require('lokijs');
const saveFile      = require('save-file');
const uuidv1        = require('uuid/v1');
const logger        = require('logger').createLogger('log_dev.log');
const logger_player = require('logger').createLogger('log_player.log');
const logger_game   = require('logger').createLogger('log_game.log');

const PromptList     = require('./PromptList.js');
const Telestration   = require('./scripts/Telestration.js');

var games = {};

app.use("/styles",  express.static(path.join(__dirname, 'styles' )));
app.use("/scripts", express.static(path.join(__dirname, 'scripts')));
app.use("/games",   express.static(path.join(__dirname, 'games'  )));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

var db = new loki('GameDB.json')
var table_game   = db.addCollection('games')
var table_player = db.addCollection('players')
var table_sheet  = db.addCollection('sheet')
var table_round  = db.addCollection('round')

server.listen(8080);

io.sockets.on('connection', function (socket) {
	logger_player.info('A user has connected');

	socket.on('disconnect', function(data){

		if (socket.un) logger_player.info(socket.un + ' has disconnected');
		else logger_player.info('A user has disconnected');

		var gameID = socket.gameID;
		if (!gameID) { logger.warn("(func: disconnect)", "no game id");    return; }

		if (gameStarted === 0) {
			setPlayerDisconnected(socket.id)
			io.to(gameID).emit("setPlayers", listPlayers(gameID));
		}
	})

	socket.on('newGame', function(data, callback){
		if (!data.username) { logger.warn("(func: newGame)", 'No username provided'); callback(false); return; }

		var gameID = createGame();
		socket.gameID = gameID;
		socket.join(gameID);

		var result = addPlayer( gameID, socket.id, data.username )
		if (result === "samename") { callback(false, false, "samename"); return; }

		callback(gameID, socket.id)
		socket.emit("switchPanel", "lobbyPanel");
	})

	socket.on('joinGame', function(data, callback){
		var gameID = data.gameID;
		var gameObj = table_game.findOne({"gameID": gameID});
		if (!gameID)   { logger.warn("(func: joinGame)", 'No gameID provided');   callback(false); return; }
		if (!data.username) { logger.warn("(func: joinGame)", 'No username provided'); callback(false); return; }
		if (!gameObj||!Object.keys(gameObj).length)       { logger.warn("(func: joinGame)", 'Game not found');       callback(false); return; }

		var result = addPlayer(gameID, socket.id, data.username)
		if (result === "samename") { callback(false, "samename"); return; }
		socket.gameID = gameID;

		callback(socket.id)
		socket.emit("switchPanel", "lobbyPanel");
		socket.join(gameID);
		io.to(gameID).emit("setPlayers", listPlayers(gameID));
	})

	socket.on('readyToStart', function(data, callback){
		if (!socket.gameID) { logger.warn("(func: readyToStart)", 'No gameID found');   callback(false, 'No gameID provided'); return; }

		setPlayerReadyToStart(socket.gameID, socket.id);

		callback(true)
	})



	socket.on('startGame', function(data){
		logger_game.info("starting game ", socket.gameID)
	})



	socket.on('saveFile', function(data){
		var gameID = socket.gameID;
		if (!data.fileData){  logger.warn("(func: saveFile)", "no file data.");  return; }
		if (!data.gameRound){ logger.warn("(func: saveFile)", "no game round."); return; }
		if (!gameID){         logger.warn("(func: saveFile)", "no gameID.");     return; }

		var imageUUID = uuidv1().replace(/-/g, '');
		var gamePath = '/games/' + gameID + '/';
		var imagePath = gamePath + imageUUID + ".png";
		saveFile(data.fileData, __dirname  + imagePath,(err, data) => {
			if (err) logger.error("saveFile - error", err);
		})
		if (!games[gameID]){ logger.warn("(func: saveFile)", "game not found."); return;}


		games[gameID].setRoundResult(socket.id, data.gameRound, imagePath, __dirname + gamePath);
	})




	socket.on('enterGuess', function(data){
		var gameID = socket.gameID;
		if (!gameID){         logger.warn("(func: enterGuess)", "no gameID.");     return; }
		if (!data.text){      logger.warn("(func: enterGuess)", "no guess.");      return; }
		if (!data.gameRound){ logger.warn("(func: enterGuess)", "no game round."); return; }

		var gamePath = '/games/' + gameID + '/';
		games[gameID].setRoundResult(socket.id, data.gameRound, data.text, __dirname + gamePath);
	})



	socket.on('getNewPrompt', function(data, callback){
		var gameID = socket.gameID;
		if (!gameID){      logger.warn("(func: getNewPrompt)", "no gameID."); return;}
		if (!data.prompt){ logger.warn("(func: getNewPrompt)", "no prompt."); return;}

		fs.appendFile('removePromptList.txt', "\n" + data.prompt, function (err) {
			if (err) throw err;
			logger.info('Adding "' + data.prompt + '" to the remove list');
		});

		callback(games[gameID].getNewPrompt(socket.id));
	})
});
console.log('ready')

var createGame = function() {
	var gameUUID = uuidv1().replace(/-/g, '');
	var gameID = gameUUID.substring(0, 4).toUpperCase();

	table_game.insert({
		"gameID": gameID,
		"started": 0
	})

	logger_game.info( 'game created: ' + gameID );
	return gameID;
}

var addPlayer = function(gameID, socketID, userName) {
	if (!gameID   || !gameID.length)   { logger.warn("(func: addPlayer)", "no game id");   return false; }
	if (!socketID || !socketID.length) { logger.warn("(func: addPlayer)", "no socket id"); return false; }
	if (!userName || !userName.length) { logger.warn("(func: addPlayer)", "no username");  return false; }

	var nameCheck = table_player.findOne({"username": userName, "gameID": gameID })
	if (nameCheck && Object.keys(nameCheck).length) { return "samename"; }

	var game = table_game.findOne({"gameID": gameID})
	if (!game || !Object.keys(game).length) { logger.warn("(func: addPlayer)", "no game in db");   return false; }

	table_player.insert({
		"gameID"      : gameID,
		"username"    : userName,
		"socketID"    : socketID,
		"readyToStart": false,
		"gameFinished": false,
		"connected"   : true
	})
	logger_player.info("player (", userName, ") added to game ", gameID)
	return true
}

var setPlayerDisconnected = function(socketID){
	var player = table_player.findOne({"socketID": socketID})
	if (!player||!Object.keys(player).length) { logger.warn("(func: setPlayerDisconnected)", "Player not found with socket id", socketID); return false; }

	player.connected = false
	table_player.update(player)

	return true;
}

var setPlayerReadyToStart = function(gameID, socketID) {
	var player = table_player.findOne({"socketID": socketID})
	if (!player||!Object.keys(player).length) { logger.warn("(func: setPlayerDisconnected)", "Player not found with socket id", socketID); return false; }

	player.readyToStart = true
	table_player.update(player)

	return true;

}

var listPlayers = function(gameID) {
	logger.info("listingPlayers")
	var result = [];

	var playerList = table_player.find({"gameID": gameID, "connected": true})
	if (!playerList) { logger.warn("(func: listPlayers)", "playerList undefined" , playerList); return false; }

	for (player in playerList) {
		result.push({
			"socketID": playerList[player].socketID,
			"username": playerList[player].username
		})
	}

	return result;
}

var gameStarted = function(gameID) {
	var result = '';

	var gameObj = table_game.find({"gameID": gameID})
	if (!gameObj||!Object.keys(gameObj).length) { logger.warn("(func: gameStarted)", "Game not found" , gameObj); return false; }

	logger.debug("(func: gameStarted) game status", gameObj.started)

	return gameObj.started;
}

var startGame = function() {

}