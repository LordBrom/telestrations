var gameApp = new Vue({
	el: '#gameWindow',
	data: {
		username: '',
		showPanel: 'homePanel',
		drawPadPrompt: 'test prompt.',
		imagePrompt: '',
		textInput: '',
		gameID: '',
		players: [],
		gameRound: 1,
		nextRounds: [],
		waitingForPrompt: 0,
		finalSheet: []
	},
	methods: {
		submitDrawing: submitDrawing,
		submitText:    submitText,
		hostGame:      hostGame,
		joinGame:      joinGame,
		startGame:     startGame,
		initCanvas:    initCanvas,
		resetGame:     resetGame
	}
});