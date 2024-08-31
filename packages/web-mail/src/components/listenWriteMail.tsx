import {
  apiHolder as api,
  apis,
  DataStoreApi,
  MailEntryModel,
  PerformanceApi,
  locationHelper,
  isElectron,
  MailApi,
  AccountApi,
  MailConfApi,
  WriteLetterPropType,
  ContactAndOrgApi,
  DataTrackerApi,
} from 'api';
import cloneDeep from 'lodash/cloneDeep';
import { attachmentDownloadAction } from '@web-common/state/action';
import { transMailContactModel2ContactItem } from '@web-common/utils/contact_util';
import { doGetMailContactModelByContactItem } from '@web-common/state/selector/contact';
import { AppActions, ContactActions } from '@web-common/state/reducer';
import { actions as mailTabActions, MailTabModel, tabType } from '@web-common/state/reducer/mailTabReducer';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import { ViewMail } from '@web-common/state/state';
import { config } from 'env_def';
import store from '@web-common/state/createStore';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';

const mailConfigApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const systemApi = api.api.getSystemApi();
const performanceApi = api.api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

// 回复邮件里面的content没有host，不能在写信正常展示，此处为 /js6/s开头的img URL加上host
// src="/js6/s?func=mbox:getComposeData&sid=Q09AK8S362fEQBFFjKb9VLwtbRYhcsBR&composeId=b4caa8a82418448aa28ce4af6fc908eb&attachId=14"
const delImgHost = (html: string | null | undefined) => {
  if (!html) return '';
  const contextPath = config('contextPath');
  const host = mailConfigApi.getWebMailHost(true);
  if (!host || !isElectron()) return html;
  return html.replaceAll('src="/js6/s', `src="${host}${contextPath}/js6/s`);
};

// 回复/转发 已有相同操作
const findSameOptTab = (originId: string, writeType: WriteLetterPropType) => {
  if (!originId || !writeType) return;
  // 非回复 / 转发
  if (!(writeType.includes('reply') || writeType.includes('forward'))) {
    return false;
  }
  const tabList = store.getState().mailTabReducer.tabList;
  const findTab = tabList.find(item => {
    const { extra } = item;
    if (extra) {
      return extra.originId === originId && extra.writeType === writeType;
    }
    return false;
  });
  return findTab;
};

const findSameMail = (originId: string, writeType: WriteLetterPropType, id: string) => {
  if (!originId || !writeType) return;
  // 非回复 / 转发
  if (!(writeType.includes('reply') || writeType.includes('forward'))) {
    return false;
  }
  const mails = store.getState().mailReducer.mails;
  const findMail = mails.find(item => {
    // 是否针对 原邮件正进行 回复 或者 转发
    // originId 原邮件id
    return item.id === originId && item.writeType === writeType && item.cid === id;
  });
  return findMail;
};

export default (dispatch: any) => {
  const eventApi = api.api.getEventApi();
  const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
  const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
  const storeApi: DataStoreApi = api.api.getDataStoreApi();
  // const mailSigApi: MailSignatureApi = (api.api.requireLogicalApi(apis.mailSignatureImplApi) as unknown) as MailSignatureApi;
  const dataStoreApi: DataStoreApi = api.api.getDataStoreApi() as DataStoreApi;

  const eventId = eventApi.registerSysEventObserver('writeLatter', {
    func: async ({ eventData }) => {
      console.log('realDatarealData', eventData);
      let realData = eventData?.result as MailEntryModel;
      if (!realData) return;
      performanceApi.time({
        statKey: 'write_mail_load',
        statSubKey: `${realData.cid}`,
      });
      const { eventTarget, tabTempId, entry, originMailId, unableRecoverAttCount } = realData;

      // 写信页接收前置校验
      // 写信页只承载带有目标 且 目标是自己 的写信任务
      if (locationHelper.testPathMatch('/writeMail')) {
        if (!eventTarget) return;
        const curWinMsgs = await window.electronLib.windowManage.getCurWindow();
        if (!curWinMsgs) return;
        if (curWinMsgs?.webId !== Number(eventTarget)) return;
      }

      // 主页接收前置校验
      if (locationHelper.isMainPage() && originMailId && entry.writeLetterProp) {
        const findTab = findSameOptTab(originMailId, entry.writeLetterProp);
        const findMail = findTab ? findSameMail(originMailId, entry.writeLetterProp, findTab.id) : false;
        if (findMail) {
          // 1.28版本郭超改动 只有不是mailbox才发送routerChange
          if (!locationHelper.testHrefMatch('#mailbox')) {
            eventApi.sendSysEvent({
              eventName: 'routeChange',
              eventData: {
                name: 'mailbox',
              },
            });
          }
          // !locationHelper.testHrefMatch('#mailbox') &&
          //   eventApi.sendSysEvent({
          //     eventName: 'routeChange',
          //     eventData: {
          //       name: 'mailbox',
          //     },
          //   });
          // 发送创建成功通知
          eventApi.sendSysEvent({
            eventName: 'writePageDataExchange',
            eventStrData: 'writeTabCreated',
            eventData: realData,
          });
          return;
        }
      }
      realData.extraOperate = realData.extraOperate || '';
      let content = '';
      const data = cloneDeep(realData);
      const origContent = delImgHost(data?.entry?.content?.content);
      content += origContent;
      const showContact = dataStoreApi.getSync('showContact')?.data !== 'false';
      data.entry.content.content = content;
      const mailTabModel: MailTabModel = {
        id: data.cid + '' || data.entry.id,
        title: data?.entry?.title || getIn18Text('WUZHUTI'),
        type: (data?.entry?.writeLetterProp as tabType) || tabType.writeCommon,
        closeable: true,
        isActive: true,
      };
      const ccStatusLocalstore = storeApi.getSync('ccStatus').data;
      const bccStatusLocalstore = storeApi.getSync('bccStatus').data;
      dispatch(
        AppActions.doWriteMail({
          ...data,
          status: {
            cc: ['open', undefined].includes(ccStatusLocalstore),
            bcc: bccStatusLocalstore === 'open',
            showContact,
            keyword: '',
            init: false,
            conferenceShow: false,
            conferenceSetting: true,
            praiseMailShow: false,
            praiseMailSetting: false,
            taskMailShow: false,
            taskMailSetting: false,
            puretext: false,
          },
          focusTitle: false,
          writeType: data?.entry?.writeLetterProp,
          resetCont: locationHelper.testPathMatch('/writeMail') && isElectron() ? true : false,
        } as ViewMail)
      );

      if (data?.entry?.writeLetterProp && ['forward', 'forwardAsAttach', 'common'].includes(data?.entry?.writeLetterProp)) {
        // 非 focusto focusContent 设置后并不会真的focus
        // focusto focusContent 需要真的focus
        dispatch(ContactActions.doFocusSelector('focusto'));
      } else {
        dispatch(ContactActions.doFocusSelector('focusContent'));
      }

      // 写信时长，写信停留超过15分钟会记录此点，每15分钟记录一次
      const startTime = new Date().getTime();
      let token = '';
      systemApi.doGetCookies(true).then(cookies => {
        token = cookies.QIYE_TOKEN;
      });
      const writeMailTimer = setInterval(() => {
        const mails = store.getState().mailReducer.mails;
        const mail = mails.find(c => c.cid === data.cid);
        if (!mail) {
          clearInterval(writeMailTimer);
          return;
        }
        try {
          const attSize = mail.entry.attachment?.filter(file => file.inlined).reduce((prev, next) => prev + (next.fileSize || 0), 0);
          systemApi.doGetCookies(true).then(cookies => {
            trackApi.track('pc_mail_write_time', {
              mailSize: mail.totalSize,
              attSize,
              time: new Date().getTime() - startTime,
              composeId: mail.cid,
              reloginOccured: token === cookies.QIYE_TOKEN,
            });
          });
        } catch (error) {
          console.log(error);
        }
      }, 15 * 60 * 1000);
      // 不可恢复附件数目提示
      if (unableRecoverAttCount && unableRecoverAttCount > 0) {
        SiriusModal.warning({
          title: getIn18Text('YOUJIANNEIRONGHUIFUCHENGGONG,YUAN') + unableRecoverAttCount + getIn18Text('GEFUJIANXUYAO'),
          content: '',
          okType: 'primary',
          okText: getIn18Text('QUEDING'),
        });
      }
      // 只有web端，独立的窗体里会调起写信页
      if (!isElectron() && !locationHelper.isMainPage()) {
        dispatch(AppActions.doShowWebWrite(true));
      }
      // 首页 承载开新标签任务
      if (locationHelper.testPathMatch('/')) {
        setTimeout(() => {
          if (tabTempId) {
            dispatch(mailTabActions.doChangeTabById({ id: tabTempId, tabModel: mailTabModel, setCurrent: true }));
          } else {
            dispatch(mailTabActions.doSetTab(mailTabModel));
          }
        });
        !locationHelper.testHrefMatch('#mailbox') &&
          eventApi.sendSysEvent({
            eventName: 'routeChange',
            eventData: {
              name: 'mailbox',
            },
          });
        eventApi.sendSysEvent({
          eventName: 'writePageDataExchange',
          eventStrData: 'writeTabCreated',
          eventData: realData,
        });
      }
      // 转发 再次编辑 邮件 处理附件
      if (
        ['forward', 'forwardAsAttach', 'editDraft', 'edit', 'common', 'reply', 'replyAll', 'replyWithAttach', 'replyAllWithAttach'].includes(
          data?.entry?.writeLetterProp || ''
        ) &&
        data.entry.attachment &&
        data.entry.attachment.length > 0
      ) {
        // 缓存附件用于发信失败重传
        if (data.cid) {
          if (data?.entry?.writeLetterProp === 'forwardAsAttach') {
            // 作为附件转发，需要存草稿，获取草稿箱中的邮件的附件，才能下载重传
            // accountApi.setCurrentAccount({ email: data.mailFormClickWriteMail || '' });
            mailApi
              // .doSaveTemp({ content: data, saveDraft: true, auto: true, _account: data.mailFormClickWriteMail || '' })
              .doSaveTemp({ content: data, saveDraft: true, auto: true, _account: data._account || '' })
              .then(res => {
                return res?.draftId;
              })
              .then(res => {
                if (res) {
                  // accountApi.setCurrentAccount({ email: data.mailFormClickWriteMail || '' });
                  // mailApi.doGetMailContent(res, false, true, undefined, { _account: data.mailFormClickWriteMail }).then(mail => {
                  mailApi.doGetMailContent(res, false, true, undefined, { _account: data._account }).then(mail => {
                    if (mail && mail.entry.attachment && mail.entry.attachment.length > 0) {
                      let value = mail.entry.attachment[0];
                      if (data?.entry?.attachment) value = { ...value, id: data?.entry?.attachment[0].id };
                      dispatch(mailActions.doChangeCacheAttachment({ id: data.cid, type: 'forwardAsAttach', value, operationType: 'add' }));
                    }
                  });
                }
              });
          } else {
            data.entry.attachment.forEach(attachment => {
              if (attachment.inlined) {
                // 内联图片
                dispatch(
                  mailActions.doChangeCacheAttachment({
                    id: data.cid,
                    type: 'originalInlineImg',
                    value: attachment,
                    operationType: 'add',
                    originFileUrl: attachment.fileUrl,
                  })
                );
              } else if (attachment.cloudAttachment) {
                // 灵犀云附件
                dispatch(mailActions.doChangeCacheAttachment({ id: data.cid, type: 'originalCloudFile', value: attachment, operationType: 'add' }));
              } else {
                // 普通附件
                dispatch(mailActions.doChangeCacheAttachment({ id: data.cid, type: 'originalFile', value: attachment, operationType: 'add' }));
              }
            });
          }
        }

        // 将附件添加至attachment redux层
        // 过滤掉在正文中显示的附件
        const filterAttachment = data.entry.attachment.filter(item => !item.inlined);
        filterAttachment.forEach(attachment => {
          const temp = {
            ...attachment,
            mailId: data.cid,
            // 用于重新下载
            downloadContentId: data.entry.id,
            downloadId: attachment.fileUrl + data.entry.id,
            type: 'download', // 需要重新下载 但此逻辑已废弃...
            cloudAttachment: attachment.type === 'netfolder',
          };
          // 添加上附件
          dispatch(
            attachmentDownloadAction(temp, {
              forward: true,
              entryId: data.entry.id,
              cid: data.cid || 0,
            })
          );
        });
      }

      // 刷新写信页的发件人配置
      eventApi.sendSysEvent({
        eventName: 'mailAliasAccountListChange',
        eventData: {
          mailId: data.cid,
        },
      });
      // 请求服务端默认签名接口，如果与本地的数据不同，会通知写信页更新
      // 初始化ininModel的时候，会返回本地存的默认签名，加快初始化的速度，所以这里需要重新调用远端，检查更新
      // accountApi.setCurrentAccount({email: data.mailFormClickWriteMail || ''});
      // mailSigApi.doGetDefaultSign(true, data.cid, data?.entry?.writeLetterProp);

      // 获取默认抄送密送
      mailApi.getDefaultCCBCC().then(async res => {
        const { cc, bcc } = res;
        if (cc && cc.length > 0) {
          const ccContact = await contactApi.doGetContactByEmails(
            cc.map(i => ({ mail: i })),
            'cc'
          );
          const target = ccContact.map(transMailContactModel2ContactItem);
          const receiver = await doGetMailContactModelByContactItem(target, 'cc');
          dispatch(
            mailActions.doModifyReceiver({
              receiver: receiver,
              receiverType: 'cc',
              operation: 'paste',
            })
          );
        }
        if (bcc && bcc.length > 0) {
          const bccContact = await contactApi.doGetContactByEmails(
            bcc.map(i => ({ mail: i })),
            'bcc'
          );
          const target = bccContact.map(transMailContactModel2ContactItem);
          const receiver = await doGetMailContactModelByContactItem(target, 'bcc');
          dispatch(
            mailActions.doModifyReceiver({
              receiver: receiver,
              receiverType: 'bcc',
              operation: 'paste',
            })
          );
        }
      });
    },
  });

  // 创建tab 之后取到内容后替换
  eventApi.registerSysEventObserver('preCreateWriteTab', {
    func: async ({ eventData }) => {
      // 首页 承载开新标签任务
      if (locationHelper.testPathMatch('/')) {
        const { tabTempId, originId, writeType } = eventData;
        const findTab = findSameOptTab(originId, writeType);
        if (findTab) {
          // 切换
          dispatch(mailTabActions.doChangeCurrentTab(findTab.id));
          return;
        }
        const mailTabModel: MailTabModel = {
          id: tabTempId,
          title: '加载中...',
          type: tabType.temp,
          closeable: true,
          isActive: true,
          extra: {
            originId,
            writeType,
          },
        };
        dispatch(mailTabActions.doSetTab(mailTabModel));
      }
    },
  });

  // 销毁tab
  eventApi.registerSysEventObserver('destoryWriteTab', {
    func: async ({ eventData }) => {
      console.log('destoryWriteTabdestoryWriteTab', eventData);
      // 首页
      if (locationHelper.testPathMatch('/')) {
        const { originId, writeType } = eventData;
        const findTab = findSameOptTab(originId, writeType);
        if (findTab) {
          SiriusMessage.error({ content: '创建失败' });
          dispatch(mailTabActions.doCloseTab(findTab.id));
          return;
        }
      }
    },
  });

  return eventId;
};
