import React, { useState, useEffect } from 'react';
import { Skeleton, Button } from 'antd';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import { ColumnsType } from 'antd/lib/table';
import { apis, apiHolder, WhatsAppApi, WhatsAppPhoneV2 } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import BlankImg from '../../../../images/blank.png';
import { ReactComponent as WhatsAppSvg } from '../../../../images/whats-app.svg';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { WaRegisterModal } from '../../SNS/BizWhatsApp/WaRegisterModal';
import { BizWaAllotV2 } from './BizWaAllotV2';
import { useWaContextV2 } from '../../SNS/WhatsAppV2/context/WaContextV2';
import { handleRegisterStart } from '../../SNS/WhatsAppV2/utils';
import style from './insertWhatsApp.module.scss';

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

export const BizWhatsAppV2 = () => {
  const { allotable, registrable, refreshAllotPhones } = useWaContextV2();
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<WhatsAppPhoneV2[]>([]);
  const [registerVisible, setRegisterVisible] = useState<boolean>(false);
  const [allotVisible, setAllotVisible] = useState<boolean>(false);
  const [allotPhone, setAllotPhone] = useState<string | null>(null);

  const columns: ColumnsType<WhatsAppPhoneV2> = [
    {
      title: typeof window !== 'undefined' ? window.getLocalLabel('MINGCHENG') : '',
      dataIndex: 'verified_name',
    },
    {
      title: typeof window !== 'undefined' ? window.getLocalLabel('WhatsApp BusinessSHOUJIHAO') : '',
      dataIndex: 'phone',
    },
    {
      title: typeof window !== 'undefined' ? window.getLocalLabel('BANGDINGSHIJIAN') : '',
      dataIndex: 'createTime',
    },
    {
      title: '使用人数',
      dataIndex: 'allotNum',
    },
    {
      title: typeof window !== 'undefined' ? window.getLocalLabel('BANGDINGREN') : '',
      dataIndex: 'createBy',
    },
    {
      title: typeof window !== 'undefined' ? window.getLocalLabel('CAOZUO') : '',
      dataIndex: 'action',
      fixed: 'right',
      render: (_, item) =>
        allotable && (
          <a
            className={style.btn}
            onClick={() => {
              setAllotVisible(true);
              setAllotPhone(item.phone);
            }}
          >
            管理人员
          </a>
        ),
    },
  ];

  const handleDataFetch = () => {
    setLoading(true);

    whatsAppApi.getManagerPhones({ page: 1, pageSize: 100 }).then(res => {
      setData(res.content || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    handleDataFetch();
  }, []);

  return (
    <PermissionCheckPage resourceLabel="WHATSAPP_BUSINESS_ACCOUNT" accessLabel="VIEW" menu="ORG_SETTINGS_PEER_SETTING">
      <div className={style.pageContainer}>
        <h3 className={style.pageTitle}>
          <span>{typeof window !== 'undefined' ? window.getLocalLabel('WhatsAppDUIJIE') : ''}</span>
          {registrable &&
            (!data.length ? (
              <Button type="primary" className={style.addBtn} onClick={() => setRegisterVisible(true)}>
                注册账号
              </Button>
            ) : (
              <Button
                type="primary"
                className={style.addBtn}
                onClick={() =>
                  handleRegisterStart('add_phone', () => {
                    handleDataFetch();
                    refreshAllotPhones();
                  })
                }
              >
                添加号码
              </Button>
            ))}
        </h3>
        <section className={style.introduction}>
          <WhatsAppSvg />
          <div className={style.content}>
            <p>
              {typeof window !== 'undefined'
                ? window.getLocalLabel('DUIJIEHOU\uFF0CNINKEYIZAIWANGYIWAIMAOYOUSHANGTONGGUO WhatsApp JINXINGKEHUSHOUQIANGOUTONG\uFF0CLAOKEWEIXI\uFF0CSHOUHOUFUWUDENG')
                : ''}
            </p>
            <ul>
              <li>{typeof window !== 'undefined' ? window.getLocalLabel('-XUZHUCE Facebook Business Manager ZHANGHUBINGRENZHENG') : ''}</li>
              <li>{typeof window !== 'undefined' ? window.getLocalLabel('-XUZHUCE WhatsApp Business ZHANGHUBINGRENZHENG') : ''}</li>
            </ul>
          </div>
        </section>
        <Skeleton loading={loading} active>
          {data.length > 0 && <Table className={style.table} columns={columns} dataSource={data} rowKey="id" pagination={false} />}
          {data.length === 0 && (
            <div style={{ margin: '170px auto', textAlign: 'center' }}>
              <img style={{ width: 160, height: 160 }} src={BlankImg} alt={typeof window !== 'undefined' ? window.getLocalLabel('LIEBIAOWEIKONG') : ''} />
              {registrable ? (
                <div style={{ margin: '16px auto', color: '#47484C', lineHeight: '22px' }}>
                  <div>
                    {typeof window !== 'undefined' ? window.getLocalLabel('ZANWEIBANGDING\uFF0CDIANJI') : ''}
                    <Button type="link" className={style.addBtnText} onClick={() => setRegisterVisible(true)}>
                      注册账号
                    </Button>
                  </div>
                  <div>{typeof window !== 'undefined' ? window.getLocalLabel('KUAISUCHUANGJIANWhatsApp DUIJIE') : ''}</div>
                </div>
              ) : (
                <div style={{ margin: '16px auto', color: '#47484C', lineHeight: '22px' }}>暂无数据</div>
              )}
            </div>
          )}
        </Skeleton>
      </div>
      <WaRegisterModal
        visible={registerVisible}
        onCancel={() => setRegisterVisible(false)}
        onFinish={() => {
          setRegisterVisible(false);
          handleDataFetch();
          refreshAllotPhones();
        }}
      />
      <BizWaAllotV2
        visible={allotVisible}
        phone={allotPhone}
        onCancel={() => {
          setAllotVisible(false);
          setAllotPhone(null);
        }}
        onFinish={() => {
          setAllotVisible(false);
          setAllotPhone(null);
          handleDataFetch();
        }}
      />
    </PermissionCheckPage>
  );
};
