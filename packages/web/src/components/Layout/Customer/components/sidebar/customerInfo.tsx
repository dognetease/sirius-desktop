/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useMemo, useRef, useState, useImperativeHandle } from 'react';
import { Dropdown, Menu, Tabs, Tooltip } from 'antd';
import moment from 'moment';
import lodashGet from 'lodash/get';
import {
  apiHolder,
  apis,
  CustomerAuthDataType,
  CustomerDetail,
  FollowsType,
  SystemApi,
  ContactItem,
  CustomerApi,
  getIn18Text,
  MailPlusCustomerApi,
  EmailRoles,
  IGetContactListParams,
  ContactDetail,
  ContactModel,
} from 'api';
import classnames from 'classnames';
import CreateScheduleBox from '@web-schedule/components/CreateBox/CreateBox';
import { initDefaultMoment, getContanctObjs } from '@web-schedule/components/CreateBox/util';
import { ScheduleSyncObInitiator } from '@web-schedule/data';
import { ScheduleActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { SchedulePageEventData } from '@web-schedule/components/CreateBox/EventBody';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { transServerCustomerContactModel2ContactDetail } from '@web-common/components/util/contact';
import outerStyle from './index.module.scss';
import style from './header.module.scss';
import * as defaultLogo from '@/images/icons/customerDetail/default-logo.png';
import { CustomerBaseInfo } from './component/baseInfo';
import { MailSidebarFollows } from './component/follows/follows';
import EllipsisLabels from '../ellipsisLabels/ellipsisLabels';
import { AccountIcon, AddManagerIcon, EditIcon, NewFollowIcon, NewScheduleIcon, WebsiteIcon } from './component/icons';
import { createShiftManagerModal } from '../ShiftModal/shiftManager';
// import { createNewBusinessModal } from '../../Business/components/CreateNewBusinessModal/createNewBussinessModal';
// import { createNewScheduleModal } from '../editSchedule/editSchedule';
import { EmailList } from './component/emailList/list';
import { ContactList } from './component/contactList/customerContactList';
import { CardType, MailSidebarTracker, SideBarActions, TabNameMap } from './tracker';

import SalesPitchPageHoc from '@/components/Layout/EnterpriseSetting/salesPitch';
// import SalesPitchGuideHoc from '@/components/Layout/EnterpriseSetting/salesPitch/components/salesPitchGuide';
import { salesPitchManageTrack } from '@/components/Layout/EnterpriseSetting/salesPitch/utils/util';
import { PrivilegeCheckForMailPlus } from '@/components/UI/PrivilegeEnhance';
import { ReactComponent as More } from '@/images/icons/more.svg';
import { Opportunity } from './component/opportunity';
import { customerBackToOpenseaModal, openseaCustomerReceiveModal } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer2';
import { UniDrawerModuleId, showUniDrawer } from '@lxunit/app-l2c-crm';

// 操作类型，编辑客户，新建日程，写跟进，添加负责人，新建商机，退回公海，认领客户
export type actionKeyString = 'edit' | 'newSchedule' | 'newFollow' | 'addManager' | 'newBO' | 'returnOpenSea' | 'getCustomer';
interface SidebarCustomerInfoProps {
  info?: CustomerDetail;
  onEdit?: () => void;
  onEditContact?: (contactId: string, email?: string) => void;
  actionKeys: actionKeyString[];
  hasBusiness?: boolean; // 是否有商机模块，uni替换后可能没有商机
  onAddManagerSuccess?: () => void;
  refresh?: () => void; // tab切换要求重新请求数据
  isOpenSea?: boolean; // 是否是公海客户
  // customerRole?: EmailRoles; // 客户角色
  contactModel?: ContactModel; // email和account换来的ContactModel
  originName?: string; // 备用的昵称
  hideAddOpportunity?: boolean; // 是否隐藏新建商机按钮，默认false
  role?: 'myCustomer' | 'colleagueCustomer' | 'openSeaCustomer'; // 给业务系统使用,用来传入身份信息。我的客户：'myCustomer'，同事客户：'colleagueCustomer'，公海客户：'openSeaCustomer'
}

const { TabPane } = Tabs;
// 现在只展示为按钮，icon目前是无意义的
const actions: Array<{
  key: actionKeyString;
  label: string;
  icon?: React.ReactNode;
  resourceLabel?: string;
  accessLabel?: string;
}> = [
  {
    key: 'edit',
    label: getIn18Text('BIANJIKEHU'),
    icon: <EditIcon />,
  },
  {
    key: 'newSchedule',
    label: getIn18Text('XINJIANRICHENG'),
    icon: <NewScheduleIcon />,
  },
  {
    key: 'newFollow',
    label: getIn18Text('XIEGENJIN'),
    icon: <NewFollowIcon />,
  },
  {
    key: 'addManager',
    label: getIn18Text('TIANJIAFUZEREN'),
    icon: <AddManagerIcon />,
  },
  {
    key: 'returnOpenSea',
    label: getIn18Text('TUIHUIGONGHAI'),
  },
  {
    key: 'getCustomer',
    label: getIn18Text('RENLINGWEIKEHU'),
    resourceLabel: 'CONTACT_OPEN_SEA',
    accessLabel: 'CLAIM',
  },
  {
    // 新建商机需要商机操作权限
    key: 'newBO',
    label: getIn18Text('XINJIANSHANGJI'),
    resourceLabel: 'COMMERCIAL',
    accessLabel: 'OP',
  },
];
const actionMap: Record<string, SideBarActions> = {
  edit: SideBarActions.Edit,
  newBO: SideBarActions.AddBusiness,
  newSchedule: SideBarActions.AddSchedule,
  newFollow: SideBarActions.AddFollowup,
  addManager: SideBarActions.AddManager,
  returnOpenSea: SideBarActions.BackToOpenSea, // 退回公海
};

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const mailPlusCustomerApi = apiHolder.api.requireLogicalApi(apis.mailPlusCustomerApiImpl) as MailPlusCustomerApi;

// 联系人分页请求，页码大小
const contactListPageSize = 100;

export const SidebarCustomerInfo = React.forwardRef((props: SidebarCustomerInfoProps, ref) => {
  const SalesPitchPage = useMemo(() => SalesPitchPageHoc('readMailAside'), []);
  // const SalesPitchGuide = useMemo(() => SalesPitchGuideHoc('1'), []);

  const {
    info,
    onEdit,
    onEditContact,
    actionKeys,
    hasBusiness = true,
    onAddManagerSuccess,
    refresh,
    isOpenSea = false,
    contactModel,
    originName,
    hideAddOpportunity = false,
    role,
  } = props;
  const [activeTab, setActiveTab] = useState('0');
  const [isEditFollow, setIsEditFollow] = useState(false);
  const followsRef = useRef<any>(null);
  // web是否新建日程
  const [showBox, setShowbox] = useState(false);
  const scheduleActions = useActions(ScheduleActions);
  const { catalogList, unSelectedCatalogIds } = useAppSelector(state => state.scheduleReducer);
  // 新建日程的contactItem[]
  const [scheduleContactItemList, setScheduleContactItemList] = useState<ContactItem[]>([]);
  // uni 商机弹窗
  // const [, setUniOpportunityParam] = useState2RM('uniOpportunityParam');
  // 商机tab
  const opportunityRef = useRef<any>(null);
  // 商机tab是否展示，商机查看权限
  const showOpportunity = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'COMMERCIAL', 'VIEW|OP|DELETE|EXPORT'));
  // 联系人数据
  const [contactInfo, setContactInfo] = useState<{ list: ContactDetail[]; total: number; page: number }>({ list: [], total: 0, page: 1 });
  // 客户来源映射
  const [sourceObj, setSourceObj] = useState<Record<number, string>>();
  // 客户分级映射
  const [companyLevelObj, setCompanyLevelObj] = useState<Record<number, string>>();
  // 客户角色
  const customerRole = useMemo(() => {
    if (role && ['myCustomer', 'colleagueCustomer', 'openSeaCustomer'].includes(role)) {
      return role;
    } else {
      return contactModel && contactModel.customerOrgModel?.role;
    }
  }, [contactModel, role]);
  // 是否是无权限的同事客户
  const isNoAuth = useMemo(() => customerRole && customerRole === 'colleagueCustomerNoAuth', [customerRole]);
  // 获取联系人数据
  const getContactInfo = async (page: number) => {
    if (customerRole && info?.company_id && ['myCustomer', 'colleagueCustomer', 'openSeaCustomer'].includes(customerRole)) {
      const params = {
        id: info.company_id,
        emailRole: customerRole,
        page,
        pageSize: contactListPageSize,
      } as IGetContactListParams;
      const res = await mailPlusCustomerApi.doGetContactListByCompanyId(params);
      const { totalSize, page: pageNum, data, success } = res;
      if (success) {
        const contactList = transServerCustomerContactModel2ContactDetail(data);
        const contactInfoList = pageNum === 1 ? contactList : [...contactInfo.list, ...contactList];
        setContactInfo({ list: contactInfoList, total: totalSize, page });
      } else {
        setContactInfo({ list: [], total: 0, page: 1 });
        console.log('客户侧边栏获取联系人数据失败');
      }
    }
  };
  // 客户来源映射表
  const getCustomerSourceInfo = () => {
    mailPlusCustomerApi.doGetClueStatus('customer').then(res => {
      const objSource: Record<number, string> = {};
      const objCompanyLevel: Record<number, string> = {};
      res?.source?.forEach(i => {
        objSource[i.id] = i.value as string;
      });
      res?.company_level?.forEach(i => {
        objCompanyLevel[i.id] = i.value as string;
      });
      setSourceObj(objSource);
      setCompanyLevelObj(objCompanyLevel);
    });
  };
  // 分页获取更多联系人
  const getMoreContactInfo = () => {
    getContactInfo(contactInfo.page + 1);
  };
  // 刷新联系人数据，编辑联系人成功后刷新,认领客户成功，退回公海成功后
  const refreshContactList = () => {
    getContactInfo(1);
  };

  // info变化,重新获取联系人
  useEffect(() => {
    getContactInfo(1);
    getCustomerSourceInfo();
  }, [info?.company_id]);

  useEffect(() => {
    MailSidebarTracker.trackTabChange(CardType.Clue, TabNameMap[activeTab]);
  }, [activeTab]);

  // 话术库展示打点
  useEffect(() => {
    if (info?.company_id && activeTab === '3') {
      salesPitchManageTrack({ opera: 'SHOW' });
    }
  }, [activeTab, info?.company_id]);

  const managers = info ? info.manager_list?.map(item => item.manager_name || '-').join('，') : '-';
  const managerIds = Array.isArray(info?.manager_list) ? info?.manager_list.map(v => v.id) : [];

  // 获取新建日程需要的结构
  useEffect(() => {
    // 默认联系人
    const currentUser = systemApi.getCurrentUser()?.id || '';
    const emailList = info?.contact_list?.filter(item => item.main_contact).map(item => item.email) || [];
    const users = [...new Set([...emailList, currentUser])];
    getContanctObjs(users).then(contactLists => setScheduleContactItemList(contactLists));
  }, [info?.contact_list]);

  // 新建日程
  const createSchedule = async () => {
    const defaultMoment = initDefaultMoment();
    const creatDirectStartTime = defaultMoment.startTime;
    const creatDirectEndTime = defaultMoment.endTime;
    // 获取日历
    if (systemApi.isElectron()) {
      const initData: SchedulePageEventData = {
        catalogList,
        unSelectedCatalogIds,
        creatDirectStartTimeStr: creatDirectStartTime.format('YYYY-MM-DD HH:mm'),
        creatDirectEndTimeStr: creatDirectEndTime.format('YYYY-MM-DD HH:mm'),
        defaultContactList: scheduleContactItemList,
        source: ScheduleSyncObInitiator.MAIL_MODULE,
        belongIdStr: 'customerSideBar',
      };
      systemApi.createWindowWithInitData('scheduleOpPage', { eventName: 'initPage', eventData: initData });
      return;
    }
    scheduleActions.setCreatDirectStartTime(creatDirectStartTime);
    scheduleActions.setCreatDirectEndTime(creatDirectEndTime);
    setShowbox(true);
  };

  const handleScheduleClose = (data: any) => {
    if (data) {
      const params = {
        start: data.startDate || moment(lodashGet(data, 'data.moments.startDate', moment())).format('YYYY-MM-DD HH:mm:ss'),
        subject: data.summary || lodashGet(data, 'data.summary', ''),
        company_id: info?.company_id,
      };
      customerApi.createCustomerSchedule(params).then(() => {
        followsRef.current?.refresh();
      });
    }
    setShowbox(false);
  };

  useImperativeHandle(ref, () => ({
    setActiveTab,
    refreshContactList,
  }));

  // 新建商机
  const addOpportunity = () => {
    // setUniOpportunityParam({
    //   visible: true,
    //   type: 'add',
    //   companyId: info?.company_id,
    //   companyName: info?.company_name,
    //   onSuccess: () => {
    //     // taost,Uni应该是已经处理了
    //     console.log('新建商机成功');
    //     opportunityRef.current?.refreshOpportunity();
    //   },
    // });
    showUniDrawer({
      moduleId: UniDrawerModuleId.BusinessCreate,
      moduleProps: {
        visible: true,
        companyId: info?.company_id,
        companyName: info?.company_name,
        onSuccess: () => {
          opportunityRef.current?.refreshOpportunity();
        },
      },
    });
  };
  // 认领客户
  const getCustomer = () => {
    if (info?.company_id) {
      openseaCustomerReceiveModal(info.company_id, () => {
        // 更新一下redux
        refresh && refresh();
      });
    }
  };
  // 退回公海
  const returnOpenSea = () => {
    if (info?.company_id) {
      customerBackToOpenseaModal(info.company_id, () => {
        // 更新一下redux
        refresh && refresh();
      });
    }
  };

  // 监听electron中日程创建成功
  useMsgRenderCallback('syncScheduleState', e => {
    if (e.eventStrData === 'customerSideBar') {
      handleScheduleClose(e.eventData);
    }
  });

  // 点击按钮
  const handleActionClick = (key: actionKeyString) => {
    if (!info) return;
    switch (key) {
      case 'edit':
        onEdit && onEdit();
        break;
      case 'newBO':
        addOpportunity();
        break;
      case 'newFollow':
        setActiveTab('1');
        setIsEditFollow(true);
        break;
      case 'newSchedule':
        createSchedule();
        break;
      case 'addManager':
        createShiftManagerModal({
          data: [
            {
              id: info.company_id,
              name: info.company_name,
            },
          ],
          shiftType: 'add',
          modalType: 'company',
          onCancel(flag) {
            console.log('createModal', 'shiftManager', flag);
          },
          onSuccess() {
            if (onAddManagerSuccess) {
              onAddManagerSuccess();
            }
          },
          currentManagers: Array.isArray(managerIds) && managerIds.length > 0 ? new Set(managerIds) : undefined,
        });
        break;
      case 'returnOpenSea':
        console.log('退回公海');
        returnOpenSea();
        break;
      case 'getCustomer':
        getCustomer();
        break;
      default:
        break;
    }
    MailSidebarTracker.trackAction(CardType.Customer, actionMap[key]);
  };

  // 依赖项去掉isOpenSea，可以取到最新值，又不至于多次刷新
  const resource = useMemo(
    () => ({
      id: info ? info.company_id : '',
      customerType: (isOpenSea ? 'customerOpenSea' : 'customer') as FollowsType,
    }),
    [info?.company_id]
  );
  const website = useMemo(() => {
    const href = info?.website || info?.company_domain;
    if (href) {
      const link = href.startsWith('https://') || href.startsWith('http://') ? href : 'http://' + href;
      return (
        <a href={link} target="_blank" rel="noreferrer">
          {href}
        </a>
      );
    }
    return '-';
  }, [info?.website, info?.company_domain]);

  const displayActions = useMemo(() => {
    if (!actionKeys) return actions;
    const map: Record<string, number> = {};
    actionKeys?.forEach(k => {
      map[k] = 1;
    });
    return actions.filter(item => map[item.key] === 1);
  }, [actionKeys]);

  // 更多下来中点击tab
  const selectTab = (val: string) => {
    setActiveTab(val);
    setTimeout(() => {
      const activeTabs = document.querySelectorAll('.waimao-tabs .ant-tabs-tab-active');
      if (activeTabs && activeTabs.length) {
        activeTabs.forEach(activeTab => {
          activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
        });
      }
    }, 100);
  };

  // 话术库title
  // const salesPitchTabTitle = useMemo(
  //   () => (
  //     <SalesPitchGuide>
  //       <span>{getIn18Text('HUASHUKU')}</span>
  //     </SalesPitchGuide>
  //   ),
  //   []
  // );
  const salesPitchTabTitle = getIn18Text('HUASHUKU');

  // 渲染操作，如果操作数，小于等于4则正常展示，否则折叠起来
  const maxButtonNum = 4; // 最多展示多少个按钮
  const renderActions = (
    _displayActions: {
      accessLabel?: string;
      resourceLabel?: string;
      key: actionKeyString;
      label: string;
    }[]
  ) => {
    if (_displayActions.length > maxButtonNum) {
      return (
        <>
          {/* 前三个正常展示 */}
          {_displayActions.slice(0, maxButtonNum - 1).map(i => (
            <PrivilegeCheckForMailPlus resourceLabel={i.resourceLabel || 'CONTACT'} accessLabel={i.accessLabel || 'OP'}>
              <Button key={i.key} onClick={() => handleActionClick(i.key)} className={style.actionbtn} btnType="minorGray" inline>
                {i.label}
              </Button>
            </PrivilegeCheckForMailPlus>
          ))}
          <Dropdown
            overlayClassName="u-tree-dropmenu"
            overlayStyle={{ width: 'auto' }}
            placement="bottomLeft"
            overlay={
              <Menu>
                {_displayActions.slice(maxButtonNum - 1).map(i => (
                  <Menu.Item key={i.key}>
                    <PrivilegeCheckForMailPlus resourceLabel={i.resourceLabel || 'CONTACT'} accessLabel={i.accessLabel || 'OP'}>
                      <span onClick={() => handleActionClick(i.key)}>{i.label}</span>
                    </PrivilegeCheckForMailPlus>
                  </Menu.Item>
                ))}
              </Menu>
            }
          >
            <div className={classnames(style.moreBtn, style.actionbtn)}>
              <More />
            </div>
          </Dropdown>
        </>
      );
    }
    return _displayActions.map(i => (
      <PrivilegeCheckForMailPlus resourceLabel={i.resourceLabel || 'CONTACT'} accessLabel={i.accessLabel || 'OP'}>
        <Button key={i.key} onClick={() => handleActionClick(i.key)} className={style.actionbtn} btnType="minorGray" inline>
          {i.label}
        </Button>
      </PrivilegeCheckForMailPlus>
    ));
  };

  // 渲染tab
  const renderTabList = () => {
    let TabPaneList: {
      title: React.ReactElement | string;
      key: string;
      children: React.ReactElement | undefined;
      show?: boolean;
    }[] = [];
    // 无权限的同事客户，仅仅展示话术库
    if (isNoAuth) {
      TabPaneList = [{ title: salesPitchTabTitle, key: '0', children: <SalesPitchPage /> }];
    } else {
      // tab配置提取出来
      TabPaneList = [
        {
          title: salesPitchTabTitle,
          key: '0',
          children: <SalesPitchPage />,
        },
        {
          title: getIn18Text('DONGTAI'),
          key: '1',
          children: info && (
            <MailSidebarFollows
              ref={followsRef}
              hasBusiness={hasBusiness}
              visible={activeTab === '1'}
              resource={resource}
              onEditorClose={() => setIsEditFollow(false)}
              isEdit={isEditFollow}
              disabled={!!isOpenSea}
            />
          ),
        },
        {
          title: getIn18Text('JICHUXINXI'),
          key: '2',
          children: (
            <CustomerBaseInfo
              data={
                {
                  ...info,
                  source: (sourceObj && info?.source && sourceObj[+info?.source]) || info?.sourceName,
                  company_level: (companyLevelObj && info?.company_level && companyLevelObj[+info?.company_level]) || info?.company_level_name,
                } as CustomerDetail
              }
            />
          ),
        },
        {
          title: `${getIn18Text('LIANXIREN')}${+contactInfo.total ? '(' + (contactInfo.total > 99 ? '99+' : contactInfo.total) + ')' : ''}`,
          key: '3',
          children: <ContactList readonly={!!isOpenSea} list={contactInfo.list} totalSize={contactInfo.total} onEdit={onEditContact} loadMore={getMoreContactInfo} />,
        },
        {
          title: getIn18Text('WANGLAIYOUJIAN'),
          key: '4',
          children: info && <EmailList resourceId={info.origin_company_id} condition={CustomerAuthDataType.Company} />,
        },
      ];
      // 判断是否展示商机tab
      if (showOpportunity) {
        TabPaneList.push({
          title: getIn18Text('SHANGJI'),
          key: '5',
          children: info && (
            <Opportunity
              hideAddBtn={hideAddOpportunity}
              ref={opportunityRef}
              onAddOpportunity={addOpportunity}
              isOpenSea={isOpenSea}
              resourceId={info.origin_company_id}
            />
          ),
        });
      }
    }
    return (
      <Tabs
        className={classnames('waimao-tabs', style.flexTabs)}
        activeKey={activeTab}
        onChange={val => selectTab(val)}
        tabBarGutter={16}
        animated={{ tabPane: true }}
        tabBarExtraContent={
          TabPaneList.length > 4 && {
            right: (
              <Dropdown
                overlayClassName="u-tree-dropmenu"
                overlayStyle={{ width: 'auto' }}
                placement="bottomLeft"
                overlay={
                  <Menu>
                    {TabPaneList.map(tabItem => (
                      <Menu.Item
                        key={tabItem.key}
                        onClick={() => {
                          selectTab(tabItem.key);
                        }}
                      >
                        {tabItem.title}
                      </Menu.Item>
                    ))}
                  </Menu>
                }
              >
                <div className={classnames(style.moreBtn, style.actionbtn, style.moreTabBtn)}>
                  <More />
                </div>
              </Dropdown>
            ),
          }
        }
      >
        {TabPaneList.map(tabItem => (
          <TabPane tab={tabItem.title} key={tabItem.key}>
            {tabItem.children}
          </TabPane>
        ))}
      </Tabs>
    );
  };
  const showEmail = contactModel?.contact.displayEmail || contactModel?.contact.accountName;
  // 展示的名称
  const showContactName = contactModel?.contact.contactName || originName || showEmail;

  return (
    <>
      <div className={classnames(style.infoContainer, outerStyle.columnFlexContainer)}>
        <div className={style.header}>
          <div className={style.headerInfo}>
            {
              // 是否是无权限的同事客户
              !isNoAuth ? (
                <div className={style.headerInfoMain}>
                  <div className={style.flexRow}>
                    <img alt="logo" className={style.companyLogo} src={info?.company_logo || defaultLogo} />
                    <span className={style.companyName} title={info?.company_name}>
                      {info?.company_name}
                    </span>
                  </div>
                  <div className={style.row} style={{ marginTop: 16 }}>
                    {/* 公海客户，无法添加标签，需要把是否公海传递进去 */}
                    <EllipsisLabels
                      hideAdd={isOpenSea}
                      labelMaxWidth="initial"
                      onAddLabels={() => onEdit && onEdit()}
                      className={style.labels}
                      isMailPlus={true}
                      list={info?.label_list}
                      deletable={false}
                    />
                  </div>
                  <div className={style.row}>
                    <Tooltip title={getIn18Text('WANGZHI')}>
                      <WebsiteIcon />
                    </Tooltip>
                    <span>{website}</span>
                  </div>
                  <div className={style.row}>
                    <Tooltip title={getIn18Text('FUZEREN')}>
                      <AccountIcon />
                    </Tooltip>
                    <Tooltip title={managers}>{managers}</Tooltip>
                  </div>
                </div>
              ) : (
                <div className={style.headerInfoMain}>
                  <div className={style.flexRow}>
                    <span className={style.companyName} title={showContactName}>
                      {showContactName}
                    </span>
                  </div>
                  <div className={style.row} style={{ marginTop: 16 }}>
                    <span>
                      {getIn18Text('YOUXIANG')}: {showEmail || '-'}
                    </span>
                  </div>
                </div>
              )
            }
          </div>
          {!isNoAuth && (
            <div className={style.actions}>
              {/* 渲染操作 */}
              {renderActions(displayActions)}
            </div>
          )}
        </div>
        <div className={style.body}>{renderTabList()}</div>
      </div>
      {showBox && (
        <div className={style.schedule}>
          <CreateScheduleBox
            source={ScheduleSyncObInitiator.MAIL_MODULE}
            defaultContactList={scheduleContactItemList}
            onCancel={data => handleScheduleClose(data)}
            getReferenceElement={() => null}
          />
        </div>
      )}
    </>
  );
});
