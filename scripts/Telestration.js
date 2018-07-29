module.exports = class Telestration  {

	constructor(i_id) {
	    this.id = i_id;
	    this.players = [];
	    this.status = 'lobby';

		this.initialGamePrompts = ['This is prompt one.','This is prompt two.','This is prompt three.','This is prompt four.','This is prompt five.','This is prompt six.'];
		this.promptsIDsUsed = [];
	}

	getGameID() {
		return this.id;
	}

	pickInitialPrompt() {
		var num = Math.floor(Math.random() * this.initialGamePrompts.length);
		console.log('"randomNum":', num)
		return num
	}

	addPlayer(newUser) {
		var promptID = this.pickInitialPrompt()
		var usablePrompt = this.promptsIDsUsed[promptID]

		while (usablePrompt){
			promptID = this.pickInitialPrompt()
			usablePrompt = this.promptsIDsUsed[promptID]
		}

		this.promptsIDsUsed[promptID] = true;

		newUser.prompt = this.initialGamePrompts[promptID]

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
				console.log("removing player ", this.players[i])
				this.players.splice(i, 1);
				return true
			}
		}
		return false;
	}
}