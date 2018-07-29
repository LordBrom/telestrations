var express    = require('express');
var app        = express();
var server     = require('http').Server(app);
var io         = require('socket.io')(server);

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

    socket.on('newGame', function(){
    	var gameUUID = uuidv1().replace(/-/g, '');
    	var gameID = gameUUID.substring(0, 4)
    	var newGame = new Telestration(gameID);

    	games[gameID] = newGame
        console.log(newGame.getGameID() + ' :game started');
    })

    socket.on('joinGame', function(data){

    })

    socket.on('disconnect', function(data){
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



