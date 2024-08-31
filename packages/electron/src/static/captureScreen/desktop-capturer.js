/* eslint-disable */
// @ts-nocheck
const { electronLib } = require('../../lib/index');
const { getCurrentScreen } = require('./utils');

async function getScreen(callback, renderType) {
  const curScreen = await getCurrentScreen();
  console.log('curScreen', curScreen);
  this.callback = callback;
  document.body.style.opacity = '0';
  let oldCursor = document.body.style.cursor;
  document.body.style.cursor = 'none';

  this.handleStream = stream => {
    document.body.style.cursor = oldCursor;
    document.body.style.opacity = '1';
    if (this.callback) {
      // Save screenshot to png - base64
      console.log('66666');
      this.callback(stream);
    }
  };

  this.handleError = e => {
    console.log('8888', e);
  };

  if (renderType === 'nonFirst') {
    electronLib.appManage
      .getShotScreenImg(JSON.stringify({ size: curScreen.size, scaleFactor: curScreen.scaleFactor, id: curScreen.id }))
      .then(stream => {
        this.handleStream(stream);
      })
      .catch(this.handleError);
  } else {
    this.handleStream('./default.png');
  }
}

exports.getScreenSources = async ({ types = ['screen'], renderType } = {}, callback) => {
  await getScreen(callback, renderType);
};
