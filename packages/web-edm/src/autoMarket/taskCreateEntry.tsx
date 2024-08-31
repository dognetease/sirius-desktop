import React, { forwardRef, useImperativeHandle, useRef, useMemo, useState, useEffect } from 'react';
import { useToggle, useLocalStorage } from 'react-use';
import classNames from 'classnames';
import { Row, Col, Tag } from 'antd';
import { navigate, useLocation } from '@reach/router';
import { AutoMarketTaskType, AutoMarketTask, apiHolder, apis, AutoMarketApi, AutoMarketTaskTypeName, AutoMarketOpenStatusName, AutoMarketOpenStatus } from 'api';
import { getTransText } from '@/components/util/translate';
import qs from 'querystring';
import { ReactComponent as ArrowLeft } from '@/images/icons/edm/autoMarket/arrowLeft.svg';
import { ReactComponent as HolidayGreetingIcon } from '@/images/icons/edm/autoMarket/holidayGreeting.svg';
import { ReactComponent as PotentialContactIcon } from '@/images/icons/edm/autoMarket/potentialContact.svg';
import { ReactComponent as PreviousContactIcon } from '@/images/icons/edm/autoMarket/previousContact.svg';
import { ReactComponent as FixedContactIcon } from '@/images/icons/edm/autoMarket/fixedContact.svg';
import TaskCreateModal from './taskCreateModal';
import { autoMarketTracker } from './tracker';
import { ActionDetail } from './components/actionDetail';
import style from './taskCreateEntry.module.scss';
import { getIn18Text } from 'api';
import { safeDecodeURIComponent } from '@web-common/utils/utils';

const { isMac } = apiHolder.env;
const systemApi = apiHolder.api.getSystemApi();
const isWindows = systemApi.isElectron() && !isMac;

const entryList = [
  // {
  //   disabled: true,
  //   icon: 'customProcess',
  //   code: '',
  //   title: '自定义流程',
  //   content: [
  //     '自定义人群，并编辑触发条件',
  //     '自动完成邮件发送等动作'
  //   ]
  // },
  {
    disabled: false,
    icon: 'holidayGreeting',
    disabledIcon: 'holidayGreetingDisabled',
    code: 'HOLIDAY_GREETING',
    title: getTransText('JIERIWENHOU'),
    content: [
      getTransText('JIERIWENHOUSHUOMING'),
      // getIn18Text("ZIDONGWANCHENGYOUJIANFASONGDENGDONGZUO")
    ],
  },
  {
    disabled: false,
    icon: 'potentialContact',
    disabledIcon: 'potentialContactDisabled',
    code: 'POTENTIAL_CONTACT',
    title: getTransText('XINHUOKEYINGXIAO'),
    content: [
      getTransText('XINHUOKEYINGXIAOSHUOMING'),
      // getIn18Text("ZIDONGWANCHENGYOUJIANFASONGDENGDONGZUO")
    ],
  },
  {
    disabled: false,
    icon: 'previousContact',
    disabledIcon: 'previousContactDisabled',
    code: 'PREVIOUS_CONTACT',
    title: getTransText('LAOKEHUWEIXI'),
    content: [getTransText('LAOKEHUWEIXISHUOMING')],
  },
  {
    disabled: false,
    icon: 'fixedContact',
    disabledIcon: 'fixedContactDisabled',
    code: 'FIXED_CONTACT',
    title: getTransText('EdmAutoMarketTask'),
    content: [getTransText('EdmAutoMarketTaskDesc')],
  },
];
const enum FromType {
  UNITABLE = 'WEBSITE',
}

const autoMarketApi = apiHolder.api.requireLogicalApi(apis.autoMarketApiImpl) as unknown as AutoMarketApi;
const TaskCreateEntry = forwardRef((props, ref) => {
  const location = useLocation();
  const queryObject = useMemo(() => qs.parse(location?.hash?.split('?')[1]), [location.hash]);
  const [show, toggle] = useToggle(queryObject?.groupId || queryObject?.edmEmailId || queryObject?.from ? true : false);
  const [modalShow, toggleModal] = useToggle(false);
  const [_, setTaskCreateInfo] = useLocalStorage('task_create_info');
  const [hasRelation, setHasRelation] = useState(Boolean(queryObject?.groupId || queryObject?.edmEmailId || queryObject?.from));
  const taskTypeRef = useRef<AutoMarketTaskType | null>(null);
  const [list, setList] = useState<AutoMarketTask[]>([]);

  useImperativeHandle(ref, () => ({
    toggle,
  }));

  useEffect(() => {
    if (queryObject.page !== 'autoMarketTask') return;
    if (queryObject?.groupId || queryObject?.edmEmailId || queryObject?.from) {
      toggle(true);
      setHasRelation(true);
    }
  }, [location.hash, queryObject]);
  const jumpPage = (type: AutoMarketTaskType) => {
    setHasRelation(false);
    if (queryObject.groupId && hasRelation) {
      navigate(`#edm?page=autoMarketTaskEdit&taskType=${type}&groupId=${queryObject.groupId}`);
      return;
    }

    if (queryObject.edmEmailId && hasRelation) {
      navigate(`#edm?page=autoMarketTaskEdit&taskType=${type}&edmEmailId=${queryObject.edmEmailId}`);
      return;
    }

    if (queryObject.from && hasRelation) {
      navigate(`#edm?page=autoMarketTaskEdit&taskType=${type}&from=${queryObject.from}`);
      return;
    }

    navigate(`#edm?page=autoMarketTaskEdit&taskType=${type}`);
  };
  const openModal = (type: AutoMarketTaskType) => {
    taskTypeRef.current = type;
    toggleModal();
  };
  const submitForm = (payload: any) => {
    const taskType = taskTypeRef.current;
    // navigate(`#edm?page=autoMarketTaskEdit&copyTaskId=${item.taskId}&fromTemplate=1`);
    if (taskType) {
      if (AutoMarketTaskType[taskType]) {
        // 普通创建
        setTaskCreateInfo({
          ...payload,
          taskType,
        });
        hideModal();
        jumpPage(taskType);
        return;
      }

      // 通过模版创建 taskType传入的是taskId
      let url = `#edm?page=autoMarketTaskEdit&copyTaskId=${taskType}&taskName=${payload.taskName || ''}&taskDesc=${payload.taskDesc || ''}`;
      if (hasRelation) {
        if (queryObject.groupId && hasRelation) {
          url = `${url}&groupId=${queryObject.groupId}`;
        } else if (queryObject.edmEmailId && hasRelation) {
          url = `${url}&edmEmailId=${queryObject.edmEmailId}`;
        } else if (queryObject.from && hasRelation) {
          url = `${url}&from=${queryObject.from}`;
        }
      }
      navigate(url);
    }
  };
  const hideModal = () => {
    toggleModal(false);
    taskTypeRef.current = null;
  };

  async function fetchTaskList() {
    const { autoMarketTasks } = await autoMarketApi.getTaskList({
      page: 1,
      pageSize: 10000,
      template: true,
    });
    setList(autoMarketTasks || []);
  }

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
    return <Tag className={classNames(className, style.taskStateTag)}>{text}</Tag>;
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
    return <Tag className={classNames(className)}>{text}</Tag>;
  }

  const entryListComputed = useMemo(() => {
    return entryList.map(item => {
      if (
        hasRelation &&
        ((queryObject?.groupId && item.code === AutoMarketTaskType.PREVIOUS_CONTACT) ||
          (queryObject?.edmEmailId && item.code !== AutoMarketTaskType.FIXED_CONTACT) ||
          (queryObject?.from === FromType.UNITABLE && item.code !== AutoMarketTaskType.PREVIOUS_CONTACT))
      ) {
        item.disabled = true;
      } else {
        item.disabled = false;
      }
      return item;
    });
  }, [hasRelation]);

  const backToSourceIfNeeded = (): boolean => {
    const backString = new URLSearchParams(location.href).get('back');
    if (backString && backString.length > 0) {
      const back = safeDecodeURIComponent(backString);
      navigate('#' + back);
      return true;
    }
    return false;
  };

  function goBack() {
    setHasRelation(false);
    toggle();
    backToSourceIfNeeded();
  }

  return (
    <div className={classNames(style.container, !show && style.hide)}>
      {/* <div className={classNames(style.placeholderTop)}></div> */}
      <div className={classNames(style.btnClose, isWindows ? style.btnCloseInWin : '')} onClick={goBack}>
        <ArrowLeft></ArrowLeft>
        <span>{getTransText('FANHUI')}</span>
      </div>
      {/* <h5 className={style.entryTitle}>{getIn18Text("XUANZEYINGXIAOCHANGJING")}</h5> */}
      <div className={style.contentWrapper}>
        <div className={style.moduleTitle}>{getTransText('XUANZEYINGXIAOCHANGJING')}</div>
        <Row className={style.row} gutter={16}>
          {entryListComputed.map(entry => (
            <Col span={8}>
              <div
                key={style.code}
                className={classNames(style.entryItem, entry.disabled && style.disabled)}
                onClick={() => {
                  !entry.disabled && openModal(entry.code as AutoMarketTaskType);
                  const taskTypeTrackerMap = {
                    [AutoMarketTaskType.HOLIDAY_GREETING]: 'festival',
                    [AutoMarketTaskType.PREVIOUS_CONTACT]: 'oldcustomer',
                    [AutoMarketTaskType.POTENTIAL_CONTACT]: 'newcustomer',
                    [AutoMarketTaskType.FIXED_CONTACT]: 'edmEmail',
                  };
                  const type = taskTypeTrackerMap[entry.code as AutoMarketTaskType] || '';
                  autoMarketTracker.taskTypeClick(type as any);
                }}
              >
                <div className={classNames(style.entryItemIcon, style[entry.icon])}></div>
                <div className={style.entryItemContent}>
                  <h5>{entry.title}</h5>
                  {entry.content.map(item => (
                    <p key={item} title={item}>
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
      <div className={classNames(style.placeholderBottom)}></div>
      <TaskCreateModal title={getIn18Text('CHUANGJIANRENWU')} visible={modalShow} onCancel={hideModal} onOk={submitForm} />
    </div>
  );
});
export default TaskCreateEntry;
