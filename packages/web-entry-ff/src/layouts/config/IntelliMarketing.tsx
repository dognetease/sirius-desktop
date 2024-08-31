import React from 'react';
import { ReactComponent as Email } from '../../../../web-common/src/images/icons/email.svg';
import { ReactComponent as IntelliTask } from '../../../../web-common/src/images/icons/intelli_task.svg';
import { ReactComponent as IntelliDraft } from '../../../../web-common/src/images/icons/intelli_draft.svg';
import { ReactComponent as IntelliAuto } from '../../../../web-common/src/images/icons/intelli_auto.svg';

import { TopMenuPath } from './constant';
import { getIn18Text } from 'api';

export default [
  {
    name: getIn18Text('ZHINENGYINGXIAO'),
    path: TopMenuPath.intelliMarketing,
    label: '',
    children: [
      {
        name: getIn18Text('YOUJIANYINGXIAO'),
        path: 'edm',
        label: 'EDM',
        icon: <Email />,
        children: [
          {
            name: getIn18Text('FAJIANRENWU'),
            path: 'index',
            label: 'EDM_SENDBOX',
            parent: 'edm',
            subset: ['write'],
            topMenuIcon: <IntelliTask />,
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
          {
            name: getIn18Text('YINGXIAOTONGJIWEB'),
            path: 'addressBookDatastat',
            label: 'MARKET_DATA_STAT',
            parent: 'edm',
            topMenuIcon: <IntelliAuto />,
            children: [],
          },
        ],
      },
    ],
  },
];
