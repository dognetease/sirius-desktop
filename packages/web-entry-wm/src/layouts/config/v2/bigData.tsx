import { TopMenuPath } from '@web-common/conf/waimao/constant';
import React from 'react';
import { api } from 'api';
import { getIn18Text } from 'api';
import { ReactComponent as IconShujuhuoke } from '../svg/v2/shujuhuoke.svg';
import { ReactComponent as IconWhatsappB } from '../svg/v2/whatsapp_B.svg';
import { ReactComponent as IconZhaokegongju } from '../svg/v2/zhaokegongju.svg';

const storeApi = api.getDataStoreApi();

export default [
  {
    name: getIn18Text('KEHUFAXIAN'),
    path: TopMenuPath.wmData,
    label: 'CUSTOMER_PROSPECTING',
    /**
     * 目前仅针对 HeaderFc 组件使用，渲染方式为列布局
     * 数据结构如下
     * [
     *  // column1
     *  [index0, index1],
     *  // column2
     *  [index2, index3],
     * ]
     *
     */
    layout: [[0], [1], [2]],
    children: [
      {
        name: getIn18Text('CustomerAcquisitionByData'),
        path: 'dataAcquisition',
        label: 'DATA_MINING',
        icon: <IconShujuhuoke />,
        children: [
          {
            name: getIn18Text('QUANQIUSOUSUO'),
            path: 'globalSearch',
            subset: ['contomfair'],
            label: 'GLOBAL_SEARCH',
            parent: 'dataAcquisition',
            children: [],
          },
          {
            name: getIn18Text('HAIGUANSHUJU'),
            path: 'customs',
            label: 'CUSTOMS',
            parent: 'dataAcquisition',
            children: [],
          },
          {
            name: '一带一路专题',
            path: 'beltRoad',
            label: 'GLOBAL_SEARCH',
            parent: 'dataAcquisition',
            children: [],
            showNewBadge: !storeApi.getSync('VisitedBeltRoadMenu').suc,
          },
          {
            name: getIn18Text('GANGKOUSOUSUO'),
            path: 'forwarder',
            label: 'FREIGHT_FORWARDING_PORT_SEARCH',
            parent: 'dataAcquisition',
            children: [],
          },
          {
            name: getIn18Text('GONGSHANGSOUSUO（GUONEI'),
            path: 'industryCommerceSearch',
            label: 'FREIGHT_FORWARDING_IC_SEARCH',
            parent: 'dataAcquisition',
            children: [],
          },
          {
            name: getIn18Text('ZHINENGSOUSUO（GUONEI'),
            path: 'intelligentSearch',
            label: 'FREIGHT_FORWARDING_AI_SEARCH',
            parent: 'dataAcquisition',
            children: [],
          },
          {
            name: '货代同行',
            path: 'searchPeers',
            subset: ['wca'],
            label: 'FREIGHT_FORWARDING_PORT_SEARCH',
            parent: 'dataAcquisition',
            children: [],
            showNewBadge: !storeApi.getSync('VisitedPeersMenu').suc,
          },
          {
            name: getIn18Text('IntelligentSearch'),
            path: 'intelligent',
            label: 'AI_SEARCH',
            parent: 'dataAcquisition',
            children: [],
          },
          {
            name: getIn18Text('ZHINENGTUIJIAN'),
            path: 'smartrcmd',
            parent: 'subscribe',
            label: 'AI_RECOMMEND',
            showNewBadge: !storeApi.getSync('VisitedSmartRcmdMenu').suc,
            children: [],
          },
          {
            name: getIn18Text('ZHANHUIMAIJIA'),
            path: 'contomfair',
            label: 'EXHIBITION_BUYER',
            parent: 'dataAcquisition',
            children: [],
          },
          {
            name: getIn18Text('DITUSOUSUO'),
            path: 'lbs',
            label: 'MAP_SEARCH',
            parent: 'dataAcquisition',
            children: [],
          },
          {
            name: getIn18Text('SHEMEISOUSUO'),
            path: 'linkedin',
            label: 'SOCIAL_MEDIA_SEARCH',
            parent: 'socialMediaAcquisition',
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('SHICHANGDONGCHA'),
        path: 'marketing_insight',
        label: 'MARKETING_INSIGHT',
        icon: <IconWhatsappB />,
        children: [
          {
            name: getIn18Text('MAOYIFENXI'),
            path: 'tradeAnalysis',
            label: 'TRADE_ANALYSIS',
            parent: 'marketing_insight',
            children: [],
          },
          {
            name: getIn18Text('GONGSIDINGYUE'),
            path: 'star',
            label: 'COMPANY_SUB',
            parent: 'marketing_insight',
            children: [],
          },
          {
            name: getIn18Text('CHANPINDINGYUE'),
            path: 'keywords',
            parent: 'marketing_insight',
            label: 'PRODUCT_SUB',
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('ZHAOKEGONGJU'),
        path: 'tools',
        label: 'CUSTOMER_PROSPECTING_TOOL',
        icon: <IconZhaokegongju />,
        children: [
          {
            name: getIn18Text('LIULANQICHAJIANHUOKE'),
            path: 'extension',
            label: 'BROWSER_PLUGIN_TOOL',
            parent: 'tools',
            showNewBadge: !storeApi.getSync('VisitedExtensionMenu').suc,
            children: [],
          },
          // 暂时不上
          // {
          //   name: '邮箱猜想',
          //   path: '',
          //   label: 'EMAIL_ASSOCIATE',
          //   parent: 'tools',
          //   children: [],
          // },
        ],
      },
    ],
  },
];
