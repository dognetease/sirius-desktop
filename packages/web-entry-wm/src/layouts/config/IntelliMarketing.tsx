import React from 'react';
import { TopMenuPath } from '@web-common/conf/waimao/constant';
import { getIn18Text } from 'api';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { TaskDiagnosisEntry } from '@web-edm/TaskDiagnosis/TaskDiagnosisEntry';
import { TongyongShijianMianxing } from '@sirius/icons';
import { ReactComponent as AddressBook } from '../../../../web-common/src/images/icons/address_book.svg';
import { ReactComponent as Email } from '../../../../web-common/src/images/icons/email.svg';
import { ReactComponent as Message } from '../../../../web-common/src/images/icons/message.svg';
import { ReactComponent as Auto } from '../../../../web-common/src/images/icons/auto.svg';
import { ReactComponent as IntelliBook } from '../../../../web-common/src/images/icons/intelli_book.svg';
import { ReactComponent as IntelliBookOpenSea } from '../../../../web-common/src/images/icons/intelli_book_open_sea.svg';
import { ReactComponent as IntelliBookDataStat } from '../../../../web-common/src/images/icons/intelli_book_data_stat.svg';
import { ReactComponent as IntelliTask } from '../../../../web-common/src/images/icons/intelli_task.svg';
import { ReactComponent as WarmupIcon } from '../../../../web-common/src/images/icons/warmup_icon.svg';
import { ReactComponent as IntelliDraft } from '../../../../web-common/src/images/icons/intelli_draft.svg';
import { ReactComponent as IntelliTemplateMail } from '../../../../web-common/src/images/icons/intelli_template_mail.svg';
import { ReactComponent as IntelliAnalyze } from '../../../../web-common/src/images/icons/intelli_analyze.svg';
import { ReactComponent as IntelliAI } from '../../../../web-common/src/images/icons/intelli_ai.svg';
import { ReactComponent as IntelliBatch } from '../../../../web-common/src/images/icons/intelli_batch.svg';
import { ReactComponent as IntelliWaGroup } from '../../../../web-common/src/images/icons/inteli_wagroup.svg';
import { ReactComponent as IntelliWaSearch } from '../../../../web-common/src/images/icons/inteli_waseacrh.svg';
import { ReactComponent as IntelliMessage } from '../../../../web-common/src/images/icons/intelli_message.svg';
import { ReactComponent as IntelliAuto } from '../../../../web-common/src/images/icons/intelli_auto.svg';
import { ReactComponent as IntelliTemplate } from '../../../../web-common/src/images/icons/intelli_template.svg';
import { ReactComponent as IntelliEngineSearching } from '../../../../web-common/src/images/icons/intelli_engine_searching.svg';
import { ReactComponent as FacebookPages } from '../../../../web-common/src/images/icons/facebook_pages.svg';
import { ReactComponent as FacebookPosts } from '../../../../web-common/src/images/icons/facebook_posts.svg';
import { ReactComponent as Hosting } from '../../../../web-common/src/images/icons/hosting.svg';
import { ReactComponent as SenderRotateIcon } from '../../../../web-common/src/images/icons/sender_rotate.svg';

import MenuIcons from '@/components/UI/MenuIcon';

import { ReactComponent as Facebook } from '../../../../web-common/src/images/icons/facebook.svg';

const betaIconStyle = {
  marginLeft: '4px',
  display: 'inline-block',
  lineHeight: '20px',
  padding: '0px 6px',
  color: '#fff',
  fontSize: '12px',
  background: '#3FDE9C',
  borderRadius: '2px',
};

const WillOfflineTag = () => (
  <Tooltip title="WhatsApp个人营销功能已经搬家至WhatsApp群发（群发功能请联系销售了解），个人营销功能将于近期下线，给各位用户带来的不便敬请谅解。">
    <div style={{ position: 'relative', top: 3, fontSize: '16px', color: '#ffb54c' }}>
      <TongyongShijianMianxing />
    </div>
  </Tooltip>
);

export default [
  {
    name: getIn18Text('ZHINENGYINGXIAO'),
    path: TopMenuPath.intelliMarketing,
    label: '',
    children: [
      {
        name: getIn18Text('YINGXIAOLIANXIREN'),
        path: 'addressBook',
        label: 'ADDRESS_BOOK',
        icon: <AddressBook />,
        children: [
          {
            name: getIn18Text('YINGXIAOLIANXIREN'),
            path: 'addressBookIndex',
            label: 'ADDRESS_BOOK_LIST',
            topMenuIcon: <IntelliBook />,
            parent: 'addressBook',
            children: [],
          },
          {
            name: getIn18Text('YINGXIAOTONGJIWEB'),
            path: 'addressBookDatastat',
            label: 'MARKET_DATA_STAT',
            topMenuIcon: <IntelliBookDataStat />,
            parent: 'addressBook',
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('YOUJIANYINGXIAO'),
        path: 'edm',
        label: 'EDM',
        icon: <Email />,
        children: [
          // {
          //   name: '多域名营销',
          //   path: 'senderRotateList',
          //   label: 'EDM_MULTI_ACCOUNT_INFO',
          //   parent: 'edm',
          //   subset: ['write'],
          //   topMenuIcon: <SenderRotateIcon />,
          //   children: [],
          // },
          {
            // name: getIn18Text('FAJIANRENWU'),
            name: <TaskDiagnosisEntry title={getIn18Text('FAJIANRENWU')} />,
            path: 'index',
            label: 'EDM_SENDBOX',
            parent: 'edm',
            subset: ['write'],
            topMenuIcon: <IntelliTask />,
            children: [],
          },
          {
            name: getIn18Text('YOUXIANGYURE'),
            path: 'warmup',
            label: 'EDM_SENDBOX',
            parent: 'edm',
            topMenuIcon: <WarmupIcon />,
            children: [],
          },
          {
            name: getIn18Text('CAOGAOLIEBIAO'),
            path: 'drafts',
            label: 'EDM_DRAFT_LIST',
            parent: 'edm',
            topMenuIcon: <IntelliDraft />,
            children: [],
          },
          // {
          //   name: getIn18Text('ZIDONGHUAYINGXIAOWEB'),
          //   path: 'autoMarketTask',
          //   label: 'EDM_SENDBOX',
          //   subset: ['autoMarketTaskEdit'],
          //   // icon: <Auto />,
          //   hiddenWithFree: true,
          //   show: true,
          //   parent: 'edm',
          //   topMenuIcon: <IntelliAuto />,
          //   // onlyChild: true,
          //   children: [],
          // },
          {
            name: '内容库',
            path: 'mailTemplate',
            label: '',
            parent: 'edm',
            subset: ['templateAddModal'],
            topMenuIcon: <IntelliTemplateMail />,
            children: [],
          },
          {
            name: getIn18Text('YINGXIAOTUOGUAN'),
            path: 'aiHosting',
            label: 'EDM_SENDBOX',
            parent: 'edm',
            subset: ['aiHosting'],
            topMenuIcon: <Hosting />,
            children: [],
            newBadge: true,
          },
          // {
          //   name: '数据统计',
          //   path: 'contact',
          //   label: 'EDM_DATA_STAT',
          //   parent: 'edm',
          //   topMenuIcon: <IntelliAnalyze />,
          //   children: []
          // },
        ],
      },
      {
        name: 'WhatsApp群发',
        path: 'multiAccount',
        label: 'WHATSAPP_GROUP_SEND',
        icon: <Message />,
        children: [
          {
            name: '消息',
            path: 'multiAccountMessage',
            parent: 'multiAccount',
            children: [],
            topMenuIcon: <IntelliMessage />,
            label: 'WHATSAPP_GROUP_MSG',
          },
          {
            name: '营销群发',
            path: 'marketBulk',
            parent: 'multiAccount',
            children: [],
            topMenuIcon: <IntelliBatch />,
            label: 'WHATSAPP_MARKETING_GROUP_SEND',
          },
          {
            name: '营销搜索',
            path: 'marketSearchWhatsApp',
            parent: 'multiAccount',
            children: [],
            topMenuIcon: <IntelliWaSearch />,
            label: 'WHATSAPP_MARKETING_SEARCH',
          },
          {
            name: '营销加群',
            path: 'marketWaGroupHistory',
            parent: 'multiAccount',
            children: [],
            topMenuIcon: <IntelliWaGroup />,
            label: 'WHATSAPP_MARKETING_ADD_GROUP',
          },
        ],
      },
      {
        name: getIn18Text('WAGERENYINGXIAO'),
        path: 'personalWhatsapp',
        label: 'WHATSAPP',
        icon: <Message />,
        children: [
          {
            name: getIn18Text('WAGERENHAOXIAOXI'),
            path: 'pernsonalWhatsapp',
            parent: 'personalWhatsapp',
            children: [],
            topMenuIcon: <IntelliMessage />,
            label: 'WHATSAPP_PERSONAL_MSG',
            suffix: <WillOfflineTag />,
          },
          {
            name: getIn18Text('WAGERENQUNFARENWU'),
            path: 'pernsonalJobWhatsApp',
            parent: 'personalWhatsapp',
            children: [],
            topMenuIcon: <IntelliBatch />,
            label: 'WHATSAPP_PERSONAL_SEND_TASK',
            suffix: <WillOfflineTag />,
          },
        ],
      },
      {
        name: getIn18Text('WASHANGYEYINGXIAO'),
        path: 'whatsapp',
        label: 'WHATSAPP',
        icon: <Message />,
        children: [
          {
            name: getIn18Text('WASHANGYEXIAOXI'),
            path: 'whatsAppMessage',
            label: 'WHATSAPP_MSG',
            parent: 'whatsapp',
            topMenuIcon: <IntelliMessage />,
            children: [],
          },
          // {
          //   name: (
          //     <div>
          //       <span>{getIn18Text('EngineSearching')}</span>
          //       <span style={betaIconStyle}>BETA</span>
          //     </div>),
          //   path: 'whatsAppAiSearch',
          //   label: 'WHATSAPP_SEND_TASK',
          //   parent: 'whatsapp',
          //   topMenuIcon: <IntelliAI />,
          //   children: []
          // },
          {
            name: getIn18Text('WASHANGYEQUNFARENWU'),
            path: 'whatsAppJob',
            label: 'WHATSAPP_SEND_TASK',
            parent: 'whatsapp',
            subset: ['whatsAppJobEdit'],
            topMenuIcon: <IntelliBatch />,
            children: [],
          },
          {
            name: getIn18Text('SHUJUTONGJI'),
            path: 'whatsAppStatistic',
            label: 'WHATSAPP_DATA_STAT',
            parent: 'whatsapp',
            show: false,
            topMenuIcon: <IntelliAnalyze />,
            children: [],
          },
          {
            name: getIn18Text('WAXIAOXIMOBANWEB'),
            path: 'whatsAppTemplate',
            label: 'WHATSAPP_MSG_TPL_SETTING',
            parent: 'whatsapp',
            show: false,
            topMenuIcon: <IntelliTemplate />,
            children: [],
          },
        ],
      },
      {
        name: getIn18Text('FACEBOOKYINXIAO'),
        path: 'facebook',
        label: 'FACEBOOK',
        icon: <Facebook />,
        hiddenWithFree: true,
        children: [
          {
            name: getIn18Text('wodezhuyeguanli'),
            path: 'facebookPages',
            parent: 'facebook',
            label: 'FACEBOOK_MY_MAIN_PAGE',
            children: [],
            topMenuIcon: <FacebookPages />,
          },
          {
            name: getIn18Text('wodetieziguanli'),
            path: 'facebookPosts',
            parent: 'facebook',
            label: 'FACEBOOK_MY_POST',
            children: [],
            topMenuIcon: <FacebookPosts />,
          },
          {
            name: getIn18Text('facebookxiaoxi'),
            path: 'facebookMessage',
            parent: 'facebook',
            label: 'FACEBOOK_MSG',
            children: [],
            topMenuIcon: <IntelliMessage />,
          },
        ],
      },
    ],
  },
];
