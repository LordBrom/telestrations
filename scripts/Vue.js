var gameApp = new Vue({
	el: '#gameWindow',
	data: {
		username: '',
		showPanel: 'homePanel',
		drawPadPrompt: 'test prompt.',
		textInput: '',
		gameID: '',
		players: []
	},
	methods: {
		submitDrawing: submitDrawing,
		submitText:    submitText,
		hostGame:      hostGame,
		joinGame:      joinGame,
		startGame:     startGame
	}
});