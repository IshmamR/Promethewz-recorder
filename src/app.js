// modules
const { desktopCapturer, remote } = require('electron');
const { dialog, Menu } = remote;
const fs = require('fs');

// video element and buttons
const videoElement = document.querySelector('video');
const startButton = document.querySelector('#strtBtn');
const stopButton = document.querySelector('#stopBtn');
const stopScreen = document.querySelector('#stopScrn');
const cameraButton = document.querySelector('#cameraBtn');
const videoSelectButton = document.querySelector('#vidSlctBtn');

cameraButton.onclick = useCamera;
stopScreen.onclick = removeVideoSource;
videoSelectButton.onclick = getVideoSources;

// Get the available video sources
async function getVideoSources() {
	const inputSources = await desktopCapturer.getSources({
		types: ['window', 'screen']
	});
	const videoOptionsMenu = Menu.buildFromTemplate(
		inputSources.map(source => {
			return {
				label: source.name,
				click: () => selectSource(source)
			};
		})
	);

	videoOptionsMenu.popup();
}

let mediaRecorder; // media recorder instance
const recordedChunks = [];

// change the videoSource window to reocrd
async function selectSource(source) {
	videoSelectButton.innerText = source.name;

	const constraints = {
		audio: {
			mandatory: {
				chromeMediaSource: 'desktop'
			},
			optional: []
		},
		video: {
			mandatory: {
				chromeMediaSource: 'desktop',
				chromeMediaSourceId: source.id
			},
			optional: []
		}
	};

	// create a stream
	const stream = await navigator.mediaDevices.getUserMedia(constraints);

	// preview sources in HTML video element
	videoElement.srcObject = stream;
	videoElement.play();
	videoElement.muted = true; // audio-fix (used to get mixed with window's audio)

	// create recorder
	const options = { mimeType: 'video/webm; codecs=vp9' };
	mediaRecorder = new MediaRecorder(stream, options);

	//register event handlers
	mediaRecorder.ondataavailable = handleDataAvailable;
	mediaRecorder.onstop = handleStop;
}

// Captures all recorded chunks
function handleDataAvailable(e) {
	// console.log(`video data(${e.data}) available`);
	recordedChunks.push(e.data);
}

// Saves the video file on stop
async function handleStop(e) {
	const blob = new Blob(recordedChunks, {
		type: 'video/webm; codecs=vp9'
	});

	const buffer = Buffer.from(await blob.arrayBuffer());

	const { filePath } = await dialog.showSaveDialog({
		buttonLabel: 'Save video',
		defaultPath: `vid-${Date.now()}.webm`
	});

	if (filePath) {
		fs.writeFile(filePath, buffer, () => alert('video saved successfully!'));
	}

}


// clear video element
function removeVideoSource() {
	videoElement.srcObject = null;
}

// use device camera
function useCamera() {
	videoElement.srcObject = null;
	console.log('this function uses device camera');
}


// click events
startButton.onclick = (e) => {
	mediaRecorder.start();
	startButton.classList.add('light-green');
	startButton.classList.add('accent-3');
	startButton.innerText = 'Recording...';
};
stopButton.onclick = (e) => {
	mediaRecorder.stop();
	startButton.classList.remove('light-green');
	startButton.classList.remove('accent-3');
	startButton.innerText = 'Start';
};
