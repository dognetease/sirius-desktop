import React, { useEffect, useState } from 'react';
import moment from 'moment';
import 'moment/locale/zh-cn';
import { apiHolder, apis, DataTrackerApi, AccountApi } from 'api';
import { UserGuide, UserGuideProps } from './UseGuide';
import image1 from '../../../images/guide/image1.png';
import image2 from '../../../images/guide/image2.png';
import image3 from '../../../images/guide/image3.png';
import image4 from '../../../images/guide/image4.png';
import { ReactComponent as Icon1 } from '../../../images/guide/icon1.svg';
import { ReactComponent as Icon2 } from '../../../images/guide/icon2.svg';
import { ReactComponent as Icon3 } from '../../../images/guide/icon3.svg';
import { ReactComponent as Icon4 } from '../../../images/guide/icon4.svg';
import { addModuleNotification } from '@web-common/state/reducer/notificationReducer';
import { useAppDispatch } from '@web-common/state/createStore';
import ModuleNotifications from '@web-common/components/ModuleNotification';

moment.locale('zh-cn'); // 指定每周的第一天是周一

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

const LOCAL_STORAGE_KEY = 'SITE_VISITE_TIME';

/**
 * 1、没有上线官网的时候，每周(自然周)出现一次
 * 2、有上线官网的时候，只出现一次弹窗
 */
export const Guide = (props: { guideStatus: number }) => {
  const { guideStatus } = props;
  const [visible, setVisible] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    accountApi.doGetAccountIsNewAccount().then(isNewAccount => {
      const last = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!last) {
        setVisible(isNewAccount);
        if (isNewAccount) {
          trackApi.track('site_newwin_show');
          localStorage.setItem(LOCAL_STORAGE_KEY, moment().toISOString());
        }
      }
    });
    // const last = localStorage.getItem(LOCAL_STORAGE_KEY); // 上次访问时间
    // if (guideStatus == 1) {
    //   // 没有上线的官网，每周出现一次弹窗
    //   if (!last || moment(last).week() != moment().week()) {
    //     setVisible(true);
    //     trackApi.track('site_newwin_show'); // 新手弹窗出现
    //   }
    // } else if (guideStatus == 2) {
    //   // 有上线的官网，只出现一次弹窗
    //   if (!last) {
    //     setVisible(true);
    //     trackApi.track('site_newwin_show'); // 新手弹窗出现
    //   }
    // }
  }, [guideStatus]);

  const closeGuide = () => {
    setVisible(false);
    localStorage.setItem(LOCAL_STORAGE_KEY, moment().toISOString()); // 更新最近访问时间
  };

  const [carouseItems] = useState<UserGuideProps['carouseItems']>([
    {
      key: '1',
      title: '海量行业模板，随心选择',
      content: '外贸通建站有多套专业美观的行业模板，可根据需求选择，快速建站。',
      icon: Icon1,
      image: image1,
      left: 37,
    },
    {
      key: '2',
      title: '专业建站编辑器，自由搭建',
      content: '建站编辑器提供丰富的网页模板和类型，可自定义搭建官网和营销落地页',
      icon: Icon2,
      image: image2,
      left: 0,
    },
    {
      key: '3',
      title: '打通邮件营销，精准追踪',
      content: '与邮件营销模块完全打通，能够看到客户详情的行为数据，精准营销',
      icon: Icon3,
      image: image3,
      left: 37,
    },
    {
      key: '4',
      title: '统计客户数据，发现商机',
      content: '统计客户访问的页面、商品和国家，清晰明了的发现商品和站点的吸引力',
      icon: Icon4,
      image: image4,
      left: -22,
    },
  ]);

  useEffect(() => {
    if (visible) {
      dispatch(
        addModuleNotification({
          type: 'carousel',
          module: 'site',
          pages: ['mySite', 'brand'],
          config: {
            title: '外贸通建站',
            label: '5分钟快速建站',
            list: carouseItems,
          },
        })
      );
    }
  }, [visible, carouseItems]);

  // return <UserGuide visible={visible} onClose={closeGuide} carouseItems={carouseItems} />;
  return <ModuleNotifications />;
};
