import React, { useState, useContext, useEffect } from 'react';
import { Checkbox } from 'antd';
// import { FormattedMessage } from 'react-intl';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { CheckboxValueType, CheckboxOptionType } from 'antd/es/checkbox/Group';
import { FFMSApi, apiHolder, apis } from 'api';
import { SearchDispatchContext, Action, SearchContext } from '../searchProvider';
import style from './style.module.scss';

const CheckboxGroup = Checkbox.Group;
const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
export const ShipMaster: React.FC = () => {
  const dispatch = useContext(SearchDispatchContext);
  const { searchState } = useContext(SearchContext);

  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(false);
  const [plainOptions, setplainOptions] = useState<CheckboxOptionType[]>([]);

  const onChange = (searchCarrierList: CheckboxValueType[]) => {
    dispatch({ type: Action.UpdateSearch, payload: { searchCarrierList: searchCarrierList as string[] } });
    setIndeterminate(!!searchCarrierList.length && searchCarrierList.length < plainOptions.length);
    setCheckAll(searchCarrierList.length === plainOptions.length);
  };

  const onCheckAllChange = (e: CheckboxChangeEvent) => {
    const searchCarrierList = e.target.checked ? plainOptions.map(item => item.value as string) : [];
    dispatch({ type: Action.UpdateSearch, payload: { searchCarrierList } });
    setIndeterminate(false);
    setCheckAll(e.target.checked);
  };

  async function getCheckOptions() {
    const carriers = await ffmsApi.ffCarrierList();
    setplainOptions(
      carriers.map(item => ({
        label: (
          <div className={style.checkItem}>
            {item.carrier} {item.cnName}
          </div>
        ),
        value: item.carrier,
      }))
    );
  }

  useEffect(() => {
    getCheckOptions();
  }, []);

  return (
    <div className={style.shipMaster}>
      <div className={style.tip}>指定船司筛选运价信息</div>
      <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
        全选
      </Checkbox>
      <div>
        <CheckboxGroup options={plainOptions} value={searchState.searchCarrierList} onChange={onChange} />
      </div>
    </div>
  );
};
