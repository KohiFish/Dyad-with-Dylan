const {
    app,
    BrowserWindow,
    globalShortcut,
    Menu,
    Tray,
    nativeImage,
    ipcMain
} = require('electron');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const { isCryptoKey } = require('util/types');

let mainWindow;
let tray;
let isQuitting = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 550,
        show: false,
        frame: false,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration:true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
    mainWindow.on('closed', () => {
        console.log('Window was closed');
        mainWindow = null;
    });
}
ipcMain.handle('scrape-grades', async (event, { districtUrl, username, password }) => {
    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(districtUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector('#LogOnModel_Username');
        await page.type('#LogOnModel_Username', username);
        await page.type('#LogOnModel_Password', password);
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);
        const gradesData = await page.evaluate(() => {
            const parsedClasses = [];
            const classes = document.querySelectorAll('.sg-main-content .sg-header-heading');
            classes.forEach((el) => {
                parsedClasses.push({ className: el.innerText.trim() });
            });
            return parsedClasses;
        });
        await browser.close();
        return { success: true, data: gradesData };
    } catch (error) {
        console.error(error);
        return { success: false, error: error.message }; 
    }
});
function createTray() {
    const icon = nativeImage.createFromPath(
        path.join(__dirname, '3.0 Icon.png')
    );
    tray = new Tray(icon);
    tray.setToolTip('Grade Menu');
    tray.setContextMenu(Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]));
}

app.whenReady().then(() => { 
    createWindow();
    createTray();

    if (process.platform === 'darwin') {
        app.dock.hide();
    }

    const hotkey = 'CommandOrControl+Alt+1';
    const ret = globalShortcut.register(hotkey, () => {
        if (!mainWindow || mainWindow.isDestroyed()) {
            createWindow();
        }

        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });
    if (!ret) {
        console.log('Registration failed for global shortcut');
        console.log('Please return to the main menu');
    }
});

app.on('before-quit', (event) => {
    if (!isQuitting) {
        event.preventDefault();
        return;
    }

    console.log('Electron is quitting');
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', (event) => {
    event.preventDefault();
});