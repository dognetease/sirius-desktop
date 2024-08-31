import React, { useState, forwardRef } from 'react';
import { Menu, message } from 'antd';
import { DropDownProps } from 'antd/lib/dropdown';
import { api, apis, QuotaNotifyModuleType, InsertWhatsAppApi, WhatsAppBSP } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { getTransText } from '@/components/util/translate';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import useWASend from '../../SNS/MultiAccount/hooks/useWASend';
import ArrowDropdownButton from '../component/ArrowDropdownButton/ArrowDropdownButton';
import QuotaNotifyModal from '@web-common/components/QuotaNotifyModal';
import { useWhatsAppMarket } from '../../SNS/BizWhatsApp/useWhatsAppMarket';
interface Props extends Partial<DropDownProps> {
  phoneNums: string[];
}

/* eslint react/jsx-props-no-spreading: 0 */
const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
export const DetailMarketingOperation = forwardRef((props: Props, ref) => {
  const { phoneNums } = props;
  // 是否展示创建次数弹窗
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [moduleType, setModuleType] = useState<QuotaNotifyModuleType>('SEARCH_PERSON_WA');
  const { waBulkSend } = useWASend();
  const { whatsAppLoading, whatsAppMarket } = useWhatsAppMarket();
  const hasMassTextingSendPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'WHATSAPP', 'OP'));
  const hasPersonSendPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'WHATSAPP_GROUP_SEND', 'GROUP_SEND'));
  const whatsAppMassTextingSend = async () => {
    try {
      const isBuy = await whatsAppApi.getOrdersWa();
      if (!isBuy.bizWA) {
        setModuleType('SEARCH_BIZ_WA');
        setShowNotificationModal(true);
      } else {
        if (!hasMassTextingSendPermisson) {
          Toast.error('暂无进行此操作的权限');
          return;
        }
        handleVerifyphones('MassTexting');
      }
    } catch (error) {}
  };

  const whatsAppPersonSend = async () => {
    try {
      const isBuy = await whatsAppApi.getOrdersWa();
      if (!isBuy.personWA) {
        setModuleType('SEARCH_PERSON_WA');
        setShowNotificationModal(true);
      } else {
        if (!hasPersonSendPermisson) {
          Toast.error('暂无进行此操作的权限');
          return;
        }
        handleVerifyphones('Person');
      }
    } catch (error) {}
  };

  const handleVerifyphones = async (str: string) => {
    let verifyphones = [];
    const hide = message.loading('正在校验手机号的有效性...', 0);
    try {
      const res = await whatsAppApi.maskVerifyWhatsappNumber(phoneNums.map((item: any) => item.replace(/\D/g, '')));
      verifyphones = res.whatsAppFilterResults?.filter(item => item.exists).map(ele => ele.number) || [];
      if (!verifyphones.length) {
        Toast.error('所选数据中不包含已注册 WhatsApp 的电话号码');
      } else {
        str === 'Person' ? waBulkSend(verifyphones) : whatsAppMarket(verifyphones);
      }
    } finally {
      setTimeout(() => hide(), 300);
    }
  };

  return (
    <>
      <ArrowDropdownButton
        buttonName={'WA个人号群发'}
        onClick={whatsAppPersonSend}
        disabled={!phoneNums?.length || whatsAppLoading}
        btnType="link"
        overlay={
          <Menu>
            <Menu.Item disabled={!phoneNums?.length || whatsAppLoading} onClick={whatsAppMassTextingSend}>
              {'WA商业号群发'}
            </Menu.Item>
          </Menu>
        }
      ></ArrowDropdownButton>
      {showNotificationModal && (
        <QuotaNotifyModal
          type="click"
          handleCancel={() => setShowNotificationModal(false)}
          onVisibleChange={visible => !visible && setShowNotificationModal(false)}
          moduleType={moduleType}
        />
      )}
    </>
  );
});
