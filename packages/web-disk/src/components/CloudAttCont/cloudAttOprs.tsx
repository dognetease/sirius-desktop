import React, { useState, useEffect } from 'react';
import { Tooltip, Dropdown, Modal, Menu } from 'antd';
import classnames from 'classnames';
import { apiHolder as api, apis, CloudAtt, DataStoreApi, MailApi, MailFileAttachModel, WriteMailInitModelParams } from 'api';
import styles from './cloudAttOprs.module.scss';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import IconCard from '@web-common/components/UI/IconCard';
import Alert from '@web-common/components/UI/Alert/Alert';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import { DiskTipKeyEnum } from '@web-disk/disk';
import { getIn18Text } from 'api';

const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const dataStoreApi: DataStoreApi = api.api.getDataStoreApi() as DataStoreApi;
interface Props {
  item: CloudAtt;
  delAction: (item) => void;
  downloadAction: (item) => void;
  renewalAction: (item, index) => void;
  storePriSpaceAction: (item) => void;
  setRowHoverId: (val) => void;
  renewSupportShow: boolean;
  setRenewSupportShow: (val) => void;
  index: number;
}

const XUQI_TEXT = getIn18Text('XUQI');

const cloudAttOprs: React.FC<Props> = props => {
  const { item, delAction, downloadAction, storePriSpaceAction, renewalAction, setRowHoverId, renewSupportShow, setRenewSupportShow, index } = props;
  const [moreOptActive, setMoreOptActive] = useState<boolean>(false);
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();

  // 发送
  const toSend = async () => {
    if (item.expireTime != null && item.expireTime !== 0 && item.expireTime < Date.now()) {
      // 过期提示
      return Alert.error({
        title: getIn18Text('WENJIANBUCUNZAI'),
        content: null,
      });
    }
    const { fileName, fileSize, downloadUrl, identity, expireTime } = item;
    const payloadObj: MailFileAttachModel = {
      expired: expireTime,
      downloadContentId: downloadUrl,
      downloadId: downloadUrl,
      fileName,
      fileSize,
      id: identity,
      type: 'netUrl',
      fileUrl: downloadUrl,
      isCloud: true,
    };
    const params: WriteMailInitModelParams = {
      mailType: 'common',
      writeType: 'common',
      extraOperate: `addCloudAtt payload:${JSON.stringify(payloadObj)}`,
    };
    mailApi.callWriteLetterFunc(params);
  };

  const toDel = () => {
    Modal.confirm({
      width: 400,
      title: getIn18Text('QUEDINGYAOSHANCHU14'),
      content: <div className={styles.delModelCont}>{getIn18Text('YUNFUJIANWENJIAN')}</div>,
      okText: getIn18Text('QUEDING'),
      cancelText: getIn18Text('QUXIAO'),
      centered: true,
      onOk: () => {
        delAction(item);
      },
    });
  };

  const onVisibleChange = (visible: boolean) => {
    setMoreOptActive(visible);
    setRowHoverId(visible ? item.identity : '');
  };

  const ckMenu = () => {
    setMoreOptActive(false);
    setRowHoverId('');
  };

  // 已知续期
  const renewIknow = () => {
    dataStoreApi.put(DiskTipKeyEnum.RENEW_CLOUD_ATT_SUPPORTED_KNOWED_TIP, 'true');
    setRenewSupportShow(false);
  };

  const renewSupport = (
    <div className={styles.renewSupport}>
      {getIn18Text('YUNFUJIANZHICHIXUQI')}
      <span className={styles.renewIknow} onClick={renewIknow}>
        {getIn18Text('ZHIDAOLE')}
      </span>
    </div>
  );

  useEffect(() => {
    setMoreOptActive(!!renewSupportShow && index === 0);
  }, [renewSupportShow]);

  const oprsCont = (
    <Menu className={styles.oprsCont} onClick={ckMenu}>
      <Menu.Item key="download" className={styles.popItem} data-test-id="disk_table_cloud_att_operation_download_btn" onClick={() => downloadAction(item)}>
        {getIn18Text('XIAZAI')}
      </Menu.Item>
      {/* 续期按钮 */}
      <>
        {/* 旗舰版 可无限点击续期 */}
        {/* 且非永不过期（测试环境冗余 真实环境不存在） */}
        {productVersionId === 'ultimate' && item.expireTime !== 0 && (
          <Menu.Item key="renewal" data-test-id="disk_table_cloud_att_operation_xuqi_btn" className={styles.popItem} onClick={() => renewalAction(item, index)}>
            {XUQI_TEXT}
          </Menu.Item>
        )}
        {/* 个人版 禁用续期 */}
        {productVersionId === 'free' && (
          <Menu.Item key="renewal" disabled={true} className={classnames(styles.popItem, styles.renewalItem)}>
            <Tooltip title={getIn18Text('MIANFEIBANBUZHICHIXUQI')} placement="left">
              <div className={styles.renewalItemCont}>{XUQI_TEXT}</div>
            </Tooltip>
          </Menu.Item>
        )}
      </>
      <Menu.Item key="store" className={styles.popItem} data-test-id="disk_table_cloud_att_operation_store_btn" onClick={() => storePriSpaceAction(item)}>
        {getIn18Text('ZHUANCUNZHIGEREN')}
      </Menu.Item>
      <Menu.Item key="del" className={styles.popItem} data-test-id="disk_table_cloud_att_operation_del_btn" onClick={toDel}>
        {getIn18Text('CHEDISHANCHU')}
      </Menu.Item>
    </Menu>
  );

  return (
    <div className={styles.cloudAttOprs}>
      <Tooltip title={getIn18Text('YOUJIANFASONG')} placement="top">
        <div className="opeItem dark-invert" data-test-id="disk_table_operation_attach_cloud_att_to_mail_btn" onClick={toSend}>
          <ReadListIcons.SendFolderSvg />
        </div>
      </Tooltip>
      <Tooltip title={renewSupport} placement="topRight" visible={renewSupportShow && index === 0} overlayClassName={styles.renewSupportOverlay}>
        <Dropdown overlay={oprsCont} trigger={['click']} placement="bottomRight" onVisibleChange={onVisibleChange}>
          <div className={`opeItem dark-invert ${moreOptActive ? 'active' : ''}`} data-test-id="disk_table_cloud_more_operation_btn">
            <IconCard type="more" stroke="#262A33" fillOpacity={0.5} />
          </div>
        </Dropdown>
      </Tooltip>
    </div>
  );
};
export default cloudAttOprs;
