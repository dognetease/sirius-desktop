import React from 'react';
import { ReactComponent as Computer } from '../../../../web-common/src/images/icons/computer.svg';
import { ReactComponent as CoopDocument } from '../../../../web-common/src/images/icons/coop_document.svg';
import { ReactComponent as CoopCalendar } from '../../../../web-common/src/images/icons/coop_calendar.svg';
import { ReactComponent as CoopMessage } from '../../../../web-common/src/images/icons/coop_message.svg';
import { ReactComponent as CoopConcat } from '../../../../web-common/src/images/icons/coop_concat.svg';
import { TopMenuPath } from '@web-common/conf/waimao/constant';
import { getIn18Text } from 'api';

export default [
  {
    name: getIn18Text('XIETONGBANGONG'),
    path: TopMenuPath.coop,
    type: 'group',
    children: [
      {
        name: getIn18Text('XIETONGBANGONG'),
        path: 'coop',
        icon: <Computer />,
        children: [
          {
            name: getIn18Text('XIAOXI'),
            path: 'message',
            parent: 'coop',
            topMenuIcon: <CoopMessage />,
            children: [],
          },
          {
            name: getIn18Text('RILI'),
            path: 'schedule',
            parent: 'coop',
            topMenuIcon: <CoopCalendar />,
            children: [],
          },
          {
            name: getIn18Text('YUNWENDANG'),
            path: 'disk',
            parent: 'coop',
            topMenuIcon: <CoopDocument />,
            children: [],
          },
          {
            name: getIn18Text('TONGXUNLU'),
            path: 'lxContact',
            parent: 'coop',
            topMenuIcon: <CoopConcat />,
            children: [],
          },
          // {
          //   name: '应用中心',
          //   path: 'apps',
          //   parent: 'coop',
          //   topMenuIcon: <CoopConcat />,
          //   show: false,
          //   children: []
          // }
        ],
      },
    ],
  },
];
