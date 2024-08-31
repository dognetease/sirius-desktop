/*
 * @Author: wangzhijie02
 * @Date: 2022-06-13 14:03:45
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-07-08 14:35:18
 * @Description: file content
 */
import { apiHolder, apis, MailApi, NetStorageApi } from 'api';

import { config } from 'env_def';

const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
export const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;

export const systemApi = apiHolder.api.getSystemApi();
export const docHost = config('docHost') as string;

/**
 * 周报日报邮件邮件，有点击link跳转到 周报日报填写页、汇报查看页逻辑。
 * 通过当前枚举来识别跳转目标。
 *
 * 在后端侧还有周报日报定时、超时邮件提醒，因此这些枚举在后端已经写死。因此：
 *
 * 千万不要修改枚举值.......
 * 千万不要修改枚举值.......
 * 千万不要修改枚举值.......
 */
export enum AppsControlFlag {
  appDailyReportWrite = 'appDailyReportWrite',
  appWeeklyReportWrite = 'appWeeklyReportWrite',
  appViewMoreReports = 'appViewMoreReports',
}

export const createAppsControlLink = (
  controlFlag: AppsControlFlag,
  data?: {
    [key: string]: any;
  }
) => {
  try {
    const payload = data ? encodeURIComponent(JSON.stringify(data)) : '';
    const controlLink = `https://router.lx.netease.com/sirius/desktop/unitableReport?siriusLinkControlFlag=${controlFlag}&siriusLinkControlPayload=${payload}`;
    return controlLink;
  } catch (error) {
    console.error(error);
    return '';
  }
};

interface IntiteEmailProps {
  contentLink: string;
  contentImg: string;
  title: string;
}

export type ReportType = 'daily' | 'weekly';

const createInviteEmailContentHTML = (data: IntiteEmailProps) => {
  const result = `
  <div>
        <div style="
            font-family: 'PingFang SC';
            font-style: normal;
            font-weight: 400;
            font-size: 14px;
            line-height: 160%;
            color: #262A33;
        ">
            <div>您好,</div>
            <div>您有一封${data.title}待填写，请点击下方内容进入</div>
        </div>
        <a style="
            display: block;
            margin-top: 16px;
            width: 420px;
            height: 300px;
            border-radius: 8px;
            overflow: hidden;
            background: url('${data.contentImg}') no-repeat center,
                linear-gradient(92.27deg, #F5F4F4 0.28%, rgba(237, 236, 236, 0.53) 95.87%);
            background-size: 100% 100%;
        " href="${data.contentLink}">
        </a>
    </div>
  `;
  return result.replace(/\r\n/g, '').replace(/\n/g, '');
};
/**
 * 唤起邮件填写组件，并初始化邮件内容
 * @param reportType
 */
export const doReportInvite = (reportType: ReportType) => {
  const contentLink = createAppsControlLink(reportType === 'daily' ? AppsControlFlag.appDailyReportWrite : AppsControlFlag.appWeeklyReportWrite, {
    reportEventSource: 'invite',
  });
  let title = '';
  if (reportType === 'daily') {
    title = '日报';
  } else if (reportType === 'weekly') {
    title = '周报';
  }
  // const inviteImage = 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/07/05/e40cbe193e7248a7bfe9789a1a073ac9.png';
  const inviteImage = 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/07/07/93eccfda12194ae99eb6da007a8c830f.png';
  // 日报邀请
  if (apiHolder.env.forElectron) {
    mailApi.doWriteMailFromLink(
      [],
      `您有一封${title}待填写`,
      createInviteEmailContentHTML({
        title,
        contentLink: contentLink,
        contentImg: inviteImage,
        // contentImg: "https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/06/20/274fb2d41e354ce598aa8309b7ac8e94.png"
      })
    );
  } else if (systemApi.isMainPage()) {
    mailApi.doWriteMailFromLink(
      [],
      `您有一封${title}待填写`,
      createInviteEmailContentHTML({
        title,
        contentLink: contentLink,
        contentImg: inviteImage,
        // contentImg: "https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/06/20/274fb2d41e354ce598aa8309b7ac8e94.png"
      })
    );
  }
};
