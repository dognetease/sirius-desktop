import React, { FC, useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { apiHolder, apis, EdmSendBoxApi, GetPlanListRes, TaskPlanSwitchReq, DataStoreApi } from 'api';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import AiHostingBg from '@/images/icons/edm/yingxiao/aihosting-bg.png';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';

import { MarketingRecords } from '../MarketingRecords';
import { edmDataTracker } from '../../tracker/tracker';
import { BasicInput } from '../AiHostingEdit/index';

import styles from './DataView.module.scss';
import { Header, Action } from './Header';
import { List } from './list';
import { MyTaskList } from './MyTaskList';

const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
// const AIHOSTING_UPDATE = 'AIHOSTING_UPDATE';

interface DataViewProps {
  openEditPage: (taskId: string) => void;
  openContactPage: (taskId: string) => void;
  taskId: string;
  addContact: (taskId: string) => void;
  op: (action: Action) => void;
  openReplayPage: (planId: string) => void;
}

export const DataView = forwardRef((props: DataViewProps, ref) => {
  // 是否展示详情
  const [showDetail, setShowDetail] = useState(false);
  const [date, setDate] = useState('');
  const [planId, setPlanId] = useState('');
  const listRef = useRef<{ refresh: () => void }>(null);
  const [headerKey, setHeaderKey] = useState(0);
  // const [showModal, setShowModal] = useState(false);

  useImperativeHandle(ref, () => ({
    refresh() {
      listRef.current != null && listRef.current.refresh();
    },
  }));

  useEffect(() => {
    edmDataTracker.dataViewAction();

    // const data = dataStoreApi.getSync(AIHOSTING_UPDATE);
    // if (data && data.suc && data.data === 'true') {
    //   return;
    // }
    // setShowModal(true);
  }, []);

  return (
    <>
      {showDetail ? (
        <MarketingRecords taskId={props.taskId} date={date} goHome={() => setShowDetail(false)} planId={planId} />
      ) : (
        <div className={styles.dataView}>
          {/* 我是数据大盘 */}
          <Header
            key={headerKey}
            refreshPage={() => {
              listRef.current != null && listRef.current.refresh();
            }}
            actionTrace={action => edmDataTracker.aiHostingDataView(action)}
            {...props}
          />
          <MyTaskList
            actionTrace={action => edmDataTracker.aiHostingDataView(action)}
            refreshHeader={() => setHeaderKey(headerKey + 1)}
            taskId={props.taskId}
            op={props.op}
            openReplayPage={props.openReplayPage}
          />
          <List
            setPlanId={setPlanId}
            actionTrace={action => edmDataTracker.aiHostingOverviewAction(action)}
            toDetail={date => {
              setShowDetail(true);
              setDate(date);
            }}
            taskId={props.taskId}
            // openReplayPage={props.openReplayPage}
            ref={listRef}
          />
        </div>
      )}
      {/* <Modal
        title=""
        width={404}
        visible={showModal}
        onCancel={() => {
          setShowModal(false);
        }}
        footer={null}
        afterClose={() => {
          dataStoreApi.putSync(AIHOSTING_UPDATE, 'true');
        }}
      >
        <div className={styles.modalBox}>
          <img src={AiHostingBg} alt="" />
          <div className={styles.content}>
            <div className={styles.title}>营销托管全面升级自动获客</div>
            <div className={styles.lineBox}>
              {[
                '添加联系人后系统自动组成发信任务安排发送时间',
                '发信策略更智能，AI智能调度，最大效率完成发信任务',
                '每日自动发信上限可配置，更合理更高效的触达目标客户',
              ].map((item, index) => (
                <div className={styles.line} key={index}>
                  <div className={styles.circle}></div>
                  <div className={styles.lineInfo}>{item}</div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.btn}>
            <Button
              style={{
                marginTop: 32,
              }}
              btnType="primary"
              onClick={() => setShowModal(false)}
            >
              知道了
            </Button>
          </div>
        </div>
      </Modal> */}
    </>
  );
});

export default DataView;
