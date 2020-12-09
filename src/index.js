const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// SET ENV
process.env.NODE_ENV = 'production';
// process.env.NODE_ENV = 'development';

const createWindow = () => {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 700,
		webPreferences: {
			enableRemoteModule: true,
			contextIsolation: false,
			nodeIntegration: true
		}
	});

	mainWindow.loadFile(path.join(__dirname, 'index.html'));
	// developer tools to show
	// mainWindow.webContents.openDevTools();
};

app.on('ready', function() {
	createWindow();
	// Build menu from template
	const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
	// Insert menu
	Menu.setApplicationMenu(mainMenu);
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});


// Top Menus
const mainMenuTemplate =  [
	// Each object is a dropdown
	{
		label: 'File',
		submenu:[
			{
				label: 'Quit',
				accelerator:process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
				click(){
					app.quit();
				}
			}
		]
	}
];

// If OSX, add empty object to menu
if(process.platform == 'darwin'){
	mainMenuTemplate.unshift({});
}

// Add developer tools option if in dev
if(process.env.NODE_ENV !== 'production'){
	mainMenuTemplate.push({
		label: 'Developer Tools',
		submenu:[
			{
				role: 'reload'
			},
			{
				label: 'Toggle DevTools',
				accelerator:process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
				click(item, focusedWindow){
					focusedWindow.toggleDevTools();
				}
			}
		]
	});
}