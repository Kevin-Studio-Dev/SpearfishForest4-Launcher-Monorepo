const remoteMain = require('@electron/remote/main')
remoteMain.initialize()

// Requirements
const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron')
const autoUpdater                       = require('electron-updater').autoUpdater
const ejse                              = require('ejs-electron')
const fs                                = require('fs')
const isDev                             = require('./app/assets/js/isdev')
const path                              = require('path')
const semver                            = require('semver')
const { pathToFileURL }                 = require('url')
const { AZURE_CLIENT_ID, MSFT_OPCODE, MSFT_REPLY_TYPE, MSFT_ERROR, SHELL_OPCODE } = require('./app/assets/js/ipcconstants')
const LangLoader                        = require('./app/assets/js/langloader')
const log                               = require('electron-log')

// Setup Lang
LangLoader.setupLanguage()

// 자동 업데이트 관련 코드
let updateDownloaded = false;
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'

// 자동 업데이트 설정
function initAutoUpdater() {
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    
    // macOS 특정 설정
    if (process.platform === 'darwin') {
        autoUpdater.autoDownload = false // macOS에서는 수동 다운로드로 설정
    }
    
    // 현재 버전이 사전 릴리즈인지 확인
    const preRelComp = semver.prerelease(app.getVersion())
    if(preRelComp != null && preRelComp.length > 0){
        autoUpdater.allowPrerelease = true
        autoUpdater.channel = 'prerelease'
    } else {
        autoUpdater.channel = 'latest'
    }
    autoUpdater.allowVersionDowngrade = false
    
    autoUpdater.on('error', (err) => {
        log.error('AutoUpdater 오류:', err)
        if (win) {
            win.webContents.send('autoUpdateNotification', 'error', err)
        }
    })

    autoUpdater.on('update-not-available', () => {
        log.info('업데이트 없음')
        if (win) {
            win.webContents.send('autoUpdateNotification', 'noUpdate')
        }
    })

    autoUpdater.on('update-available', (info) => {
        log.info('업데이트 가능:', info)
        if (process.platform === 'darwin') {
            dialog.showMessageBox({
                type: 'info',
                title: '업데이트 가능',
                message: `새로운 버전 ${info.version}이(가) 있습니다. 지금 다운로드하시겠습니까?`,
                buttons: ['다운로드', '나중에'],
                defaultId: 0
            }).then(({ response }) => {
                if (response === 0) {
                    autoUpdater.downloadUpdate()
                }
            })
        } else {
            win.webContents.send('autoUpdateNotification', 'update-available', info)
        }
    })

    autoUpdater.on('download-progress', (progressObj) => {
        win.webContents.send('updateDownloadProgress', progressObj)
    })

    autoUpdater.on('update-downloaded', (info) => {
        log.info('업데이트 다운로드 완료:', info)
        dialog.showMessageBox({
            type: 'info',
            title: '업데이트 설치',
            message: '업데이트 다운로드가 완료되었습니다.\n프로그램이 3초 후 자동으로 재시작됩니다.',
            buttons: ['확인'],
            defaultId: 0
        }).then(() => {
            setTimeout(() => {
                autoUpdater.quitAndInstall(true, true)
            }, 3000)
        })
    })

    // 즉시 업데이트 확인 시작
    autoUpdater.checkForUpdates()
}

// Open channel to listen for update actions.
ipcMain.on('autoUpdateAction', (event, arg, data) => {
    switch(arg){
        case 'initAutoUpdater':
            console.log('Initializing auto updater.')
            initAutoUpdater()
            event.sender.send('autoUpdateNotification', 'ready')
            break
        case 'checkForUpdate':
            autoUpdater.checkForUpdates()
                .catch(err => {
                    event.sender.send('autoUpdateNotification', 'realerror', err)
                })
            break
        case 'allowPrereleaseChange':
            if(!data){
                const preRelComp = semver.prerelease(app.getVersion())
                if(preRelComp != null && preRelComp.length > 0){
                    autoUpdater.allowPrerelease = true
                } else {
                    autoUpdater.allowPrerelease = data
                }
            } else {
                autoUpdater.allowPrerelease = data
            }
            break
        case 'installUpdateNow':
            autoUpdater.downloadUpdate()
            break
        default:
            console.log('Unknown argument', arg)
            break
    }
})

// Redirect distribution index event from preloader to renderer.
ipcMain.on('distributionIndexDone', (event, res) => {
    event.sender.send('distributionIndexDone', res)
})

// Handle trash item.
ipcMain.handle(SHELL_OPCODE.TRASH_ITEM, async (event, ...args) => {
    try {
        await shell.trashItem(args[0])
        return {
            result: true
        }
    } catch(error) {
        return {
            result: false,
            error: error
        }
    }
})

// Disable hardware acceleration.
// https://electronjs.org/docs/tutorial/offscreen-rendering
app.disableHardwareAcceleration()


const REDIRECT_URI_PREFIX = 'https://login.microsoftonline.com/common/oauth2/nativeclient?'

// Microsoft Auth Login
let msftAuthWindow
let msftAuthSuccess
let msftAuthViewSuccess
let msftAuthViewOnClose
ipcMain.on(MSFT_OPCODE.OPEN_LOGIN, (ipcEvent, ...arguments_) => {
    if (msftAuthWindow) {
        ipcEvent.reply(MSFT_OPCODE.REPLY_LOGIN, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.ALREADY_OPEN, msftAuthViewOnClose)
        return
    }
    msftAuthSuccess = false
    msftAuthViewSuccess = arguments_[0]
    msftAuthViewOnClose = arguments_[1]
    msftAuthWindow = new BrowserWindow({
        title: LangLoader.queryJS('index.microsoftLoginTitle'),
        backgroundColor: '#222222',
        width: 520,
        height: 600,
        frame: true,
        icon: getPlatformIcon('SealCircle')
    })

    msftAuthWindow.on('closed', () => {
        msftAuthWindow = undefined
    })

    msftAuthWindow.on('close', () => {
        if(!msftAuthSuccess) {
            ipcEvent.reply(MSFT_OPCODE.REPLY_LOGIN, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.NOT_FINISHED, msftAuthViewOnClose)
        }
    })

    msftAuthWindow.webContents.on('did-navigate', (_, uri) => {
        if (uri.startsWith(REDIRECT_URI_PREFIX)) {
            let queries = uri.substring(REDIRECT_URI_PREFIX.length).split('#', 1).toString().split('&')
            let queryMap = {}

            queries.forEach(query => {
                const [name, value] = query.split('=')
                queryMap[name] = decodeURI(value)
            })

            ipcEvent.reply(MSFT_OPCODE.REPLY_LOGIN, MSFT_REPLY_TYPE.SUCCESS, queryMap, msftAuthViewSuccess)

            msftAuthSuccess = true
            msftAuthWindow.close()
            msftAuthWindow = null
        }
    })

    msftAuthWindow.removeMenu()
    msftAuthWindow.loadURL(`https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?prompt=select_account&client_id=${AZURE_CLIENT_ID}&response_type=code&scope=XboxLive.signin%20offline_access&redirect_uri=https://login.microsoftonline.com/common/oauth2/nativeclient`)
})

// Microsoft Auth Logout
let msftLogoutWindow
let msftLogoutSuccess
let msftLogoutSuccessSent
ipcMain.on(MSFT_OPCODE.OPEN_LOGOUT, (ipcEvent, uuid, isLastAccount) => {
    if (msftLogoutWindow) {
        ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.ALREADY_OPEN)
        return
    }

    msftLogoutSuccess = false
    msftLogoutSuccessSent = false
    msftLogoutWindow = new BrowserWindow({
        title: LangLoader.queryJS('index.microsoftLogoutTitle'),
        backgroundColor: '#222222',
        width: 520,
        height: 600,
        frame: true,
        icon: getPlatformIcon('SealCircle')
    })

    msftLogoutWindow.on('closed', () => {
        msftLogoutWindow = undefined
    })

    msftLogoutWindow.on('close', () => {
        if(!msftLogoutSuccess) {
            ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.NOT_FINISHED)
        } else if(!msftLogoutSuccessSent) {
            msftLogoutSuccessSent = true
            ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.SUCCESS, uuid, isLastAccount)
        }
    })
    
    msftLogoutWindow.webContents.on('did-navigate', (_, uri) => {
        if(uri.startsWith('https://login.microsoftonline.com/common/oauth2/v2.0/logoutsession')) {
            msftLogoutSuccess = true
            setTimeout(() => {
                if(!msftLogoutSuccessSent) {
                    msftLogoutSuccessSent = true
                    ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.SUCCESS, uuid, isLastAccount)
                }

                if(msftLogoutWindow) {
                    msftLogoutWindow.close()
                    msftLogoutWindow = null
                }
            }, 5000)
        }
    })
    
    msftLogoutWindow.removeMenu()
    msftLogoutWindow.loadURL('https://login.microsoftonline.com/common/oauth2/v2.0/logout')
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow() {

    win = new BrowserWindow({
        width: 980,
        height: 552,
        icon: getPlatformIcon('SealCircle'),
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'app', 'assets', 'js', 'preloader.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
        backgroundColor: '#171614'
    })
    remoteMain.enable(win.webContents)

    const data = {
        bkid: Math.floor((Math.random() * fs.readdirSync(path.join(__dirname, 'app', 'assets', 'images', 'backgrounds')).length)) || 0,
        lang: (str, placeHolders) => {
            try {
                return LangLoader.queryEJS(str, placeHolders) || ''
            } catch (err) {
                console.error('Language loading error:', err)
                return ''
            }
        }
    }
    Object.entries(data).forEach(([key, val]) => {
        try {
            ejse.data(key, val)
        } catch (err) {
            console.error('EJS data setting error:', err)
        }
    })

    win.loadURL(pathToFileURL(path.join(__dirname, 'app', 'app.ejs')).toString())

    /*win.once('ready-to-show', () => {
        win.show()
    })*/

    win.removeMenu()

    win.resizable = true

    win.on('closed', () => {
        win = null
    })

    win.once('ready-to-show', () => {
        win.show()
        // 개발 모드가 아닐 때만 자동 업데이트 실행
        if (!isDev) {
            initAutoUpdater()
        }
    })
}

function createMenu() {
    
    if(process.platform === 'darwin') {

        // Extend default included application menu to continue support for quit keyboard shortcut
        let applicationSubMenu = {
            label: 'Application',
            submenu: [{
                label: 'About Application',
                selector: 'orderFrontStandardAboutPanel:'
            }, {
                type: 'separator'
            }, {
                label: 'Quit',
                accelerator: 'Command+Q',
                click: () => {
                    app.quit()
                }
            }]
        }

        // New edit menu adds support for text-editing keyboard shortcuts
        let editSubMenu = {
            label: 'Edit',
            submenu: [{
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                selector: 'undo:'
            }, {
                label: 'Redo',
                accelerator: 'Shift+CmdOrCtrl+Z',
                selector: 'redo:'
            }, {
                type: 'separator'
            }, {
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                selector: 'cut:'
            }, {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                selector: 'copy:'
            }, {
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                selector: 'paste:'
            }, {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                selector: 'selectAll:'
            }]
        }

        // Bundle submenus into a single template and build a menu object with it
        let menuTemplate = [applicationSubMenu, editSubMenu]
        let menuObject = Menu.buildFromTemplate(menuTemplate)

        // Assign it to the application
        Menu.setApplicationMenu(menuObject)

    }

}

function getPlatformIcon(filename){
    let ext
    switch(process.platform) {
        case 'win32':
            ext = 'ico'
            break
        case 'darwin':
        case 'linux':
        default:
            ext = 'png'
            break
    }

    return path.join(__dirname, 'app', 'assets', 'images', `${filename}.${ext}`)
}

app.on('ready', createWindow)
app.on('ready', createMenu)

app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

// 업데이트 수락 시 처리
ipcMain.on('installUpdate', () => {
    dialog.showMessageBox({
        type: 'info',
        title: '업데이트 확인',
        message: '업데이트를 확인하고 있습니다...',
        buttons: ['확인'],
        defaultId: 0
    })
})

// 앱 재시작
ipcMain.on('restartApp', () => {
    autoUpdater.quitAndInstall(true, true)
})

let updateCheckInProgress = false;

async function checkForUpdatesWithDebounce() {
    if (updateCheckInProgress) {
        return;
    }
    
    updateCheckInProgress = true;
    try {
        await autoUpdater.checkForUpdates();
    } catch (err) {
        log.error('AutoUpdater 오류:', err);
        if (win) {
            win.webContents.send('autoUpdateNotification', 'error', err);
        }
    } finally {
        updateCheckInProgress = false;
    }
}

app.on('ready', () => {
    // 개발 모드가 아닐 때만 업데이트 체크 실행
    if (!isDev) {
        // 초기 업데이트 체크
        setTimeout(() => {
            checkForUpdatesWithDebounce();
        }, 5000); // 앱 시작 5초 후 체크
        
        // 1시간마다 업데이트 체크
        setInterval(() => {
            checkForUpdatesWithDebounce();
        }, 3600000);
    }
})

// 설정 메뉴에서 업데이트 확인
ipcMain.on('checkForUpdates', () => {
    checkForUpdatesWithDebounce();
})

autoUpdater.on('error', (err) => {
    log.error('AutoUpdater 오류:', err)
    if (win) {
        win.webContents.send('autoUpdateNotification', 'error', err)
    }
})

autoUpdater.on('update-not-available', () => {
    log.info('업데이트 없음')
})