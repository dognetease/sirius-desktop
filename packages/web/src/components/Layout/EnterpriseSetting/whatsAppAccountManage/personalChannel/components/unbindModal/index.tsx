import React, { useEffect, useState } from 'react';
import { Modal, Tooltip } from 'antd';
import { api, apis, InsertWhatsAppApi, ChannelBindItem, ChannelListItem } from 'api';
import classnames from 'classnames';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { ColumnsType } from 'antd/lib/table';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import WarningIcon from '@/components/Layout/EnterpriseSetting/whatsAppAccountManage/personalChannel/icons/warning/warning';
import styles from './style.module.scss';

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

interface Props {
  visible: boolean;
  channelInfo?: ChannelListItem;
  onModalClose: (refresh: boolean) => void;
}

interface UnbindTableColumns {
  whatsAppNumber: string;
  channelId: string;
  whatsApp: string;
  leftUnbindNum: number;
}

const UnbindModal: React.FC<Props> = ({ visible, channelInfo, onModalClose }) => {
  const [bindList, setBindList] = useState<ChannelBindItem[]>([]);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(false);

  const onUnbind = (channelId: string, whatsApp: string, disabled?: boolean) => {
    if (disabled) {
      return;
    }
    setRefresh(true);
    setLoading(true);
    whatsAppApi
      .unbindChannel({ channelId, whatsApp })
      .then(() => {
        Toast.success('已成功解除绑定');
        const newList = bindList.filter(v => v.channelId !== channelId && v.whatsApp !== whatsApp);
        setBindList(newList);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getActionButton = (channelId: string, whatsApp: string, disabled?: boolean) => (
    <span className={classnames([styles.actionBtn, disabled ? styles.disabled : ''])} onClick={() => onUnbind(channelId, whatsApp, disabled)}>
      解绑
    </span>
  );

  const columns: ColumnsType<UnbindTableColumns> = [
    {
      title: 'WhatsApp号码',
      dataIndex: 'whatsAppNumber',
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, row) => {
        const disabled = row.leftUnbindNum <= 0;
        if (disabled) {
          return (
            <Tooltip title="解绑次数已达到上限，请联系销售人员" placement="topRight" overlayClassName="wa-unbind-tooltip">
              {getActionButton(row.channelId, row.whatsApp, disabled)}
            </Tooltip>
          );
        }
        return getActionButton(row.channelId, row.whatsApp, disabled);
      },
    },
  ];

  const onClose = () => {
    onModalClose(refresh);
    setTimeout(() => {
      setRefresh(false);
      setLoading(false);
    }, 0);
    setBindList([]);
  };

  // 初始化
  useEffect(() => {
    if (visible) {
      setBindList(channelInfo?.bindWhatsApps || []);
    }
  }, [channelInfo, visible]);

  return (
    <Modal
      visible={visible}
      width={540}
      closeIcon={<CloseIcon className="dark-invert" />}
      onCancel={() => onClose()}
      footer={null}
      bodyStyle={{ padding: '20px' }}
      maskClosable={false}
      maskStyle={{ left: 0 }}
      centered
    >
      <div className={styles.container}>
        <div className={styles.title}>解除绑定</div>
        <div className={styles.intro}>
          <WarningIcon />
          <span className={styles.introText}>解除绑定有次数限制，每个WhatsApp账号可解绑5次，超过上限请联系销售人员增购权限数量</span>
        </div>
        {bindList.length > 0 ? (
          <Table className={styles.unbindTable} columns={columns} dataSource={bindList} pagination={false} scroll={{ y: 206 }} loading={loading} />
        ) : (
          <div className={styles.noDataContainer}>
            <div className={styles.noData}>
              <div className={styles.noDataIcon} />
              <div className={styles.noDataText}>暂无可解除绑定的账号</div>
            </div>
          </div>
        )}
        {/* <div className={styles.footer}>
          <Button btnType="primary" onClick={() => onClose()}>
            关闭
          </Button>
        </div> */}
      </div>
    </Modal>
  );
};
export default UnbindModal;
