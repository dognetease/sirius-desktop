import React, { useState, useEffect, useImperativeHandle } from 'react';
import { Tag, Empty, Radio, Spin, Pagination, Modal, ModalProps } from 'antd';
import { apiHolder, apis, AutoMarketApi, AutoMarketTask, AutoMarketTaskType, AutoMarketTaskTypeName, AutoMarketOpenStatusName, AutoMarketOpenStatus } from 'api';
// import Modal, { SiriusModalProps } from '@web-common/components/UI/Modal/SiriusModal';
import { ReactComponent as HolidayGreetingIcon } from '@/images/icons/edm/autoMarket/holidayGreeting.svg';
import { ReactComponent as PotentialContactIcon } from '@/images/icons/edm/autoMarket/potentialContact.svg';
import { ReactComponent as PreviousContactIcon } from '@/images/icons/edm/autoMarket/previousContact.svg';
import { ReactComponent as FixedContactIcon } from '@/images/icons/edm/autoMarket/fixedContact.svg';
import { getTransText } from '@/components/util/translate';
import classnames from 'classnames';
import { ActionDetail } from '../actionDetail';
import style from './style.module.scss';

interface AutoTaskTemplateProps extends ModalProps {
  taskType?: string[];
  showInvalid?: boolean;
  onSelect?: (taskId: string, taskType: AutoMarketTaskType) => void;
  filter?: (task: AutoMarketTask) => boolean;
}

const autoMarketApi = apiHolder.api.requireLogicalApi(apis.autoMarketApiImpl) as unknown as AutoMarketApi;
export const AutoTaskTemplateModal = React.forwardRef((props: AutoTaskTemplateProps, ref) => {
  const { taskType = [], onSelect, showInvalid = true, filter, ...otherProps } = props;
  const [params, setParams] = useState({
    page: 1,
    pageSize: 10,
    template: true,
  });
  const [list, setList] = useState<AutoMarketTask[]>([]);
  const [currentItem, setCurrentItem] = useState<AutoMarketTask | null>();
  const [fetching, setFetching] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (props.visible) {
      fetchTaskList();
    }
  }, [params, props.visible]);

  useEffect(() => {
    setCurrentItem(null);
  }, [props.visible]);

  async function fetchTaskList() {
    try {
      setFetching(true);
      setList([]);
      const reqParams = {
        ...params,
        taskType: '',
      };

      if (!showInvalid && taskType?.length) {
        reqParams.taskType = taskType.join(',');
      }
      const { autoMarketTasks = [], totalSize = 0 } = await autoMarketApi.getAutomarketTemplateList(reqParams);
      if (!showInvalid && filter) {
        setList(autoMarketTasks.filter(filter));
      } else {
        setList(autoMarketTasks);
      }
      setTotal(totalSize);
    } finally {
      setFetching(false);
    }
  }

  const handleOk = async () => {
    if (onSelect && currentItem) {
      try {
        setLoading(true);
        await onSelect(currentItem.taskId, currentItem.taskType);
      } finally {
        setLoading(false);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    hasTemplate: async (): Promise<boolean> => {
      try {
        const res = await autoMarketApi.getTaskList({
          page: 1,
          pageSize: 1,
          taskType: taskType.join(','),
          template: true,
        });

        return Boolean(res?.autoMarketTasks?.length);
      } catch (e) {
        return false;
      }
    },
  }));

  function renderTaskIcon(item: AutoMarketTask) {
    switch (item.taskType) {
      case AutoMarketTaskType.HOLIDAY_GREETING:
        return <HolidayGreetingIcon />;
      case AutoMarketTaskType.FIXED_CONTACT:
        return <FixedContactIcon />;
      case AutoMarketTaskType.POTENTIAL_CONTACT:
        return <PotentialContactIcon />;
      case AutoMarketTaskType.PREVIOUS_CONTACT:
        return <PreviousContactIcon />;
      default:
        return <></>;
    }
  }

  function renderTaskType(item: AutoMarketTask) {
    const text = AutoMarketTaskTypeName[item.taskType];
    let className;
    switch (item.taskType) {
      case AutoMarketTaskType.HOLIDAY_GREETING:
        className = style.taskTypeHol;
        break;
      case AutoMarketTaskType.FIXED_CONTACT:
        className = style.taskTypeFix;
        break;
      case AutoMarketTaskType.POTENTIAL_CONTACT:
        className = style.taskTypeNew;
        break;
      case AutoMarketTaskType.PREVIOUS_CONTACT:
        className = style.taskTypeOld;
        break;
    }
    return <Tag className={classnames(className, style.taskStateTag)}>{text}</Tag>;
  }

  function renderTaskState(item: AutoMarketTask) {
    const text = AutoMarketOpenStatusName[item.taskStatus];
    let className = '';
    switch (item.taskStatus) {
      case AutoMarketOpenStatus.CLOSED:
        className = style.taskStatusClose;
        break;
      case AutoMarketOpenStatus.NEW:
        className = style.taskStatusNew;
        break;

      case AutoMarketOpenStatus.OPEN:
        className = style.taskStatusOpen;
        break;
    }
    return <Tag className={classnames(className)}>{text}</Tag>;
  }

  return (
    <Modal
      className={style.edmSendboxModal}
      width={760}
      {...otherProps}
      title={getTransText('SelectAutoMarketTemplate')}
      onOk={handleOk}
      okButtonProps={{
        disabled: !currentItem,
        loading: loading,
      }}
    >
      <div className={style.sendboxList}>
        {fetching ? (
          <div className={style.loading}>
            <Spin />
          </div>
        ) : !list.length ? (
          <Empty />
        ) : (
          list.map(item => {
            let disabled = taskType?.length ? !taskType.includes(item.taskType) : false;
            if (filter) {
              disabled = disabled || !filter(item);
            }
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
                <Radio className={style.radio} checked={item.taskId === currentItem?.taskId} disabled={disabled} />
                <div className={style.content}>
                  <div className={style.icon}>{renderTaskIcon(item)}</div>
                  <div className={style.taskInfo}>
                    <div className={style.title}>
                      <span className={style.name}>{item.taskName || '--'}</span>
                      {renderTaskType(item)}
                      {renderTaskState(item)}
                    </div>
                    <div className={style.desc}>{`更新时间：${item.recentlyUpdateTime}`}</div>
                    <ActionDetail taskId={item.taskId}>
                      <span className={style.linkBtn}>{getTransText('CHAKAN')}</span>
                    </ActionDetail>
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
        showSizeChanger={true}
        showQuickJumper={true}
        showTotal={total => `共 ${total} 条`}
        pageSizeOptions={['10', '20', '50']}
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
