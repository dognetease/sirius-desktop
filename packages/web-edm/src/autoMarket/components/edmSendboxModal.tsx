import React, { useState, useEffect } from 'react';
import { Radio, Pagination, Empty } from 'antd';
import { apiHolder, apis, EdmSendBoxApi, EdmEmailInfo, ResponseSendBoxCopy } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { useCancelToken } from '../../fetchHook';
import { timeZoneMap, getWeekdayWithTimeZoneOffset } from '@web-common/utils/constant';
import style from './edmSendboxModal.module.scss';
import { getIn18Text } from 'api';
interface EdmSendboxModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (sendboxInfo: ResponseSendBoxCopy) => void;
}
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const EdmSendboxModal: React.FC<EdmSendboxModalProps> = props => {
  const { visible, onCancel, onOk } = props;
  const [edmEmailId, setEdmEmailId] = useState<string | null>(null);
  const [params, setParams] = useState({
    page: 1,
    pageSize: 10,
    isDel: 0,
    sendboxType: 0,
  });
  const [data, setData] = useState<EdmEmailInfo[]>([]);
  const [fetching, setFetching] = useState<boolean>(false);
  const [copying, setCopying] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const cancelToken = useCancelToken();
  useEffect(() => {
    setFetching(true);
    edmApi
      .getSendBoxPageList(params, {
        operator: cancelToken(),
      })
      .then(data => {
        setData(data.sendboxList);
        setTotal(data.totalSize);
      })
      .catch(() => {
        Toast.error({ content: getIn18Text('HUOQUYINGXIAOLIEBIAOSHIBAI') });
      })
      .finally(() => {
        setFetching(false);
      });
    return () => setEdmEmailId(null);
  }, [params]);
  const handleOk = () => {
    setCopying(true);
    edmApi
      .copyFromSendBox({ edmEmailId: edmEmailId as string })
      .then(sendboxInfo => {
        onOk(sendboxInfo);
      })
      .catch(() => {
        Toast.error({ content: getIn18Text('HUOQUYINGXIAOXIANGQINGSHIBAI') });
      })
      .finally(() => {
        setCopying(false);
      });
  };
  return (
    <Modal
      className={style.edmSendboxModal}
      visible={visible}
      title={getIn18Text('XUANZEYINGXIAORENWU')}
      width={760}
      onCancel={onCancel}
      onOk={handleOk}
      okButtonProps={{
        disabled: !edmEmailId,
        loading: copying,
      }}
    >
      <div className={style.sendboxList}>
        {data.map(item => (
          <div className={style.sendboxItem} onClick={() => setEdmEmailId(item.edmEmailId)}>
            <Radio className={style.radio} checked={item.edmEmailId === edmEmailId} />
            <div className={style.content}>
              <div className={style.subject}>{item.edmSubject}</div>
              <div className={style.sendTime}>
                <span className={style.sendTimeItem}>
                  {getIn18Text('FASONGSHIJIAN\uFF1A')}
                  {`${timeZoneMap[item.sendTimeZone]?.split('：')[0]} `}
                  {item.sendTime}
                  {`(${getWeekdayWithTimeZoneOffset(moment(item.sendTime.replace(' ', 'T') + item.sendTimeZone), item.sendTimeZone)})`}
                </span>
                <span className={style.sendTimeItem}>
                  {getIn18Text('ZUIJINGENGXIN\uFF1A')}
                  {item.recentlyUpdateTime}
                </span>
              </div>
            </div>
          </div>
        ))}
        {!data.length && <Empty />}
      </div>
      <Pagination
        className={style.pagination}
        size="small"
        total={total}
        disabled={fetching}
        current={params.page}
        pageSize={params.pageSize}
        showSizeChanger={false}
        pageSizeOptions={['10', '20', '50', '100']}
        hideOnSinglePage
        onChange={(page, pageSize: any) => {
          setParams(previous => ({
            ...previous,
            pageSize,
            page: pageSize === previous.pageSize ? page : 1,
          }));
        }}
      />
    </Modal>
  );
};
export default EdmSendboxModal;
