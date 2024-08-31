import React, { useState } from 'react';
import { navigate } from '@reach/router';
import { SemFormModal } from '../semForm';
import { FeedBackModal } from '../feedBackForm';
import { FeaturesOverview } from '../FeaturesOverview';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import throttle from 'lodash/throttle';
import { api, apis, SiteApi, DataTrackerApi, apiHolder, SystemApi, inWindow, getIn18Text } from 'api';
import { PAGE_TYPE } from '../../constants';
import styles from './index.module.scss';
import { ReactComponent as RightArrowIcon } from '../../images/right-arrow.svg';
import RightBuyDomainIcon from '../../images/right-card/right-buy-domain.png';
import NewIcon from '../../images/right-card/new.png';
import { ReactComponent as RightListIcon } from '../../images/right-card/right-list.svg';
import { ReactComponent as RightToolboxIcon } from '../../images/right-card/right-toolbox.svg';
import { ReactComponent as RightEncyclopediaIcon } from '../../images/right-card/right-encyclopedia.svg';
import { ReactComponent as RightMarketIcon } from '../../images/right-card/right-market.svg';
import { ReactComponent as RightFeedbackIcon } from '../../images/right-card/right-feedback.svg';
import { ReactComponent as RightFAQIcon } from '../../images/right-FAQ.svg';
import { ReactComponent as RightVideo } from '../../images/right-card/right-video.svg';
import { ReactComponent as MarketCourse } from '../../images/right-card/market-course.svg';
import { getTransText } from '@/components/util/translate';
import { useOpenHelpCenter } from '@web-common/utils/utils';
import { ToolboxModal } from '../ToolboxModal';

interface Props {
  pageType: string;
}

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const LOCAL_STORAGE_KEY = 'siteBuyDomainNewClick';

export const CardList: React.FC<Props> = props => {
  const { pageType } = props;
  const [toolboxVisible, setToolboxVisible] = useState(false);
  const [overviewVisible, setOverviewVisible] = useState(false);
  const [semFormVisible, setSemFormVisible] = useState(false);
  const [feedBackVisible, setFeedBackVisible] = useState(false);
  const [buyDomainNewVisible, setBuyDomainNewVisible] = useState(inWindow() && !window.localStorage.getItem(LOCAL_STORAGE_KEY));
  const openHelpCenter = useOpenHelpCenter();

  const openToolbox = () => {
    setToolboxVisible(true);
  };

  const closeToolbox = () => {
    setToolboxVisible(false);
  };

  const openOverview = () => {
    setOverviewVisible(true);
    trackApi.track('site_list_click');
  };

  const closeOverview = () => {
    setOverviewVisible(false);
  };

  const openSemForm = () => {
    setSemFormVisible(true);
    trackApi.track('site_market_click');
  };

  const closeSemForm = () => {
    setSemFormVisible(false);
  };

  const openFeedBack = () => {
    setFeedBackVisible(true);
    trackApi.track('site_feedback_click');
  };

  const closeFeedBack = () => {
    setFeedBackVisible(false);
  };

  // 跳转搜索域名页面
  const goBuyDomain = () => {
    setBuyDomainNewVisible(false);
    inWindow() && window.localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    navigate('#site?page=domainSearch');
    trackApi.track('buydomain', { from: 'nav' });
  };

  // 跳转营销落地页教程
  const goMarketCourse = () => {
    const url = '/d/1625074081916379138.html';
    // systemApi.openNewWindow(url, false);
    // openWebUrlWithLoginCode(url);
    openHelpCenter(url);
    trackApi.track('marketing_help_click');
  };

  // 帮助中心
  const goHelpCenter = () => {
    const url = '/c/1600375599838371842.html';
    // systemApi.openNewWindow(url, false);
    // openWebUrlWithLoginCode(url);
    openHelpCenter(url);
    trackApi.track('site_baike_click');
  };

  // 跳转建站视频教程
  const goSiteBuilderHelper = () => {
    const url = '/d/1730433462588010498.html';
    openHelpCenter(url);
  };

  const openFAQ = () => {
    const url = '/d/1650349036760227841.html';
    // systemApi.openNewWindow(url, false);
    openHelpCenter(url);
  };

  // 提交Sem
  const handleSemFormSubmit = throttle(async (value: { name: string; phone: string; marketingNeeds: string[] }) => {
    const { name, phone, marketingNeeds } = value;
    try {
      await siteApi.createMarketNeed({
        name,
        phone,
        marketingNeeds: marketingNeeds?.join() || '',
      });
      Toast.success({ content: '提交成功！' });
      closeSemForm();
    } catch (e) {
      Toast.success({ content: '提交失败！' });
    }
  }, 500);

  // 提交反馈
  const handleFeedBackSubmit = throttle(async (value: { type: string; content: string }) => {
    const { type, content } = value;

    try {
      await siteApi.addFeedback({
        type,
        content,
      });
      Toast.success({ content: '提交成功！' });
      closeFeedBack();
    } catch (e) {
      Toast.success({ content: '提交失败！' });
    }
  }, 500);

  return (
    <>
      <div className={styles.cardList}>
        {pageType === PAGE_TYPE.MY_SITE || pageType === PAGE_TYPE.BRAND ? (
          <div onClick={goBuyDomain} className={styles.item}>
            <img src={RightBuyDomainIcon} />
            <span className={styles.item1}>
              {getIn18Text('YUMINGGOUMAI')}
              {buyDomainNewVisible && <img src={NewIcon} className={styles.item1New} />}
            </span>
            <span className={styles.item2}>{getIn18Text('XIANMIANYUMINGXUANGOU')}</span>
            <RightArrowIcon />
          </div>
        ) : null}
        {pageType === PAGE_TYPE.MY_SITE ? (
          <div onClick={goSiteBuilderHelper} className={styles.item}>
            <RightVideo />
            <span className={styles.item1}>视频教程</span>
            <span className={styles.item2}>0-1搭建网站全流程视频详解</span>
            <RightArrowIcon />
          </div>
        ) : null}
        {pageType === PAGE_TYPE.MY_SITE || pageType === PAGE_TYPE.BRAND ? (
          <div onClick={openToolbox} className={styles.item}>
            <RightToolboxIcon />
            <span className={styles.item1}>{getIn18Text('SHIYONGGONGJUXIANG')}</span>
            <span className={styles.item2}>{getIn18Text('WAIMAOHANGYESHIYONGGONGJUJIHE')}</span>
            <RightArrowIcon />
          </div>
        ) : null}
        {pageType === PAGE_TYPE.MY_SITE || pageType === PAGE_TYPE.BRAND ? (
          <div onClick={openOverview} className={styles.item}>
            <RightListIcon />
            <span className={styles.item1}>{getTransText('GONGNENGQINGDAN')}</span>
            <span className={styles.item2}>{getTransText('WAIMAOJIANZHANNENGLIGAILAN')}</span>
            <RightArrowIcon />
          </div>
        ) : null}
        {pageType === PAGE_TYPE.MY_SITE || pageType === PAGE_TYPE.BRAND ? (
          <div onClick={goHelpCenter} className={styles.item}>
            <RightEncyclopediaIcon />
            <span className={styles.item1}>{getTransText('BANGZHUZHONGXINWM')}</span>
            <span className={styles.item2}>{getIn18Text('GUANYUJIANZHANDEYIQIEWENTI')}</span>
            <RightArrowIcon />
          </div>
        ) : null}
        {pageType === PAGE_TYPE.MARKET ? (
          <div onClick={goMarketCourse} className={styles.item}>
            <MarketCourse />
            <span className={styles.item1}>{getTransText('YINGXIAOLUODIYEJIAOCHENG')}</span>
            <span className={styles.item2}>快捷搭建好用的落地页</span>
            <RightArrowIcon />
          </div>
        ) : null}
        {pageType !== PAGE_TYPE.BRAND ? (
          <div className={styles.item} onClick={openSemForm}>
            <RightMarketIcon />
            <span className={styles.item1}>{getTransText('SEMYINGXIAO')}</span>
            <span className={styles.item2}>{getTransText('SIRENZHUANJIAWANZHUANCHUDA')}</span>
            <RightArrowIcon />
          </div>
        ) : null}
        <div className={styles.item} onClick={openFeedBack}>
          <RightFeedbackIcon />
          <span className={styles.item1}>{getTransText('YIJIANFANKUI')}</span>
          <span className={styles.item2}>{getTransText('JIANZHANDEWENTIFANKUI')}</span>
          <RightArrowIcon />
        </div>
        {pageType !== PAGE_TYPE.BRAND ? (
          <div className={styles.item} onClick={openFAQ}>
            <RightFAQIcon />
            <span className={styles.item1}>常见问题</span>
            <span className={styles.item2}>常见问题整理与解答</span>
            <RightArrowIcon />
          </div>
        ) : null}
      </div>
      {/* 实用工具箱 */}
      {toolboxVisible && <ToolboxModal visible={toolboxVisible} onClose={closeToolbox} />}
      {/* sem营销弹窗 */}
      {semFormVisible && <SemFormModal visible={semFormVisible} onClose={closeSemForm} onSubmit={handleSemFormSubmit} />}
      {/* 反馈弹窗 */}
      {feedBackVisible && <FeedBackModal visible={feedBackVisible} onClose={closeFeedBack} onSubmit={handleFeedBackSubmit} />}
      {overviewVisible && <FeaturesOverview visible={overviewVisible} onClose={closeOverview} />}
    </>
  );
};
