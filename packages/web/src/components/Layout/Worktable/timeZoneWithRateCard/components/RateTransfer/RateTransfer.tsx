import { WorkbenchCurrencyListItem } from '@/../../api/src';
import { getTransText } from '@/components/util/translate';
import { Dropdown, Select } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import DropDownIcon from '../../../icons/DropDown';
import { workTableTrackAction } from '../../../worktableUtils';
import styles from './RateTransfer.module.scss';
import commonStyles from '../../common.module.scss';

const RateTransfer: React.FC<{
  currencyList: WorkbenchCurrencyListItem[];
  currencyValue: WorkbenchCurrencyListItem;
  rate: string;
  rateTime: string;
  handleDropDownVisibleChange: (open: boolean) => void;
  handleCurrencyChange: (currencyName: string, currencyCode: string) => void;
}> = props => {
  const { currencyList, currencyValue } = props;
  const [leftCurrencyList, setLeftCurrencyList] = useState<WorkbenchCurrencyListItem[]>([]);
  const [visibleLeftMenu, setVisibleLeftMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftCurrValue, setLeftCurrValue] = useState<WorkbenchCurrencyListItem>({ currencyCnName: '', currencyCode: '' });

  const handleSelectChange = (params: { label: string; value: string }) => {
    if (params.value === currencyValue.currencyCode) {
      return;
    }
    workTableTrackAction('waimao_worktable_worldtime', 'currency_choice');
    props.handleCurrencyChange(params.label, params.value);
  };

  useEffect(() => {
    setLeftCurrencyList([
      {
        currencyCnName: getTransText('RENMINBI'),
        currencyCode: 'CNY',
      },
    ]);

    setLeftCurrValue({
      currencyCnName: getTransText('RENMINBI'),
      currencyCode: 'CNY',
    });
  }, []);
  return (
    <div className={styles.rateTransferCont} ref={containerRef}>
      <div className={styles.rateSelectGroup}>
        <Select
          value={{ label: currencyValue.currencyCnName, value: currencyValue.currencyCode }}
          onChange={handleSelectChange}
          className={commonStyles.dropDownSelectCommon}
          suffixIcon={<DropDownIcon />}
          bordered={false}
          labelInValue={true}
          getPopupContainer={() => containerRef.current?.parentElement?.parentElement?.parentElement as unknown as HTMLDivElement}
          onDropdownVisibleChange={props.handleDropDownVisibleChange}
        >
          {currencyList.map(item => {
            return (
              <Select.Option value={item.currencyCode}>
                {item.currencyCnName}（{item.currencyCode}）
              </Select.Option>
            );
          })}
        </Select>

        <Dropdown
          visible={visibleLeftMenu}
          trigger={['click']}
          overlay={
            <div onMouseLeave={() => setVisibleLeftMenu(false)}>
              {/* <DropDownSelectMenus list={leftCurrencyList.map(item => { return {label: item.currencyCnName, value: item.currencyCode} })}
                handleChange={handleSelectChange('left')}
              /> */}
            </div>
          }
        >
          <a
            className={styles.dropDownLink}
            onClick={e => {
              e.preventDefault();
              // setVisibleLeftMenu(true)
            }}
            style={{ marginLeft: 14, cursor: 'default', width: 100 }}
          >
            <span style={{ marginRight: 10, fontSize: 12 }}>
              {leftCurrValue.currencyCnName}（{leftCurrValue.currencyCode}）
            </span>
            {/* <DropDownIcon/> */}
          </a>
        </Dropdown>
      </div>
      <div className={styles.currencyTransferInfo}>
        <span>100</span>
        <span style={{ marginLeft: 20, marginRight: 20 }}>=</span>
        <span>{props.rate || '-'}</span>
        <span>{getTransText('SHISHIHUILV')}</span>
      </div>
      <div className={styles.footerTip}>
        {getTransText('GONGSIZHIXINGHUILV')}: {getTransText('SHISHIHUILV')}
      </div>
    </div>
  );
};

export default RateTransfer;
