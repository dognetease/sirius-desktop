import React, { useState } from 'react';
import { Button, message, Modal, Spin } from 'antd';
import { CustomerEmailEmailList, apiHolder, apis, CustomerDiscoveryApi, SystemApi, MailApi, CustomerEmailAuthManager } from 'api';

import style from './style.module.scss';

interface ManagerInfo {
  list: Array<CustomerEmailAuthManager>;
  loading: boolean;
}

const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
const systemApi: SystemApi = apiHolder.api.getSystemApi();
const isElectron = systemApi.isElectron();

/**
 * 预览邮件
 * @param snapshot_id
 */
export const readEmailDetail = async (payload: { snapshotId: string; condition: string; mainResourceId: string }) => {
  const { snapshotId, condition, mainResourceId } = payload;
  const previewLink = await customerDiscoveryApi.getCustomerEmailPreviewUrl(condition, snapshotId, mainResourceId, 'UNI_TABLE');
  if (previewLink) {
    if (isElectron) {
      systemApi.createWindowWithInitData('iframePreview', {
        eventName: 'initPage',
        eventData: {
          iframeSrc: previewLink,
        },
      });
    } else {
      window.open(previewLink);
    }
  }
};

export const replyEmail = (payload: { mail_id: string; isAll: boolean }) => {
  const { mail_id, isAll } = payload;
  mailApi.doReplayMail(mail_id, isAll);
};

export const transEmail = (payload: { mail_id: string }) => {
  const { mail_id } = payload;
  mailApi.doForwardMail(mail_id);
};

const renderEmailRelation = (contactEmails: CustomerEmailEmailList, useGrantInfo = false) => {
  let fromList;
  let toList;
  let totalSize;
  if (useGrantInfo) {
    fromList = contactEmails?.grantRecord?.fromNicknameSet ?? [];
    toList = contactEmails?.grantRecord?.toNicknameSet ?? [];
    totalSize = contactEmails?.grantRecord?.totalEmailNum ?? 0;
  } else {
    fromList = contactEmails?.need_permission_publisher ?? [];
    toList = contactEmails?.need_permission_receiver ?? [];
    totalSize = contactEmails?.hide_size ?? 0;
  }
  return (
    <div className={style.authInfo}>
      <span>包含</span>
      {
        // eslint-disable-next-line
        (fromList || []).map((name, index) => {
          const nickName = String(name).trim();
          if (index !== 0) {
            return <span className={style.nickName}>,{nickName}</span>;
          }
          return <span className={style.nickName}>{nickName}</span>;
        })
      }
      <span>与</span>
      {
        // eslint-disable-next-line
        (toList || []).map((name, index) => {
          const nickName = String(name).trim();
          if (index !== 0) {
            return <span className={style.nickName}>,{nickName}</span>;
          }
          return <span className={style.nickName}>{nickName}</span>;
        })
      }
      <span>的</span>
      <span className={style.num}>{totalSize ?? '--'}</span>
      <span>封往来邮件内容</span>
    </div>
  );
};

interface EmailAuthModalType {
  contactEmails: CustomerEmailEmailList;
  onClose: () => void;
}
/**
 * 权限查看进度
 */
export const EmailAuthModal = (props: EmailAuthModalType) => {
  const { contactEmails, onClose } = props;
  const [managerInfo, setManager] = useState<ManagerInfo>({ list: [], loading: false });

  const fetchManagerList = async () => {
    if (managerInfo?.list?.length) {
      return;
    }
    try {
      setManager({ list: [], loading: true });
      const managers = await customerDiscoveryApi.getAuthManagerList();
      setManager({ list: managers, loading: false });
    } catch {
      setManager({ ...managerInfo, loading: false });
    }
  };
  return (
    <Modal
      title="授权申请"
      visible={true}
      centered
      onCancel={() => onClose()}
      footer={
        <Button type="primary" onClick={() => onClose()}>
          确定
        </Button>
      }
    >
      {renderEmailRelation(contactEmails, true)}
      <div>
        已向
        <span className={style.linkBtn} onClick={fetchManagerList}>
          管理员
        </span>
        发起申请，审批通过后可查看
      </div>
      <div className={style.managerList}>
        {managerInfo.loading ? (
          <Spin />
        ) : (
          <>
            {managerInfo.list.length > 0 ? <span>管理员：</span> : ''}
            {(managerInfo.list || []).map((manager, index) => {
              const nickName = String(manager.accNickname).trim();
              if (index !== 0) {
                return <span className={style.nickName}>,{nickName}</span>;
              }
              return <span className={style.nickName}>{nickName}</span>;
            })}
          </>
        )}
      </div>
    </Modal>
  );
};

/**
 * 申请查看权限
 */
export const createAuthorization = (
  payload: { contactEmails: CustomerEmailEmailList; mainResourceId: string; relationDomain: string; relationName: string; condition: string },
  updateInfo: (isUpdate: boolean) => void
) => {
  const { contactEmails, mainResourceId, relationDomain, relationName, condition } = payload;
  Modal.confirm({
    centered: true,
    content: renderEmailRelation(contactEmails),
    onOk: async () => {
      try {
        await customerDiscoveryApi.createAuth({
          relationDomain: relationDomain as string,
          relationName: relationName as string,
          relationId: mainResourceId,
          relationType: condition,
          resources: contactEmails.need_permission,
        });
        message.success('申请成功');
        updateInfo(true);
      } finally {
        // lock = false;
      }
    },
    onCancel: () => {
      updateInfo(false);
    },
  });
};
