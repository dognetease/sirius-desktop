import React, { useState, useEffect } from 'react';
import { Table, Spin, Radio } from 'antd';
import { apis, apiHolder, EdmSendBoxApi, EdmSendboxOperatesByEmailRes } from 'api';
import classnames from 'classnames';
import { openMail } from '../../../detail/detailHelper';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import addressBookStyle from '../../addressBook.module.scss';
import style from './index.module.scss';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { getIn18Text } from 'api';

const formatTimes = (seconds: number) => {
  const origin = seconds;
  seconds = Number(seconds);
  if (Number.isNaN(seconds)) {
    return origin;
  }
  const labels = ['s', 'min'];
  let index = 0;
  let results: string[] = [];
  while (seconds && index < labels.length) {
    const remainder = seconds % 60;
    if (remainder) {
      results.push(remainder + labels[index]);
    }
    seconds = Math.floor(seconds / 60);
    index++;
  }
  if (seconds) {
    results.push(seconds + 'h');
  }
  return results.reverse().join(' ');
};

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
interface MarketHistoryProps {
  style?: React.CSSProperties;
  contactEmail: string;
}
const MarketHistory: React.FC<MarketHistoryProps> = props => {
  const { style: styleFromProps, contactEmail } = props;
  const [dataMap, setDataMap] = useState<EdmSendboxOperatesByEmailRes>({
    arriveNum: 0,
    arriveInfoList: [],
    readNum: 0,
    readInfoList: [],
    replyNum: 0,
    replyInfoList: [],
    sendNum: 0,
    sendInfoList: [],
    unsubscribeNum: 0,
    unsubscribeInfoList: [],
    productClickNum: 0,
    productDetailList: [],
  });
  const [marketType, setMarketType] = useState('send');
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    if (contactEmail) {
      setLoading(true);
      edmApi
        .getEdmSendboxOperatesByEmail({ contactEmail })
        .then(data => {
          setDataMap(data);
          setMarketType('send');
        })
        .catch(error => {
          Message.error({ content: error?.message || getIn18Text('QINGQIUYINGXIAOTONGJISHIBAI') });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [contactEmail]);
  if (!contactEmail) return null;
  return (
    <div className={classnames(style.marketHistory, addressBookStyle.addressBook)} style={styleFromProps}>
      <Radio.Group style={{ marginBottom: 12 }} value={marketType} buttonStyle="solid" onChange={event => setMarketType(event.target.value)}>
        <Radio.Button value="send">
          {getIn18Text('FASONG(')}
          {dataMap.sendNum})
        </Radio.Button>
        <Radio.Button value="arrive">
          {getIn18Text('SONGDA(')}
          {dataMap.arriveNum})
        </Radio.Button>
        <Radio.Button value="read">
          {getIn18Text('DAKAI(')}
          {dataMap.readNum})
        </Radio.Button>
        <Radio.Button value="reply">
          {getIn18Text('HUIFU(')}
          {dataMap.replyNum})
        </Radio.Button>
        <Radio.Button value="unsubscribe">
          {getIn18Text('TUIDING(')}
          {dataMap.unsubscribeNum})
        </Radio.Button>
        <Radio.Button value="click">
          {getIn18Text('SHANGPINDIANJI(')}
          {dataMap.productClickNum})
        </Radio.Button>
      </Radio.Group>
      <Spin spinning={loading}>
        {marketType === 'send' && (
          <Table
            className={classnames(addressBookStyle.table, addressBookStyle.tableDeepHead)}
            rowKey="edmEmailId"
            columns={[
              {
                title: getIn18Text('RENWUZHUTI'),
                dataIndex: 'edmSubject',
              },
              {
                title: getIn18Text('FASONGSHIJIAN'),
                dataIndex: 'sendAt',
              },
            ]}
            scroll={{ x: 'max-content', y: 220 }}
            pagination={false}
            dataSource={dataMap.sendInfoList}
          />
        )}
        {marketType === 'arrive' && (
          <Table
            className={classnames(addressBookStyle.table, addressBookStyle.tableDeepHead)}
            rowKey="edmEmailId"
            columns={[
              {
                title: getIn18Text('RENWUZHUTI'),
                dataIndex: 'edmSubject',
              },
              {
                title: getIn18Text('SONGDASHIJIAN'),
                dataIndex: 'arriveAt',
              },
            ]}
            scroll={{ x: 'max-content', y: 220 }}
            pagination={false}
            dataSource={dataMap.arriveInfoList}
          />
        )}
        {marketType === 'read' && (
          <Table
            className={classnames(addressBookStyle.table, addressBookStyle.tableDeepHead)}
            rowKey="edmEmailId"
            columns={[
              {
                title: getIn18Text('RENWUZHUTI'),
                dataIndex: 'edmSubject',
              },
              {
                title: getIn18Text('ZUIJINDAKAISHIJIAN'),
                dataIndex: 'recentReadAt',
              },
              {
                title: getIn18Text('DAKAICISHU'),
                width: 100,
                dataIndex: 'readCount',
              },
            ]}
            scroll={{ x: 'max-content', y: 220 }}
            pagination={false}
            dataSource={dataMap.readInfoList}
          />
        )}
        {marketType === 'reply' && (
          <Table
            className={classnames(addressBookStyle.table, addressBookStyle.tableDeepHead)}
            rowKey="edmEmailId"
            columns={[
              {
                title: getIn18Text('YOUJIANBIAOTI'),
                dataIndex: 'replyEmailSubject',
                render: (text: string, row: any) => {
                  if (!text) return '-';
                  return <a onClick={() => openMail(row.replyEmailInnerMid)}>{text}</a>;
                },
              },
              {
                title: getIn18Text('HUIFUSHIJIAN'),
                dataIndex: 'replyAt',
              },
            ]}
            scroll={{ x: 'max-content', y: 220 }}
            pagination={false}
            dataSource={dataMap.replyInfoList}
          />
        )}
        {marketType === 'unsubscribe' && (
          <Table
            className={classnames(addressBookStyle.table, addressBookStyle.tableDeepHead)}
            rowKey="edmEmailId"
            columns={[
              {
                title: getIn18Text('RENWUZHUTI'),
                dataIndex: 'edmSubject',
                render: text => `${text}(退订)`,
              },
              {
                title: getIn18Text('FASONGSHIJIAN'),
                dataIndex: 'sendAt',
              },
            ]}
            scroll={{ x: 'max-content', y: 220 }}
            pagination={false}
            dataSource={dataMap.unsubscribeInfoList}
          />
        )}
        {marketType === 'click' && (
          <Table
            className={classnames(addressBookStyle.table, addressBookStyle.tableDeepHead)}
            rowKey="productId"
            columns={[
              {
                title: getIn18Text('CHANPINMINGCHENG'),
                dataIndex: 'productName',
                width: 100,
                render(text) {
                  return (
                    <div style={{ width: 100 }}>
                      <EllipsisTooltip>{text}</EllipsisTooltip>
                    </div>
                  );
                },
              },
              {
                title: getIn18Text('CHANPIN') + ' ID',
                dataIndex: 'productId',
                width: 100,
                render(text) {
                  return (
                    <div style={{ width: 100 }}>
                      <EllipsisTooltip>{text}</EllipsisTooltip>
                    </div>
                  );
                },
              },
              {
                title: getIn18Text('clickTimes'),
                dataIndex: 'clickNum',
              },
              {
                title: getIn18Text('stayTimes'),
                dataIndex: 'stayTime',
                render(times: number) {
                  return formatTimes(times);
                },
              },
              {
                title: getIn18Text('maxVisitedDepth'),
                dataIndex: 'viewPosition',
                render(percent: number) {
                  return `${percent}%`;
                },
              },
            ]}
            scroll={{ x: 'max-content', y: 220 }}
            pagination={false}
            dataSource={dataMap.productDetailList}
          />
        )}
      </Spin>
    </div>
  );
};
export default MarketHistory;
