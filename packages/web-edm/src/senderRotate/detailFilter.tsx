import React from 'react';
import { ProviderType, WarmUpData } from 'api';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
import style from './filter.module.scss';

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

interface Props {
  info: WarmUpData;
  onFilterChange?: (info: WarmUpData) => void;
  defaultDays?: number;
  defaultProvider?: ProviderType;
}

const DetailFilter = (props: Props) => {
  const { info, onFilterChange, defaultDays, defaultProvider } = props;

  return (
    <div className={style.select}>
      <EnhanceSelect
        className={style.item}
        options={timeOption}
        defaultValue={defaultDays || timeOption[0].value}
        placeholder={'日期'}
        onChange={(item: number) => {
          info.filterDate = item;
          onFilterChange && onFilterChange(info);
        }}
      />
      <EnhanceSelect
        className={style.item}
        options={serverOption}
        defaultValue={defaultProvider || serverOption[0].value}
        placeholder={'请选择服务商'}
        onChange={(item: ProviderType) => {
          info.filterProvider = item || ProviderType.All;
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

export default DetailFilter;
