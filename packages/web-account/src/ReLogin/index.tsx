import { getIn18Text } from 'api';
import React, { useEffect, useState } from 'react';
import { navigate } from 'gatsby';
import { Input, Button, Modal } from 'antd';
import InfoCircleFilled from '@ant-design/icons/InfoCircleFilled';
import { apiHolder as api, LoginApi, SystemApi, apis } from 'api';
import CloseSvg from '@web-common/components/UI/Icons/svgs/CloseSvg';
import './index.scss';

export interface ReLoginProps {
  isModalVisible?: boolean;
  onCancel?: Function;
}

const ReLogin: React.FC<ReLoginProps> = ({ isModalVisible, onCancel }) => {
  const [password, setPwd] = useState<string>();

  const [warning, setWarning] = useState<string>('');

  const [email, setEmail] = useState<string>();

  const loginApi = api.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;

  const systemApi = api.api.getSystemApi() as SystemApi;

  const onClickCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const outLogin = () => {
    loginApi.doLogout().then(() => {
      navigate('/login', { state: { email } });
    });
  };

  const onLogin = () => {
    if (!password) {
      setWarning(getIn18Text('QINGSHURUMIMA'));
    } else if (!email) {
      setWarning(getIn18Text('QINGSHURUZHANGHAO'));
    } else {
      loginApi.doLogin({ account: email, pwd: password }).then(value => {
        if (value.errmsg) {
          // 有错误提示
          setWarning(value.errmsg);
        } else if (onCancel) {
          onCancel();
        }
      });
    }
  };

  const onFocusInput = () => {
    setWarning('');
  };

  useEffect(() => {
    const value = systemApi.getCurrentUser();
    value && setEmail(value.id);
  }, []);

  return (
    <div>
      <Modal
        wrapClassName="u-login-window"
        visible={isModalVisible}
        centered
        width="480px"
        bodyStyle={{ padding: '24px 40px' }}
        onCancel={onClickCancel}
        closeIcon={<CloseSvg />}
        footer={[
          <div key="warn" className="u-foot-warning">
            {warning ? <InfoCircleFilled style={{ color: '#F74F4F', marginRight: '9px' }} /> : ''}
            {warning}
          </div>,
          <Button key="cancel" className="u-middle-btn" onClick={outLogin}>
            {getIn18Text('TUICHU')}
          </Button>,
          <Button key="confirm" type="primary" className="u-middle-btn" onClick={onLogin}>
            {getIn18Text('QUEDING')}
          </Button>,
        ]}
      >
        <div className="u-login-title">{getIn18Text('DENGLUZHUANGTAISHIXIAO，')}</div>
        <div className="u-login-user">
          {getIn18Text('YONGHUMING：')}
          {email}
        </div>
        <div className="u-input">
          <Input.Password
            onFocus={onFocusInput}
            placeholder={getIn18Text('QINGSHURUMIMA')}
            allowClear
            onChange={e => {
              setPwd(e.target.value);
            }}
            autoComplete="new-password"
          />
        </div>
      </Modal>
    </div>
  );
};

export default ReLogin;
