import { TopMenuPath } from '@web-common/conf/waimao/constant';
import React from 'react';
import { ReactComponent as DataStat } from '../../../../web-common/src/images/icons/data_stat.svg';
import { ReactComponent as Global } from '../../../../web-common/src/images/icons/global.svg';
import { ReactComponent as DataMedia } from '../../../../web-common/src/images/icons/data_facebook.svg';
import { ReactComponent as DataSubscribe } from '../../../../web-common/src/images/icons/subscribe.svg';
import { ReactComponent as WdData } from '../../../../web-common/src/images/icons/wd_data.svg';
import { ReactComponent as WdGlobal } from '../../../../web-common/src/images/icons/wd_global.svg';
import { ReactComponent as WdLBS } from '../../../../web-common/src/images/icons/wd_lbs.svg';
import { ReactComponent as WdGoogle } from '../../../../web-common/src/images/icons/wd_google.svg';
import { ReactComponent as WdStar } from '../../../../web-common/src/images/icons/wd_star.svg';
import { ReactComponent as WdProductSub } from '../../../../web-common/src/images/icons/product_sub.svg';
import { ReactComponent as WdLinkedIn } from '../../../../web-common/src/images/icons/linkedin_top_icon.svg';
import { ReactComponent as WdFaceBook } from '../../../../web-common/src/images/icons/facebook_top_icon.svg';
// import { ReactComponent as WdFork } from '../../../../web-common/src/images/icons/wd_fork.svg';
import { ReactComponent as WmNetTools } from '../../../../web-common/src/images/icons/wm_net_tools.svg';
import { getIn18Text } from 'api';

export default [
  {
    name: getIn18Text('WAIMAODASHUJU'),
    path: TopMenuPath.wmData,
    label: '',
    children: [
      {
        name: '数据获客',
        path: 'dataAcquisition',
        label: 'DATA_ACQUISITION',
        icon: <DataStat />,
        children: [
          {
            name: '全球搜索',
            path: 'globalSearch',
            subset: ['contomfair'],
            label: 'GLOBAL_SEARCH',
            parent: 'dataAcquisition',
            topMenuIcon: <WdGlobal />,
            children: [],
          },
          {
            name: '海关数据',
            path: 'customs',
            label: 'CUSTOMS_BIGDATA',
            parent: 'dataAcquisition',
            topMenuIcon: <WdData />,
            children: [],
          },
          {
            name: 'LBS搜索',
            path: 'lbs',
            label: 'LBS_SEARCH',
            parent: 'dataAcquisition',
            topMenuIcon: <WdLBS />,
            children: [],
          },
          {
            name: '智能引擎搜索',
            path: 'intelligent',
            label: 'INTELLIGENT_SEARCH',
            parent: 'dataAcquisition',
            topMenuIcon: <WdGoogle />,
            children: [],
          },
          {
            name: '数据抓取插件',
            path: 'extension',
            label: 'BROWSER_EXTENSION',
            parent: 'dataAcquisition',
            show: false,
            topMenuIcon: <WmNetTools />,
            children: [],
          },
        ],
      },
      {
        name: '社媒获客',
        path: 'socialMediaAcquisition',
        label: 'SOCIAL_MEDIA',
        icon: <DataMedia />,
        children: [
          {
            name: 'LinkedIn获客',
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
        name: '智能订阅',
        path: 'subscribe',
        label: 'SUBSCRIBE',
        icon: <DataSubscribe />,
        children: [
          {
            name: '公司订阅',
            path: 'star',
            label: 'CUSTOMS_STAR',
            parent: 'subscribe',
            topMenuIcon: <WdStar />,
            children: [],
          },
          {
            name: '产品订阅',
            path: 'keywords',
            parent: 'subscribe',
            label: 'GLOBAL_SEARCH',
            topMenuIcon: <WdProductSub />,
            children: [],
          },
        ],
      },
    ],
  },
];
