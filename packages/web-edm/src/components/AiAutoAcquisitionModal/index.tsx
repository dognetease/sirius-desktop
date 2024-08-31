import { getIn18Text } from 'api';
import React, { FC, useState, useEffect } from 'react';
import { apiHolder, DataStoreApi } from 'api';
import { Checkbox } from 'antd';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { AiMarketingEnterModel } from '../AutoMarketingEnter/autoMarketingEnter';
import { ReactComponent as AiAcquisitionIcon1 } from '@/images/icons/edm/yingxiao/ai-auto-acquisition-icon1.svg';
import { ReactComponent as AiAcquisitionIcon2 } from '@/images/icons/edm/yingxiao/ai-auto-acquisition-icon2.svg';
import { ReactComponent as AiAcquisitionIcon3 } from '@/images/icons/edm/yingxiao/ai-auto-acquisition-icon3.svg';
import ModalkBg from '@/images/icons/edm/yingxiao/auto_acquisition_modal_bg.png';
import { AiWriteMailReducer, useActions } from '@web-common/state/createStore';
import styles from './AiAutoAcquisitionModal.module.scss';
import { navigate } from '@reach/router';
import { edmDataTracker } from '../../tracker/tracker';

const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

const AIAUTOACQUISITION_MODAL = 'AIAUTOACQUISITION_MODAL';

const listConf = [
  {
    title: 'Al外贸大数据搜索，根据设置自动匹配目标客户',
    icon: () => <AiAcquisitionIcon1 className={styles.icon} />,
  },
  {
    title: '自动完成目标客户多轮营销',
    icon: () => <AiAcquisitionIcon2 className={styles.icon} />,
  },
  {
    title: '一次配置长期挖掘自动营销，不休息的Al业务员',
    icon: () => <AiAcquisitionIcon3 className={styles.icon} />,
  },
];

export const AiAutoAcquisitionModal: FC<{
  data: AiMarketingEnterModel;
  handleClose: (jumpOut?: boolean) => void;
}> = ({ data, handleClose }) => {
  // 智能推荐来源屏蔽两周checkbox
  const isAiRecommend = data?.from === 'smartrcmd';
  const [noShow, setNoShow] = useState(false);
  const { changeAiHostingInitObj } = useActions(AiWriteMailReducer);

  useEffect(() => {
    edmDataTracker.track('pc_markting_edm_autoHost', {
      type: 'show',
    });
  }, []);

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
    dataStoreApi.putSync(AIAUTOACQUISITION_MODAL, expires.toString());
  };

  const clickConfig = () => {
    edmDataTracker.track('pc_markting_edm_autoHost', {
      type: 'click',
    });
    changeAiHostingInitObj({ type: 'automatic', trackFrom: 'guide', ...data });
    navigate('#edm?page=aiHosting');
  };

  const beforeClose = () => {
    handleClose();
    afterClose();
  };

  return (
    <>
      <Modal title="" width={400} visible={true} onCancel={beforeClose} footer={null} maskClosable={false}>
        <div className={styles.modalBox}>
          <div className={styles.top}>
            <img style={{ width: '100%', height: '100%' }} src={ModalkBg} alt="" />
            <span className={styles.title}>自动获客全新上线免费开启</span>
          </div>
          <div className={styles.content}>
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
            <Button className={styles.inner} btnType="minorLine" onClick={beforeClose}>
              {getIn18Text('SHAOHOUCHAKAN')}
            </Button>
            <Button
              className={styles.inner}
              btnType="primary"
              onClick={() => {
                beforeClose();
                clickConfig();
              }}
            >
              {getIn18Text('LIJISHEZHI')}
            </Button>
          </div>
          {isAiRecommend ? (
            <></>
          ) : (
            <div className={styles.notShow}>
              <Checkbox
                checked={noShow}
                onChange={evt => {
                  edmDataTracker.track('pc_markting_edm_autoHost', {
                    type: 'click',
                  });
                  setNoShow(evt.target.checked);
                }}
              >
                <span className={styles.tips}>{getIn18Text('LIANGZHOUNEIBUZAIXIANSHI')}</span>
              </Checkbox>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
