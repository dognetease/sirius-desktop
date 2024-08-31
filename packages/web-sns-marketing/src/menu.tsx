import { getIn18Text } from 'api';
import React from 'react';
import { ReactComponent as TopSnsMarketing } from '@web-common/images/icons/top_sns_marketing.svg';

export const SnsMarketingMenuData = [
  {
    title: getIn18Text('HAIWAISHEMEI'),
    key: 'snsMarketing',
    label: '',
    icon: <TopSnsMarketing />,
    trackEventId: 'client_2_Overseas_social_media',
    children: [
      {
        title: getIn18Text('ZHANGHAOBANGDING'),
        key: 'snsAccountBinding',
        _label: 'SOCIAL_MEDIA_ACCOUNT',
        trackEventId: 'client_3_brand_My_social_media',
      },
      {
        title: getIn18Text('SHEMEISHUJU'),
        key: 'snsGlobalDataAnalysis',
        _label: 'SOCIAL_MEDIA_DATA',
        trackEventId: 'client_3_brand_Social_media_data',
      },
      {
        key: 'snsMarketingTask',
        title: getIn18Text('YINGXIAORENWU'),
        _label: 'SOCIAL_MEDIA_TASK',
        trackEventId: 'client_3_brand_Social_media_Marketing_tasks',
      },
      {
        key: 'snsCalendar',
        title: getIn18Text('YINGXIAORILI'),
        _label: 'SOCIAL_MEDIA_CALENDAR',
        trackEventId: 'client_3_brand_Social_media_calendar',
      },
      {
        key: 'snsPostManage',
        title: getIn18Text('TIEZIGUANLIv16'),
        _label: 'SOCIAL_MEDIA_POST',
        trackEventId: 'client_3_brand_Social_media_posts_management',
      },
      {
        key: 'snsMessage',
        title: getIn18Text('SnsMessage'),
        _label: 'SOCIAL_MEDIA_MESSAGE',
        trackEventId: 'client_3_brand_Social_media_message_management',
      },
    ],
  },
];
