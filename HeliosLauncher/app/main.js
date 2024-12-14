const { app, BrowserWindow, ipcMain, autoUpdater } = require('electron')
const path = require('path')
const url = require('url')
const isDev = require('./assets/js/isdev')
const { LoggerUtil } = require('helios-core')

const logger = LoggerUtil.getLogger('Main')

// 업데이트 서버 URL 설정
const updateServer = 'https://github.com/Kevin-Studio-Dev/SpearfishForest4-Launcher-Monorepo'
const feed = `${updateServer}/releases/latest/download/SpearfishForest4-mac.dmg`

// 자동 업데이트 설정
function setupAutoUpdater(win) {
    if(isDev) {
        return
    }

    // 자동 업데이트 URL 설정
    autoUpdater.setFeedURL({
        url: feed,
        serverType: 'json'
    })

    // 업데이트 이벤트 리스너
    autoUpdater.on('checking-for-update', () => {
        win.webContents.send('autoUpdateNotification', 'checking-for-update')
    })

    autoUpdater.on('update-available', (info) => {
        win.webContents.send('autoUpdateNotification', 'update-available', info)
    })

    autoUpdater.on('update-not-available', () => {
        win.webContents.send('autoUpdateNotification', 'update-not-available')
    })

    autoUpdater.on('error', (err) => {
        win.webContents.send('autoUpdateNotification', 'realerror', {
            error: err,
            code: err.code
        })
    })

    // IPC 이벤트 리스너
    ipcMain.on('autoUpdateAction', (event, arg, data) => {
        switch(arg) {
            case 'checkForUpdate':
                autoUpdater.checkForUpdates()
                    .catch(err => {
                        win.webContents.send('autoUpdateNotification', 'realerror', {
                            error: err,
                            code: err.code
                        })
                    })
                break
            case 'allowPrereleaseChange':
                autoUpdater.allowPrerelease = data
                autoUpdater.checkForUpdates()
                    .catch(err => {
                        win.webContents.send('autoUpdateNotification', 'realerror', {
                            error: err,
                            code: err.code
                        })
                    })
                break
        }
    })

    // 초기 업데이트 확인
    win.webContents.once('did-finish-load', () => {
        win.webContents.send('autoUpdateNotification', 'ready')
    })
}

function createWindow() {
    // 브라우저 창 생성
    const win = new BrowserWindow({
        width: 980,
        height: 552,
        icon: getPlatformIcon('SealCircle'),
        frame: false,
        backgroundColor: '#171614',
        show: false,
        resizable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'app.ejs'),
        protocol: 'file:',
        slashes: true
    }))

    win.once('ready-to-show', () => {
        win.show()
    })

    // 자동 업데이트 설정
    setupAutoUpdater(win)

    // ... 나머지 코드는 그대로 유지
}

app.on('ready', () => {
    const win = createWindow()
    createMenu()
    
    // 앱 시작 시 자동 업데이트 설정
    if (!isDev) {
        setupAutoUpdater(win)
        // 30분마다 업데이트 확인
        setInterval(() => {
            autoUpdater.checkForUpdates()
        }, 1800000)
    }
})

// ... 나머지 코드는 그대로 유지