/*
 * @Author: sunmingxin
 * @Date: 2021-10-05 21:59:59
 * @LastEditTime: 2021-10-20 22:00:44
 * @LastEditors: sunmingxin
 */
import React, { useState, useEffect } from 'react';
import { Table, Button } from 'antd';
import { apiHolder, apis, CustomerApi } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import _ from 'lodash';
import style from './mailsExchanged.module.scss';
import { ReactComponent as PageClose } from '@/images/icons/edm/page-close.svg';
import { customerDataTracker } from '../../../tracker/customerDataTracker';
import { navigate } from '@reach/router';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import SelectRowAction from '../../../components/MultiSelectAction/multiSelectAction';
import useTableHeight from '../../../components/hooks/useTableHeight';
import ConvertModal from './convertModal';
import { getIn18Text } from 'api';
interface ComsProps {
  close: () => void;
  condition: 'clue' | 'company';
}
const TableList: React.FC<ComsProps> = ({ close, condition }) => {
  const [tableList, setTableList] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string>>([]);
  const [count, setCount] = useState<number>(0);
  const { tableRef, y } = useTableHeight([]);
  const [showConverModal, setShowConverModal] = useState<boolean>(false);
  const columnslist: any = [
    {
      title: getIn18Text('GONGSIMINGCHENG'),
      dataIndex: 'company_name',
      key: 'company_name',
      render: text => text || '-',
    },
    {
      title: getIn18Text('GONGSIYUMING'),
      dataIndex: 'domain',
      key: 'domain',
      render: text => text || '-',
    },
    {
      title: getIn18Text('WANGLAIYOUJIAN'),
      dataIndex: 'exchange_cnt',
      key: 'exchange_cnt',
      render: text => text || '-',
    },
  ];
  useEffect(() => {
    /**
     *  推荐客户数据
     */
    fetchData();
  }, []);
  const fetchData = () => {
    setLoading(true);
    if (condition === 'company') {
      clientApi
        .recommendList()
        .then(res => {
          setTableList([...res.list]);
          setLoading(false);
          setSelectedRowKeys([]);
          setCount(res.count);
        })
        .catch(err => {
          setLoading(false);
          SiriusMessage.error({
            content: err,
          });
        });
    }
    if (condition === 'clue') {
      clientApi
        .clueRecommendList()
        .then(res => {
          setTableList([...res.list]);
          setLoading(false);
          setSelectedRowKeys([]);
          setCount(res.count);
        })
        .catch(err => {
          setLoading(false);
          SiriusMessage.error({
            content: err,
          });
        });
    }
  };
  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows: any[]) => {
      setSelectedRowKeys(selectedRowKeys);
    },
    selectedRowKeys,
  };
  const onCheckAllChange = e => {
    setSelectedRowKeys(e.target.checked ? tableList.map(i => String(i.company_id)) : []);
  };
  // 添加
  const handleBatchAdd = (data: string[], isCustomer: boolean) => {
    if (data.length) {
      const list = tableList
        .filter(item => data.includes(item.company_id))
        .map(el => {
          delete el.exchange_cnt;
          return el;
        });
      let code = isCustomer ? 2 : (1 as 1 | 2);
      const param = {
        import_list: list,
        part_code: code,
      };
      if (isCustomer) {
        // company 客户 推荐到客户 company
        clientApi
          .saveRecommendListInfo(param)
          .then(res => {
            SiriusMessage.success({
              content: getIn18Text('TIANJIACHENGGONG'),
            });
            console.log('推荐客户tablelist', res);
            // 添加成功后跳转到未完善list
            close();
            updatePartTableList(isCustomer);
          })
          .catch(err => {
            SiriusMessage.error({
              content: getIn18Text('TIANJIASHIBAI'),
            });
          });
      } else {
        // company 客户 推荐到客户 company
        clientApi
          .clueSaveRecommendListInfo(param)
          .then(res => {
            SiriusMessage.success({
              content: getIn18Text('TIANJIACHENGGONG'),
            });
            console.log('推荐客户tablelist', res);
            // 添加成功后跳转到未完善list
            close();
            updatePartTableList(isCustomer);
          })
          .catch(err => {
            SiriusMessage.error({
              content: getIn18Text('TIANJIASHIBAI'),
            });
          });
      }
      customerDataTracker.track('pc_markting_customer_advice', {
        number: tableList.length,
        choosenumber: list.length,
        click: 'advicecustomer',
      });
    }
  };
  // const y = `calc(100vh - ${240}px)`;
  // 跳转到未完善tab并更新table数据
  const updatePartTableList = (isCustomer: boolean) => {
    if (isCustomer) {
      navigate('#customer?page=customer');
    } else {
      navigate('#customer?page=clue');
    }
  };
  const onSubmit = (isCustomer: boolean) => {
    setShowConverModal(false);
    handleBatchAdd(selectedRowKeys, isCustomer);
  };
  return (
    <div className={style.mailsClientWrap}>
      <div className={style.header}>
        <div>
          <h3 className={style.title}>{getIn18Text('YOUJIANSHAIXUAN')}</h3>
          <span className={style.des}>
            {getIn18Text('YIZIDONGSHAIXUANCHU')}
            {count}
            {getIn18Text('GEKENENGDEKEHU\uFF0CQINGXUANZEHOUTIANJIADAOXIANSUOHUOKEHU')}
          </span>
        </div>
        <PageClose onClick={close} />
      </div>
      <div className={style.clientTableWrap} ref={tableRef}>
        <Table
          // className={style.clientTable}
          className="edm-table"
          columns={columnslist}
          loading={loading}
          rowKey="company_id"
          scroll={{ y }}
          rowSelection={{
            type: 'checkbox',
            ...rowSelection,
          }}
          dataSource={tableList}
          pagination={false}
        />
      </div>
      <SelectRowAction
        selectedRowKeys={selectedRowKeys}
        tableLength={tableList.length}
        onCheckAllChange={onCheckAllChange}
        subTitle={
          <>
            {getIn18Text('YIXUAN')}
            <span style={{ color: '#386EE7' }}>{selectedRowKeys.length}</span>
            {getIn18Text('GETUIJIANKEHU')}
          </>
        }
      >
        <Button type="text" onClick={() => setSelectedRowKeys([])}>
          {getIn18Text('QUXIAO')}
        </Button>
        <PrivilegeCheck accessLabel="OP" resourceLabel="CONTACT">
          <Button type="primary" disabled={selectedRowKeys.length === 0} style={{ marginLeft: 12 }} onClick={() => setShowConverModal(true)}>
            {getIn18Text('TIANJIA')}
          </Button>
        </PrivilegeCheck>
      </SelectRowAction>
      <ConvertModal visible={showConverModal} onSubmit={onSubmit} onCancel={() => setShowConverModal(false)} />
    </div>
  );
};
export default TableList;
