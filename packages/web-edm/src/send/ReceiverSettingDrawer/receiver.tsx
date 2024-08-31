import React, { useEffect, useState, useRef, useImperativeHandle, useMemo } from 'react';
import { Form, Tooltip, Col, List, Skeleton, Checkbox } from 'antd';
import {
  apiHolder,
  SendStepProps,
  ReceiverInfoModel,
  EdmSendConcatInfo,
  ResponseFilterCount,
  SecondSendStrategy,
  SmartMarketingProps,
  DataStoreApi,
  OneClickMarketingPrevScene,
  TaskChannel,
  CheckEmailAddressInfo,
} from 'api';
import { AddContactModal } from './addContact';
import style from './receiver.module.scss';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import InfiniteScroll from 'react-infinite-scroll-component';
import { edmDataTracker } from '../../tracker/tracker';
import { errorContactStatusList, warningContactStatusList } from '../validEmailAddress/util';
import { ReactComponent as PlusIcon } from '@/images/icons/edm/yingxiao/plus-icon.svg';
import { ReactComponent as CloseIcon } from '@/images/icons/edm/yingxiao/close-icon.svg';
import { ReactComponent as TipsIcon } from '@/images/icons/edm/yingxiao/tips_black.svg';
import { SmartMarketingAssistant } from '../SmartMarketingAssistant/index';
import { getIn18Text, PrevScene } from 'api';
import { SearchMode } from '../../send/receiverList';
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
interface ReceiverSettingProps extends SmartMarketingProps {
  qs: Record<string, string>;
  hasVariable: boolean;
  containerHeight: number;
  receivers?: EdmSendConcatInfo[];
  secondSendInfo?: { saveInfos: Array<SecondSendStrategy> };
  capacity: number;
  validateSubmit: (autoJump?: boolean) => Promise<boolean>;
  saveDraft: () => Promise<boolean>;
  sendFilterCapacity: (data: ResponseFilterCount) => void;
  stepsInfo?: ReceiverInfoModel;
  isAddContactStep?: boolean;
  needCheckAllLogic?: boolean;
  initShowPrompt?: boolean;
  initShowClueTips?: boolean;
  ignoreIncreaseSourceName?: boolean;
  senderEmails?: CheckEmailAddressInfo[];
  addContactClickCb?: () => void;
  onReceiverValueChange?: () => void;
}

type ReceiveType = 'normal' | 'filter' | '';

const eachLength = 200;

const AllContactStatusList = [...errorContactStatusList, ...warningContactStatusList];
const AllContactStatusMap = new Map();
AllContactStatusList.forEach(item => {
  AllContactStatusMap.set(item.value, item.label);
});

export const ReceiverSettingNew = React.forwardRef((props: SendStepProps & ReceiverSettingProps, ref) => {
  const {
    visible,
    mailContent,
    hasVariable,
    containerHeight,
    receivers,
    capacity,
    validateSubmit,
    saveDraft,
    sendFilterCapacity,
    mailTextContent,
    stepsInfo,
    isAddContactStep,
    astrictCountVal,
    smartMarketingVisible,
    smartSendOn = true,
    channel = TaskChannel.normal,
    needCheckAllLogic = false,
    initShowPrompt = true,
    initShowClueTips = true,
    ignoreIncreaseSourceName = false,
    senderEmails,
    addContactClickCb,
    onReceiverValueChange,
  } = props;
  const initSecondSendData = props.initData;
  const [addContactVisible, setAddContactVisible] = useState<boolean>(false);
  // 当前处于的过滤收件人模式
  const [receiveType, setReceiveType] = useState<ReceiveType>('');
  const [newReceivers, setNewReceivers] = useState<EdmSendConcatInfo[]>(receivers || []);
  const [loading, setLoading] = useState(false);
  const [num, setNum] = useState<number>(0);
  const [currentData, setCurrentData] = useState<EdmSendConcatInfo[]>([]);

  const [showFilterTips, setShowFilterTips] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(initShowPrompt);
  const addContactRef = useRef<any>();
  const smartMarketingAssistantRef = useRef<HTMLDivElement>(null);
  const [form] = Form.useForm();
  const firstTimeRef = useRef<boolean>(true);
  const [contactStoreClue, setContactStoreClue] = useState<boolean>(false);
  const [showContactStoreClueTips, setShowContactStoreClueTips] = useState<boolean>(false);
  const [closeContactStoreClueTips, setCloseContactStoreClueTips] = useState<boolean>(false);

  const [hideDirectSendButton, setHideDirectSendButton] = useState(false);

  const prevScene = (new URLSearchParams(location.href).get('from') as PrevScene) || 'newCreate';
  const loadMoreData = () => {
    if (loading || currentData.length >= newReceivers.length) {
      return;
    }
    setLoading(true);
    const start = (num + 1) * eachLength;
    const data = newReceivers.slice(start, start + eachLength);
    setCurrentData([...currentData, ...data]);
    setNum(num + 1);
    setLoading(false);
  };

  const addContact = () => {
    setAddContactVisible(true);
    !newReceivers || newReceivers.length === 0 ? edmDataTracker.trackEdmContactsCreate() : edmDataTracker.trackEdmContactsChange();
  };

  const closeContactStoreClueTooltip = () => {
    dataStoreApi.put('contactStoreClueTipShow', 'true', { noneUserRelated: true });
    setShowContactStoreClueTips(false);
  };

  const sendReceivers = (receivers: EdmSendConcatInfo[]) => {
    setNewReceivers(receivers);
    setNum(0);
    const data = receivers.slice(0, eachLength);
    setCurrentData(data);
  };

  const recordAndSetReceiveType = (type: ReceiveType) => {
    setReceiveType(type);
  };

  useEffect(() => {
    onReceiverValueChange && onReceiverValueChange();
  }, [receiveType, currentData, addContactVisible]);

  const renderTipsComp = () => {
    if (channel === TaskChannel.senderRotate) {
      return undefined;
    }
    return (
      <div className={style.tips}>
        <span className={style.tipsText}>
          <span className={style.tipsIcon}></span>
          {getIn18Text('DANGNINDEFAJIANDIZHICHUFAXIANGTONGYOUJIAN')}
        </span>
        <CloseIcon
          className={style.tipsClose}
          onClick={() => {
            setShowPrompt(false);
          }}
        />
      </div>
    );
  };

  const renderStoreClueTipsComp = () => {
    if (!initShowClueTips) {
      return <></>;
    }
    return (
      <div className={style.filterAnomalyAddrGroup}>
        <Checkbox
          defaultChecked={false}
          onChange={e => {
            setContactStoreClue(!!e.target?.checked);
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: '12px', color: '#272E47' }}>
            发件任务设置成功自动存为线索
            <Tooltip
              arrowPointAtCenter={true}
              overlayClassName={style.showStoreClueWaringTips}
              placement="top"
              title="发件任务设置成功后，若收件邮箱当前不是线索或客户，将自动聚合本次发件任务中相同域名邮箱自动创建为线索，可直接在线索列表进行跟进。"
            >
              <span style={{ marginLeft: 4, display: 'flex' }}>
                <TipsIcon />
              </span>
            </Tooltip>
          </span>
        </Checkbox>
      </div>
    );
  };

  const handleAddContact = () => {
    addContact();
    addContactClickCb && addContactClickCb();
  };

  useImperativeHandle(ref, () => ({
    closeStoreClueTips() {
      setCloseContactStoreClueTips(true);
    },
    getReceivers() {
      return newReceivers || [];
    },
    getIsUploadEdisk() {
      return addContactRef.current?.getIsUploadEdisk() || '';
    },
    showValidateEmail(hideDirectSend: boolean) {
      addContactRef.current?.showValidateEmail(true, hideDirectSend);
    },
    showWithMode(mode: SearchMode) {
      addContact();
      addContactRef.current?.showWithMode(mode);
    },
    getStoreClueValue() {
      return contactStoreClue;
    },
    getReceiverType() {
      if (receiveType === 'filter') {
        return 1;
      }
      if (receiveType === 'normal') {
        return 4;
      }
      return 1;
    },
    // 还未过滤，点击发送时
    showReceiverModal() {
      setShowFilterTips(true);
      addContact();
      return;
    },
    getShowValidateEmailModal() {
      return addContactRef.current?.getShowValidateEmailModal() || false;
    },

    // 智能营销助手相关
    isSmartSendOpen() {
      return smartMarketingAssistantRef.current?.isSmartSendOpen();
    },
    getAstrictCount() {
      return smartMarketingAssistantRef.current?.getAstrictCount();
    },
    getReMarketingInfo(noSync?: boolean) {
      return smartMarketingAssistantRef.current?.getReMarketingInfo(noSync);
    },
    async getAiModifyInfo() {
      console.log('come here');
      const info = await smartMarketingAssistantRef.current?.getAiModifyInfo();
      return info;
    },

    closeTipVisible() {
      smartMarketingAssistantRef.current?.closeTipVisible();
      return;
    },
    getAiModifyStatus() {
      return smartMarketingAssistantRef.current?.getAiModifyStatus();
    },
    getAiModifySwitchChecked() {
      return smartMarketingAssistantRef.current?.getAiModifySwitchChecked();
    },
    closeMultiVersionSwitch() {
      smartMarketingAssistantRef.current?.closeMultiVersionSwitch();
      return;
    },
    openMultiVersionSwitch() {
      smartMarketingAssistantRef.current?.openMultiVersionSwitch();
    },
  }));

  useEffect(() => {
    dataStoreApi.get('contactStoreClueTipShow', { noneUserRelated: true }).then(data => {
      if (data.suc) {
        setShowContactStoreClueTips(false);
      } else {
        setShowContactStoreClueTips(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!addContactVisible) {
      setShowFilterTips(false);
    }
  }, [addContactVisible]);

  useEffect(() => {
    if (!!stepsInfo) {
      recordAndSetReceiveType(stepsInfo?.receiversSendType || 'filter');
    }
  }, [stepsInfo]);

  useEffect(() => {
    // 是一件营销 且是第一次时候
    if ((prevScene !== 'newCreate' || props.qs?.addContact) && firstTimeRef.current) {
      if (visible && newReceivers.length > 0 && receiveType === 'filter') {
        firstTimeRef.current = false;
        addContactRef.current.checkContacts();

        if (!addContactRef.current.getHasFilter()) {
          setShowFilterTips(true);
        }
      }
    }
  }, [receiveType]);

  const SmartMarketingAssisComp = () => {
    // smartMarketingVisible 控制在何处渲染， visible 控制显示和隐藏
    if (!smartMarketingVisible) {
      return null;
    }
    return (
      <div style={{ display: visible ? 'block' : 'none' }}>
        <SmartMarketingAssistant
          ref={smartMarketingAssistantRef}
          visible={visible}
          channel={channel}
          mailContent={mailContent}
          smartSendOn={smartSendOn}
          newReceivers={newReceivers}
          astrictCountVal={astrictCountVal}
          initData={initSecondSendData}
          baseSecondSendInfo={props.baseSecondSendInfo}
          needSystemRecommend={props.needSystemRecommend}
          mailTextContent={mailTextContent}
        />
      </div>
    );
  };

  const AddContactModalComp = () => {
    return (
      <AddContactModal
        visible={addContactVisible}
        senderEmails={senderEmails}
        closeModal={directSend => {
          setAddContactVisible(false);
          //directSend 为true 不过滤 直接发送
          if (!!directSend) {
            recordAndSetReceiveType(directSend);
          }
        }}
        containerHeight={containerHeight}
        controlAddContactModal={show => {
          setAddContactVisible(show);
        }}
        hideDirectSendButton={hideDirectSendButton}
        hasVariable={hasVariable}
        receivers={receivers}
        capacity={capacity}
        receiveType={receiveType}
        validateSubmit={validateSubmit}
        saveDraft={saveDraft}
        sendFilterCapacity={sendFilterCapacity}
        sendReceivers={sendReceivers}
        ref={addContactRef}
        showFilterTips={showFilterTips}
        stepsInfo={stepsInfo}
        isAddContactStep={isAddContactStep}
        setCloseContactStoreClueTips={setCloseContactStoreClueTips}
        needCheckAllLogic={needCheckAllLogic}
        ignoreIncreaseSourceName={ignoreIncreaseSourceName}
      />
    );
  };

  return (
    <>
      <div
        className={style.container}
        style={{
          display: visible ? undefined : 'none',
        }}
      >
        <Form name="basic" className={style.form} layout="vertical" initialValues={{ receiveType: 'filter' }} autoComplete="off" form={form}>
          {/* {showPrompt && renderTipsComp()} */}
          <Form.Item
            label={
              <div className={style.contactTop}>
                <div>
                  <span>收件人</span>
                  {newReceivers.length > 0 && (
                    <span className={style.contactLabel}>
                      {getIn18Text('(GONG')}
                      {newReceivers.length}
                      {getIn18Text('REN)')}
                    </span>
                  )}
                  {newReceivers.length > 0 && (
                    <span className={style.sendTypeTag}>{receiveType === 'filter' ? getIn18Text('JINGZHUNFASONG') : getIn18Text('BIANJIEFASONG')}</span>
                  )}
                </div>
                {renderStoreClueTipsComp()}
              </div>
            }
            name="addContact"
            rules={[{ required: true }]}
          >
            {!newReceivers || newReceivers.length === 0 ? (
              <div className={style.noContact} onClick={handleAddContact}>
                <div className={style.noContactTitle}>
                  <PlusIcon style={{ marginRight: '4px' }} />
                  {getIn18Text('TIANJIASHOUJIANREN')}
                </div>
                <div className={style.noContactInfo}>{getIn18Text('KEZHICHIDEZHIBU/')}</div>
              </div>
            ) : (
              <>
                <div id="scrollableDiv" className={style.contactList}>
                  <InfiniteScroll
                    dataLength={currentData.length}
                    next={loadMoreData}
                    hasMore={currentData.length < newReceivers.length}
                    loader={<Skeleton />}
                    scrollableTarget="scrollableDiv"
                  >
                    <List
                      dataSource={currentData}
                      renderItem={item => (
                        <List.Item key={item.contactEmail}>
                          <Col className={style.contactItem}>
                            {item.contactName && (
                              <div className={style.contactNameCont}>
                                <Tooltip placement="top" title={AllContactStatusMap.get(item.contactStatus)}>
                                  {AllContactStatusMap.has(item.contactStatus) && <div className={style.contactIcon}></div>}
                                </Tooltip>
                                <Tooltip placement="top" title={item.contactName}>
                                  <div style={{ width: AllContactStatusMap.has(item.contactStatus) ? '108px' : '100% ' }} className={style.contactName}>
                                    {item.contactName}
                                  </div>
                                </Tooltip>
                              </div>
                            )}
                            <div className={style.contactNameCont}>
                              <Tooltip placement="top" title={AllContactStatusMap.get(item.contactStatus)}>
                                {!item.contactName && AllContactStatusMap.has(item.contactStatus) && <div className={style.contactIcon}></div>}
                              </Tooltip>
                              <Tooltip placement="top" title={item.contactEmail}>
                                <div
                                  style={{
                                    color: item.contactName ? '#747A8C' : '#272E47',
                                    fontWeight: item.contactName ? '400' : '500',
                                    width: !item.contactName && AllContactStatusMap.has(item.contactStatus) ? '108px' : '100% ',
                                  }}
                                  className={style.contactEmail}
                                >
                                  {item.contactEmail}
                                </div>
                              </Tooltip>
                            </div>
                          </Col>
                        </List.Item>
                      )}
                    />
                  </InfiniteScroll>
                </div>

                <div className={style.addContactMore} onClick={handleAddContact}>
                  <div className={style.addContactText}>
                    <PlusIcon style={{ marginRight: '4px' }} />
                    添加/修改收件人
                  </div>
                </div>
              </>
            )}
          </Form.Item>
        </Form>
        {SmartMarketingAssisComp()}
      </div>
      {AddContactModalComp()}
    </>
  );
});
