import { getIn18Text } from 'api';
import React from 'react';
import { TongyongShijianMianxing } from '@sirius/icons';
import { TaskDiagnosisEntry } from '@web-edm/TaskDiagnosis/TaskDiagnosisEntry';
import { TopMenuPath } from '@web-common/conf/waimao/constant';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { ReactComponent as IconZidongkaifa } from '../svg/v2/zidongkaifa.svg';
import { ReactComponent as IconShoudongkaifa } from '../svg/v2/shoudongkaifa.svg';
import { ReactComponent as IconYingxiaotongji } from '../svg/v2/yingxiaotongji.svg';
import { ReactComponent as IconYouxiangkaifa } from '../svg/v2/youxiangkaifa.svg';
import { ReactComponent as IconWhatsapp } from '../svg/v2/whatsapp.svg';
import { ReactComponent as IconWhatsappB } from '../svg/v2/whatsapp_B.svg';
import { ReactComponent as IconFacebook } from '../svg/v2/facebook.svg';
import { ReactComponent as IconCustomerSub } from '../svg/v2/customersub.svg';

const WillOfflineTag = () => (
  <Tooltip title="WhatsApp个人营销功能已经搬家至WhatsApp群发（群发功能请联系销售了解），个人营销功能将于近期下线，给各位用户带来的不便敬请谅解。">
    <div style={{ position: 'relative', top: 3, fontSize: '16px', color: '#ffb54c' }}>
      <TongyongShijianMianxing />
    </div>
  </Tooltip>
);

export default [
  {
    name: getIn18Text('KEHUKAIFA'),
    path: TopMenuPath.intelliMarketing,
    label: 'CUSTOMER_EXLOIT',
    layout: [[0, 1], [2, 3], [4, 5], [6], [7]],
    children: [
      {
        name: getIn18Text('ZIDONGKAIFA'),
        path: 'autoExloit',
        label: 'AUTO_EXLOIT',
        icon: <IconZidongkaifa />,
        children: [
          {
            name: getIn18Text('XINJIANYINGXIAOTUOGUAN'),
            path: 'aiHostingNew',
            label: 'NEW_MARKETING_TUTELAGE_TASK',
            parent: 'autoExloit',
            children: [],
          },
          {
            name: getIn18Text('YINGXIAOTUOGUANRENWU'),
            path: 'aiHosting',
            label: 'MARKETING_TUTELAGE_TASK',
            parent: 'autoExloit',
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('DINGYUEGUANLI'),
        path: 'customerBook',
        label: 'SUBSCRIBE_MANAGE',
        icon: <IconCustomerSub />,
        children: [
          {
            name: getIn18Text('DINGYUEKEHULIEBIAO'),
            path: 'customerBookList',
            label: 'SUBSCRIBE_CUSTOMER_LIST',
            parent: 'customerBook',
            children: [],
            subset: ['customerGrade'],
          },
        ],
      },
      {
        name: getIn18Text('SHOUDONGKAIFA'),
        path: 'manualExloit',
        label: 'MANUAL_EXLOIT',
        icon: <IconShoudongkaifa />,
        children: [
          {
            name: getIn18Text('XINJIANFAJIANRENWU'),
            path: 'write',
            label: 'NEW_EDM_SEND_TASK',
            parent: 'manualExloit',
            children: [],
          },
          {
            name: <TaskDiagnosisEntry />,
            path: 'index',
            label: 'EDM_SENDBOX',
            parent: 'manualExloit',
            children: [],
          },
          {
            name: getIn18Text('YOUXIANGYURE'),
            path: 'warmup',
            label: 'EDM_MULTI_ACCOUNT_WARMUP',
            parent: 'manualExloit',
            children: [],
          },
          // {
          //   name: '多域名营销',
          //   path: 'senderRotateList',
          //   label: 'EDM_MULTI_ACCOUNT_INFO',
          //   parent: 'manualExloit',
          //   children: [],
          // },
        ],
      },
      {
        name: getIn18Text('YINGXIAOTONGJI'),
        path: 'marketDataStat',
        label: 'MARKET_DATA_STAT',
        icon: <IconYingxiaotongji />,
        children: [
          {
            name: getIn18Text('YINGXIAOLIANXIREN'),
            path: 'addressBookIndex',
            label: 'ADDRESS_BOOK',
            parent: 'marketDataStat',
            children: [],
          },
          {
            name: getIn18Text('SHUJUTONGJI'),
            path: 'addressBookDatastat',
            label: 'EDM_DATA_STAT',
            parent: 'marketDataStat',
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('YOUXIANGKAIFAFUZHUGONG'),
        path: 'emailAidTool',
        label: 'EMAIL_AID_TOOL',
        icon: <IconYouxiangkaifa />,
        children: [
          // {
          //   name: getIn18Text('ZIDONGHUAYINGXIAO'),
          //   path: 'autoMarketTask',
          //   label: 'AUTO_MARKETING',
          //   parent: 'emailAidTool',
          //   children: [],
          // },
          {
            name: '内容库',
            path: 'mailTemplate',
            label: 'EDM_TEMPLATE',
            parent: 'emailAidTool',
            children: [],
          },
          {
            name: getIn18Text('CAOGAOLIEBIAO'),
            path: 'drafts',
            label: 'EDM_DRAFT_LIST',
            parent: 'emailAidTool',
            children: [],
          },
        ],
      },
      {
        name: 'WhatsApp群发',
        path: 'multiAccount',
        label: 'WHATSAPP_GROUP_SEND',
        icon: <IconWhatsapp />,
        children: [
          {
            name: '消息',
            path: 'multiAccountMessage',
            parent: 'multiAccount',
            children: [],
            label: 'WHATSAPP_GROUP_MSG',
          },
          {
            name: '营销群发',
            path: 'marketBulk',
            parent: 'multiAccount',
            children: [],
            label: 'WHATSAPP_MARKETING_GROUP_SEND',
          },
          {
            name: '营销搜索',
            path: 'marketSearchWhatsApp',
            parent: 'multiAccount',
            children: [],
            label: 'WHATSAPP_MARKETING_SEARCH',
          },
          {
            name: '营销加群',
            path: 'marketWaGroupHistory',
            parent: 'multiAccount',
            children: [],
            label: 'WHATSAPP_MARKETING_ADD_GROUP',
          },
        ],
      },
      {
        name: getIn18Text('WAGERENYINGXIAO'),
        path: 'whatsappPersonalMarketing',
        label: 'WHATSAPP_PERSONAL_MARKETING',
        icon: <IconWhatsapp />,
        children: [
          {
            name: getIn18Text('WAGERENHAOXIAOXI'),
            path: 'pernsonalWhatsapp',
            label: 'WHATSAPP_PERSONAL_MSG',
            parent: 'whatsappPersonalMarketing',
            children: [],
            suffix: <WillOfflineTag />,
          },
          {
            name: getIn18Text('WAGERENQUNFARENWU'),
            path: 'pernsonalJobWhatsApp',
            label: 'WHATSAPP_PERSONAL_SEND_TASK',
            parent: 'whatsappPersonalMarketing',
            children: [],
            suffix: <WillOfflineTag />,
          },
        ],
      },
      {
        name: getIn18Text('WASHANGYEYINGXIAO'),
        path: 'whatsappBusinessMarketing',
        label: 'WHATSAPP_BUSINESS_MARKETING',
        icon: <IconWhatsappB />,
        children: [
          {
            name: getIn18Text('WASHANGYEXIAOXI'),
            path: 'whatsAppMessage',
            label: 'WHATSAPP_MSG',
            parent: 'whatsappBusinessMarketing',
            children: [],
          },
          {
            name: getIn18Text('WASHANGYEQUNFARENWU'),
            path: 'whatsAppJob',
            label: 'WHATSAPP_SEND_TASK',
            parent: 'whatsappBusinessMarketing',
            children: [],
          },
          {
            name: getIn18Text('SHUJUTONGJI'),
            path: 'whatsAppStatistic',
            label: 'WHATSAPP_DATA_STAT',
            parent: 'whatsappBusinessMarketing',
            children: [],
          },
          {
            name: getIn18Text('XIAOXIMOBAN'),
            path: 'whatsAppTemplate',
            label: 'WHATSAPP_MSG_TPL_SETTING',
            parent: 'whatsappBusinessMarketing',
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('FACEBOOKYINXIAO'),
        path: 'facebook',
        label: 'FACEBOOK',
        icon: <IconFacebook />,
        children: [
          {
            name: getIn18Text('wodezhuyeguanli'),
            path: 'facebookPages',
            label: 'FACEBOOK_MY_MAIN_PAGE',
            parent: 'facebook',
            children: [],
          },
          {
            name: getIn18Text('TIEZIGUANLI'),
            path: 'facebookPosts',
            label: 'FACEBOOK_MY_POST',
            parent: 'facebook',
            children: [],
          },
          {
            name: getIn18Text('XIAOXI'),
            path: 'facebookMessage',
            label: 'FACEBOOK_MSG',
            parent: 'facebook',
            children: [],
          },
        ],
      },
    ],
  },
];
