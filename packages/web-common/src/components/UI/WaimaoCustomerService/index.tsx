import React, { useState } from 'react';
import { apiHolder, apis, SystemApi, EdmSendBoxApi } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

interface WaimaoCustomerServiceProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactChild;
}

const WaimaoCustomerService: React.FC<WaimaoCustomerServiceProps> = props => {
  const { className, style, children } = props;

  const [fetching, setFetching] = useState<boolean>(false);

  const handleClick = () => {
    if (fetching) return;

    const mail = systemApi.getCurrentUser()?.id as string;

    const serviceDataMap: Record<string, string | number> = {
      邮箱: mail,
      外贸通客户端版本: window.siriusVersion,
    };

    Promise.all([edmApi.getSendCount(), edmApi.getFilterCount()])
      .then(([edmSendCount, edmFilterCount]) => {
        Object.assign(serviceDataMap, {
          购买的套餐: '',
          '流量包剩余（个人）': edmSendCount.availableSendCount,
          '流量包剩余（企业）': edmSendCount.orgAvailableSendCount,
          '过滤量剩余（个人）': edmFilterCount.dayLeft,
          '过滤量剩余（企业）': edmFilterCount.totalLeft,
        });
      })
      .catch(() => {
        Toast.error({ content: '营销配额查询失败' });
      })
      .finally(() => {
        setFetching(false);

        const serviceData = Object.entries(serviceDataMap).map(([key, value]) => ({ key, value, label: key }));
        const data = JSON.stringify(serviceData);

        const serviceUrl =
          'https://qiye163.qiyukf.com/client?k=abab5b9989e6f898240067f40874a096' +
          '&uid=' +
          mail +
          '&wp=1' +
          '&groupid=482172616' +
          '&robotShuntSwitch=1' +
          '&robotId=9091' +
          '&templateId=6627796' +
          '&qtype=4490123' +
          '&title=%E5%A4%96%E8%B4%B8%E9%80%9AAPP' +
          '&referrer=' +
          encodeURIComponent('https://waimao.163.com/waimaotongPC') +
          '&data=' +
          encodeURIComponent(data);

        systemApi.openNewWindow(serviceUrl);
      });
  };

  return (
    <span
      className={className}
      style={{
        cursor: 'pointer',
        ...style,
      }}
      onClick={handleClick}
    >
      {children}
    </span>
  );
};

WaimaoCustomerService.defaultProps = {
  children: getIn18Text('LIANXIKEFU'),
};

export default WaimaoCustomerService;
