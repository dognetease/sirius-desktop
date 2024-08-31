import { getIn18Text } from 'api';
import React from 'react';
import detailStyle from './detailTop.module.scss';
import { DetailTabConfig, DetailTabOption } from './detailEnums';
import { EdmEmailInfo } from 'api';

export interface Props {
  info: EdmEmailInfo;
  tabConfig: DetailTabConfig[];
}

// 需要展示的过滤列表,四个指标：发送，送达，打开，回复，
const tabConfigFilterList = [DetailTabOption.Receiver, DetailTabOption.Sended, DetailTabOption.Open, DetailTabOption.Reply];

// 新的最上方的卡片
export const DetailTopHeader = (props: Props) => {
  const { tabConfig, info } = props;
  if (!info) {
    return null;
  }
  return (
    <div className={detailStyle.headerBg}>
      <div className={detailStyle.header}>{getIn18Text('GAILANSHUJU')}</div>
      <ul className={`${detailStyle.tabList}`}>
        {tabConfig
          .filter(config => config.configEnum && tabConfigFilterList.includes(config.configEnum))
          .map(config => {
            if (config.hide) {
              return null;
            }
            let num = info[config.valueKey];
            if (num === undefined) {
              num = '0';
            }
            return (
              <li className={detailStyle.tabItem} key={config.tabIndex}>
                <div className={detailStyle.left}>
                  <i className={`${detailStyle.tabItemIcon} ${detailStyle['statisticsIcon' + config.tabIndex]}`} />
                </div>
                <div className={detailStyle.right}>
                  {config.subTitle && (
                    <div className={`${detailStyle.edmDetailSubTitle} ${detailStyle['subTitle' + config.tabIndex]}`}>
                      {config.subTitle}:{info[config.subValueKey]}
                    </div>
                  )}
                  <div className={detailStyle.tabItemNum}>{info?.emailStatus === 0 && config.configEnum !== DetailTabOption.Marketing ? '--' : num}</div>
                  <div className={detailStyle.tabItemTitle}>{config.title}</div>
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
};
