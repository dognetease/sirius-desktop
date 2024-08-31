import React, { useEffect, useState } from 'react';
import { apiHolder, apis, FFMSApi } from 'api';
import { SelectModal, Props } from './selectModal';

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
export const PortSelect: React.FC<Props> = props => {
  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);

  async function getPorts() {
    const res = await ffmsApi.ffPortList();
    setOptions(
      (res || []).map(item => ({
        label: `${item.cnName} ${item.countryCnName} ${item.enName}`,
        value: item.code,
      }))
    );
  }

  useEffect(() => {
    getPorts();
  }, []);

  return (
    <div>
      <SelectModal {...props} options={options} />
    </div>
  );
};

export const SizeSelect: React.FC<Props> = props => {
  return (
    <div>
      <SelectModal {...props} options={[]} />
    </div>
  );
};
