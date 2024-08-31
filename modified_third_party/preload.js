((window) => {
    try {
        console.warn("electron start load ");
        const {remote} = require('electron');
        console.log("got remote:", remote);
        const path = require('path');
        // const isLocal = process.env.NODE_ENV;
        const libPath = remote.app.getAppPath() + '/dist/electron/lib/index.js';
        const {electronLib} = require(path.join(libPath));
        console.log("require electron lib ", electronLib);
        window.electronLib = electronLib;
        console.warn("electron lib done");
    } catch (e) {
        console.warn(e);
    }
})(window)