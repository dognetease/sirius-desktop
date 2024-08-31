import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { Row, Col } from 'antd';
import { apiHolder, apis, FFMSApi, FFMSRate, FFMSPriceHistory } from 'api';
import classnames from 'classnames';
import Table from '@web-common/components/UI/Table';
import SendIcon from '@web/images/icons/edm/detail_tab_logo1.svg';
import ArriveIcon from '@web/images/icons/edm/detail_tab_logo2.svg';
import OpenIcon from '@web/images/icons/edm/detail_tab_logo3.svg';
import ReplyIcon from '@web/images/icons/edm/detail_tab_logo4.svg';
import { EdmSelect } from './edmSelect';
import style from './edmSendDetail.module.scss';

interface Props {
  row: FFMSRate.ListItem;
}

enum ListType {
  arriveList = 'arriveList',
  receiverList = 'receiverList',
  readList = 'readList',
  replyList = 'replyList',
}

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
export const EdmSendDetail: React.FC<Props> = props => {
  const { row } = props;
  const [edmEmailId, setEdmEmailId] = useState('');
  const [currentList, setCurrentList] = useState<ListType>(ListType.receiverList);
  const [edmData, setEdmData] = useState<FFMSPriceHistory.EdmJobDetail>({
    arriveList: [],
    receiverList: [],
    readList: [],
    replyList: [],
    edmSendboxEmailInfo: {
      sendCount: 0,
      arriveCount: 0,
      readCount: 0,
      replyCount: 0,
      contactsCount: 0,
    },
  });

  const fetchEdmDetail = useCallback(async () => {
    if (!edmEmailId || !row.freightHistoryId) {
      return;
    }
    const res = await ffmsApi.getEdmJobDetail(row.freightHistoryId, edmEmailId);
    setEdmData({
      arriveList: res?.arriveList || [],
      receiverList: res?.receiverList || [],
      readList: res?.readList || [],
      replyList: res?.replyList || [],
      edmSendboxEmailInfo: res?.edmSendboxEmailInfo || {
        sendCount: 0,
        arriveCount: 0,
        readCount: 0,
        replyCount: 0,
        contactsCount: 0,
      },
    });
  }, [edmEmailId, row.freightHistoryId]);

  const contactList = useMemo(() => {
    return edmData?.[currentList] || [];
  }, [currentList, edmData]);

  useEffect(() => {
    fetchEdmDetail();
  }, [fetchEdmDetail]);

  return (
    <div className={style.wrapper}>
      <div className={style.edmSelect}>
        <EdmSelect
          value={edmEmailId}
          freightHistoryId={row.freightHistoryId}
          onInit={val => {
            val && setEdmEmailId(val);
          }}
          onChange={val => setEdmEmailId(val)}
        />
      </div>
      <div className={style.detailCount}>
        <Row gutter={0}>
          <Col span={6} className={style.detailCell}>
            <div
              className={classnames(style.detailCard, currentList === ListType.receiverList ? style.actived : '')}
              onClick={() => setCurrentList(ListType.receiverList)}
            >
              <div className={style.icon}>
                <img src={SendIcon} alt="" />
              </div>
              <div className={style.number}>
                推送人数 <span>{edmData?.edmSendboxEmailInfo?.contactsCount || 0}</span>
              </div>
            </div>
          </Col>
          <Col span={6} className={style.detailCell}>
            <div className={classnames(style.detailCard, currentList === ListType.arriveList ? style.actived : '')} onClick={() => setCurrentList(ListType.arriveList)}>
              <div className={style.icon}>
                <img src={ArriveIcon} alt="" />
              </div>
              <div className={style.number}>
                送达封数 <span>{edmData?.edmSendboxEmailInfo?.arriveCount || 0}</span>
              </div>
            </div>
          </Col>
          <Col span={6} className={style.detailCell}>
            <div className={classnames(style.detailCard, currentList === ListType.readList ? style.actived : '')} onClick={() => setCurrentList(ListType.readList)}>
              <div className={style.icon}>
                <img src={OpenIcon} alt="" />
              </div>
              <div className={style.number}>
                打开人数 <span>{edmData?.edmSendboxEmailInfo?.readCount || 0}</span>
              </div>
            </div>
          </Col>
          <Col span={6} className={style.detailCell}>
            <div className={classnames(style.detailCard, currentList === ListType.replyList ? style.actived : '')} onClick={() => setCurrentList(ListType.replyList)}>
              <div className={style.icon}>
                <img src={ReplyIcon} alt="" />
              </div>
              <div className={style.number}>
                回复人数 <span>{edmData?.edmSendboxEmailInfo?.replyCount || 0}</span>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <Table
        className={style.table}
        columns={[
          {
            title: '推荐联系人',
            dataIndex: 'contactEmail',
          },
          {
            title: '价格',
            render(_, row: any) {
              return `${row?.price?.price20gp || '--'} / ${row?.price?.price40gp || '--'} / ${row?.price?.price40hc || '--'}`;
            },
          },
        ]}
        scroll={{ y: 184 }}
        dataSource={contactList}
        pagination={false}
      />
    </div>
  );
};
