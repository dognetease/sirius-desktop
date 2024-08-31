// 邮件列表顶部的tab切换效果，从index中抽离出来
import React, { useMemo, useContext } from 'react';
import { Checkbox } from 'antd';
import { apiHolder, apis, DataTrackerApi } from 'api';
import style from './MailMultOperation.module.scss';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import useMailStore from '@web-mail/hooks/useMailStoreRedux';
import { useState2CustomerSlice, ctSliceContext } from '@web-mail/hooks/useState2SliceRedux';
import { LIST_MODEL, TASK_MAIL_STATUS } from '@web-mail/common/constant';

import { SliceIdParams } from '@web-mail/types';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import MailMultiOperationBtns from '@web-mail/components/CustomerMail/ColumnCustomerMailList/MaiMultiOperation/MailMultOperationBtns';
import { getIn18Text } from 'api';

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface Props {
  cancelFn?: () => void;
}

const MailMultiOperation: React.FC<SliceIdParams<Props>> = ({ cancelFn }) => {
  // 全选/半选
  // const [indeterminate, setIndeterminate] = useState(false);
  // const [checkAll, setCheckAll] = useState(false);
  const sliceId = useContext(ctSliceContext);

  // 搜索-邮件列表
  const [searchList] = useMailStore('searchList', undefined, sliceId, 'customer');
  // 邮件-邮件列表
  const [mailDataList] = useMailStore('mailDataList', undefined, sliceId, 'customer');
  // 当前视图模式
  const [configMailLayout] = useState2RM('configMailLayout', 'doUpdateConfigMailLayout');

  const [listModel, setListModel] = useState2CustomerSlice('defaultMailListSelectedModel');
  // 邮件列表-选中的邮件id list
  const [activeIds, setActiveIds] = useState2CustomerSlice('activeIds');
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2CustomerSlice('mailSearching');
  // 邮件列表-当前选中的邮件id
  const [selectedMail] = useState2CustomerSlice('selectedMailId');

  // 显示的选中数量
  const checkedNum = useMemo(() => {
    if (listModel === LIST_MODEL.MULTIPLE) {
      return activeIds.length > 999 ? '999+' : `${activeIds.length}`;
    }
    return '0';
  }, [listModel, activeIds]);

  const isLeftRight = useMemo(() => configMailLayout === '1', [configMailLayout]);

  // 列表数据，出去任务任务邮件
  const mailIdList = useMemo(() => {
    const isSearching = !!mailSearching;
    const mailList = isSearching ? searchList : mailDataList;
    return mailList.filter(mail => mail?.taskInfo?.status !== TASK_MAIL_STATUS.PROCESSING).map(mail => mail.id);
  }, [mailSearching, searchList, mailDataList]);

  // 是否展示全选状态
  const checkAll: boolean = useMemo(() => {
    return listModel === LIST_MODEL.MULTIPLE && mailIdList.length === activeIds.length;
  }, [mailIdList, activeIds, listModel]);

  // 是否展示半选状态
  const indeterminate: boolean = useMemo(() => {
    return listModel === LIST_MODEL.MULTIPLE && mailIdList.length > activeIds.length;
  }, [mailIdList, activeIds, listModel]);

  // 半选/全选
  // useEffect(() => {
  //   // 需要在多选态下
  //   // setCheckAll(listModel === LIST_MODEL.MULTIPLE && mailIdList.length === activeIds.length);
  //   setIndeterminate(listModel === LIST_MODEL.MULTIPLE && mailIdList.length > activeIds.length);
  // }, [mailIdList, activeIds, listModel]);

  // 根据所处状态同步取消后的列表active装态
  const afterListMultCancel = () => {
    if (isLeftRight) {
      if (selectedMail.id) {
        setListModel(LIST_MODEL.SINGLE);
        setActiveIds([selectedMail.id]);
      } else {
        setListModel(LIST_MODEL.INIT);
        setActiveIds([]);
      }
    } else {
      setListModel(LIST_MODEL.INIT);
      setActiveIds([]);
    }
  };

  // 点击多选
  const onCheckAllChange = (e: CheckboxChangeEvent) => {
    // 选中则全选，取消则完全取消
    if (e.target.checked) {
      setActiveIds(mailIdList);
    } else {
      afterListMultCancel();
      // 取消时打点
      trackApi.track('pcMail_click_cancel_ingeneralcheckbox');
    }
  };
  // 取消
  const onCancel = () => {
    cancelFn && cancelFn();
    afterListMultCancel();
    // 打点
    trackApi.track('pcMail_click_cancel_nextgeneralcheckbox');
  };
  // 返回dom
  return (
    <div
      className={style.multipleOperation}
      style={{
        justifyContent: isLeftRight ? 'space-between' : 'flex-start',
        paddingLeft: isLeftRight ? '19px' : '21px',
      }}
    >
      {/* 多选框 */}
      <Checkbox indeterminate={indeterminate} checked={checkAll} onChange={onCheckAllChange}>
        {getIn18Text('YIXUAN')}({checkedNum})
      </Checkbox>
      {/* 取消全选 */}
      <span className={style.cancle} onClick={onCancel}>
        {getIn18Text('QUXIAO')}
      </span>
      {/* 批量操作按钮,通栏下展示 */}
      {!isLeftRight && <MailMultiOperationBtns size="mini" />}
    </div>
  );
};
export default MailMultiOperation;
