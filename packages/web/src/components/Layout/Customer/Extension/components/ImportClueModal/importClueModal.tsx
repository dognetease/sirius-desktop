import React, { useState, useEffect } from 'react';
import { Form, Input, Select } from 'antd';
import { apiHolder, apis, CustomerApi, ResUploadCientFile as uploadType, conf, urlStore } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import style from './importClueModal.module.scss';
import { getIn18Text } from 'api';
const { TextArea } = Input;
const { Option } = Select;
export interface IHistoryActionProps {
  visible: boolean;
  onCancel: (update?: boolean) => void;
}
interface IWhiteList {
  default_list: string[];
  personal_list: string[];
}
const ImportClientModal = (props: IHistoryActionProps) => {
  const { visible, onCancel } = props;
  const children: React.ReactNode[] = [];
  const [whiteList, setWhiteList] = useState<IWhiteList>({
    default_list: [],
    personal_list: [],
  });
  const handleChange = (value: string[]) => {
    console.log(`selected ${value}`);
    if (value.length > whiteList.personal_list.length) {
      const newItem: any = value.find((item: string) => !whiteList.personal_list.includes(item));
      setWhiteList({
        ...whiteList,
        personal_list: whiteList.personal_list.concat(newItem),
      });
      clientApi.extensionWhiteListAdd({ domain: newItem }).then(() => {
        Toast.success({ content: getIn18Text('XINZENGCHENGGONG') });
      });
    } else {
      const deleteItem: any = whiteList.personal_list.find(item => !value.includes(item));
      setWhiteList({
        ...whiteList,
        personal_list: whiteList.personal_list.filter(item => item !== deleteItem),
      });
      clientApi.extensionWhiteListDelete({ domain: deleteItem }).then(() => {
        Toast.success({ content: getIn18Text('SHANCHUCHENGGONG') });
      });
    }
  };
  const fetchData = () => {
    clientApi.extensionWhiteList().then(data => {
      setWhiteList(data);
    });
  };
  const renderForm = () => {
    return (
      <div>
        <p>{getIn18Text('TIANJIADAOGUOLVMINGDANHOU\uFF0CHUIZIDONGHULVELAIZIGAIMINGDANZHONGDEYUMING\uFF0CBUHUIZHUAQUYOUXIANGSHUJU')}</p>
        <Form layout="vertical">
          <Form.Item label={getIn18Text('MORENGUOLVMINGDAN')}>
            <TextArea disabled rows={8} value={whiteList.default_list.join('\n')} />
          </Form.Item>
          <Form.Item label={getIn18Text('SHOUDONGXINZENGGUOLVMINGDAN')}>
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder={getIn18Text('QINGSHURUYUMING\uFF0CWUXUhttpsHUOhttp\uFF0CLIRUxxx.com')}
              onChange={handleChange}
              value={whiteList.personal_list}
              options={whiteList.personal_list.map(item => ({ label: item, value: item }))}
            >
              {children}
            </Select>
          </Form.Item>
        </Form>
      </div>
    );
  };
  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible]);
  return (
    <>
      <Modal
        className={style.modalWrap}
        title={getIn18Text('SHEZHIGUOLVMINGDAN')}
        width={600}
        visible={visible}
        destroyOnClose={true}
        footer={null}
        onCancel={() => onCancel()}
      >
        <div className={style.modalContent}> {renderForm()}</div>
      </Modal>
    </>
  );
};
export default ImportClientModal;
