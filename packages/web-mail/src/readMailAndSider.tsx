/* eslint-disable array-callback-return */
/* eslint-disable max-statements */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { api, apis, EventApi, ContactAndOrgApi, ContactItem, inWindow, DataTrackerApi, AccountApi, ContactModel, MailBoxEntryContactInfoModel, apiHolder } from 'api';
// import { Spin } from 'antd';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import MainReadMail from './components/MainReadMail/MainReadMail';
import useState2RM from './hooks/useState2ReduxMock';
import ErrorBoundary from '@web-common/hooks/ErrorBoundary';
import { actions as mailTabActions, tabId, tabType } from '@web-common/state/reducer/mailTabReducer';
// import { isMainAccount } from '@web-mail/util';
// import { useContactModel } from '@web-common/hooks/useContactModel';
import { transContactModel2ContactItem } from '@web-common/components/util/contact';
import { CollapsibleList, CollapsibleRefProps } from '@web-common/components/UI/CollapsibleList';
import useDebounceForEvent from './hooks/useDebounceForEvent';
// import lodashGet from 'lodash/get';
// import { MailSidebar } from '@/components/Layout/Customer/components/sidebar';
// import { CommonSidebar } from '@/components/Layout/Customer/components/sidebar/commonSidebar';
import { useState2CustomerSlice, useState2SubordinateSlice } from './hooks/useState2SliceRedux';
import { FLOLDER, LIST_MODEL } from './common/constant';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import RightSidebar from './rightSidebar';
import { DEFAULT_CUSTOMER_WIDTH, DEFAULT_READ_MAIL_MIN_WIDTH } from '@web-mail/hooks/useAppScale';

const systemApi = api.getSystemApi();
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const eventApi: EventApi = api.getEventApi();
const { isMac } = apiHolder.env;

// 右侧边栏组件
const RightSider: React.FC<any> = process.env.BUILD_ISEDM
  ? props => {
      const { id, maxWidth } = props || {};
      // 右侧边栏在发件箱下，选中联系人的详情数据
      const [rightSideSelectedDetail, setRightSideSelectedDetail] = useState2RM('rightSideSelectedDetail');

      const [mailEntities] = useState2RM('mailEntities');
      // 当前邮件视图模式,通栏视图不展示批量操作
      const [configMailLayout] = useState2RM('configMailLayout');
      // sidebar是否折叠
      const [sidebarFold, setSidebarFold] = useState<boolean>(false);

      const currentMail = useMemo(() => (id ? mailEntities[id] : null), [mailEntities, id]);

      const currentTabType = useAppSelector(state => state.mailTabReducer.currentTab.type);
      // 当前页签
      const currentTabId = useAppSelector(state => state.mailTabReducer.currentTab.id);
      // 『客户』Tab
      const isCustomerTab = useMemo(() => currentTabType === tabType.customer, [currentTabType]);
      // 是否是自己发出的邮件
      // const isSent = useMemo(() => currentMail && currentMail?.entry.folder === FLOLDER.SENT, [currentMail]);
      const isSent = useMemo(() => {
        if (currentMail) {
          const accountAlias = systemApi.getCurrentUser(currentMail?._account)?.prop?.accountAlias || [];
          const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];
          const senderEmail = contactApi.doGetModelDisplayEmail(currentMail?.sender?.contact);
          return (
            accountAliasArray.some(account => accountApi.getIsSameSubAccountSync(account, senderEmail)) ||
            accountApi.getIsSameSubAccountSync(senderEmail, currentMail._account)
          );
        } else {
          return false; // 如果当前邮件是空，则不是我发出的
        }
      }, [currentMail]);

      // const propContact = currentMail?.sender?.contact;

      // const email = propContact ? contactApi.doGetModelDisplayEmail(propContact) : '';

      // 回复邮箱
      const replyToMail = useMemo(() => {
        const replyToMails = currentMail?.headers && currentMail?.headers['Reply-To'];
        const reply = replyToMails?.length && replyToMails[0];
        if (reply && reply.trim()) {
          return reply;
        }
        return undefined;
      }, [currentMail]);

      const dispatch = useAppDispatch();

      const asideContactProp = useMemo(() => currentMail?.sender, [currentMail]);

      // 监听当前邮件变化，如果是发件箱则默认选中一个，如果不是则清空
      useEffect(() => {
        // 如果当前没有邮件或者不是自己发送的邮件则置空
        if (!currentMail || !isSent) {
          setRightSideSelectedDetail({ email: '', name: '' });
        } else {
          // 发送: 'to', 抄送: 'cc', 密送: 'bcc',收件人需要注意可能有一个：无收件人是空的，不应该展示
          const toContact = currentMail?.receiver?.find(c => c.mailMemberType === 'to' && !!contactApi.doGetModelDisplayEmail(c.contact));
          const ccContact = currentMail?.receiver?.find(c => c.mailMemberType === 'cc');
          const bccContact = currentMail?.receiver?.find(c => c.mailMemberType === 'bcc');
          const selectedContact = toContact || ccContact || bccContact;
          setRightSideSelectedDetail({ email: contactApi.doGetModelDisplayEmail(selectedContact?.contact as ContactModel), name: selectedContact?.originName || '' });
        }
      }, [currentMail, isSent]);

      const sliceIdSd = useMemo(() => {
        let id = currentTabId;
        if (currentTabType !== tabType.subordinate) {
          id = tabId.subordinate;
        }
        return id;
      }, [currentTabId, currentTabType]);

      const sliceIdCm = useMemo(() => {
        let id = currentTabId;
        if (currentTabType !== tabType.customer) {
          id = tabId.readCustomer;
        }
        return id;
      }, [currentTabId, currentTabType]);

      // 客户页签下-客户详情展示的 email
      const customerAsideDetail = useAppSelector(state => {
        const isCustomerTab = state.mailTabReducer.currentTab.type === tabType.customer;
        if (isCustomerTab) {
          return state.mailReducer.customer[sliceIdCm].customerAsideDetail;
        }
        return state.mailReducer.customerAsideDetail;
      });

      // 是否左右布局
      const isLeftRight = useMemo(() => configMailLayout === '1', [configMailLayout]);

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

      // const asideEmail = isCustomerTab ? customerAsideDetail.email : contactApi.doGetModelDisplayEmail(asideContactProp?.contact as ContactModel);
      const asideEmail = useMemo(() => {
        if (rightSideSelectedDetail.email) {
          return rightSideSelectedDetail.email;
        }
        if (isCustomerTab) {
          return customerAsideDetail.email;
        }
        if (asideContactProp?.contact) {
          return contactApi.doGetModelDisplayEmail(asideContactProp?.contact);
        }
        return '';
      }, [isCustomerTab, customerAsideDetail.email, asideContactProp?.contact, rightSideSelectedDetail.email]);

      // 监听非独立读信页面的头部用户卡片点击展开事件，以展开侧边栏
      useMsgRenderCallback('mailMenuOper', ev => {
        if (ev?.eventStrData === 'headerCardVisible') {
          // 如果不是通知隐藏的,其他都展示侧边栏，（通栏下会通知隐藏）
          if (!!ev?.eventData?.hide) {
            asideRef?.current?.controlAsideVisible && asideRef?.current?.controlAsideVisible(false);
          } else {
            asideRef?.current?.controlAsideVisible && asideRef?.current?.controlAsideVisible(true);
          }
        }
      });
      // 邮件+231222版本，下线右侧边栏新手引导
      // const handleNewGuideForAside = (visible?: boolean) => {
      //   eventApi.sendSysEvent({
      //     eventName: 'mailMenuOper',
      //     eventData: {
      //       // 原来 id 应该为邮件的 mid，但是后期改造，侧边栏与邮件无关联，应该去客户的id
      //       email: asideEmail,
      //       visible,
      //     },
      //     eventStrData: 'newGuideForAside',
      //   });
      // };

      const showAside = useMemo(() => {
        // 不是外贸不展示
        if (!process.env.BUILD_ISEDM) {
          return false;
        }
        // 如果是多选操作则不展示
        if (logicListModel == LIST_MODEL.MULTIPLE && isLeftRight) {
          return false;
        }
        // 客户页签下，客户详情不再与邮件挂钩
        if (isCustomerTab) {
          // if (customerAsideDetail?.email) {
          //   handleNewGuideForAside();
          // }
          return !!customerAsideDetail?.email;
        }
        if (!currentMail) {
          return false;
        }
        if (!asideEmail) {
          return false;
        }
        // 第三方邮件不展示客户侧边栏
        if (currentMail.isTpMail) {
          return false;
        }
        // handleNewGuideForAside();
        return true;
      }, [currentMail, customerAsideDetail.email, isCustomerTab, asideEmail, logicListModel, isLeftRight]);

      // 打点
      useEffect(() => {
        if (showAside && id && !sidebarFold) {
          const cardType = transContactModel2ContactItem(asideContactProp?.contact as ContactModel)?.customerRole;
          trackApi.track('waimao_mail_sidebar_appear', { cardType });
        }
      }, [showAside, id, sidebarFold]);

      // 是否打开侧边栏，用于三栏拖拽的判断
      useEffect(() => {
        if (showAside && !sidebarFold) {
          dispatch(mailTabActions.doChangeMailSidebar(true));
        } else {
          dispatch(mailTabActions.doChangeMailSidebar(false));
        }
      }, [showAside, sidebarFold]);

      const asideRef = useRef<CollapsibleRefProps>();

      return showAside ? (
        <CollapsibleList
          ref={asideRef}
          title="侧边栏"
          needBtn
          placement="right"
          resizable={false} // 0315版本UI确定详情侧边栏不允许拖拽改变大小
          style={{ zIndex: 100 }}
          defaultWidth={DEFAULT_CUSTOMER_WIDTH}
          minConstraints={[DEFAULT_CUSTOMER_WIDTH, Infinity]}
          maxConstraints={[maxWidth, Infinity]}
          onOpen={() => {
            setSidebarFold(false);
            trackApi?.track('pcMail_click_open_sidebar_readmail');
          }}
          onClose={() => {
            setSidebarFold(true);
            trackApi?.track('pcMail_click_close_sidebar_readmail');
          }}
        >
          <RightSidebar
            email={asideEmail || ''}
            name={rightSideSelectedDetail.name || asideContactProp?.originName}
            replyToMail={replyToMail}
            id={id}
            _account={currentMail?._account}
          />
        </CollapsibleList>
      ) : (
        <></>
      );
    }
  : _ => <></>;

// 读信组件外层包裹组件，提取成单独文件，添加右侧边栏
const MainReadMailWrap: React.FC<any> = props => {
  // const {  showReadMail, height } = props || {};
  const { showReadMail, height, id, from, openInNewWindow, readOnly, getSignMailContent, tempContent } = props || {};
  const style = useMemo<React.CSSProperties>(() => {
    return {
      height,
      position: 'relative',
      overflow: 'hidden',
      display: showReadMail ? 'block' : 'none',
      flex: '1 0',
      width: 0,
      minWidth: process.env.BUILD_ISEDM ? 408 : DEFAULT_READ_MAIL_MIN_WIDTH,
      ...(process.env.BUILD_ISLINGXI && process.env.BUILD_ISWEB ? { height: '100%' } : {}),
      ...(isMac ? {} : { zIndex: 99 }), // 兼容右侧边栏的在win下点击热区问题
    };
  }, [showReadMail]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [maxWidth, setMaxWidth] = useState(DEFAULT_CUSTOMER_WIDTH);

  const handleWidth = () => {
    if (wrapperRef.current != null) {
      const width = wrapperRef.current.offsetWidth;
      const maxWidth = Math.max(width - 500, DEFAULT_CUSTOMER_WIDTH);
      setMaxWidth(maxWidth);
    }
  };

  const handleResize = useDebounceForEvent(handleWidth, 200);

  useEffect(() => {
    if (inWindow()) {
      window.addEventListener('resize', handleResize);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <ErrorBoundary
      name="readMailPage"
      extraInfo={{
        id,
        from,
        openInNewWindow,
        readOnly,
        isTpMail: !!getSignMailContent,
        tempContentId: tempContent?.id,
      }}
    >
      <div ref={wrapperRef} className="mainreadmail-wrap" hidden={!showReadMail}>
        <div style={style}>
          <MainReadMail {...props} />
        </div>
        {showReadMail ? <RightSider {...props} maxWidth={maxWidth} /> : <></>}
      </div>
      {!showReadMail ? (
        <RightSider {...props} maxWidth={maxWidth} />
      ) : (
        // todo：通栏模式下maxwidth是固定值，会无法拖动大小
        <></>
      )}
    </ErrorBoundary>
  );
};

export default MainReadMailWrap;
