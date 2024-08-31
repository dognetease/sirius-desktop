import React, { useState, useRef } from 'react';
import { Form } from 'antd';
import classnames from 'classnames';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
// import { Switch } from '@web-common/components/UI/Switch';
import Switch from '@lingxi-common-component/sirius-ui/Switch';
import { FormInstance } from 'antd/es/form/Form';
import { useMount, useLocalStorageState } from 'ahooks';
import { apiHolder, apis, FFMSApi, FFMSRate } from 'api';
import QuickTime, { DepartureDate } from './quickTime';
import style from './style.module.scss';

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
const FFMS_PORT_CODE = 'ffms-port-code-key';

interface Props {
  form: FormInstance<any>;
  submit: () => void;
  dataType?: 'draft';
}

const Search: React.FC<Props> = ({ form, submit, dataType }) => {
  const [portList, setPortList] = useState<FFMSRate.Option[]>([]);
  const [carrierList, setCarrierList] = useState<FFMSRate.Option[]>([]);
  const portRef = useRef<string[]>([]);
  const [localData, setLocalData] = useLocalStorageState<string[]>(FFMS_PORT_CODE);

  const onValuesChange = () => {
    submit();
  };
  const getPostList = () => {
    ffmsApi.ffPermissionsPortList().then(res => {
      const options = (res || []).map(item => ({
        label: `${item.enName} ${item.cnName} ${item.countryCnName}`,
        value: item.code,
      }));
      onChangeSort(options, localData || []);
    });
  };

  const getCarrierList = () => {
    ffmsApi.ffCarrierList().then(res => {
      setCarrierList(() =>
        (res || []).map(item => ({
          label: `${item.carrier} ${item.cnName}`,
          value: item.carrier,
        }))
      );
    });
  };
  useMount(() => {
    getPostList();
    getCarrierList();
  });

  const handleChange = (value: string[]) => {
    if (value?.length) {
      portRef.current = [...value, ...portRef.current].slice(0, 5);
    }
  };
  const onDropdownVisibleChange = (open: boolean) => {
    if (open) {
      portRef.current = [];
    } else if (portRef.current?.length) {
      setLocalData(portRef.current);
      onChangeSort(portList, portRef.current);
    }
  };

  const onChangeSort = (options: FFMSRate.Option[], localData: string[]) => {
    const searchList: FFMSRate.Option[] = [];
    const unSearchList: FFMSRate.Option[] = [];
    options.forEach(item => {
      if (localData.includes(item.value)) {
        searchList.push(item);
      } else {
        unSearchList.push(item);
      }
    });
    setPortList([...searchList, ...unSearchList]);
  };

  return (
    <Form form={form} onValuesChange={() => onValuesChange()} layout="inline" className={style.priceSearch}>
      {!dataType ? (
        <div className={classnames(style.line, style.split)}>
          <Form.Item name="searchPortList" label="港口">
            <EnhanceSelect
              onChange={handleChange}
              onDropdownVisibleChange={onDropdownVisibleChange}
              mode="multiple"
              size="large"
              maxTagCount="responsive"
              showSearch={!!true}
              optionFilterProp="label"
              options={portList}
              placeholder="请选择港口"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="searchCarrierList" label="船司">
            <EnhanceSelect
              mode="multiple"
              size="large"
              maxTagCount={1}
              showSearch={!!true}
              optionFilterProp="label"
              options={carrierList}
              placeholder="请选择船司"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="sailingDateScope" label="时间范围">
            <DepartureDate />
          </Form.Item>
        </div>
      ) : null}
      <div className={`${style.line} ${style.lastLine}`}>
        <Form.Item name="updateDateScope" label="更新时间">
          <QuickTime />
        </Form.Item>
        {!dataType ? (
          <Form.Item name="expireFreight" valuePropName="checked" label="含已过期">
            <Switch />
          </Form.Item>
        ) : null}
      </div>
    </Form>
  );
};

export default Search;
