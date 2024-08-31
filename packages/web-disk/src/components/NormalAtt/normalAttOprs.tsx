import React, { useState } from 'react';
import { Tooltip, Dropdown, Menu } from 'antd';
import {
  apiHolder as api,
  apis,
  MailApi,
  MailAttachment,
  MailContentType,
  MailEntryModel,
  MailFileAttachModel,
  WriteLetterPropType,
  WriteMailInitModelParams,
} from 'api';
import styles from './normalAttOprs.module.scss';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import IconCard from '@web-common/components/UI/IconCard';
import { getIn18Text } from 'api';
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const eventApi = api.api.getEventApi();
interface Props {
  item: MailAttachment;
  downloadAction: (item) => void;
  storePriSpaceAction: (item) => void;
  getDownloadUrl: (item: MailAttachment) => string;
  setRowHoverId: (val) => void;
}
const normalAttOprs: React.FC<Props> = props => {
  const { item, downloadAction, storePriSpaceAction, setRowHoverId, getDownloadUrl } = props;
  const [moreOptActive, setMoreOptActive] = useState<boolean>(false);
  // 发送
  const toSend = async () => {
    const { attn, attsize, id, partId } = item;
    const downloadUrl = getDownloadUrl(item);
    const payloadObj: MailFileAttachModel = {
      expired: 0,
      fileName: attn,
      fileSize: attsize,
      // id: -1,
      type: 'fromInternalMail',
      midOfSourceMail: id,
      partOfSourceMail: partId,
      fileUrl: downloadUrl,
      isCloud: false,
    };
    const params: WriteMailInitModelParams = {
      mailType: 'common',
      writeType: 'common',
      extraOperate: `addNormalAtt payload:${JSON.stringify(payloadObj)}`,
    };
    mailApi.callWriteLetterFunc(params);
  };
  const onVisibleChange = (visible: boolean) => {
    setMoreOptActive(visible);
    setRowHoverId(visible ? item.identity : '');
  };
  const ckMenu = () => {
    setMoreOptActive(false);
    setRowHoverId('');
  };
  const oprsCont = (
    <Menu className={styles.oprsCont} onClick={ckMenu}>
      <Menu.Item key="download" className={styles.popItem} data-test-id="disk_table_att_operation_download_btn" onClick={() => downloadAction(item)}>
        {getIn18Text('XIAZAI')}
      </Menu.Item>
      <Menu.Item key="store" className={styles.popItem} data-test-id="disk_table_att_operation_store_btn" onClick={() => storePriSpaceAction(item)}>
        {getIn18Text('ZHUANCUNZHIGEREN')}
      </Menu.Item>
    </Menu>
  );
  return (
    <div className={styles.cloudAttOprs}>
      <Tooltip title={getIn18Text('YOUJIANFASONG')} data-test-id="disk_table_att_operation_attach_to_mail_btn" placement="top">
        <div className="opeItem dark-invert" onClick={toSend}>
          <ReadListIcons.SendFolderSvg />
        </div>
      </Tooltip>

      <Dropdown overlay={oprsCont} trigger={['click']} placement="bottomRight" onVisibleChange={onVisibleChange}>
        <div className={`opeItem dark-invert ${moreOptActive ? 'active' : ''}`} data-test-id="disk_table_att_more_operation_btn">
          <IconCard type="more" stroke="#262A33" fillOpacity={0.5} />
        </div>
      </Dropdown>
    </div>
  );
};
export default normalAttOprs;
