import React, { useState, useEffect } from 'react';
import style from './overview.module.scss';
import { ProviderType, WarmUpData } from 'api';
import { DetailTabConfig } from '../detail/detailEnums';

export interface Props {
  info: WarmUpData;
  defaultDays?: number;
}

// 新的最上方的卡片
export const WarmUpDetaiLHeader = (props: Props) => {
  const { info, defaultDays = 14 } = props;
  const [tabConfig, setTabConfig] = useState<DetailTabConfig[]>([]);

  useEffect(() => {
    constructTabList();
  }, []);

  useEffect(() => {
    if (!info.filterProvider) {
      info.filterProvider = ProviderType.All;
    }
    if (!info.filterDate) {
      info.filterDate = defaultDays;
    }
  }, [info]);

  const constructTabList = () => {
    let tabConfigs = new Array<DetailTabConfig>();
    let conf1: DetailTabConfig = {
      tabIndex: 0,
      title: '邮箱预热发送封数',
      valueKey: 'totalSent',
    };
    tabConfigs.push(conf1);

    let sendCountConf: DetailTabConfig = {
      tabIndex: 1,
      title: '进收件箱封数',
      valueKey: 'totalInbox',
    };
    tabConfigs.push(sendCountConf);

    let sendedCountConf: DetailTabConfig = {
      tabIndex: 2,
      title: '进垃圾箱后移除封数',
      valueKey: 'totalSpam',
    };
    tabConfigs.push(sendedCountConf);

    // let openCountConf: DetailTabConfig = {
    //   tabIndex: 3,
    //   title: '沟通中',
    //   valueKey: 'totalConversation',
    // };
    let openCountConf: DetailTabConfig = {
      tabIndex: 3,
      title: '进分类文件夹封数',
      valueKey: 'totalCategories',
    };
    tabConfigs.push(openCountConf);

    setTabConfig(tabConfigs);
  };

  let iconWidth = '56px';
  return (
    <div className={style.headerBg}>
      <div className={style.header}>
        <div>
          <span className={style.title}>数据详情</span>
        </div>
      </div>
      <ul className={style.tabList} style={{ height: '56px' }}>
        {tabConfig.map(config => {
          if (config.hide) {
            return null;
          }
          let num = info[config.valueKey as keyof WarmUpData];
          if (num === undefined) {
            num = '0';
          }
          return (
            <li className={style.tabItem} key={config.tabIndex}>
              <div className={style.left} style={{ width: iconWidth, height: iconWidth }}>
                <i className={`${style.tabItemIcon} ${style['statisticsIcon' + config.tabIndex]}`} />
              </div>
              <div className={style.right}>
                <div className={style.tabItemNum}>{num}</div>
                <div className={style.tabItemTitle}>{config.title}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
