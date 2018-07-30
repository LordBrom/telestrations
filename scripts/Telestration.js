
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
			num = Math.floor(Math.random() * this.initialGamePrompts.length);
			usablePrompt = this.promptsIDsUsed[num]
		}

		this.promptsIDsUsed[num] = true;
		return num
	}

	addPlayer(newUser) {
		newUser.round = 1;
		newUser.isFinished = 0;

    	this.players.push(newUser)
	}

	createJSONFile(fs) {

	}

	exportPlayers() {
		 return this.players
	}

	removePlayer(i_socketID) {
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].socketID == i_socketID) {
				this.players.splice(i, 1);
				return true
			}
		}
		return false;
	}

	startGame() {

		for (var i = 0; i < this.players.length; i++) {
			if (this.socketIO.sockets.connected[this.players[i].socketID]) {
				var firstPrompt = this.initialGamePrompts[this.pickInitialPrompt()]
				var newGameSheet = new GameSheet(this.id, this.players, i, firstPrompt);
				this.gameSheets.push(newGameSheet)


	    		this.socketIO.sockets.connected[this.players[i].socketID].emit('setInputDrawPrompt', firstPrompt)
	    		this.socketIO.sockets.connected[this.players[i].socketID].emit('switchPanel', 'inputDraw')
			}
    	}

    	this.mkdirp(this.gamesDir + this.id, function(err) {
		    if (err) {
		        console.log(err);
		    }
		});

	}

	getNextRound(socketID, gameRound) {
		for (var i = 0; i < this.gameSheets.length; i++) {
			if (this.gameSheets[i].rounds[gameRound].socketID == socketID) {
				return {
					type: this.gameSheets[i].rounds[gameRound].type,
					promptText: this.gameSheets[i].rounds[gameRound - 1].text
				}
			}
		}
		return false;
	}


	setRoundResult(socketID, gameRound, resultText) {
		for (var i = 0; i < this.gameSheets.length; i++) {
			if (this.gameSheets[i].rounds[gameRound].socketID == socketID) {
				this.gameSheets[i].rounds[gameRound].text = resultText;

				if (gameRound + 1 == this.gameSheets[i].rounds.length )
				{
					this.gameSheets[i].isFinished = true;
					if (this.isGameFinished()) {
						// handle all final panel
						this.sendResults()
					} else {
						this.socketIO.sockets.connected[socketID].emit("switchPanel", "waitPanel");
						console.log("game over")
					}
				} else {
					var newRound = {type: this.gameSheets[i].rounds[gameRound + 1].type, promptText: this.gameSheets[i].rounds[gameRound].text}
					this.socketIO.sockets.connected[this.gameSheets[i].rounds[gameRound + 1].socketID].emit("setRound", newRound)
				}

				return true;
			}
		}
		return false;
	}


	sendResults() {
		for (var i = 0; i < this.gameSheets.length; i++) {
			this.socketIO.sockets.connected[this.gameSheets[i].rounds[0].socketID].emit("setResult", this.gameSheets[i].rounds)
			this.socketIO.sockets.connected[this.gameSheets[i].rounds[0].socketID].emit("switchPanel", "finalPanel")
		}
	}

	isGameFinished() {
		for (var i = 0; i < this.gameSheets.length; i++) {
			if (!this.gameSheets[i].isFinished) {
				return false;
			}
		}
		return true;
	}
}
