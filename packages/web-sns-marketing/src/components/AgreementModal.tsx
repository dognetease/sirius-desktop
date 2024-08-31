import React, { useState } from 'react';
import { Button, Checkbox } from 'antd';
import { getIn18Text } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './AgreementModal.module.scss';

interface AgreementModalProps {
  visible: boolean;
  onAgree: () => void;
}

const AgreementModal: React.FC<AgreementModalProps> = props => {
  const { visible, onAgree } = props;
  const [agreementChecked, setAgreementChecked] = useState<boolean>(false);

  return (
    <Modal
      className={style.agreementModal}
      visible={visible}
      title={getIn18Text('FUWUSHIYONGGUIZEJIMIANZESHENGMING')}
      width={560}
      keyboard={false}
      maskClosable={false}
      footer={
        <div className={style.agreementModalFooter}>
          <Checkbox style={{ fontSize: 12, flex: 1, textAlign: 'left' }} checked={agreementChecked} onChange={event => setAgreementChecked(event.target.checked)}>
            {getIn18Text('WOYIYUEDUBINGQUEREN\u300AFUWUSHIYONGGUIZEJIMIANZESHENGMING\u300B\uFF0CBUZAITIXING')}
          </Checkbox>
          <Button type="primary" disabled={!agreementChecked} onClick={onAgree}>
            {getIn18Text('TONGYIXIEYIBINGJIXU')}
          </Button>
        </div>
      }
    >
      <p>
        {getIn18Text(
          'ZUNJINGDEYONGHU\uFF0CZAISHIYONGWANGYIWAIMAOTONGwhatsappYINGXIAOGONGNENG/FUWU\uFF08XIACHENG\u201CBENFUWU\u201D\uFF09QIAN\uFF0CQINGXIANYUEDU\u300AWANGYIWAIMAOTONGFUWUTIAOKUAN\u300BJIXIALIESHIYONGGUIZE\uFF0CZAIJIESHOUBINGTONGYIQUANBUNEIRONGHOUKAISHISHIYONGBENFUWU\uFF1BRUYOURENHEWEIFAN\uFF0CNINXUYAODUIZIJIDEXINGWEICHENGDANQUANBUFALVZEREN\uFF0CWOMENBUDUININDERENHEXINGWEIFUZE\uFF1A'
        )}
      </p>
      <ul>
        <li>{getIn18Text('BUDESHIYONGFEIFAWANGLUOLIANJIEFANGSHISHIYONGBENFUWU\uFF1B')}</li>
        <li>{getIn18Text('BUDEWEIFANGUOJIAFALVFAGUI\uFF0CBUDEQINFANQITAYONGHUJIRENHEDISANFANGDEHEFAQUANYI\uFF1B')}</li>
        <li>{getIn18Text('BUDESHIYONGBENFUWUFABU\u3001CHUANBO\u3001XIAOSHOUZHONGGUOFALVJIQITAKESHIYONGFALVJINZHIDENEIRONG\uFF1B')}</li>
        <li>{getIn18Text('BUDERAOGUO/POHUAIFUWUDEBAOHUHEXIANZHICUOSHISHIYONGBENFUWU\uFF1B')}</li>
        <li>{getIn18Text('BUDETONGGUOZHUANRANG\u3001CHUZU\u3001GONGXIANGDENGFANGSHIXIANGDISANFANGTIGONGBENFUWU\u3002')}</li>
      </ul>
      <p>
        {getIn18Text('RUONINWEIFAN')}
        <a href="https://qiye.163.com/sirius/agreement_waimao/index.html" target="_blank" rel="noreferrer">
          {getIn18Text('\u300AWANGYIWAIMAOTONGFUWUTIAOKUAN\u300B')}
        </a>
        {getIn18Text(
          'JISHANGSHUGUIZE\uFF0CWOMENYOUQUANCAIQUCUOSHI\uFF08BAOKUODANBUXIANYUZHONGZHIHUOXIANZHININDUIBENFUWUDESHIYONG\uFF09\uFF0CQIEBUTUIHAIRENHEFEIYONG\u3002YINNINDEXINGWEIZAOCHENGWOMENHUOGUANLIANGONGSISUNSHIDE\uFF0CNINYINGCHENGDANQUANBUPEICHANGZEREN\u3002'
        )}
      </p>
    </Modal>
  );
};

export default AgreementModal;
