import React, { useEffect, useState, useImperativeHandle } from 'react';
import { Input } from 'antd';
import Styles from './corp-verify-code.module.scss';
import { apiHolder as api, apis, LoginApi } from 'api';
import { getIn18Text } from 'api';
const loginApi = api.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
interface VefifyProps {
  accountName: string;
  accountDomain: string;
  sid: string;
  onChange: (val: string) => void;
  onVerifyCodeLoadError: () => void;
  maxLength?: number;
}
export interface VerifyComponentType {
  refreshVerifyImgCode(): void;
}
function getVerifyCodeUrl(accountName: string, accountDomain: string, sid: string): string {
  return loginApi.getVerifyCodeUrl(accountName, accountDomain, sid);
}
const VerifyCode = React.forwardRef<VerifyComponentType, VefifyProps>(({ accountName, accountDomain, sid, onChange, onVerifyCodeLoadError }, ref) => {
  //时间戳
  let [verifyCodeUrl, setVerifyCodeUrl] = useState<string>();
  useEffect(() => {
    updateVerifyCode();
  }, [accountName, accountDomain, sid]);
  const updateVerifyCode = () => {
    if (accountName && accountDomain && sid) {
      let newVerifyCodeUrl = getVerifyCodeUrl(accountName, accountDomain, sid);
      setVerifyCodeUrl(newVerifyCodeUrl);
    }
  };
  useImperativeHandle(ref, () => {
    return {
      refreshVerifyImgCode() {
        updateVerifyCode();
      },
    };
  });
  const handleVerifyCodeError = () => {
    onVerifyCodeLoadError();
  };
  return (
    <div>
      <Input
        onChange={ev => {
          onChange && onChange(ev.target.value as string);
        }}
        placeholder={getIn18Text('QINGSHURUYANZHENG')}
        suffix={
          <img
            alt={getIn18Text('YANZHENGMA')}
            title={getIn18Text('DIANJISHUAXINYAN')}
            className={Styles.corpVerifyCode}
            onError={handleVerifyCodeError}
            src={verifyCodeUrl}
            onClick={updateVerifyCode}
          />
        }
      />
    </div>
  );
});
export default VerifyCode;
