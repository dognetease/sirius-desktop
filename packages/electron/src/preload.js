(function (window) {
  const electron = require('electron');
  const path = require('path');
  const isLocal = process.env.NODE_ENV;
  // electron.ipcRenderer.on('appCallResult', (ev, res) => {
  //
  // });
  electron.ipcRenderer.invoke('appCall', 'getAppPath').then(res => {
    // console.log('[preload] send getAppPath');
    console.log('got path :', res.data);
    const libPath = res.data.appPath + (isLocal ? '' : '/dist/electron/') + '/lib/index.js';
    const lib = require(path.join(libPath));
    window.electronLib = lib.electronLib;
  });
})(window);
