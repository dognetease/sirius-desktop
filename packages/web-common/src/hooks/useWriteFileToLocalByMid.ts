import { apis, apiHolder, MailApi, SystemApi } from 'api';
const mailApi: MailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();

const useWriteFileToLocalByMid = async (file: File, mid?: number | string): Promise<any> => {
  let midStr;
  if (!mid) {
    midStr = new Date().valueOf().toString();
  } else if (typeof mid === 'number') {
    midStr = mid.toString();
  } else {
    midStr = mid;
  }
  if (!inElectron) {
    return Promise.resolve('');
  }
  let defaultPath = '';
  const sep = window.electronLib.env.isMac ? '/' : '\\';
  const dirPath = await mailApi.mkDownloadDir('regular', { mid: midStr, fid: 100001 });
  const realName = await window.electronLib.fsManage.setDownloadFileName(dirPath, file.name);
  defaultPath = `${dirPath}${sep}${realName}`;
  const fileReader = new FileReader();
  return new Promise((resolve, reject) => {
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = async () => {
      const buffer = Buffer.from(fileReader.result as ArrayBuffer);
      window.electronLib.fsManage.writeFile(buffer, defaultPath, {}, (err: any) => {
        if (err) {
          return reject('写入失败');
        } else {
          return resolve(defaultPath);
        }
      });
    };
    fileReader.onerror = () => {
      return reject('写入失败');
    };
  });
};

export default useWriteFileToLocalByMid;
