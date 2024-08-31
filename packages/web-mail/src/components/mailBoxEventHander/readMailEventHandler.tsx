/**
 * 用于readmail独立窗体的通用操作消息处理
 */
/* eslint-disable array-callback-return */
/* eslint-disable max-statements */
import React, { useEffect, useRef, useMemo } from 'react';
import { apiHolder as api, apis, MailApi, MailOperationType, SystemEvent, MailSettingKeys, MailConfApi } from 'api';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { MailActions, useActions, useAppDispatch } from '@web-common/state/createStore';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import useState2RM from '../../hooks/useState2ReduxMock';
import { setCurrentAccount, promiseIsTimeOut } from '../../util';
import { getIn18Text } from 'api';
import { useDebounceEffect, useUpdateEffect } from 'ahooks';

const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;

const MailBoxEventHander: React.FC<any> = props => {
  const { account } = props;
  // 红旗、已读、置顶状态修改
  const setRemarkMail = (mark: boolean, id: string | string[], type: MailOperationType, isThread?: boolean, _account?: string) =>
    MailApi.doMarkMail(mark, id, type, isThread, undefined, undefined, _account);
  /**
   * redux 状态
   */
  // 邮件列表是否处于loading
  const [listLoading, setListLoading] = useState2RM('listLoading', 'doUpdateMailListLoading');
  const refListLoading = useRef(false);
  refListLoading.current = listLoading;
  // 已读未读、红旗，标签等状态修改是否展示toast
  const [__, setHideMessage] = useState2RM('hideMessage', 'doUpdateMsgHideMessage');
  // 标签修改自定义toast文案（成功）
  const [successMsg, setSuccessMsg] = useState2RM('successMsg', 'doUpdateMsgSuccessStr');
  // 标签修改自定义toast文案（失败）
  const [failMsg, setFailMsg] = useState2RM('failMsg', 'doUpdateMsgFailStr');
  const dispatch = useAppDispatch();
  const mailTodoModal = useNiceModal('mailTodo');
  // 分账号存储的文件夹 map
  const [mailTreeStateMap, setTreeState] = useState2RM('mailTreeStateMap', 'doUpdateMailTreeState');
  // 设置 正文-聚合邮件-的展示顺序
  const [, setMergeMailOrderDesc] = useState2RM('mergeMailOrderDesc');
  // 处理红旗邮件消息对应的请求
  const handleRedFlagRequest = (e: SystemEvent<any>) => {
    const { eventData, eventStrData, _account } = e;
    const { mark, id, type, hideMessage } = eventData;
    if (id == null) {
      return false;
    }
    const key = typeof id === 'string' || typeof id === 'number' ? id : id.join(',');
    setHideMessage(!!hideMessage);
    if (id.length <= 0) {
      // TODO: 非空处理过于简单
      console.log(getIn18Text('BIAOJISHIid'));
      return false;
    }
    if (eventStrData === 'mark' || eventStrData === 'unmark') {
      // setCurrentAccount(_account);
      return setRemarkMail(mark, id, type, undefined, _account).then(res => {
        if (res && res.succ) {
          !hideMessage &&
            message.success({
              content: mark ? getIn18Text('BIAOWEIHONGQICHENG') : getIn18Text('QUXIAOHONGQICHENG'),
              duration: 1,
              key,
            });
        } else {
          !hideMessage &&
            message.error({
              content: mark ? getIn18Text('BIAOWEIHONGQISHI') : getIn18Text('QUXIAOHONGQISHI'),
              duration: 1,
              key,
            });
        }
      });
    }
    // 邮件待办
    if (eventStrData === 'defer' || eventStrData === 'undefer') {
      if (eventStrData === 'undefer') {
        // 标记已处理
        // setCurrentAccount(_account);
        MailApi.doMarkMailDefer(id, false, undefined, undefined, _account).then(res => {
          if (res && res.succ) {
            message.success({ content: getIn18Text('YICHULI'), duration: 1, key });
          } else {
            message.error({ content: getIn18Text('CAOZUOSHIBAI\uFF0C11'), duration: 1, key });
          }
        });
      } else if (eventStrData === 'defer') {
        // 稍后处理
        // setCurrentAccount(_account);
        mailTodoModal.show({
          mailId: id,
          isDefer: eventData.isDefer,
          deferTime: eventData.deferTime,
          deferNotice: eventData.deferNotice,
        });
      }
    }
    // 设置优先，智能模式下线
    // if (eventStrData === 'preferred' || eventStrData === 'unpreferred') {
    //   setCurrentAccount(_account);
    //   return setRemarkMail(mark, id, type).then(res => {
    //     if (res && res.succ) {
    //       !hideMessage
    //         && message.success({
    //           content: mark
    //             ? typeof window !== 'undefined'
    //               ? getIn18Text('KEYIZAIYOUXIAN')
    //               : ''
    //             : typeof window !== 'undefined'
    //               ? getIn18Text('YICONGYOUXIANCHU')
    //               : '',
    //           duration: 1,
    //           key
    //         });
    //     } else {
    //       !hideMessage
    //         && message.error({
    //           content: mark
    //             ? typeof window !== 'undefined'
    //               ? getIn18Text('SHEWEIYOUXIANSHI')
    //               : ''
    //             : typeof window !== 'undefined'
    //               ? getIn18Text('QUXIAOYOUXIANSHI')
    //               : '',
    //           duration: 1,
    //           key
    //         });
    //     }
    //   });
    // }
    if (eventStrData === 'read' || eventStrData === 'unread') {
      // setCurrentAccount(_account);
      return setRemarkMail(mark, id, type, undefined, _account).then(res => {
        if (res && res.succ) {
          !hideMessage &&
            message.success({
              content: mark ? getIn18Text('BIAOJIYIDUCHENG') : getIn18Text('BIAOJIWEIDUCHENG'),
              duration: 1,
              key,
            });
        } else {
          !hideMessage &&
            message.error({
              content: mark ? getIn18Text('BIAOJIYIDUSHI') : getIn18Text('BIAOJIWEIDUSHI'),
              duration: 1,
              key,
            });
        }
        return res;
      });
    }
    // 已迁移
    if (eventStrData === 'top' || eventStrData === 'unTop') {
      // setCurrentAccount(_account);
      return setRemarkMail(mark, id, 'top', undefined, _account)
        .then(res => {
          if (res.succ) {
            message.success({
              content: mark ? getIn18Text('YITIANJIAZHIDING') : getIn18Text('YIQUXIAOZHIDING'),
              duration: 1,
              key,
            });
          } else {
            return Promise.reject();
          }
        })
        .catch(() => {
          message.error({
            content: eventStrData === 'top' ? getIn18Text('ZHIDINGSHIBAI') : getIn18Text('QUXIAOZHIDINGSHI'),
            duration: 1,
            key,
          });
        });
    }
  };
  // const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  // 处理标签变动请求
  const handleMailTagChangeRequest = (e: SystemEvent<any>) => {
    const { eventData, eventStrData, _account } = e;
    const { mailList = [] as string[], tagNames = [], successMsg: _successMsg, failMsg: _failMsg, isNewTag } = eventData;
    // 用于回退的记录
    // const id2OldTagMap = {};
    // mailList.forEach((item: MailEntryModel) => {
    //   id2OldTagMap[item.id] = item?.tags || [];
    // });
    // const id = mailList?.map((item: MailEntryModel) => item.entry.id);
    setSuccessMsg(_successMsg);
    setFailMsg(_failMsg);
    if (eventStrData === 'tag' || eventStrData === 'untag') {
      const isAddTag = eventStrData === 'tag';
      // 发送请求
      const req = isAddTag
        ? {
            ids: mailList,
            add: tagNames,
            isNewTag,
          }
        : {
            ids: mailList,
            delete: tagNames,
          };
      const _key = tagNames?.join(',');
      // setCurrentAccount();
      MailApi.updateMessageTags(req, undefined, undefined, _account)
        .then(() => {
          const addTip = isNewTag ? getIn18Text('XINJIANBINGBIAOJI') : getIn18Text('DABIAOQIANCHENGGONG');
          message.success({
            content: successMsg || (eventStrData === 'tag' ? addTip : getIn18Text('QUXIAOBIAOQIANCHENG')),
            duration: 1,
            key: _key,
          });
          if (isNewTag) {
            setTimeout(() => {
              dispatch(
                Thunks.requestTaglist({
                  account: _account,
                })
              );
            }, 2000);
          }
        })
        .catch(() => {
          message.error({
            content: failMsg || (eventStrData === 'tag' ? getIn18Text('DABIAOQIANSHIBAI') : getIn18Text('QUXIAOBIAOQIANSHI')),
            duration: 1,
            key: _key,
          });
        });
    }
  };

  const accountCount = useMemo(() => {
    return Object.keys(mailTreeStateMap)?.length || 0;
  }, [mailTreeStateMap]);

  useUpdateEffect(() => {
    dispatch(Thunks.requestTaglist({}));
  }, [accountCount]);

  // 获取聚合邮件-排序设置
  useEffect(() => {
    mailConfApi.doGetUserAttr([MailSettingKeys.nForward]).then(res => {
      const { ntes_option } = res;
      if (ntes_option) {
        const key = ntes_option[15];
        setMergeMailOrderDesc(!!key);
      }
    });
  }, []);

  // 处理邮件标签的变化
  useMsgRenderCallback('mailTagChanged', ev => {
    try {
      // if (ev) {
      //   if (systemApi.isElectron()) {
      //     if (location.pathname && !locationHelper.testPathMatch('readMail')) {
      //       handleMailTagChangeRequest(ev);
      //     }
      //   } else {
      //     handleMailTagChangeRequest(ev);
      //   }
      // }
      const { eventStrData } = ev;
      // 发送请求
      if (eventStrData === 'tag' || eventStrData === 'untag') {
        handleMailTagChangeRequest(ev);
      }
      // else {
      //     /**
      //      * 处理状态的变更 addTag cleatTag updateTag
      //      * 这些变更不需要发送请求
      //      */
      //     reducer.doUpdateMailTagOper(ev);
      // }
    } catch (e) {
      console.error(e);
    }
  });
  // 已迁移
  // 监听红旗邮件的状态变化
  useMsgRenderCallback('mailStatesChanged', ev => {
    try {
      if (ev && !ev.isStick) {
        const { eventStrData, eventData = {} } = ev;
        const { mark, id, type, hideMessage: _hideMessage } = eventData;
        setHideMessage(!!_hideMessage);
        // tagOnly 参数已经没有实际效果了
        const { tagOnly = false } = eventData;
        handleRedFlagRequest(ev);
        // unTop 操作由于其特殊性，必须等待请求操作完成后在进行列表操作，且只操作邮件列表
        // if (eventStrData === 'top' || eventStrData === 'unTop') {
        //   if (!tagOnly && location.pathname && !location.pathname.includes('readMail')) {
        //     handleRedFlagRequest(ev);
        //   }
        //   return;
        // }
        // if (!tagOnly) {
        //   if (systemApi.isElectron()) {
        //     // 临时处理，
        //     if (location.pathname && !location.pathname.includes('readMail')) {
        //       handleRedFlagRequest(ev);
        //     }
        //   } else {
        //     handleRedFlagRequest(ev);
        //   }
        // }
      }
    } catch (e) {
      console.error(e);
    }
  });
  // 必须，删除等功能依赖文件夹数据
  useEffect(() => {
    promiseIsTimeOut(dispatch(Thunks.refreshFolder({ noCache: false })), 'pc_refreshFolder_timeout', {
      from: 'readMailEventHander',
    });
  }, []);

  return <></>;
};
export default MailBoxEventHander;
