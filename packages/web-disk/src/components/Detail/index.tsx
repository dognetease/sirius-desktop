import React, { CSSProperties, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { apis, apiHolder as api, NetStorageApi, NSFileContent, NSDirContent, NSRecentlyUseRecord } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import IconCard from '@web-common/components/UI/IconCard';
import { formatFileSize } from '@web-common/utils/file';
import { formatAuthority, timeFormatTwo, getFileType, getFileIcon } from '../../utils';
import { tabInterfaceMap } from '../../disk';
import style from './index.module.scss';
import { getIn18Text } from 'api';
const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const userNameWithSymbel = name => (name ? `${name}, ` : '');
interface Props {
  itemOrg?: NSDirContent | NSFileContent | NSRecentlyUseRecord | any;
  isModalVisible: boolean;
  setVisible: (val) => void;
  type?: string;
  spaceId?: number;
  maskStyle?: CSSProperties;
}
const Detail: React.FC<Props> = ({ itemOrg, isModalVisible, setVisible, type, spaceId, maskStyle }) => {
  const [item, setItem] = useState<NSDirContent | NSFileContent | NSRecentlyUseRecord | null>(null);
  useEffect(() => {
    if (!(itemOrg as any)?.id && !(itemOrg as any)?.useRecordId && !(itemOrg as any)?.resourceId) return;
    if (!isModalVisible) return;
    const spaceIdC = (itemOrg as NSDirContent).spaceId || spaceId;
    const interfaceType = type === 'recently' ? 'personalShare' : tabInterfaceMap[type!];
    if (itemOrg.extensionType === 'dir') {
      diskApi
        .doGetNSFolderInfo({ type: interfaceType, dirId: itemOrg.id, spaceId: spaceIdC })
        .then(data => {
          setItem(data);
        })
        .catch(error => {
          console.log(getIn18Text('HUOQUWENJIANJIA'), error);
          setTimeout(() => setVisible(false), 500);
        });
    } else {
      const dirId = itemOrg.parentId || itemOrg.resourceParentId;
      const fileId = itemOrg.id || itemOrg.resourceId;
      diskApi
        .doGetNSFileInfo({
          type: interfaceType,
          dirId,
          fileId,
          spaceId: spaceIdC,
        })
        .then(data => {
          setItem(data);
        })
        .catch(error => {
          console.log(getIn18Text('HUOQUWENJIANXIANG'), error);
          setTimeout(() => setVisible(false), 500);
        });
    }
  }, [isModalVisible]);
  let content;
  if (!item) {
    content = (
      <div className={style.spin}>
        <Spin />
      </div>
    );
  } else {
    const isDir = item.extensionType === 'dir';
    const sizeLimit = isDir ? (item as NSDirContent).sizeLimit : -1;
    const fileType = isDir ? '' : getFileType(item as NSFileContent);
    const fileIcon = isDir ? 'dir' : getFileIcon(item as NSFileContent);
    const isDoc = item.fileType === 'doc' || item.fileType === 'excel';
    content = (
      <div>
        <div className={style.header}>
          <IconCard type={fileIcon as any} width="48px" height="48px" />
          <span className={style.title}>{item.name}</span>
        </div>
        {isDir && (
          <div className={style.itemRow}>
            <span className={style.desc}>{getIn18Text('NEIRONG')}</span>
            {(item as NSDirContent).fileCount}
            {getIn18Text('GEZIXIANG')}
          </div>
        )}
        {!isDir && (
          <div className={style.itemRow}>
            <span className={style.desc}>{getIn18Text('LEIXING')}</span>
            {fileType}
          </div>
        )}
        {!isDir && (
          <div className={style.itemRow}>
            <span className={style.desc}>{getIn18Text('DAXIAO')}</span>
            {formatFileSize((item as NSFileContent).size, 1024)}
          </div>
        )}
        {isDir && (
          <div className={style.itemRow}>
            <span className={style.desc}>{sizeLimit === -1 ? getIn18Text('DAXIAO') : getIn18Text('RONGLIANG')}</span>
            {formatFileSize((item as NSDirContent).totalSize, 1024)}
            {sizeLimit === -1 ? '' : `/${formatFileSize(sizeLimit, 1024)}`}
          </div>
        )}
        <div className={style.itemRow}>
          <span className={style.desc}>{getIn18Text('WEIZHI11')}</span>
          <span className={style.content}>{item.path}</span>
        </div>
        <div className={style.itemRow}>
          <span className={style.desc}>{getIn18Text('CHUANGJIAN')}</span>
          <span className={style.content}>
            {userNameWithSymbel(item.createUserNickName)}
            {timeFormatTwo(item.createTime, true)}
          </span>
        </div>
        <div className={style.itemRow}>
          <span className={style.desc}>{getIn18Text('XIUGAI')}</span>
          <span className={style.content}>
            {userNameWithSymbel(item.modifyUserNickName)}
            {timeFormatTwo(item.updateTime, true)}
          </span>
        </div>
        {item.authorityDetail && (
          <div className={style.itemRow} hidden={!item.authorityDetail}>
            <span className={style.desc}>{getIn18Text('QUANXIAN')}</span>
            {formatAuthority(item.authorityDetail.roleInfos, item.extensionType, 'simple')}
          </div>
        )}
      </div>
    );
  }
  return (
    <Modal
      className={style.modal}
      footer={null}
      closeIcon={<div className={`dark-invert ${style.modalClose}`} />}
      okType="danger"
      maskStyle={maskStyle}
      width="360px"
      visible={isModalVisible}
      onCancel={() => {
        setVisible(false);
        setItem(null);
      }}
    >
      {content}
    </Modal>
  );
};
export default Detail;
