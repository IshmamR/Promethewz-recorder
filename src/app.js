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

// capture buttons
const openCapture = document.querySelector('#openCapture'); // opens canvas
const saveCapture = document.querySelector('#saveCapture'); // saves capture
const closeCapture = document.querySelector('#closeCapture'); // closes canvas
const captureDiv = document.querySelector('#captured');
const canvas = document.querySelector('#canvas');
const canvasF = document.querySelector('#toDownload');

cameraButton.onclick = useCamera;
stopScreen.onclick = removeVideoSource;
videoSelectButton.onclick = getVideoSources;

// Get the available video sources
async function getVideoSources() {
	removeVideoSource(); // sets video elements source to default
	const inputSources = await desktopCapturer.getSources({
		types: ['window', 'screen']
	});
	// console.log(inputSources);
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
let recordedChunks = [];

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
				// minWidth: 1280,
				// maxWidth: 4000,
				// minHeight: 720,
				// maxHeight: 4000
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
	setTimeout(function(){
		cameraButton.scrollIntoView();
	}, 100);
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
	recordedChunks = [];
	// stop camera
	// a video's MediaStream object is available through its srcObject attribute
	const mediaStream = videoElement.srcObject;
	// through the MediaStream, get the MediaStreamTracks with getTracks():
	const tracks = mediaStream?.getTracks();
	tracks?.forEach(track => track.stop());
	videoElement.srcObject = null;
}

// use device camera
function useCamera() {
	removeVideoSource(); // sets video elements source to default
	recordedChunks = [];
	// console.log('using device camera');
	// get access to the camera
	if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		// Not adding `{ audio: true }` since we only want video now
		const mediaObj = { audio: true, video: true }
		navigator.mediaDevices.getUserMedia(mediaObj)
		.then(function(stream) {
			videoElement.srcObject = stream;
			videoElement.play();
			videoElement.muted = true;

			// create recorder
			const options = { mimeType: 'video/webm; codecs=vp9' };
			mediaRecorder = new MediaRecorder(stream, options);
			//register event handlers
			mediaRecorder.ondataavailable = handleDataAvailable;
			mediaRecorder.onstop = handleStop;
		});
	}
}

// canvas capture functions
function captureCanvas() {
	const dmnsns = videoElement.getBoundingClientRect();
	// console.log(dmnsns);
	const context = canvas.getContext('2d');
	canvas.width = dmnsns.width / 2;
	canvas.height = dmnsns.height / 2;
	context.drawImage(videoElement, 0, 0, dmnsns.width / 2, dmnsns.height / 2);
}
function saveCanvas() {
	const dmnsnsF = videoElement.getBoundingClientRect();
	const contextF = canvasF.getContext('2d');
	canvasF.width = dmnsnsF.width * 2;
	canvasF.height = dmnsnsF.height * 2;
	contextF.drawImage(videoElement, 0, 0, dmnsnsF.width * 2, dmnsnsF.height * 2);
}


videoElement.addEventListener("resize", ev => {
  let w = videoElement.videoWidth;
  let h = videoElement.videoHeight;

  if (w && h) {
	videoElement.style.width = w;
	videoElement.style.height = h;
  }
}, false);


// click events
const loader = document.querySelector('#loader');
startButton.onclick = (e) => {
	if (videoElement.srcObject !== null) {
		mediaRecorder.start();
		startButton.classList.add('light-green');
		startButton.classList.add('accent-3');
		startButton.innerText = 'Recording...';
		loader.style.display = 'flex';
	} else { alert('Choose a video source first'); }
}
stopButton.onclick = (e) => {
	// console.log(mediaRecorder);
	if (mediaRecorder !== undefined) {
		mediaRecorder.stop();
		startButton.classList.remove('light-green');
		startButton.classList.remove('accent-3');
		startButton.innerText = 'Start';
		loader.style.display = 'none';
	} else { alert('Start recording first'); }
}

// capture events
openCapture.onclick = (e) => {
	if(videoElement.srcObject !== null) {
		captureDiv.style.display = 'flex';
		captureCanvas();
		saveCanvas();
		setTimeout(function(){
			captureDiv.scrollIntoView();
		}, 100);
	} else { alert('Choose a video source first'); }
}
closeCapture.onclick = (e) => {
	captureDiv.style.display = 'none';
}
saveCapture.onclick = (e) => {
	const imageData = canvasF.toDataURL();
	const newData = imageData.replace("image/png", "image/octet-stream");
	// console.log(newData);
	const a = document.createElement('a');
	a.href = newData;
	a.download = 'capture.png';
	a.click();
	a.remove();
}