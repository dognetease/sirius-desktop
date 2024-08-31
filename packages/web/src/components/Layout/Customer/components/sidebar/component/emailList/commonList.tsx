import React, { useEffect, useState } from 'react';
import { api, apis, queryMailBoxParam, MailApi, MailEntryModel, TypeMailState } from 'api';
import InfiniteScroll from 'react-infinite-scroll-component';
import classnames from 'classnames';
import { List } from 'antd';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import style from './emailList.module.scss';
import { CommonEmailItem } from './commonMailItem';
import { EmptyTips } from '../emptyTips';
import { getIn18Text } from 'api';

const systemApi = api.getSystemApi();
const mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
export interface CommonEmailListProps {
  relatedEmail: string;
}
export const CommonEmailList = (props: CommonEmailListProps) => {
  const { relatedEmail } = props;
  const [filterType, setFilterType] = useState<TypeMailState>('ALL');
  const [loading, setLoading] = useState(false);
  const [resData, setResData] = useState<{
    total: number;
    page: number;
    data: MailEntryModel[];
  }>({
    total: 0,
    page: 0,
    data: [],
  });
  const loadMoreRows = () => {
    if (loading) {
      return null;
    }
    setLoading(true);
    const _param: queryMailBoxParam = {
      relatedEmail: [relatedEmail],
      count: 20,
      returnModel: true,
      status: filterType,
      index: resData.page,
      checkType: 'checkRelatedMail',
    };
    return mailApi.getRelatedMail(_param, false).then(res => {
      setResData(prev => ({
        total: res?.total || 0,
        page: res?.index || 0,
        data: [...prev.data, ...(res?.data || [])],
      }));
      setLoading(false);
    });
  };
  useEffect(() => {
    setResData({
      total: 0,
      page: 0,
      data: [],
    });
    loadMoreRows();
  }, [relatedEmail, filterType]);

  // 预览邮件
  const readEmailDetail = (data: MailEntryModel) => {
    const id = data?.id;
    const _account = data?._account;
    if (systemApi.isElectron()) {
      systemApi.createWindowWithInitData('readMail', { eventName: 'initPage', eventData: id });
    } else {
      window.open(`/readMail/?id=${id}${_account ? '&account=' + _account : ''}`, 'readMail', 'menubar=0,scrollbars=1,resizable=1,width=800,height=600');
    }
  };
  const rowData = (data: MailEntryModel) => <CommonEmailItem relatedEmail={relatedEmail} email={data} onPreview={item => readEmailDetail(item)} />;

  return (
    <div className={style.emailList}>
      <div className={style.searchBlock}>
        <Select style={{ width: '100%' }} placeholder={getIn18Text('ANSHOUFALEIXING')} onChange={v => setFilterType(v as TypeMailState)}>
          <Select.Option value="ALL">{getIn18Text('QUANBU')}</Select.Option>
          <Select.Option value="RECEIVED">{getIn18Text('SHOUJIAN')}</Select.Option>
          <Select.Option value="SENT">{getIn18Text('FAJIAN')}</Select.Option>
        </Select>
      </div>
      {resData.data.length === 0 ? (
        <EmptyTips text={getIn18Text('ZANWUWANGLAIYOUJIAN')} />
      ) : (
        <div id="scrollableDiv" className={classnames('sirius-scroll', style.emailWrap)}>
          <InfiniteScroll
            dataLength={resData.data.length}
            next={loadMoreRows}
            hasMore={resData.data.length < resData.total}
            loader={<></>}
            scrollableTarget="scrollableDiv"
          >
            <List dataSource={resData.data} renderItem={item => rowData(item)} />
          </InfiniteScroll>
        </div>
      )}
    </div>
  );
};
