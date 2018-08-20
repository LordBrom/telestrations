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
		finalSheet: [],
		isReady: 0
	},
	methods: {
		submitDrawing: submitDrawing,
		submitText:    submitText,
		hostGame:      hostGame,
		joinGame:      joinGame,
		startGame:     startGame,
		getNewPrompt:  getNewPrompt,
		initCanvas:    initCanvas,
		resetGame:     resetGame,
		playerReady:   playerReady
	}
});