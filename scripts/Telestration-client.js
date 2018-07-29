var submitDrawing = function() {
	if (drawPad.isEmpty()) {
		alert("No drawing detected.");
	} else {
		var dataURL = drawPad.toDataURL();
		var blob = dataURLToBlob(dataURL);
		socket.emit('saveFile', blob)
	}
}
var submitText = function() {
	if (gameApp.textInput == '') {
		alert("No text entered.");
	} else {
		socket.emit('enterGuess', gameApp.textInput)
	}
}

var hostGame = function() {
	if (gameApp.username == '') {
		alert('Enter a username.')
		return;
	}
	socket.emit('newGame', { "username" : gameApp.username }, function(gameID, socketID){
		if (!gameID){
			alert('Unable to create game.')
			return
		}
		gameApp.gameID = gameID;
		gameApp.players.push({socketID: socketID, username: gameApp.username })
	})
}
var joinGame = function() {
	if (gameApp.username == '') {
		alert('Enter a username.')
		return;
	}
	if (gameApp.gameID == '') {
		alert('Enter a gameID.')
		return;
	}
	socket.emit('joinGame', {"gameID" : gameApp.gameID, "username" : gameApp.username }, function(socketID){
		if (!socketID){
			alert('Unable to join game.')
			return
		}
		gameApp.players.push({socketID: socketID, username: gameApp.username })
	})
}
var startGame = function() {
	socket.emit("startGame");
}