import React, { useState, useEffect } from 'react';
import style from './overview.module.scss';
import { ProviderType, WarmUpData } from 'api';
import { DetailTabConfig } from '../detail/detailEnums';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';

export interface Props {
  info: WarmUpData;
  onFilterChange?: (info: WarmUpData) => void;
  defaultDays?: number;
}

// 新的最上方的卡片
export const WarmUpDetaiLHeader = (props: Props) => {
  const { info, onFilterChange, defaultDays = 14 } = props;
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
      valueKey: 'totalReceived',
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

  const SelectComp = () => {
    let timeOption = [
      {
        label: '近14天',
        value: 14,
      },
      {
        label: '近30天',
        value: 30,
      },
      {
        label: '近3个月',
        value: 90,
      },
      {
        label: '近6个月',
        value: 180,
      },
    ];
    let serverOption = [
      {
        label: '全部',
        value: ProviderType.All,
      },
      {
        label: '谷歌个人/企业',
        value: ProviderType.Gmail,
      },
      {
        label: '微软个人/企业',
        value: ProviderType.Outlook,
      },
      {
        label: '其他',
        value: ProviderType.Others,
      },
    ];

    return (
      <div className={style.select}>
        <EnhanceSelect
          className={style.item}
          options={timeOption}
          defaultValue={defaultDays || timeOption[0].value}
          placeholder={'日期'}
          onChange={item => {
            info.filterDate = item as number;
            onFilterChange && onFilterChange(info);
          }}
        />
        <EnhanceSelect
          className={style.item}
          options={serverOption}
          defaultValue={serverOption[0].value}
          placeholder={'请选择服务商'}
          onChange={item => {
            info.filterProvider = (item as ProviderType) || ProviderType.All;
            // All 只是本地记录, 传给服务端的时候, 传空
            if ((item as ProviderType) === ProviderType.All) {
              info.filterProvider = undefined;
            }
            onFilterChange && onFilterChange(info);
          }}
        />
      </div>
    );
  };

  let iconWidth = '40px';
  return (
    <div className={style.headerBg}>
      <div className={style.header}>
        <div>
          <span className={style.title}>数据详情</span>
        </div>
        {SelectComp()}
      </div>
      <ul className={style.tabList} style={{ height: '46px' }}>
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
