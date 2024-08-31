import { Button } from 'antd';
import { NativeButtonProps } from 'antd/lib/button/button';
import { api, apis, EdmCustomsApi } from 'api';
import React, { useEffect, useState } from 'react';
import { getIn18Text } from 'api';
const edmCustomsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

export const Desc: React.FC<{
  defaultDesc?: string;
  query: string;
  hasRcmd?: boolean;
}> = ({ defaultDesc = getIn18Text('ZANWUSHUJU'), query, hasRcmd }) => {
  const [desc, setDesc] = useState<string>(defaultDesc);
  useEffect(() => {
    edmCustomsApi.doGetHscodeItem(query).then(value => {
      if (!value) {
        setDesc(getIn18Text('ZANWUSHUJU'));
      } else if (query.length <= 2) {
        setDesc(`${getIn18Text('ZANWUSHUJU')}${hasRcmd ? '，您可尝试搜索下方推荐搜索词' : ''}`);
      }
    });
  }, [query]);
  return <span>{desc}</span>;
};

interface DescOpButtonProps extends NativeButtonProps {
  query: string;
  onSelectClick: (params: string) => void;
}

export const DescOpButton: React.FC<DescOpButtonProps> = ({ query, onClick, onSelectClick, ...rest }) => {
  const [hscode, setHscode] = useState<string>('');
  useEffect(() => {
    edmCustomsApi.doGetHscodeItem(query).then(value => {
      if (value) {
        if (query.length > 6) {
          setHscode(query.slice(0, 6));
        } else if (query.length > 4) {
          setHscode(query.slice(0, 4));
        } else if (query.length > 2) {
          setHscode(query.slice(0, 2));
        } else {
          setHscode('');
        }
      } else {
        setHscode('');
      }
    });
  }, [query]);
  if (!hscode) {
    return null;
  }
  return (
    <Button
      type="primary"
      onClick={() => {
        onSelectClick(hscode);
      }}
      {...rest}
    >
      {`搜索HSCode ${hscode}`}
    </Button>
  );
};
