module.exports = class Telestration  {

	this.initialGamePrompts = ['This is prompt one.','This is prompt two.','This is prompt three.','This is prompt four.','This is prompt five.','This is prompt six.',];

	constructor(i_id) {
	    this.id = i_id;
	    this.players = [];
	}

	getGameID() {
		return this.id;
	}

	pickInitialPrompt() {
		this.initialGamePrompts[Math.floor(Math.random() * this.initialGamePrompts.length)];
	}
}