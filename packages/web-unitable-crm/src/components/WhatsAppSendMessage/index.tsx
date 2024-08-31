import React, { useState, useEffect, useMemo } from 'react';
import { navigate } from '@reach/router';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { Form, Spin, message } from 'antd';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import { ColumnsType } from 'antd/lib/table';
import { apiHolder, api, apis, InsertWhatsAppApi, WAChannelContactListItem as PersonChannel, WhatsAppSenderItem } from 'api';

import { useAppSelector } from '@web-common/state/createStore';
import { Card } from './card';
import style from './style.module.scss';

const systemApi = apiHolder.api.getSystemApi();
const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

export interface ContactWithWA {
  /**联系人姓名 */
  contactName: string;
  /**联系人邮箱 */
  contactEmail: string;
  /**联系人id */
  contactId: string;
  /**主要联系人 */
  mainContact: boolean;
  /**关键决策人 */
  decisionMaker: boolean;
  /**联系人WhatsApp列表，列表第一个就是主要WA账号 */
  whatsAppList: string[];
}

interface ComsProps {
  visible: boolean;
  onCancel: (param?: boolean) => void;
  data: {
    whatsApp: string;
    contactList?: ContactWithWA[];
    /**
     * 发WA弹窗中 点击去发信跳转后，需要执行的回调函数
     */
    submitAfterHandle?: () => void;
  };
}

interface submitParams {
  customer_range: number;
  receive_range: number;
}

const columns: ColumnsType<ContactWithWA> = [
  {
    title: '联系人姓名',
    dataIndex: 'contactName',
    ellipsis: true,
    render(text, record) {
      return (
        <div>
          <span title={text || '-'}>{text || '-'}</span>
          {record.decisionMaker && <span className={style.warnTag}>关键决策人</span>}
          {record.mainContact && <span className={style.warnTag}>主要联系人</span>}
        </div>
      );
    },
  },
  {
    title: '联系人账号',
    dataIndex: 'whatsAppList',
    ellipsis: true,
    render(whatsAppList = []) {
      return whatsAppList[0] || '-';
    },
  },
];

export type SenderType = 'PERSONAL' | 'BUSINESS' | 'PERSONWA';
const WhatsAppSendMessage: React.FC<ComsProps> = ({ visible, onCancel, data }) => {
  const [form] = Form.useForm();
  const [isLoading, setIsloading] = useState<boolean>(false);
  const [contact, setContact] = useState<string>(''); // 发送联系人
  const [senderList, setSenderList] = useState<WhatsAppSenderItem[]>([]);
  const [senderType, setSenderType] = useState<SenderType | undefined>();
  const [waAccounts, setPersonChannel] = useState<PersonChannel[]>([]);
  const [selecter, setSelecter] = useState<string>();
  // 会话菜单
  const hasWaMessagePermission = useAppSelector(state => state.privilegeReducer.visibleMenuLabels['WA_CHAT_LIST']);
  console.log('hasWaMessagePermission', hasWaMessagePermission);
  const showContactList = useMemo(() => {
    return Array.isArray(data.contactList) && data.contactList.length > 0;
  }, [data]);
  // 个人whatsapp登录态
  const personWhatsApp = useMemo(() => {
    return senderList.find((item: any) => item.senderType === 'PERSONAL');
  }, [senderList]);
  // 商业whatsapp登录态
  const businessWhatsAppList = useMemo(() => {
    return senderList.filter((item: any) => item.senderType === 'BUSINESS');
  }, [senderList]);

  const onSend = (senderType: SenderType, whatsApp: string) => {
    onCancel();
    if (senderType === 'BUSINESS') {
      navigate(`#edm?page=whatsAppMessage&from=${selecter}&chatId=${whatsApp}`);
    }
    if (senderType === 'PERSONWA') {
      const channel = waAccounts.find(item => item.number === selecter)!;
      navigate(`#wa?page=waChatList&defaultChatId=${whatsApp}&transportId=${channel?.channelId}`);
    }
  };
  /*
   *   提交事件
   */
  const handleSubmit = () => {
    if (showContactList && !contact) {
      return message.warning('请选择发送联系人');
    }
    if (!senderType) {
      return message.warning('请选择发送账号');
    }
    if (senderType === 'PERSONAL') {
      if (systemApi.isElectron()) {
        systemApi.createWindowWithInitData('personalWhatsapp', { eventName: 'initPage', eventData: { chatWhatsApp: contact || data.whatsApp } });
      } else {
        window.open(`/personalWhatsapp/?chatWhatsApp=${contact || data.whatsApp}`, 'personalWhatsapp');
      }
      data.submitAfterHandle && data.submitAfterHandle();
    }
    if (senderType === 'BUSINESS') {
      const itemData = senderList.find(item => item.sender === selecter);
      console.log('selecter', selecter, itemData);
      if (itemData?.lastContactAt) {
        onSend(senderType, itemData.chatId!);
        data.submitAfterHandle && data.submitAfterHandle();
      } else {
        message.warn('该商业号尚未联系过此联系人，请前往「WhatsApp 商业营销」创建群发任务');
      }
    }
    if (senderType === 'PERSONWA') {
      onSend(senderType, contact || data.whatsApp);
      data.submitAfterHandle && data.submitAfterHandle();
    }
  };
  const onCancelCallBack = () => {
    onCancel();
  };

  useEffect(() => {
    const lastContact = contact || data.whatsApp;
    if (visible && lastContact) {
      setIsloading(true);
      insertWhatsAppApi
        .getWhatsAppAccountListV2(lastContact)
        .then((data: any) => {
          const { whatsAppSenderList = [] } = data;
          setSenderList(whatsAppSenderList);
        })
        .finally(() => setIsloading(false));
    } else {
      setContact('');
      setSenderType(void 0);
      setPersonChannel([]);
      setSenderList([]);
      setSelecter(undefined);
    }
  }, [contact, data.whatsApp, visible]);

  useEffect(() => {
    const lastContact = contact || data.whatsApp;
    if (hasWaMessagePermission && lastContact && visible) {
      insertWhatsAppApi.getWAChannelContactList(lastContact).then(res => {
        setPersonChannel(res?.content || []);
      });
    }
  }, [hasWaMessagePermission, contact, data.whatsApp, visible]);

  const onFinish = (values: submitParams) => {
    // TODO: 根据查询条件获取所有的联系人数据
    console.log('onFinish', values);
  };

  const hanldeClickSender = (type: SenderType, sender: string) => {
    setSenderType(type);
    setSelecter(sender);
  };
  const handleLoginPersonal = () => {
    window.open(`/personalWhatsapp/`, 'personalWhatsapp');
  };

  // let CardContent: React.ReactNode;

  const CardContent = useMemo(() => {
    if (hasWaMessagePermission) {
      if (waAccounts.length) {
        return waAccounts.map(waItem => (
          <Card
            selected={!!selecter && selecter === waItem.number}
            type="PERSONWA"
            hanldeClickSender={hanldeClickSender}
            sender={waItem.number}
            avatarUrl={waItem.avatarUrl}
            accountName={waItem.name}
            time={waItem.timestamp}
            login
          />
        ));
      }
      return <Card selected={false} type="PERSONWA" login={false} />;
    }
    return (
      <Card
        selected={!!selecter && selecter === personWhatsApp?.sender}
        type="PERSONAL"
        hanldeClickSender={hanldeClickSender}
        login={false}
        sender={personWhatsApp?.sender}
        handleLoginPersonal={handleLoginPersonal}
      />
    );
  }, [hasWaMessagePermission, waAccounts, personWhatsApp, selecter]);

  const BussinessCard = useMemo(() => {
    if (businessWhatsAppList.length) {
      return businessWhatsAppList.map(waItem => (
        <Card
          selected={!!selecter && selecter === waItem.sender}
          type="BUSINESS"
          time={waItem.lastContactAt}
          hanldeClickSender={hanldeClickSender}
          login
          sender={waItem.sender}
        />
      ));
    }
    return <Card selected={false} type="BUSINESS" login={false} />;
  }, [hasWaMessagePermission, businessWhatsAppList, personWhatsApp, selecter]);

  return (
    <Modal
      title="WhatsApp发送信息"
      getContainer={() => {
        return window.document.body;
      }}
      wrapClassName={style.clueModalWrap}
      width={600}
      bodyStyle={{
        paddingTop: 0,
        paddingBottom: 16,
        maxHeight: 500,
        overflow: 'auto',
      }}
      visible={visible}
      footer={
        <div className={style.actionGroup}>
          <Button btnType="primary" onClick={handleSubmit}>
            发送信息
          </Button>
        </div>
      }
      destroyOnClose={true}
      onCancel={onCancelCallBack}
    >
      <div className={style.content}>
        <Spin spinning={isLoading}>
          <Form form={form} name="distribute" onFinish={onFinish} layout={'vertical'} autoComplete="off">
            {showContactList && (
              <Form.Item label="发送至" name="customer_range" required>
                <Table
                  rowSelection={{
                    type: 'radio',
                    onChange: (selectedRowKeys: React.Key[], selectedRows: ContactWithWA[]) => {
                      console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
                      if (selectedRows[0]?.whatsAppList?.length) {
                        setContact(selectedRows[0].whatsAppList[0]);
                      }
                    },
                  }}
                  scroll={{
                    y: 300,
                  }}
                  rowKey="contactId"
                  columns={columns}
                  dataSource={data.contactList}
                  pagination={false}
                />
              </Form.Item>
            )}
            <Form.Item label="发送账号" name="receive_range" required>
              <div className={style.cardWrap}>
                <div className={style.accountList}>{CardContent}</div>
                <div className={style.accountList}>{BussinessCard}</div>
              </div>
            </Form.Item>
          </Form>
        </Spin>
      </div>
    </Modal>
  );
};

export default WhatsAppSendMessage;
