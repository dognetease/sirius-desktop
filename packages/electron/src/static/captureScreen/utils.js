/* eslint-disable */
// @ts-nocheck

const { electronLib } = require('../../lib/index');

exports.getCurrentScreen = async () => {
  let { x, y } = await electronLib.appManage.getCurrentdWindowBounds();
  const displays = await electronLib.appManage.getAllScreenDisplays();
  let res = displays.filter(d => d.workArea.x === x && d.workArea.y === y)[0];
  if (!res) {
    res = displays.filter(d => d.bounds.x === x && d.bounds.y === y)[0];
  }
  return res;
};

exports.isCursorInCurrentWindow = async () => {
  let { x, y } = await electronLib.appManage.getCursorScreenPoint();
  let { x: winX, y: winY, width, height } = await electronLib.appManage.getCurrentdWindowBounds();
  return x >= winX && x <= winX + width && y >= winY && y <= winY + height;
};
