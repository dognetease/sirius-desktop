import { Select } from 'antd';
import { apiHolder, apis, EdmCustomsApi } from 'api';
import React, { useEffect, useState } from 'react';
import { useDebounce } from 'react-use';
import { getIn18Text } from 'api';
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

const Option = Select.Option;

export interface OptionProp {
  label: string;
  to: string;
  gptValue: string;
}

export const defaultOptions = [
  {
    label: getIn18Text('YINGYUU'),
    to: 'en',
    gptValue: '英语',
  },
  {
    label: getIn18Text('XIBANYAYU'),
    to: 'es',
    gptValue: '西班牙语',
  },
  {
    label: getIn18Text('EYU'),
    to: 'ru',
    gptValue: '俄语',
  },
  {
    label: getIn18Text('FAYU'),
    to: 'fr',
    gptValue: '法语',
  },
  {
    label: getIn18Text('PUTAOYAYU'),
    to: 'pt',
    gptValue: '葡萄牙语',
  },
  {
    label: getIn18Text('YUENANYU'),
    to: 'vi',
    gptValue: '越南语',
  },
];

const useLangOption = (query: string = '', enable: boolean = true, addOptions: OptionProp[] = []) => {
  const [options, setOptions] = useState<Array<{ label: string; value: string; labelDisplay: string; gptValue: string }>>(
    defaultOptions.concat(addOptions).map(e => ({ label: e.label, value: e.to, labelDisplay: e.label, gptValue: e.gptValue }))
  );
  useDebounce(
    () => {
      if (query && enable) {
        Promise.all(
          defaultOptions.concat(addOptions).map(e => {
            return edmCustomsApi
              .chromeTranslate({
                q: query,
                from: 'auto',
                to: e.to,
              })
              .then(r => {
                const result = r.translation && r.translation.length ? r.translation[0] : '';
                return {
                  labelDisplay: e.label + (result ? `[${result}]` : ''),
                  value: e.to,
                  label: e.label,
                  gptValue: e.gptValue,
                };
              });
          })
        ).then(setOptions);
      }
    },
    2000,
    [query, enable]
  );

  return options;
};

export default useLangOption;
