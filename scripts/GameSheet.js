module.exports = class Telestration  {

	constructor(gameID, players, startingPlayerIndex, prompt) {
		this.gameID = gameID
		this.rounds = []

		this.initRoundsObject(players, startingPlayerIndex, prompt)
	}

	initRoundsObject(players, startingPlayerIndex, prompt) {
		var newSegment = { socketID: players[startingPlayerIndex].socketID, type: "text", src: "", text: prompt }
		this.rounds.push(newSegment)

		for (var i = 0; i < players.length; i++) {
			var type = (i % 2 == 1 ? "text" : "draw")
			var calcIndex = (startingPlayerIndex + i) % players.length
			newSegment = { socketID: players[calcIndex].socketID, type: type, text: "" }
			this.rounds.push(newSegment)
		}
	}
}