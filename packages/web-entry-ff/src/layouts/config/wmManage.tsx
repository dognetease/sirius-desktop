import React from 'react';
import { ReactComponent as CustomsManage } from '../../../../web-common/src/images/icons/customs_manage.svg';
import { ReactComponent as WmPublic } from '../../../../web-common/src/images/icons/wm_public.svg';
import { ReactComponent as WmList } from '../../../../web-common/src/images/icons/wm_list.svg';
import { ReactComponent as WmPeople } from '../../../../web-common/src/images/icons/wm_people.svg';
import { ReactComponent as WmCustomerList } from '../../../../web-common/src/images/icons/wm_customer_list.svg';
import { ReactComponent as WmAutoFilter } from '../../../../web-common/src/images/icons/wm_auto_filter.svg';
import { ReactComponent as WmNetTools } from '../../../../web-common/src/images/icons/wm_net_tools.svg';
import { ReactComponent as WmOpportunity } from '../../../../web-common/src/images/icons/wm_opportunity.svg';
import { ReactComponent as WmTag } from '../../../../web-common/src/images/icons/wm_tag.svg';
import { ReactComponent as WmCheck } from '../../../../web-common/src/images/icons/wm_check.svg';
import { ReactComponent as WmImportRecord } from '../../../../web-common/src/images/icons/wm_importRecord.svg';
import { ReactComponent as WmDataRrans } from '../../../../web-common/src/images/icons/wm_dataTrans.svg';
import { ReactComponent as WmClue } from '../../../../web-common/src/images/icons/wm_clue.svg';
import { ReactComponent as WmToolManage } from '../../../../web-common/src/images/icons/wm_tool.svg';
import { ReactComponent as WmMailSetting } from '../../../../web-common/src/images/icons/wm_mail_setting.svg';
import { TopMenuPath } from '@web-common/conf/waimao/constant';
import { getIn18Text } from 'api';

export default [
  {
    name: getIn18Text('KEHUHEYEWUWEB'),
    path: TopMenuPath.wm,
    label: '',
    children: [
      {
        name: getIn18Text('KEHUHEYEWUWEB'),
        path: 'customerManage',
        label: 'CONTACT',
        icon: <CustomsManage />,
        children: [
          {
            name: getIn18Text('KEHULIEBIAO'),
            path: 'customer',
            label: 'CONTACT_LIST',
            parent: 'customerManage',
            topMenuIcon: <WmCustomerList />,
            children: [],
          },
          {
            name: getIn18Text('KEHUGONGHAI'),
            path: 'customerOpenSea',
            label: 'CONTACT_OPEN_SEA',
            parent: 'customerManage',
            topMenuIcon: <WmPeople />,
            children: [],
          },
          {
            name: getIn18Text('SHANGJI'),
            path: 'business',
            label: 'CONTACT_COMMERCIAL_LIST',
            parent: 'customerManage',
            topMenuIcon: <WmOpportunity />,
            children: [],
          },
          {
            name: getIn18Text('BIAOQIANGUANLI'),
            path: 'labelManage',
            label: 'CONTACT_TAG_MANAGE',
            parent: 'customerManage',
            topMenuIcon: <WmTag />,
            show: false,
            children: [],
          },
          {
            name: getIn18Text('KEHUCHACHONG'),
            path: 'customerDuplicateCheck',
            label: 'CUSTOMER_DUPLICATE_CHECK', //??
            parent: 'customerManage',
            topMenuIcon: <WmCheck />,
            show: false,
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('XIANSUOGUANLI'),
        path: 'clueManage',
        label: '',
        icon: <WmClue />,
        children: [
          {
            name: getIn18Text('XIANSUOLIEBIAO'),
            path: 'clue',
            label: 'CONTACT_CHANNEL_LIST',
            parent: 'customerManage',
            topMenuIcon: <WmList />,
            children: [],
          },
          {
            name: getIn18Text('XIANSUOGONGHAI'),
            path: 'seaClue',
            label: 'CHANNEL_OPEN_SEA',
            parent: 'customerManage',
            topMenuIcon: <WmPublic />,
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('WAIMAOGONGJU'),
        path: 'wmTools',
        label: '',
        icon: <WmToolManage />,
        children: [
          {
            name: getIn18Text('WAIMAOTONGZHUSHOUWM'),
            path: 'extension',
            label: 'BROWSER_EXTENSION',
            topMenuIcon: <WmNetTools />,
            children: [],
          },
          {
            name: getIn18Text('SHUJUQIANYI'),
            path: 'dataTransfer',
            label: 'CONTACT_DATA_MIGRATION',
            topMenuIcon: <WmDataRrans />,
            children: [],
          },
          {
            name: getIn18Text('DAORUJILU'),
            path: 'importRecord',
            label: 'IMPORT_RECORD',
            show: false,
            topMenuIcon: <WmImportRecord />,
            children: [],
          },
        ],
      },
    ],
  },
];
