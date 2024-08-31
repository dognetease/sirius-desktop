/* eslint-disable no-nested-ternary */
import { api, apis, ContactApi, FeedbackApi, FeedbackOption, LoggerApi, OrgApi } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';

const loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as LoggerApi;
const systemApi = api.getSystemApi();
const feedbackApi = api.requireLogicalApi(apis.feedbackApiImpl) as FeedbackApi;
const inElectron = systemApi.isElectron();
const isMac = inElectron && window.electronLib?.env?.isMac;
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;

// eslint-disable-next-line no-nested-ternary
const platform = inElectron ? (isMac ? 'mac' : 'win') : 'web';

// 上传日志文件
export const feedbackUploadLog = async () => {
  const userEmail = systemApi.getCurrentUser()?.id;
  let fileName = `clieng-log/sirius/${platform}/${userEmail}/${Date.now()}-0`;
  let logFile = null;
  // electron中日志信息来自已保存的路径下，web中日志信息来自indexDb查询
  if (inElectron) {
    const electronRes = await window.electronLib?.fsManage?.logsToArrayBuf();
    fileName = `${fileName}.zip`;
    logFile = new File([electronRes?.data], fileName, { type: 'application/zip' });
  } else {
    const blob = await loggerApi.getWebLogs();
    fileName = `${fileName}.log`;
    logFile = new File([...blob.values()], fileName);
  }
  const type = 'log';
  const user = systemApi.getCurrentUser();

  const ua = navigator.userAgent.toLowerCase();
  const os = ua.indexOf('windows') > -1 ? 'win' : ua.indexOf('mac') > -1 ? 'mac' : 'others';

  if (!userEmail) {
    SiriusMessage.error({ content: '上传失败，请稍后重试' });
    return false;
  }
  // currentUser偶发拿不到orgId，从contactApi读
  let orgId = user?.contact?.contact.enterpriseId || (user?.prop?.companyId as string)?.split('_').pop();
  if (!orgId) {
    try {
      const getOrgIdFromUser = contactApi
        .doGetContactByItem({
          type: 'EMAIL',
          value: [userEmail],
        })
        .then(([contact]) => {
          return contact.contact.enterpriseId ? String(contact.contact.enterpriseId) : contact.contact.enterpriseId;
        });
      const getOrgIdFromOrg = contactApi.doGetOrgList({ typeList: [99] }).then(([org]) => {
        return org.originId.split('_').pop();
      });
      orgId = await Promise.any([getOrgIdFromOrg, getOrgIdFromUser]);
    } catch (e) {
      console.warn(e);
    }
  }

  if (!orgId) {
    // 通讯录未完成同步时，orgId可能为空
    SiriusMessage.error({ content: '上传失败，请稍后重试' });
    return false;
  }

  try {
    const res = await loggerApi.uploadNosMediaOrLog(logFile, fileName, type);
    const deviceInfo = await systemApi.getDeviceInfo();

    if (res === 'success') {
      const params: FeedbackOption = {
        email: userEmail || '',
        productId: systemApi.inEdm() ? 'fastmail' : deviceInfo.p === 'web' ? 'sirius' : deviceInfo.p,
        deviceId: deviceInfo._deviceId,
        platform,
        version: window.siriusVersion,
        system: inElectron ? platform : os,
        systemVersion: deviceInfo._systemVersion,
        // browser: '',
        // browserVersion: '',
        ua: navigator.userAgent,
        orgId: String(orgId),
        orgName: user?.company,
        feedbackType: 'one_click', // 后台
        files: [
          {
            type,
            name: fileName,
            size: logFile.size,
            fileCreateTime: Date.now(),
          },
        ],
      };
      if (platform === 'web') {
        const browserInfo = systemApi.getBrowserInfo();
        params.browser = browserInfo.name;
        params.browserVersion = browserInfo.version;
      }
      const feedbackRes = await feedbackApi.submitFeedback(params);
      if (feedbackRes.success) {
        SiriusMessage.success({ content: getIn18Text('SHANGCHUANCHENGGONG') });
        return feedbackRes.success;
      }
    }
  } catch (e) {
    console.warn(e);
  }

  SiriusMessage.error({ content: getIn18Text('SHANGCHUANSHIBAI') });
  return false;
};
