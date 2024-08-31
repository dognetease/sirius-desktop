import { app, protocol, crashReporter } from 'electron';
import nodePath from 'path';
import { profile, stage } from 'envDef';
import { windowManage } from './windowManage';
import { appManage } from './appManage';
import { fsManage } from './fsManage';
import { storeManage } from './storeManage';
import fileAssociation from './file-association';
import utils from './utils';
// import path from 'path';
// import installExtension, { REDUX_DEVTOOLS,REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
if (stage !== 'prod') {
  app.commandLine.appendSwitch('ignore-certificate-errors');
}

const isEdm = profile && profile.startsWith('edm');

if (stage === 'prod') {
  crashReporter.start({
    submitURL: isEdm
      ? 'http://sentry2.lx.netease.com/api/18/minidump/?sentry_key=6c78e28ce2e4483b847ebb872d491677'
      : 'http://sentry2.lx.netease.com/api/20/minidump/?sentry_key=001356e95a9945d49baef7623dcfb01c',
    uploadToServer: true,
    rateLimit: false,
    compress: false,
  });
}

app.commandLine.appendSwitch('ignore-connections-limit', 'lingxi.office.163.com');
app.commandLine.appendSwitch('disable-site-isolation-trials');
const systemProxyType = storeManage.getSystemProxyType();
const useInProcessGPU = storeManage.getIsUseINProcessGPU();

if (useInProcessGPU) {
  app.commandLine.appendSwitch('in-process-gpu');
}
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'sirius',
    privileges: {
      secure: true,
      standard: true,
      bypassCSP: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
    },
  },
  {
    scheme: 'apiCall',
    privileges: {
      secure: true,
      standard: true,
      bypassCSP: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
  {
    scheme: 'cache',
    privileges: {
      secure: true,
      standard: true,
      bypassCSP: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);
// 用来判断是否只开一个应用
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // app.quit();
  app.exit();
} else {
  app.on('second-instance', (ev, argv) => {
    console.log('second-instance');
    // windowManage.show();
    const supportFilePath = fileAssociation.getSupportedFilePathFromArgv(argv);
    if (supportFilePath) {
      fileAssociation.addOpenFilePath(supportFilePath);
    }
    const mainWinId = windowManage.getMainWinInfo()?.id;
    windowManage.show(mainWinId);
    ev.preventDefault();
  });
}

const isLowMemoryMode = storeManage.getIsLowMemoryMode();
if (isLowMemoryMode || systemProxyType) {
  app.userAgentFallback = app.userAgentFallback + `${isLowMemoryMode ? ' lx-low-memory-mode' : ''}${systemProxyType ? ` ${systemProxyType}` : ''}`;
}

app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    try {
      const appId = utils.profileToAppIdMap[profile as 'test1' | 'prod'] || process.execPath;
      app.setAppUserModelId(appId);
    } catch (ex) {
      console.error('setAppUserModelId ex');
    }
  }
  // if (config('performanceTrace')) {
  //   contentTracing.startRecording({
  //     included_categories: [
  //       '*',
  //     ],
  //     excluded_categories: [],
  //   });
  //   setTimeout(async () => {
  //     const data = await contentTracing.stopRecording(`${__dirname}/trace.json`);
  //     console.log('----tracing ', data);
  //   }, 15000);
  // }
  // if(!app.isPackaged){
  //   installExtension([REDUX_DEVTOOLS,REACT_DEVELOPER_TOOLS]).then(name=>console.log(`${name}插件安装成功`)).catch(err=>console.log('插件安装失败'));
  // }
  // app.setPath('userData',path.join(app.getPath('home'),'.sirius-desktop'));
  appManage.init();

  // edm 加载whatsapp插件
  if (isEdm) {
    const extensionPath = nodePath.normalize(nodePath.join(process.resourcesPath, '/extraResources/chrome-wa-extension'));
    // 本地起electron走下边路径
    // const extensionPath = nodePath.normalize(nodePath.join(process.cwd(), '/extraResources/chrome-wa-extension'));
    fsManage.writeLog('__extension', extensionPath);
    appManage
      .getSession()
      .loadExtension(extensionPath, { allowFileAccess: true })
      .then(({ id }) => {
        console.log('__extension', '!!! -- load chrome extension success-- !!!' + id);
        fsManage.writeLog('__extension', '!!! -- load chrome extension success-- !!!' + id);
      })
      .catch(e => {
        console.log('__extension', e);
        fsManage.writeLog('__extension', e);
      });
  }

  // app.addListener('will-quit', () => {
  //   try {
  //     appManage.getSession().flushStorageData();
  //   } catch (ex) {
  //     console.error(ex);
  //   }
  // })
  // const res = storeManage.get('app', 'initAccount');
  let isCreateMainWindow;
  // if (!res) {
  //   isCreateMainWindow = false;
  //   windowManage.createWindow({ type: 'bkInit' }).then(() => {
  //     console.log('!!! -- build app init window success -- !!!');
  //   });
  // } else {
  isCreateMainWindow = true;
  if (!isLowMemoryMode) {
    windowManage.createWindow({ type: 'bkStable' }).then(() => {
      console.log('!!! -- build app init window success -- !!!');
    });
  }
  // 有打开的文件，不展示主页面，todo，好像manualShow不行
  const openFilePaths = fileAssociation.getOpenFilePaths();
  const sendFilePaths = fileAssociation.getSendFilePaths();
  // openFilePaths && openFilePaths.length ? true
  const manualShow = process && process.argv && process.argv.some(item => item.includes('--hidden')) ? true : false;

  windowManage.createWindow({ type: 'main', manualShow }).then(winRes => {
    const mainWin = windowManage.getWindow(winRes.winId);
    if (mainWin) {
      if ((openFilePaths && openFilePaths.length) || (sendFilePaths && sendFilePaths.length)) {
        fileAssociation.sendOpenFilePathsToWindow(mainWin);
      }

      fileAssociation.addOpenFileHandler(() => {
        fileAssociation.sendOpenFilePathsToWindow(mainWin);
      });
    }
  });
  // windowManage.createWindow({ type: 'asyncApi' });
  // }

  setElectronInitTime(isCreateMainWindow);

  // setTimeout(() => {
  //   windowManage.prepareAllWindow().then();
  // }, 90000);
});

function setElectronInitTime(isCreateMainWindow: boolean) {
  try {
    storeManage.set('memory', 'electron-init-time', Math.round(process.uptime() * 1000));
    if (isCreateMainWindow) {
      storeManage.set('memory', 'electron-create-window-time', new Date().getTime());
    }
  } catch (ex) {
    console.error(ex);
  }
}

process.on('uncaughtException', function (err) {
  console.log('uncaughtException', err.stack);
  fsManage.writeLog('mainThreadException_error_caught', { err }).then();
});
