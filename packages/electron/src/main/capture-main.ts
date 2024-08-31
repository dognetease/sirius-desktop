/* eslint-disable */
// @ts-nocheck

import { BrowserWindow, ipcMain, globalShortcut, screen } from 'electron';
import os from 'os';
import path from 'path';
import { windowManage } from './windowManage';
import { isMac } from './config';
import { fsManage } from './fsManage';
import { storeManage } from './storeManage';

const isLowMemoryMode = storeManage.getIsLowMemoryMode();

let captureWins: BrowserWindow[] = [];
let targetWin = null;
const closeCapture = () => {
  const isReg = globalShortcut.isRegistered('esc');
  if (isReg) {
    globalShortcut.unregister('esc');
  }
  if (targetWin) {
    targetWin.show();
  }
  captureWins.forEach(win => {
    win.webContents.send('close-screen-sources-reset');
    if (isLowMemoryMode) {
      win.close();
    } else {
      win.hide();
    }
  });
  if (isLowMemoryMode) {
    captureWins = [];
  }
};
export const captureScreen = async (payload = {}) => {
  console.log('capturescreenlog start>>>>>>>', captureWins.length, payload);
  let from = '';
  let fromWinId = '';
  fsManage.writeLog('captureScreen', { type: '截图进入electron执行' }).then();
  globalShortcut.register('esc', closeCapture);
  try {
    from = payload.from;
    fromWinId = payload.winId || '';
    const targetWin = BrowserWindow.getAllWindows().find(win => {
      return win.id === fromWinId;
    });
    if (payload.hideCur === '1') {
      if (isMac && targetWin?.isFullScreen()) {
        targetWin.webContents.send('capture-screen-message', { type: 'error', text: '全屏模式不支持隐藏当前窗口截图' });
        return;
      }
      targetWin.hide();
      fsManage.writeLog('captureScreen', { type: '执行隐藏应用' }).then();
      await new Promise(resolve => {
        setTimeout(() => {
          // 不分MAC机器上，没有hide完成就开始截图，导致截图的时候还是显示的
          resolve();
        }, 200);
      });
    }
    console.log('capturescreenlog start>>>>>>>hideCur', payload.hideCur, payload.hideCur === '1');
  } catch (error) {
    console.log('capturescreenlog start>>>>>>> error', error);
    fsManage.writeLog('captureScreen', { type: '执行隐藏应用error', error }).then();
  }
  const allWinInfo = await windowManage.getAllWinInfo();
  const captureWinReal = allWinInfo.filter(win => win.type === 'capture');
  // 低内存模式下会将窗口关闭但是captureWins没有变化，所以需要captureWinReal去判断一下
  if (captureWinReal.length !== captureWins.length) {
    captureWins = [];
  }
  if (captureWins.length && typeof captureWins[0].show === 'function') {
    fsManage.writeLog('captureScreen', { type: '截图调出captureWins' }).then();
    try {
      captureWins.forEach(win => {
        win.setOpacity(0);
        win.newCreateWin = false;
        win.from = from;
        win.fromWinId = fromWinId;
        win.setAlwaysOnTop(true, 'screen-saver');
        win.setVisibleOnAllWorkspaces(true);
        win.setFullScreenable(false);
        console.log('capturescreenlog start>>>>>>>againfrom', win.from, fromWinId);
        const { x, y } = screen.getCursorScreenPoint();
        if (x >= win.getBounds().x && x <= win.getBounds().x + win.getBounds().width && y >= win.getBounds().y && y <= win.getBounds().y + win.getBounds().height) {
          win.focus();
        } else {
          win.blur();
        }
        win.webContents.send('get-screen-sources');
      });
    } catch (error) {
      fsManage.writeLog('captureScreen', { type: '截图调出captureWins error', error }).then();
    }
    return;
  }
  const displays = screen.getAllDisplays();
  try {
    captureWins = await Promise.all(
      displays.map(async display => {
        const captureWinCreate = await windowManage.createWindow({
          type: 'capture',
          parent: -1,
          bounds: {
            width: display.bounds.width,
            height: display.bounds.height,
            x: display.bounds.x,
            y: display.bounds.y,
          },
          transparent: true,
        });
        const captureWin = BrowserWindow.fromId(captureWinCreate.winId);
        captureWin.setAlwaysOnTop(true, 'screen-saver');
        captureWin.setVisibleOnAllWorkspaces(true);
        captureWin.setFullScreenable(false);
        captureWin.from = from;
        captureWin.newCreateWin = true;
        captureWin.fromWinId = fromWinId;
        console.log('capturescreenlog start>>>>>>>from', captureWin.from);
        const { x, y } = screen.getCursorScreenPoint();
        if (x >= display.bounds.x && x <= display.bounds.x + display.bounds.width && y >= display.bounds.y && y <= display.bounds.y + display.bounds.height) {
          captureWin.focus();
        } else {
          captureWin.blur();
        }
        captureWin.webContents.send('get-screen-sources');
        return captureWin;
      })
    );
    console.log('captureWinaaaaaaa 66', captureWins);
  } catch (error) {
    console.log('capturescreenlog error>>>>>>>', error);
  }
};

export const useCapture = () => {
  ipcMain.on('capture-screen', (e, { type = 'start', screenId, url } = {}) => {
    const captureWin = BrowserWindow.fromWebContents(e.sender);
    const from = captureWin.from;
    const fromWinId = captureWin.fromWinId;
    targetWin = BrowserWindow.getAllWindows().find(win => {
      console.log('fromWinId--------', win.id, fromWinId);
      return win.id === fromWinId;
    });
    if (type === 'start') {
      captureScreen();
    } else if (type === 'complete') {
      if (targetWin) {
        targetWin.show();
        targetWin.webContents.send('get-capture-screen-data', { from, url });
      }
      if (!fromWinId) {
        // 'capture-screen-succ'
        BrowserWindow.getAllWindows().forEach(win => {
          win.webContents.send('capture-screen-message', { type: 'succ', text: '已复制到剪切板' });
        });
      }
    } else if (type === 'select') {
      captureWins.forEach(win => win.webContents.send('capture-screen', { type: 'select', screenId }));
    } else if (type === 'close') {
      closeCapture();
    }
  });

  const initWin = async () => {
    console.log('capturescreenlog initWin start');
    try {
      const displays = screen.getAllDisplays();
      captureWins = await Promise.all(
        displays.map(async display => {
          const captureWinCreate = await windowManage.createWindow({
            type: 'capture',
            parent: -1,
            bounds: {
              width: display.bounds.width,
              height: display.bounds.height,
              x: display.bounds.x,
              y: display.bounds.y,
            },
            transparent: true,
          });
          const captureWin = BrowserWindow.fromId(captureWinCreate?.winId);
          captureWin.hide();
          return captureWin;
        })
      );
      console.log('capturescreenlog initWin 77', captureWins);
    } catch (error) {
      console.log('capturescreenlog initWin error', error);
    }
  };
  if (!isLowMemoryMode) {
    initWin();
  }
};

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
