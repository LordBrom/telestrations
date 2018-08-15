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

const PromptList     = require('./../PromptList.js');
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

server.listen(3000);

io.sockets.on('connection', function (socket) {
	logger.info('A user has connected');

	socket.on('disconnect', function(data){
		logger.info('A user has disconnected');
		logger_player.info(socket.un + ' has disconnected');
		setPlayerDisconnected(socket.id)

		var gameID = socket.gameID;
		if (!gameID)        { logger.warn("no game id");    return; }
		if (!games[gameID]) { logger.warn("no game found"); return; }

		if (games[gameID].status == "lobby") {
			games[gameID].removePlayer(socket.id)
			io.to(gameID).emit("setPlayers", games[gameID].exportPlayers());
		}
	})

	socket.on('newGame', function(data, callback){
		if (!data.username) { logger.warn('No username provided'); callback(false); return; }

		var gameID = createGame();
		socket.gameID = gameID;
		socket.join(gameID);

		var result = addPlayer( gameID, socket.id, data.username )
		if (result === "samename") { callback(false, false, "samename") }

		callback(gameID, socket.id)
		socket.emit("switchPanel", "lobbyPanel");
	})

	socket.on('joinGame', function(data, callback){
		var gameObj = table_game.findOne({"gameID": data.gameID});
		if (!data.gameID)   { logger.warn('No gameID provided');   callback(false); return; }
		if (!data.username) { logger.warn('No username provided'); callback(false); return; }
		if (!gameObj)       { logger.warn('Game not found');       callback(false); return; }

		var result = addPlayer(data.username, data.gameID, socket.id)
		if (result === "samename") { callback(false, "samename") }
		socket.gameID = data.gameID;

		callback(socket.id)
		socket.emit("switchPanel", "lobbyPanel");
		socket.join(data.gameID);
		io.to(data.gameID).emit("setPlayers", games[data.gameID].exportPlayers());
	})

	socket.on('readyToStart', function(data, callback){
		var gameObj = table_game.findOne({"gameID": data.gameID});
		if (!data.gameID)   { logger.warn('No gameID provided');   callback(false, msg); return; }
		if (!data.username) { logger.warn('No username provided'); callback(false, msg); return; }
		if (!gameObj)       { logger.warn('Game not found');       callback(false, msg); return; }
	})



	socket.on('startGame', function(data){
		logger_game.info("starting game ", socket.gameID)


		// games[socket.gameID].status = 'playing'

		// games[socket.gameID].socketIO = io
		// games[socket.gameID].fs = fs
		// games[socket.gameID].mkdirp = mkdirp
		// games[socket.gameID].gamesDir = __dirname  + '/games/'

		// games[socket.gameID].startGame();

	})



	socket.on('saveFile', function(data){
		var gameID = socket.gameID;
		if (!data.fileData){  logger.warn("no file data.");  return; }
		if (!data.gameRound){ logger.warn("no game round."); return; }
		if (!gameID){         logger.warn("no gameID.");     return; }

		var imageUUID = uuidv1().replace(/-/g, '');
		var gamePath = '/games/' + gameID + '/';
		var imagePath = gamePath + imageUUID + ".png";
		saveFile(data.fileData, __dirname  + imagePath,(err, data) => {
			if (err) logger.error("saveFile - error", err);
		})
		if (!games[gameID]){ logger.warn("game not found."); return;}


		games[gameID].setRoundResult(socket.id, data.gameRound, imagePath, __dirname + gamePath);
	})




	socket.on('enterGuess', function(data){
		var gameID = socket.gameID;
		if (!gameID){         logger.warn("no gameID.");     return; }
		if (!data.text){      logger.warn("no guess.");      return; }
		if (!data.gameRound){ logger.warn("no game round."); return; }

		var gamePath = '/games/' + gameID + '/';
		games[gameID].setRoundResult(socket.id, data.gameRound, data.text, __dirname + gamePath);
	})



	socket.on('getNewPrompt', function(data, callback){
		var gameID = socket.gameID;
		if (!gameID){      logger.warn("no gameID."); return;}
		if (!data.prompt){ logger.warn("no prompt."); return;}

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
	if (!userName || !userName.length) { logger.warn("no username");  return false; }
	if (!gameID   || !gameID.length)   { logger.warn("no game id");   return false; }
	if (!socketID || !socketID.length) { logger.warn("no socket id"); return false; }

	var nameCheck = table_player.findOne({"username": userName})
	if (nameCheck) { return "samename"; }
	var game = table_game.findOne({"gameID": gameID})
	if (!game || !game.length)   { logger.warn("no game in db");   return false; }

	table_player.insert({
		"gameID"      : gameID,
		"username"    : userName,
		"socketID"    : socketID,
		"readyToStart": false,
		"gameFinished": false,
		"connected"   : true
	})

	return true
}

var setPlayerDisconnected = function(socketID){
	var player = table_player.findOne({"socketID": socketID})
	if (!player) { logger.warn("Player not found with socket id", socketID); return false; }

	player.connected = false
	table_player.update(player)

	return true;
}

var setPlayerReadyToStart = function(gameID, socketID) {
	var player = table_player.findOne({"socketID": socketID})
	if (!player) { logger.warn("Player not found with socket id", socketID); return false; }

	player.readyToStart = true
	table_player.update(player)



	return true;

}

var startGame = function() {

}