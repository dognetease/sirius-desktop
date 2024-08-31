/* eslint-disable no-nested-ternary */
/* eslint-disable max-params */
/* eslint-disable max-statements */
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
// import lodashGet from 'lodash/get';
import { AccountApi, apiHolder as api, apis, ContactAndOrgApi, ContactItem, DataTrackerApi, EventApi, inWindow, MailEntryModel, SystemApi } from 'api';
// import { CollapsibleList, CollapsibleRefProps } from '@web-common/components/UI/CollapsibleList';
import BaseReadMail from '../ReadMail/ReadMail';
import useState2RM from '../../hooks/useState2ReduxMock';
// import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import MailMultOperPanel from '../MailMultOperPanel/MailMultOperPanel';
import CustomerMailMultOperPanel from '../CustomerMail/ColumnCustomerMailList/CustomerMailMultOperPanel';
import SubordinateMailMultOperPanel from '../SubordinateMail/ColumnSubordinateMailList/SubordinateMailMultOperPanel';
import { LIST_MODEL } from '../../common/constant';
// import { MailSidebar } from '@/components/Layout/Customer/components/sidebar';
// import { CommonSidebar } from '@/components/Layout/Customer/components/sidebar/commonSidebar';
import { useAppSelector } from '@web-common/state/createStore';
import { isMainAccount, tpMailAttConfig } from '@web-mail/util';
import { tabId, tabType } from '@web-common/state/reducer/mailTabReducer';
import { useContactModel } from '@web-common/hooks/useContactModel';
// import useDebounceForEvent from '../../hooks/useDebounceForEvent';
import { userCallback } from '@web-common/hooks/useGetUniqReqWrap';
import debounce from 'lodash/debounce';
import { transContactModel2ContactItem } from '@web-common/components/util/contact';
import './mailReadMail.scss';
import { useState2CustomerSlice, useState2SubordinateSlice } from '@web-mail/hooks/useState2SliceRedux';

const systemApi = api.api.getSystemApi() as SystemApi;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

interface Props {
  id: string;
  from?: string;
  openInNewWindow?: boolean;
  tempContent?: MailEntryModel;
  currentWith?: number;
  readOnly?: boolean;
  getSignMailContent?: any;
  requestUniqWrap?: ((...params: any) => Promise<any>) | ((callback: userCallback) => (...params: any) => Promise<any>);
}

const MainReadMail: React.FC<Props> = (props: Props) => {
  const { id, from, openInNewWindow = false, tempContent, readOnly, getSignMailContent, requestUniqWrap, emptyRender } = props;
  const [mailEntities] = useState2RM('mailEntities');
  const currentMail = useMemo(() => (id ? mailEntities[id] : null), [mailEntities, id]);
  // sidebar是否折叠
  // const [sidebarFold, setSidebarFold] = useState<boolean>(false);

  // 当前邮件视图模式,通栏视图不展示批量操作
  const [configMailLayout] = useState2RM('configMailLayout');

  // 分栏通栏
  const isUpDown = useMemo(() => configMailLayout === '3', [configMailLayout]);

  // const dispatch = useAppDispatch();

  // 引入 contact redux，用来为侧边栏实时响应联系人的修改
  // todo: useMemo
  const propContact = currentMail?.sender?.contact;
  const email = propContact ? contactApi.doGetModelDisplayEmail(propContact) : '';
  // const contactId = propContact && propContact?.contact && propContact?.contact?.id ? propContact?.contact?.id : '';
  // 从 redux 里取出 contact 信息
  // const contact = useContactModel({ email, contactId });
  // useUpdateContactModel({ email, contactId, name: propContact?.contact?.contactName, model: contact });

  const currentTabType = useAppSelector(state => state.mailTabReducer.currentTab.type);
  // 当前页签
  const currentTabId = useAppSelector(state => state.mailTabReducer.currentTab.id);
  // 『客户』Tab
  const isCustomerTab = process.env.BUILD_ISLINGXI ? false : useMemo(() => currentTabType === tabType.customer, [currentTabType]);
  // 『下属』Tab
  const isSdTab = process.env.BUILD_ISLINGXI ? false : useMemo(() => currentTabType === tabType.subordinate, [currentTabType]);

  const sliceIdCm = useMemo(() => {
    let id = currentTabId;
    if (currentTabType !== tabType.customer) {
      id = tabId.readCustomer;
    }
    return id;
  }, [currentTabId, currentTabType]);

  const sliceIdSd = useMemo(() => {
    let id = currentTabId;
    if (currentTabType !== tabType.subordinate) {
      id = tabId.subordinate;
    }
    return id;
  }, [currentTabId, currentTabType]);

  const [listModel] = useState2RM('defaultMailListSelectedModel', 'doUpdateMailListSelectedModel');
  const [listModelCm] = useState2CustomerSlice('defaultMailListSelectedModel', undefined, sliceIdCm);
  const [listModelSd] = useState2SubordinateSlice('defaultMailListSelectedModel', undefined, sliceIdSd);

  const logicListModel = useMemo(() => {
    if (currentTabType == tabType.customer) {
      return listModelCm;
    }
    if (currentTabType == tabType.subordinate) {
      return listModelSd;
    }
    return listModel;
  }, [listModel, listModelCm, listModelSd, currentTabType]);

  const account = useMemo(() => currentMail?._account || systemApi.getCurrentUser()?.id, [currentMail?._account]);
  const isMailAccount = useMemo(() => isMainAccount(account), [account]);
  // const [showReadStatus, setShowReadStatus] = useState<boolean>(true);

  // personal-个人联系人，enterprise-同事，external-陌生人，customer-客户，clue-线索
  // 外贸下侧边栏展示逻辑：
  // 本人是发件人的邮件，侧边栏类型在只有一个收件人时根据收件人身份显示
  // 本人是发件人的邮件，侧边栏类型在有多个收件人时根据收件人身份显示，优先级：客户＞同事客户>陌生人＞个人联系人＞同事
  // 本人是收件人的邮件（收件人包括抄送密送），侧边栏类型根据发件人身份显示
  const asideContactProp = useMemo(() => {
    const sender = currentMail?.sender;
    let asideContactProp: ContactItem | undefined;
    if (sender?.contact) {
      asideContactProp = transContactModel2ContactItem(sender.contact);
    }
    // 本人是发件人

    // if (account === email) {
    if (systemApi.getCurrentUser()?.prop?.accountAlias?.includes(email) || accountApi.getIsSameSubAccountSync(email, account as string)) {
      // 过滤空收件人的情况
      const receiversContact: ContactItem[] = [];
      (currentMail?.receiver || []).forEach(item => {
        if (item?.contact) {
          receiversContact.push(transContactModel2ContactItem(item.contact));
        }
      });
      if (receiversContact.length === 1) {
        asideContactProp = receiversContact[0];
      } else if (receiversContact.length > 1) {
        // 自己的客户
        const customer = receiversContact.find(item => item.customerRole === 'myCustomer');
        // 同事客户
        const enterpriseCustomer = receiversContact.find(item => item.customerRole === 'colleagueCustomer');
        // 公海客户
        const openSeaCustomer = receiversContact.find(item => item.customerRole === 'openSeaCustomer');
        // 陌生人
        const external = receiversContact.find(item => item.type === 'external');
        // 个人
        const personal = receiversContact.find(item => item.type === 'personal');
        // 企业联系人
        const enterprise = receiversContact.find(item => item.type === 'enterprise');
        // 优先级：客户 > 同事客户> 公海客户 > 陌生人 > 个人 > 企业联系人
        asideContactProp = customer || enterpriseCustomer || openSeaCustomer || external || personal || enterprise;
      }
    }
    return asideContactProp;
  }, [currentMail]);

  const asideContactModel = useContactModel({ email: asideContactProp?.email, name: asideContactProp?.name, _account: asideContactProp?._account, needFull: false });

  // 更新redux联系人数据
  // useEffect(() => {
  //   if (!asideContactModel) {
  //     doGetContactData({ email: asideContactProp?.email, name: asideContactProp?.name, _account: asideContactProp?._account });
  //   }
  // }, [asideContactProp?.email]);

  // 邮件多选操作面板
  const MailMultOperPanelMemo = useMemo(() => {
    if (isCustomerTab) {
      return <CustomerMailMultOperPanel />;
    }
    if (isSdTab) {
      return <SubordinateMailMultOperPanel />;
    }
    return <MailMultOperPanel />;
  }, [isCustomerTab]);

  const isLeftRight = useMemo(() => configMailLayout === '1', [configMailLayout]);

  const featureConfig = useMemo(() => {
    return {
      // 非主账号下-屏蔽邮件功能
      mailDiscuss: isMailAccount,
      // 屏蔽往来邮件功能
      relatedMail: isMailAccount,
      // 屏蔽邮件标签的删除
      // mailTagIsCloseAble: isMailAccount,
      // 邮件阅读状态
      // readStatus: showReadStatus,
      // 附件卡片配置
      attachCard: tempContent?.isTpMail ? tpMailAttConfig : undefined,
    };
  }, [isMailAccount, tempContent?.isTpMail]);

  // 获取阅读状态是否展示
  // const getReadStatus = debounce(async () => {
  //   const showReadStatus = await ifShowReadStatus(account);
  //   setShowReadStatus(showReadStatus);
  // }, 500);

  // useEffect(() => {
  //   getReadStatus();
  // }, [account]);

  const idAccountKey = useMemo(() => {
    return id + currentMail?._account + '';
  }, [id, currentMail]);

  const readMailCom = useMemo(() => {
    return (
      <BaseReadMail
        sliceId={sliceIdCm}
        mailId={{
          id,
          account: currentMail?._account || '',
        }}
        from={from}
        openInNewWindow={openInNewWindow}
        tempContent={tempContent}
        getSignMailContent={getSignMailContent}
        isUpDown={isUpDown}
        // emptyContent={EmptyContentElement}
        featureConfig={featureConfig}
        readOnly={readOnly}
        requestUniqWrap={requestUniqWrap}
        contactType={asideContactModel?.contact?.type}
        emptyRender={emptyRender}
      />
    );
  }, [idAccountKey, from, openInNewWindow, getSignMailContent, isMailAccount, featureConfig, readOnly, requestUniqWrap, emptyRender]);

  // todo: useMemo,拆分
  return logicListModel == LIST_MODEL.MULTIPLE && isLeftRight ? MailMultOperPanelMemo : readMailCom;
};

export default MainReadMail;
