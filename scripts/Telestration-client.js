var submitDrawing = function() {
	if (drawPad.isEmpty()) {
		alert("No drawing detected.");
	} else {
		var dataURL = drawPad.toDataURL();
		var blob = dataURLToBlob(dataURL);
		socket.emit('saveFile', {fileData: blob, gameRound: gameApp.gameRound})
	}
	gameApp.gameRound++;
	setNewRound();
}
var submitText = function() {
	if (gameApp.textInput == '') {
		alert("No text entered.");
	} else {

		socket.emit('enterGuess', { "text": gameApp.textInput, "gameRound": gameApp.gameRound })
	}
	gameApp.textInput = '';
	gameApp.gameRound++;
	setNewRound();
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

var setNewRound = function() {
	if (!gameApp.nextRounds.length) {
		gameApp.showPanel = "waitPanel";
		gameApp.waitingForPrompt = 1;
		return;
	}
	gameApp.waitingForPrompt = 0;
	var nextRound = gameApp.nextRounds[0];

	if (nextRound.type == "draw") {
		gameApp.drawPadPrompt = nextRound.promptText
		gameApp.showPanel = "inputDraw";
		setTimeout(function(){
			console.log('timedout')
			gameApp.initCanvas()
		}, 10)

	} else if (nextRound.type == "text") {
		gameApp.drawPadPrompt = ""
		gameApp.imagePrompt = nextRound.promptText
		gameApp.showPanel = "inputText";

	}
	gameApp.nextRounds.shift();

}

var resetGame = function() {
	gameApp.username         = '';
	gameApp.showPanel        = 'homePanel';
	gameApp.drawPadPrompt    = 'test prompt.';
	gameApp.imagePrompt      = '';
	gameApp.textInput        = '';
	gameApp.gameID           = '';
	gameApp.players          = [];
	gameApp.gameRound        = 1;
	gameApp.nextRounds       = [];
	gameApp.waitingForPrompt = 0;
	gameApp.finalSheet       = [];
}