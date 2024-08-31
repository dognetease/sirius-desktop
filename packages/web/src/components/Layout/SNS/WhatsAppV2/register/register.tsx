import { getIn18Text } from 'api';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { apiHolder, apis, WhatsAppApi } from 'api';
import { navigate, useLocation } from '@reach/router';
import { NoPermissionPage } from '@/components/UI/PrivilegeEnhance';
import { useWaContextV2 } from '../context/WaContextV2';
import { ReactComponent as LoadingIcon } from './loading.svg';
import querystring from 'querystring';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './register.module.scss';

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

interface RegisterProps {}

const NxRegisterUrl = 'https://www.nxcloud.com/integrator/#/register';
const LogoUrl = 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/08/21/588bca86eb124e428afbf34ac14ed357.png';

const Register: React.FC<RegisterProps> = props => {
  const location = useLocation();
  const { registrable, refreshOrgStatus, refreshAllotPhones } = useWaContextV2();
  const [loading, setLoading] = useState<boolean>(false);
  const [iframeSrc, setIframeSrc] = useState<string>('');
  const [iframeVisible, setIframeVisible] = useState<boolean>(false);
  const iframeHandler = useRef<((event: MessageEvent) => void) | null>(null);

  const qs = useMemo(() => {
    const query = location.hash.substring(1).split('?')[1];

    return query ? querystring.parse(query) : {};
  }, [location.hash]);

  const onIframeLoad = () => {
    setLoading(false);

    iframeHandler.current = (event: MessageEvent) => {
      if (event.data === 'closePage') {
        whatsAppApi.noticeRegisterFinishV2().then(() => {
          const webPageHandler = () =>
            Promise.all([refreshOrgStatus(), refreshAllotPhones()]).then(() => {
              navigate('#intelliMarketing?page=whatsAppMessage');
            });

          if (qs.from === 'electron') {
            Modal.success({
              title: qs.type === 'register' ? getIn18Text('ZHUCECHENGGONG') : getIn18Text('TIANJIACHENGGONG'),
              content: getIn18Text('QINGHUIDAOWAIMAOTONGZHUO'),
              okText: getIn18Text('WOZHIDAOLE'),
              cancelText: getIn18Text('JIXUSHIYONGWANGYEBAN'),
              onCancel: webPageHandler,
            });
          } else {
            webPageHandler();
          }
        });
      }
    };

    window.addEventListener('message', iframeHandler.current);
  };

  useEffect(() => {
    return () => {
      if (iframeHandler.current) {
        window.removeEventListener('message', iframeHandler.current);
      }
    };
  }, []);

  useEffect(() => {
    if (qs.page === 'whatsAppRegister') {
      setLoading(true);

      whatsAppApi.createAppV2().then(data => {
        const params = {
          token: data.token,
          appId: data.app_id,
          language: 'cn',
          imgurl: LogoUrl, // logo地址【https、尺寸:200*30】
          title:
            // WhatsApp集成商开放平台
            qs.type === 'register' ? getIn18Text('WAIMAOTONGWhat') : getIn18Text('WhatsApv16'),
          button:
            // 点击开始WhatsApp注册
            qs.type === 'register' ? getIn18Text('QUZHUCE') : getIn18Text('QUTIANJIA'),
          btncolor: '4c6aff',
        };

        const query = new URLSearchParams(params).toString();
        const src = `${NxRegisterUrl}?${query}`;

        setIframeSrc(src);
        setIframeVisible(true);
      });
    } else {
      setIframeSrc('');
      setIframeVisible(false);
    }
  }, [qs.page, qs.type]);

  if (!registrable) return <NoPermissionPage />;

  return (
    <div className={style.register}>
      {loading && <LoadingIcon className={style.loading} />}
      {iframeVisible && <iframe className={style.iframe} src={iframeSrc} onLoad={onIframeLoad} />}
    </div>
  );
};

export default Register;
