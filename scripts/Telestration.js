
const GameSheet   = require('./GameSheet.js');
const PromptList   = require('./../PromptList.js');

module.exports = class Telestration  {

	constructor(i_id) {
	    this.id = i_id;
	    this.players = [];
	    this.status = 'lobby';
	    this.round = 0;
	    this.socketIO = false;
	    this.fs = false;
	    this.mkdirp = false;
	    this.gamesDir = false;

		this.initialGamePrompts = PromptList;
		this.promptsIDsUsed = [];

		this.gameSheets = [];
	}

	getGameID() {
		return this.id;
	}

	pickInitialPrompt() {
		var num = Math.floor(Math.random() * this.initialGamePrompts.length);
		var usablePrompt = this.promptsIDsUsed[num]

		while (usablePrompt){
			console.log("rand", num)
			num = Math.floor(Math.random() * this.initialGamePrompts.length);
			usablePrompt = this.promptsIDsUsed[num]
		}

		this.promptsIDsUsed[num] = true;
		return num
	}

	addPlayer(newUser) {

    	this.players.push(newUser)
	}

	createJSONFile(fs) {

	}

	exportPlayers() {
		 return this.players
	}

	removePlayer(i_socketID) {
		console.log("looking for ID ", i_socketID)
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].socketID == i_socketID) {
				this.players.splice(i, 1);
				return true
			}
		}
		return false;
	}

	startGame() {
		var gameJsonOBJ = {playerCount : this.players.length, sheets : []}

		for (var i = 0; i < this.players.length; i++) {
			if (this.socketIO.sockets.connected[this.players[i].socketID]) {
				var firstPrompt = this.initialGamePrompts[this.pickInitialPrompt()]
				var newGameSheet = new GameSheet(this.id, this.players, i, firstPrompt);
				this.gameSheets.push(newGameSheet)
				gameJsonOBJ.sheets.push(newGameSheet.rounds)
	    		this.socketIO.sockets.connected[this.players[i].socketID].emit('setInputDrawPrompt', firstPrompt)
	    		this.socketIO.sockets.connected[this.players[i].socketID].emit('switchPanel', 'inputDraw')

			}
    	}

  //   	var gameJsonSTR = JSON.stringify(gameJsonOBJ);
  //   	this.mkdirp(this.gamesDir + this.id, function(err) {
		//     if (err) {
		//         console.log(err);
		//     }
		// });

  //   	this.fs.writeFile( this.gamesDir + this.id + "/game.json", gameJsonSTR, function(err) {
		//     if (err) {
		//         console.log(err);
		//     }
		// })

	}


	// 	for (var i = 0; i < this.players.length; i++) {
	// 		if (this.socketIO.sockets.connected[this.players[i].socketID]) {
	// 			gameJsonOBJ.sheets[this.players[i].socketID] = []
	// 			gameJsonOBJ.sheets[this.players[i].socketID][0] = this.players[i].prompt
	//     		this.socketIO.sockets.connected[this.players[i].socketID].emit('setInputDrawPrompt', this.players[i].prompt)
	//     		this.socketIO.sockets.connected[this.players[i].socketID].emit('switchPanel', 'inputDraw')
	// 		}
 	//    	}

 	startRound(round) {

 	}



}
