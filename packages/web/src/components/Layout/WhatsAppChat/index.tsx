import React, { useState, useEffect, useRef } from 'react';
import { useDeepCompareEffect } from 'ahooks';
import { apiHolder, inWindow, CustomerDetail } from 'api';
import classnames from 'classnames';
import qs from 'querystring';
import { useLocation, navigate } from '@reach/router';
import { SiriusPageProps } from '@/components/Layout/model';
import { NoPermissionPage } from '@/components/UI/PrivilegeEnhance';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { showSetLabelModal } from '@lxunit/app-l2c-crm';
import { UniDrawerCustomerDetail, UniDrawerLeadsDetail } from '@/components/Layout/CustomsData/components/uniDrawer';
import { CustomerLeadRelationProps } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawerLeads';
import { goSalesPitchSetting } from '@/components/Layout/EnterpriseSetting/salesPitch/utils/util';
import useState2ReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import { makeStageUrl } from './utils';
import styles from './index.module.scss';

// const isProd = stage === 'prod';// ['prod', 'prev'].includes(stage);
// const isPrev = stage === 'prev';
const systemApi = apiHolder.api.getSystemApi();

type Source = 'waStranger' | 'waStrangerLeads' | 'waCustomer' | 'waLeads';
interface MessageData {
  command: string;
  isDrawerOpen?: boolean;
  detail?: any;
  source?: Source;
  create_type_relate_key?: string;
}
const WhatsAppChat: React.FC<{ style?: React.CSSProperties; qs?: Record<string, string> }> = props => {
  const location = useLocation();
  const params = props.qs || qs.parse(location.hash.split('?')[1]);
  const isWin = inWindow() && systemApi.isElectron() && !window.electronLib.env.isMac;
  const [pageParams, setPageParams] = useState<Record<string, string>>({});
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const iframeSrc = useRef<string>(makeStageUrl([], true, Object(props.qs || params)));
  const [iframeUrl, setIframeUrl] = useState(''); // 触发 iframe 强制刷新
  const [detail, setDetail] = useState<CustomerDetail>();
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);
  const [isClueDrawerOpen, setIsClueDrawerOpen] = useState(false);
  const [source, setSource] = useState<Source>('waCustomer');
  const [relationParams, setRelationParams] = useState<CustomerLeadRelationProps>({});

  const [, setActiveScene] = useState2ReduxMock('activeScene');
  const [, setDrawerType] = useState2ReduxMock('drawerType');
  const [drawerVisible, setDrawerVisible] = useState2ReduxMock('drawerVisible');
  const [, setDrawerDataId] = useState2ReduxMock('drawerDataId');
  const lastDrawerVisibleRef = useRef<boolean>(false);
  const hasContactGroupPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'WHATSAPP_PERSONAL_MANAGE', 'GROUP'));
  // const hasWorkloadStatsPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'WHATSAPP_PERSONAL_MANAGE', 'WA_WORK_STAT'));
  let noPermission = false;

  useEffect(() => {
    iframeSrc.current = makeStageUrl([], true, Object.assign({}, props.qs, pageParams)) + '&time=' + Date.now();
    setIframeUrl(iframeSrc.current);
  }, [pageParams, props.qs]);
  // 当话术库编辑框关闭时, 通知 wa iframe 内部刷新对应数据
  useEffect(() => {
    if (lastDrawerVisibleRef.current && !drawerVisible) {
      iframeRef.current?.contentWindow?.postMessage(
        {
          command: 'salesPitchRefresh',
        },
        '*'
      );
    }
    lastDrawerVisibleRef.current = drawerVisible;
  }, [drawerVisible]);

  const handleEditCompanyCallback = (id?: number) => {
    let data: any = {};
    if (source === 'waStranger') {
      data.company_id = id;
    }
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        {
          command: 'createCustomerSuccess',
          ...data,
        },
        '*'
      );
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data: MessageData = event.data;
      // if (event.origin !== origin) {
      //   console.warn('unregonized message, sourceOrigin', event.origin, 'expect origin', origin);
      //   return;
      // }
      switch (data.command) {
        case 'toggleDrawer': {
          if (data?.detail) {
            setDetail(data.detail);
          }
          if (data?.source) {
            if (data.source === 'waCustomer' || data.source === 'waStranger') {
              setIsCustomerDrawerOpen(data.isDrawerOpen || false);
            }
            if (data.source === 'waLeads' || data.source === 'waStrangerLeads') {
              setIsClueDrawerOpen(data.isDrawerOpen || false);
            }
            // 将陌生人建为线索也归类到 waStranger 中
            if (data.source === 'waStrangerLeads') {
              data.source = 'waStranger';
            }
            setSource(data.source);
          }
          if (data?.create_type_relate_key) {
            // @ts-ignore
            setRelationParams({ create_type_relate_key: data.create_type_relate_key });
          }
          break;
        }
        case 'showSetLabelModal': {
          if (data.detail.companyId) {
            showSetLabelModal(data.detail?.companyId as string, data.detail.labelNames, handleEditCompanyCallback);
          }
          break;
        }
        case 'previewSnapshot': {
          // 往来邮件预览
          if (data.detail?.previewLink) {
            const { previewLink } = data.detail;
            if (systemApi.isElectron()) {
              systemApi.createWindowWithInitData('iframePreview', {
                eventName: 'initPage',
                eventData: {
                  iframeSrc: previewLink,
                },
              });
            } else {
              window.open(previewLink);
            }
          }
          break;
        }
        case 'salesPitchSetting': {
          goSalesPitchSetting();
          break;
        }
        case 'salesPitchCreate': {
          goSalesPitchSetting();
          setActiveScene('settingBoard');
          setDrawerType('ADD');
          setDrawerVisible(true);
          setDrawerDataId('');
          break;
        }
        case 'createNewShare': {
          navigate('#wa?page=materielShareEdit');
          break;
        }
        // 改变页面路由
        case 'changePageRoute':
          setPageParams(Object(data));
          navigate('#wa?page=waChatList');
          break;
        default:
          console.log(data.command);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  if (params?.page === 'contactGroup') {
    if (!hasContactGroupPermisson) {
      noPermission = true;
    }
  }
  // if (params?.page === 'workloadStats') {
  //   if (!hasWorkloadStatsPermisson) {
  //     noPermission = true;
  //   }
  // }
  if (noPermission) {
    return <NoPermissionPage />;
  }
  console.log('qqq', iframeSrc.current);
  return (
    <div
      className={styles.waChatContainer}
      style={{ marginTop: isWin ? 32 : 0, height: isWin ? 'calc(100% - 32px)' : '100%', overflow: 'hidden', ...(props.style || {}) }}
    >
      <iframe ref={iframeRef} key={iframeUrl} className={classnames(styles.waChatIframe)} src={iframeSrc.current} title="preview" width="100%" height="100%" />
      <UniDrawerCustomerDetail
        visible={isCustomerDrawerOpen}
        customerId={detail?.company_id as any}
        customerData={detail as any}
        source={source as any}
        relationParams={relationParams as any}
        onSuccess={() => handleEditCompanyCallback()}
        onClose={() => {
          setIsCustomerDrawerOpen(false);
          handleEditCompanyCallback();
        }}
      />
      <UniDrawerLeadsDetail
        visible={isClueDrawerOpen}
        leadsId={detail?.clue_id as any}
        contactList={detail?.contact_list || ([] as any)}
        detailData={detail as any}
        source={source as any}
        relationParams={relationParams as any}
        onSuccess={() => handleEditCompanyCallback()}
        onClose={() => {
          setIsClueDrawerOpen(false);
          handleEditCompanyCallback();
        }}
      />
    </div>
  );
};

export default WhatsAppChat;
