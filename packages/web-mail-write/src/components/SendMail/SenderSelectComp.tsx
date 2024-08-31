/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { Tooltip, Menu, Dropdown, Input, Radio } from 'antd';
import { apiHolder as api, apis, util, MailAliasAccountModel, MailConfApi, DataTrackerApi, AccountApi, SubAccountTableModel, SystemApi, SimpleResult } from 'api';
import style from './index.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import { useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import { actions as mailConfigActions } from '@web-common/state/reducer/mailConfigReducer';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import classnames from 'classnames';
import NicknameSettingIcon from '@web-common/components/UI/Icons/svgs/mail/NicknameSettingIcon';
import MailSenderSetting, { SenderSettingType } from '@web-common/components/MailSenderDialog/mailSenderSetting';
import { AlertErrorIcon } from '@web-common/components/UI/Icons/icons';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { getIn18Text } from 'api';
/* tslint-disable */
const mailConfApi: MailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
interface Props {
  setSender: React.Dispatch<React.SetStateAction<MailAliasAccountModel | null>>;
}

interface AccountTagProps {
  account: {
    senderName: string;
    isDefault: boolean;
    id: string;
    isSelected: boolean;
    agentEmail: string;
  };
}

const AccountTag = (props: AccountTagProps) => {
  const { senderName = '', isDefault = false, id: email, isSelected = false, agentEmail } = props.account;
  const hasEmail = email && email.length > 2;
  const emailRef = useRef<HTMLDivElement>(null);
  const emailMeasureRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  //有agantEmail且agentEmail不等于email时，展示agentEmail
  const emailShowName = agentEmail && agentEmail.length > 2 && agentEmail !== email ? agentEmail : email;

  const handleShowTooltip = () => {
    const truncateWidth = emailRef.current?.offsetWidth || 0;
    const originalWidth = emailMeasureRef.current?.offsetWidth || 0;
    setShowTooltip(originalWidth > truncateWidth);
  };

  const renderContent = () => (
    <div className={classnames(style.senderMenuItemName, isSelected ? style.senderMenuItemSelected : '')} onMouseEnter={handleShowTooltip}>
      <span>{util.chopStrToSize(senderName, hasEmail ? 6 : 12)}</span>&nbsp;&nbsp;
      <div ref={emailRef} className={!isSelected ? style.senderMenuItemNameMail : ''} style={{ textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 200 }}>
        {hasEmail ? `${emailShowName}` : ''}
      </div>
      <div ref={emailMeasureRef} className={!isSelected ? style.senderMenuItemNameMail : ''} style={{ visibility: 'hidden', height: 0, position: 'absolute' }}>
        {hasEmail ? `${util.chopStrToSize(agentEmail, 22)}` : ''}
      </div>
      {isDefault ? <span className={style.defaultSender}>{getIn18Text('MOREN')}</span> : null}
    </div>
  );
  return showTooltip ? (
    <Tooltip
      title={
        <div>
          <div>{senderName}</div>
          <div>{agentEmail}</div>
        </div>
      }
      mouseEnterDelay={0.3}
      mouseLeaveDelay={0.15}
      zIndex={9999}
      placement="right"
    >
      {renderContent()}
    </Tooltip>
  ) : (
    renderContent()
  );
};

const SenderSelect: React.FC<{ selectChanged: (info: MailAliasAccountModel | null) => void }> = prop => {
  const dispatch = useAppDispatch();
  const { selectChanged } = prop;
  const [selectableAccounts, setSelectableAccounts] = useState<MailAliasAccountModel[]>([]);
  const [curAccount, setCurAccount] = useState<MailAliasAccountModel>({ name: '', id: '', domain: '', nickName: '', senderName: '' }); // 左下角
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail?.cid);
  const { currentMail } = useAppSelector(state => state.mailReducer);
  const praiseMailShow = currentMail.status?.praiseMailShow;
  const taskMailShow = currentMail.status?.taskMailShow;
  const [tempNickName, setTempNickName] = useState<string>('');
  const [isEditting, setIsEditting] = useState<boolean>(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showSenderSettingDialog, setShowSenderSettingDialog] = useState<boolean>(false);
  const inputRef = useRef<any>(null);
  const selectableAccountsRef = useRef<MailAliasAccountModel[]>(selectableAccounts);
  selectableAccountsRef.current = selectableAccounts;

  const keydownAction = useCallback(
    e => {
      if (e.keyCode === 13 && isEditting) {
        handleNicknameChangeBlur(e);
      }
    },
    [isEditting]
  );

  // 获取子账号/副账号
  const getSubAccounts = async () => {
    try {
      const subAccounts: SubAccountTableModel[] = await accountApi.getSubAccounts({ expired: false });
      return subAccounts?.length ? subAccounts : [];
    } catch (error) {
      console.log('获取子账号失败', error);
      return [];
    }
  };

  const getSubAccountsSenderName = async () => {
    try {
      let senderNameMap = new Map();
      let allQiyeReq = [];
      let allQiyeAccountEmail: string[] = [];
      let allQiyeAccountNickName: string[] = [];
      const accounts = await accountApi.getAllSubAccounts();
      for (let i = 0; i < accounts.length; i++) {
        let nickName = accounts[i].agentNickname || accounts[i].accountName || '';
        if (accounts[i].accountType === 'qyEmail') {
          allQiyeReq.push(accountApi.getQiyeMailSubAccountNickName({ email: accounts[i].accountEmail }));
          allQiyeAccountEmail.push(accounts[i].agentEmail);
          allQiyeAccountNickName.push(nickName);
        } else {
          senderNameMap.set(accounts[i].agentEmail, nickName);
        }
      }
      const qiyeRes: PromiseSettledResult<SimpleResult>[] = await Promise.allSettled(allQiyeReq);
      qiyeRes.forEach((_, i) => {
        const _res = _?.value || _?.reason;
        let onNickname = _res?.data?.nickName || allQiyeAccountNickName[i] || '';
        senderNameMap.set(allQiyeAccountEmail[i], onNickname);
      });
      return senderNameMap;
    } catch (error) {
      console.log('获取子账号发件人昵称失败', error);
      return new Map();
    }
  };

  // 获取可选的账号
  const getSelectableAccounts = useCreateCallbackForEvent(async () => {
    // 获取主账号和其别名账号
    let mainAndAliaAccounts: MailAliasAccountModel[] = await mailConfApi.getMailSenderInfo();
    mainAndAliaAccounts = mainAndAliaAccounts.map(item => ({ ...item, isMainAccount: true }));
    // console.log('mainAndAliaAccounts', mainAndAliaAccounts);
    let subAccounts: MailAliasAccountModel[] = [];
    // 找到其中的主体账号（主邮箱并不一定在第一位）
    // 主体账号 不等同于登录主账号 而是区别主体账号和别名
    const mainAccount = mainAndAliaAccounts.find(async (account: MailAliasAccountModel) => !!account.isMainEmail);
    if (mainAccount) {
      // 获取主账号的子账号（活跃中）
      const subAccountsRes: SubAccountTableModel[] = await getSubAccounts();
      // 获取发件人昵称
      const subAccountsSenderName: Map<string, string> = await getSubAccountsSenderName();
      // console.log('subAccountsRes', subAccountsRes);
      if (subAccountsRes?.length) {
        subAccounts = subAccountsRes.map((item: SubAccountTableModel) => {
          const { id, accountName, nickName, agentEmail } = item;
          const _senderName = agentEmail ? subAccountsSenderName.get(agentEmail) : '';
          return {
            // 主体账号
            isMainEmail: true,
            name: accountName,
            // 子账号accountId
            mailEmail: id,
            senderName: _senderName || nickName,
            isMainAccount: false,
            // 子账号email
            agentEmail: agentEmail,
            isSubAccount: true,
            ...item,
          };
        });
      }
    }
    // 可选账号
    let selectableAccounts = [];
    // 桌面端
    // if (inElectron) {
    // 顺序：主账号 > 别名 > 代收代发（webmail绑定的） > 挂载邮箱
    selectableAccounts = [...mainAndAliaAccounts, ...subAccounts];
    // } else {
    //   // web端
    //   // 造信的真实id
    //   const realAccountId = accountApi.getEmailIdByEmail(currentMail._account || '');
    //   // console.log('realAccountId', currentMail._account, realAccountId);
    //   // 主账号
    //   if (!realAccountId || realAccountId === mainAccount?.id) {
    //     selectableAccounts = mainAndAliaAccounts;
    //   } else {
    //     // 子账号
    //     const curSubAccount = subAccounts.find(item => item.id === realAccountId);
    //     selectableAccounts = curSubAccount ? [curSubAccount] : [];
    //   }
    // }
    setSelectableAccounts(selectableAccounts);
    return selectableAccounts;
  });

  // 设置并切换发信人
  const setOptSenderAction = (selectedEmail: string) => {
    let optSender = selectableAccountsRef.current.find(item => item.id === selectedEmail);
    // if (!curAccount.id) {
    //   // redux里还没有optSender 表示第一次进来 用组信里面的sender来显示
    //   let sender = currentMail?.mailFormClickWriteMail || currentMail?.sender?.contact?.contact?.accountName;
    //   optSender = selectableAccountsRef.current.find(item => {
    //     return item.agentEmail === sender || item.id === sender
    //   });
    // }
    if (!optSender) return;
    optSender.currentMailCid = currentMailId;
    setCurAccount(optSender);
    setTempNickName(optSender.senderName || '');

    dispatch(mailConfigActions.doSetNickname(optSender.senderName || ''));
    dispatch(mailActions.doModifyOptSender(optSender));
    dispatch(mailActions.doModifyOptSenderMainEmail(optSender.mailEmail || optSender.id));
    // 修改sender 保存草稿用的字段 现在各种字段重复好多
    // dispatch(mailActions.doModifySender(newContact));
    if (optSender) {
      selectChanged({ id: optSender.id, nickName: optSender.senderName, mailEmail: optSender.mailEmail || '' }); // aliasSender
    } else {
      selectChanged(null);
    }
  };

  // 切换发信人
  const handleMenuClick = (e: any) => {
    e?.stopPropagation();
    e?.preventDefault();
    const item = selectableAccounts.filter(it => it.id === e.target.value).pop();
    if ((!praiseMailShow && !taskMailShow) || (item && item.isMainAccount)) {
      item && setOptSenderAction(item.id);
      return;
    }
    SiriusModal.confirm({
      title: '确定切换账号？',
      className: 'no-content-confirm',
      icon: <AlertErrorIcon />,
      content: <span>当前切换的账号不支持任务/表扬邮件/已读提醒功能，切换账号后，仅保留正文内容</span>,
      okType: 'danger',
      onOk: () => {
        item && setOptSenderAction(item.id);
      },
    });
  };
  const handleNicknameChangeButton = useCallback(
    e => {
      e.stopPropagation();
      e.preventDefault();
      setIsEditting(true);
      setTimeout(() => {
        inputRef.current!.focus({
          cursor: 'all',
        });
      }, 200);
    },
    [inputRef]
  );

  // 修改昵称
  const handleNicknameChangeBlur = useCallback(
    async e => {
      const val = e?.target?.value;
      if (val !== curAccount.senderName) {
        // todo 修改昵称
        if (curAccount.isMainEmail) {
          if (val) {
            if (curAccount.isSubAccount) {
              await accountApi.editSubAccountNickName({ email: curAccount.id, nickName: val });
            } else {
              // accountApi.setCurrentAccount({ email: curAccount.mailEmail });
              await mailConfApi.setMailSenderName(val.trim(), curAccount.mailEmail);
            }
          }
        } else {
          // accountApi.setCurrentAccount({ email: curAccount.mailEmail });
          await mailConfApi.doUpdatePOPAccounts([{ id: curAccount.editId || 0, name: val.trim() }], curAccount.mailEmail);
        }
        await getSelectableAccounts();
        setOptSenderAction(curAccount.id);
      }
      setIsEditting(false);
    },
    [curAccount]
  );

  // 点击发件人设置
  const handleSenderSetting = useCallback(e => {
    setShowSenderSettingDialog(true);
    setDropdownVisible(false);
  }, []);

  // 修改设置
  const handleSenderSettingSubmit = useCallback(
    async hasChanged => {
      if (hasChanged) {
        await getSelectableAccounts();
        setOptSenderAction(curAccount.id);
      }
    },
    [getSelectableAccounts, curAccount]
  );
  const handleNicknameDialogVisible = useCallback((val: boolean) => {
    // setIsEditting(true);
    setShowSenderSettingDialog(val);
  }, []);

  const throttleGetAccounts = useCallback(
    throttle(() => getSelectableAccounts(), 5000, { trailing: false }),
    []
  );

  const handleMenuVisibleChange = useCallback((visible: boolean) => {
    // setIsEditting(true);
    // setShowSenderSettingDialog(true);
    if (!visible && isEditting) {
      // todo提交修改
      setIsEditting(false);
    }
    setDropdownVisible(visible);
    if (visible) {
      try {
        throttleGetAccounts();
      } catch (error) {
        console.log(error);
      }
    }
  }, []);

  // 初始化时获取账号并设置sender
  const initSender = async () => {
    const allAccounts = await getSelectableAccounts();
    // 上面不应该用 isMainEmail 判断
    // 需要的是找到主账号 所以应该用 isMainAccount 去判断 1.24修改 wanglijun
    const mainAccount = allAccounts.find((account: MailAliasAccountModel) => !!account.isMainAccount);
    // 默认账号
    const defAccount = allAccounts.find(item => item.isDefault);
    let email = '';
    // 用户选中的email
    const optSender = currentMail?.optSender?.id;
    // 独立窗口与主窗口切换时用来传输的email，初始化email
    const { optSenderStr, initSenderStr } = currentMail;
    if (optSender || optSenderStr) {
      email = optSender || optSenderStr || '';
    } else {
      // !! 初始账号为主账号时 默认账号 > 初始账号 wanglijun
      // 如果是主账号发信，需要用默认发件人去发送邮件
      if (initSenderStr === mainAccount?.mailEmail) {
        email = defAccount?.id || initSenderStr;
      } else {
        email = initSenderStr;
      }
    }
    setOptSenderAction(email);
  };

  useEffect(
    debounce(() => {
      initSender();
    }, 200),
    [currentMailId]
  );

  // 别名邮箱发生改变
  // useMsgRenderCallback('mailAliasAccountListChange', async ev => {
  //   if (ev?.eventData?.mailId === currentMail.cid) {
  //     const allAccounts = await getSelectableAccounts();
  //     const defAccount = allAccounts.find(item => item.isDefault);
  //     // !! 已经有选中的了 -> 传输来的 -> 默认账号 > 初始账号
  //     let senderEmail = currentMail?.optSender?.id || currentMail?.optSenderStr || defAccount?.id || currentMail?.initSenderStr || '';
  //     setOptSenderAction(senderEmail);
  //   }
  // });

  const menu = (
    <Menu className={style.senderMenu}>
      <OverlayScrollbarsComponent style={{ maxHeight: '300px' }}>
        <Radio.Group value={curAccount.id} style={{ width: '100%' }} onChange={handleMenuClick}>
          {selectableAccounts.map(it => (
            <Menu.Item
              key={it.id}
              className={it.id === curAccount?.id ? 'current' : ''}
              style={it.id === curAccount?.id ? { color: 'rgba(56, 110, 231, 1)', width: '100%' } : { width: '100%' }}
            >
              <Radio value={it.id}>
                <AccountTag account={{ ...it, isSelected: it.id === curAccount?.id } as any} />
              </Radio>
            </Menu.Item>
          ))}
        </Radio.Group>
      </OverlayScrollbarsComponent>
      <Menu.Item className={style.senderMenuEditField}>
        <div className={style.senderMenuEditFieldTitle}>
          <span>{getIn18Text('FAJIANNICHENG')}</span>{' '}
          {isEditting ? (
            <Input
              defaultValue={tempNickName}
              ref={inputRef}
              className={style.senderMenuInput}
              maxLength={12}
              onPressEnter={keydownAction}
              onBlur={handleNicknameChangeBlur}
              onKeyPress={e => e.stopPropagation()}
              onKeyDown={e => e.stopPropagation()}
            />
          ) : (
            <span className={style.senderMenuCurrName}>{util.chopStrToByteSize(curAccount?.senderName || '', 24)}</span>
          )}{' '}
          {(curAccount.isMainEmail || curAccount.isProxy) && (
            <a className={style.senderMenuEditButton} hidden={isEditting} onClick={handleNicknameChangeButton}>
              {getIn18Text('XIUGAINICHENG')}
            </a>
          )}
          <Tooltip getPopupContainer={element => element.parentElement || document.body} placement="top" title={getIn18Text('FAJIANRENSHEZHI')}>
            <div onClick={handleSenderSetting} className={style.senderMenuBottomItem}>
              <NicknameSettingIcon className={style.nicknameSettingIcon} stroke={isEditting ? '#386EE7' : ''} />
            </div>
          </Tooltip>
        </div>
      </Menu.Item>
    </Menu>
  );
  const showName = `${curAccount?.senderName} ${curAccount.isSubAccount ? curAccount.agentEmail || curAccount?.id : curAccount?.id}`;
  return (
    <>
      <Dropdown
        overlay={menu}
        trigger={['click']}
        getPopupContainer={node => node.parentElement || document.body}
        onVisibleChange={handleMenuVisibleChange}
        visible={dropdownVisible}
        placement="topLeft"
      >
        <span style={{ cursor: 'pointer' }}>
          <span className={style.senderShowName} title={showName}>
            {getIn18Text('FAJIANREN：')}
            {util.chopStrToByteSize(showName, 22)}&nbsp;
          </span>
          <IconCard type="upTriangle" />
        </span>
      </Dropdown>
      <MailSenderSetting
        isShow={showSenderSettingDialog}
        handleSubmit={handleSenderSettingSubmit}
        type={SenderSettingType.SENDER_SETTING}
        setVisible={handleNicknameDialogVisible}
      />
    </>
  );
};

// eslint-disable-next-line max-statements
const SenderSelectComp: React.FC<Props> = (props: Props) => {
  const { setSender } = props;
  const senderChanged = (item: MailAliasAccountModel | null) => {
    if (!item) return;
    trackApi.track('pcMail_click_switchSender__writeMailPage');
    if (!item.nickName && item.senderName) {
      item.nickName = item.senderName;
    }
    setSender(item);
  };

  return (
    <div className={`${style.sender}`}>
      <SenderSelect selectChanged={senderChanged} />
    </div>
  );
};
export default SenderSelectComp;
