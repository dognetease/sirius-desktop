import React, { useEffect, useMemo, useState } from 'react';
import style from '../globalSearch.module.scss';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';
import { Tooltip, Input } from 'antd';
import { ReactComponent as Help } from '@/images/icons/customs/help.svg';
import { ReactComponent as Reset } from '@/images/icons/globalSearch/reset.svg';
import { FilterParam, LangOptionsProp } from './search';
import { TongyongJiantou1Shang, TongyongJiantou1Xia, TongyongTianjia } from '@sirius/icons';
import { EnhanceSelect, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import classNames from 'classnames';
import { getIn18Text } from 'api';

export interface GlobalSearchFilterItemsProps {
  showInput: boolean;
  searchType: string;
  filterItemsValue: FilterParam;
  toggleFilter: (name: string, bl: boolean | string | string[], noReq?: string) => void;
  setShowInput: (bl: boolean) => void;
  resetFilter: () => void;
  langOptions: LangOptionsProp[];
  searchLoading: boolean;
}
export const GlobalSearchFilterItems = (props: GlobalSearchFilterItemsProps) => {
  const { searchType, filterItemsValue, toggleFilter, showInput, setShowInput, resetFilter, langOptions, searchLoading } = props;
  const ShowFilterInput = (
    <>
      <div className={style.globalFilter}>
        <span className={style.inputLable}>相关信息不包含</span>
        <Input
          maxLength={100}
          style={{ width: 'calc(100% - 106px)', maxWidth: 292 }}
          onPressEnter={e => toggleFilter('excludeValueList', (e.target as HTMLInputElement).value)}
          onChange={e => {
            toggleFilter('excludeValueList', e.target.value, 'noReq');
          }}
          value={filterItemsValue.excludeValueList}
          placeholder={'可输入产品描述不包含的词语，按回车确认'}
          allowClear
        />
      </div>
      <div className={style.globalFilter}>
        <span className={style.inputLable}>
          <span style={{ paddingRight: 4 }}>{getIn18Text('YUZHONG')}</span>
          <Tooltip placement="topLeft" title={'系统会按输入的关键词的原文进行搜索，可选择翻译成其他语种继续搜索'}>
            <Help />
          </Tooltip>
        </span>
        <EnhanceSelect
          mode="multiple"
          style={{ borderRadius: '2px', width: 'calc(100% - 106px)', maxWidth: 292 }}
          className={style.origin}
          optionLabelProp="label"
          maxTagCount="responsive"
          placeholder="请选择需要搜索的小语种"
          onChange={vl => {
            toggleFilter('otherGoodsShipped', vl);
          }}
          value={filterItemsValue.otherGoodsShipped}
          disabled={searchLoading}
        >
          {langOptions.map(lo => (
            <InMultiOption key={lo?.value} label={lo.label} value={lo?.value}>
              {lo?.labelDisplay}
            </InMultiOption>
          ))}
        </EnhanceSelect>
      </div>
    </>
  );
  return (
    <>
      <div className={style.filterContact}>
        <div className={style.filterGroup}>
          <div className={style.label}>{getIn18Text('SHAIXUAN')}</div>
          <div className={style.filterCheckBigBox}>
            <div className={style.filterCheckBox}>
              <Checkbox
                checked={filterItemsValue?.filterVisited}
                onChange={e => {
                  toggleFilter('filterVisited', e.target.checked);
                }}
              >
                {getIn18Text('WEILIULAN')}
              </Checkbox>
            </div>
            <div className={style.filterCheckBox}>
              <Checkbox
                checked={filterItemsValue?.hasMail}
                onChange={e => {
                  toggleFilter('hasMail', e.target.checked);
                }}
              >
                {getIn18Text('YOUYOUXIANG')}
              </Checkbox>
            </div>
            <div className={style.filterCheckBox}>
              <Checkbox
                checked={filterItemsValue?.notLogisticsCompany}
                onChange={e => {
                  toggleFilter('notLogisticsCompany', e.target.checked);
                }}
              >
                {getIn18Text('FEIWULIUGONGSI')}
              </Checkbox>
            </div>
            <div className={style.filterCheckBox}>
              <Checkbox
                checked={filterItemsValue?.hasCustomData}
                onChange={e => {
                  toggleFilter('hasCustomData', e.target.checked);
                }}
              >
                {getIn18Text('YOUHAIGUANSHUJU')}
              </Checkbox>
            </div>
            <div className={style.filterCheckBox}>
              <Checkbox
                checked={filterItemsValue?.hasWebsite}
                onChange={e => {
                  toggleFilter('hasWebsite', e.target.checked);
                }}
              >
                {getIn18Text('YOUGUANWANG')}
              </Checkbox>
            </div>
            <div className={style.filterCheckBox}>
              <Checkbox
                checked={filterItemsValue?.filterEdm}
                onChange={e => {
                  toggleFilter('filterEdm', e.target.checked);
                }}
              >
                {getIn18Text('WEIFASONGGUOYINGXIAOYOUJIAN')}
              </Checkbox>
            </div>
            <div className={style.filterCheckBox}>
              <Checkbox
                checked={filterItemsValue?.filterCustomer}
                onChange={e => {
                  toggleFilter('filterCustomer', e.target.checked);
                }}
              >
                <div className={style.filterCheckBoxFlex}>
                  {'未录入线索/客户'}
                  <Tooltip placement="top" title={'可过滤添加为线索/客户的公司，数据刷新可能存在一定的延迟'}>
                    <Help />
                  </Tooltip>
                </div>
              </Checkbox>
            </div>
          </div>
        </div>
        <div className={style.resetWrapper}>
          <span className={style.resetWrapper} onClick={resetFilter}>
            {getIn18Text('ZHONGZHI')}
            <span className={style.resetIcon}>
              <Reset />
            </span>
          </span>
          {searchType === 'product' && (
            <div className={style.showMore} onClick={() => setShowInput(!showInput)}>
              {!showInput ? (
                <div className={style.showText}>
                  {getIn18Text('GENGDUO')}
                  <span className={style.icon}>
                    <TongyongJiantou1Xia color="#4C6AFF" fontSize={16} />
                  </span>
                </div>
              ) : (
                <div className={style.showText}>
                  {getIn18Text('SHOUQI')}
                  <span className={style.icon}>
                    <TongyongJiantou1Shang color="#4C6AFF" fontSize={16} />
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showInput && searchType === 'product' && <div className={style.filterInput}>{ShowFilterInput}</div>}
    </>
  );
};
