import { DownloadManage } from '../declare/downloadManage';
import { FsDownloadConfig, FsDownloadRes } from '../declare/FsManage';
// import { clipboard, shell } from 'electron';
import { ipcChannelManage } from './ipcChannelManage';
// import { env } from './env';
import { windowManage } from './windowManage';
import { storeManageImpl as storeManage } from './storeManage';

class DownloadManageImpl implements DownloadManage {
  async download(config: FsDownloadConfig): Promise<FsDownloadRes> {
    const channel = 'downloadProgress_' + new Date().getTime();
    const downloadUrl = new URL(config.realUrl || config.url).href;
    const params: FsDownloadConfig = {
      sessionName: config.sessionName,
      // 需要下载的地址
      url: config.url,
      realUrl: config.realUrl,
      // 保存地址
      filePath: config.filePath,
      dirPath: config.dirPath,
      // 文件名
      fileName: config.fileName,
      start: config.start,
      channel,
      downloadUrl,
    };
    let progressTimeoutHandler: NodeJS.Timeout | null = null;
    // let prevProgree = 0;
    const getProgressAsync = async () => {
      if (progressTimeoutHandler) clearTimeout(progressTimeoutHandler);
      progressTimeoutHandler = setTimeout(async () => {
        const downloadInfo = await storeManage.get('download', 'inprogress');
        if (downloadInfo[downloadUrl]) {
          const { receivedBytes, totalBytes, progress } = downloadInfo[downloadUrl];
          console.log('[electron download lib] downloadInfo :', receivedBytes, totalBytes, progress);
          // if (prevProgree !== progress) {
          config.progress!(receivedBytes, totalBytes, progress);
          // prevProgree = progress;
          // }
        }
        getProgressAsync();
      }, 1000);
    };
    if (config.progress) {
      getProgressAsync();
    }

    const winInfo = await windowManage.getCurWindow();
    params.receivedProgressWinId = winInfo?.id;
    // }
    console.warn('download:', params);
    const res = await ipcChannelManage.invoke({
      channel: 'downloadManageInvoke',
      functionName: 'download',
      params,
    });
    progressTimeoutHandler && clearTimeout(progressTimeoutHandler);
    console.warn('before remove', res);
    ipcChannelManage.removeListener(channel);
    console.warn('fs download return', res);
    return res as FsDownloadRes;
  }

  downloadAbort(url: string): void {
    ipcChannelManage.send({
      channel: 'downloadManage',
      functionName: 'downloadAbort',
      params: new URL(url)?.href,
    });
  }
}

export const downloadManage = new DownloadManageImpl();
