import React, { useState, useEffect, useMemo } from 'react';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { Popover, Button, Checkbox, Modal, message } from 'antd';
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseMailSvg';
import { useAppSelector, useAppDispatch, MailActions } from '@web-common/state/createStore';
import IconCard from '@web-common/components/UI/IconCard';
import styles from './prompt.module.scss';
import { AccountApi, apiHolder, apis, ContactAndOrgApi, contactInsertParams, DataTrackerApi, MailBoxEntryContactInfoModel, MailConfApi } from 'api';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { getIn18Text } from 'api';
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as unknown as AccountApi;

// 回复类型
const replyWriteType = ['replyWithAttach', 'replyAllWithAttach', 'reply', 'replyAll'];
const AddToContactModalData = {
  fun: 'addToContact',
  title: getIn18Text('QUERENTIANJIAZHI'),
  intro: getIn18Text('NINKEGOUXUANXIA'),
};
const RmReceiverModalData = {
  fun: 'rmReceiver',
  title: getIn18Text('QUERENYICHUSHOU'),
  intro: getIn18Text('NINKEGOUXUANXIA2'),
};
interface Props {}
const Prompt: React.FC<Props> = _ => {
  const currentMail = useAppSelector(state => state.mailReducer.currentMail);
  const currentMailCid = useMemo(() => currentMail.cid, [currentMail]);
  const currentMailInitSenderStr = useMemo(() => currentMail.initSenderStr, [currentMail]);
  const currentMailOptSender = useMemo(() => currentMail.optSender, [currentMail]);
  // 当前邮件的陌生人
  const [curMailStangers, setCurMailStangers] = useState<MailBoxEntryContactInfoModel[]>([]);
  const [noMorePromptPopoverVis, setNoMorePromptPopoverVis] = useState<boolean>(false);
  const [modalVis, setModalVis] = useState<boolean>(false);
  const [modalData, setModalData] = useState<{
    fun: string;
    title: string;
    intro: string;
  }>({ fun: '', title: '', intro: '' });
  const [checkedEmails, setCheckedEmails] = useState<string[]>([]);
  const dispatch = useAppDispatch();
  // 是否展示提示
  const showPrompt = useMemo(() => {
    const { id, writeType, noPrompt } = currentMail;
    // 邮件为回复类型 发件人非系统 且收件人/抄送人中存在陌生人
    return (
      id &&
      !currentMail.entry.system &&
      writeType &&
      replyWriteType.includes(writeType) &&
      curMailStangers &&
      curMailStangers.length > 0 &&
      !noPrompt &&
      currentMailInitSenderStr === currentMailOptSender?.id
    );
  }, [currentMail, curMailStangers, currentMailInitSenderStr, currentMailOptSender]);
  // 提示详情
  const promptDetail = useMemo(() => {
    if (!curMailStangers || curMailStangers.length === 0) return '';
    const firstOne = curMailStangers[0];
    if (curMailStangers.length === 1) return `检测到 ${firstOne.originName}（${firstOne.contactItem.contactItemVal}）不在您的通讯录中，请注意防范风险！`;
    return `检测到 ${firstOne.originName}（${firstOne.contactItem.contactItemVal}）等${curMailStangers.length}人不在您的通讯录中，请注意防范风险！`;
  }, [curMailStangers]);
  // 添加到通讯录
  const addToContactText = useMemo(() => {
    if (!curMailStangers || curMailStangers.length === 0) return '';
    if (curMailStangers.length === 1) return `添加至通讯录`;
    return `批量添加至通讯录`;
  }, [curMailStangers]);
  // 提示详情
  const rmReceiverText = useMemo(() => {
    if (!curMailStangers || curMailStangers.length === 0) return '';
    if (curMailStangers.length === 1) return `移除收件人`;
    return `批量移除收件人`;
  }, [curMailStangers]);
  // 添加至通讯录
  const addToContact = () => {
    trackApi.track('pcMail_click_add_mailcontacts_replyMailPage', {});
    // 单个
    if (curMailStangers.length === 1) {
      addToContactAction([curMailStangers[0].contactItem.contactItemVal]);
      return;
    }
    setModalData(AddToContactModalData);
    setModalVis(true);
  };

  // 移除收件人
  const rmReceiver = () => {
    trackApi.track('pcMail_click_remove_mailaddress_replyMailPage', {});
    // 单个
    if (curMailStangers.length === 1) {
      rmReceiverAction([curMailStangers[0].contactItem.contactItemVal]);
      return;
    }
    setModalData(RmReceiverModalData);
    setModalVis(true);
  };

  // 不再提醒
  const noMorePrompt = async () => {
    setNoMorePromptPopoverVis(true);
  };
  // 关闭提示
  const closePrompt = () => {
    setCurMailStangers([]);
    dispatch(MailActions.doChangeNoPrompt(true));
  };
  const cancelModal = () => setModalVis(false);
  const addToContactAction = async (emails?: any[]) => {
    const curCheckedEmails = emails || checkedEmails;
    const { length: emailLen } = curCheckedEmails;
    const selectedContacts: contactInsertParams[] = [];
    curMailStangers.forEach(item => {
      if (curCheckedEmails.includes(item.contactItem.contactItemVal)) {
        selectedContacts.push({
          name: item.originName || '',
          emailList: [item.contactItem.contactItemVal],
        });
      }
    });
    try {
      await contactApi.doInsertContact({ list: selectedContacts });
      // 更新curMailStangers
      const filteredStranger = curMailStangers.filter(item => !curCheckedEmails.includes(item.contactItem.contactItemVal));
      message.success(`${emailLen === 1 ? '该联系人已添加至通讯录' : `${emailLen}位联系人已添加至通讯录`}`);
      setCurMailStangers(filteredStranger);
    } catch (error) {
      console.log('添加到通讯录失败', error);
      message.error('添加到通讯录失败');
    }
  };
  const rmReceiverAction = async (emails?: any[]) => {
    const curCheckedEmails = emails || checkedEmails;
    const { length: emailLen } = curCheckedEmails;
    // currentMail中移除
    const { receiver = [] } = currentMail;
    const filteredReceiver = receiver.filter(item => !curCheckedEmails.includes(item.contactItem.contactItemVal));
    dispatch(MailActions.doReplaceReceiver(filteredReceiver || []));
    message.success(`${emailLen === 1 ? '该联系人已从回复对象中移除' : `${emailLen}位联系人已从回复对象中移除`}`);
    // curMailStangers中移除
    const filteredStranger = curMailStangers.filter(item => !curCheckedEmails.includes(item.contactItem.contactItemVal));
    setCurMailStangers(filteredStranger);
    return;
  };

  const confirmModal = async () => {
    setModalVis(false);
    const { fun } = modalData;
    // 添加到通讯录
    if (fun === 'addToContact') addToContactAction();
    // 移除收件人
    if (fun === 'rmReceiver') rmReceiverAction();
  };
  // 取消 不再提醒
  const cancelPopover = () => setNoMorePromptPopoverVis(false);
  // 确认 不再提醒
  const confirmNoMorePrompt = async () => {
    setNoMorePromptPopoverVis(false);
    setCurMailStangers([]);
    const result = await mailConfApi.updateRiskReminderStatus(false);
    if (result) {
      setCurMailStangers([]);
      message.success(getIn18Text('NINDECAOZUOYI'));
    } else {
      message.warn(getIn18Text('GUANLIYUANYISHE'));
    }
  };
  // 扫描收件人（包括抄送）
  const scanReceiver = () => {
    const { receiver = [] } = currentMail;
    const inValidStrangerFromDB: Map<string, MailBoxEntryContactInfoModel[]> = new Map();
    receiver.forEach(item => {
      const { inContactBook, contactItem } = item;
      if (inContactBook) {
        return;
      }
      // 未在通讯录
      const contactItemVal = contactItem.contactItemVal.toLocaleLowerCase();
      const ifSameDomain = accountApi.doGetEmailInCurrentDomain(contactItemVal);
      if (ifSameDomain) {
        return;
      }
      if (!inValidStrangerFromDB.has(contactItemVal)) {
        inValidStrangerFromDB.set(contactItemVal, []);
      }
      inValidStrangerFromDB.get(contactItemVal)?.push(item);
    });

    if (!inValidStrangerFromDB.size) {
      return;
    }

    // 1.31 addedby郭超 如果mailBOxEntryContactInfoModel中返回inContactBook=false.从本地DB中在查一下
    contactApi
      .doGetContactByEmailsAdvance({
        emails: [...inValidStrangerFromDB.keys()],
      })
      .then(({ mapRes }) => {
        Object.keys(mapRes).forEach(email => {
          if (mapRes[email] && mapRes[email].length) {
            inValidStrangerFromDB.delete(email);
          }
        });
        setCurMailStangers([...inValidStrangerFromDB.values()].flat());
      });
  };
  // 全选
  const onSelectAllChange = (e: CheckboxChangeEvent) => {
    const { checked } = e.target;
    if (checked) {
      setCheckedEmails(curMailStangers.map(item => item.contactItem.contactItemVal));
    } else {
      setCheckedEmails([]);
    }
  };
  // 单选
  const onItemChange = (e: CheckboxChangeEvent, index: number) => {
    const email = curMailStangers[index].contactItem.contactItemVal;
    const { checked } = e.target;
    const tmp = [...checkedEmails];
    const emailIndex = tmp.findIndex(item => item === email);
    // 添加
    if (checked) {
      emailIndex === -1 && tmp.push(email);
    } else {
      emailIndex !== -1 && tmp.splice(emailIndex, 1);
    }
    setCheckedEmails(tmp);
  };
  // id 发送变化 即 新打开 或者 切换 时扫描收件人
  useEffect(() => {
    setCurMailStangers([]); // 置空
    if (!currentMailCid) return;
    scanReceiver();
  }, [currentMailCid]);

  useEffect(() => {
    // 清空选中的邮箱
    if (!modalVis) setCheckedEmails([]);
  }, [modalVis]);

  const PopoverTitle = <div className={styles.popoverTitle}>{getIn18Text('QUEDINGBUZAITI')}</div>;
  const PopoverContent = (
    <>
      <div className={styles.popoverContent}>
        <div className={styles.popoverIntro}>{getIn18Text('XIACIJINRUBU')}</div>
        <div className={styles.popoveButtons}>
          <Button onClick={cancelPopover} style={{ marginRight: '16px' }}>
            {getIn18Text('QUXIAO')}
          </Button>
          <Button type="primary" onClick={confirmNoMorePrompt}>
            {getIn18Text('QUEREN')}
          </Button>
        </div>
      </div>
    </>
  );
  return (
    <>
      {showPrompt && (
        <>
          <div className={styles.prompt}>
            <IconCard type="warnYellow" class={styles.warn} />
            <span className={styles.promptDetail}>{promptDetail}</span>
            <div className={styles.funs}>
              <span className={styles.funBtn} onClick={addToContact}>
                {addToContactText}
              </span>
              <span className={styles.funBtn} onClick={rmReceiver}>
                {rmReceiverText}
              </span>
              <Popover
                overlayClassName={styles.popoverOverlay}
                overlayInnerStyle={{ padding: '20px' }}
                title={PopoverTitle}
                content={PopoverContent}
                placement="bottom"
                visible={noMorePromptPopoverVis}
              >
                <span className={styles.funBtn} onClick={noMorePrompt}>
                  {getIn18Text('BUZAITIXING')}
                </span>
              </Popover>
            </div>
            <IconCard type="close" className={styles.closeBtn} style={{ width: '14px', height: '14px' }} onClick={closePrompt} />
          </div>

          <Modal
            onOk={confirmModal}
            visible={modalVis}
            bodyStyle={{ padding: 0 }}
            cancelText={getIn18Text('QUXIAO')}
            onCancel={cancelModal}
            okText={getIn18Text('QUEDING')}
            okButtonProps={checkedEmails?.length === 0 ? { disabled: true } : {}}
            onOk={confirmModal}
            centered={true}
            destroyOnClose
            closeIcon={<CloseIcon />}
          >
            <div className={styles.header}>
              <h6 className={styles.modalTitle}>{modalData.title}</h6>
              <p className={styles.modalIntro}>{modalData.intro}</p>
            </div>
            <div className={styles.strangerArea}>
              <div className={styles.selectAll}>
                <Checkbox onChange={onSelectAllChange} />
                <p className={styles.selectAllText}>{getIn18Text('QUANXUAN')}</p>
              </div>
              {curMailStangers.map((item, index) => (
                <div className={styles.strangerItem}>
                  <Checkbox onChange={e => onItemChange(e, index)} checked={!!checkedEmails.includes(item.contactItem.contactItemVal)} />
                  <AvatarTag
                    className={styles.avatar}
                    key={item.contactItem.contactItemVal}
                    size={32}
                    user={{
                      name: item.originName,
                      email: item.contactItem.contactItemVal,
                    }}
                  />
                  <div className={styles.strangerMsgs}>
                    <p className={styles.strangerName}>{item.originName}</p>
                    <p className={styles.strangerEmail}>{item.contactItem.contactItemVal}</p>
                  </div>
                </div>
              ))}
            </div>
          </Modal>
        </>
      )}
    </>
  );
};
export default Prompt;
