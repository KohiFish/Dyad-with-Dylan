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
    let browser;
    let page;
    try {
        browser = await puppeteer.launch({
            headless: true, // no Chrome window
            ignoreHTTPSErrors: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(districtUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        const userSelector = '#LogOnDetails_UserName, #LogOnModel_UserName, #LogOnModel_Username, #Username, input[name="Username"], input[type="email"]';
        const passSelector = '#LogOnDetails_Password, #LogOnModel_Password, #Password, input[name="Password"], input[type="password"]';
        const submitSelector = 'button[type="submit"], input[type="submit"], button.btn-primary';

        await page.waitForSelector(userSelector, { timeout: 30000 });
        await page.type(userSelector, username);
        await page.type(passSelector, password);

        await Promise.all([
            page.click(submitSelector),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
        ]);

        // Try the Classwork page, where the grades live
        const assignmentsUrl = new URL('/HomeAccess/Content/Student/Assignments.aspx', districtUrl).href;
        await page.goto(assignmentsUrl, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});

        const gradesData = await page.evaluate(() => {
            const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
            const results = [];

            document.querySelectorAll('.AssignmentClass').forEach((el) => {
                const nameEl = el.querySelector('.sg-header a.sg-header-heading') ||
                               el.querySelector('.sg-header-heading');
                const avgEl = el.querySelector('[id*="lblOverallAverage"]');
                const className = clean(nameEl && nameEl.innerText);
                if (className) {
                    results.push({ className, average: clean(avgEl && avgEl.innerText) });
                }
            });

            // Fallback to the original generic selectors
            if (results.length === 0) {
                document.querySelectorAll('.sg-main-content .sg-header-heading, .class-header').forEach((el) => {
                    const className = clean(el.innerText);
                    if (className) results.push({ className, average: '' });
                });
            }
            return results;
        });

        await browser.close();
        return { success: true, data: gradesData };
    } catch (error) {
        console.error('Scraping failed:', error);
        if (page) {
            await page.screenshot({ path: 'debug-error.png', fullPage: true }).catch(() => {});
        }
        if (browser) {
            await browser.close().catch(() => {});
        }
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