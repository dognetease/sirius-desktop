import React, { useState, useEffect } from 'react';
import { Form, Input, Select } from 'antd';
import { apiHolder, apis, CustomerApi } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import style from './excludeEmailSuffixModal.module.scss';
import { getIn18Text } from 'api';
const { TextArea } = Input;
export interface ExcludeEmailSuffixModalProps {
  visible: boolean;
  onCancel: (update?: boolean) => void;
}
interface IWhiteList {
  default_list: string[];
  personal_list: string[];
}
const ExcludeEmailSuffixModal = (props: ExcludeEmailSuffixModalProps) => {
  const { visible, onCancel } = props;
  const children: React.ReactNode[] = [];
  const [whiteList, setWhiteList] = useState<IWhiteList>({
    default_list: [],
    personal_list: [],
  });
  const handleChange = (value: string[]) => {
    console.log(`selected ${value}`);
    setWhiteList({
      ...whiteList,
      personal_list: value,
    });
    clientApi.emailSuffixConfigListUpdate({ suffixList: value }).then(() => {
      Toast.success({ content: getIn18Text('GENGXINCHENGGONG') });
    });
  };
  const fetchData = () => {
    clientApi.emailSuffixConfigList().then(data => {
      setWhiteList({
        default_list: data.defaultList || [],
        personal_list: data.suffixList,
      });
    });
  };
  const renderForm = () => {
    return (
      <div>
        <p>
          {getIn18Text(
            'TIANJIADAOPAICHUHOUZHUI\uFF0CHUIZIDONGHULVELAIZIGAIMINGDANZHONGDEYOUXIANGHOUZHUI\uFF0CCHAZHONGHOU\uFF0CXUYAODAOXIANGTONGYUMINGQIYETIANJIALIANXIREN\u3002'
          )}
        </p>
        <Form layout="vertical">
          <Form.Item label={getIn18Text('MORENPAICHUHOUZHUI')}>
            <TextArea disabled rows={8} value={whiteList.default_list.join('\n')} />
          </Form.Item>
          <Form.Item label={getIn18Text('SHOUDONGXINZENGPAICHUHOUZHUI')}>
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder={getIn18Text('QINGSHURUYOUXIANGHOUZHUI')}
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
        title={getIn18Text('PAICHUHOUZHUI')}
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
export default ExcludeEmailSuffixModal;
