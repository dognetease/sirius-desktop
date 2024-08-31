/**
 ------------------------
 Author: zoumingliang
 E-Mail: zoumingliang@corp.netease.com
 Time: 2021-05-11
 ------------------------
 */
const fs = require('fs');
const path = require('path');
const electron_notarize = require('electron-notarize');

module.exports = async function (context) {
  if (context.electronPlatformName !== 'darwin') {
    return;
  }
  console.log('pack position ', context.appOutDir);
  // const password = require('./password.json')

  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productName}.app`);
  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`);
  }

  try {
    const appBundleId = 'com.netease.sirius-desktop';
    const appleId = 'zoumingliang@corp.netease.com';
    const appleIdPassword = 'enyh-dnou-dpat-umbb';
    const ascProvider = 'VNFST8HJXN';
    console.log('start notarize');
    await electron_notarize.notarize({
      appBundleId,
      appPath,
      appleId,
      appleIdPassword,
      ascProvider, // This parameter is optional
    });
  } catch (error) {
    console.error(error);
  }

  console.log('Done notarizing');
};
