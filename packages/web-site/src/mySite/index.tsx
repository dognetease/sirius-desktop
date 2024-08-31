import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import { navigate, useLocation } from '@reach/router';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
import { navigateToProductPage } from '@web-unitable-crm/api/helper';
import { ReactComponent as CaretDownOutlined } from '../images/down-arrow.svg';
import { api, apis, SiteApi, apiHolder, DataTrackerApi, SystemApi, SiteItem, PageItem, UpdateSiteNameReq, inWindow, getIn18Text, AddDomainCertReq } from 'api';
import { config } from 'env_def';
import { PageInfo } from './components/pageInfo';
import { CreateSite } from './components/CreateSite';
import { ReName } from './components/ReName';
import { Guide } from './components/Guide';
import { ChooseTemplate } from '../components/ChooseTemplate';
import { CardList } from '../components/CardList';
import { DataCard } from './components/DataCard';
import { CustomerCard } from './components/CustomerCard';
import { IntroVideo } from './components/IntroVideo';
import { SiteCardHeader } from './components/SiteCardHeader';
import { CreateCustomSite } from './components/CreateCustomSite';
import { BuyDomainTip } from './components/BuyDomainTip';
import { BindAnalysis } from './components/BindAnalysis';
import { SITE_SWITCH_OPTIONS, DETAIL_IMG_URL, STATUS_ENUM, THEME, DOMAIN_STATUS } from './constants';
import { ExceedMaxSiteNumberResCode, PAGE_TYPE, TemplateItem } from '../constants';
import styles from './style.module.scss';
import SiteBanner from './components/SiteBanner';
import UserInfoCollectModal from '@web-site/components/UserInfoCollectModal';
import PreventCreateNewSiteModal from '@web-site/components/PreventCreateNewSiteModal';
import useSitePermissions from '@web-site/hooks/useSitePermissions';
import AICreateSiteCardBar from './components/AICreateSiteCardBar';
import AICreateSiteModal from './components/AICreateSiteModal';
import useIndustryList from '@web-site/hooks/useIndustryList';
import useSiteThemeList from '@web-site/hooks/useSiteThemeList';
import SiteServiceModal from './components/SiteServiceModal';
import HttpsModal from './components/HttpsModal';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export interface CustomDomain {
  domainStatus: DOMAIN_STATUS;
  domain: string;
  customIndexUrl: string;
}

interface SiteDataItem {
  host: string;
  indexUrl: string;
  siteId: string;
  siteName: string;
  status: STATUS_ENUM;
  data: PageItem;
  isIndex: boolean;
  isAddProduct: boolean;
  isAddCert: boolean;
  isAddSeoConfig: boolean;
  isBindDomain: boolean;
  siteBindDomainList?: Array<CustomDomain>;
  isOuterSite?: boolean;
  outerKey?: string;
  productServiceDTO?: Record<string, string>;
  icon?: string;
}

interface DataCard {
  browseCount: number;
  browseClass: string;
  browseProportion: string | number;
  submitCount: number;
  submitClass: string;
  submitCountProportion: string | number;
  siteId: string;
}

type CreateSiteReq = {
  siteName: string;
  templateData: TemplateItem;
};

type StatisticalDataItem = {
  userNum: number;
};

type InitStatisticalData = {
  viewCustomerNumList?: StatisticalDataItem[];
  referIntentionNumList?: StatisticalDataItem[];
  productViewCustomerList?: StatisticalDataItem[];
  productReferIntentionList?: StatisticalDataItem[];
  productStatus: number; // 0或1，1是存在商品
};

type FinalStatisticalData = {
  browseCount: number;
  submitCount: number;
  prevBrowseCount: number;
  prevSubmitCount: number;
  detailsStatus?: STATUS_ENUM;
};

const defaultData = {
  thumbnail: '',
  modifyTime: 0,
  status: STATUS_ENUM.INIT,
  showOrder: 1,
  homePage: true,
  pageId: '',
};

const jzHost = config('jzHost') as string;

export const MySite = () => {
  const parentRef = useRef({ chooseTemplate: value => {} });
  const currentRenameRef = useRef({ siteId: '', siteName: '', icon: '' });
  const addCountRef = useRef<number>(0);
  const currentChooseTemplateIdRef = useRef('');
  const [siteChildren, setSiteChildren] = useState<React.ReactElement[]>([]);
  const [currentShowCard, setCurrentShowCard] = useState<string>('all');
  /**
   * 标识新手引导弹窗的状态，
   * 初始值是0，获取完站点数据后变成1（没有上线的官网）或者2（有上线的官网）。
   * 变成1或2的时候，根据 localStorage 来判断要不要弹出新手引导弹窗
   **/
  const [guideStatus, setGuideStatus] = useState(0);
  const [createSiteVisible, setCreateSiteVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [chooseTemplateVisible, setChooseTemplateVisible] = useState(false);
  const [createCustomSiteVisible, setCreateCustomSiteVisible] = useState(false);
  const [bindAnalysisVisible, setBindAnalysisVisible] = useState(false);
  const [bindSiteId, setBindSiteId] = useState('');
  const location = useLocation();

  // 建站版本信息
  const { isBuySiteBuilder, isBuyEdm } = useSitePermissions();

  // 留资弹窗
  const [showUserCollectModal, setShowUserCollectModal] = useState(false);
  const handleSiteBannerBuy = () => setShowUserCollectModal(true);
  const handleSiteBannerFreeConsult = () => setShowUserCollectModal(true);

  // 阻止用户新建站点弹窗
  const [showPreventNewSite, setShowPreventNewSite] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showAiCreateSiteModal, setShowAiCreateSiteModal] = useState(false);
  const { industryList, fetchIndustryList } = useIndustryList();
  const { themeList, fetchThemeList, defaultTheme } = useSiteThemeList();

  // 查看服务弹窗
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const currentServiceInfoRef = useRef<Record<string, string>>();

  // 配置证书弹窗
  const [httpsModelVisible, setHttpsModelVisible] = useState(false);
  // const certInfoRef = useRef();
  const [certInfo, setCertInfo] = useState();
  const cachedCertinfoRef = useRef<any>({}); // 当切换域名时，保存填写的数据
  const [currentDomainInfo, setCurrentDomainInfo] = useState<CustomDomain & { siteId: string; domainList: CustomDomain[] }>();

  useEffect(() => {
    trackApi.track('sitemanager_click');
    trackApi.track('mysite_click');
    fetchIndustryList();
    fetchThemeList();
  }, []);

  useEffect(() => {
    // 获取站点获客，查看用户卡片新增总数
    getSiteClueInfo();

    // 初始化获取我的站点数据
    getMySiteData();
  }, [location.hash, currentShowCard]);

  // 获取站点获客，查看用户卡片新增总数
  const getSiteClueInfo = async () => {
    try {
      const data = await siteApi.getSiteClueInfo();
      addCountRef.current = data.userNum;
    } catch (e) {
      console.log('获取新增总数失败');
    }
  };

  // 获取官网卡片数据
  const getMySiteData = async () => {
    // 存在上线官网
    let hasOnlineSite = false;
    try {
      const data = (await siteApi.getSiteMetaInfo()) || [];
      if (data.length) {
        const siteData = data.map((item: SiteItem) => {
          const {
            host,
            indexUrl,
            pages,
            siteId,
            siteName,
            status,
            siteBindDomainList,
            isAddProduct,
            isOuterSite,
            outerKey,
            productServiceDTO,
            icon,
            isAddCert,
            isAddSeoConfig,
            isBindDomain,
          } = item;
          // 取首页的数据
          const indexData = pages?.filter(page => page.homePage)[0];

          return {
            host,
            indexUrl,
            siteId,
            siteName,
            status: status as STATUS_ENUM,
            isIndex: true,
            // 更新官网状态信息
            data: indexData || defaultData,
            siteBindDomainList,
            isAddProduct,
            isOuterSite,
            outerKey,
            isAddCert,
            isAddSeoConfig,
            isBindDomain,
            productServiceDTO,
            icon,
          };
        });
        getSiteChildren(siteData);
        if (data.some((item: SiteItem) => item.status == STATUS_ENUM.ONLINE)) {
          hasOnlineSite = true;
        }
      } else {
        getSiteChildren([
          {
            host: '',
            indexUrl: '',
            siteId: '',
            isIndex: true,
            isAddProduct: false,
            siteName: getIn18Text('GUANWANG'),
            status: STATUS_ENUM.INIT,
            // 更新官网状态信息
            data: defaultData,
            isAddCert: false,
            isAddSeoConfig: false,
            isBindDomain: false,
          },
        ]);
      }
    } catch (e) {
      console.error('获取我的站点数据失败', e);
    }
    setGuideStatus(hasOnlineSite ? 2 : 1);
  };

  const getStep = (status: STATUS_ENUM): number => {
    // ONLINE: '已上线',
    // // 下线， 暂时没有下线，所以展示未上线
    // OFFLINE
    // DRAFT 草稿, 保存未发布
    // INIT 初始化
    // TEPLETE 选择模板
    switch (status) {
      case STATUS_ENUM.ONLINE:
        return 2;
      case STATUS_ENUM.OFFLINE:
        return 0;
      case STATUS_ENUM.DRAFT:
        return 2;
      case STATUS_ENUM.INIT:
        return 0;
      default:
        return 0;
    }
  };

  // 获取单个官网和详情页卡片
  const getSiteChild = (CardData: SiteDataItem, statisticalData: FinalStatisticalData): React.ReactElement => {
    let {
      host,
      indexUrl,
      siteId,
      siteName,
      status,
      // 更新官网状态信息
      data,
      isIndex,
      isAddProduct,
      siteBindDomainList,
      isOuterSite,
      outerKey,
      productServiceDTO,
      icon,
      isAddCert,
      isAddSeoConfig,
      isBindDomain,
    } = CardData;
    let thumbnail = data?.thumbnail;
    let pageId = data.pageId;

    const { browseCount, submitCount, prevBrowseCount, prevSubmitCount, detailsStatus } = statisticalData;

    // 详情页
    if (!isIndex) {
      status = detailsStatus as STATUS_ENUM;
      thumbnail = DETAIL_IMG_URL;
    }

    const modifyTime = data?.modifyTime;
    const isOnline = status === STATUS_ENUM.ONLINE;
    const isDraft = status === STATUS_ENUM.DRAFT;
    const isInit = status === STATUS_ENUM.INIT;
    const step = getStep(status);

    // 同比变化
    let browseProportion =
      prevBrowseCount === 0 && browseCount !== 0
        ? '100.00'
        : prevBrowseCount === 0 && browseCount === 0
        ? 0
        : (((browseCount - prevBrowseCount) / prevBrowseCount) * 100).toFixed(2);
    let submitCountProportion =
      prevSubmitCount === 0 && submitCount !== 0
        ? '100.00'
        : prevSubmitCount === 0 && submitCount === 0
        ? 0
        : (((submitCount - prevSubmitCount) / prevSubmitCount) * 100).toFixed(2);
    browseProportion = Number(browseProportion) === 0 ? 0 : browseProportion;
    submitCountProportion = Number(submitCountProportion) === 0 ? 0 : submitCountProportion;
    browseProportion = String(browseProportion);
    submitCountProportion = String(submitCountProportion);

    // “最近修改时间”文案：
    // cn: 装修于X天前
    // en: Site Edited x days ago
    const isEnLang = inWindow() && window.systemLang === 'en';
    let editDay = getEditTime(modifyTime);
    if (editDay !== '') {
      if (isEnLang) {
        editDay = editDay == '0' ? 'Site Edited today' : `Site Edited ${editDay} days ago`;
      } else {
        editDay = editDay == '0' ? '装修于今天' : `装修于${editDay}天前`;
      }
    }
    // editDay = editDay === '' ? '' : editDay !== '0' ? `${editDay}天前` : '今天';

    // // 自定义域名
    // let customDomain = siteBindDomainList?.[0];
    // let domainStatus = customDomain?.domainStatus as number;
    // indexUrl = domainStatus >= 7 ? customDomain?.customIndexUrl! : indexUrl;

    // 判断条件
    const isCustomSite = isOuterSite ?? false;

    const elKey = siteId ? siteId : isIndex ? 'index' : 'detail';

    return (
      <div className={styles.site} key={elKey}>
        <div className={styles.siteItem}>
          <SiteCardHeader
            status={status}
            pageId={pageId}
            host={host}
            indexUrl={indexUrl}
            editDay={editDay}
            title={isIndex ? siteName || getIn18Text('GUANWANG') : getIn18Text('SHANGPINXIANGQINGYE')}
            isIndex={isIndex}
            haveSite={isOnline || isDraft}
            siteId={siteId}
            siteName={siteName}
            siteBindDomainList={siteBindDomainList}
            isCustomSite={isCustomSite}
            outerKey={outerKey}
            icon={icon}
            isAddCert={isAddCert}
            isAddSeoConfig={isAddSeoConfig}
            isBindDomain={isBindDomain}
            deleteSite={handleDeleteSite}
            offlineSite={handleOfflineSite}
            openRename={openRename}
            addProduct={addProduct}
            onChooseTemplate={handleChooseTemplate}
            openBindAnalysis={openBindAnalysis}
            productServiceDTO={productServiceDTO}
            openServiceModal={openServiceModal}
            onFreeConsule={() => setShowUserCollectModal(true)}
            openHttpsModal={openHttpsModal}
          />
          {isInit && (
            <AICreateSiteCardBar
              onConfirmButtonClick={() => {
                trackApi.track('AI_creat_click', { result: 'card' });
                setShowAiCreateSiteModal(true);
              }}
            />
          )}
          <div className={styles.siteItemContent}>
            {(isOnline || isDraft) && <img className={styles.img} src={thumbnail} />}
            {isCustomSite || isOnline || (
              <PageInfo
                theme={isIndex ? THEME.INDEX : THEME.PRODUCT_DETAIL}
                step={step}
                status={status}
                isAddProduct={isAddProduct}
                indexHaveImgStepClass={isIndex && (isOnline || isDraft) ? 'index-have-img-step' : ''}
                onFurnish={() => navigateToEditor(siteId)}
                onChooseTemplate={() => handleChooseTemplate(status, siteId)}
              />
            )}
            {(isOnline || isCustomSite) && (
              <DataCard
                browseCount={browseCount}
                browseProportion={browseProportion}
                submitCount={submitCount}
                submitCountProportion={submitCountProportion}
                goStat={() => goStat(siteId)}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  // 获取有所卡片的统计数据也
  const getMySiteLatestData = async () => {
    const params = { type: 'newClientSign' };
    const data = await siteApi.getSiteLatestData(params);
    return data;
  };

  // 获取官网和详情页的卡片列表
  const getSiteChildren = async (siteList: SiteDataItem[]): Promise<void> => {
    const data = await getMySiteLatestData();

    let siteChildren = siteList.map((item: SiteDataItem) => {
      const { siteId, isIndex } = item;
      const cardItemData = getStatisticalData(data[siteId], isIndex);
      return getSiteChild(item, cardItemData);
    });

    const cardItemData = getStatisticalData(data['productInfo'], false);
    let detailsChild = [
      getSiteChild(
        {
          host: '',
          isIndex: false,
          indexUrl: '',
          siteId: '',
          siteName: '',
          status: STATUS_ENUM.INIT,
          isAddProduct: false,
          isAddCert: false,
          isAddSeoConfig: false,
          isBindDomain: false,
          data: defaultData,
        },
        cardItemData
      ),
    ];

    const hideIndexCard = currentShowCard === 'details';
    const hideDetailCard = currentShowCard === 'index';

    if (hideIndexCard) {
      siteChildren = [];
    }

    if (hideDetailCard) {
      detailsChild = [];
    }

    setSiteChildren([...siteChildren, ...detailsChild]);
  };

  // 获取我的站点统计数据
  const getStatisticalData = (data: InitStatisticalData, isIndex: boolean) => {
    try {
      const { viewCustomerNumList, referIntentionNumList, productViewCustomerList, productReferIntentionList, productStatus } = data;

      if (isIndex) {
        return {
          browseCount: viewCustomerNumList?.[1].userNum || 0,
          submitCount: referIntentionNumList?.[1].userNum || 0,
          prevBrowseCount: viewCustomerNumList?.[0].userNum || 0,
          prevSubmitCount: referIntentionNumList?.[0].userNum || 0,
        };
      } else {
        return {
          detailsStatus: productStatus ? STATUS_ENUM.ONLINE : STATUS_ENUM.INIT,
          browseCount: productViewCustomerList?.[1].userNum || 0,
          submitCount: productReferIntentionList?.[1].userNum || 0,
          prevBrowseCount: productViewCustomerList?.[0].userNum || 0,
          prevSubmitCount: productReferIntentionList?.[0].userNum || 0,
        };
      }
    } catch (e) {
      const errorData = {
        browseCount: 0,
        submitCount: 0,
        prevBrowseCount: 0,
        prevSubmitCount: 0,
      };
      console.log('获取我的站点数据失败');
      if (isIndex) {
        return errorData;
      } else {
        return { ...errorData, detailsStatus: STATUS_ENUM.INIT };
      }
    }
  };

  const openChooseTemplate = () => {
    // 将装修状态设置为模板状态
    setChooseTemplateVisible(true);
  };

  const closeChooseTemplate = () => {
    setChooseTemplateVisible(false);
  };

  const handleChooseTemplate = (indexStatus: string, siteId: string) => {
    if (indexStatus !== STATUS_ENUM.INIT && indexStatus !== STATUS_ENUM.OFFLINE) {
      navigateToEditor(siteId);
    } else {
      openChooseTemplate();
    }
  };

  //  去编辑
  const goEdit = async (templateId: string, siteName?: string) => {
    try {
      const data = await siteApi.createSitePage({ templateId, siteId: '', siteName: siteName || getIn18Text('GUANWANG') });
      closeChooseTemplate();
      const isElectron = systemApi.isElectron();
      if (isElectron) {
        const url = jzHost + '/site/editor/#/' + `?siteId=${data.siteId}`;
        templateId && systemApi.openNewWindow(url, false);
      } else {
        templateId && window.open('/site/editor/#/' + `?siteId=${data.siteId}`, '_blank');
      }
      getMySiteData();
      return true;
    } catch (e) {
      Toast.error({ content: '新建站点失败' });
      return false;
    }
  };

  // 打开新建站点弹窗
  const openNewSite = async () => {
    if (checking) return;
    setChecking(true);
    try {
      await siteApi.checkCreateSitePermission();
      setCreateSiteVisible(true);
      trackApi.track('site_newshow_winshow');
    } catch (e: any) {
      if (e && e?.code === ExceedMaxSiteNumberResCode) {
        setShowPreventNewSite(true);
      } else {
        Toast.error({ content: e?.message ?? '服务端错误，请稍后重试！' });
      }
    }
    setChecking(false);
  };

  // 去站点数据
  const goStat = (siteId: string) => {
    navigate('#site?page=stat', { state: { siteId } });
  };

  // 跳转编辑器
  const navigateToEditor = async (siteId: string) => {
    const isElectron = systemApi.isElectron();
    const path = `/site/editor/#/?siteId=${siteId}&page=INDEX`;
    if (isElectron) {
      try {
        const code = await siteApi.genLoginCode();
        const redirectUrl = jzHost + path;
        systemApi.openNewWindow(`${jzHost}/site/api/pub/login/jump?code=${code}&redirectUrl=${redirectUrl}`, false);
      } catch (e) {
        systemApi.openNewWindow(jzHost + path);
      }
    } else {
      window.open(path, '_blank');
    }
  };

  // 添加商品
  const addProduct = () => {
    navigateToProductPage();
  };

  // 去营销
  const goMarket = () => {
    navigate('#edm?page=write&from=template');
  };

  /**
   * 获取编辑于几天前
   * @param time 编辑时间
   */
  const getEditTime = (time: number) => {
    if (!time) {
      return '';
    }

    const now = moment(moment().format('YYYY-MM-DD'));
    const editTime = moment(moment(time).format('YYYY-MM-DD'));
    return `${-Math.ceil(editTime.diff(now, 'day'))}`;
  };

  /**
   * 过滤官网和详情页展示
   * @param value
   */
  const handleIndexOrDetailsFilter = (value: string): void => {
    setCurrentShowCard(value);
  };

  /**
   * 删除站点
   * @param siteId
   */
  const handleDeleteSite = async (siteId: string) => {
    try {
      await siteApi.deleteSitePage({ siteId });
      Toast.success({ content: '删除站点成功！' });
      getMySiteData();
      trackApi.track('site_delete_winsucc');
    } catch (e) {
      Toast.error({ content: '删除站点失败！' });
    }
  };

  /**
   * 站点下线
   * @param siteId
   */
  const handleOfflineSite = async (siteId: string) => {
    try {
      await siteApi.offlineSite({ siteId });
      Toast.success({ content: '站点下线成功！' });
      getMySiteData();
    } catch (e) {
      Toast.error({ content: '站点下线失败！' });
    }
  };

  // 关闭新建站点弹窗
  const closeNewSite = () => {
    setCreateSiteVisible(false);
    currentChooseTemplateIdRef.current = '';
  };

  // 打开重命名弹窗
  const openRename = (siteId: string, siteName: string, icon?: string) => {
    currentRenameRef.current = {
      siteId,
      siteName,
      icon: icon ?? '',
    };
    setRenameVisible(true);
    trackApi.track('site_rename_winshow');
  };

  // 关闭重命名弹窗
  const closeRename = () => {
    setRenameVisible(false);
  };

  const openCreateCustomSite = () => {
    setCreateCustomSiteVisible(true);
  };

  // 关闭绑定站点弹窗
  const closeCreateCustomSite = () => {
    setCreateCustomSiteVisible(false);
  };

  const openBindAnalysis = (siteId: string) => {
    setBindSiteId(siteId);
    setBindAnalysisVisible(true);
  };

  const closeBindAnalysis = () => {
    setBindAnalysisVisible(false);
  };

  // 打开查看服务弹窗
  const openServiceModal = (productServiceDTO?: Record<string, string>) => {
    if (!productServiceDTO) {
      return;
    }
    currentServiceInfoRef.current = productServiceDTO;
    setServiceModalVisible(true);
  };

  const addDomainCert = async (params: AddDomainCertReq) => {
    let res;
    try {
      res = await siteApi.addDomainCert(params);
    } catch (error) {
      Toast.error('添加 HTTPS 证书失败');
    }
    if (res.code == 40001009) {
      Toast.error('证书信息未发生变更！');
    } else if (res.code == 30001025) {
      Toast.success('添加证书失败，正在部署中，请稍后再试');
    } else if (res.code === 20001009) {
      Toast.error('域名正在备案中');
    } else if (res.data) {
      Toast.success('HTTPS 证书添加成功');
      setHttpsModelVisible(false);
    } else {
      Toast.error('添加 HTTPS 证书失败');
    }
  };

  const openHttpsModal = async (domainInfo: CustomDomain, siteId: string, domainList: CustomDomain[]) => {
    if ((domainInfo?.domainStatus as number) >= 7) {
      const data = await siteApi.getDomainCertInfo({ domain: domainInfo.domain });
      setCurrentDomainInfo({ ...domainInfo, siteId, domainList });
      setCertInfo(data);
      setHttpsModelVisible(true);
    } else {
      Toast.error('域名生效后才能配置HTTPS');
    }
  };

  const onChangeDomain = async (newDomain: string, domainList: CustomDomain[], formValues: any, prevDomain: string) => {
    const domainInfo = domainList.find(d => d.domain == newDomain);
    setCurrentDomainInfo({ ...currentDomainInfo, ...domainInfo, domainList, domain: newDomain } as any);
    cachedCertinfoRef.current[prevDomain] = formValues;
    const data = (await siteApi.getDomainCertInfo({ domain: newDomain })) || {};
    if (cachedCertinfoRef.current[newDomain]) {
      data.certPublicKey = cachedCertinfoRef.current[newDomain].certPublicKey || data.certPublicKey;
      data.certPrivateKey = cachedCertinfoRef.current[newDomain].certPrivateKey || data.certPrivateKey;
    }
    setCertInfo(data);
  };

  // 提交重新重命名
  const submitRename = async ({ siteName, icon }: UpdateSiteNameReq) => {
    try {
      await siteApi.updateSiteName({ siteId: currentRenameRef.current.siteId, siteName, icon });
      getMySiteData();
      setRenameVisible(false);
      Toast.success({ content: '设置成功' });
      trackApi.track('site_rename_winsucc');
    } catch (e) {
      Toast.error({ content: '设置失败' });
    }
  };

  /**
   * 提交新建站点
   * @param {
   *	templateId 模板id
   *	siteName 站点名称
   * }
   */
  const submitNewSite = async ({ templateData, siteName }: CreateSiteReq) => {
    const createSuccess = await goEdit(templateData.templateId, siteName);
    if (createSuccess) {
      closeNewSite();
      trackApi.track('site_newshow_winsucc');
    }
  };

  /**
   * 新建站点选择模板
   * @param data
   */
  const handleNewSiteChooseTemplate = (data: TemplateItem) => {
    parentRef.current.chooseTemplate(data);
    currentChooseTemplateIdRef.current = data.templateId;
    closeChooseTemplate();
  };

  const handleAiCreateSiteOpenEditor = (siteId: string) => {
    navigateToEditor(siteId);
    getMySiteData();
  };

  return (
    <div className={styles.container}>
      <div className={styles.outer}>
        <div className={styles.line}>
          <div className={styles.add}>
            <EnhanceSelect style={{ width: 115, height: 28 }} value={currentShowCard} onChange={handleIndexOrDetailsFilter as any} options={SITE_SWITCH_OPTIONS} />
            <div onClick={openNewSite} className={styles.addSite}>
              {getIn18Text('XINJIANZHANDIAN')}
            </div>
          </div>
        </div>
        <div className={styles.content}>
          <div
            className={styles.left}
            style={{
              marginTop: isBuySiteBuilder ? -48 : 0,
            }}
          >
            {!isBuySiteBuilder ? <SiteBanner onBuy={handleSiteBannerBuy} onFreeConsult={handleSiteBannerFreeConsult} /> : null}
            <span className={styles.title}>站点获客</span>
            <BuyDomainTip />
            <CustomerCard goMarket={goMarket} addProduct={addProduct} addCount={addCountRef.current} hasEdmModule={isBuyEdm} />
            <span className={styles.title}>{getIn18Text('WODEZHANDIAN')}</span>
            {siteChildren}
          </div>
          <div className={styles.right}>
            <IntroVideo
              hash={location.hash}
              videoParams={{
                source: 'pinpaijianshe',
                scene: 'pinpaijianshe_2',
                videoId: 'V24',
                posterUrl: 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/12/20/081fcaba87984b7184404c494d49fff3.png',
              }}
              onPlayClick={() => {
                trackApi.track('waimao_brand_site_videoclick');
              }}
            />
            <CardList pageType={PAGE_TYPE.MY_SITE} />
          </div>
        </div>
        {/* 新手引导弹窗 */}
        <Guide guideStatus={guideStatus} />
        {/* 模板选择弹窗 */}
        {chooseTemplateVisible && (
          <ChooseTemplate
            visible={chooseTemplateVisible}
            onClose={closeChooseTemplate}
            onOk={goEdit}
            showChoose={createSiteVisible}
            currentChooseTemplateId={currentChooseTemplateIdRef.current}
            onChoose={handleNewSiteChooseTemplate}
            onExperienceClick={() => {
              trackApi.track('AI_creat_click', { result: 'win' });
              closeChooseTemplate();
              closeNewSite();
              setShowAiCreateSiteModal(true);
            }}
            pageType={PAGE_TYPE.MY_SITE}
          />
        )}
        {createSiteVisible && (
          <CreateSite
            visible={createSiteVisible}
            onClose={closeNewSite}
            onOk={submitNewSite}
            onChoose={openChooseTemplate}
            onCreateCustom={openCreateCustomSite}
            parentRef={parentRef}
          />
        )}
        {renameVisible && <ReName visible={renameVisible} onClose={closeRename} onOk={submitRename} data={currentRenameRef.current} />}
        {createCustomSiteVisible && (
          <CreateCustomSite visible={createCustomSiteVisible} onClose={closeCreateCustomSite} onOk={closeCreateCustomSite} onBindSuccess={() => getMySiteData()} />
        )}
        {bindAnalysisVisible && <BindAnalysis siteId={bindSiteId} visible={bindAnalysisVisible} onClose={closeBindAnalysis} />}
        <UserInfoCollectModal visible={showUserCollectModal} onCancel={() => setShowUserCollectModal(false)} onSubmitSuccess={() => setShowUserCollectModal(false)} />

        <PreventCreateNewSiteModal
          visible={showPreventNewSite}
          onCancel={() => setShowPreventNewSite(false)}
          onFreeConsule={() => {
            setShowPreventNewSite(false);
            setShowUserCollectModal(true);
          }}
        />
        <AICreateSiteModal
          visible={showAiCreateSiteModal}
          onClose={() => setShowAiCreateSiteModal(false)}
          industryList={industryList}
          themeList={themeList}
          defaultTheme={defaultTheme}
          refreshSiteList={() => getMySiteData()}
          onOpenEditor={handleAiCreateSiteOpenEditor}
          onSubmitSuccess={() => getMySiteData()}
          onPreventCreateNewSite={() => {
            setShowPreventNewSite(true);
            getMySiteData();
          }}
        />

        <SiteServiceModal
          visible={serviceModalVisible}
          onClose={() => setServiceModalVisible(false)}
          serviceInfo={currentServiceInfoRef.current}
          onFreeConsule={() => {
            setServiceModalVisible(false);
            setShowUserCollectModal(true);
          }}
        />

        <HttpsModal
          visible={httpsModelVisible}
          onClose={() => {
            setHttpsModelVisible(false);
            cachedCertinfoRef.current = {};
          }}
          onOk={addDomainCert}
          domainList={currentDomainInfo?.domainList}
          domain={currentDomainInfo?.domain || ''}
          siteId={currentDomainInfo?.siteId || ''}
          initData={certInfo}
          onChangeDomain={onChangeDomain}
        />
      </div>
    </div>
  );
};
