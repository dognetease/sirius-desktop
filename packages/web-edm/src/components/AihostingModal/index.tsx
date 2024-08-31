import { getIn18Text } from 'api';
import React, { FC, useState } from 'react';
import { apiHolder, DataStoreApi } from 'api';
import { Checkbox } from 'antd';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import AiHostingBg from '@/images/icons/edm/yingxiao/aihosting-modal.png';
import { ReactComponent as AiModalIcon1 } from '@/images/icons/edm/yingxiao/aimodal-icon1.svg';
import { ReactComponent as AiModalIcon2 } from '@/images/icons/edm/yingxiao/aimodal-icon2.svg';
import { ReactComponent as AiModalIcon3 } from '@/images/icons/edm/yingxiao/aimodal-icon3.svg';

import { openAiHosting } from '../../AIHosting/utils/openPage';
import AiMarketingEnter from '../AiMarketingEnter/aiMarketingEnter';

import styles from './AihostingModal.module.scss';

const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

const AIHOSTING_MODAL = 'AIHOSTING_MODAL';

const listConf = [
  {
    title: getIn18Text('ZIDONGWANCHENGDUOLUNYOU'),
    icon: () => <AiModalIcon1 className={styles.icon} />,
  },
  {
    title: getIn18Text('AIZHINENGDIAODUFEN'),
    icon: () => <AiModalIcon2 className={styles.icon} />,
  },
  {
    title: getIn18Text('ZUIJIAYINGXIAOSHIJIANCHEN'),
    icon: () => <AiModalIcon3 className={styles.icon} />,
  },
];

export const AihostingModal: FC<{
  handleClose: (jumpOut?: boolean) => void;
}> = ({ handleClose }) => {
  const [noShow, setNoShow] = useState(false);

  const afterClose = () => {
    const date = new Date();
    let expires: number;
    if (noShow) {
      expires = date.getTime() + 2 * 7 * 24 * 3600 * 1000;
    } else {
      // 明天再提示
      date.setHours(24);
      date.setMinutes(0);
      date.setSeconds(0);
      expires = date.getTime();
    }
    dataStoreApi.putSync(AIHOSTING_MODAL, expires.toString());
  };

  return (
    <>
      <Modal title="" width={400} visible={true} onCancel={handleClose} footer={null} maskClosable={false} afterClose={afterClose}>
        <div className={styles.modalBox}>
          <img src={AiHostingBg} alt="" />
          <div className={styles.content}>
            <div className={styles.title}>{getIn18Text('NINYOUYIGEYINGXIAOTUO')}</div>
            <div className={styles.lineBox}>
              {listConf.map((conf, index) => (
                <div className={styles.line} key={index}>
                  {conf.icon()}
                  <div className={styles.lineInfo}>{conf.title}</div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.btn}>
            <Button
              style={{
                marginRight: 6,
                width: 140,
              }}
              btnType="minorLine"
              onClick={() => {
                handleClose();
                afterClose();
              }}
            >
              {getIn18Text('SHAOHOUCHAKAN')}
            </Button>
            {/* <Button
                  style={{
                    marginLeft: 6,
                    width: 140,
                  }}
                  btnType="primary"
                  onClick={() => {
                    handleClose();
                    openAiHosting();
                  }}
                >
                  立即设置
                </Button>
            */}
            <AiMarketingEnter
              afterClick={() => {
                handleClose(true);
                afterClose();
              }}
              handleType="create"
              btnClass={styles.inner}
              btnType="primary"
              text={getIn18Text('LIJISHEZHI')}
              trackFrom="listWindow"
            />
          </div>
          <div className={styles.notShow}>
            <Checkbox checked={noShow} onChange={evt => setNoShow(evt.target.checked)}>
              <span className={styles.tips}>{getIn18Text('LIANGZHOUNEIBUZAIXIANSHI')}</span>
            </Checkbox>
          </div>
        </div>
      </Modal>
    </>
  );
};
