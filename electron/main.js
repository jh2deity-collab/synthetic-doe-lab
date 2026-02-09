const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Register custom protocol for local resources
function registerCustomProtocol() {
    protocol.registerFileProtocol('app', (request, callback) => {
        const url = request.url.replace('app://', '');
        // Path should be relative to the 'out' directory
        const filePath = path.join(__dirname, '../out', url);
        callback({ path: filePath });
    });
}

let mainWindow;
let backendProcess;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Synthetic DOE Lab",
        icon: path.join(__dirname, '../public/favicon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // In production, load the static HTML file using our custom protocol to handle absolute paths
    if (app.isPackaged) {
        mainWindow.loadURL('app://index.html');
    } else {
        mainWindow.loadURL('http://localhost:3000');
    }

    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startBackend() {
    let backendExecutable;

    if (app.isPackaged) {
        // Path to the bundled main.exe (created by PyInstaller)
        backendExecutable = path.join(process.resourcesPath, 'backend', 'main.exe');
    } else {
        // In development, use python to run the backend
        backendExecutable = 'python';
    }

    const args = app.isPackaged ? [] : [path.join(__dirname, '../backend_entry.py')];

    console.log(`Starting backend: ${backendExecutable} ${args.join(' ')}`);

    const spawnOptions = {
        cwd: app.isPackaged ? path.join(process.resourcesPath, 'backend') : path.join(__dirname, '..'),
        shell: false,
        env: { ...process.env }
    };

    backendProcess = spawn(backendExecutable, args, spawnOptions);

    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });
}

app.whenReady().then(() => {
    if (app.isPackaged) {
        registerCustomProtocol();
    }
    startBackend();
    createMainWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (backendProcess) {
            // Kill the backend process when all windows are closed on Windows/Linux
            const { exec } = require('child_process');
            if (process.platform === 'win32') {
                exec(`taskkill /pid ${backendProcess.pid} /T /F`);
            } else {
                backendProcess.kill();
            }
        }
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
    }
});
