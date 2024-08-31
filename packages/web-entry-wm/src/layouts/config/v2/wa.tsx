import React from 'react';
import { api } from 'api';
import { ReactComponent as IconWhatsapp } from '@/images/icons/whatsApp/wa-icon-outline.svg';
import { ReactComponent as IconFolder } from '@/images/icons/whatsApp/folder.svg';
import { ReactComponent as IconManagement } from '@/images/icons/whatsApp/management.svg';

export default [
  {
    name: 'WA',
    path: 'wa',
    label: 'WA',
    layout: [[0], [1], [2]],
    children: [
      {
        name: '会话列表',
        path: 'waChatList',
        label: 'WA_CHAT_LIST',
        icon: <IconWhatsapp />,
        onlyChild: true,
        children: [],
      },
      {
        name: '文件管理',
        path: 'file_management',
        label: 'WA_FILE_MANAGE',
        icon: <IconFolder />,
        children: [
          {
            name: '分享记录',
            path: 'materielShareList',
            label: 'WA_FILE_SHARE_RECORD',
            children: [],
          },
          {
            name: '访问记录',
            path: 'materielVisitList',
            label: 'WA_FILE_ACCESS_RECORD',
            children: [],
          },
          {
            name: '文件列表',
            path: 'materielFileList',
            label: 'WA_FILE_LIST',
            children: [],
          },
        ],
      },
      {
        name: '会话管理',
        path: 'session',
        label: 'WA_CHAT_MANAGE',
        icon: <IconManagement />,
        children: [
          {
            name: '关注列表',
            path: 'waOperateLog',
            label: 'WA_CHAT_EMPHASIS_MANAGE_LIST',
            parent: 'session',
            children: [],
          },
          {
            name: '联系人分组',
            path: 'contactGroup',
            label: 'WA_CHAT_CONTACT_GROUP',
            children: [],
          },
          {
            name: '工作量统计',
            path: 'workloadStats',
            label: 'WA_CHAT_WORKLOAD_STATS',
            children: [],
          },
        ],
      },
    ],
  },
];
