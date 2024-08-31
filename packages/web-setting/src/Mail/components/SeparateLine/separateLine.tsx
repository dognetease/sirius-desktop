import React, { useEffect, useState, useCallback } from 'react';
import { Select } from 'antd';
import { apiHolder as api, DataStoreApi, getIn18Text } from 'api';
import classnamesBind from 'classnames/bind';
import styles from '../../index.module.scss';
import TriangleDownIcon from '@web-common/components/UI/Icons/svgs/TriangleDown';
import { ANCHOR_ID_MAP } from '../MailSetting/DefaultMailSettingConfig';
const storeApi: DataStoreApi = api.api.getDataStoreApi();
const realStyle = classnamesBind.bind(styles);
const { Option } = Select;

const SeparateLine: React.FC<any> = () => {
  const [defaultSeparateLine, setDefaultSeparateLine] = useState(0);

  const handleSeparateLineSelectChange = useCallback(
    val => {
      setDefaultSeparateLine(val);
      storeApi.putSync('defaultSeparateLine', String(val));
    },
    [setDefaultSeparateLine]
  );

  useEffect(() => {
    const defaultSeparateLine = storeApi.getSync('defaultSeparateLine').data || '0';
    setDefaultSeparateLine(Number(defaultSeparateLine));
  }, [setDefaultSeparateLine]);

  return (
    <>
      {/* 回复 转发邮件时引文是否带分割线 */}
      <div className={realStyle('configModuleItem')}>
        <div id={ANCHOR_ID_MAP.COMMON_REPLY_DIVIDER} className={realStyle('configModuleItemTitle')}>
          {getIn18Text('HUIFU/ZHUANFAYJSYWSFDFGX')}
        </div>
        <Select value={defaultSeparateLine} dropdownClassName={styles.selectDropdown} suffixIcon={<TriangleDownIcon />} onChange={handleSeparateLineSelectChange}>
          <Option value={1}>{getIn18Text('DAIFENGEXIAN')}</Option>
          <Option value={0}>{getIn18Text('BUDAIFENGEXIAN')}</Option>
        </Select>
      </div>
    </>
  );
};

export default SeparateLine;
