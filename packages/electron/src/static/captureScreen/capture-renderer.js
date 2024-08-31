/* eslint-disable */
// @ts-nocheck

const { ipcRenderer, clipboard, nativeImage } = require('electron');

const fs = require('fs');
const { getScreenSources } = require('./desktop-capturer');
const { CaptureEditor } = require('./capture-editor');
const { getCurrentScreen } = require('./utils');
const { electronLib } = require('../../lib/index');

const $canvas = document.getElementById('js-canvas');
const $bg = document.getElementById('js-bg');
const $sizeInfo = document.getElementById('js-size-info');
const $toolbar = document.getElementById('js-toolbar');

const $btnClose = document.getElementById('js-tool-close');
const $btnOk = document.getElementById('js-tool-ok');
// const $btnSave = document.getElementById('js-tool-save');
const $btnReset = document.getElementById('js-tool-reset');

const audio = new Audio();
audio.src = './assets/audio/capture.mp3';

// // 右键取消截屏
// document.body.addEventListener(
//   'mousedown',
//   e => {
//     if (e.button === 2) {
//       window.close();
//     }
//   },
//   true
// );

// console.time('capture')
let capture = null;
const actionGetScreenSources = type => {
  getScreenSources({ renderType: type }, async imgSrc => {
    // console.timeEnd('capture')
    if (!capture) {
      capture = new CaptureEditor($canvas, $bg, imgSrc);
    }
    if (type === 'nonFirst') {
      // capture.imgSrc = imgSrc;
      document.body.style.cursor = 'auto';
      try {
        await capture.initImg(imgSrc);
      } catch (error) {
        electronLib.fsManage.writeToLogFile({ data: `captureScreen initImg error:${error}` });
      }
      return;
    }
    console.log('只渲染一次');
    // 右键取消截屏
    document.body.addEventListener(
      'mousedown',
      e => {
        if (e.button === 2) {
          closeResetHtml();
          ipcRenderer.send('capture-screen', {
            type: 'close',
          });
        }
      },
      true
    );
    const currentScreen = await getCurrentScreen();
    // let capture = new CaptureEditor($canvas, $bg, imgSrc);
    let onDrag = selectRect => {
      $toolbar.style.display = 'none';
      $sizeInfo.style.display = 'block';
      $sizeInfo.innerText = `${selectRect.w} * ${selectRect.h}`;
      if (selectRect.y > 35) {
        $sizeInfo.style.top = `${selectRect.y - 30}px`;
      } else {
        $sizeInfo.style.top = `${selectRect.y + 10}px`;
      }
      $sizeInfo.style.left = `${selectRect.x}px`;
    };
    capture.on('start-dragging', onDrag);
    capture.on('dragging', onDrag);

    closeResetHtml = () => {
      capture.reset();
      $bg.style.backgroundImage = '';
    };

    let onDragEnd = () => {
      if (capture.selectRect) {
        ipcRenderer.send('capture-screen', {
          type: 'select',
          screenId: currentScreen.id,
        });
        const { r, b } = capture.selectRect;
        $toolbar.style.display = 'flex';
        console.log('window.screen.height', window.screen.height);
        console.log('window.screen.height-b', b);
        const toolTop = window.screen.height - b < 55 ? `${b - 45}px` : `${b + 15}px`;
        $toolbar.style.top = toolTop;
        if (r < 110) {
          $toolbar.style.left = '0';
          $toolbar.style.right = 'auto';
        } else {
          $toolbar.style.right = `${window.screen.width - r}px`;
          $toolbar.style.left = 'auto';
        }
      }
    };
    capture.on('end-dragging', onDragEnd);

    // ipcRenderer.on('capture-screen', (e, { type, screenId }) => {
    //   if (type === 'select') {
    //     if (screenId && screenId !== currentScreen.id) {
    //       capture.disable();
    //     }
    //   }
    // });

    capture.on('reset', () => {
      $toolbar.style.display = 'none';
      $sizeInfo.style.display = 'none';
    });

    $btnClose.addEventListener('click', () => {
      closeResetHtml();
      ipcRenderer.send('capture-screen', {
        type: 'close',
      });
    });

    ipcRenderer.on('reset-win', e => {
      closeResetHtml();
    });

    $btnReset.addEventListener('click', () => {
      capture.reset();
    });

    let selectCapture = () => {
      if (!capture.selectRect) {
        return;
      }
      let url = capture.getImageUrl();
      electronLib.appManage.hideCurrentWindow();

      audio.play();
      // audio.onended = () => {
      //   window.close();
      // };
      clipboard.writeImage(nativeImage.createFromDataURL(url));
      closeResetHtml();
      console.log('fromWinId--------', '0000');
      ipcRenderer.send('capture-screen', {
        type: 'complete',
        url,
      });
      ipcRenderer.send('capture-screen', {
        type: 'close',
      });
    };
    $btnOk.addEventListener('click', selectCapture);

    // $btnSave.addEventListener('click', () => {
    //   let url = capture.getImageUrl();

    //   electronLib.appManage.hideCurrentWindow();
    //   // remote.dialog.showSaveDialog(
    //   //   {
    //   //     filters: [
    //   //       {
    //   //         name: 'Images',
    //   //         extensions: ['png', 'jpg', 'gif'],
    //   //       },
    //   //     ],
    //   //   },
    //   //   path => {
    //   //     if (path) {
    //   //       // eslint-disable-next-line no-buffer-constructor
    //   //       fs.writeFile(path, new Buffer(url.replace('data:image/png;base64,', ''), 'base64'), () => {
    //   //         ipcRenderer.send('capture-screen', {
    //   //           type: 'complete',
    //   //           url,
    //   //           path,
    //   //         });
    //   //         window.close();
    //   //       });
    //   //     } else {
    //   //       ipcRenderer.send('capture-screen', {
    //   //         type: 'cancel',
    //   //         url,
    //   //       });
    //   //       window.close();
    //   //     }
    //   //   }
    //   // );
    // });

    window.addEventListener('keypress', e => {
      if (e.code === 'Enter') {
        selectCapture();
      }
    });
  });
};

ipcRenderer.on('get-screen-sources', e => {
  actionGetScreenSources('nonFirst');
  electronLib.fsManage.writeToLogFile({ data: 'captureScreen 触发get-screen-sources' });
  console.log('captureScreen reonload');
});

ipcRenderer.on('close-screen-sources-reset', e => {
  closeResetHtml();
});

window.onload = () => {
  console.log('captureScreen onload');
  actionGetScreenSources();
};
