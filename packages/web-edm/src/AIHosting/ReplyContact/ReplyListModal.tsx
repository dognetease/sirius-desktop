import React, { useEffect, useState, useRef } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import SiriusPagination from '@web-common/components/UI/Pagination';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import { ModalProps, Tooltip, Menu, Dropdown } from 'antd';
import styles from './ReplyListModal.module.scss';
import { EdmSendBoxApi, apiHolder, apis, RequestOperateListV2 } from 'api';
import { openMail } from '../../detail/detailHelper';
import { getIn18Text } from 'api';
import { ReactComponent as FilterIcon } from '@/images/icons/edm/filter.svg';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
interface ReplyListModalProps {
  visible: boolean;
  onCancel: () => void;
  replyOperates: RequestOperateListV2;
}

interface TableDataItem {
  planSubject: string;
}

export const ReplyListModal = (props: ModalProps & ReplyListModalProps) => {
  const { onCancel, visible, replyOperates } = props;
  // 列表展示数据
  const [tableData, setTableData] = useState<TableDataItem[]>([]);
  // 列表数据加载状态
  const [loading, setLoading] = useState<boolean>(false);

  const [timeZone, setTimeZone] = useState('local');

  const replyColumns = [
    {
      title: getIn18Text('YOUJIANBIAOTI'),
      dataIndex: 'replyEmailInfo', //todo:
      ellipsis: {
        showTitle: false,
      },
      render(text, info) {
        return (
          <Tooltip overlay={info?.emailSubject} placement="topLeft">
            {/* openMail(info.emailInnerMid, record.edmEmailId, record.id)} */}
            <a onClick={() => openMail(info?.mid, info?.edmEmailId, info?.operateId)} style={{ cursor: info?.emailInnerMid ? 'pointer' : '' }}>
              {info?.emailSubject || '-'}
            </a>
          </Tooltip>
        );
      },
    },
    {
      title: getIn18Text('YINGXIAORENWU'),
      dataIndex: 'planSubject', //todo:
      ellipsis: {
        showTitle: false,
      },
      render(value) {
        return <span>{value}</span>;
      },
    },
    {
      title: () => {
        const menu = (
          <Menu onClick={({ key }) => setTimeZone(key)} selectedKeys={[timeZone]}>
            <Menu.Item key="local">{getIn18Text('BENDESHIJIAN')}</Menu.Item>
            <Menu.Item key="remote">{getIn18Text('DUIFANGSHIJIAN')}</Menu.Item>
          </Menu>
        );
        return (
          <div>
            {getIn18Text('HUIFUSHIJIAN')}
            <Dropdown overlay={menu} placement="bottomRight" overlayClassName="edm-filter-overlay">
              <span style={{ verticalAlign: 'middle', marginLeft: 10 }}>
                <FilterIcon />
              </span>
            </Dropdown>
          </div>
        );
      },
      dataIndex: 'lastReplyTime',
      width: 200,
    },
  ];

  const getTableData = async () => {
    // 可连续触发搜索，不判断loading
    setLoading(true);

    try {
      const res = await edmApi.getReplyOperateListV2({ ...replyOperates, hideAutoReply: true });
      setTableData(res || []);
      // updatePageInfo({ ...pageInfo, total: 0 });
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  // 筛选变化执行列表筛选搜索
  useEffect(() => {
    getTableData();
  }, [visible]);

  return (
    <Modal
      className={styles.replyListModal}
      visible={visible}
      onCancel={onCancel}
      maskClosable={false}
      destroyOnClose={true}
      width={570}
      title={getIn18Text('HUIFULIEBIAO')}
      closable={true}
      centered={true}
      footer={null}
    >
      <SiriusTable
        className={styles.table}
        loading={loading}
        rowKey={item => item.email}
        columns={replyColumns}
        dataSource={tableData}
        // onChange={updatePageInfo}
        pagination={false}
      />
    </Modal>
  );
};
