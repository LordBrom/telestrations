module.exports = class Telestration  {

	constructor(i_id) {
	    this.id = i_id;
	    this.players = [];
	    this.status = 'lobby';

		this.initialGamePrompts = ['This is prompt one.','This is prompt two.','This is prompt three.','This is prompt four.','This is prompt five.','This is prompt six.'];
	}

	getGameID() {
		return this.id;
	}

	pickInitialPrompt() {
		this.initialGamePrompts[Math.floor(Math.random() * this.initialGamePrompts.length)];
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
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].socketID == i_socketID) {
				this.players.splice(i, 1);
				return true
			}
		}
		return false;
	}
}