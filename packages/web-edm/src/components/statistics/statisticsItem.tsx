import { getIn18Text } from 'api';
import { Dropdown, Menu, Tooltip } from 'antd';
import React, { ReactNode, useState } from 'react';
import { StatItemData, guardString } from '../../utils';
import { ReactComponent as FilterIcon } from '@/images/icons/edm/filter.svg';
import style from './statistics.module.scss';
import { api } from 'api';
import { edmDataTracker } from '../../tracker/tracker';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const systemApi = api.getSystemApi();
export interface StaticsticItemProps {
  data: StatItemData;
  icon?: ReactNode;
  style?: any;
  tooltip?: string;
}
export const StatisticItemNormal = (props: StaticsticItemProps) => {
  const data = props.data;

  const percentage = typeof data.subnum === 'number' ? data.subnum / 100 : data.subnum;
  let titleNode = <div>{data.title}</div>;
  if (props.tooltip) {
    titleNode = (
      <Tooltip title={props.tooltip} placement="top">
        {titleNode}
      </Tooltip>
    );
  }

  const doAction = () => {
    let url = data.url;
    url && url.length > 0 && systemApi.openNewWindow(url);
    edmDataTracker.track('pc_markting_edm_tasklist_promote', {
      click: 'deliver',
    });
  };

  const actionComp = () => {
    return (
      <div className={style.action} onClick={doAction}>
        <span className={style.actionTitle}>{getIn18Text('QUTISHENG')}</span>
        <div className={style.icon}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2.5V13.5" stroke="#4759B2" stroke-linecap="round" />
            <path d="M3.5 7L8 2.5L12.5 7" stroke="#4759B2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>
    );
  };
  return (
    <div className={style.itemPanel} style={props.style}>
      <div className={style.panelLeft}>{props.icon}</div>
      <div className={style.panelRight}>
        {titleNode}
        <div className={style.itemNum}>{data.num}</div>
        {data.subtitle && (
          <div>
            {data.subtitle}:<span className={style.itemSubnum}>{percentage}%</span>
          </div>
        )}
        {guardString(data.url) && actionComp()}
      </div>
    </div>
  );
};

const StatisticItemWithDropdown = (props: { icon?: ReactNode; data: Array<StatItemData>; style?: any; tooltip?: string; onKeyChange?: (key: string) => void }) => {
  const [index, setIndex] = useState(0);
  const item = props.data[index] || props.data[0];
  const percentage = typeof item.subnum === 'number' ? item.subnum / 100 : item.subnum;
  let titleNode = <span>{item.title}</span>;
  const openHelpCenter = useOpenHelpCenter();

  if (props.tooltip) {
    titleNode = (
      <Tooltip title={props.tooltip} placement="bottom">
        {titleNode}
      </Tooltip>
    );
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    const i = Number(key);
    setIndex(i);
    props.onKeyChange && props.onKeyChange(props.data[i].title);
  };

  const doAction = () => {
    let url = item.url;
    if (url && url.length > 0) {
      if (url.startsWith('/d')) {
        openHelpCenter(url);
      } else {
        systemApi.openNewWindow(url);
      }
    }
    // url && url.length > 0 && systemApi.openNewWindow(url);
    edmDataTracker.track('pc_markting_edm_tasklist_promote', {
      click: 'read',
    });
  };

  const actionComp = () => {
    return (
      <div className={style.action} onClick={doAction}>
        <span className={style.actionTitle}>{getIn18Text('QUTISHENG')}</span>
        <div className={style.icon}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2.5V13.5" stroke="#4759B2" stroke-linecap="round" />
            <path d="M3.5 7L8 2.5L12.5 7" stroke="#4759B2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className={style.itemPanel} style={props.style}>
      <div className={style.panelLeft}>{props.icon}</div>
      <div className={style.panelRight}>
        <div>
          {titleNode}
          <Dropdown
            overlay={
              <Menu onClick={handleMenuClick} selectedKeys={[String(index)]}>
                {props.data.map((item, index) => (
                  <Menu.Item key={index}>{item.title}</Menu.Item>
                ))}
              </Menu>
            }
            placement="bottomRight"
            overlayClassName={style.filterOverlay}
          >
            <span className={style.filterIconWrap}>
              <FilterIcon />
            </span>
          </Dropdown>
        </div>
        <div className={style.itemNum}>{item.num}</div>
        {item.subtitle && (
          <div>
            {item.subtitle}:<span className={style.itemSubnum}>{percentage}%</span>
          </div>
        )}
      </div>
      {guardString(item.url) && actionComp()}
    </div>
  );
};

export const StatisticItem = (props: {
  data: StatItemData | Array<StatItemData>;
  icon?: ReactNode;
  style?: any;
  tooltip?: string;
  onKeyChange?: (key: string) => void;
}) => {
  const { data, ...restProps } = props;
  if (Array.isArray(props.data)) {
    return <StatisticItemWithDropdown data={data as Array<StatItemData>} {...restProps} />;
  }
  return <StatisticItemNormal data={data as StatItemData} {...restProps} />;
};
