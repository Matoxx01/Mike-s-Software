const { app, BrowserWindow, Menu } = require('electron');

let mainWindow;

const path = require('path');

app.whenReady().then(() => {
    // Eliminar el menú por completo
    Menu.setApplicationMenu(null);

    mainWindow = new BrowserWindow({
        width: 905,
        height: 680,
        icon: path.join(__dirname, 'assets/icons/logo.png'),
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.loadFile('index.html');

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            mainWindow = new BrowserWindow({
                width: 905,
                height: 680,
                icon: path.join(__dirname, 'assets/icons/logo.png'),
                webPreferences: {
                    nodeIntegration: true
                }
            });

            mainWindow.loadFile('index.html');
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
