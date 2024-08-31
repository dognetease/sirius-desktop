import React, { useState } from 'react';
import style from './notAllowIcon.module.scss';
import { Popover, Popconfirm } from 'antd';
// import { StopOutlined } from '@ant-design/icons/StopOutlined';
import { ReactComponent as ClientCombineIcon } from '@/images/icons/edm/client-combine.svg';
import { apiHolder, apis, CustomerApi, ReqCheckEmailValid as reqType } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
interface ComsProps {
  text?: string;
  className?: string;
  condition: string;
  id: string;
  contactId: string;
  onOk: (update: boolean) => void;
}
const NotAllowIcon = (props: ComsProps) => {
  const { id, className, condition, contactId, onOk } = props;
  console.log('xxxxxprops', props);
  const [hovered, setHovered] = useState(false);
  // const [visible, setVisable] = useState<boolean>(true);
  const content = () => {
    return (
      <div>
        <div className={style.title}>{getIn18Text('YOUXIANGKENENGSHIXIAO')}</div>
        <div className={style.content}>{getIn18Text('YISHIXIAOYOUXIANGKEBIANJIHUOSHANCHU\uFF0CHUOBIAOJIWEIYOUXIAO')}</div>
      </div>
    );
  };
  const handleHoverChange = (visible: boolean) => {
    setHovered(visible);
  };
  const validEmail = () => {
    let param = {
      condition,
      id: contactId,
    } as reqType;
    if (condition === 'company') {
      param.company_id = id;
    }
    if (condition === 'clue') {
      param.clue_id = id;
    }
    if (condition === 'opportunity') {
      param.opportunity_id = id;
    }
    clientApi.checkEmailValid(param).then(res => {
      onOk(res);
      Toast.success({
        content: getIn18Text('BIAOJICHENGGONG'),
      });
      setHovered(false);
      // setVisable(false);
      console.log('xxxxvalid', res);
    });
  };
  return (
    <div className={`${style.customerButton} ${className}`}>
      <Popconfirm
        overlayClassName={style.customerPopconfirm}
        title={content()}
        onConfirm={validEmail}
        // onCancel={cancel}
        okText={getIn18Text('BIAOJIYOUXIAO')}
        cancelText={getIn18Text('QUXIAO')}
      >
        <ClientCombineIcon />
      </Popconfirm>
      {/* <Popover
placement="bottomRight"
content={content(validEmail)}
visible={hovered}
onVisibleChange={handleHoverChange}
trigger="hover">
<StopOutlined />
</Popover> */}
    </div>
  );
};
export default NotAllowIcon;
