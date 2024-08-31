import { clipboard, shell } from 'electron';
// import { clipboard, shell } from 'electron';
import fse, { CopyOptions, WriteFileOptions, lstat, readdirSync, lstatSync } from 'fs-extra';
import path from 'path';
import fs, { Stats } from 'fs';
import type { ParsedMail, SimpleParserOptions } from 'mailparser';

import { ipcChannelManage } from './ipcChannelManage';
import { FsManage, FsManageHandle, FsManageRenderer, FsParsedMail, FsZipConfig, FsZipRes, logsToArrayBufRes } from '../declare/FsManage';
// import { env } from './env';
import { appManage } from './appManage';
import { util } from '../util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
// eslint-disable-next-line @typescript-eslint/no-var-requires
let _tnef: any | null = null;
let _iconvLite: any | null = null;
let _simpleParser: any | null = null;

function getSimpleParser() {
  if (!_simpleParser) {
    _simpleParser = require('mailparser').simpleParser;
  }
  return _simpleParser;
}

function getTnef() {
  if (!_tnef) {
    _tnef = require('node-tnef');
  }
  return _tnef;
}

function getIconvLite() {
  if (!_iconvLite) {
    _iconvLite = require('iconv-lite');
  }
  return _iconvLite;
}

class FsManageImpl implements FsManage, FsManageHandle, FsManageRenderer {
  async isDir(filePath: string): Promise<boolean> {
    const res = await lstat(filePath);
    return res.isDirectory();
  }

  async loopDirPath(path: string, fileExtension?: string | undefined, deep?: boolean | undefined): Promise<string[]> {
    // throw new Error('Method not implemented.');
    if (!this.isExist(path)) {
      return [];
    }
    const unLoopedDirs: string[] = [];
    const getAllFiles = (dir: string, allFilesList: string[] = []) => {
      if (!lstatSync(dir).isDirectory()) {
        allFilesList.push(dir);
        return allFilesList;
      }
      const files = readdirSync(dir);
      files.forEach(file => {
        const filePath = this.normalizePath(`${dir}/${file}`);
        if (deep && lstatSync(filePath).isDirectory()) {
          getAllFiles(filePath, allFilesList);
        } else if (lstatSync(filePath).isFile()) {
          if ((fileExtension && file.lastIndexOf(fileExtension) !== -1) || !fileExtension) {
            allFilesList.push(filePath);
          }
        }
      });
      return allFilesList;
    };

    return getAllFiles(path, unLoopedDirs);
  }

  clipboardWriteImage(dataURL: string): void {
    clipboard.clear();
    // clipboard.writeImage(nativeImage.createFromDataURL(dataURL));
    clipboard.writeHTML(`<img src=${dataURL} />`);
  }

  async getCookie(domain?: string): Promise<string> {
    const res = await ipcChannelManage.invoke({
      channel: 'fsManageInvoke',
      functionName: 'getCookie',
      params: domain,
    });
    return res as string;
  }

  readFile(path: string): Promise<Buffer> {
    return fse.readFile(path);
  }

  writeFile(file: string | Buffer | Uint8Array, path: string, options: WriteFileOptions | string, callback: (err: Error) => void): void {
    return fse.outputFile(path, file, options, callback);
  }

  remove(path: string): Promise<void> {
    return fse.remove(path);
  }

  getFileMd5(filePath: string): string {
    try {
      const buffer = fse.readFileSync(filePath);
      const { createHash } = require('crypto');
      const hash = createHash('md5');
      // todo: 临时解决Update中isBuffer过不去的问题, 在添加node的poyfill之后可以去掉
      try {
        // eslint-disable-next-line
        // @ts-ignore
        buffer._isBuffer = true;
      } catch (error) {
        console.error('[error] buffer._isBuffer', error);
      }
      hash.update(buffer);
      return hash.digest('hex').toUpperCase();
    } catch (error) {
      return '';
    }
  }

  async zip(config: FsZipConfig) {
    const res = await ipcChannelManage.invoke({
      channel: 'fsManageInvoke',
      functionName: 'zip',
      params: config,
    });
    return res as FsZipRes;
  }

  // 有period参数时是默认的日志轮询上传，表示要上传近period天的日志
  async logsToArrayBuf(period?: number): Promise<logsToArrayBufRes> {
    const userDataPath = await appManage.getPath('userData');
    const logPath = userDataPath + '/logs/';
    const zipName = period ? 'logs.zip' : '近两天logs.zip';
    const zipPath = `${userDataPath}/${zipName}`;

    const packRes = await packRecentLogs();

    return !packRes
      ? { success: false }
      : {
          success: true,
          name: zipName,
          path: zipPath,
          data: await zipToArrayBuffer(zipPath),
        };

    // 打包近两天的log
    async function packRecentLogs() {
      await fsManage.remove(zipPath);

      const files = getRecentFiles();
      if (files.length == 0) {
        return false;
      }
      try {
        const res = await fsManage.zip({
          files,
          fileName: '', // 这个不传也没事
          filePath: zipPath,
        });
        if (!res.success) {
          console.log('压缩log失败', res);
          throw new Error(`压缩log失败: ${JSON.stringify(res)}`);
        }
        return true;
      } catch (error) {
        console.log('压缩log失败', error);
        throw error;
      }

      // 获取近几天的log，默认两天
      function getRecentFiles() {
        const realPeriod = period || 2;
        let count = 0;
        const fileNameList = [];

        function getFileName(cur: Date) {
          const dateStr = [cur.getFullYear(), cur.getMonth() + 1, cur.getDate()].join('-');

          return [logPath + dateStr + '.log', logPath + dateStr + '.high.log', logPath + dateStr + '.low.log'];
        }

        while (count < realPeriod) {
          const fileNames = getFileName(new Date(new Date().getTime() - count * 24 * 60 * 60 * 1000));
          fileNameList.push(...fileNames);
          count += 1;
        }

        return fileNameList.filter(path => fsManage.isExist(path));
      }
    }

    // 压缩包转为ArrayBuffer
    function zipToArrayBuffer(filePath: string) {
      return new Promise<ArrayBuffer>(res => {
        fse.readFile(filePath, (err, data) => {
          if (err) {
            console.log('读取zip失败', err);
            throw err;
          }
          const arrayBuf: ArrayBuffer = toArrayBuffer(data);
          res(arrayBuf);
        });
      });

      // buffer转ArrayBuffer
      function toArrayBuffer(buf: Buffer) {
        const ab = new ArrayBuffer(buf.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < buf.length; ++i) {
          view[i] = buf[i];
        }
        return ab;
      }
    }
  }

  async createWriteStream(fileName: string, dirName?: string) {
    const userDataPath = await appManage.getPath('userData');
    const dirPath = path.join(userDataPath, dirName || 'attachment');
    const name = path.join(dirPath, fileName);
    fse.ensureDirSync(dirPath);
    return fse.createWriteStream(name);
  }

  isExist(path: string): boolean {
    return fse.pathExistsSync(path);
  }

  async mktempdir(prefix: string): Promise<string> {
    const userDataPath = await appManage.getPath('userData');
    return fse.mkdtempSync(path.join(userDataPath, prefix));
  }

  async mkDir(dirName: string, path?: string): Promise<string> {
    const basePath = path || (await appManage.getPath('userData'));
    const filePath = this.normalizePath(`${basePath}/${dirName}`);
    await fse.ensureDir(filePath);
    return filePath;
  }

  setDownloadFileName(downloadPath: string, fileName?: string, extName?: string, fileMaxCount?: number): string {
    return util.setDownloadFileName(downloadPath, fileName, extName, fileMaxCount);
  }

  normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }

  move(from: string, to: string): Promise<void> {
    return fse.move(from, to);
  }

  copy(from: string, to: string, options?: CopyOptions): Promise<void> {
    return fse.copy(from, to, options);
  }

  open(path: string): Promise<string> {
    return shell.openPath(path);
  }

  show(path: string): void {
    return shell.showItemInFolder(path);
  }

  writeToLogFile(conf: { data: string[]; appendix?: string }): void {
    ipcChannelManage.send({
      channel: 'fsManage',
      functionName: 'writeToLogFile',
      params: conf,
    });
  }

  async saveBase64File(path: string, data: string): Promise<any> {
    return new Promise((re, rj) => {
      const dataBuffer = Buffer.from(data, 'base64');
      fse.writeFile(path, dataBuffer, err => {
        if (!err) {
          re({
            path,
            success: !0,
          });
        } else {
          rj({
            success: false,
            err,
          });
        }
      });
    });
  }

  dragFile(filePath: string, iconPath?: string) {
    setTimeout(() => {
      ipcChannelManage.send({
        channel: 'ondragstart',
        functionName: 'dragFile',
        params: { filePath, iconPath },
      });
    }, 250);
  }

  async stat(filePath: string): Promise<Stats> {
    return fse.stat(filePath);
  }

  async parseEml(filePath: string, lastModified: number, options?: SimpleParserOptions): Promise<FsParsedMail> {
    return this.readFile(filePath).then(file => {
      const encodingMatches = file.toString().match(/Content-Type:.+charset="(.+)"/i);
      const encoding = encodingMatches && encodingMatches[1] ? encodingMatches[1] : 'utf8';
      const simpleParser = getSimpleParser();
      return (simpleParser(file, options) as Promise<FsParsedMail>).then(parsedMail => {
        parsedMail.encoding = encoding;
        parsedMail.id = '';
        parsedMail.lastModified = lastModified;
        return parsedMail;
      });
    });
  }

  parseTNEFFile(file: Buffer | string, encoding = 'utf8'): Promise<string | ParsedMail['attachments']> {
    return new Promise(resolve => {
      try {
        const tnef = getTnef();
        const iconvLite = getIconvLite();
        if (typeof file === 'string') {
          tnef.parse(file, (err: Error, content: any) => {
            if (err) {
              console.error('[parseTNEFFile]', err);
              resolve('');
            } else if (content.BodyHTML) {
              const res = Buffer.from(content.BodyHTML);
              resolve(iconvLite.decode(res, encoding));
            }
          });
        } else {
          tnef.parseBuffer(file, (err: Error, content: any) => {
            if (err) {
              console.error('[parseTNEFFile]', err);
              resolve('');
            } else if (content.BodyHTML) {
              const res = Buffer.from(content.BodyHTML);
              resolve(iconvLite.decode(res, encoding));
            } else if (Array.isArray(content.Attachments)) {
              const res: ParsedMail['attachments'] = (content.Attachments as { Data: Buffer | number[]; Title: string }[]).map(v => {
                const extname = path.extname(v.Title);
                const contentType = extname ? `application/${extname.slice(1)}` : '';
                const currentContent = Buffer.isBuffer(v.Data) ? v.Data : Buffer.from(v.Data);
                return {
                  content: currentContent,
                  filename: v.Title,
                  related: false,
                  type: 'attachment',
                  contentType,
                  checksum: '',
                  contentDisposition: 'attachment',
                  headers: {} as any,
                  headerLines: [],
                  size: currentContent.length,
                };
              });
              resolve(res);
            }
          });
        }
      } catch (err) {
        console.error('[parseTNEFFile]', err);
        resolve('');
      }
    });
  }

  getBaseName(filePath: string): string {
    return path.parse(filePath).base;
  }

  private deleteFolders(folders: Array<string>) {
    try {
      folders.forEach(folderPath => {
        try {
          if (fs.existsSync(folderPath)) {
            fs.rmdirSync(folderPath, { recursive: true });
          }
        } catch (ex) {
          console.error('delete folder ' + folderPath + ' error', ex);
        }
      });
      return true;
    } catch (ex) {
      return false;
    }
  }

  private deleteFiles(files: Array<string>) {
    try {
      files.forEach(filePath => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (ex) {
          console.error('delete file ' + filePath + ' error', ex);
        }
      });
      return true;
    } catch (ex) {
      return false;
    }
  }

  getIsFolderHasFullAccess(testPath: string) {
    const testFolderPath = path.join(testPath, './lingxi-accesstest');
    const testFilePath = path.join(testFolderPath, './lingxi-accesstext.txt');
    try {
      if (!fs.existsSync(testPath)) {
        return {
          success: false,
          createRes: false,
          errorMsg: `${testPath} not exist`,
          errorCode: 'NOT-EXIST',
        };
      }
      fs.mkdirSync(testFolderPath);
      fs.writeFileSync(testFilePath, 'only use for lingxi test access, you can delete it.');
      const delRes = this.deleteFiles([testFilePath]);
      const deleFolderRes = this.deleteFolders([testFolderPath]);
      return {
        success: true,
        createRes: true,
        deleteRes: delRes && deleFolderRes,
      };
    } catch (ex: any) {
      const delRes = this.deleteFiles([testFilePath]);
      const deleFolderRes = this.deleteFolders([testFolderPath]);
      return {
        success: false,
        createRes: false,
        deleteRes: delRes && deleFolderRes,
        errorCode: 'Catch-Error',
        errorMsg: ex && ex.message,
      };
    }
  }
}

export const fsManage = new FsManageImpl();
