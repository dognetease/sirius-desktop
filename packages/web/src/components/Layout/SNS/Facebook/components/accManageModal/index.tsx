import { getIn18Text } from 'api';
import React, { useEffect, useState } from 'react';
import { useMap } from 'react-use';
import { Button, Spin, TableProps } from 'antd';
import classnames from 'classnames';
import { apiHolder, apis, BoundResults, FacebookApi } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { FacebookActions } from '@web-common/state/reducer';
import { useActions } from '@web-common/state/createStore';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { useAppSelector } from '@web-common/state/createStore';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { ColumnsType, SorterResult } from 'antd/es/table/interface';
import { facebookTracker } from '@/components/Layout/SNS/tracker';
import { getTransText } from '@/components/util/translate';
import { useResponsiveTable } from '@/hooks/useResponsiveTable';
import ConfirmIconSure from '@/images/icons/edm/confirm.png';
import { ReactComponent as AddIcon } from '@/images/icons/edm/fb-add-icon.svg';
import { ReactComponent as FbOauth } from '@/images/icons/edm/fb-oauth.svg';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';

import styles from './index.module.scss';

interface IProps {
  visible: boolean;
  onCancel: () => void;
  onOk?: () => void;
}

const facebookApi = apiHolder.api.requireLogicalApi(apis.facebookApiImpl) as unknown as FacebookApi;

export const AccManageModal: React.FC<IProps> = props => {
  const { visible, onCancel, onOk } = props;
  const { setFacebookModalShow, freshFacebookPages } = useActions(FacebookActions);
  const [accountList, setAccountList] = useState<BoundResults[]>([]);
  const [pageParams, { set, setAll }] = useMap<{ pageNumber: number; pageSize: number; total?: number }>({ pageNumber: 1, pageSize: 10, total: 0 });
  const goBindFacebookAccount = (type: 'bind' | 'rebind') => {
    facebookTracker.trackPagesAccount(type);
    setFacebookModalShow({ accModal: false, offsiteModal: true, source: 'accManage' });
  };
  const [loading, setLoading] = useState<boolean>(false);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const { fresh } = useAppSelector(state => state.facebookReducer);
  const [curId, setCurId] = useState<string>('');
  const { layout, growRef, scrollY } = useResponsiveTable();

  const handleUnbind = (record: BoundResults) => {
    facebookTracker.trackPagesAccount('unbind');
    setFacebookModalShow({ accModal: false });
    Modal.confirm({
      title: `${getTransText('QUDINGXUYAOJIEBANG-1')} ${record.faAccount} ${getTransText('QUDINGXUYAOJIEBANG-2')} `,
      icon: <img src={ConfirmIconSure} alt="" />,
      className: `${styles.fbConfirm}`,
      content: getTransText('JIEBANGZHANGHAOHOU'),
      okText: getTransText('JIEBANG'),
      cancelText: getTransText('QUXIAO'),
      cancelButtonProps: { style: { background: '#EBEDF2', border: 'none' } },
      onOk: () => handleOk(record),
      onCancel: () => {
        setFacebookModalShow({ accModal: true });
      },
    });
  };

  const handleOk = (record: BoundResults) => {
    setFacebookModalShow({ accModal: true });
    setLoading(true);
    setCurId(record.id);
    try {
      facebookApi
        .cancelBindAccount({ faAccountId: record.id })
        .then(() => {
          message.success({
            content: getTransText('ZHANGHAOYIJIEBANG'),
          });
        })
        .then(() => {
          freshFacebookPages({ fresh: !fresh });
          fetchAccountList({ pageNumber: 1, pageSize: 10 });
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error) {
      message.error({ content: getTransText('ZHANGHAOJIEBANGSHIBAI') });
    }
  };

  const fetchAccountList = (params: { pageNumber: number; pageSize: number; sort?: string }) => {
    setTableLoading(true);
    facebookApi
      .getBondAccount(params)
      .then(res => {
        const { results, page, size, total } = res;
        setAccountList(results);
        setAll({ pageNumber: page + 1, pageSize: size, total });
      })
      .then(() => setTableLoading(false))
      .catch(err => console.log(err))
      .finally(() => {
        setAll(params);
      });
  };

  useEffect(() => {
    if (visible) {
      fetchAccountList({ pageNumber: 1, pageSize: 10 });
    }
  }, [visible]);

  const columns: ColumnsType<BoundResults> = [
    {
      title: <span className={styles.columnsPadding}>{getTransText('FACEBOOKZHANGHAO')}</span>,
      dataIndex: 'faAccount',
      key: 'faAccount',
      width: 178,
      render: (text: string, record: BoundResults) => (
        <span className={classnames(styles.faAccount, styles.columnsPadding)}>
          <img src={record.faAccountPicture} />
          {text}
        </span>
      ),
    },
    // {
    // 	title: '好友数',
    // 	dataIndex: 'friendsCount',
    // 	key: 'friendsCount',
    // 	render: (text: string) => <span className={styles.numClass}>{text}</span>,
    // },
    {
      title: getTransText('GONGONGZHUYESHULIANG'),
      dataIndex: 'pageCount',
      key: 'pageCount',
      width: 90,
      render: (text: string) => <span className={styles.numClass}>{text}</span>,
    },
    {
      title: getTransText('FACEBOOKBANGDINGREN'),
      dataIndex: 'bindUser',
      key: 'bindUser',
      width: 178,
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: getTransText('BANGINGSHIJIAN'),
      dataIndex: 'bindTime',
      key: 'bindTime',
      width: 170,
      sorter: true,
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: getTransText('BANGDINGZHUANGTAI'),
      dataIndex: 'bindStatus',
      key: 'bindStatus',
      width: 80,
      render: (text: string, _: BoundResults) => (
        <span>{text === getIn18Text('YIBANGDING') ? <span>{text}</span> : <span className={styles.bindStatus}>{text}</span>}</span>
      ),
    },
    {
      title: getTransText('CAOZUO'),
      dataIndex: 'action',
      key: 'action',
      width: 105,
      render: (_: string, record: BoundResults) => (
        <span className={styles.action}>
          {record.bindStatus === getIn18Text('YIBANGDING') ? (
            <PrivilegeCheck accessLabel="UNBIND" resourceLabel="FACEBOOK_ACCOUNT">
              <Spin spinning={curId === record.id && loading} delay={500}>
                <span onClick={() => handleUnbind(record)}>{getTransText('JIEBANG')}</span>
              </Spin>
            </PrivilegeCheck>
          ) : (
            <span className={styles.reAuth} onClick={() => goBindFacebookAccount('rebind')}>
              <FbOauth />
              {getTransText('CHONGXINBANGDING')}
            </span>
          )}
        </span>
      ),
    },
  ];

  const handleOnchange = (page: number, pageSize?: number | undefined) => {
    fetchAccountList({ pageNumber: page, pageSize: pageSize ?? pageParams.pageSize });
  };

  const handleTableChange: TableProps<BoundResults>['onChange'] = (pagination, _filters, sorter) => {
    let sort: string = '';
    let _sorter = sorter as SorterResult<BoundResults>;
    let order = _sorter.order ? (_sorter.order.startsWith('asce') ? 'asc' : 'desc') : '';
    if (_sorter.field && _sorter.order) {
      sort = `${_sorter.field},${order}`;
    }
    fetchAccountList({
      pageNumber: pagination.current as number,
      pageSize: pagination.pageSize === pageParams.pageSize ? (pagination.pageSize as number) : 1,
      sort,
    });
  };

  return (
    <Modal visible={visible} title={getTransText('FACEBOOKZHANGHAOGUANLI')} onCancel={onCancel} onOk={onOk} footer={null} width={1000} className={styles.accModal}>
      <div className={styles.notice}>
        {' '}
        <img src={ConfirmIconSure} alt="" />
        {getTransText('ZHANGHAOSHIXIAOTISHI')}
      </div>
      <div className={classnames(layout.grow, styles.accContainer)} ref={growRef}>
        <Button className={styles.addFBAcc} icon={<AddIcon />} onClick={() => goBindFacebookAccount('bind')}>
          {getTransText('TIANJIAFACEBOOKZHANGHAO')}
        </Button>
        <Table
          className="edm-table customs-scroll"
          columns={columns}
          rowClassName={(_record, index) => (index % 2 == 0 ? `${styles.odd}` : `${styles.even}`)}
          dataSource={accountList}
          loading={tableLoading}
          scroll={{
            x: 'max-content',
            y: scrollY,
          }}
          pagination={{
            size: 'small',
            total: pageParams.total,
            pageSize: pageParams.pageSize,
            current: pageParams.pageNumber,
            pageSizeOptions: ['10', '20', '50', '100'],
            className: 'pagination-wrap',
            showSizeChanger: true,
            showQuickJumper: true,
            defaultCurrent: 1,
            onChange: handleOnchange,
          }}
          onChange={handleTableChange}
        />
      </div>
    </Modal>
  );
};
