import { api, FileApi, FsSaveRes, LoaderResult } from 'api';
import { systemApi } from '../api/index';
import { SiriusSystemBridgeApi } from '@lxunit/bridge-types';
import { navigate } from '@reach/router';

import store from '@web-common/state/createStore';
export const systemBridgeApiImpl: SiriusSystemBridgeApi & { getSiriusVersion: Function } = {
  /**
   * 返回灵犀办公版本号
   * @returns
   */
  getSiriusVersion() {
    try {
      return window.siriusVersion;
    } catch (error) {
      return '';
    }
  },
  toggleMaximize() {
    try {
      return window.electronLib.windowManage.toggleMaximize();
    } catch (error) {
      return Promise.resolve(false);
    }
  },
  innerIframeClick() {
    try {
      const ev = document.createEvent('MouseEvents');
      (ev as any)?.initMouseEvent('mousedown', true, true);
      document.body.dispatchEvent(ev);
    } catch (error) {
      console.log(error);
    }
  },
  downloadFile(fileInfo) {
    return new Promise(resolve => {
      const fileApi = api.getFileApi() as unknown as FileApi;
      fileApi
        .saveDownload(
          {
            fileName: fileInfo.fileName,
            fileUrl: fileInfo.fileUrl,
          },
          {
            progressIndicator(progress) {
              // handles.onProgess(progress)
            },
          }
        )
        .then(_res => {
          const res = _res as LoaderResult;

          // 判断取消
          if (Object.hasOwn(res, 'success')) {
            const cancelRes = _res as FsSaveRes;
            if (cancelRes.success === false) {
              resolve({
                code: 'cancel',
              });
            }
          }
          //  判断成功
          if (res.succ) {
            resolve({
              code: 'success',
              fileModel: {
                filePath: res.fileModel.filePath ?? '',
                fileName: res.fileModel.fileName ?? '',
                fileSize: res.fileModel.fileSize ?? 0,
              },
            });
          }

          // 认为下载失败
          resolve({
            code: 'fail',
            err: '',
          });
        })
        .catch(error => {
          // 认为下载失败
          resolve({
            code: 'fail',
            err: '',
          });
        });
    });
  },
  getCurrentUser(_account?: string) {
    return systemApi.getCurrentUser(_account) as any;
  },
  navigateToAutoMarket(data) {
    if (data.action === 'create') {
      navigate('#edm?page=autoMarketTask&from=WEBSITE');
    } else if (data.action === 'viewDetail') {
      if (data.taskStatus === 'NEW') {
        navigate(`#edm?page=autoMarketTaskEdit&taskId=${data.taskId}&from=WEBSITE`);
      } else {
        navigate(`#edm?page=autoMarketTaskDetail&taskId=${data.taskId}&from=WEBSITE`);
      }
    }
  },
};
