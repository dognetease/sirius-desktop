import React, { useEffect, useCallback, useMemo } from 'react';
import { Checkbox } from 'antd';
import debounce from 'lodash/debounce';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { SalesPitchConfig } from 'api';

import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { salesPitchRequest as request } from '@web-common/state/reducer/salesPitchReducer/request';
import useState2ReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import { getIn18Text } from 'api';

const SalesPitchConfigCheckbox = () => {
  const [config, setConfig] = useState2ReduxMock('config');
  const checked = useMemo(() => !config.showEnterprise, [config.showEnterprise]);

  const requestDebounce = useCallback(
    debounce((newConfig: SalesPitchConfig) => {
      request
        .setSalesPitchConfig(newConfig)
        .then(success => {
          if (!success) {
            setConfig({
              showEnterprise: !newConfig.showEnterprise,
            });
            Toast.error(getIn18Text('QINGQIUSHIBAI')).then();
          } else {
            request.setLocalSalesPitchConfig(config).then();
          }
        })
        .catch(err => {
          setConfig({
            showEnterprise: !newConfig.showEnterprise,
          });
          Toast.error(err.message || getIn18Text('QINGQIUSHIBAI')).then();
        });
    }, 500),
    []
  );

  const onChange = (e: CheckboxChangeEvent) => {
    const newConfig = { showEnterprise: !e.target.checked };
    setConfig(newConfig);
    requestDebounce(newConfig);
  };

  return (
    <Checkbox checked={checked} onChange={onChange}>
      {getIn18Text('YINGCANGGONGSIHUASHUKU')}
    </Checkbox>
  );
};

export default SalesPitchConfigCheckbox;
