import React, { useEffect, useState } from 'react';
import { apiHolder, ContactApi } from 'api';
const contactApi = apiHolder.api.requireLogicalApi('contactApi') as ContactApi;
import { cloneDeep } from 'lodash';
interface optionProps {
  value: string;
  label: string;
}

const UseGetManager = (condition: string) => {
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [managerOptions, setManagerOptions] = useState<optionProps[]>([]);

  useEffect(() => {
    if (contactIds && contactIds.length) {
      contactApi.doGetContactById(contactIds).then(res => {
        console.log('res-contact-list', res);
        const list = res.map(item => {
          const { id, contactName } = item.contact;
          return {
            value: id,
            label: `${contactName}`, // (${accountName})
          };
        });
        // 默认截取前两百个数据
        setManagerOptions(cloneDeep(list.slice(0, 200)));
      });
    }
  }, [contactIds]);
  return {
    managerOptions,
    setContactIds,
  };
};

export default UseGetManager;
