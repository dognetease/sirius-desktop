import React, { useState, useEffect, useImperativeHandle } from 'react';
import { Radio, Pagination, Empty, Input, Spin } from 'antd';
import { apiHolder, apis, EdmSendBoxApi, EdmEmailInfo } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { getTransText } from '@/components/util/translate';
import classnames from 'classnames';
import { useCancelToken } from '../../../fetchHook';
import { timeZoneMap, getWeekdayWithTimeZoneOffset } from '@web-common/utils/constant';
import style from './edmTaskSelect.module.scss';
import { getIn18Text } from 'api';

interface EdmSendboxModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (EdmEmailInfo: EdmEmailInfo) => void;
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
export const EdmTaskSelectModal = React.forwardRef((props: EdmSendboxModalProps, ref) => {
  const { visible, onCancel, onOk } = props;
  const [params, setParams] = useState({
    page: 1,
    pageSize: 10,
    isDel: 0,
    emailStatus: 2,
    sendboxType: 0,
    edmSubject: '',
  });
  const [data, setData] = useState<EdmEmailInfo[]>([]);
  const [currentItem, setCurrentItem] = useState<EdmEmailInfo | null>();
  const [fetching, setFetching] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const cancelToken = useCancelToken();

  useEffect(() => {
    setFetching(true);
    setData([]);
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
    return () => setCurrentItem(null);
  }, [params]);

  const handleOk = () => {
    onOk(currentItem as EdmEmailInfo);
    onCancel();
  };

  const edmSubjectChange = (edmSubject: string) => {
    setParams({ ...params, edmSubject });
  };

  useImperativeHandle(ref, () => {
    return {
      resetSelection() {
        setCurrentItem(null);
      },
    };
  });

  return (
    <Modal
      className={style.edmSendboxModal}
      visible={visible}
      title={getTransText('XUANZEYINGXIAORENWU')}
      width={760}
      onCancel={onCancel}
      onOk={handleOk}
      okButtonProps={{
        disabled: !currentItem,
      }}
    >
      <div className={style.search}>
        <Input style={{ width: 150 }} allowClear placeholder={getTransText('RENWUZHUTI')} onChange={({ target: { value } }) => edmSubjectChange(value)}></Input>
      </div>
      <div className={style.sendboxList}>
        {fetching ? (
          <div className={style.loading}>
            <Spin />
          </div>
        ) : !data.length ? (
          <Empty />
        ) : (
          data.map(item => {
            const disabled = item.emailStatus !== 2;

            return (
              <div
                className={classnames(style.sendboxItem, disabled ? style.sendboxItemDisabled : '')}
                onClick={() => {
                  if (disabled) {
                    return;
                  }
                  setCurrentItem(item);
                }}
              >
                <Radio className={style.radio} checked={item.edmEmailId === currentItem?.edmEmailId} disabled={disabled} />
                <div className={style.content}>
                  <div className={style.subject}>{item.edmSubject}</div>
                  <div className={style.sendTime}>
                    <span className={style.sendTimeItem}>
                      {getTransText('FASONGSHIJIAN\uFF1A')}
                      {`${timeZoneMap[item.sendTimeZone]?.split('：')[0]} `}
                      {item.sendTime}
                      {`(${getWeekdayWithTimeZoneOffset(moment(item.sendTime.replace(' ', 'T') + item.sendTimeZone), item.sendTimeZone)})`}
                    </span>
                    <span className={style.sendTimeItem}>
                      {getTransText('ZUIJINGENGXIN\uFF1A')}
                      {item.recentlyUpdateTime}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
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
});
