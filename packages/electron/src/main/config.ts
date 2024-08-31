import { app } from 'electron';
import path from 'path';
import { getOs } from './../util/osConf';
import { bkPage, profile } from 'envDef';

const bkInitFileName = bkPage;
// export const isMac = process.platform === 'darwin';
export const isMac = getOs() === 'mac'; // process.platform === 'darwin';
export const isWeb = process.env.NODE_ENV === 'web';
export const rootURL = __dirname.replace(/\\/g, '/');
const profileStr = profile;
export const isEdm = !!profileStr && profileStr.startsWith('edm');

export const appIconPath = path.join(rootURL, 'static/tray.png');

export const mainURL = 'sirius://sirius.page/index.html';
export const webURL = 'https://su-desktop-web.cowork.netease.com:8000';
export const QIYEURL = '/static/qiyeurs/#/info'; // 密保平台

// export const webURL = 'https://sirius-desktop-web.cowork.netease.com/';
export const webWriteURL = webURL + '/writeMail';
export const webReadURL = webURL + '/readMail';
export const webMarketingDataViewURL = webURL + '/marketingDataViewer';
export const webReadMailReadOnly = webURL + '/readMailReadOnly';
export const webReadOnlyUniversal = webURL + '/readOnlyUniversal';
export const loginURL = 'sirius://sirius.page/login';
export const webLoginURL = webURL + '/login';

export const webReadMailCombUrl = webURL + '/readMailComb';
export const webstrangerMailsUrl = webURL + '/strangerMails';
export const webUpdateURL = webURL + '/update';
export const webImgPreviewPageURL = webURL + '/imgPreviewPage';
// export const webNotificationPageURL = webURL + '/notificationPage';
export const webAttachmentPreviewPageURL = webURL + '/attachment_preview';
export const webShareURL = webURL + '/share';
export const webSheetURL = webURL + '/sheet';
export const webUnitableURL = webURL + '/unitable';
export const webScheduleReminderURL = webURL + '/scheduleReminder';
export const webDownloadReminderURL = webURL + '/downloadReminder';
export const webAdvertisingURL = webURL + '/advertisingReminder';
export const webResourcesURL = webURL + '/resources';
export const webDocURL = webURL + '/doc';
export const webCluePreviewURL = webURL + '/cluePreview';
export const webOpenSeaPreviewURL = webURL + '/openSeaPreview';

export const webCustomerPreviewURL = webURL + '/customerPreview';
export const webOpportunityPreviewURL = webURL + '/opportunityPreview';
export const webIframePreviewURL = webURL + '/iframePreview';

export const webScheduleOpPageURL = webURL + '/scheduleOpPage';
export const webKfURL = webURL + '/kf';
// export const webDomain = 'cowork.netease.com';

export const writeMailURL = 'sirius://sirius.page/writeMail';
export const readMailCombUrl = 'sirius://sirius.page/readMailComb';
export const strangerMailsUrl = 'sirius://sirius.page/strangerMails';
export const readMailURL = 'sirius://sirius.page/readMail';
export const marketingDataViewURL = 'sirius://sirius.page/marketingDataViewer';
export const readMailReadOnlyURL = 'sirius://sirius.page/readMailReadOnly';
export const readOnlyUniversalURL = 'sirius://sirius.page/readOnlyUniversal';
export const imgPreviewPageURL = isEdm ? 'sirius://sirius.page/imgPreviewPage' : 'sirius://sirius.page/imgPreview/imgPreviewPage';
// export const notificationPageURL = 'sirius://sirius.page/electronNotification';
export const attachmentPreviewPageURL = 'sirius://sirius.page/attachment_preview';

export const updateURL = 'sirius://sirius.page/update';
export const shareURL = 'sirius://sirius.page/share';
export const sheetURL = 'sirius://sirius.page/sheet';
export const unitableURL = 'sirius://sirius.page/unitable';
export const resourcesURL = 'sirius://sirius.page/resources';
export const scheduleReminderURL = 'sirius://sirius.page/scheduleReminder';
export const downloadReminderURL = 'sirius://sirius.page/downloadReminder';
export const advertisingURL = 'sirius://sirius.page/advertisingReminder';

export const docURL = 'sirius://sirius.page/doc';
export const scheduleOpURL = 'sirius://sirius.page/scheduleOpPage';
export const kfURL = 'sirius://sirius.page/kf';
export const userDataPath = app.getPath('userData');

export const cluePreviewURL = 'sirius://sirius.page/cluePreview';
export const openSeaPreviewURL = 'sirius://sirius.page/openSeaPreview';
export const uniTabsPreviewURL = `sirius://sirius.page/uniTabsPreview`;
export const customerPreviewURL = 'sirius://sirius.page/customerPreview';
export const opportunityPreviewURL = 'sirius://sirius.page/opportunityPreview';
export const iframePreviewURL = 'sirius://sirius.page/iframePreview';

export const webMailUrl = webURL + '/mail/';
export const mailUrl = 'sirius://sirius.page/mail/index.html';

export const webImUrl = webURL + '/im/';
export const imUrl = 'sirius://sirius.page/im/index.html';

export const webAsyncapiUrl = webURL + '/asyncapi/';
export const asyncapiUrl = 'sirius://sirius.page/asyncapi/index.html';

export const webScheduleUrl = webURL + '/schedule/';
export const scheduleUrl = 'sirius://sirius.page/schedule/index.html';

export const webDiskUrl = webURL + '/disk/';
export const diskUrl = 'sirius://sirius.page/disk/index.html';

export const webContactUrl = webURL + '/contact/';
export const contactUrl = 'sirius://sirius.page/contact/index.html';

export const webFeedbackURL = webURL + '/feedback';
export const feedbackURL = 'sirius://sirius.page/feedback';

export const webAboutURL = !isEdm ? `file://${rootURL}/static/about.html` : `file://${rootURL}/static/about_waimao.html`;
export const webCaptureURL = !isEdm ? `file://${rootURL}/static/captureScreen/capture.html` : `file://${rootURL}/static/captureScreen/capture.html`;
export const aboutURL = !isEdm ? `file://${rootURL}/static/about.html` : `file://${rootURL}/static/about_waimao.html`;
export const captureURL = !isEdm ? `file://${rootURL}/static/captureScreen/capture.html` : `file://${rootURL}/static/captureScreen/capture.html`;

// export const webBkInitUrl = `file://${rootURL}/` + bkInitFileName;
export const bkInitUrl = 'sirius://sirius.page/' + bkInitFileName;
export const bkStableUrl = `file://${rootURL}/api.html`;

const localHost = 'sirius://sirius.page';
const addAcountUrlPath = 'add-account/index.html';
export const addAccountUrl = `${localHost}/${addAcountUrlPath}`;
export const webAddAccountUrl = `${webURL}/${addAcountUrlPath}`;

const changePwdUrlPath = 'change-pwd/index.html';
export const changePwdUrl = `${localHost}/${changePwdUrlPath}`;
export const webChangePwdUrl = `${webURL}/${changePwdUrlPath}`;

const subAccountBgUrlPath = 'account-bg.html';
export const subAccountBgUrl = `${localHost}/${subAccountBgUrlPath}`;
export const webSubAccountBgUrl = `${webURL}/${subAccountBgUrlPath}`;
// export const webCluePreviewURL = webURL + '/cluePreview';
// export const webOpenSeaPreviewURL = webURL + '/openSeaPreview';
// export const webCustomerPreviewURL = webURL + '/customerPreview';
// export const webOpportunityPreviewURL = webURL + '/opportunityPreview';
// export const webIframePreviewURL = webURL + '/iframePreview';
// export const cluePreviewURL = 'sirius://sirius.page/cluePreview';
// export const openSeaPreviewURL = 'sirius://sirius.page/openSeaPreview';
// export const customerPreviewURL = 'sirius://sirius.page/customerPreview';
// export const opportunityPreviewURL = 'sirius://sirius.page/opportunityPreview';
// export const iframePreviewURL = 'sirius://sirius.page/iframePreview';

export const webPersonalWhatsappUrl = webURL + '/personalWhatsapp';
export const personalWhatsappUrl = 'sirius://sirius.page/personalWhatsapp';
