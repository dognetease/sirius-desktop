import { BrowserWindow } from 'electron';
import { app } from 'electron';
import { EventEmitter } from 'events';
import { storeManage } from './storeManage';
const OPEN_FILE_CHANNEL = 'open-file-channel';
import { windowManage } from './windowManage';

function getIsSupportedFilePath(filePath: string) {
  if (!filePath) return false;
  return filePath.endsWith('.eml');
}

class FileAssociation extends EventEmitter {
  openFilePaths: Array<string> = [];
  sendFilePaths: Array<string> = [];

  static OPEN_FILE_CHANGE_EVENT = 'OPEN_FILE_EVENT';

  constructor() {
    super();
    this.init();
  }

  addOpenFilePath(filePath: string | string[]) {
    if (!filePath) return;
    if (typeof filePath === 'string') {
      this.openFilePaths.push(filePath);
      this.emit(FileAssociation.OPEN_FILE_CHANGE_EVENT, filePath);
    } else if (Array.isArray(filePath)) {
      const filePaths = filePath;
      this.sendFilePaths = filePaths;
      this.emit(FileAssociation.OPEN_FILE_CHANGE_EVENT, this.sendFilePaths);
    }
  }

  addOpenFileHandler(listener: (...args: any[]) => void) {
    this.on(FileAssociation.OPEN_FILE_CHANGE_EVENT, listener);
  }

  removeOpenFileHandler(listener: (...args: any[]) => void) {
    this.off(FileAssociation.OPEN_FILE_CHANGE_EVENT, listener);
  }

  getOpenFilePaths() {
    return this.openFilePaths;
  }

  getSendFilePaths() {
    return this.sendFilePaths;
  }

  resetOpenFilePaths() {
    this.openFilePaths = [];
  }

  resetSendFilePaths() {
    this.sendFilePaths = [];
  }

  removeOpenFilePath(filePath: string) {
    this.openFilePaths = this.openFilePaths.filter(path => {
      return path !== filePath;
    });
  }

  private init() {
    if (process.platform === 'darwin') {
      app.on('open-file', (ev, path) => {
        if (getIsSupportedFilePath(path)) {
          ev.preventDefault();
          this.addOpenFilePath(path);
        }
        let mainWin = windowManage.getMainWinInfo();
        if (mainWin) {
          windowManage.show(mainWin.id);
        }
      });
    } else if (process.platform === 'win32') {
      let supportFilePath = this.getSupportedFilePathFromArgv(process.argv);
      if (supportFilePath) {
        this.addOpenFilePath(supportFilePath);
      }
    }
  }

  getSupportedFilePathFromArgv(argv: string[]): string | string[] {
    if (!argv || argv.length <= 1) return '';
    if (argv.includes('--send-as-attachment')) {
      const attachmentsPaths = argv.slice(1).filter(argStr => {
        const isStartWithLine = argStr.indexOf('--') === 0;
        if (isStartWithLine) {
          return false;
        }
        return true;
      });
      return attachmentsPaths;
    }
    let filePath = argv[argv.length - 1];
    if (getIsSupportedFilePath(filePath)) {
      return filePath;
    }
    return '';
  }

  sendOpenFilePathsToWindow(win: BrowserWindow) {
    const noOpenFilePaths = !this.openFilePaths || !this.openFilePaths.length;
    const noSendFilePaths = !this.sendFilePaths || !this.sendFilePaths.length;
    if (noOpenFilePaths && noSendFilePaths) return;
    let webContent = win.webContents;
    let winUrl = webContent.getURL();
    // login页面不发送openFilePaths到页面，只存储到store即可
    if (winUrl.includes('/login')) {
      if (!noOpenFilePaths) {
        let filePaths = storeManage.get('memory', 'emlFilePaths') || [];
        filePaths.push(...this.openFilePaths);
        storeManage.set('memory', 'emlFilePaths', filePaths);
      }
      if (!noSendFilePaths) {
        storeManage.set('memory', 'sendFilePaths', this.sendFilePaths);
      }
    } else {
      if (!noOpenFilePaths) {
        win.webContents.send(OPEN_FILE_CHANNEL, {
          type: 'open',
          paths: this.openFilePaths,
        });
      }
      if (!noSendFilePaths) {
        win.webContents.send(OPEN_FILE_CHANNEL, {
          type: 'send',
          paths: this.sendFilePaths,
        });
      }
    }
    this.openFilePaths = [];
    this.sendFilePaths = [];
  }
}

let fileAssociation = new FileAssociation();

export default fileAssociation;
