import React, { useState, useEffect, useRef } from 'react';
import { api, apis, DataTrackerApi, EdmRoleApi } from 'api';
import { message } from 'antd';

const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const roleApi = api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;

interface WmKfEntryProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactElement;
  [propName: string]: any;
}

interface OrgConfType {
  orgId: string;
  corpId: number;
  corpName: string;
  domain: string;
}

export const WmKfEntry: React.FC<WmKfEntryProps> = props => {
  const { className, style, children, onClick, ...restProps } = props;

  // 保证作为 tooltip 子元素时, 正确透传 tooltip 的事件
  const onClickFromProps = onClick || (() => {});

  const qiyuLoading = useRef<boolean>(false);

  const [orgConf, setOrgConf] = useState<OrgConfType>({
    orgId: '',
    corpId: 0,
    corpName: '',
    domain: '',
  });

  const handleKfScriptLoad = () =>
    new Promise<void>((resolve, reject) => {
      if (window.ysf) return resolve();
      if (qiyuLoading.current) return reject();

      qiyuLoading.current = true;
      const script = document.createElement('script');
      script.src = 'https://qiyukf.com/script/abab5b9989e6f898240067f40874a096.js?hidden=1';
      script.onload = () => {
        qiyuLoading.current = false;
        if (window.ysf) {
          // 加载后，立即调用 config 方法
          window.ysf('config', {
            robotId: 5390874,
            referrer: 'https://khd.waimao.office.163.com/khd',
            title: '外贸通客户端',
            robotShuntSwitch: 1,
            groupid: 482281247,
            templateId: 6666111,
            qtype: 4491460,
            hidden: 1,
          });
          resolve();
        } else {
          reject();
        }
      };
      script.onerror = () => {
        qiyuLoading.current = false;
        reject();
      };
      document.body.appendChild(script);
    });

  const handleKf = () => {
    trackApi.track(process.env.BUILD_ISELECTRON ? 'client_customer_service' : 'web_customer_service');
    const name = '网易售后沟通X' + orgConf.corpId + orgConf.corpName + orgConf.domain;
    window.ysf('config', {
      robotId: 5390874,
      referrer: 'https://khd.waimao.office.163.com/khd',
      name: name || '网易售后沟通X3941499网易外贸测试waimao.elysys.net',
      title: '外贸通客户端',
      robotShuntSwitch: 1,
      groupid: 482281247,
      success: function () {
        // 成功回调
        console.log('succ');
        window?.ysf('open', {
          templateId: 6666111,
        });
      },
      error: function (err: any) {
        // 成功回调
        message.error(err);
        console.log(err);
      },
      templateId: 6666111,
      qtype: 4491460,
      hidden: 1,
    });
  };

  const handleClick = () => {
    trackApi.track('waimao_customer_service', { action: 'click' });
    handleKfScriptLoad().then(() => {
      handleKf();
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleKfScriptLoad();
    }, 30000);

    return () => timer && clearTimeout(timer);
  }, []);

  useEffect(() => {
    roleApi.getKfInfo().then(data => {
      setOrgConf(data);
    });
  }, []);

  return (
    <div
      className={className}
      style={style}
      onClick={event => {
        handleClick();
        onClickFromProps(event);
      }}
      {...restProps}
    >
      {children}
    </div>
  );
};
