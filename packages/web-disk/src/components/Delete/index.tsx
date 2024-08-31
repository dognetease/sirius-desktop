import React, { useState } from 'react';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import { apis, apiHolder as api, NetStorageApi, NetStorageShareApi, NetStorageType, DataTrackerApi } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import style from './index.module.scss';
import { getIn18Text } from 'api';
interface Props {
  isModalVisible: boolean;
  handleOk: (val) => void;
  type: NetStorageType;
  dataFromOperate: {
    setDeleteVisible: (val) => void;
    item: any;
  };
  forMe?: boolean;
  sideTab: string;
}
const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const shareApi = api.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const trackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const Delete: React.FC<Props> = ({ isModalVisible, handleOk, dataFromOperate, type, forMe, sideTab }) => {
  const { extensionType } = dataFromOperate.item;
  const [canDeleteVisible, setCanDeleteVisible] = useState(false);
  const [deleteLoad, setDeleteLoad] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  // 是否请求过老接口
  const [fatchTag, setFetchTag] = useState(false);
  // todo 移除分享列表的item
  const deleteAction = () => {
    if (sideTab === 'recently') {
      deleteRecently();
    } else if (sideTab === 'share') {
      deleteShare();
    } else {
      trackerApi.track(`pc_disk_click_delete_${type === 'ent' ? 'enterprise' : 'personal'}`);
      deleteNotShare();
    }
  };
  const deleteRecently = () => {
    const { useRecordId } = dataFromOperate.item;
    diskApi.deleteNSRecord({ useRecordId }).then(() => {
      // @ts-ignore
      message.success({
        content: getIn18Text('YIYICHU'),
      });
      dataFromOperate.setDeleteVisible(false);
      handleOk(dataFromOperate.item.useRecordId);
    });
  };
  const deleteShare = () => {
    shareApi.deleteNSShare(dataFromOperate.item.recordId, forMe).then(() => {
      // @ts-ignore
      message.success({
        content: getIn18Text('YIYICHU'),
      });
      dataFromOperate.setDeleteVisible(false);
      handleOk(dataFromOperate.item.recordId);
    });
  };
  const deleteNotShare = () => {
    if (deleteLoad) return;
    setDeleteLoad(true);
    let fileIds: number[] = [];
    let dirIds: number[] = [];
    if (extensionType === 'dir') {
      dirIds = [dataFromOperate.item.id];
    } else {
      fileIds = [dataFromOperate.item.id];
    }
    diskApi
      .doDeleteItems({
        type,
        dirIds,
        fileIds,
      })
      .then(({ data }) => {
        dataFromOperate.setDeleteVisible(false);
        if (data && data.failInfo && data.failInfo[0].code === 10202) {
          // @ts-ignore
          message.fail({
            content: getIn18Text('SHANCHUSHIBAI'),
          });
          setCanDeleteVisible(true);
          return;
        }
        // @ts-ignore
        message.success({
          content: getIn18Text('YISHANCHU'),
        });
        handleOk(dataFromOperate.item.id);
      })
      .finally(() => {
        setDeleteLoad(false);
      });
  };
  const okText = sideTab === 'recently' ? getIn18Text('YICHU') : getIn18Text('SHANCHU');
  let title = sideTab === 'recently' ? getIn18Text('SHIFOUCONGZUIJIN') : getIn18Text('QUEDINGSHANCHUGAI');
  const isPublicPrivateTab = sideTab === 'public' || sideTab === 'private';
  // 更换title 文件展示为文件数量
  // 新接口没有fileCount字段，需要主动调用老接口获取fileCount，所以在个人空间、企业空间 获取老接口数据更新提示信息
  if (isPublicPrivateTab) {
    const {
      item: { id, spaceId },
    } = dataFromOperate;
    if (extensionType === 'dir') {
      // 为了减少请求次数，如果已经请求过就不在请求
      if (!fatchTag && isModalVisible) {
        diskApi.doGetNSFolderInfo({ type: sideTab === 'public' ? 'ent' : 'personal', dirId: id, spaceId }).then(data => {
          setFileCount(data.fileCount);
        });
        setFetchTag(true);
      }
      title = fileCount > 0 ? `要删除该文件夹及包含的${fileCount}个子项吗？` : getIn18Text('YAOSHANCHUGAIWEN11');
    } else {
      title = getIn18Text('YAOSHANCHUGAIWEN');
    }
  }
  return (
    <>
      {/* 个人 企业空间的删除 */}
      <Modal
        className={style.modal}
        okText={okText}
        okType="danger"
        closable={false}
        confirmLoading={deleteLoad}
        maskClosable={false}
        width="450px"
        visible={isModalVisible && type !== 'personalShare'}
        onOk={deleteAction}
        onCancel={() => {
          dataFromOperate.setDeleteVisible(false);
        }}
      >
        <div className={style.title}>
          <ErrorIcon className="error-icon" />
          <span>{title}</span>
        </div>
        <div className={classnames(style.content, !isPublicPrivateTab ? style.hidden : '')}>{getIn18Text('WENJIANJIANGZAIHUI')}</div>
      </Modal>
      {/* 分享的删除 */}
      <Modal
        className={classnames(style.modal)}
        okText={getIn18Text('YICHU')}
        okType="danger"
        closable={false}
        confirmLoading={deleteLoad}
        maskClosable={false}
        width="450px"
        visible={isModalVisible && type === 'personalShare'}
        onOk={() => {
          deleteAction();
        }}
        onCancel={() => {
          dataFromOperate.setDeleteVisible(false);
        }}
      >
        <div className={classnames(style.title)}>
          <ErrorIcon className="error-icon" />
          <span>{getIn18Text('SHIFOUCONGYUWO')}</span>
        </div>
        <div className={classnames(style.content)}>{getIn18Text('YICHUHOU\uFF0CGAI')}</div>
      </Modal>

      <Modal
        className={classnames(style.modal, style.canDelete)}
        okText={getIn18Text('ZHIDAOLE')}
        closable={false}
        width="450px"
        visible={canDeleteVisible}
        onOk={() => {
          setCanDeleteVisible(false);
        }}
        onCancel={() => {
          setCanDeleteVisible(false);
        }}
      >
        <div className={classnames(style.title)}>
          <ErrorIcon className="error-icon" />
          <span>{getIn18Text('WUFASHANCHU')}</span>
        </div>
        <div className={classnames(style.content)}>{getIn18Text('GAIWENJIANJIAXIA')}</div>
      </Modal>
    </>
  );
};
export default Delete;
