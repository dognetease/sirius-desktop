import { useEffect, useRef, useState } from 'react';
import { currentMailSize as getCurrentMailSize } from '@web-common/state/getter';
import { preUploadAttachment } from '../../util';
import { actions as attachmentActions } from '@web-common/state/reducer/attachmentReducer';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import { MailTabActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { isMainAccount } from '@web-mail/util';
import {
  apis,
  MailEntryModel,
  apiHolder,
  NetStorageApi,
  NSDirContent,
  MailApi,
  SystemApi,
  FileApi,
  FileLoaderActionConf,
  AccountApi,
  MailFileAttachModel,
  LoggerApi,
  WriteMailInitModelParams,
  ReUploadInfo,
  RespDoTransferAtts,
  MailConfApi,
} from 'api';
import { Attachment, AttachmentView } from '@web-common/state/state';
import { attachmentDownloadAction } from '@web-common/state/action';
interface UploadAttaRes {
  type: string;
  fileName: string;
  success: boolean;
  err?: any;
}

interface DownloadUrlData {
  content: MailEntryModel;
  _account: string;
  agentNode?: string | null;
}

const replaceQueryString = (url: string, name: string, value: any) => {
  const re = new RegExp(name + '=[^&]*', 'gi');
  return url.replace(re, name + '=' + value);
};

const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const mailApi: MailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const eventApi = apiHolder.api.getEventApi();
const fileApi = apiHolder.api.getFileApi() as FileApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const loggerApi = apiHolder.api.requireLogicalApi(apis.loggerApiImpl) as LoggerApi;
const inElectron = systemApi.isElectron();

let changeImgArr: { originFileUrl: string; replaceFileUrl: string }[] = [];
let deleteCatchAttArr: { type: string; value: any }[] = [];
let addCatchAttArr: { type: string; value: any }[] = [];

const useReupload = () => {
  const { currentMail } = useAppSelector(state => state.mailReducer);
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail.cid);
  const attachments = useAppSelector(state => state.attachmentReducer.attachments);
  const cacheAttachment = useAppSelector(state => state.mailReducer.cacheAttachment);
  const mailEntities = useAppSelector(state => state.mailReducer.mailEntities);
  const mailEntitiesRef = useRef(mailEntities);
  mailEntitiesRef.current = mailEntities;
  const currentMailRef = useRef(currentMail);
  currentMailRef.current = currentMail;
  // const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender);
  const optSenderMainEmail = useAppSelector(state => state.mailReducer.currentMail?.optSenderMainEmail);
  const dispatch = useAppDispatch();
  const originMail = useRef<MailEntryModel>();
  const originInitSenderStr = useRef<string>();
  originInitSenderStr.current = currentMail?.initSenderStr || '';

  // 当前空间信息
  const [cloudAttInfo, setCloudAttInfo] = useState<NSDirContent>();
  useEffect(() => {
    // 获取当前空间信息
    diskApi.doGetNSFolderInfo({ type: 'cloudAtt' }).then(res => {
      setCloudAttInfo(res);
    });
  }, []);

  const currentMailSize = getCurrentMailSize(currentMail as MailEntryModel, attachments);
  const currentMailSizeRef = useRef(currentMailSize);
  useEffect(() => {
    currentMailSizeRef.current = currentMailSize;
  }, [currentMailSize]);

  const clearMidFile = async (mid: string | undefined) => {
    if (!mid) {
      return;
    }
    // if (typeof mid === 'number') {
    //   mid = mid.toString();
    // }
    try {
      dispatch(mailActions.doChangeCacheAttachment({ id: mid, operationType: 'delete' }));
      if (inElectron) {
        const dirPath = await mailApi.mkDownloadDir('regular', { mid, fid: 100001 });
        window.electronLib.fsManage.remove(dirPath);
      }
    } catch (error) {
      console.log('delete Change error', error);
    }
  };

  if (!currentMailId) {
    return {
      reUploadHandler: () => {
        return null;
      },
      clearMidFile,
      reUploadHandlerWeb: () => {
        return null;
      },
    };
  }
  // 静默下载
  const silentDownload = async (downloadInfo: any, file: any, newCid: string) => {
    const mid = newCid.toString();
    let defaultPath = '';
    const sep = window.electronLib.env.isMac ? '/' : '\\';
    const dirPath = await mailApi.mkDownloadDir('regular', { mid, fid: 100001 });
    const realName = await window.electronLib.fsManage.setDownloadFileName(dirPath, downloadInfo.fileName);
    defaultPath = `${dirPath}${sep}${realName}`;
    const saveConf: FileLoaderActionConf = {
      noStoreData: undefined,
      recordPerf: true,
      recordFileType: file.type === 'netfolder' || file.cloudAttachment ? 'cloud' : 'common',
      _account: originInitSenderStr.current || '',
    };
    const fileTarget: any = { ...downloadInfo, filePath: defaultPath };
    let res;
    try {
      // 到发件人处下载
      // accountApi.setCurrentAccount({ email: currentMail.sender.contactItem.contactItemVal });
      res = await fileApi.download(fileTarget, saveConf);
    } catch (err) {
      return Promise.reject(err);
    }
    if (res.succ) {
      dispatch(mailActions.doChangeCacheAttachment({ id: newCid, value: file, operationType: 'localPathChange', localPath: res.fileModel.filePath }));
      return res;
    } else {
      return Promise.reject();
    }
  };
  // 读取本地附件上传
  const readFileUpload = async (fileName: string, filePath: string, type: string, newCid: string, originFileUrl?: string, isImg?: boolean) => {
    let localfile;
    try {
      localfile = await window.electronLib.fsManage.readFile(filePath);
    } catch (err) {
      return Promise.reject({ type, fileName, success: false, err });
    }
    const fileObj = new File([localfile], fileName);
    // 内联图片
    if (isImg && originFileUrl) {
      try {
        await inlineImgReUpload(fileObj, newCid, originFileUrl, filePath);
        return Promise.resolve({ type, fileName, success: true });
      } catch (err) {
        // console.log('inlineImgReUploaderr', err);
        return Promise.reject({ type, fileName, success: false, err });
      }
    }
    let preTrtAtts = preUploadAttachment({
      fileList: [fileObj],
      currentMailId: newCid,
      currentMailSize: currentMailSizeRef.current,
      cloudAttInfo,
      flag: { usingCloud: false },
    });
    if (preTrtAtts && preTrtAtts.length > 0) {
      try {
        if (type === 'originalFile' || type === 'forwardAsAttach') {
          addCatchAttArr.push({ type: 'localFile', value: preTrtAtts[0] });
        }
        await localAttachmentReUpload({ file: preTrtAtts[0], newCid, localPath: filePath });
        return Promise.resolve({ type, fileName, success: true });
      } catch (err) {
        return Promise.reject({ type, fileName, success: false, err });
      }
    } else {
      return Promise.reject({ type, fileName, success: false, err: '附件添加失败' });
    }
  };

  // 本地附件重传
  const localAttachmentReUpload = async (params: {
    file: Attachment;
    newCid: string;
    localPath?: string;
    type?: string;
    oldCid?: string;
    oldAccount?: string;
    newAccount?: string;
  }) => {
    const { file, newCid, localPath, type, oldCid, oldAccount, newAccount } = params;
    const _file = { ...file };
    const onFile = _file.file;
    if (!onFile) {
      return Promise.reject({ type: _file?.flag?.usingCloud ? 'localCloudFile' : 'localFile', fileName: _file.fileName, success: false, err: '文件不存在' });
    }
    // accountApi.setCurrentAccount({email: optSenderMainEmail});
    const accounts = await accountApi.getMainAndSubAccounts();
    const mainAccount = accounts[0].mainAccount;
    const flag: any = { ..._file?.flag };
    if (mainAccount !== optSenderMainEmail) {
      flag._account = optSenderMainEmail;
    }
    // 本地云附件，直接克隆，无需上传
    if (type === 'localCloudFile') {
      // 校验
      if (oldCid && newCid) {
        // 旧信内容
        const oldMailDb = await mailApi.doGetMailFromDB(oldCid, oldAccount || '');
        const newMailDb = await mailApi.doGetMailFromDB(newCid, newAccount || '');
        const oldAttDb = (oldMailDb?.entry?.attachment || [])?.find(_ => _.realId === file.realId);
        if (oldMailDb && newMailDb && oldAttDb) {
          oldAttDb.fileSourceKey = oldAttDb.fileSourceKey?.split(';')[0] + ';' + newMailDb._id;
          const oldReduxAtt = attachments.find(_ => _.mailId === oldCid && _.realId === file.realId);
          console.log('oldReduxAtt', oldReduxAtt, oldAttDb, newMailDb);
          // 确保数据完备
          if (oldReduxAtt) {
            // db植入
            await mailApi.doSaveAttachmentToDB({ cid: newCid, _account: newAccount || '', attachment: [oldAttDb] });
            // redux植入
            dispatch(attachmentActions.cloneAttachments([{ ...oldReduxAtt, mailId: newCid }]));
            return Promise.resolve({ type: _file?.flag?.usingCloud ? 'localCloudFile' : 'localFile', fileName: _file.fileName, success: true });
          }
        }
        console.log('oldMailDb oldMailDb oldMailDb', oldMailDb);
      }
    }

    return mailApi
      .doUploadAttachment({
        cid: newCid,
        _account: flag._account || '',
        attach: localPath || onFile,
        uploader: {},
        flag,
      })
      .then(({ realId, expired }) => {
        _file.status = 'success';
        _file.realId = realId;
        _file.expired = expired;
        dispatch(attachmentActions.doAddAttachment([_file]));
        return Promise.resolve({ type: _file?.flag?.usingCloud ? 'localCloudFile' : 'localFile', fileName: _file.fileName, success: true });
      })
      .catch(err => {
        _file.status = 'fail';
        dispatch(attachmentActions.doAddAttachment([_file]));
        return Promise.reject({ type: _file?.flag?.usingCloud ? 'localCloudFile' : 'localFile', fileName: _file.fileName, success: false, err });
      });
  };

  // 内联图片重传
  const inlineImgReUpload = async (file: File, newCid: string, originFileUrl: string, localPath?: string) => {
    const accounts = await accountApi.getMainAndSubAccounts();
    const mainAccount = accounts[0].mainAccount;
    const flag: any = { inline: true };
    if (mainAccount !== optSenderMainEmail) {
      flag._account = optSenderMainEmail;
    }

    return mailApi
      .doUploadAttachment({
        cid: newCid,
        _account: flag._account || '',
        attach: localPath || file,
        uploader: undefined,
        flag,
      })
      .then(({ fileUrl }) => {
        // console.log('inlineImgReUploadsuc', fileUrl);
        fileUrl && changeImgArr.push({ originFileUrl, replaceFileUrl: fileUrl });
        addCatchAttArr.push({ type: 'inlineImg', value: { file, fileUrl } });
        return Promise.resolve({ type: 'inlineImg', fileName: file.name, success: true });
      })
      .catch(err => {
        changeImgArr.push({ originFileUrl, replaceFileUrl: 'error' });
        return Promise.reject({ type: 'inlineImg', fileName: file.name, success: false, err });
      });
  };
  // 云文档附件
  const diskReUpload = (file: MailFileAttachModel, newCid: string, isCloud: boolean, _type?: string) => {
    // console.log('diskReUploaddiskReUpload', file, isCloud, _type);
    // accountApi.setCurrentAccount({email: optSenderMainEmail});
    return mailApi
      .doAddAttachment(newCid, [file], { usingCloud: isCloud }, optSenderMainEmail)
      .then(() => {
        const { fileName, fileUrl, fileSize, id, expired, type } = file;
        const attr: AttachmentView[] = [
          {
            flag: { usingCloud: isCloud },
            mailId: newCid,
            fileUrl,
            size: fileSize,
            fileSize: fileSize,
            name: fileName,
            fileName,
            cloudAttachment: isCloud,
            type,
            id,
            expired,
            status: 'success',
          },
        ];
        dispatch(attachmentActions.doAddAttachment(attr));
        return Promise.resolve({ type: _type ? _type : isCloud ? 'diskCloudFile' : 'diskFile', fileName: file.fileName, success: true });
      })
      .catch(err => {
        return Promise.reject({ type: _type ? _type : isCloud ? 'diskCloudFile' : 'diskFile', fileName: file.fileName, success: false, err });
      });
  };
  // 往来附件
  const diskNormalReUpload = async (file: MailFileAttachModel, newCid: string, localPath?: string) => {
    if (!inElectron) {
      return diskReUpload(file, newCid, false);
    }
    let res;
    if (localPath) {
      res = {
        succ: true,
        fileModel: {
          filePath: localPath,
        },
      };
    } else {
      try {
        let downloadInfo = {
          fileUrl: file.fileUrl,
          fileName: file.fileName,
          fileSize: file.fileSize,
          fileSourceType: 1,
        };
        res = await silentDownload(downloadInfo, file, newCid);
      } catch (err) {
        return Promise.reject({ type: 'diskNormalFile', fileName: file.fileName, success: false, err: '附件添加失败' });
      }
    }
    if (res.succ && res.fileModel.filePath) {
      return readFileUpload(file.fileName, res.fileModel.filePath, 'diskNormalFile', newCid);
    } else {
      return Promise.reject({ type: 'diskNormalFile', fileName: file.fileName, success: false, err: '附件添加失败' });
    }
  };
  // 回复转发原始邮件的内联图片
  const originalInlineImgReUpload = async (
    file: any,
    newCid: string,
    originFileUrl: string | undefined,
    localPath: string | undefined,
    latestedDraft?: null | MailEntryModel
  ) => {
    let res;
    if (localPath) {
      res = {
        succ: true,
        fileModel: {
          filePath: localPath,
        },
      };
    } else {
      try {
        let originMailId = null;
        let parId = null;
        let fileMime = undefined;
        if (latestedDraft) {
          const { attachment } = latestedDraft.entry;
          originMailId = latestedDraft.id;
          let onAttachment =
            (attachment || [])?.filter(_ => {
              return !_.deleted && _.fileSize === file.fileSize && _.fileName === file.fileName;
            }) || [];
          parId = onAttachment[0]?.id;
          fileMime = onAttachment[0]?.fileMime;
        } else {
          originMailId = file.fileSourceKey.split(';')[0];
          let onAttachment: any =
            originMail.current?.entry.attachment?.filter(_ => {
              return !_.deleted && _.fileSize === file.fileSize && _.fileName === file.fileName;
            }) || [];
          parId = onAttachment[0]?.id;
          fileMime = onAttachment[0]?.fileMime;
        }
        if (!originMailId || !parId) {
          return Promise.reject({ type: 'originalInlineImg', fileName: file.fileName, success: false, err: '图片添加失败' });
        }
        const downloadInfo = {
          ...file,
          cloudAttachment: file.cloudAttachment,
          downloadContentId: originMailId,
          downloadId: parId + ';' + originMailId,
          fileMime: fileMime,
          fileOriginUrl: replaceQueryString(file.fileOriginUrl, 'Part', parId),
          fileSourceKey: originMailId + ';' + parId,
          fileUrl: replaceQueryString(file.fileUrl, 'part', parId),
          id: parId,
          mailId: originMailId,
          realId: 0,
          type: 'download',
        };
        // 先下载到本地
        res = await silentDownload(downloadInfo, file, newCid);
      } catch (err) {
        return Promise.reject({ type: 'originalInlineImg', fileName: file.fileName, success: false, err: '图片添加失败' });
      }
    }
    if (res.succ && res.fileModel.filePath) {
      // 重传
      return readFileUpload(file.fileName, res.fileModel.filePath, 'originalInlineImg', newCid, originFileUrl, true);
    } else {
      return Promise.reject({ type: 'originalInlineImg', fileName: file.fileName, success: false, err: '图片添加失败' });
    }
  };
  // 回复转发原始邮件的普通附件
  const originalFileReUpload = async (file: any, newCid: string, localPath: string | undefined, latestedDraft?: null | MailEntryModel) => {
    let res;
    if (localPath) {
      res = {
        succ: true,
        fileModel: {
          filePath: localPath,
        },
      };
    } else {
      try {
        let originMailId = null;
        let parId = null;
        let fileMime = undefined;
        if (latestedDraft) {
          const { attachment } = latestedDraft.entry;
          originMailId = latestedDraft.id;
          let onAttachment =
            (attachment || [])?.filter(_ => {
              return !_.deleted && _.fileSize === file.fileSize && _.fileName === file.fileName;
            }) || [];
          parId = onAttachment[0]?.id;
          fileMime = onAttachment[0]?.fileMime;
        } else {
          originMailId = file.fileSourceKey.split(';')[0];
          let onAttachment: any =
            originMail.current?.entry.attachment?.filter(_ => {
              return !_.deleted && _.fileSize === file.fileSize && _.fileName === file.fileName;
            }) || [];
          parId = onAttachment[0]?.id;
          fileMime = onAttachment[0]?.fileMime;
        }
        if (!originMailId || !parId) {
          return Promise.reject({ type: 'originalFile', fileName: file.fileName, success: false, err: '附件添加失败' });
        }
        const downloadInfo = {
          ...file,
          cloudAttachment: file.cloudAttachment,
          downloadContentId: originMailId,
          downloadId: parId + ';' + originMailId,
          fileMime: fileMime,
          fileOriginUrl: replaceQueryString(file.fileOriginUrl, 'Part', parId),
          fileSourceKey: originMailId + ';' + parId,
          fileUrl: replaceQueryString(file.fileUrl, 'part', parId),
          id: parId,
          mailId: originMailId,
          realId: 0,
          type: 'download',
        };
        res = await silentDownload(downloadInfo, file, newCid);
      } catch (err) {
        return Promise.reject({ type: 'originalFile', fileName: file.fileName, success: false, err: '附件添加失败' });
      }
    }
    if (res.succ && res.fileModel.filePath) {
      return readFileUpload(file.fileName, res.fileModel.filePath, 'originalFile', newCid);
    } else {
      return Promise.reject({ type: 'originalFile', fileName: file.fileName, success: false, err: '附件添加失败' });
    }
  };
  // 作为附件转发eml邮件重传
  const forwardAsAttachFileReUpload = async (file: any, newCid: string, localPath: string | undefined) => {
    let res;
    if (localPath) {
      res = {
        succ: true,
        fileModel: {
          filePath: localPath,
        },
      };
    } else {
      try {
        res = await silentDownload(file, file, newCid);
      } catch (err) {
        return Promise.reject({ type: 'forwardAsAttach', fileName: file.fileName, success: false, err: '附件添加失败' });
      }
    }
    if (res.succ && res.fileModel.filePath) {
      return readFileUpload(file.fileName, res.fileModel.filePath, 'forwardAsAttach', newCid);
    } else {
      return Promise.reject({ type: 'forwardAsAttach', fileName: file.fileName, success: false, err: '附件添加失败' });
    }
  };
  // 通知编辑器内联图片更换
  const replaceImg = () => {
    if (changeImgArr.length <= 0 || !changeImgArr) {
      return Promise.resolve(changeImgArr);
    }
    return new Promise((resolve, reject) => {
      eventApi
        .sendSysEvent({
          eventName: 'writePageDataExchange',
          eventStrData: 'inlineImgReUpload',
          eventData: changeImgArr,
        })
        ?.then(() => {
          resolve(changeImgArr);
        })
        ?.catch(error => {
          reject(error);
        });
    });
  };

  // 获取并整理重传的数据
  const getReuploadBaseInfos = async (params: { fromAccount: string; toAccount: string }): Promise<ReUploadInfo> => {
    const { fromAccount, toAccount } = params;
    let info: any = {};
    try {
      // from
      const cookieInfo_form = await systemApi.doGetCookies(undefined, isMainAccount(fromAccount) ? '' : fromAccount);
      const userInfo_from = systemApi.getCurrentUser(fromAccount);
      if (!cookieInfo_form || !userInfo_from) throw new Error('获取cookie或者用户信息失败');
      info.fromAccount = {
        account: fromAccount,
        sid: userInfo_from?.sessionId,
        node: userInfo_from?.node,
        coremail: cookieInfo_form?.Coremail || cookieInfo_form?.coremail,
        qiyeToken: cookieInfo_form.QIYE_TOKEN || cookieInfo_form.qiye_token,
      };
      // to
      const cookieInfo_to = await systemApi.doGetCookies(undefined, isMainAccount(toAccount) ? '' : toAccount);
      const userInfo_to = systemApi.getCurrentUser(toAccount);
      if (!cookieInfo_to || !userInfo_to) throw new Error('获取cookie或者用户信息失败');
      info.toAccount = {
        account: toAccount,
        sid: userInfo_to?.sessionId,
        node: userInfo_to?.node,
        coremail: cookieInfo_to?.Coremail || cookieInfo_to?.coremail,
        qiyeToken: cookieInfo_to.QIYE_TOKEN || cookieInfo_to.qiye_token,
      };
    } catch (error) {
      console.log('getReuploadBaseInfos error', error);
      return Promise.reject(error);
    }
    return info;
  };

  // 批量重传
  const batchReupload = async (params: ReUploadInfo): Promise<RespDoTransferAtts> => {
    try {
      const transferRes = await mailApi.doTransferAtts(params);
      return transferRes;
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const toProxy = (fileUrl: string, _account: string) => {
    const isMain = isMainAccount(_account);
    if (!isMain) {
      const _token = mailConfApi.accountTokens.find(token => token.account === _account)?.token || '';
      const newUrl = fileUrl?.replace(/(\/js6\/s)/, '/commonweb/proxy$1');
      return `${newUrl}&_token=${_token}`;
    }
    return fileUrl;
  };

  // 内联图片替换
  const inlineImgReplace = async (reUploadRes: RespDoTransferAtts, oldData: DownloadUrlData, newData: DownloadUrlData) => {
    return new Promise((resolve, reject) => {
      const { attachments } = reUploadRes;
      if (!attachments || !attachments.length) {
        resolve(true);
      }
      const replaceImgArr: { originFileUrl: string; replaceFileUrl: string }[] = [];
      (attachments || []).map(item => {
        const { originId, inlined, id } = item;
        // 内联
        if (!!inlined) {
          replaceImgArr.push({
            originFileUrl: toProxy(
              mailApi.buildUploadedAttachmentDownloadUrl(
                oldData.content,
                originId,
                undefined,
                oldData._account ? systemApi.getSessionNameOfSubAccount(oldData._account) : '',
                oldData.agentNode
              ),
              oldData._account
            ),
            replaceFileUrl: toProxy(
              mailApi.buildUploadedAttachmentDownloadUrl(
                newData.content,
                Number(id),
                undefined,
                newData._account ? systemApi.getSessionNameOfSubAccount(newData._account) : '',
                newData.agentNode
              ),
              newData._account
            ),
          });
        }
      });
      console.log('replaceImgAr', replaceImgArr);

      if (!replaceImgArr?.length) {
        resolve(true);
      }
      // 同步编辑器
      eventApi
        .sendSysEvent({
          eventName: 'writePageDataExchange',
          eventStrData: 'inlineImgReUpload',
          eventData: replaceImgArr,
        })
        ?.then(res => {
          console.log('sendSysEvent res', res);
          // 留下编辑器同步时间
          setTimeout(() => {
            resolve(true);
          }, 1500);
        })
        .catch(error => {
          reject(error);
        });
    });
  };

  // web端重传
  const reUploadHandlerWeb = async (resendAccount?: string, noAtt?: boolean, forceSave?: Function) => {
    originInitSenderStr.current = currentMail?.initSenderStr || '';
    const latestedCont = currentMail?.entry.content.content || '';
    const oldAccount = originInitSenderStr.current;
    let reUploadInfo: ReUploadInfo | null = null;
    const oldCid = currentMailId;
    let fromComposeId = null;
    try {
      const data = await mailApi.doGetContentFromDB(oldCid, oldAccount || '');
      fromComposeId = data._id;
    } catch (error) {
      dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
      return Promise.reject('重传ComposeId获取失败');
    }
    if (!fromComposeId) {
      dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
      return Promise.reject('重传ComposeId获取失败');
    }
    // Step1: 获取重传参数
    try {
      reUploadInfo = await getReuploadBaseInfos({ fromAccount: oldAccount, toAccount: resendAccount || '' });
    } catch (error) {
      console.log('getReuploadBaseInfos error', error);
      dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
      return Promise.reject(error);
    }
    if (!reUploadInfo) {
      dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
      return Promise.reject('重传参数获取失败');
    }
    reUploadInfo.fromComposeId = fromComposeId;

    // Step2: 重新生成写信
    let newContent: MailEntryModel | null = null;
    let regerateCid = '';
    try {
      newContent = await mailApi.doReSendInitMail(currentMailId, resendAccount, true, latestedCont);
      reUploadInfo.toComposeId = newContent?._id;
      regerateCid = newContent?.cid || '';
    } catch (error) {
      console.log('doReSendInitMail error', error);
      dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
      return Promise.reject('重生失败');
    }

    // 无附件
    if (noAtt) {
      // 更改为新的cid和tab
      dispatch(mailActions.doReplaceCid({ cid: oldCid, newCid: regerateCid, _account: resendAccount, mailEditStatus: '' }));
      dispatch(MailTabActions.doReplaceTabId({ oldId: String(oldCid), newId: String(regerateCid) }));
      return true;
    }

    let excludeAttachment = [];
    try {
      excludeAttachment = await mailApi.doGetExcludeAttIds(oldCid, latestedCont);
      console.log('excludeAttachment', excludeAttachment);
      reUploadInfo.excludeAttachment = excludeAttachment || [];
    } catch (error) {
      return Promise.reject('error');
    }

    // Step3: 重传附件
    let reUploadRes: RespDoTransferAtts | null = null;
    try {
      reUploadRes = await batchReupload(reUploadInfo);
      console.log('batchReupload reUploadRes', reUploadRes);
    } catch (error) {
      dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
      return Promise.reject('重传附件失败');
    }
    if (!reUploadRes) {
      Promise.reject('重传附件失败');
    }

    // 内联图片替换
    try {
      await inlineImgReplace(
        reUploadRes,
        {
          content: { _account: reUploadInfo?.fromAccount.account, _id: reUploadInfo.fromComposeId } as MailEntryModel,
          _account: reUploadInfo?.fromAccount.account,
          agentNode: reUploadInfo.fromAccount.node,
        },
        {
          content: { _account: reUploadInfo?.toAccount.account, _id: reUploadInfo.toComposeId } as MailEntryModel,
          _account: reUploadInfo?.toAccount.account,
          agentNode: reUploadInfo.toAccount.node,
        }
      );
    } catch (error) {
      dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
      return Promise.reject('替换内联图片失败');
    }

    // Step4: 存储草稿获取draftId
    let latestedDraftId = reUploadRes?.draftId || '';
    if (!latestedDraftId) {
      try {
        if (forceSave) {
          newContent.entry.content.content = forceSave();
        }
        console.log('newContent', newContent.entry.content.content, forceSave);
        latestedDraftId = await mailApi.doGetLatestedDraftId({ content: newContent, oldCid });
      } catch (error) {
        dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
        return Promise.reject('获取草稿id失败');
      }
    }
    console.log('latestedDraftId', latestedDraftId);

    // Step5: 重新编辑草稿替换
    let newCid = '';
    try {
      const draftParams: WriteMailInitModelParams = {
        id: latestedDraftId,
        mailType: 'draft',
        writeType: 'editDraft',
        withoutPlaceholder: true,
        _account: newContent._account,
      };
      const res = await mailApi.initModel(draftParams);
      if (res) {
        // 新的cid
        newCid = res.cid;
        res.recoverCid = oldCid;
        // 替换旧的mailreducer
        // dispatch(mailActions.doReplaceMail(res));
        // 替换旧信
        dispatch(mailActions.doReplaceCid({ cid: oldCid, newCid: newCid, _account: resendAccount, con: res.entry.content.content, mailEditStatus: 'reUploading' }));
        dispatch(MailTabActions.doReplaceTabId({ oldId: String(oldCid), newId: String(newCid) }));
        // 清除旧的attachemntreducer附件
        regerateCid && dispatch(attachmentActions.doDelAttachment({ cid: [oldCid] }));
        // 将附件添加至attachment redux层 用于展示
        // 过滤掉在正文中显示的附件
        const filterAttachment = (res.entry.attachment || []).filter(item => !item.inlined);
        filterAttachment.forEach(attachment => {
          const temp = {
            ...attachment,
            mailId: res.cid,
            downloadContentId: res.entry.id,
            downloadId: attachment.fileUrl + res.entry.id,
            type: 'download', // 需要重新下载 但此逻辑已废弃...
            cloudAttachment: attachment.type === 'netfolder',
          };
          // 添加上附件
          dispatch(
            attachmentDownloadAction(temp, {
              forward: true,
              entryId: res.entry.id,
              cid: res.cid || '0',
            })
          );
        });
      }
    } catch (error) {
      dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
      return Promise.reject('重新编辑草稿失败');
    }

    dispatch(mailActions.doModifyMailEditStatus({ cid: newCid, status: '' }));
    return true;
  };

  // 桌面端重传
  const reUploadHandler = async (resendAccount?: string) => {
    const catchAttArr = cacheAttachment[currentMailId] ? cacheAttachment[currentMailId]?.attachment || [] : [];
    try {
      const currentAttachments = attachments.filter(item => item && item.mailId === currentMailId);
      loggerApi.track('useReupload_start', { orginalAtta: currentAttachments, catchAtta: catchAttArr });
    } catch (error) {
      console.log('loggerApi_useReupload_start', error);
    }
    const oldCid = currentMailId;
    const oldAccount = currentMail._account;
    originInitSenderStr.current = currentMail?.initSenderStr || '';
    // 重新生成写信
    const newContent = await mailApi.doReSendInitMail(currentMailId, resendAccount);
    const newCid = newContent.cid || '';
    // 更改为新的cid
    dispatch(mailActions.doReplaceCid({ cid: oldCid, newCid, _account: resendAccount, mailEditStatus: 'reUploading' }));
    try {
      dispatch(MailTabActions.doReplaceTabId({ oldId: String(oldCid), newId: String(newCid) }));
      // 清除更换图片list
      changeImgArr = [];
      // 上传完成后需要删除的redux中的cacheAttachment
      deleteCatchAttArr = [];
      // 上传完成后需要新增的redux中的cacheAttachment
      addCatchAttArr = [];
      // 清除当前邮件的附件
      dispatch(attachmentActions.doClearAttachmentById(oldCid));
      // 获取原始邮件
      const originalFile = catchAttArr.find(_ => _.type === 'originalInlineImg' || _.type === 'originalFile');
      if (originalFile) {
        // 回复，转发，再次编辑
        const originMailId = originalFile.value.fileSourceKey.split(';')[0];
        if (mailEntitiesRef.current[originMailId]) {
          originMail.current = mailEntitiesRef.current[originMailId];
        } else {
          // accountApi.setCurrentAccount({ email: currentMail._account });
          const origin = await mailApi.doGetMailContent(originMailId, false, true, undefined, { _account: currentMail._account });
          originMail.current = origin;
        }
      }
      const parallelRequest = [];
      const serialRequest: any[] = [];

      // 下属邮件 涉及 回复转发原始邮件的内联图片 普通附件的 下载重传
      let latestedDraft: MailEntryModel | null = null;
      if (currentMail?.mailFrom === 'subordinate' && (catchAttArr || []).find(_ => _.type === 'originalInlineImg' || _.type === 'originalFile')) {
        try {
          const res = await mailApi.doSaveTemp({ content: currentMail, saveDraft: true, auto: true, callPurpose: 'resetSaveDraft' });
          const { draftId } = res;
          if (!draftId) {
            dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
            return Promise.reject('获取草稿id失败');
          }
          const draftDetail = await mailApi.doGetMailContent(draftId, false, true, undefined, { _account: originInitSenderStr.current });
          latestedDraft = draftDetail;
          console.log('latestedDraft', latestedDraft, draftId);
          if (!latestedDraft) {
            dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
            return Promise.reject('获取草稿详情失败');
          }
        } catch (error) {
          dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
          return Promise.reject('获取草稿失败');
        }
      }

      // 这几种类型 会走静默下载,web端不支持
      // diskNormalReUpload
      // originalInlineImgReUpload
      // originalFileReUpload
      // forwardAsAttachFileReUpload
      for (let i = 0; i < catchAttArr.length; i++) {
        let file = catchAttArr[i];
        let newFileValue: any = {};
        // 内联图片传递的是一个file对象，无法解构，需要特殊处理
        if (file?.type === 'inlineImg' && file?.value instanceof File) {
          newFileValue = file.value;
          try {
            newFileValue.mailId = newCid;
          } catch (error) {
            console.log('setMailId error', error);
          }
        } else {
          newFileValue = { ...file.value, mailId: newCid };
        }
        if (file.type === 'localFile') {
          // 本地上传的普通附件
          parallelRequest.push(localAttachmentReUpload({ file: newFileValue, newCid, localPath: file.localPath }));
        } else if (file.type === 'localCloudFile') {
          // 本地上传的云附件
          parallelRequest.push(
            localAttachmentReUpload({ file: newFileValue, newCid, localPath: file.localPath, type: file.type, oldCid, oldAccount, newAccount: resendAccount })
          );
        } else if (file.type === 'inlineImg') {
          // 图片内联附件
          parallelRequest.push(inlineImgReUpload(newFileValue, newCid, file.originFileUrl as string, file.localPath));
        } else if (file.type === 'diskFile') {
          // 云文档普通附件
          serialRequest.push(() => diskReUpload(newFileValue, newCid, false));
        } else if (file.type === 'diskCloudFile') {
          // 云文档云附件
          serialRequest.push(() => diskReUpload(newFileValue, newCid, true));
        } else if (file.type === 'diskNormalFile') {
          // 往来附件
          if (!inElectron) continue;
          serialRequest.push(() => diskNormalReUpload(newFileValue, newCid, file.localPath));
        } else if (file.type === 'originalInlineImg') {
          if (!inElectron) continue;
          // 回复转发原始邮件的内联图片
          serialRequest.push(() => originalInlineImgReUpload(newFileValue, newCid, file.originFileUrl, file.localPath, latestedDraft));
        } else if (file.type === 'originalCloudFile') {
          // 回复转发原始邮件的灵犀云附件
          const fileData = {
            id: newFileValue.cloudIdentity,
            expired: newFileValue.expired,
            fileName: newFileValue.fileName,
            fileSize: newFileValue.fileSize,
            type: newFileValue.type,
            fileUrl: newFileValue.fileUrl,
            isCloud: true,
            downloadContentId: newFileValue.fileUrl,
            downloadId: newFileValue.fileUrl,
          };
          serialRequest.push(() => diskReUpload(fileData, newCid, true, file.type));
          deleteCatchAttArr.push({ type: file.type, value: newFileValue });
          addCatchAttArr.push({ type: 'diskCloudFile', value: fileData });
        } else if (file.type === 'originalFile') {
          if (!inElectron) continue;
          // 回复转发原始邮件的普通附件
          serialRequest.push(() => originalFileReUpload(newFileValue, newCid, file.localPath, latestedDraft));
          deleteCatchAttArr.push({ type: file.type, value: newFileValue });
        } else if (file.type === 'forwardAsAttach') {
          // 作为附件转发的eml文件
          if (!inElectron) continue;
          serialRequest.push(() => forwardAsAttachFileReUpload(newFileValue, newCid, file.localPath));
          deleteCatchAttArr.push({ type: file.type, value: newFileValue });
        }
      }
      const serialPromise = (): Promise<UploadAttaRes[]> =>
        new Promise(async resolve => {
          const allRes: UploadAttaRes[] = [];
          for (let i = 0; i < serialRequest.length; i++) {
            let _res;
            try {
              _res = await serialRequest[i]();
              allRes.push(_res);
            } catch (err) {
              allRes.push(err as UploadAttaRes);
            }
          }
          return resolve(allRes);
        });
      return Promise.allSettled(parallelRequest)
        .then(async (res: PromiseSettledResult<UploadAttaRes>[]) => {
          const _res: PromiseSettledResult<UploadAttaRes>[] = [...res];
          try {
            const serialRes: UploadAttaRes[] = await serialPromise();
            serialRes.forEach(resItem => {
              if (resItem.success) {
                _res.push({ status: 'fulfilled', value: resItem });
              } else {
                _res.push({ status: 'rejected', reason: resItem });
              }
            });
          } catch (err) {
            dispatch(mailActions.doModifyMailEditStatus({ cid: newCid, status: '' }));
          }
          try {
            await replaceImg();
          } catch (err) {
            dispatch(mailActions.doModifyMailEditStatus({ cid: newCid, status: '' }));
            _res.forEach(_ => {
              const value = _.status === 'rejected' ? _.reason : _.value;
              if (['inlineImg', 'originalInlineImg'].includes(value.type)) {
                value.success = false;
                value.err = '替换编辑器图片链接失败';
              }
            });
          }
          deleteCatchAttArr.forEach(_ => {
            dispatch(mailActions.doChangeCacheAttachment({ id: oldCid, value: _.value, operationType: 'delete' }));
          });
          addCatchAttArr.forEach(_ => {
            if (_.type === 'localFile') {
              dispatch(mailActions.doChangeCacheAttachment({ id: oldCid, type: _.type, value: _.value, operationType: 'add' }));
            } else if (_.type === 'diskCloudFile') {
              dispatch(mailActions.doChangeCacheAttachment({ id: oldCid, type: _.type, value: _.value, operationType: 'add' }));
            } else if (_.type === 'inlineImg') {
              dispatch(mailActions.doChangeCacheAttachment({ id: oldCid, type: _.type, value: _.value.file, operationType: 'add', originFileUrl: _.value.fileUrl }));
            }
          });
          // old  -> new
          dispatch(mailActions.doReplaceCacheAttachment({ oldCid, newCid }));
          dispatch(mailActions.doModifyMailEditStatus({ cid: newCid, status: '' }));
          try {
            loggerApi.track('useReupload_complete', { completeRes: _res });
          } catch (error) {
            console.log('loggerApi_useReupload_complete', error);
          }
          return _res;
        })
        .catch(err => {
          dispatch(mailActions.doModifyMailEditStatus({ cid: newCid, status: '' }));
          return null;
        });
    } catch (e) {
      dispatch(mailActions.doModifyMailEditStatus({ cid: newCid, status: '' }));
      return null;
    }
  };

  return { reUploadHandler, clearMidFile, reUploadHandlerWeb };
};

export default useReupload;
