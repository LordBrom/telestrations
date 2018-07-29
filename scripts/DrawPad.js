var drawPad = false;
var drawPadCanvas = false;

function initCanvas() {

	var drawPadDiv = document.getElementById("drawPad");
	drawPadCanvas = drawPadDiv.querySelector("canvas");
	drawPad = new SignaturePad(drawPadCanvas, {
		backgroundColor: 'rgb(255, 255, 255)'
	});

	resizeCanvas()
}

function resizeCanvas() {
	if (!drawPadCanvas || !drawPad)
	{
		return;
	}

	var ratio =  Math.max(window.devicePixelRatio || 1, 1);

	console.log(ratio)

	drawPadCanvas.width = drawPadCanvas.offsetWidth * ratio;
	drawPadCanvas.height = drawPadCanvas.offsetHeight * ratio;
	drawPadCanvas.getContext("2d").scale(ratio, ratio);

	drawPad.clear();
}

window.onresize = resizeCanvas;
resizeCanvas();

function dataURLToBlob(dataURL) {
	// Code taken from https://github.com/ebidel/filer.js
	var parts = dataURL.split(';base64,');
	var contentType = parts[0].split(":")[1];
	var raw = window.atob(parts[1]);
	var rawLength = raw.length;
	var uInt8Array = new Uint8Array(rawLength);

	for (var i = 0; i < rawLength; ++i) {
		uInt8Array[i] = raw.charCodeAt(i);
	}

	return new Blob([uInt8Array], { type: contentType });
}


