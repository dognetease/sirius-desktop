// 17版本智能模式下线后，此文件无引用了，观察一个版本后，可以考虑删除
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import { apiHolder, apis, MailStrangerApi, PriorityType, api, ContactType, DataTrackerApi, SystemAccounts, MailConfApi } from 'api';
import { ReactComponent as IconClose } from '@/images/icons/mail/icon-close1.svg';
import React, { useEffect, useState, useMemo } from 'react';
import styles from './sender.priority.module.scss';
import { Select, SelectProps } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { contactApi } from '@web-common/components/util/contact';
import Alert from '@web-common/components/UI/Alert/Alert';
import useState2RM from '../../hooks/useState2ReduxMock';
import { RiskReminder, RiskReminderCustomerProps } from '@web-mail/components/RiskReminder/risk-reminder';
// import { setCurrentAccount } from '../../util';
import { getIn18Text } from 'api';
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const mailManagerApi = apiHolder.api.requireLogicalApi('mailConfApiImpl') as unknown as MailConfApi;
const mailStrangerApi = apiHolder.api.requireLogicalApi(apis.mailStrangerApiImpl) as unknown as MailStrangerApi;
const storeApi = api.getDataStoreApi();
const sysApi = api.getSystemApi();
const eventApi = api.getEventApi();
export function setReadMailPriorityTipDsiable() {
  // 全部导入主账号
  // setCurrentAccount();
  storeApi.putSync(ReadMailPriorityTipStoreKey, 'true');
}
type ContactSender = {
  email: string;
  name?: string;
  type?: ContactType;
};
interface SenderPriorityProps {
  sender: ContactSender;
  riskMinderOpen: boolean;
  defaultPriority?: EnumSenderPriority;
}
enum EnumSenderPriority {
  HIGH,
  NORMAL,
  LOW,
  NONE = -1,
}
export const SenderPriorityMap: Record<EnumSenderPriority, string> = {
  [EnumSenderPriority.NONE]: getIn18Text('WEIBIAOJI'),
  [EnumSenderPriority.LOW]: getIn18Text('DIYOU'),
  [EnumSenderPriority.HIGH]: getIn18Text('GAOYOU'),
  [EnumSenderPriority.NORMAL]: getIn18Text('PUTONG'),
};
export const ReadMailPriorityTipStoreKey = 'read_mail_priority_tip_show_disable';
const LowPriorityWarn = 'noMoreLowModal';
const isLowPriorityWarnClicked = () => {
  // setCurrentAccount();
  const res = storeApi.getSync(LowPriorityWarn);
  return res.suc && res.data === 'true';
};
const setLowPriorityWarnClicked = () => {
  // setCurrentAccount();
  storeApi.putSync(LowPriorityWarn, 'true');
};
const isSystemAccount = (email: string) => {
  return SystemAccounts.includes(email);
};
export const useContactPriority = (
  option: {
    user: ContactSender;
    defaultPriority?: EnumSenderPriority;
  },
  source?: string
) => {
  const {
    defaultPriority,
    user: { email, name, type },
  } = option;
  const [priority, setPriority] = useState<EnumSenderPriority | undefined>(defaultPriority);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [editable, setEditable] = useState<boolean>(true);
  const disable = sysApi.getCurrentUser()?.id === email;
  const updatePriorityExcute = async (value: EnumSenderPriority) => {
    setUpdating(true);
    try {
      const res = await mailStrangerApi.setSmartPriorities({
        name,
        email,
        priority: value,
        prevPriority: priority,
      });
      res.success && setPriority(value);
    } catch (error) {
      console.error(error);
      SiriusMessage.error({ content: getIn18Text('SHEZHISHIBAI') });
    }
    setUpdating(false);
  };
  const updatePriority = async (v: any) => {
    const value = Number(v) as PriorityType;
    const warnFlag = isLowPriorityWarnClicked();
    try {
      trackerApi.track('pc_low_priority_window', {
        page: source === 'contact_detail' ? getIn18Text('LIANXIRENXINXI11') : getIn18Text('YOUJIANXIANGQING'),
      });
    } catch (error) {}
    if (value === EnumSenderPriority.LOW && !warnFlag) {
      const al = Alert.warn({
        title: getIn18Text('QUEDINGYAOJIANGGAI'),
        content: getIn18Text('DIYOULIANXIREN11'),
        funcBtns: [
          {
            text: getIn18Text('QUXIAO'),
            onClick: (_, nrm) => {
              al.destroy();
              try {
                trackerApi.track('pc_low_priority_window_action', {
                  select_no: nrm,
                  follow_action: getIn18Text('QUXIAO'),
                });
              } catch (error) {}
            },
          },
          {
            nmr: true,
            onClick: (_, nmr) => {
              nmr && setLowPriorityWarnClicked();
              updatePriorityExcute(value);
              al.destroy();
              try {
                trackerApi.track('pc_low_priority_window_action', {
                  select_no: nmr,
                  follow_action: getIn18Text('QUEDING'),
                });
              } catch (error) {}
            },
            text: getIn18Text('QUEDING'),
            type: 'primary',
          },
        ],
      });
    } else {
      updatePriorityExcute(value);
    }
  };
  useEffect(() => {
    if (isSystemAccount(email)) {
      setPriority(EnumSenderPriority.HIGH);
      setEditable(false);
      return () => {};
    }
    // TODO contactAccountNotify
    const obId = eventApi.registerSysEventObserver('contactAccountNotify', {
      func: ({ eventStrData, eventData }) => {
        if (eventStrData === 'notify' && eventData?.contact_personal?.updateDiff) {
          contactApi.doGetContactById(eventData.contact_personal.updateDiff).then(datas => {
            datas.forEach(data => {
              if (data?.contact?.accountName === email && data?.contact?.priority !== priority) {
                setPriority(data?.contact?.priority);
              }
            });
          });
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('contactAccountNotify', obId);
    };
  }, []);
  useEffect(() => {
    if (isSystemAccount(email)) {
      setPriority(EnumSenderPriority.HIGH);
      setEditable(false);
      return () => {};
    }
    if (disable) {
      return () => {};
    }
    setLoading(true);
    mailStrangerApi
      .getSmartGetPriorities({
        email,
      })
      .then(res => {
        if (res.success) {
          if (res.data?.priority !== undefined) {
            setPriority(res.data.priority);
          } else if (type === 'enterprise') {
            setPriority(EnumSenderPriority.HIGH);
          } else {
            setPriority(EnumSenderPriority.NONE);
          }
        }
      })
      .finally(() => {
        setLoading(false);
      });
    return () => {};
  }, [email, disable, type]);
  return {
    disable,
    priority,
    updatePriority,
    updating,
    loading,
    editable,
  };
};
const SenderPriorityTip: React.FC<{}> = () => {
  const [priorityTipVisible, setPriorityTipVisible] = useState(false);
  const handleClose = () => {
    setReadMailPriorityTipDsiable();
    setPriorityTipVisible(false);
  };
  useEffect(() => {
    // setCurrentAccount();
    const store = storeApi.getSync(ReadMailPriorityTipStoreKey);
    if (store.data !== 'true') {
      setPriorityTipVisible(true);
    }
    return () => {};
  }, []);
  if (priorityTipVisible) {
    return (
      <div className={classnames(styles.wrapper, styles.wrapperTip)}>
        <span className={styles.btnClose} onClick={handleClose}>
          <IconClose />
        </span>
        <p>
          <i className={styles.iconQuestion}></i>
          <span>{getIn18Text('XIANGRANGYOUJIANZHAN')}</span>
        </p>
      </div>
    );
  }
  return null;
};
// 此处集成了3种提示
export const SenderPriority: React.FC<SenderPriorityProps & RiskReminderCustomerProps> = props => {
  const { sender, defaultPriority, riskMinderOpen = false } = props;
  const { priority, updatePriority, disable, editable } = useContactPriority({ user: sender, defaultPriority });
  const [setPriorityVis, setSetPriorityVis] = useState(true);
  const [riskReminderVis, setRiskReminderVis] = useState(true);
  const isThreadMode = mailManagerApi.getMailMergeSettings() === 'true'; // 是否是聚合模式
  // 当前展示的提示
  const promptType = useMemo(() => {
    // 不展示
    if (disable || !editable) return '';
    // 风险提醒开启
    if (riskMinderOpen) {
      return 'riskMinder';
    }
    // 非聚合
    if (!isThreadMode) {
      // 未设置优先级
      if (priority === EnumSenderPriority.NONE) {
        return 'setPriority';
      }
      // 设置了低优先级
      if (priority === EnumSenderPriority.LOW) {
        return 'changePriority';
      }
    }
    return '';
  }, [riskMinderOpen, priority, disable, editable]);
  // 设置优先级
  const handleChangePriority = (value: EnumSenderPriority) => {
    updatePriority(value);
    try {
      trackerApi.track('pc_importance_of_sender', {
        mark_location: 'mail_detail',
        important: value,
      });
    } catch (error) {
      message.error(getIn18Text('SHEZHIYOUXIANJI'));
    }
  };
  const handleClose = () => {
    setSetPriorityVis(false);
  };
  // 风险提醒
  if (promptType === 'riskMinder') {
    return riskReminderVis ? (
      <RiskReminder
        _account={props._account}
        contactId={props.contactId}
        email={props.email}
        contact={props.contact}
        senderMail={sender.email}
        senderName={sender.name || ''}
        visible={riskReminderVis}
        setVisible={setRiskReminderVis}
      />
    ) : (
      <></>
    );
  }
  // 未设置优先级，优先级设置去掉
  // if (promptType === 'setPriority') {
  //     return (setPriorityVis &&
  //         <div className={styles.wrapper}>
  //     <span className={styles.btnClose} onClick={handleClose}>
  //       <IconClose />
  //     </span>
  //     <p>
  //       <i className={styles.iconWarn}></i>
  //       <span>{getIn18Text("JIANCEDAOGAIFA")}</span>
  //     </p>
  //     <p className={styles.textWrapper}>
  //       {Object.entries(SenderPriorityMap)
  //                 .filter(([value]) => Number(value) !== EnumSenderPriority.NONE)
  //                 .reverse()
  //                 .map(([value, label]) => (<span className={styles.text} key={value} onClick={() => {
  //                     handleChangePriority(Number(value));
  //                 }}>
  //             {label}
  //           </span>))}
  //     </p>
  //   </div>);
  // };
  // 低优提示
  // if (promptType === 'changePriority') {
  //     return <SenderPriorityTip />;
  // }
  return null;
};
interface SenderPrioritySelectProps extends Omit<SenderPriorityProps, 'riskMinderOpen'> {
  type?: 'main' | 'tooltip';
}
export const SenderPrioritySelect: React.FC<SenderPrioritySelectProps & SelectProps<any>> = ({ sender, type = 'main', defaultPriority, ...rest }) => {
  // const [_, setShowSmartMailboxTip] = useState2RM('showSmartMailboxTip', 'doUpdateShowSmartMailboxTip');
  const { priority, updatePriority, loading, disable, editable } = useContactPriority({ user: sender, defaultPriority }, 'contact_detail');
  if (priority === undefined || loading || disable) {
    return null;
  }
  return (
    <Select
      size={type === 'main' ? 'small' : 'large'}
      disabled={!editable}
      dropdownClassName={styles.selectDropdownWrap}
      className={classnames(styles.select, {
        [styles.selectMain]: type === 'main',
        [styles.selectTooltip]: type === 'tooltip',
        [styles.selectMainLow]: priority === EnumSenderPriority.LOW && type === 'main',
        [styles.selectMainNormal]: priority === EnumSenderPriority.NORMAL && type === 'main',
        [styles.selectMainHigh]: priority === EnumSenderPriority.HIGH && type === 'main',
      })}
      onChange={v => {
        try {
          trackerApi.track('pc_importance_of_sender', {
            mark_location: 'mail_detail',
            important: v,
          });
        } catch (error) {}
        updatePriority(v);
        // setShowSmartMailboxTip(false);
        setReadMailPriorityTipDsiable();
      }}
      suffixIcon={<i className={type === 'main' ? styles.dropdown : styles.arrowdown}></i>}
      value={priority === EnumSenderPriority.NONE ? SenderPriorityMap[priority] : priority}
      options={Object.entries(SenderPriorityMap)
        .filter(([value]) => Number(value) !== EnumSenderPriority.NONE)
        .map(([key, label]) => ({
          label,
          value: Number(key),
        }))}
      placeholder={SenderPriorityMap[EnumSenderPriority.NONE]}
      {...rest}
    />
  );
};
