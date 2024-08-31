import React, { ChangeEvent, CSSProperties, useCallback, useState } from 'react';
import { Input } from 'antd';
import debounce from 'lodash/debounce';
import SearchOutlined from '@ant-design/icons/SearchOutlined';

import { useAppDispatch } from '@web-common/state/createStore';
import { SalesPitchThunks } from '@web-common/state/reducer/salesPitchReducer/thunk';
import { SearchSalesPitchParams } from 'api';
import useState2ReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import { getIn18Text } from 'api';

interface SalesPitchConfigProps {
  style?: CSSProperties;
}

const SalesPitchSearch: React.FC<SalesPitchConfigProps> = ({ style }) => {
  const dispatch = useAppDispatch();

  const [, setSearchInput] = useState2ReduxMock('searchInput');

  const [inputValue, setInputValue] = useState('');

  const onSearchReqDebounce = useCallback(
    debounce((queryKey: string) => {
      setSearchInput(queryKey);
      if (queryKey) {
        const params: SearchSalesPitchParams = {
          queryKey,
        };
        dispatch(SalesPitchThunks.searchSalesPitch(params));
      }
    }, 500),
    []
  );

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    const currentValue = event.target.value.trim();
    onSearchReqDebounce(currentValue);
  };

  return (
    <Input
      value={inputValue}
      placeholder={getIn18Text('SOUSUOHUASHU')}
      allowClear
      maxLength={100}
      style={style || { width: 296, margin: '0 20px' }}
      prefix={<SearchOutlined />}
      onChange={onChange}
    />
  );
};

export default SalesPitchSearch;
