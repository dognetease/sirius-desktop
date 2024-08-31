import React, { useEffect, useMemo, useRef, HTMLAttributes, ComponentProps, useCallback } from 'react';
import { useLocation, useNavigate, navigate, globalHistory } from '@reach/router';
import { useSelector } from 'react-redux';
import { SiriusUniCrmBridgeApi, UnitableCrmBridgeApi, ContactBridgeApi, ContactBasic, OneKeyMarketingParams, MarketingHostingParams } from '@lxunit/bridge-types';
import { SiriusPageProps } from '@/components/Layout/model';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import { getEdmUserTreeAsync } from '@web-common/state/reducer/edmUserReducer';

import { ConfigActions } from '@web-common/state/reducer';
import { RootState, useAppDispatch } from '@web-common/state/createStore';
import { apiHolder, apis, MailApi, CustomerEmailEmailList, RegularCustomerMenuData, getIn18Text, GlobalSearchContactItem } from 'api';
import { roleApi, host, stage } from './api';
import { writeLog, isMatchUnitableCrmHash, getUnitableCrmHash, setContactListRequest } from './api/helper';
import { subscribeRegularCustomerMenuData, useRegularCustomerMenuData } from './hooks/useRegularCustomerMenuData';
import { useSelectContactModal } from './penpal-bridge/contact-impl';
import Marketing from './components/Marketing/marketingModal';
import MarketingHosting from './components/Marketing/marketingHostingModal';
import WhatsAppSendMessage from './components/WhatsAppSendMessage';
import styles from './unitable-crm.module.scss';
import SalesPitchPageHoc from '@/components/Layout/EnterpriseSetting/salesPitch';
import ContactPicker from '@/components/Layout/Customer/components/contactPicker/contactPicker';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import LevelDrawer from '@/components/Layout/CustomsData/components/levelDrawer/levelDrawer';
import CustomsDetail from '@/components/Layout/CustomsData/customs/customsDetail/customsDetail';
import ContactsSelectModal, {
  ContactItem,
  OutPutContactItem,
} from '@/components/Layout/CustomsData/customs/customsDetail/components/contactsSelectModal/contactsSelectModal';
import { onDrawerClose, onDrawerOpen, recData as recDataType } from '@/components/Layout/CustomsData/utils';
import { EmailAuthModal } from '@/components/Layout/Customer/components/emailList/uniIndex';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import EffectivePrice from '@web-entry-ff/views/price/menuIndex';
import PendingPrice from '@web-entry-ff/views/price/invalidPrice';
import { useUniVersionControl } from './components/use-uni-version-control/use-uni-version-control';
import AutoRecommend from '../../web/src/components/Layout/Customer/CustomerDiscovery/autoRecommend';
import { MergeCompanyTable } from '../../web/src/components/Layout/globalSearch/detail/CompanyDetailMerge';

import ManualRecommend from '../../web/src/components/Layout/Customer/CustomerDiscovery/manualRecommend';
import RecommendOplist from '../../web/src/components/Layout/Customer/CustomerDiscovery/recommendOplist';
import { Authorization } from '../../web/src/components/Layout/Customer/CustomerDiscovery/authorization';
import WhatsappHistory from '@web/components/Layout/Customer/components/whatsappHistory/ChatMessageList';
import { HandlerData, assignContactApiMethods, assingUnitableApiMethods } from './penpal-bridge/l2c-bridge';
import { SiriusL2cApp, setUpL2cConf, setHttpConfig, NoPermission, l2cRouterDriver } from '@lxunit/app-l2c-crm';
import '@lxunit/app-l2c-crm/lib.css';
import Editor from '@web-common/components/UI/LxEditor/LxEditor';
import PinnedMenu from '@web-common/components/PinnedMenu/pinnedMenu';
import { NationFlagComp } from '@/components/Layout/CustomsData/components/NationalFlag';

l2cRouterDriver?.watchReachRouter(globalHistory, navigate);
const SalesPitchPage = SalesPitchPageHoc('uniCustomer');
type SiriusL2cAppProps = ComponentProps<typeof SiriusL2cApp>;
// 绕开 redux connect
const SiriusL2cAppWithModulePermission = (props: SiriusL2cAppProps) => {
  const modulePermission = useSelector((state: RootState) => state.privilegeReducer.modules);
  const productCode = useAppSelector((state: RootState) => state.privilegeReducer.version);
  const loading =
    useSelector((state: RootState) => {
      return state.privilegeReducer.loading;
    }) || productCode === '';
  if (modulePermission && Object.keys(modulePermission).length > 0 && !loading) {
    return <SiriusL2cApp sidebarMenuVisible={props.sidebarMenuVisible} menuDataType={props.menuDataType} />;
  }
  if (loading) {
    return null;
  }
  return <NoPermission />;
};
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
import { useAppSelector } from '@web-common/state/createStore';
import { useNoviceTask } from '@/components/Layout/TaskCenter/hooks/useNoviceTask';
import { CompanyDetail, GlobalSearchDetailProps } from '@/components/Layout/globalSearch/detail/CompanyDetail';
import { DetailLevelStatus } from '@/components/Layout/globalSearch/search/search';
import { CheckboxSelect } from '@web-edm/addressBook/components/CheckboxSelect/index-new';
import { TransferGroup } from '@web-edm/addressBook/views/TransferGroupNew';

interface UnitableCrmState {
  iframeURL: string;
  resoloveFun: (value: boolean) => void;
  eventHandlerData: OneKeyMarketingParams | MarketingHostingParams;
  marketVisible: boolean;
  marketHostingVisible: boolean;
  waVisible: boolean;
  waEventHandlerData: any;
  contactMarketVisible: boolean;
  contactEventHandlerData: HandlerData;
  contactPickerVisible: boolean;
  contacts: ContactBasic[];
  recData: recDataType;
  authorization: boolean;
  contactEmails: CustomerEmailEmailList;
  /** */
  hasReceiveChangePageMode: boolean;
  sidebarWidth: number | undefined;
  error: boolean;
  code: number;
  getUrlLoading: boolean;
  customDetail: boolean; // 海关详情页
  globalSearchDetailData: GlobalSearchDetailState;
  contactsData: contactsDataType;
  nextDetailLevels: Array<DetailLevelStatus>;
}
interface GlobalSearchDetailState {
  visible: boolean;
  data: GlobalSearchDetailProps | null;
}
interface contactsDataType {
  onSubmit: (list?: OutPutContactItem[]) => void;
  onClose: () => void;
  visible: boolean;
  data: ContactItem[];
}

type DivProps = Pick<HTMLAttributes<HTMLDivElement>, 'style'>;
type Props = Pick<SiriusPageProps, 'name'> &
  DivProps & {
    /**
     * true 表示当前是uni模块路由
     */
    active: boolean;
  };

type GetRoleApiParams = Parameters<typeof roleApi.getModuleDataRange>;
setUpL2cConf({
  /**crm 运行时需要判断是否是线上环境 */
  isProduction: stage === 'prod',
  /**自动筛选 组件 */
  autoRecommend: AutoRecommend,
  /**手动筛选 组件*/
  customRecommend: ManualRecommend,
  /** 筛选记录 组件*/
  recommendOperateList: RecommendOplist,
  /**重复公司Table组件，用于推荐线索大数据展示重复的公司 */
  mergeCompanyTable: MergeCompanyTable,
  /**筛选管理 组件*/
  authorization: Authorization,
  /**话术库 */
  phrase: SalesPitchPage,
  /** whatsapp 聊天历史 */
  whatsappHistory: WhatsappHistory,
  /**编辑器 */
  editor: Editor,
  /** 写日志 */
  writeLog: writeLog,
  /**小红点逻辑 */
  subscribeRegularCustomerMenuData: subscribeRegularCustomerMenuData,
  /**获取数据权限接口 */
  getRoleApiModuleDataRange: (...req: GetRoleApiParams) => {
    return roleApi.getModuleDataRange(...req);
  },
  /**常用功能菜单 */
  frequentlyUsed: PinnedMenu,
  useNoviceTaskHook: useNoviceTask,
  useEdmOrgData: () => {
    const edmOrgData = useAppSelector(state => state.edmUserReducer.orgData);
    return edmOrgData;
  },
  /** 国旗组件 */
  nationFlag: NationFlagComp,
  /** 联系人分组checkbox selector */
  /** 联系人分组操作弹窗 */
  groupEditor: CheckboxSelect,
  groupModal: TransferGroup,
  effectivePrice: EffectivePrice,
  pendingPrice: PendingPrice,
});
setHttpConfig({
  httpHost: host,
});

const getUrlSearchParams = (
  hash: string
): {
  tableId?: string;
  viewId?: string;
  from?: string;
  filter?: string;
  page?: string;
} => {
  const searchString = hash.replace(/^[^?]*\??/, '');
  const searchParams = new URLSearchParams(searchString);
  const params = {} as any;
  searchParams.forEach((val, key) => {
    params[key] = val;
  });
  return params;
};

interface UnitableCrmBaseProps {
  tableId?: string;
  viewId?: string;
  from?: string;
  filter?: string;
  siriusPage?: string;
  siriusMenuKey: Record<string, boolean>;
  navigate: ReturnType<typeof useNavigate>;
  regularMenuData?: RegularCustomerMenuData;
  updateUniVersionHandle: (data: Parameters<UnitableCrmBridgeApi['updateUniVersion']>[0]) => void;
  callSelectContractHandle: ContactBridgeApi['callSelectContactModal'];
}

export class UnitableCrmBase extends React.PureComponent<Props & UnitableCrmBaseProps & SiriusL2cAppProps, UnitableCrmState> {
  iframeRef = React.createRef<HTMLIFrameElement>();
  childBridgeApi: SiriusUniCrmBridgeApi | undefined;
  iframeFun = React.createRef<HTMLIFrameElement>();
  constructor(props: Props & UnitableCrmBaseProps) {
    super(props);

    this.state = {
      iframeURL: '',
      marketVisible: false,
      marketHostingVisible: false,
      eventHandlerData: {} as OneKeyMarketingParams,
      waVisible: false,
      waEventHandlerData: {} as any,
      contactMarketVisible: false,
      contactEventHandlerData: {} as HandlerData,
      contactPickerVisible: false,
      authorization: false,
      contactEmails: {} as CustomerEmailEmailList,
      contacts: [],
      error: false,
      code: 0,
      getUrlLoading: false,
      resoloveFun: () => {},
      recData: {
        visible: false,
        to: 'buysers',
        zIndex: 0,
        content: {
          country: '',
          to: 'buysers',
          companyName: '',
        },
      },
      globalSearchDetailData: {
        visible: false,
        data: null,
      },
      contactsData: {
        visible: false,
        data: [],
        onSubmit: () => {},
        onClose: () => {},
      },
      nextDetailLevels: new Array(3).fill({ open: false }),
      hasReceiveChangePageMode: false,
      sidebarWidth: undefined,
      customDetail: false,
    };

    this.connectToChild();
  }

  componentDidMount() {
    (window as any).unitableCrmDevHelper = this;
    this.toggleHeaderAreaHeight();
  }

  // 海关数据展示
  handleCustomsDetail = (content: recDataType['content'], zindex: number) => {
    // if (zindex !== 0) return;
    let data = onDrawerOpen(this.state.recData, { ...content }, zindex);
    this.setState({
      recData: { ...data },
      customDetail: true,
    });
  };
  // 全球搜详情页
  handleGlobalSearchDetail = (detailData: GlobalSearchDetailState) => {
    this.setState({
      globalSearchDetailData: detailData,
    });
  };
  // 录入联系人弹窗
  handleContactsModal = (contactsData: ContactItem[], onSubmit: (list?: OutPutContactItem[]) => void, onClose: () => void) => {
    this.setState({
      contactsData: {
        visible: true,
        data: contactsData,
        onSubmit,
        onClose,
      },
    });
  };
  // 关闭海关数据
  onCustomerDrawerClose = (index: number) => {
    // if (index !== 0) return;
    let data = onDrawerClose(this.state.recData, index);
    this.setState({
      recData: { ...data },
      customDetail: false,
    });
  };

  handlePickContact = (contacts: ContactBasic[]) => {
    if (!contacts.length) return Toast.info({ content: '暂无联系人' });
    if (contacts.length === 1) return this.handleWriteMail([contacts[0].contactEmail]);
    this.setState({
      contactPickerVisible: true,
    });
  };

  handleWriteMail = (contacts: string[]) => {
    mailApi.doWriteMailToContact([...new Set(contacts)]);
  };

  connectToChild() {
    let _this = this;
    const self = this;

    assignContactApiMethods({
      callSelectContactModal(params) {
        return self.props.callSelectContractHandle(params);
      },
    });
    assingUnitableApiMethods({
      sendEmail(listData) {
        _this.handlePickContact(listData || []);
        _this.setState({
          contacts: listData || [],
        });
      },
      oneKeyMarketing(data) {
        // 传过来的获取联系人方法暂时缓存一下，用于在其它模块调用
        setContactListRequest(data);
        self.setState({
          marketVisible: true,
          eventHandlerData: data,
        });
      },
      marketingHosting(data) {
        // 传过来的获取联系人方法暂时缓存一下，用于在其它模块调用
        setContactListRequest(data);
        self.setState({
          marketHostingVisible: true,
          eventHandlerData: data,
        });
      },
      // 发送whatsApp
      // @ts-ignore
      sendWhatsApp(data) {
        self.setState({
          waVisible: true,
          waEventHandlerData: data,
        });
      },

      /** 查看海关数据详情页 */
      customsDetail(data) {
        _this.handleCustomsDetail(data, 0);
        console.log('customEventHandle handle called', data);
      },

      /** 查看全球搜详情页 */
      globalSearchDetail(detailData: GlobalSearchDetailState) {
        _this.handleGlobalSearchDetail(detailData);
        console.log('globalSearchDetail called', detailData);
      },
      /** 录入联系人弹窗 */
      onOpenContactsModal(contactsData: Array<GlobalSearchContactItem>, onSubmit: (list?: OutPutContactItem[]) => void, onClose: () => void) {
        let keyContactsData = contactsData?.map((e, index) => ({
          type: e.type,
          key: index,
          contactName: e.name,
          email: e.contact,
          telephones: [e.phone],
          job: e.jobTitle,
          whatsApp: '',
          linkedinUrl: e.linkedinUrl,
          facebookUrl: e.facebookUrl,
          twitterUrl: e.twitterUrl,
          id: e.contactId,
        }));
        _this.handleContactsModal(keyContactsData, onSubmit, onClose);
        console.log('onOpenContactsModal called', contactsData);
      },
      /**获取往来邮件 未读气泡提醒*/
      getRegularCustomerMenuData() {
        return self.props.regularMenuData;
      },
    });
  }

  toggleHeaderAreaHeight() {
    /**
     * 用于修复：http://jira.netease.com/browse/UNITABLE-2491?filter=51402
     * 在window环境下，crm iframe区域和header(有 最小化、最大化、关闭按钮)占据了整个app窗口的高度
     * app header 区域高度为32px; wrap组件高度为60px；因此需要调整 wrap组件高度为32px;
     */
    const el = document.querySelector('.wrap-component-class-flag');
    if (el) {
      if (this.props.active) {
        el.setAttribute('style', 'height:32px');
      } else {
        el.removeAttribute('style');
      }
    }
  }

  componentDidUpdate(_prevProps: any, prevState: UnitableCrmState) {
    writeLog({ _prevProps, prevState }, 'unitable crm组件执行componentDidUpdate');
    this.toggleHeaderAreaHeight();
  }

  render(): React.ReactNode {
    const {
      eventHandlerData,
      marketVisible,
      waVisible,
      waEventHandlerData,
      contactPickerVisible,
      contacts,
      recData,
      authorization,
      contactEmails,
      globalSearchDetailData,
      nextDetailLevels,
      contactsData,
      customDetail,
    } = this.state;
    return (
      <PageContentLayout from="unitable-crm">
        <div style={{ height: '100%', display: 'flex' }}>
          <div style={{ width: '100%' }} className={styles['container']}>
            <SiriusL2cAppWithModulePermission sidebarMenuVisible={this.props.sidebarMenuVisible} menuDataType={this.props.menuDataType} />
          </div>
          {/* {siriusPage && hasReceiveChangePageMode ? <SiriusPage siriusPage={siriusPage} /> : null} */}
          <MarketingHosting data={eventHandlerData} visible={this.state.marketHostingVisible} onCancel={() => this.setState({ marketHostingVisible: false })} />
          <Marketing data={eventHandlerData} visible={marketVisible} onCancel={() => this.setState({ marketVisible: false })} />
          <WhatsAppSendMessage data={waEventHandlerData} visible={waVisible} onCancel={() => this.setState({ waVisible: false })} />
          {/* 联系人一键营销不需要了，因此注释掉 */}
          {/* <ContactMarketingModal data={contactEventHandlerData} visible={contactMarketVisible} onCancel={() => this.setState({ contactMarketVisible: false })} /> */}
          <ContactPicker
            visible={contactPickerVisible}
            data={contacts}
            onCancel={() => this.setState({ contactPickerVisible: false })}
            onSubmit={(pickedIds, pickedEmails) => {
              this.setState({ contactPickerVisible: false });
              this.handleWriteMail(pickedEmails);
            }}
          />
          {authorization ? (
            <EmailAuthModal
              contactEmails={contactEmails}
              onClose={() =>
                this.setState({
                  authorization: false,
                })
              }
            />
          ) : (
            ''
          )}
          {customDetail && (
            <LevelDrawer
              recData={recData}
              onClose={this.onCustomerDrawerClose}
              onOpen={this.handleCustomsDetail}
              getContainer={() => {
                return window.document.body;
              }}
              zIndex={1000}
            >
              <CustomsDetail />
            </LevelDrawer>
          )}
          {globalSearchDetailData.visible && (
            <Drawer
              visible={globalSearchDetailData.visible}
              onClose={() => {
                this.setState({
                  globalSearchDetailData: {
                    visible: false,
                    data: null,
                  },
                });
              }}
              zIndex={1000}
              getContainer={document.body}
            >
              {globalSearchDetailData.data ? (
                <CompanyDetail
                  key={globalSearchDetailData.data.id}
                  {...globalSearchDetailData.data}
                  showNextDetail={id => {
                    this.setState(prevState => {
                      const [_first, ...rest] = prevState.nextDetailLevels;
                      return { nextDetailLevels: [{ open: true, id }, ...rest] };
                    });
                  }}
                />
              ) : null}
            </Drawer>
          )}
          {nextDetailLevels.map((level, index) => (
            <Drawer
              key={index}
              visible={level.open}
              zIndex={1001 + index}
              getContainer={document.body}
              onClose={() => {
                this.setState(prevState => {
                  return {
                    nextDetailLevels: prevState.nextDetailLevels.map((e, jndex) => {
                      if (index === jndex) {
                        return { open: false };
                      } else {
                        return e;
                      }
                    }),
                  };
                });
              }}
              width={872}
              destroyOnClose
            >
              {level.open && !!level.id && (
                <CompanyDetail
                  showSubscribe
                  id={level.id}
                  reloadToken={0}
                  showNextDetail={id => {
                    if (index < nextDetailLevels.length - 1) {
                      this.setState(prevState => {
                        return {
                          nextDetailLevels: prevState.nextDetailLevels.map((e, jndex) => {
                            if (index + 1 === jndex) {
                              return { id, open: true };
                            } else {
                              return e;
                            }
                          }),
                        };
                      });
                    } else {
                      Toast.warn(`最多打开${nextDetailLevels.length}层`);
                    }
                  }}
                />
              )}
            </Drawer>
          ))}
          {contactsData.visible && (
            <ContactsSelectModal
              contactsList={contactsData.data}
              onOk={data => {
                contactsData.onSubmit(data);
                this.setState(
                  {
                    contactsData: {
                      visible: false,
                      data: [],
                      onSubmit: () => {},
                      onClose: () => {},
                    },
                  },
                  () => contactsData.onClose()
                );
              }}
              title={getIn18Text('LURUKEHU')}
              onCancel={() => {
                this.setState(
                  {
                    contactsData: {
                      visible: false,
                      data: [],
                      onSubmit: () => {},
                      onClose: () => {},
                    },
                  },
                  () => contactsData.onClose()
                );
              }}
              visible={contactsData.visible}
            />
          )}
        </div>
      </PageContentLayout>
    );
  }
}

const UnitableCrmPure: React.FC<Props & SiriusL2cAppProps> = props => {
  const hashRef = useRef<string>();
  const unitableCrmBaseRef = useRef<UnitableCrmBase>(null);
  const menuKeys = useAppSelector(s => s.privilegeReducer.visibleMenuLabels);
  const navigate = useNavigate();
  const location = useLocation();
  const { key, updateUniVersionHandle } = useUniVersionControl({ visible: !!props.active });
  const { callSelectContractHandle, siriusContactModalEl } = useSelectContactModal();
  const dispatch = useAppDispatch();
  const { regularMenuData } = useRegularCustomerMenuData();
  // 路由切出去后，再回来要展示当前页面，因此需要保留离开前的路由
  if (isMatchUnitableCrmHash(location.hash)) {
    hashRef.current = location.hash;
  }
  const hash = isMatchUnitableCrmHash(location.hash) ? location.hash : hashRef.current;
  const hashSearchParams = getUrlSearchParams(hash ?? '');
  const { tableId, viewId, from, filter, page } = hashSearchParams;
  const showVideoDrawer = useCallback<UnitableCrmBridgeApi['showVideoDrawer']>(
    params => {
      dispatch(ConfigActions.showVideoDrawer(params));
    },
    [dispatch]
  );
  useMemo(() => {
    assingUnitableApiMethods({
      showVideoDrawer: showVideoDrawer,
    });
  }, [showVideoDrawer]);

  // 收到未读气泡数据变更后，通知uni壳子
  useEffect(() => {
    const run = async () => {
      if (unitableCrmBaseRef.current) {
        const childBridgeApi = unitableCrmBaseRef.current.childBridgeApi;
        if (childBridgeApi) {
          try {
            await childBridgeApi.postRegularCustomerMenuDataChanged(regularMenuData);
          } catch (error) {}
        }
      }
    };
    run();
  }, [regularMenuData]);

  return (
    <>
      <UnitableCrmBase
        {...props}
        ref={unitableCrmBaseRef}
        regularMenuData={regularMenuData}
        key={key}
        siriusMenuKey={menuKeys}
        siriusPage={page}
        navigate={navigate}
        tableId={tableId}
        viewId={viewId}
        from={from}
        filter={filter}
        updateUniVersionHandle={updateUniVersionHandle}
        callSelectContractHandle={callSelectContractHandle}
      />
      {siriusContactModalEl}
    </>
  );
};

export const UnitableCrm: React.FC<
  Omit<Props, 'active'> & {
    hidden?: boolean;
  } & SiriusL2cAppProps
> = props => {
  const { hidden } = props;
  const location = useLocation();
  const navigate = useNavigate();
  const active = isMatchUnitableCrmHash(location.hash);
  const appDispatch = useAppDispatch();
  // crm用到了公司组织数据，所以这里判断一下有没有获取，没有则获取组织数据
  const edmOrgData = useAppSelector(state => state.edmUserReducer.orgData);
  useEffect(() => {
    if (!edmOrgData) {
      appDispatch(getEdmUserTreeAsync());
    }
  }, []);
  const style = useMemo<React.CSSProperties>(() => {
    return {
      display: hidden ? 'none' : 'flex',
      height: '100%',
      width: '100%', // 必须给100%否则在外贸桌面端宽度会多一个侧边栏的宽度
    };
  }, [hidden]);

  useEffect(() => {
    writeLog(`实例化UnitableCrm组件,props：${JSON.stringify(props)}`);
    return () => {
      writeLog(`卸载UnitableCrm组件,props：${JSON.stringify(props)}`);
    };
  }, []);

  if (location.hash.includes('#unitable-crm')) {
    navigate(getUnitableCrmHash(location.hash));
    return <></>;
  }

  return (
    <div style={style}>
      {/* <SiriusL2cApp/> */}
      <UnitableCrmPure {...props} active={active} />
    </div>
  );
};
