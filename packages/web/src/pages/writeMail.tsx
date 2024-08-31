import React, { useEffect, useRef, useState, useMemo } from 'react';
import { message } from 'antd';
import { PageProps } from 'gatsby';
import { apiHolder as api, apis, DataStoreApi, inWindow, MailApi, MailEntryModel, SystemApi, WriteMailInitModelParams, getIn18Text } from 'api';
import WritePage from '@web-mail-write/WritePage';
import NeedTempDialog from '@web-mail/components/NeedTempDialog';
import { TemplateAddModal } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';
import '../styles/global.scss';
import listenWriteMail from '@web-mail/components/listenWriteMail';
import PaidGuidemodule, { useFreeWriteMailErrorHandler } from '@web-mail/components/PaidGuideModal/index';
import TinymceTooltip from '@web-common/components/UI/TinymceTooltip/TinymceTooltip';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import ErrorBoundary from '@web-common/hooks/ErrorBoundary';
import debounce from 'lodash/debounce';
import { Attachment, ViewMail } from '@web-common/state/state';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { assingUnitableApiMethods } from '@web-unitable-crm/penpal-bridge/l2c-bridge';
// import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import SiriusLayout from '../layouts';
// import UniDrawerWrapper from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
// import { UniDrawerOpportunity } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer2';

// 写信独立页，用到了l2c-crm模块，因此需要在这里引入
assingUnitableApiMethods({});
console.info('---------------------from write letter page------------------');
const buildFor = api.env.forElectron;
const systemApi = api.api.getSystemApi() as SystemApi;
const storeApi: DataStoreApi = api.api.getDataStoreApi();
const inElectron = systemApi.isElectron();
const isMac = inElectron ? window.electronLib.env.isMac : api.env.isMac;
const WriteMailPage: React.FC<PageProps> = () => {
  const eventApi = api.api.getEventApi();
  const currentMail = useAppSelector(state => state.mailReducer.currentMail);
  const currentMailRef = useRef<ViewMail>(currentMail);
  currentMailRef.current = currentMail;
  const { attachments } = useAppSelector(state => state.attachmentReducer);
  const attachmentsRef = useRef<Attachment[]>(attachments);
  attachmentsRef.current = attachments;
  const title = useAppSelector(state => state.mailReducer.currentMail.entry?.title);
  const dispatch = useAppDispatch();
  const writePageRef = useRef<any>(null);
  const { doChangeMail } = mailActions;
  const [opening, setOpening] = useState<boolean>(false);
  const openingRef = useRef<boolean>(opening);
  openingRef.current = opening;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [execAutoSaveDraft, setExecAutoSaveDraft] = useState<boolean>(false);
  const optSender = useMemo(() => currentMailRef.current?.optSender, [currentMailRef.current]);
  const initSenderStr = useMemo(() => currentMailRef.current?.initSenderStr, [currentMailRef.current]);
  // uni 客户弹窗
  // const [uniCustomerParam, setUniCustomerParam] = useState2RM('uniCustomerParam');
  // uni 商机弹窗
  // const [uniOpportunityParam, setUniOpportunityParam] = useState2RM('uniOpportunityParam');

  const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
  const electronClose = () => {
    writePageRef?.current?.resetSideState();
    setExecAutoSaveDraft(false);
    setTimeout(() => {
      api.api.getSystemApi().closeWindow();
    }, 50);
  };

  const preHandler = useFreeWriteMailErrorHandler();
  useCommonErrorEvent('writeMailErrorOb', undefined, preHandler);

  // 关闭前置操作
  const befCloseCurWin = async (mail: MailEntryModel) => {
    const needSave = await mailApi.doNeedSaveTemp(mail as MailEntryModel);
    if (needSave) {
      setIsModalVisible(true);
      return false;
    }
    return true;
  };
  // 关闭当前窗口
  const closeCurWin = () => {
    setIsModalVisible(false);
    electronClose();
  };
  useMsgRenderCallback('electronClose', async () => {
    try {
      const latestCont = writePageRef?.current?.forceSave(); // 最新邮件主题内容
      const cloneMail = JSON.parse(JSON.stringify(currentMail));
      cloneMail?.entry?.content?.content && (cloneMail.entry.content.content = latestCont);
      const judgeRes = await befCloseCurWin(cloneMail);
      judgeRes && closeCurWin();
    } catch (error) {
      console.error(getIn18Text('GUANBIXIEXINYE'), error);
    }
  });
  useMsgRenderCallback('electronActive', () => {
    setExecAutoSaveDraft(true);
  });
  useMsgRenderCallback('electronBlur', () => {
    setExecAutoSaveDraft(false);
  });
  useMsgRenderCallback('writePageDataExchange', e => {
    switch (e?.eventStrData) {
      case 'sending':
        setExecAutoSaveDraft(false);
        break;
      case 'sendFailed':
        setExecAutoSaveDraft(true);
        break;
      case 'sendSucceed':
        setExecAutoSaveDraft(false);
        break;
      case 'scheduleDateSucceed':
        setExecAutoSaveDraft(false);
        break;
      case 'initData':
        setExecAutoSaveDraft(true);
        // handleSubWindowInitData(e.eventData);
        break;
      default:
        break;
    }
  });
  useEffect(() => {
    const eventId = listenWriteMail(dispatch);
    mailApi.electronLoaded();
    return () => {
      eventApi.unregisterSysEventObserver('writeLatter', eventId);
      setExecAutoSaveDraft(false);
    };
  }, []);
  // 页面title
  const getTitle = (writeLetterProp: string | undefined, text: string) => {
    switch (writeLetterProp) {
      case 'reply':
        return `回复邮件-${text}`;
      case 'replyAll':
        return `回复全部-${text}`;
      case 'common':
        return text ? `写邮件-${text}` : getIn18Text('XIEYOUJIAN');
      case 'forward':
        return `转发邮件-${text}`;
      case 'editDraft':
        return `编辑邮件-${text}`;
      default:
        return getIn18Text('XIEYOUJIAN');
    }
  };
  const backToTabsAction = () => {
    if (openingRef.current) return;
    setOpening(true);
    // 有附件在上传中
    // eslint-disable-next-line max-len
    if (
      attachmentsRef.current.some(
        attachment => attachment.mailId === currentMailRef.current.cid && attachment.status && attachment.status !== 'success' && attachment.type !== 'download'
      )
    ) {
      // @ts-ignore
      message.open({
        content: getIn18Text('FUJIANSHANGCHUANZHONG'),
        className: 'msg-custom-class',
      });
      setOpening(false);
      return;
    }
    // 唤起tab写信页
    // TODO 测试是否成功！
    const curAttachments = attachmentsRef.current.filter(item => item.mailId === currentMailRef.current.cid);
    const objAttachments = curAttachments.map(item => {
      const tmp = {};
      // 剔除file的无用属性
      // eslint-disable-next-line no-restricted-syntax
      for (const i in item) {
        if (typeof item[i] !== 'function' && i !== 'arrayBuffer') {
          tmp[i] = item[i];
        }
      }
      return tmp;
    });
    curAttachments && storeApi.putSync('curAttachments', JSON.stringify(objAttachments));
    // 发送中 附件中 待补充
    const current = {
      ...currentMailRef.current,
      entry: {
        ...currentMailRef.current.entry,
        attachments: objAttachments,
        attachmentCount: objAttachments.length,
        withoutPlaceholder: true,
      },
      ...{ _account: initSenderStr },
    };
    mailApi
      .doSaveTemp({ content: current, saveDraft: true, auto: false })
      .then(res => {
        const { cid, _id, draftId } = res;
        if (cid) {
          // 保留draftId和_id
          const draftedMail = {
            ...currentMail,
            _id,
            draftId,
          };
          dispatch(doChangeMail(draftedMail as ViewMail));
        }
        // 强制保存currentMail
        writePageRef?.current?.forceSave();
        const params: WriteMailInitModelParams = {
          id: draftId,
          mailType: 'draft',
          writeType: 'editDraft',
          withoutPlaceholder: true,
          optSenderStr: optSender?.id || '',
          appointAccount: initSenderStr,
        };
        mailApi.callWriteLetterFunc(params);
        // 关闭当前窗口
        closeCurWin();
        setTimeout(() => setOpening && setOpening(false), 500);
      })
      .catch(err => {
        console.log(getIn18Text('FANHUIYEQIANSHI'), err);
        setOpening(false);
        // @ts-ignore
        message.open({
          content: `返回页签失败${err?.title ? `:${err.title}` : ''}`,
        });
      });
  };
  // 回到页签
  const backToTabs = debounce(() => {
    if (!inElectron) return;
    if (openingRef.current) return;
    backToTabsAction();
  }, 500);
  // 设置页面title
  useEffect(() => {
    inWindow() && (window.document.title = getTitle(currentMail?.entry?.writeLetterProp, title));
  }, [title]);
  useEffect(() => {
    let search = window.location.hash;
    if (!search) {
      return;
    }
    search = search.slice(1);
    const searchAry = search.split('&');
    const initData = {};
    searchAry.forEach(item => {
      const itemAry = item.split('=');
      initData[itemAry[0]] = itemAry[1];
    });
    mailApi.initModel(initData).then((data: MailEntryModel) => {
      dispatch(mailActions.doWriteMail(data as any));
      dispatch(mailActions.doChangeCurrentMail(data?.cid));
    });
  }, []);

  // 监听账号失效和移除
  useEffect(() => {
    // 监听多账号删除，匹配则直接关闭
    const subAccountDeletedOb = eventApi.registerSysEventObserver('SubAccountDeleted', {
      func: ev => {
        try {
          if (ev) {
            const { eventData } = ev;
            const { agentEmail } = eventData;
            // 如果当前独立页对应的账号，是失效的账号，则提示
            if (initSenderStr === agentEmail) {
              // 关闭当前窗口
              closeCurWin();
            }
          }
        } catch (e) {
          console.error(e);
        }
      },
    });
    // 监听多账号过期
    const subAccountExpiredOb = eventApi.registerSysEventObserver('SubAccountLoginExpired', {
      func: ev => {
        try {
          if (ev) {
            const { eventData } = ev;
            const { agentEmail } = eventData;
            // 如果当前独立页对应的账号，是失效的账号，则提示
            if (initSenderStr === agentEmail) {
              accountExpiredTip();
            }
          }
        } catch (e) {
          console.error(e);
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('SubAccountDeleted', subAccountDeletedOb);
      eventApi.unregisterSysEventObserver('SubAccountLoginExpired', subAccountExpiredOb);
    };
  }, [initSenderStr]);

  // 账号失效弹窗
  const accountExpiredTip = () => {
    const md = SiriusModal.info({
      title: getIn18Text('accountExpiredTip'),
      okCancel: !0,
      cancelText: getIn18Text('QUXIAO'),
      onCancel: () => {
        md.destroy();
      },
      okText: getIn18Text('recheck'),
      onOk: () => {
        // 发送事件操作主窗口跳转到设置页
        eventApi.sendSysEvent({
          eventName: 'routeChange',
          eventStrData: 'gatsbyStateNav',
          eventData: {
            url: '/#setting',
            state: {
              currentTab: 'mail',
              mailConfigTab: 'OTHER',
            },
          },
        });
        // 当前销毁
        md.destroy();
      },
    });
  };

  // 外贸环境下的客户弹窗和商机弹窗
  // const customerIframe = process.env.BUILD_ISEDM ? (
  //   <>
  //     {/* 客户弹窗 */}
  //     <UniDrawerWrapper
  //       visible={uniCustomerParam.visible}
  //       source={uniCustomerParam.source}
  //       customerData={uniCustomerParam.customerData}
  //       customerId={uniCustomerParam.customerId}
  //       uniType={uniCustomerParam?.uniType}
  //       contactId={uniCustomerParam?.contactId}
  //       onClose={() => {
  //         if (uniCustomerParam.onClose) {
  //           uniCustomerParam.onClose();
  //         }
  //         setUniCustomerParam({ visible: false, source: uniCustomerParam.source });
  //       }}
  //       onSuccess={(...arg) => {
  //         if (uniCustomerParam.onSuccess) {
  //           uniCustomerParam.onSuccess(...arg);
  //         }
  //         setUniCustomerParam({ visible: false, source: uniCustomerParam.source });
  //       }}
  //     />
  //     {/* 商机弹窗 */}
  //     {/* <UniDrawerOpportunity
  //       {...uniOpportunityParam}
  //       onSuccess={() => {
  //         if (uniOpportunityParam.onSuccess) {
  //           uniOpportunityParam.onSuccess();
  //         }
  //         setUniOpportunityParam({ visible: false });
  //       }}
  //       onClose={shouleUpdate => {
  //         if (uniOpportunityParam.onClose) {
  //           uniOpportunityParam.onClose(shouleUpdate);
  //         }
  //         setUniOpportunityParam({ visible: false });
  //       }}
  //     /> */}
  //   </>
  // ) : (
  //   <></>
  // );

  const isSendAttachmentPage = mailApi.getIsSendAttachmentWritePage();

  return (
    <>
      {buildFor ? (
        <SiriusLayout.ContainerLayout isLogin={false} pages="writeMail">
          <>
            <TinymceTooltip />
            <ErrorBoundary name="writeMail">
              {/* 桌面端才展示 */}
              {/* mac放右边（mac的操作区在左边） win放左边（win的操作区在右边） */}
              {inElectron && !isSendAttachmentPage && (
                <span
                  className="back-to-tabs"
                  style={
                    isMac
                      ? { right: '16px' }
                      : {
                          top: 0,
                          right: '136px',
                          lineHeight: '32px',
                        }
                  }
                  onClick={backToTabs}
                >
                  {getIn18Text('HUIDAOYEQIAN')}
                </span>
              )}
              <WritePage ref={writePageRef} execAutoSaveDraft={execAutoSaveDraft} cond="writeMail" />
            </ErrorBoundary>
            <ErrorBoundary>
              <TemplateAddModal />
            </ErrorBoundary>
            <ErrorBoundary>
              <PaidGuidemodule />
            </ErrorBoundary>
            <NeedTempDialog
              isModalVisible={isModalVisible}
              onNotSave={() => {
                setIsModalVisible(false);
                electronClose();
              }}
              onSave={() => {
                electronClose();
              }}
              needSaveMails={[currentMail as MailEntryModel]}
              setIsModalVisible={val => {
                setIsModalVisible(val);
              }}
              currentMailId={0}
            />
            {/* {customerIframe} */}
          </>
        </SiriusLayout.ContainerLayout>
      ) : null}
    </>
  );
};
export default WriteMailPage;
console.info('---------------------end write mail page------------------');
