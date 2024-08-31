import React, { useEffect, useMemo } from 'react';
import { apiHolder, apis, DataStoreApi, NetStorageApi, AnnouncementOperateTypeEnum, DataTrackerApi, SystemApi } from 'api';
import { Button } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './index.module.scss';
import { DiskTipKeyEnum } from '../../disk';
import { DiskActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { normalizeShareUrl } from '../../utils';
import { getIn18Text } from 'api';
const dataStoreApi: DataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const ROOKIE_POPUP_EVENT_ID = 'pcDisk_RookiePopup';
enum OperaTypeEnum {
  SHOW = 'show',
  CREATE_DOC = 'co-docs',
  UPLOAD_FILES = 'im-files',
  CLOSE = 'close', // 关闭弹窗
}
interface Props {
  isModalVisible: boolean;
  setVisible: (val) => void;
}
const UserWelcome: React.FC<Props> = ({ isModalVisible, setVisible }) => {
  const dispatch = useAppDispatch();
  const guideTipsInfo = useAppSelector(state => state.diskReducer.guideTipsInfo);
  const diskPsR = useAppSelector(state => state.diskReducer.diskPsR);
  // 判断个人空间是否被关闭了
  const isPrivateSpaceClosed = useMemo(() => {
    if (!diskPsR.private.includes('USE')) return true;
    return false;
  }, [diskPsR]);
  // 埋点
  const doDataTrack = (type: OperaTypeEnum) => {
    trackerApi.track(ROOKIE_POPUP_EVENT_ID, {
      OperaType: type,
    });
  };
  useEffect(() => {
    // 弹窗展示埋点
    if (isModalVisible) {
      doDataTrack(OperaTypeEnum.SHOW);
    }
    dispatch(
      DiskActions.setGuideTipsInfoByKey({
        key: DiskTipKeyEnum.WELCOME_TIP,
        value: {
          ...guideTipsInfo[DiskTipKeyEnum.WELCOME_TIP],
          visiable: isModalVisible,
        },
      })
    );
  }, [isModalVisible]);
  const closeModal = () => {
    const tipInfo = guideTipsInfo[DiskTipKeyEnum.WELCOME_TIP];
    if (!tipInfo.content) return;
    const { announcementId } = tipInfo.content;
    diskApi
      .operateAnnouncement({
        announcementId,
        operateType: AnnouncementOperateTypeEnum.STOP_REMIND,
      })
      .then(success => {
        console.debug('[UserWelcome] operateAnnouncement', success);
      });
    setVisible(false);
    dataStoreApi.put(DiskTipKeyEnum.WELCOME_TIP, 'true');
    dispatch(DiskActions.setIsNewUser(false));
    dispatch(
      DiskActions.setGuideTipsInfoByKey({
        key: DiskTipKeyEnum.WELCOME_TIP,
        value: {
          ...guideTipsInfo[DiskTipKeyEnum.WELCOME_TIP],
          visiable: false,
          showed: true,
        },
      })
    );
  };
  const jumpToGuideDoc = () => {
    const tipInfo = guideTipsInfo[DiskTipKeyEnum.WELCOME_TIP];
    if (!tipInfo.content) return;
    const { firstDocUrl } = tipInfo.content;
    const shareUrl = normalizeShareUrl(firstDocUrl);
    if (systemApi.isElectron()) {
      systemApi.handleJumpUrl(-1, shareUrl);
    } else {
      systemApi.openNewWindow(shareUrl);
    }
    closeModal();
    doDataTrack(OperaTypeEnum.CREATE_DOC);
  };
  const toggleUpload = () => {
    dispatch(
      DiskActions.setCurUploadTriggerInfo({
        tab: 'recently',
        triggered: false,
      })
    );
  };
  const switchToMainPageAndUpload = () => {
    toggleUpload();
    closeModal();
    doDataTrack(OperaTypeEnum.UPLOAD_FILES);
  };
  const showPrivateSpaceClosedMsg = () => {
    message.error({ content: getIn18Text('GERENKONGJIANBEI') });
  };
  return (
    <>
      <Modal
        className={style.modal}
        footer={null}
        closeIcon={<div className={`dark-invert ${style.modalClose}`} />}
        maskClosable={false}
        width="713px"
        visible={isModalVisible}
        onCancel={() => {
          closeModal();
          doDataTrack(OperaTypeEnum.CLOSE);
        }}
      >
        <div>
          <div className={style.header}>
            <div className={style.title}>{getIn18Text('YONGYUNWENDANGKAI')}</div>
          </div>
          <div className={style.body}>
            <div className={style.leftContent}>
              <div className={style.bg}></div>
            </div>
            <div className={style.rightContent}>
              <div className={style.item}>
                <div className={style.container}>
                  <div className={style.title}>{getIn18Text('XIETONGWENDANG')}</div>
                  <div className={style.content}>{getIn18Text('SHISHIBAOCUNNEI')}</div>
                </div>
                <Button
                  size="small"
                  type="primary"
                  className={classnames(style.btn)}
                  onClick={() => {
                    if (isPrivateSpaceClosed) return showPrivateSpaceClosedMsg();
                    jumpToGuideDoc();
                  }}
                >
                  {getIn18Text('MASHANGSHISHI')}
                </Button>
              </div>
              <div className={style.item}>
                <div className={style.container}>
                  <div className={style.title}>{getIn18Text('SHANGCHUANWENJIAN')}</div>
                  <div className={style.content}>{getIn18Text('SHANGCHUANBENDEWEN')}</div>
                </div>
                <Button
                  size="small"
                  type="primary"
                  className={classnames(style.btn)}
                  onClick={() => {
                    if (isPrivateSpaceClosed) return showPrivateSpaceClosedMsg();
                    switchToMainPageAndUpload();
                  }}
                >
                  {getIn18Text('LIJISHANGCHUAN')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
export default UserWelcome;
