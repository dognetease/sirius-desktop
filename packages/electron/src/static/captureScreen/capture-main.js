/* eslint-disable */
// @ts-nocheck

const { BrowserWindow, ipcMain, globalShortcut } = require('electron');
const os = require('os');
const path = require('path');

let captureWins = [];

const captureScreen = (e, args) => {
  if (captureWins.length) {
    return;
  }
  const { screen } = require('electron');

  let displays = screen.getAllDisplays();
  captureWins = displays.map(display => {
    let captureWin = new BrowserWindow({
      // window 使用 fullscreen,  mac 设置为 undefined, 不可为 false
      fullscreen: os.platform() === 'win32' || undefined,
      width: display.bounds.width,
      height: display.bounds.height,
      x: display.bounds.x,
      y: display.bounds.y,
      transparent: true,
      frame: false,
      // skipTaskbar: true,
      // autoHideMenuBar: true,
      movable: false,
      resizable: false,
      enableLargerThanScreen: true,
      hasShadow: false,
    });
    captureWin.setAlwaysOnTop(true, 'screen-saver');
    captureWin.setVisibleOnAllWorkspaces(true);
    captureWin.setFullScreenable(false);

    captureWin.loadFile(path.join(__dirname, 'capture.html'));

    let { x, y } = screen.getCursorScreenPoint();
    if (x >= display.bounds.x && x <= display.bounds.x + display.bounds.width && y >= display.bounds.y && y <= display.bounds.y + display.bounds.height) {
      captureWin.focus();
    } else {
      captureWin.blur();
    }
    // 调试用
    // captureWin.openDevTools()

    captureWin.on('closed', () => {
      let index = captureWins.indexOf(captureWin);
      if (index !== -1) {
        captureWins.splice(index, 1);
      }
      captureWins.forEach(win => win.close());
    });
    return captureWin;
  });
};

const useCapture = () => {
  globalShortcut.register('Esc', () => {
    if (captureWins) {
      captureWins.forEach(win => win.close());
      captureWins = [];
    }
  });

  globalShortcut.register('CmdOrCtrl+Shift+A', captureScreen);

  ipcMain.on('capture-screen', (e, { type = 'start', screenId } = {}) => {
    if (type === 'start') {
      captureScreen();
    } else if (type === 'complete') {
      // nothing
    } else if (type === 'select') {
      captureWins.forEach(win => win.webContents.send('capture-screen', { type: 'select', screenId }));
    }
  });
};

exports.useCapture = useCapture;
exports.captureSceen = captureScreen;
// ! 鼠标移动选中不同的应用以截图
// 在 Electron 中，可以通过以下步骤获取鼠标所在的应用程序窗口：

// 获取鼠标坐标：可以使用 Electron 提供的 globalShortcut 模块监听鼠标移动事件，并获取当前鼠标在屏幕上的位置。

// 获取所有窗口：可以使用 Electron 提供的 BrowserWindow 模块的 getAllWindows() 方法获取当前所有打开的窗口。

// 判断窗口包含鼠标：可以遍历所有窗口，使用窗口对象提供的 bounds 属性获取窗口的位置和大小信息，并使用 Electron 提供的 screen 模块的 getDisplayMatching() 方法判断窗口是否包含了当前鼠标所在的位置。

// 显示窗口信息：如果当前鼠标所在的窗口被找到，则可以在选框周围显示该窗口的位置和大小信息。

// 以下是一个示例代码片段，演示了如何通过鼠标位置获取所在窗口的位置和大小：

// ```javascript
// const { globalShortcut, screen, BrowserWindow } = require('electron')

// // 监听鼠标移动事件
// globalShortcut.register('CommandOrControl+Alt+Shift+M', () => {
// // 获取当前鼠标在屏幕上的位置
// const { x, y } = screen.getCursorScreenPoint()

// // 获取所有窗口
// const windows = BrowserWindow.getAllWindows()

// // 查找包含鼠标位置的窗口
// const window = windows.find(win => {
// const { x: winX, y: winY, width, height } = win.getBounds()
// const display = screen.getDisplayMatching({ x: winX, y: winY, width, height })
// return display && display.bounds.contains({ x, y })
// })

// // 如果找到了窗口，则显示位置和大小信息
// if (window) {
// const { x: winX, y: winY, width, height } = window.getBounds()
// console.log(Window found: x=${winX}, y=${winY}, width=${width}, height=${height})
// }
