import { TopMenuPath } from '@web-common/conf/waimao/constant';
import React from 'react';
import SubscribeMenuName from '@web/components/Layout/globalSearch/keywordsSubscribe/SubscribeMenuName/SubscribeMenuName';
import { ReactComponent as DataStat } from '../../../../web-common/src/images/icons/data_stat.svg';
import { ReactComponent as Global } from '../../../../web-common/src/images/icons/global.svg';
import { ReactComponent as DataMedia } from '../../../../web-common/src/images/icons/data_facebook.svg';
import { ReactComponent as DataSubscribe } from '../../../../web-common/src/images/icons/subscribe.svg';
import { ReactComponent as WdData } from '../../../../web-common/src/images/icons/wd_data.svg';
import { ReactComponent as BeltRoad } from '../../../../web-common/src/images/icons/belt_road.svg';
import { ReactComponent as SeaerchPeersIcon } from '../../../../web-common/src/images/icons/search_peer.svg';
import { ReactComponent as WdGlobal } from '../../../../web-common/src/images/icons/wd_global.svg';
import { ReactComponent as WdLBS } from '../../../../web-common/src/images/icons/wd_lbs.svg';
import { ReactComponent as WdGoogle } from '../../../../web-common/src/images/icons/wd_google.svg';
import { ReactComponent as WdStar } from '../../../../web-common/src/images/icons/wd_star.svg';
import { ReactComponent as WdProductSub } from '../../../../web-common/src/images/icons/product_sub.svg';
import { ReactComponent as WdLinkedIn } from '../../../../web-common/src/images/icons/linkedin_top_icon.svg';
import { ReactComponent as WdDataAiRcmd } from '../../../../web-common/src/images/icons/wm-data-ai-rcmd.svg';
import { ReactComponent as WdDataForwarder } from '../../../../web-common/src/images/icons/wd_forwarder.svg';
import { ReactComponent as WdDataIndustryCommerceSearch } from '../../../../web-common/src/images/icons/wd_IndustryCommerceSearch.svg';
import { ReactComponent as WdDataIntelligentSearch } from '../../../../web-common/src/images/icons/wd_intelligentSearch.svg';
import { ReactComponent as WdFaceBook } from '../../../../web-common/src/images/icons/facebook_top_icon.svg';
// import { ReactComponent as WdFork } from '../../../../web-common/src/images/icons/wd_fork.svg';
import { ReactComponent as WmNetTools } from '../../../../web-common/src/images/icons/wm_net_tools.svg';
import { ReactComponent as ExBData } from '../../../../web-common/src/images/icons/exhibitionData.svg';
import { ReactComponent as TradeAnalysis } from '../../../../web-common/src/images/icons/tradeIcon.svg';
import { api } from 'api';
import { getIn18Text } from 'api';

const storeApi = api.getDataStoreApi();

export default [
  {
    name: getIn18Text('WAIMAODASHUJU'),
    path: TopMenuPath.wmData,
    label: '',
    children: [
      {
        name: getIn18Text('CustomerAcquisitionByData'),
        path: 'dataAcquisition',
        label: 'DATA_ACQUISITION',
        icon: <DataStat />,
        children: [
          {
            name: getIn18Text('QUANQIUSOUSUO'),
            path: 'globalSearch',
            subset: ['contomfair'],
            label: 'GLOBAL_SEARCH',
            parent: 'dataAcquisition',
            topMenuIcon: <WdGlobal />,
            children: [],
          },
          {
            name: getIn18Text('HAIGUANSHUJU'),
            path: 'customs',
            label: 'CUSTOMS_BIGDATA',
            parent: 'dataAcquisition',
            topMenuIcon: <WdData />,
            children: [],
          },
          {
            name: '一带一路专题',
            path: 'beltRoad',
            label: 'GLOBAL_SEARCH',
            parent: 'dataAcquisition',
            topMenuIcon: <BeltRoad />,
            showNewBadge: !storeApi.getSync('VisitedBeltRoadMenu').suc,
            children: [],
          },
          {
            name: getIn18Text('GANGKOUSOUSUO'),
            path: 'forwarder',
            // todo
            label: 'FREIGHT_FORWARDING_PORT_SEARCH',
            parent: 'dataAcquisition',
            topMenuIcon: <WdDataForwarder />,
            children: [],
          },
          {
            name: getIn18Text('GONGSHANGSOUSUO（GUONEI'),
            path: 'industryCommerceSearch',
            // todo
            label: 'FREIGHT_FORWARDING_PORT_SEARCH',
            parent: 'dataAcquisition',
            topMenuIcon: <WdDataIndustryCommerceSearch />,
            children: [],
          },
          {
            name: getIn18Text('ZHINENGSOUSUO（GUONEI'),
            path: 'intelligentSearch',
            // todo
            label: 'FREIGHT_FORWARDING_PORT_SEARCH',
            parent: 'dataAcquisition',
            topMenuIcon: <WdDataIntelligentSearch />,
            children: [],
          },
          {
            name: '货代同行',
            path: 'searchPeers',
            subset: ['wca'],
            label: 'FREIGHT_FORWARDING_PORT_SEARCH',
            parent: 'dataAcquisition',
            topMenuIcon: <SeaerchPeersIcon />,
            showNewBadge: !storeApi.getSync('VisitedPeersMenu').suc,
            children: [],
          },
          {
            name: getIn18Text('LBSSOUSUO'),
            path: 'lbs',
            label: 'LBS_SEARCH',
            parent: 'dataAcquisition',
            topMenuIcon: <WdLBS />,
            children: [],
          },
          {
            name: getIn18Text('ZHANHUISHUJU'),
            path: 'contomfair',
            label: 'CONTOMFAIR_SEARCH',
            parent: 'dataAcquisition',
            topMenuIcon: <ExBData />,
            children: [],
          },
          {
            name: getIn18Text('IntelligentSearch'),
            path: 'intelligent',
            label: 'INTELLIGENT_SEARCH',
            parent: 'dataAcquisition',
            topMenuIcon: <WdGoogle />,
            children: [],
          },
          {
            name: getIn18Text('CHAJIANHUOKE'),
            path: 'extension',
            label: 'BROWSER_EXTENSION',
            parent: 'dataAcquisition',
            show: false,
            showNewBadge: !storeApi.getSync('VisitedExtensionMenu').suc,
            topMenuIcon: <WmNetTools />,
            children: [],
          },
          {
            name: getIn18Text('MAOYIFENXI'),
            path: 'tradeAnalysis',
            label: 'GLOBAL_SEARCH',
            parent: 'dataAcquisition',
            topMenuIcon: <TradeAnalysis />,
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('getClientFromSocial'),
        path: 'socialMediaAcquisition',
        label: 'SOCIAL_MEDIA',
        icon: <DataMedia />,
        children: [
          {
            name: getIn18Text('LinkedInCustomerAcquisition'),
            path: 'linkedin',
            label: 'LINKEDIN_SEARCH',
            parent: 'socialMediaAcquisition',
            children: [],
            // icon todo
            topMenuIcon: <WdLinkedIn />,
          },
          // {
          //   name: 'Facebook获客',
          //   path: 'facebook',
          //   label:'FACEBOOK_SEARCH',
          //   parent: 'socialMediaAcquisition',
          //   children: [],
          //   // icon todo
          //   topMenuIcon: <WdFaceBook />,
          // }
        ],
      },
      {
        name: getIn18Text('ZHINENGDINGYUE'),
        path: 'subscribe',
        label: 'SUBSCRIBE',
        icon: <DataSubscribe />,
        children: [
          {
            name: getIn18Text('GONGSIDINGYUE'),
            path: 'star',
            label: 'CUSTOMS_STAR',
            parent: 'subscribe',
            topMenuIcon: <WdStar />,
            children: [],
          },
          {
            name: getIn18Text('CHANPINDINGYUE'),
            path: 'keywords',
            parent: 'subscribe',
            label: 'GLOBAL_SEARCH',
            topMenuIcon: <WdProductSub />,
            children: [],
          },
          {
            name: getIn18Text('ZHINENGTUIJIAN'),
            path: 'smartrcmd',
            parent: 'subscribe',
            label: 'GLOBAL_SEARCH_RCMD',
            topMenuIcon: <WdDataAiRcmd />,
            showNewBadge: !storeApi.getSync('VisitedSmartRcmdMenu').suc,
            children: [],
          },
        ],
      },
    ],
  },
];
