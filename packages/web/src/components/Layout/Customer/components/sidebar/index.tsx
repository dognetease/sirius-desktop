import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, Menu, Tooltip } from 'antd';
import classnames from 'classnames';
import { api, ClueDetail, CustomerDetail, DataStoreApi, inWindow, getIn18Text, ContactModel, RelatedCompanyInfo, EmailRoles } from 'api';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { CustomerCardActions } from '@web-common/state/reducer';
import { getAreaSelectAsync, getBaseSelectAsync } from '@web-common/state/reducer/customerReducer';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { SliceIdParams } from '@web-mail/types';
import { DEFAULT_CUSTOMER_WIDTH } from '@web-mail/hooks/useAppScale';
// import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { useContactModel, useCustomerModel } from '@web-common/hooks/useContactModel';
import { transICustomerModel2CustomerDetail } from '@web-common/utils/contact_util';
import { refreshContactDataByEmails } from '@web-common/state/reducer/contactReducer';
import { getMainAccount } from '@web-common/components/util/contact';
import { SidebarCustomerInfo } from './customerInfo';
import style from './index.module.scss';
import { ReactComponent as SwitchIcon } from '@/images/mailCustomerCard/switch.svg';
import { ReactComponent as RefreshIcon } from '@/images/mailCustomerCard/refresh.svg';
import { PageLoading } from '@/components/UI/Loading';
import { MailSidebarTracker, SideBarActions, CardType as TrackerCardType } from './tracker';
// import { HelpInfo } from '@/components/Layout/Customer/components/sidebar/helpInfo';
import { UniDrawerModuleId, showUniDrawer } from '@lxunit/app-l2c-crm';

interface MailSidebarProps {
  email: string;
  name?: string;
  // visible: boolean; // visible不在使用
  onClickHelp?: () => void;
  // sliceId?: string; // 没有使用到，不传入了
  _account?: string;
  setLoading: (isLoading: boolean) => void;
  noBorder?: boolean;
}

const storeApi: DataStoreApi = api.getDataStoreApi();

const SWITCH_ICON_TIP_KEY = 'SWITCH_ICON_TIP';

export const MailSidebar = ({ email, name, onClickHelp, _account = getMainAccount(), setLoading, noBorder }: MailSidebarProps) => {
  const [switchIconTip, setSwitchIconTip] = useState(false);
  const dispatch = useAppDispatch();
  const lastResourceIdMap = useAppSelector(state => state.customerCardReducer.lastResourceId);
  // uni客户弹窗
  // const [, setUniCustomerParam] = useState2RM('uniCustomerParam');

  const switchIconTimerRef = useRef(0);
  const customerInfoRef = useRef(null);
  // 现根据传入的email获取一下contactModel，找到客户id
  const reduxContactModel = useContactModel({ email, _account }) as ContactModel;
  const emailRole = reduxContactModel?.customerOrgModel?.role;
  // 是否是无权限的同事客户
  const isNoAuth = useMemo(() => emailRole && emailRole === 'colleagueCustomerNoAuth', [emailRole]);
  // 当前选择的客户id
  const [currentCustomerId, setCurrentCustomerId] = useState<string>();
  // 获取当前客户信息
  const companyDetail = useCustomerModel({ customerId: currentCustomerId, email, _account, emailRole });
  // 右侧边栏标题
  const topTitle = useMemo(() => {
    if (emailRole) {
      const titltObj: Partial<Record<EmailRoles, string>> = {
        myCustomer: getIn18Text('KEHUXIANGQING'),
        colleagueCustomer: getIn18Text(['TONGSHIKEHU', 'XIANGQING']),
        colleagueCustomerNoAuth: getIn18Text(['TONGSHIKEHU', 'XIANGQING']),
        openSeaCustomer: getIn18Text('GONGHAIKEHUXIANG'),
      };
      return titltObj[emailRole as EmailRoles] || getIn18Text('KEHUXIANGQING');
    } else {
      return getIn18Text('KEHUXIANGQING');
    }
  }, [emailRole]);

  // 判断是否是公海客户
  const isOpenSea = useMemo(() => ['openSeaCustomer', 'openSeaClue'].includes(emailRole), [emailRole]);
  // 详情，监听客户详情的变化
  const detail = useMemo(() => companyDetail && transICustomerModel2CustomerDetail(companyDetail), [companyDetail]);
  // 关联的其他客户
  const itemList: RelatedCompanyInfo[] = useMemo(
    () => (reduxContactModel?.customerOrgModel?.relatedCompanyInfo?.length ? reduxContactModel?.customerOrgModel?.relatedCompanyInfo : []),
    [reduxContactModel]
  );
  // 监听reduxContactModel具体的role和客户id
  useEffect(() => {
    // 默认选中最近选择过的客户，否则就选择当前id即可
    const recentCustomer = reduxContactModel?.customerOrgModel?.relatedCompanyInfo?.find(i => i.companyId === lastResourceIdMap[email]);
    if (recentCustomer) {
      setCurrentCustomerId(recentCustomer.companyId);
    } else {
      setCurrentCustomerId(reduxContactModel?.customerOrgModel?.companyId);
    }
  }, [reduxContactModel]);

  useEffect(() => {
    // 如果是无权限的客户，只要有reduxContactModel即可
    if ((isNoAuth && !reduxContactModel) || (!isNoAuth && !companyDetail)) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [companyDetail, reduxContactModel, isNoAuth]);

  // 主动刷新当前客户数据，替换原来fetchDetail的逻辑
  const refreshDetail = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    await refreshContactDataByEmails(
      {
        [_account]: [email],
      },
      new Map([[email, name || email]])
    );
    setLoading(false);
    // 刷新第一页联系人
    setTimeout(() => {
      customerInfoRef.current?.refreshContactList(); // 监听到编辑联系人成功也刷新第一页
    }, 0);
  };

  // const handleClickHelp = () => {
  //   onClickHelp && onClickHelp();
  //   const mapCategory: Record<number, TrackerCardType> = {
  //     2002: TrackerCardType.Customer,
  //     2003: TrackerCardType.Clue,
  //   };
  //   const category = mapCategory[companyDetail?.type as number] || TrackerCardType.Customer;
  //   MailSidebarTracker.trackAction(category, SideBarActions.ClickIntroduction);
  // };

  // 切换客户方法
  const handleSwitchItem = ({ key }: any) => {
    const item = itemList.find(i => i.companyId === key);
    const mapCategory: Record<number, TrackerCardType> = {
      2002: TrackerCardType.Customer,
      2003: TrackerCardType.Clue,
    };
    const category = mapCategory[companyDetail?.type as number] || TrackerCardType.Customer;
    MailSidebarTracker.trackAction(category, SideBarActions.SwitchResource);
    if (item) {
      setCurrentCustomerId(item.companyId);
      // setLoading(true);
    } else {
      // todo 异常处理
    }
  };

  // 监听右键操作客户联系人，事件会传递contactId,
  // 外贸通0615版本，编辑客户联系人，使用uni弹窗替换掉，监听到事件去重新请求数据
  useMsgRenderCallback('mailMenuOper', ev => {
    if (ev?.eventStrData === 'headerCardVisible') {
      // 如果uni编辑成功
      if (ev?.eventData?.success) {
        refreshDetail();
        if (ev?.eventData?.type === 'customer') {
          customerInfoRef.current?.setActiveTab('2'); // 展示客户基本信息
        } else if (ev?.eventData?.type === 'contact') {
          customerInfoRef.current?.setActiveTab('3'); // 展示联系人
        }
      }
    }
  });

  // 调用uni编辑客户, type: 编辑客户，编辑客户联系人
  const handleUniDrawer = (type: 'customer' | 'contact', contactId?: string) => {
    // const uniType = type === 'customer' ? 'editCustomer' : type === 'contact' ? 'editContact' : undefined;
    // if (detail?.company_id) {
    //   setUniCustomerParam({
    //     visible: true,
    //     customerId: Number(detail.company_id),
    //     uniType,
    //     contactId: type === 'contact' ? Number(contactId) : undefined,
    //     source: 'mailListStrangerSideBar',
    //     onSuccess: () => {
    //       // fetchDetail(); // 重新请求数据
    //       refreshDetail();
    //       if (type === 'customer') {
    //         customerInfoRef.current?.setActiveTab('2'); // 展示客户基本信息
    //       } else if (type === 'contact') {
    //         customerInfoRef.current?.setActiveTab('3'); // 展示联系人
    //       }
    //     },
    //   });
    // }
    if (detail?.company_id) {
      // 编辑客户
      if (type === 'customer') {
        showUniDrawer({
          moduleId: UniDrawerModuleId.CustomerDetail,
          moduleProps: {
            visible: true,
            onClose: () => {},
            onSuccess: () => {
              refreshDetail();
              customerInfoRef.current?.setActiveTab('2'); // 展示客户基本信息
            },
            customerId: Number(detail.company_id),
            source: 'mailListStrangerSideBar',
          },
        });
      } else if (type === 'contact') {
        // 编辑客户联系人
        showUniDrawer({
          moduleId: UniDrawerModuleId.ContactDetail,
          moduleProps: {
            visible: true,
            customerId: Number(detail.company_id),
            source: 'mailListStrangerSideBar',
            onClose: () => {},
            onSuccess: () => {
              refreshDetail();
              customerInfoRef.current?.setActiveTab('3'); // 展示联系人
            },
            contactId: Number(contactId),
          },
        });
      }
    }
  };

  useEffect(() => {
    if (itemList.length > 0 && currentCustomerId) {
      dispatch(CustomerCardActions.updateLastResourceId({ email, id: currentCustomerId }));
    }
  }, [itemList, currentCustomerId]);

  useEffect(() => {
    dispatch(getBaseSelectAsync());
    dispatch(getAreaSelectAsync());
  }, []);

  useEffect(() => {
    if (itemList?.length > 1) {
      storeApi.get(SWITCH_ICON_TIP_KEY).then(({ suc, data }) => {
        const neverShown = !suc || data !== '1';
        if (inWindow() && !switchIconTimerRef.current && neverShown) {
          setSwitchIconTip(true);
          storeApi.put(SWITCH_ICON_TIP_KEY, '1');
          switchIconTimerRef.current = window.setTimeout(() => {
            setSwitchIconTip(false);
          }, 3000);
        }
      });
    }
  }, [itemList]);

  const overlay = useMemo(() => {
    if (itemList.length === 0) return <></>;
    return (
      <Menu selectedKeys={currentCustomerId ? [currentCustomerId] : []} onClick={handleSwitchItem}>
        {itemList.map(i => (
          <Menu.Item key={i.companyId}>{i.companyName}</Menu.Item>
        ))}
      </Menu>
    );
  }, [itemList, currentCustomerId]);

  return (
    <div
      style={{ position: 'relative', height: '100%', background: '#fff', width: `${DEFAULT_CUSTOMER_WIDTH}px` }}
      className={classnames(style.rightSiderStyle, {
        [style.noBorder]: noBorder,
      })}
    >
      <div className={style.columnFlexContainer}>
        {/* 顶部内容 */}
        <div className={style.topBanner}>
          <span className={style.cardType}>{topTitle}</span>
          <div>
            <RefreshIcon
              className={classnames(style.topBannerIcon, {
                // 'sirius-spin': loading,
              })}
              onClick={() => {
                refreshDetail();
              }}
            />
            {itemList.length > 1 && (
              <Dropdown overlay={overlay} trigger={['click', 'click']} overlayClassName={style.switchCustomerOverlay}>
                <Tooltip placement="bottom" title={getIn18Text('ZAIZHELIQIEHUAN\u3001CHAKANQITAKEHU')} visible={switchIconTip}>
                  <SwitchIcon className={style.topBannerIcon} />
                </Tooltip>
              </Dropdown>
            )}
            {/* 邮件+231222版本去掉引导 */}
            {/* <HelpInfo onClickHelp={handleClickHelp} /> */}
          </div>
        </div>
        {/* 其余内容 */}
        <SidebarCustomerInfo
          ref={customerInfoRef}
          info={detail as CustomerDetail}
          onEdit={() => handleUniDrawer('customer')}
          onEditContact={contactId => handleUniDrawer('contact', contactId)}
          onAddManagerSuccess={() => refreshDetail(false)}
          refresh={() => refreshDetail(false)}
          isOpenSea={isOpenSea}
          contactModel={reduxContactModel}
          originName={name}
          actionKeys={isOpenSea ? ['getCustomer'] : ['edit', 'newSchedule', 'newFollow', 'addManager', 'returnOpenSea', 'newBO']}
        />
      </div>
      {/* {loading ? <PageLoading /> : null} */}
    </div>
  );
};
