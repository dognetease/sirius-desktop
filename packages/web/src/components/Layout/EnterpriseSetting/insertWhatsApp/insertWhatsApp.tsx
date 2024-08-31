import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Skeleton, Button, Switch, Tooltip } from 'antd';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import { ColumnsType } from 'antd/lib/table';
import { api, apis, InsertWhatsAppApi, Sender, SenderList, DataTrackerApi } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as WhatsAppSvg } from '../../../../images/whats-app.svg';
import BlankImg from '../../../../images/blank.png';
import ShowConfirm from '../../Customer/components/confirm/makeSureConfirm';
import { BindingModal } from './BindingModal';
import { ChatModal } from '@/components/Layout/EnterpriseSetting/whatsAppAccountManage/businessChatModal';
import { AllotModal } from './allotModal';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { whatsAppTracker } from '@/components/Layout/SNS/tracker';
import style from './insertWhatsApp.module.scss';
const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
export const InsertWhatsApp = () => {
  const domRef = useRef<HTMLDivElement>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [modify, setModify] = useState<boolean>(false);
  const [data, setData] = useState<SenderList>([]);
  const [visible, setVisible] = useState<boolean>(false);
  const [chatVisible, setChatVisible] = useState<boolean>(false);
  const [item, setItem] = useState({});
  const [chatItem, setChatItem] = useState({});
  const fetchData = () => {
    setModify(false);
    setLoading(true);
    insertWhatsAppApi
      .getSenderList()
      .then(setData)
      .finally(() => {
        setLoading(false);
      });
  };
  const isOverSize = useMemo(() => {
    return data.length >= 1;
  }, [data]);
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    whatsAppTracker.trackSetting('show');
  }, []);
  const handleSave = (sender: Sender) => {
    const payload = {
      ...sender,
    };
    let promise;
    if (item.id) {
      payload.id = item.id;
      promise = insertWhatsAppApi.updateSender(payload);
    } else {
      promise = insertWhatsAppApi.addSender(payload);
    }
    promise.then(() => {
      handleCloseModal();
      fetchData();
    });
    whatsAppTracker.trackSetting('submit');
  };
  const handleAdd = () => {
    setItem({});
    setVisible(true);
    whatsAppTracker.trackSetting('create');
  };
  const handleDelete = (sender: Sender) => {
    insertWhatsAppApi
      .deleteSender({
        sender: sender.sender,
      })
      .then(() => {
        const newData = data.filter(item => item.id !== sender.id);
        setData(newData);
        Toast.success({ content: typeof window !== 'undefined' ? window.getLocalLabel('SHANCHUCHENGGONG') : '' });
      });
  };
  const handleUpdateStatus = (sender: Sender) => {
    const payload = {
      sender: sender.sender,
      status: sender.status ? 0 : 1,
    };
    insertWhatsAppApi.updateSenderStatus(payload).then(() => {
      const newData = [...data];
      const index = newData.findIndex(item => sender.id === item.id);
      const item = newData[index];
      newData.splice(index, 1, {
        ...item,
        ...payload,
      });
      setData(newData);
    });
  };
  const deleteConfirm = (sender: Sender) => {
    ShowConfirm({ title: typeof window !== 'undefined' ? window.getLocalLabel('SHIFOUQUERENSHANCHU\uFF1F') : '', type: 'danger', makeSure: () => handleDelete(sender) });
  };
  const handleCloseModal = () => {
    setVisible(false);
    setItem({});
  };
  const handleCloseChatModal = () => {
    setChatVisible(false);
    setChatItem({});
  };
  const handleVisibleChange = (opening: boolean) => {
    console.log('opening', opening);
    console.log('modify', modify);
    setTooltipOpen(opening);
    if (!opening && modify) {
      fetchData();
    }
    if (opening) {
      trackerApi.track('WA_account_management_business_users');
    }
  };
  const columns: ColumnsType<Sender> = [
    {
      title: typeof window !== 'undefined' ? window.getLocalLabel('MINGCHENG') : '',
      dataIndex: 'orgName',
    },
    {
      title: typeof window !== 'undefined' ? window.getLocalLabel('WhatsApp BusinessSHOUJIHAO') : '',
      dataIndex: 'sender',
    },
    {
      title: typeof window !== 'undefined' ? window.getLocalLabel('BANGDINGSHIJIAN') : '',
      dataIndex: 'createTime',
    },
    {
      title: '使用人数',
      dataIndex: 'useAccountNum',
      render(_, field) {
        return (
          <Tooltip
            autoAdjustOverflow={false}
            placement="left"
            getPopupContainer={() => domRef.current as HTMLDivElement}
            overlayClassName={style.allotTooltip}
            destroyTooltipOnHide={true}
            onVisibleChange={handleVisibleChange}
            title={<AllotModal sender={field.sender} openChat={accId => handleOpenChat(accId, field.sender)} onModify={() => setModify(true)} />}
            color="#fff"
            trigger="click"
            visible={tooltipOpen}
          >
            <span className={style.users}>{_}</span>
          </Tooltip>
        );
      },
    },
    {
      title: typeof window !== 'undefined' ? window.getLocalLabel('BANGDINGREN') : '',
      dataIndex: 'createBy',
      // }, {
      //     title: '状态',
      //     dataIndex: 'status',
      //     render(_, field) {
      //         return <Switch checked={_ === 0} onChange={() => handleUpdateStatus(field)} />;
      //     }
    },
    {
      title: typeof window !== 'undefined' ? window.getLocalLabel('CAOZUO') : '',
      dataIndex: 'action',
      fixed: 'right',
      width: 120,
      render: (_, field) => (
        <>
          <PrivilegeCheck resourceLabel="WHATSAPP_BUSINESS_ACCOUNT" accessLabel="MANAGE">
            <a
              className={style.btn}
              onClick={() => {
                setItem(field);
                setVisible(true);
              }}
            >
              {typeof window !== 'undefined' ? window.getLocalLabel('GUANLI') : ''}
            </a>
          </PrivilegeCheck>
          <PrivilegeCheck resourceLabel="WHATSAPP_BUSINESS_ACCOUNT" accessLabel="DELETE">
            <a className={style.btn} onClick={() => deleteConfirm(field)}>
              {typeof window !== 'undefined' ? window.getLocalLabel('SHANCHU') : ''}
            </a>
          </PrivilegeCheck>
        </>
      ),
    },
  ];
  const handleOpenChat = (accId: string, sender: string) => {
    setTooltipOpen(false);
    setChatItem({
      searchAccId: accId,
      sender,
    });
    setChatVisible(true);
    trackerApi.track('WA_account_management_bussiness_chatrecord');
  };
  return (
    <PermissionCheckPage resourceLabel="WHATSAPP_BUSINESS_ACCOUNT" accessLabel="VIEW" menu="ORG_SETTINGS_PEER_SETTING">
      <div className={style.pageContainer} ref={domRef}>
        <h3 className={style.pageTitle}>
          <span>{typeof window !== 'undefined' ? window.getLocalLabel('WhatsAppDUIJIE') : ''}</span>
          <Button type="primary" className={style.addBtn} disabled={isOverSize} onClick={handleAdd}>
            {typeof window !== 'undefined' ? window.getLocalLabel('XINJIANBANGDING') : ''}
          </Button>
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
              <div style={{ margin: '16px auto', color: '#47484C', lineHeight: '22px' }}>
                <div>
                  {typeof window !== 'undefined' ? window.getLocalLabel('ZANWEIBANGDING\uFF0CDIANJI') : ''}
                  <Button type="link" className={style.addBtnText} onClick={handleAdd}>
                    {typeof window !== 'undefined' ? window.getLocalLabel('XINJIANBANGDING') : ''}
                  </Button>
                </div>
                <div>{typeof window !== 'undefined' ? window.getLocalLabel('KUAISUCHUANGJIANWhatsApp DUIJIE') : ''}</div>
              </div>
            </div>
          )}
        </Skeleton>
        <BindingModal visible={visible} item={item} onClose={handleCloseModal} onOk={handleSave} />
        <ChatModal visible={chatVisible} data={chatItem} business={true} onClose={handleCloseChatModal} />
      </div>
    </PermissionCheckPage>
  );
};
