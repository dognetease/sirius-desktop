import React, { useState, useEffect } from 'react';
import { Input, Table, Alert } from 'antd';
import { apiHolder, apis, EdmSendBoxApi, EdmUnsubscribeItem, RequestEdmUnsubscribes } from 'api';
import moment from 'moment';
import { navigate } from '@reach/router';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as SearchIcon } from '@/images/icons/edm/search.svg';
import { ReactComponent as AlertIcon } from '@/images/icons/edm/addressBook/alert_icon.svg';
import { getBodyFixHeight } from '@web-common/utils/constant';
import { ReactComponent as AlertIcon } from '@/images/icons/edm/alert_icon.svg';
import edmStyle from '../edm.module.scss';
import style from './unsubscribeTable.module.scss';
import { getIn18Text } from 'api';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

const UnsubscribeTable = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const [data, setData] = useState<EdmUnsubscribeItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [fetching, setFetching] = useState<boolean>(false);

  const [params, setParams] = useState<RequestEdmUnsubscribes>({
    email: '',
    page: 1,
    pageSize: 20,
  });

  useEffect(() => {
    setFetching(true);

    edmApi
      .getEdmUnsubscribes(params)
      .then(data => {
        setData(data.unsubscribeList);
        setTotal(data.totalSize);
      })
      .catch(error => {
        Toast.error({ content: error?.message || getIn18Text('WANGLUOCUOWU') });
      })
      .finally(() => {
        setFetching(false);
      });
  }, [params]);

  const columns = [
    {
      title: getIn18Text('YOUXIANG'),
      dataIndex: 'contactEmail',
      width: '40%',
      ellipsis: true,
    },
    {
      title: getIn18Text('DUIYINGRENWU'),
      dataIndex: 'edmSubject',
      width: '40%',
      ellipsis: true,
      render: (text: string, record: EdmUnsubscribeItem) => (
        <span className={style.highlight} onClick={() => navigate(`#edm?page=detail&owner=true&id=${record.edmEmailId}`)}>
          {text}
        </span>
      ),
    },
    {
      title: getIn18Text('TUIDINGSHIJIAN'),
      dataIndex: 'unsubscribeDate',
      width: '20%',
      ellipsis: true,
      render: (text: string) => moment(text).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const handleSearch = (event: any) => {
    setParams({
      ...params,
      email: event.target.value,
      page: 1,
    });
  };

  return (
    <div className={style.unsubscribeTable}>
      <Alert
        className={style.alert}
        message={getIn18Text('RUXUYICHUTUIDING\uFF0CQINGLIANXIKEHUCHENGGONGJINGLI')}
        type="info"
        showIcon
        closable={true}
        icon={<AlertIcon />}
      />
      <Input
        className={style.inputFilter}
        style={{ width: 328 }}
        placeholder={getIn18Text('QINGSHURUYOUXIANGDEZHI')}
        prefix={<SearchIcon />}
        suffix={null}
        value={inputValue}
        allowClear
        readOnly={fetching}
        onBlur={handleSearch}
        onPressEnter={handleSearch}
        onChange={event => setInputValue(event.target.value)}
      />
      <Table
        className={edmStyle.contactTable}
        columns={columns}
        dataSource={data}
        rowKey="contactEmail"
        pagination={{
          className: 'pagination-wrap',
          size: 'small',
          current: params.page,
          pageSize: params.pageSize,
          pageSizeOptions: ['20', '50', '100'],
          showSizeChanger: true,
          disabled: fetching,
          total,
          showTotal: total => `共${total}条`,
        }}
        loading={fetching}
        onChange={pagination => {
          setParams(previous => ({
            ...params,
            pageSize: pagination.pageSize as number,
            page: pagination.pageSize === previous.pageSize ? (pagination.current as number) : 1,
          }));
        }}
        // scroll={{ y: 'calc(100vh - 254px)' }}
        scroll={{ y: `calc(100vh - ${getBodyFixHeight(true) ? 343 : 375}px)` }}
      />
    </div>
  );
};

export default UnsubscribeTable;
