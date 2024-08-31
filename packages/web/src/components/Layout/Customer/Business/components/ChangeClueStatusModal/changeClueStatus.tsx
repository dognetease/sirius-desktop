import React, { useEffect, useContext, useState } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './changeClueStatus.module.scss';
import { apiHolder, apis, CustomerApi } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import Select from '../../../components/UI/Select/customerSelect';
const { Option } = Select;
import { customerContext } from '../../../customerContext';
import { getIn18Text } from 'api';
interface ComsProps {
  visible: boolean;
  onCancel: (param?) => void;
  ids?: number[];
}
const ChangeStatusModal: React.FC<ComsProps> = ({ visible, onCancel, ids }) => {
  const { state } = useContext(customerContext).value;
  const { baseSelect } = state;
  let [status, setStatus] = useState<number>();
  /*
   *   提交事件
   */
  const formSubmit = () => {
    let params = {
      ids,
      status,
    };
    clientApi.editClueStatus(params).then(res => {
      if (res) {
        SiriusMessage.success({
          content: getIn18Text('XIUGAICHENGGONG'),
        });
        onCancel(true);
      }
    });
  };
  /*
   * onCancelCallBack
   */
  const clueChange = type => {
    setStatus(type);
  };
  const onCancelCallBack = () => {
    onCancel();
  };
  return (
    <Modal
      title={getIn18Text('PILIANGXIUGAIXIANSUOZHUANGTAI')}
      getContainer={false}
      wrapClassName={style.clueModalWrap}
      width={472}
      onOk={formSubmit}
      bodyStyle={{
        paddingTop: 0,
        paddingBottom: 0,
      }}
      visible={visible}
      okText={getIn18Text('QUEDING')}
      cancelText={getIn18Text('QUXIAO')}
      okButtonProps={{ disabled: !status }}
      destroyOnClose={true}
      onCancel={onCancelCallBack}
    >
      <div>
        <h3 className={style.title}>{getIn18Text('XIANSUOZHUANGTAI')}</h3>
        <Select placeholder={getIn18Text('XUANZEXIANSUOZHUANGTAI')} style={{ width: '100%' }} onChange={clueChange}>
          {baseSelect &&
            baseSelect['clue_status'].map((el, elIndex) => {
              return (
                <Option key={elIndex} value={el.value}>
                  {' '}
                  {el.label}
                </Option>
              );
            })}
        </Select>
        <div className={style.content}>{getIn18Text('*YIJINGZHUANWEIKEHUDESHUJU\uFF0CXIANSUOZHUANGTAIBUHUIBEIXIUGAI\u3002')}</div>
      </div>
    </Modal>
  );
};
export default ChangeStatusModal;
