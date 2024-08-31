import React, { useState, useCallback, useEffect } from 'react';
import { Menu, Dropdown, Input, Form, Button } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import DownOutlined from '@ant-design/icons/DownloadOutlined';
import styles from './index.module.scss';
import { NoAuthority } from '../Preview/preview';
import { ApplyStatus } from './ApplyStatus';
import { apiHolder, apis, NetStorageApi, ResponseGetApplyInfo, ApplyRole, DataTrackerApi } from 'api';
import { UserCardPopover } from '../UserCard';
import { getIn18Text } from 'api';
export interface ApplyInfoProps {
  type: 'doc' | 'sheet' | string;
  info: ResponseGetApplyInfo;
}
const { TextArea } = Input;
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const trackerApi = apiHolder.api.requireLogicalApi('dataTrackerApiImp') as DataTrackerApi;
const TrackApplyRoleCN = {
  ROLE_USER_SHOW: 'view',
  ROLE_USER_DOWNLOAD: 'view&download',
  ROLE_USER_EDIT: 'edit',
  ROLE_ADMIN: 'manage',
};
export const ApplyRoleCN = {
  ROLE_USER_SHOW: getIn18Text('KECHAKANQUANXIAN'),
  ROLE_USER_DOWNLOAD: getIn18Text('KECHAKAN/XIA'),
  ROLE_USER_EDIT: getIn18Text('KEBIANJIQUANXIAN'),
  ROLE_ADMIN: getIn18Text('KEGUANLIQUANXIAN'),
};
export const ApplyInfo: React.FC<ApplyInfoProps> = ({ type, info: { approveUserId, approveUserName, resourceId, resourceType } }) => {
  const [applyRole, setApplyRole] = useState<ApplyRole>('ROLE_USER_SHOW');
  const [applySuccess, setApplySuccess] = useState<boolean>(false);
  const [sendRequest, setSendRequest] = useState<boolean>(false);
  const [form] = Form.useForm();
  const menu = (
    <Menu selectedKeys={[applyRole]} onClick={({ key }) => setApplyRole(key as ApplyRole)}>
      {Object.keys(ApplyRoleCN).map(key => (
        <Menu.Item key={key}>{ApplyRoleCN[key]}</Menu.Item>
      ))}
    </Menu>
  );
  function onFinish({ applyMsg }) {
    setSendRequest(true);
    diskApi
      .applyAuth({
        resourceId,
        resourceType,
        applyMsg,
        applyRole,
        approveUserId,
      })
      .then(res => {
        if (res) {
          setApplySuccess(true);
        } else {
          message.error(getIn18Text('QUANXIANSHENQINGSHI'));
        }
        trackerApi.track('pc_disk_request_access', {
          permission: TrackApplyRoleCN[applyRole],
          way: 'NoPermission',
          type,
        });
      })
      .finally(() => {
        setSendRequest(false);
      });
  }
  return applySuccess ? (
    <ApplyStatus info={{ approveUserId, approveUserName, applyRole: ApplyRoleCN[applyRole] }} />
  ) : (
    <div className={styles.permissionApplyComp}>
      <NoAuthority noTitle={true} />
      <div className={styles.message}>{getIn18Text('MEIYOUFANGWENQUAN')}</div>
      <div className={styles.hint}>
        <span>{getIn18Text('NIKEYIXIANGGUAN')}</span>
        <UserCardPopover userId={approveUserId} placement={'right'}>
          <span className={styles.highlight}>{approveUserName}</span>
        </UserCardPopover>
        <span>{getIn18Text('SHENQING')}</span>
        <Dropdown overlay={menu}>
          <div className={styles.highlight}>
            {ApplyRoleCN[applyRole]}
            <DownOutlined />
          </div>
        </Dropdown>
      </div>
      <div></div>
      <Form form={form} name="basic" autoComplete="off" onFinish={onFinish}>
        <Form.Item name="applyMsg" rules={[{ max: 140, message: getIn18Text('ZUIDUOSHURU1') }]}>
          <TextArea autoSize={{ minRows: 1, maxRows: 3 }} bordered placeholder={getIn18Text('TIANJIABEIZHU\uFF08')} cols={50} />
        </Form.Item>
        <Form.Item>
          <div className={styles.submitBtnWrapper}>
            <Button type="primary" onClick={() => form.submit()} loading={sendRequest}>
              {getIn18Text('FASONGQINGQIU')}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};
