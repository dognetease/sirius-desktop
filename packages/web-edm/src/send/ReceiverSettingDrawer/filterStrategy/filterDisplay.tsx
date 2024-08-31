import React, { useEffect, useState } from 'react';
import style from './filter.module.scss';
import { Filter } from './filter';
import { EdmSendBoxApi, FetchFilterConfigResp, apiHolder, apis, getIn18Text } from 'api';
import { Tooltip } from 'antd';
import cloneDeep from 'lodash/cloneDeep';
import { AbnormalTypeModel, FilterStrategy } from '../../validEmailAddress/util';
import { Skeleton } from '@web-disk/components/TemplateModal/components/Skeleton';
import { ReactComponent as RightArrow } from '@/images/icons/edm/yingxiao/right-arrow.svg';
import { edmDataTracker } from '../../../tracker/tracker';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export const FilterDisplay = () => {
  const [filterVisiable, setFilterVisiable] = useState(false);
  const [config, setConfig] = useState<FetchFilterConfigResp>();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const config = await edmApi.fetchFilterConfig();
      setConfig(config);
    } catch (e) {}
  };

  const subTitleForDisplay = () => {
    let tempData = cloneDeep(FilterStrategy);
    let tempKv: Record<string, AbnormalTypeModel> = {};

    tempData.forEach(item => {
      item.strategy?.forEach(i => {
        tempKv[i.value] = i;
      });
    });

    let fileNames = new Array<string>();
    config?.checkConfigs?.forEach(item => {
      let names = new Array<string>();
      item.filterItems.forEach(i => {
        if (i.code && i.status === 1 && tempKv[i.code]) {
          names.push(tempKv[i.code]?.label.replace('无效地址：', ''));
        }
      });
      // 如果是全部都选中态, 就只展示groupName
      if (names.length === item.filterItems.length) {
        names = [item.groupName || ''];
      }
      fileNames = fileNames.concat(names);
    });
    return fileNames.join('/') || '暂无选中规则...';
  };

  const ModalComp = () => {
    if (!config) {
      return undefined;
    }
    return (
      <Filter
        visible={filterVisiable}
        config={config}
        onCancel={() => {
          setFilterVisiable(false);
        }}
        onConfirm={config => {
          setConfig(config);
          setFilterVisiable(false);
        }}
      />
    );
  };
  if (!config) {
    <Skeleton />;
  }

  return (
    <div className={style.filterDisplayWrap}>
      <p className={style.filterDisplayTitle}>
        <span className={style.divider}></span>
        <span>{getIn18Text('SHEZHIGUOLVGUIZE')}：</span>
        <span className={style.tip}>（单次任务收件人超过1000暂不支持匹配CRM客户）</span>
      </p>
      <p
        className={style.button}
        onClick={() => {
          edmDataTracker.track('pc_markting_edm_filter_select', {
            action: 'change',
          });
          setFilterVisiable(true);
        }}
      >
        修改
        <RightArrow />
      </p>
      <div className={style.filterDisplay}>
        <div className={style.displayArea}>
          <Tooltip title={subTitleForDisplay()}>
            <div className={style.subTitle}>{subTitleForDisplay()}</div>
          </Tooltip>
        </div>
      </div>
      {filterVisiable && ModalComp()}
    </div>
  );
};
