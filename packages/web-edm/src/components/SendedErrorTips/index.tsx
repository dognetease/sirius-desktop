import { getIn18Text } from 'api';
import React, { FC, useState, useEffect } from 'react';
import { apiHolder, apis, DataStoreApi, EdmSendBoxApi, GetDiagnosisDetailRes } from 'api';
import { ReactComponent as Icon } from '@/images/icons/edm/yingxiao/alert.svg';
import { ReactComponent as ArrowIcon } from '@/images/icons/edm/yingxiao/arrow-right.svg';
import DiagnosisIcon from '@/images/icons/edm/yingxiao/diagnosis.gif';
import { ReactComponent as Icon2 } from '@web-common/images/newIcon/tongyong_guanbi_xian.svg';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import classnames from 'classnames';

import { edmDataTracker } from '../../tracker/tracker';
import styles from './SendedErrorTips.module.scss';

const EDM_SENDED_ERROR_TIPS = 'EDM_SENDED_ERROR_TIPS';
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export const SendedErrorTips: FC<{
  visiable: boolean;
}> = ({ visiable }) => {
  const [show, setShow] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState<GetDiagnosisDetailRes>();
  // const [tipsList, setTipsList] = useState([
  //   {
  //     type: 'error',
  //     title: '最近5天连续每日发信超过1000',
  //     info: '大量地址发信建议使用营销托管功能进行智能调度',
  //     action: {
  //       text: '开启营销托管',
  //       url: '',
  //     },
  //   },
  // ]);

  // 请求数据，只有数据存在或者diagnosisList的length大于0才能展示
  const queryData = async () => {
    // setShow(true);
    try {
      const data = await edmApi.getDiagnosisDetail();
      setData(data);
      if (data.diagnosisList.length > 0) {
        setShow(true);
      }
    } catch (err) {}
  };

  useEffect(() => {
    // todo请求接口
    // 如果点击关闭了，距离上次关闭间隔一周并且接口数据符合要求
    if (!visiable) {
      return;
    }
    const data = dataStoreApi.getSync(EDM_SENDED_ERROR_TIPS);
    if (data.suc && data.data != null) {
      try {
        const start = new Date(+data.data);
        const end = new Date();
        if (end.getTime() - start.getTime() > 7 * 24 * 3600 * 1000) {
          // setShow(true);
          queryData();
        } else if (end.getDay() < start.getDay()) {
          // setShow(true);
          queryData();
        } else if (end.getDay() === start.getDay() && end.getDate() !== start.getDate()) {
          queryData();
        }
      } catch (err) {}
    } else {
      // setShow(true);
      queryData();
    }
  }, [visiable]);

  if (!show) {
    return null;
  }

  const afterClose = () => {};

  const clickClose = () => {
    setShow(false);
    // 记录关闭时间戳
    dataStoreApi.putSync(EDM_SENDED_ERROR_TIPS, '' + Date.now());
  };

  const renderTipsItem = () =>
    data?.diagnosisList.map((tipItem, index) => (
      <div key={index} className={styles.tipsItem}>
        <div className={styles.tipsItemInfo}>
          <div className={styles.tipsItemInfoTitle}>
            <Icon className={classnames(styles.tipsItemInfoIcon, tipItem.level === 1 ? styles.tipsItemInfoIcon2 : '')} />
            <div>{tipItem.problem}</div>
          </div>
          <div className={styles.tipsItemInfoBottom}>
            <Icon className={classnames(styles.tipsItemInfoIcon, styles.hide)} />
            <span className={classnames(styles.tipsBottomInfo)}>“{tipItem.solution}”</span>
            {tipItem.jumpText && (
              <a target="_blank" href={tipItem.jumpUrl}>
                <div className={classnames(styles.tipsBottomAction)}>{tipItem.jumpText}</div>
                {/* <div className={styles.tipsBottomIcon}>{tipItem.action.text}</div> */}
                <ArrowIcon className={styles.tipsBottomIcon} />
              </a>
            )}
          </div>
        </div>
      </div>
    ));

  const renderTipsContent = () => {
    if (data?.diagnosisList.length === 1) {
      return (
        <div className={styles.info}>
          [{data?.diagnosisList[0].problem}
          {getIn18Text(']KENENGYINGXIANGYOUJIAN')}
        </div>
      );
    }
    return (
      <div className={styles.info}>
        {getIn18Text('CUNZAI')}
        {data?.diagnosisList.length}
        {getIn18Text('XIANGWENTIKENENGYINGXIANG')}
      </div>
    );
  };

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.left}>
          <Icon className={styles.icon} />
          {renderTipsContent()}
        </div>
        <div className={styles.right}>
          <a
            className={styles.info2}
            onClick={() => {
              setShowModal(true);
              edmDataTracker.marktingEdmTaskListAlert();
            }}
          >
            {getIn18Text('CHAKANXIANGQING')}
          </a>
          <Icon2 className={styles.icon2} onClick={clickClose} />
        </div>
      </div>
      <Modal
        title=""
        width={500}
        visible={showModal}
        onCancel={() => {
          setShowModal(false);
        }}
        footer={null}
        maskClosable={false}
        afterClose={afterClose}
      >
        <div className={styles.modalBox}>
          <div className={styles.top}>
            <div className={styles.bgImg}>
              <img src={DiagnosisIcon} alt="" />
            </div>
            <div className={styles.title}>{getIn18Text('YOUJIANYINGXIAOCAOZUOZHEN')}</div>
            <div className={styles.info}>
              {getIn18Text('YIWEININZHENDUANCHUYI')}
              <span className={styles.mark}>{data?.diagnosisList.length}</span>
              {getIn18Text('TIAOYOUHUAJIANYI，QING')}
            </div>
          </div>
          <div className={styles.content}>
            {renderTipsItem()}
            <div className={styles.bottomTips}>
              如有问题，请搜索<span className={styles.tipsMark}>“网易售后沟通”</span>微信群，联系客户经理获取帮助及更多优化建议
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
