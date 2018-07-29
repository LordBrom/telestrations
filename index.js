var express = require('express');
var app = express();
var server = require('http').Server(app);
// Loading socket.io
var io = require('socket.io')(server);

var path    = require('path');

app.use("/styles",  express.static(path.join(__dirname, 'styles')));
app.use("/scripts",  express.static(path.join(__dirname, 'scripts')));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket) {
    console.log('A user has connected');

    socket.on('disconnect', function(data){
        console.log(socket.un + ' has disconnected');
    })
});
console.log('test')