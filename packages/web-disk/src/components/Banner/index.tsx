/*
 * @Author: wangzhijie02
 * @Date: 2021-11-24 09:49:43
 * @LastEditTime: 2022-06-28 15:08:47
 * @LastEditors: wangzhijie02
 * @Description: 云文档-主页 Banner
 */
import React, { useState } from 'react';
import { ReactComponent as RightIcon } from './img/right.svg';
import { ReactComponent as CloseIcon } from './img/close.svg';
import styles from './index.module.scss';
import { createFileByTemplateId } from '../../helper/createDocByTemplate';
import { templateTrack, trackerCreateBaseCached } from '../MainPage/extra';
import { apiHolder, DataStoreApi, inWindow } from 'api';
import classnames from 'classnames';
import { getIn18Text } from 'api';

interface Props {
  dirId: number;
  /**点击banner区域 打开模板库 */
  onScreenClick: () => void;
  /**点击快速链接创建文档成功执行的函数 */
  onCreateSuccess: () => void;
}
const bannerControlIdentifier = 'prevAppVersionForBannerClosed';
const quikeLinks = [
  {
    value: 'meetingWork',
    label: getIn18Text('\uD83D\uDCDD HUIYI'),
    title: getIn18Text('HUIYIJILU'),
    templateId: 1,
    docType: 'doc',
  },
  {
    value: 'projectPlan',
    label: getIn18Text('\uD83D\uDCCC XIANGMU'),
    title: getIn18Text('XIANGMUGUIHUA'),
    templateId: 2,
    docType: 'doc',
  },
  {
    value: 'dailyReport',
    label: getIn18Text('\uD83D\uDDD3 GONGZUO'),
    title: getIn18Text('GONGZUORIBAO'),
    templateId: 3,
    docType: 'doc',
  },
  {
    value: 'weaklyReport',
    label: getIn18Text('\uD83D\uDCD9 GONGZUO'),
    title: getIn18Text('GONGZUOZHOUBAO'),
    templateId: 4,
    docType: 'doc',
  },
];
let locked = false;
/**
 *
 * @param version1
 * @param version2
 * @description 版本比较
 *
 * 返回结果含义：
 *  1 version1 > version2
 *  0 version1 = version2
 * -1 version1 < version2
 * @returns
 */
const compareVersion = function (version1: string, version2: string): 1 | 0 | -1 {
  const v1 = version1.split('.');
  const v2 = version2.split('.');
  for (let i = 0; i < v1.length || i < v2.length; ++i) {
    let x = 0,
      y = 0;
    if (i < v1.length) {
      x = parseInt(v1[i]);
    }
    if (i < v2.length) {
      y = parseInt(v2[i]);
    }
    if (x > y) {
      return 1;
    }
    if (x < y) {
      return -1;
    }
  }
  return 0;
};
const FC: React.FC<Props> = props => {
  const siriusVersion = inWindow() ? window.siriusVersion : ''; // app版本号
  const storeApi: DataStoreApi = apiHolder.api.getDataStoreApi();
  const key = bannerControlIdentifier; // 需要按照用户维护缓存
  const data = storeApi.getSync(key);
  //上次关闭banner时app的版本号
  const cacheSiriusVersion = data.suc ? data.data : '';
  const isShowBanner = !cacheSiriusVersion || compareVersion(siriusVersion, cacheSiriusVersion) === 1;
  const [visable, setVisable] = useState(isShowBanner);
  const hideBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    storeApi.putSync(key, siriusVersion);
    setVisable(false);
  };
  if (!visable) {
    return null;
  }
  return (
    <div
      className={classnames([styles.bannerLayout, process.env.BUILD_ISEDM && styles.bannerWaimao])}
      onClick={() => {
        trackerCreateBaseCached.creat_type = 'home_banner';
        props.onScreenClick && props.onScreenClick();
      }}
    >
      <h3>{getIn18Text('YONGMOBANGAOXIAO')}</h3>
      <p
        style={{
          width: 370,
        }}
      >
        {getIn18Text('YONGMOBANCHUANGJIAN')}
      </p>
      <div className={styles.linkWrap}>
        {quikeLinks.map(item => {
          return (
            <div
              key={item.templateId}
              className={styles.linkItem}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                // 防止重复点击
                if (!locked) {
                  locked = true;
                  templateTrack({
                    operaType: 'use',
                    way: 'BannerQuick',
                    title: item.title,
                    type: item.docType as any,
                    kind: 'Recommend',
                  });
                  createFileByTemplateId(
                    {
                      docType: item.docType,
                      id: item.templateId,
                      title: item.title,
                    },
                    'personal',
                    props.dirId
                  ).then(bool => {
                    if (bool) {
                      props.onCreateSuccess && props.onCreateSuccess();
                      templateTrack({
                        operaType: 'create',
                        way: 'BannerQuick',
                        title: item.title,
                        type: item.docType as any,
                        kind: 'Recommend',
                      });
                    }
                    locked = false;
                  });
                }
              }}
            >
              <span>{item.label}</span>
              <span className={styles.vector}>
                <RightIcon />
              </span>
            </div>
          );
        })}
      </div>

      <span className={styles.close} onClick={hideBanner}>
        <CloseIcon />
      </span>
    </div>
  );
};
export const Banner = React.memo(FC);
