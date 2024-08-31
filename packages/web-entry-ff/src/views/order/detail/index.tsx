import React, { useState, useMemo, useEffect, useContext } from 'react';
import { Descriptions, Timeline, Card, Button, Modal, Input, Empty, Spin, message } from 'antd';
// import SiriusDrawer from '@web-common/components/UI/SiriusDrawer';
import SiriusDrawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { apiHolder, apis, FFMSApi, FFMSOrder } from 'api';
import FfConfirm from '@web-entry-ff/views/customer/components/popconfirm';
import { GlobalContext } from '@web-entry-ff/layouts/WmMain/globalProvider';
import { showData } from './../../customer/levelAdmin/table';
import style from './style.module.scss';

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
interface Props {
  id: string;
  followStatus: FFMSOrder.ORDER_TYPE;
  onClose?: Function;
  onDelete?: (id: string) => void;
  onDone?: (id: string) => void;
}
export const OrderDetail: React.FC<Props> = props => {
  const { id, onClose, onDelete, onDone, followStatus } = props;
  const [showAdd, setShowAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [markInput, setMarkInput] = useState<string>('');
  const [detail, setDetail] = useState<FFMSOrder.DetailRes>();
  const { state } = useContext(GlobalContext);

  const canDelete = useMemo(() => {
    return followStatus === FFMSOrder.ORDER_TYPE.FOLLOWING;
  }, [followStatus]);
  const hasFooter = useMemo(() => {
    return followStatus !== FFMSOrder.ORDER_TYPE.COMPLETED;
  }, [followStatus]);
  const initStatus = useMemo(() => {
    return followStatus === FFMSOrder.ORDER_TYPE.NOT_FOLLOWED;
  }, [followStatus]);

  const fetchDetail = () => {
    setSpinning(true);
    ffmsApi
      .getFfBookDetail({
        bookingId: id,
      })
      .then(res => {
        setDetail(res);
      })
      .finally(() => {
        setSpinning(false);
      });
  };

  const onAddModalClose = () => {
    setMarkInput('');
    setShowAdd(false);
  };

  const addMark = () => {
    setAddLoading(true);
    ffmsApi
      .saveFfFollow({
        bookingId: id,
        content: markInput,
      })
      .then(res => {
        message.success('添加成功');
        onAddModalClose();
        fetchDetail();
      })
      .finally(() => {
        setAddLoading(false);
      });
  };

  const getPrice = (field: string) => {
    type keys = keyof FFMSOrder.DetailRes['freightBookingDetail'];
    let price = detail?.freightBookingDetail[field as keys];
    if (price) {
      return `$${price}`;
    }
    return '-';
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  return (
    <SiriusDrawer
      visible={Boolean(id)}
      className={style.ffBookDetail}
      width={initStatus ? 500 : 900}
      bodyStyle={{ padding: 20 }}
      headerStyle={{ padding: '16px 20px' }}
      onClose={() => onClose && onClose()}
      title="订单详情"
      footer={
        hasFooter ? (
          <div className={style.footer}>
            {canDelete ? (
              <FfConfirm title="确认删除吗？" onConfirm={() => onDelete && onDelete(id)}>
                <Button className={style.footerBtn} type="primary" danger>
                  删除
                </Button>
              </FfConfirm>
            ) : null}
            {canDelete ? (
              <FfConfirm title="是否完成该订舱申请的跟进？" onConfirm={() => onDone && onDone(id)}>
                <Button className={style.footerBtn} type="primary">
                  完成跟进
                </Button>
              </FfConfirm>
            ) : (
              <Button className={style.footerBtn} onClick={() => onDone && onDone(id)} type="primary">
                跟进
              </Button>
            )}
          </div>
        ) : null
      }
    >
      <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} spinning={spinning}>
        <div className={style.mainContent}>
          <div className={style.mainContentLeft}>
            <Descriptions title="企业信息" column={2}>
              <Descriptions.Item label="企业名称">{detail?.customerDetail?.customerName || '-'}</Descriptions.Item>
              <Descriptions.Item label="手机号">{detail?.customerDetail?.phoneNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{detail?.customerDetail?.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="等级">
                {detail?.customerDetail?.levelName
                  ? `${detail?.customerDetail?.levelName || '-'}(${showData(
                      state?.discountType === 'PERCENT',
                      detail?.customerDetail?.advance20gp,
                      detail?.customerDetail?.advance40gp,
                      detail?.customerDetail?.advance40hc
                    )})`
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
            <Descriptions title="航线" column={2}>
              <Descriptions.Item label="起运港">
                {detail?.freightRateDetail ? `${detail?.freightRateDetail?.departurePort?.cnName} ${detail?.freightRateDetail?.departurePort?.enName}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="目的港">
                {detail?.freightRateDetail ? `${detail?.freightRateDetail?.destinationPort?.cnName} ${detail?.freightRateDetail?.destinationPort?.enName}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="开航日">{detail?.freightRateDetail?.sailingDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="参考到港日">{detail?.freightRateDetail?.arriveDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="截止日">{detail?.freightRateDetail?.expiryDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="船司">{detail?.freightRateDetail?.carrier || '-'}</Descriptions.Item>
              <Descriptions.Item label="航线">{detail?.freightRateDetail?.route || '-'}</Descriptions.Item>
              <Descriptions.Item label="船只">{detail?.freightRateDetail?.vessel || '-'}</Descriptions.Item>
            </Descriptions>
            <Descriptions title="申请仓位" column={2}>
              <Descriptions.Item label="申请时间">{detail?.freightBookingDetail?.bookingAt || '-'}</Descriptions.Item>
              <Descriptions.Item label="总价">{getPrice('totalPrice')}</Descriptions.Item>
              <Descriptions.Item label="20GP数量">{detail?.freightBookingDetail?.count20gp || '-'}</Descriptions.Item>
              <Descriptions.Item label="20GP价格">{getPrice('price20GP')}</Descriptions.Item>
              <Descriptions.Item label="40GP数量">{detail?.freightBookingDetail?.count40gp || '-'}</Descriptions.Item>
              <Descriptions.Item label="40GP价格">{getPrice('price40GP')}</Descriptions.Item>
              <Descriptions.Item label="40HQ数量">{detail?.freightBookingDetail?.count40hc || '-'}</Descriptions.Item>
              <Descriptions.Item label="40HQ价格">{getPrice('price40HC')}</Descriptions.Item>
            </Descriptions>
          </div>
          {!initStatus ? (
            <div className={style.mainContentRight}>
              <div className={style.markInfo}>
                <h3 className={style.markTitle}>跟进记录</h3>
                {canDelete ? (
                  <Button type="primary" onClick={() => setShowAdd(true)}>
                    添加记录
                  </Button>
                ) : null}
              </div>

              <div className={style.markList}>
                {detail?.freightBookingFollowList.length ? (
                  <Timeline>
                    {detail?.freightBookingFollowList.map((item, index) => (
                      <Timeline.Item key={index}>
                        <Card title={item.followAt} size="small" className={style.card}>
                          <div className={style.markDesc}>{item.content}</div>
                        </Card>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                ) : (
                  <div className={style.empty}>
                    <Empty />
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </Spin>
      <Modal title="添加跟进记录" visible={showAdd} onOk={addMark} confirmLoading={addLoading} onCancel={onAddModalClose}>
        <Input.TextArea
          rows={4}
          placeholder="最多输入200个字符"
          maxLength={200}
          value={markInput}
          onChange={({ target: { value } }) => setMarkInput(value)}
        ></Input.TextArea>
      </Modal>
    </SiriusDrawer>
  );
};
