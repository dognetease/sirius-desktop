/*
 * 功能：请求与处理 邮件阅读状态，邮件打开记录的业务逻辑
 * 多个组件复用，所以抽离出来
 */
import { useRef, useCallback, useState } from 'react';
import {
  apiHolder as api,
  apis,
  MailEntryModel,
  MailConfApi,
  MailOperationType,
  SystemApi,
  inWindow,
  MailApi,
  MailEmoticonInfoModel,
  apiHolder,
  HtmlApi,
  TranslatStatusInfo,
  getIn18Text,
  AccountApi,
  DataStoreApi,
  MailDeliverStatusItem,
  ProductAuthApi,
} from 'api';
import { MailStatus, OpenRecord, OpenRecordData, formatReadStatus, MailItemStatus } from '@web-mail/util';
import lodashGet from 'lodash/get';
import useDebounceForEvent from '@web-common/hooks/useDebounceForEvent';
import useStateRef from '@web-mail/hooks/useStateRef';
import { FLOLDER } from '@web-mail/common/constant';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';

const systemApi = api.api.getSystemApi() as SystemApi;
const mailManagerApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const htmlApi = apiHolder.api.requireLogicalApi(apis.htmlApi) as HtmlApi;
const eventApi = api.api.getEventApi();
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const storeApi: DataStoreApi = api.api.getDataStoreApi();
const productAuthApi = api.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;

const useGetReadStatus = (content?: MailEntryModel) => {
  // 获取邮件阅读状态
  const [openRecordData, setOpenRecordData] = useState<OpenRecordData>();
  //
  const [readStatus, setReadStatus] = useState<MailStatus>();

  // 根据版本获取阅读状态
  const formatReadStatusByProduct = (list: MailDeliverStatusItem[]) => {
    const listData = formatReadStatus(list);
    const versionId = productAuthApi.doGetProductVersionId();
    // 尊享版
    if (versionId === 'sirius') {
      const stateTrack = storeApi.getSync('stateTrack').data;
      // 域外追踪如果关闭 域外的阅读状态视为未知
      if (stateTrack === 'OFF') {
        // 内域列表
        const domainList = lodashGet(systemApi.getCurrentUser(), 'prop.domainList', []);
        listData.data = (listData.data || []).map((listItem: MailItemStatus) => {
          const item = { ...listItem };
          const { email } = item;
          if (email) {
            const suffix = email.split('@')[1];
            // 外域
            if (suffix && !domainList.includes(suffix)) {
              item.status = 'outdomain';
              item.text = getIn18Text('EMAIL_READ_STATUS_SERVER_RECEIVE');
              item.color = '';
            }
          }
          return item;
        });
      }
      return listData;
    }
    if (versionId === 'free') {
      if (listData.data) {
        listData.data.forEach(item => {
          item.status = 'unkown';
          if (item.result === 109) {
            item.text = getIn18Text('EMAIL_READ_STATUS_SERVER_RECEIVE');
          }
          item.color = '';
        });
      }
    } else {
      if (listData.data) {
        listData.data.forEach(item => {
          if (!item?.inner) {
            item.status = 'unkown';
            if (item.result === 109) {
              item.text = getIn18Text('EMAIL_READ_STATUS_SERVER_RECEIVE');
            }
            item.color = '';
          }
        });
      }
    }
    return listData;
  };

  const getMailReadCount = async (content: MailEntryModel) => {
    const { id, entry, sender } = content || {};
    const { tid } = entry;
    try {
      // setCurrentAccount(mailAccount);
      const res = await mailApi.doGetMailReadCount({
        mid: id,
        tid,
        fromEmail: sender.contact.contact.accountName,
        _account: content?._account,
      });
      console.log('getMailReadCount', res);
      const { code, data, message } = res;
      if (code === 0) {
        if (data.count === 1) {
          getMailReadDetail(content);
        } else {
          setOpenRecordData({
            count: data.count || 0,
            records: [],
          });
        }
        return;
      }
      console.log('doGetMailReadCount fail', message);
      setOpenRecordData({ count: 0, records: [] });
    } catch (error) {
      console.log('doGetMailReadCount error', error);
      setOpenRecordData({ count: 0, records: [] });
    }
  };

  const getMailReadDetail = async (content: MailEntryModel) => {
    const { id, entry, sender } = content || {};
    const { tid } = entry;
    try {
      // setCurrentAccount(mailAccount);
      const res = await mailApi.doGetMailReadDetail({
        mid: id,
        tid,
        fromEmail: sender.contact.contact.accountName,
        _account: content?._account,
      });
      console.log('getMailReadDetail', res);
      const { code, data, message } = res;
      if (code === 0) {
        const systemTimeZone = systemApi.getSystemTimeZone();
        if (systemTimeZone) {
          const records = data.readList || [];
          const dealedRecords: OpenRecord[] = [];
          const now = moment();
          records.forEach((item: OpenRecord) => {
            let settingTime = '';
            if (item.currentLocalTime) {
              const settingMoment = systemApi.timeZoneTrans(item.currentLocalTime, 8, systemTimeZone.key);
              // 同一年展示月日
              if (now.year() === settingMoment?.year()) {
                settingTime = settingMoment?.format('MM-DD HH:mm') || '';
                // 远端时间一起改
                item.remoteLocalTime = item.remoteLocalTime ? moment(item.remoteLocalTime).format('MM-DD HH:mm') || '' : '';
              } else {
                // 跨年 展示年月日
                settingTime = settingMoment?.format('YYYY-MM-DD HH:mm') || '';
              }
            }
            dealedRecords.push({
              ...item,
              settingTime,
              settingTimeZone: systemTimeZone?.value,
            });
          });
          setOpenRecordData({
            count: dealedRecords.length,
            records: dealedRecords,
          });
          return;
        }
      }
      console.log('doGetMailReadDetail fail', message);
      setOpenRecordData({ count: 0, records: [] });
    } catch (error) {
      console.log('doGetMailReadDetail error', error);
      setOpenRecordData({ count: 0, records: [] });
    }
  };

  const getReadStatus = async (content: MailEntryModel) => {
    try {
      // 获取当前用户账户别名
      const currentUser = systemApi.getCurrentUser(content?._account);
      const accountAlias = currentUser?.prop?.accountAlias || [];
      const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];

      // 检查邮件是否由当前用户发送
      const sender = content?.sender;
      const isMySend = accountAliasArray.some(item => {
        return accountApi.getIsSameSubAccountSync(item, sender?.contact?.contact?.accountName);
      });

      // 确定用于检查阅读状态的电子邮件 ID
      let emailId = content.id;
      if (isMySend) {
        emailId = content?.entry?.sentMailId || content.id;
      }

      // 获取阅读状态信息
      const readStatusData = await mailApi.doCheckReadStatus(emailId, content?._account);
      const formattedReadStatus = formatReadStatusByProduct(readStatusData.detail);
      setReadStatus(formattedReadStatus);
    } catch (error) {
      console.error(`获取邮件阅读状态失败：${error}`);
    }
  };

  const getStatusOrDetail = (content: MailEntryModel) => {
    if (!content) return;
    const { isTpMail, authAccountType } = content || {};
    // 发信箱(只要是发件即可) 非Tp
    const accountAlias = systemApi.getCurrentUser(content?._account)?.prop?.accountAlias || [];
    const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];
    const senderEmail = content?.sender?.contact?.contact?.accountName || '';
    // 在发件箱 || 别名邮箱里面包含发件人 || 发件人 == 归属账号， 认为是自己发出的
    const isSend =
      content?.entry?.folder === FLOLDER.SENT ||
      accountAliasArray.some(account => accountApi.getIsSameSubAccountSync(account, senderEmail)) ||
      accountApi.getIsSameSubAccountSync(senderEmail, content._account);
    if (isSend && !isTpMail) {
      // 非正式
      if (authAccountType && authAccountType !== '0') {
        getMailReadCount(content);
        return;
      }
      // 其他
      getReadStatus(content);
    }
  };

  const debounceGetStatusOrDetail = useDebounceForEvent((content: MailEntryModel) => {
    if (!content) return;
    getStatusOrDetail(content);
  }, 500);

  // 监听外部消息阅读状态变更消息
  useMsgRenderCallback('mailMenuOper', ev => {
    if (ev?.eventStrData === 'retractEmailSuccess' && content) {
      const { id } = ev.eventData;
      if (id === content?.id) {
        debounceGetStatusOrDetail(content);
      }
    }
  });

  return {
    openRecordData,
    setOpenRecordData,
    readStatus,
    setReadStatus,
    debounceGetStatusOrDetail,
    getStatusOrDetail,
    formatReadStatusByProduct,
    getMailReadDetail,
  };
};

export default useGetReadStatus;
