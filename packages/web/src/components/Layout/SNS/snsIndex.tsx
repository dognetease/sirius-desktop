import React, { useState, useEffect, useLayoutEffect, ReactNode, useRef } from 'react';
import { useLocalStorage } from 'react-use';
import { ConfigProvider, Button, Checkbox } from 'antd';
import { apiHolder, api, apis, InsertWhatsAppApi, FacebookApi, DataStoreApi, FbBindStatus, MainPagesRefs } from 'api';
import zhCN from 'antd/lib/locale/zh_CN';
import { useLocation, navigate } from '@reach/router';
import qs from 'querystring';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import { FIR_SIDE } from '@web-common/utils/constant';
import { SiriusPageProps } from '@/components/Layout/model';
import WhatsAppAd, { renderMap as WhastAppAdRenderMap, Keys as WhatsAppAdKeys } from './WhatsApp/components/ad';
import WhatsAppAiSearch from './WhatsApp/search/search';
import WhatsAppJob from './WhatsApp/job/job';
import WhatsAppJobEdit from './WhatsApp/job/jobEdit';
import WhatsAppJobReport from './WhatsApp/job/jobReport';
import WhatsAppMessage from './WhatsApp/message/message';
import WhatsAppTemplate from './WhatsApp/template/template';
import WhatsAppStatistic from './WhatsApp/statistic/index';
import { PersonalWhatsapp } from './WhatsApp/personalWhatsapp/index';
import PersonalJobWhatsApp from './WhatsApp/personalJobWhatsapp';
import PersonalJobWhatsAppDetail from './WhatsApp/personalJobWhatsapp/detail';
import { useAppDispatch, useAppSelector, useActions } from '@web-common/state/createStore';
import { getMenuSettingsAsync, getModuleDataPrivilegeAsync, getPrivilegeAsync } from '@web-common/state/reducer/privilegeReducer';
import { filterTree } from '@web-edm/utils';
import MenuIcons from '@/components/UI/MenuIcon';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { whatsAppTracker } from '@/components/Layout/SNS/tracker';
import { getTransText } from '@/components/util/translate';
import { FoldableMenu } from '@/components/UI/MenuIcon/FoldableMenu';
import { ExpandableSideContent } from '@/layouts/Main/expandableSideContent';
import FacebookMessage from './Facebook/message';
import FackbookPosts from './Facebook/posts';
import edmStyle from '@web-edm/edm.module.scss';
import FacebookPages from './Facebook/mainPages/mainPages';
import style from './snsIndex.module.scss';
import { OffsiteModal } from './Facebook/components/offsiteModal';
import { FacebookActions } from '@web-common/state/reducer';
import { AccManageModal } from './Facebook/components/accManageModal';
import useCountDown from '@web-common/hooks/useCountDown';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as Error } from '@/images/icons/alert/error.svg';
import { ReactComponent as Info } from '@/images/icons/edm/info-blue-fill.svg';
import { ReactComponent as Warning } from '@/images/icons/alert/warn.svg';
import { ReactComponent as Success } from '@/images/icons/alert/success.svg';
import { usePermissionCheck, NoPermissionPage } from '@/components/UI/PrivilegeEnhance';
import { getIn18Text } from 'api';

const eventApi = apiHolder.api.getEventApi();
const systemApi = apiHolder.api.getSystemApi();
const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
const WhatsAppAgreementCheckedKey = `WhatsAppAgreementChecked-${systemApi.getCurrentUser()?.accountName}`;
const WhatsAppAdCheckedKey = `WhatsAppAdChecked-${systemApi.getCurrentUser()?.accountName}`;
const facebookApi = apiHolder.api.requireLogicalApi(apis.facebookApiImpl) as unknown as FacebookApi;
const AuthorizeKey = `AuthorizeCode-${systemApi.getCurrentUser()?.accountName}`;
const storeApi: DataStoreApi = apiHolder.api.getDataStoreApi();

interface MenuItemData {
  key: string;
  title: string;
  label: string;
  icon?: React.ReactNode;
  children?: Array<MenuItemData>;
  subffix?: () => React.ReactNode;
}
const snsMenuData = [
  {
    title: getIn18Text('WAGERENYINGXIAO'),
    key: 'personalWhatsApp',
    label: 'PERSONALWHATSAPP',
    children: [
      {
        title: getIn18Text('WAGERENHAOXIAOXI'),
        key: 'pernsonalWhatsapp',
        icon: <MenuIcons.WhatsAppMessageMenuIcon />,
      },
      {
        title: getIn18Text('WAGERENQUNFARENWU'),
        key: 'pernsonalJobWhatsApp',
        icon: <MenuIcons.SendBoxMenuIcon />,
      },
    ],
  },
  {
    title: getIn18Text('WASHANGYEYINGXIAO'),
    key: 'whatsApp',
    label: 'WHATSAPP',
    children: [
      {
        title: getIn18Text('WASHANGYEXIAOXI'),
        key: 'whatsAppMessage',
        label: 'WHATSAPP_MSG',
        icon: <MenuIcons.WhatsAppMessageMenuIcon />,
      },
      // {
      //     title: getTransText('EngineSearching') || '',
      //     key: 'whatsAppAiSearch',
      //     label: 'WHATSAPP_SEND_TASK',
      //     icon: <MenuIcons.AISearchIcon />,
      //     subffix() {
      //         return <span className={style.betaIcon}>BETA</span>;
      //     }
      // },
      {
        title: getIn18Text('WASHANGYEQUNFARENWU'),
        key: 'whatsAppJob',
        label: 'WHATSAPP_SEND_TASK',
        icon: <MenuIcons.SendBoxMenuIcon />,
      },
      {
        title: getIn18Text('XIAOXIMOBAN'),
        key: 'whatsAppTemplate',
        label: 'WHATSAPP_MSG_TPL_SETTING',
        icon: <MenuIcons.WhatsAppTemplateMenuIcon />,
      },
      {
        title: getIn18Text('SHUJUTONGJI'),
        key: 'whatsAppStatistic',
        label: 'WHATSAPP_DATA_STAT',
        icon: <MenuIcons.EdmStatMenuIcon />,
      },
    ],
  },
  {
    title: getTransText('FACEBOOKYINXIAO'),
    key: 'facebook',
    label: 'FACEBOOK',
    children: [
      {
        title: getTransText('wodezhuyeguanli'),
        key: 'facebookPages',
        label: 'FACEBOOK_MY_MAIN_PAGE',
        icon: <MenuIcons.AISearchIcon />,
      },
      {
        title: getTransText('wodetieziguanli'),
        key: 'facebookPosts',
        label: 'FACEBOOK_MY_POST',
        icon: <MenuIcons.SendBoxMenuIcon />,
      },
      {
        title: getTransText('facebookxiaoxi'),
        key: 'facebookMessage',
        label: 'FACEBOOK_MSG',
        icon: <MenuIcons.WhatsAppMessageMenuIcon />,
      },
    ],
  },
];

let timer: number | null = null;

const iconMap = {
  [FbBindStatus.BIND_FAILED]: <Error />,
  [FbBindStatus.USER_CANCEL]: <Warning />,
  [FbBindStatus.NO_ALL_PERMISSIONS]: <Info />,
  [FbBindStatus.NO_OPERATE]: <Info />,
  [FbBindStatus.BIND_SUCCESS]: <Success />,
};

const SnsIndex: React.FC<SiriusPageProps> = props => {
  const location = useLocation();
  const [page, setPage] = useState('pernsonalWhatsapp');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});
  const [activeMenuKey, setActiveMenuKey] = useState('pernsonalWhatsapp');
  const [menuData, setMenuData] = useState<MenuItemData[]>([]);
  const menuKeys = useAppSelector(state => state.privilegeReducer.visibleMenuLabels);
  const isFoldMenu = useAppSelector(state => state.expandMenuReducer.isFold);
  const appDispatch = useAppDispatch();
  const [adChecked, setAdChecked] = useLocalStorage(WhatsAppAdCheckedKey, false); // 广告展示
  const fbToast = useRef<string>('');
  const [offsiteLoading, setOffsiteLoading] = useState<boolean>(false);
  // const fbPages = useRef<MainPagesRefs>(null)

  const [isStart, allOptions, setEndTime] = useCountDown({
    format: '',
    diff: 1000,
    onHand: true,
    onEnd: () => {
      window.clearInterval(timer!);
      setFacebookModalShow({ offsiteModal: false });
      updateOAuth({ authorizedLoading: false });
      setOffsiteLoading(false);
      if (fbToast.current === '') return;
      message.open({
        className: style.toast,
        icon: iconMap[fbToast.current as FbBindStatus],
        content: fbToast.current,
      });
    },
  });
  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    if (moduleName !== 'sns') {
      return;
    }
    const params = qs.parse(location.hash.split('?')[1]);
    const page = (params.page as string) || 'pernsonalWhatsapp';
    setPage(page);
    setPageParams(params);
    const matchMenu = [...menuData].some(menu => {
      return menu.children?.some(i => i.key === page);
    });
    const getPageKey = () => {
      switch (page) {
        case 'whatsAppJobReport':
        case 'whatsAppJobEdit':
          return 'whatsAppJob';
        case 'personalJobWhatsAppDetail':
          return 'pernsonalJobWhatsApp';
        default:
          return 'whatsAppAiSearch';
      }
    };
    setActiveMenuKey(matchMenu ? page : getPageKey());
  }, [location, menuData]);
  const [proxyWarningVisible, setProxyWarningVisible] = useState<boolean>(false);
  const [proxyChecking, setProxyChecking] = useState<boolean>(false);
  const [agreementVisible, setAgreementVisible] = useState<boolean>(false);
  const [agreementChecked, setAgreementChecked] = useState<boolean>(false);
  const { setFacebookModalShow, updateOAuth, freshFacebookPages } = useActions(FacebookActions);
  const { offsiteModalShow, accModalShow, source, fresh } = useAppSelector(state => state.facebookReducer);
  const checkIsProxy = () => {
    return Promise.resolve(); // 1130 版本去掉代理检测
    // return new Promise((resolve, reject) => {
    //     const img = new Image();
    //     img.src = `https://www.google.com/favicon.ico?t=${Date.now()}`;
    //     img.onload = resolve;
    //     img.onerror = reject;
    //     setTimeout(reject, 3000);
    // });
  };
  // 查询是否下过订单
  const checkIsPurchased = () => {
    insertWhatsAppApi.queryBindStatus().then(data => {
      if (['TRY', 'UNREGISTERED', 'PURCHASED', 'REGISTERED', 'VERIFIED'].includes(data.orgStatus)) {
        setAdChecked(true);
      }
    });
  };
  const handleProxyCheck = () => {
    setProxyChecking(true);
    checkIsProxy()
      .then(() => {
        setProxyWarningVisible(false);
        if (!localStorage.getItem(WhatsAppAgreementCheckedKey)) {
          setAgreementVisible(true);
        }
        whatsAppTracker.trackProxyCheck(1);
      })
      .catch(() => {
        setProxyWarningVisible(true);
        whatsAppTracker.trackProxyCheck(0);
      })
      .finally(() => {
        setProxyChecking(false);
      });
  };
  useLayoutEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    if (moduleName === 'sns') {
      handleProxyCheck();
    }
  }, [location]);
  useEffect(() => {
    checkIsPurchased();
    const id = eventApi.registerSysEventObserver('whatsAppProxyWarning', {
      func: () => {
        setProxyWarningVisible(true);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('whatsAppProxyWarning', id);
    };
  }, []);
  const handleMenuClick = (current: { key: string }) => {
    const key = current.key;
    if (key === 'personalWhatsapp') {
      // 个人whatsapp新页面
      if (systemApi.isElectron()) {
        systemApi.createWindowWithInitData('personalWhatsapp', { eventName: 'initPage' });
      } else {
        window.open('/personalWhatsapp/', 'personalWhatsapp');
      }
      return;
    }
    navigate(`#${props.name}?page=${key}`);
  };
  const renderContent = (key: string, qs: Record<string, any>) => {
    const map: Record<string, ReactNode> = {
      whatsAppAiSearch: <WhatsAppAiSearch />,
      whatsAppJob: <WhatsAppJob />,
      whatsAppJobEdit: <WhatsAppJobEdit qs={qs} />,
      whatsAppJobReport: <WhatsAppJobReport qs={qs} />,
      whatsAppMessage: <WhatsAppMessage qs={qs} />,
      whatsAppTemplate: <WhatsAppTemplate />,
      whatsAppStatistic: <WhatsAppStatistic qs={qs} />,
      pernsonalWhatsapp: <PersonalWhatsapp qs={qs} />,
      pernsonalJobWhatsApp: <PersonalJobWhatsApp qs={qs} />,
      personalJobWhatsAppDetail: <PersonalJobWhatsAppDetail qs={qs} />,
      facebookMessage: <FacebookMessage qs={qs} />,
      facebookPages: <FacebookPages qs={qs} />,
      facebookPosts: <FackbookPosts qs={qs} />,
    };
    return map[key] || map['whatsAppJob'];
  };
  useEffect(() => {
    setMenuData(filterTree(snsMenuData, menuKeys) as any);
  }, [menuKeys]);
  useEffect(() => {
    if (props.active) {
      appDispatch(getPrivilegeAsync());
      appDispatch(getMenuSettingsAsync());
      appDispatch(getModuleDataPrivilegeAsync('WHATSAPP'));
    }
  }, [props.active]);

  // 去 faceBook 授权
  const goAuthorize = () => {
    try {
      updateOAuth({ authorizedLoading: true });
      setOffsiteLoading(true);
      facebookApi
        .getAuthorizeUrl()
        .then(res => {
          const { loginUrl, checkCode } = res || {};
          window.open(loginUrl, '_blank');
          return checkCode;
        })
        .then(checkCode => {
          // if(source === 'accManage') {
          //     setOffsiteLoading(false)
          //     freshFacebookPages({ fresh: !fresh })
          // }
          if (source == 'authPage' || source == 'table' || source === 'accManage') {
            setEndTime(Date.now() + 60 * 1000);

            timer = window.setInterval(() => {
              facebookApi.checkBindStatus({ checkCode }).then(res => {
                const { isSuccess, bindStatus } = res;
                fbToast.current = bindStatus;
                if (isSuccess) {
                  updateOAuth({ isAuthorized: true });
                  storeApi.put(AuthorizeKey, 'true');
                }
                if (bindStatus !== FbBindStatus.NO_OPERATE) {
                  // 结束倒计时
                  setEndTime(undefined);
                  updateOAuth({ authorizedLoading: false });
                  setOffsiteLoading(false);
                  freshFacebookPages({ fresh: !fresh });
                  source === 'accManage' && setFacebookModalShow({ offsiteModal: false });
                }
              });
            }, 2000);
          }
        });
    } catch (error) {
      message.error({ content: getTransText('FACEBOOKZHANGHAOSHOUQUANSHIBAI') });
      // 结束倒计时
      setEndTime(undefined);
      updateOAuth({ authorizedLoading: false });
      setOffsiteLoading(false);
    }
  };

  const checkIsAuthorized = () => {
    try {
      facebookApi.getBondAccount({ pageNumber: 1, pageSize: 10 }).then(res => {
        const { results = [] } = res;
        updateOAuth({ isAuthorized: !!results.length });
      });
    } catch (error) {
      console.log('error', error);
    }
  };

  useEffect(() => {
    const FbPage = storeApi.getSync(AuthorizeKey);
    const { data, suc } = FbPage;
    if (suc && data === 'true') {
      updateOAuth({ isAuthorized: true });
    } else checkIsAuthorized();
  }, []);

  const handleCancel = () => {
    fbToast.current = '';
    setEndTime(undefined);
    setFacebookModalShow({ offsiteModal: false });
  };

  const hasWaMessagePermission = usePermissionCheck('VIEW', 'WHATSAPP', 'WHATSAPP_MSG');
  const hasFbMessagePermission = usePermissionCheck('VIEW', 'FACEBOOK', 'FACEBOOK_MSG');

  // 默认给用户展示广告
  if (!adChecked) {
    if (!page) {
      return null;
    }
    if (WhastAppAdRenderMap.hasOwnProperty(page)) {
      return (
        <PageContentLayout className={edmStyle.edm}>
          <ExpandableSideContent borderRight minWidth={FIR_SIDE} defaultWidth={220} isFold={isFoldMenu}>
            <FoldableMenu isFold={false} handleMenuClick={handleMenuClick} menuData={menuData} activeMenuKey={activeMenuKey} />
          </ExpandableSideContent>
          <WhatsAppAd comp={WhastAppAdRenderMap[page as WhatsAppAdKeys]} setChecked={() => setAdChecked(true)} />
        </PageContentLayout>
      );
    }
  }

  return (
    <ConfigProvider locale={zhCN}>
      <PageContentLayout className={edmStyle.edm}>
        {page !== 'whatsAppJobEdit' && (
          <ExpandableSideContent borderRight minWidth={FIR_SIDE} defaultWidth={220} isFold={isFoldMenu}>
            <FoldableMenu isFold={false} handleMenuClick={handleMenuClick} menuData={menuData} activeMenuKey={activeMenuKey} />
          </ExpandableSideContent>
        )}
        <div style={{ height: '100%' }}>
          {page !== 'whatsAppAiSearch' && page !== 'whatsAppMessage' && page !== 'facebookMessage' && renderContent(page, pageParams)}
          {/* <div style={{
                    height: '100%',
                    display: page !== 'whatsAppAiSearch' ? 'none' : 'block',
                }}>
                    <WhatsAppAiSearch />
                </div> */}
          <div
            style={{
              height: '100%',
              display: page !== 'whatsAppMessage' ? 'none' : 'block',
            }}
          >
            {hasWaMessagePermission ? <WhatsAppMessage qs={pageParams} /> : <NoPermissionPage />}
          </div>
          <div
            style={{
              height: '100%',
              display: page !== 'facebookMessage' ? 'none' : 'block',
            }}
          >
            {hasFbMessagePermission ? <FacebookMessage qs={pageParams} /> : <NoPermissionPage />}
          </div>
          <Modal
            className={style.proxyWarningModal}
            visible={proxyWarningVisible}
            width={430}
            title={getIn18Text('XITONGJIANCE\uFF1AIP DEZHIYICHANG')}
            onOk={handleProxyCheck}
            okText={getIn18Text('ZAICIJIANCE')}
            keyboard={false}
            maskClosable={false}
            okButtonProps={{ loading: proxyChecking }}
            cancelButtonProps={{ style: { display: 'none' } }}
          >
            {getIn18Text('WANGLUOLIANJIEYICHANG\uFF0CQINGNINZAIHEFADEHAIWAIWANGLUOLIANJIEHUANJINGXIAFANGWENCIFUWU')}
          </Modal>
          <Modal
            className={style.agreementModal}
            visible={agreementVisible}
            title={getIn18Text('FUWUSHIYONGGUIZEJIMIANZESHENGMING')}
            width={560}
            keyboard={false}
            maskClosable={false}
            footer={
              <div className={style.agreementModalFooter}>
                <Checkbox style={{ fontSize: 12, flex: 1, textAlign: 'left' }} checked={agreementChecked} onChange={event => setAgreementChecked(event.target.checked)}>
                  {getIn18Text('WOYIYUEDUBINGQUEREN\u300AFUWUSHIYONGGUIZEJIMIANZESHENGMING\u300B\uFF0CBUZAITIXING')}
                </Checkbox>
                <Button
                  type="primary"
                  disabled={!agreementChecked}
                  onClick={() => {
                    setAgreementVisible(false);
                    localStorage.setItem(WhatsAppAgreementCheckedKey, '1');
                  }}
                >
                  {getIn18Text('TONGYIXIEYIBINGJIXU')}
                </Button>
              </div>
            }
          >
            <p>
              {getIn18Text(
                'ZUNJINGDEYONGHU\uFF0CZAISHIYONGWANGYIWAIMAOTONGwhatsappYINGXIAOGONGNENG/FUWU\uFF08XIACHENG\u201CBENFUWU\u201D\uFF09QIAN\uFF0CQINGXIANYUEDU\u300AWANGYIWAIMAOTONGFUWUTIAOKUAN\u300BJIXIALIESHIYONGGUIZE\uFF0CZAIJIESHOUBINGTONGYIQUANBUNEIRONGHOUKAISHISHIYONGBENFUWU\uFF1BRUYOURENHEWEIFAN\uFF0CNINXUYAODUIZIJIDEXINGWEICHENGDANQUANBUFALVZEREN\uFF0CWOMENBUDUININDERENHEXINGWEIFUZE\uFF1A'
              )}
            </p>
            <ul>
              <li>{getIn18Text('BUDESHIYONGFEIFAWANGLUOLIANJIEFANGSHISHIYONGBENFUWU\uFF1B')}</li>
              <li>{getIn18Text('BUDEWEIFANGUOJIAFALVFAGUI\uFF0CBUDEQINFANQITAYONGHUJIRENHEDISANFANGDEHEFAQUANYI\uFF1B')}</li>
              <li>{getIn18Text('BUDESHIYONGBENFUWUFABU\u3001CHUANBO\u3001XIAOSHOUZHONGGUOFALVJIQITAKESHIYONGFALVJINZHIDENEIRONG\uFF1B')}</li>
              <li>{getIn18Text('BUDERAOGUO/POHUAIFUWUDEBAOHUHEXIANZHICUOSHISHIYONGBENFUWU\uFF1B')}</li>
              <li>{getIn18Text('BUDETONGGUOZHUANRANG\u3001CHUZU\u3001GONGXIANGDENGFANGSHIXIANGDISANFANGTIGONGBENFUWU\u3002')}</li>
            </ul>
            <p>
              {getIn18Text('RUONINWEIFAN')}
              <a href="https://qiye.163.com/sirius/agreement_waimao/index.html" target="_blank">
                {getIn18Text('\u300AWANGYIWAIMAOTONGFUWUTIAOKUAN\u300B')}
              </a>
              {getIn18Text(
                'JISHANGSHUGUIZE\uFF0CWOMENYOUQUANCAIQUCUOSHI\uFF08BAOKUODANBUXIANYUZHONGZHIHUOXIANZHININDUIBENFUWUDESHIYONG\uFF09\uFF0CQIEBUTUIHAIRENHEFEIYONG\u3002YINNINDEXINGWEIZAOCHENGWOMENHUOGUANLIANGONGSISUNSHIDE\uFF0CNINYINGCHENGDANQUANBUPEICHANGZEREN\u3002'
              )}
            </p>
          </Modal>
          <OffsiteModal visible={offsiteModalShow} onCancel={handleCancel} onOk={goAuthorize} loading={offsiteLoading} />
          <AccManageModal visible={accModalShow} onCancel={() => setFacebookModalShow({ accModal: false })} />
        </div>
      </PageContentLayout>
    </ConfigProvider>
  );
};
export default SnsIndex;
