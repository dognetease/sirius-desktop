// 邮件列表顶部的tab切换效果，从index中抽离出来
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Checkbox } from 'antd';
import { apiHolder, apis, MailConfApi, DataTrackerApi, MailEntryModel, CommonMailMenuConfig } from 'api';
import style from './MailMultOperation.module.scss';
import useState2RM from '../../hooks/useState2ReduxMock';
import useMailStore from '../../hooks/useMailStoreRedux';
import { LIST_MODEL, TASK_MAIL_STATUS, MAIL_LIST_CHOOSE_TYPE } from '../../common/constant';
import MailMultOperationBtns from '../MailMultOperPanel/MailMultOperationBtns';
import { MailSignCheckboxMenu } from './MailSignCheckbox';
import { getIn18Text } from 'api';
import { MailActions, useActions } from '@web-common/state/createStore';
// api

const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface Props {
  cancelFn?: () => void;
}

const MailMultOperation: React.FC<Props> = props => {
  const { cancelFn } = props;
  const reducer = useActions(MailActions);

  // 全选/半选
  // const [indeterminate, setIndeterminate] = useState(false);
  // const [checkAll, setCheckAll] = useState(false);

  const [listModel, setListModel] = useState2RM('defaultMailListSelectedModel', 'doUpdateMailListSelectedModel');
  // 邮件列表-选中的邮件idlist
  const [activeIds, setActiveIds] = useState2RM('activeIds', 'doUpdateActiveIds');
  // 搜索-邮件列表
  const [searchList, setSearchList] = useMailStore('searchList');
  // 邮件-邮件列表
  const [mailDataList, setMailList] = useMailStore('mailDataList');
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2RM('mailSearching', 'doUpdateMailSearching');
  // 邮件列表-当前选中的邮件id
  const [selectedMail, setSelectedMail] = useState2RM('selectedMailId', 'doUpdateSelectedMail');

  // 显示的选中数量
  const checkedNum = useMemo(() => {
    if (listModel === LIST_MODEL.MULTIPLE) {
      return activeIds.length > 999 ? '999+' : `${activeIds.length}`;
    }
    return '0';
  }, [listModel, activeIds]);
  // 当前视图模式
  const [configMailLayout, setConfigMailLayout] = useState2RM('configMailLayout', 'doUpdateConfigMailLayout');
  const isLeftRight = useMemo(() => configMailLayout === '1', [configMailLayout]);
  // const isLeftRight = mailConfApi.getMailPageLayout() === '1';
  // 列表数据，出去任务任务邮件
  const mailIdList = useMemo(() => {
    const isSearching = !!mailSearching;
    const mailList = isSearching ? searchList : mailDataList;
    return mailList.filter(mail => mail?.taskInfo?.status !== TASK_MAIL_STATUS.PROCESSING).map(mail => mail.id);
  }, [mailSearching, searchList, mailDataList]);
  // // 半选/全选
  // useEffect(() => {
  //   // 需要在多选态下
  //   setCheckAll(listModel === LIST_MODEL.MULTIPLE && mailIdList.length === activeIds.length);
  //   setIndeterminate(listModel === LIST_MODEL.MULTIPLE && mailIdList.length > activeIds.length);
  // }, [mailIdList, activeIds, listModel]);

  // 多选框是否半选
  const indeterminate = useMemo(() => {
    return listModel === LIST_MODEL.MULTIPLE && mailIdList.length > activeIds.length;
  }, [mailIdList?.length, listModel, activeIds?.length]);

  const checkAll = useMemo(() => {
    return listModel === LIST_MODEL.MULTIPLE && mailIdList?.length <= activeIds.length;
  }, [mailIdList?.length, activeIds?.length, listModel]);

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
  const onCheckAllChange = e => {
    // 选中则全选，取消则完全取消
    if (e.target.checked) {
      // setActiveIds(mailIdList);
      reducer.chooseMailFromList({
        key: MAIL_LIST_CHOOSE_TYPE.ALL,
      });
      setTimeout(() => {
        setListModel(LIST_MODEL.MULTIPLE);
      }, 0);
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

  // 生成按钮DomProps的回调
  const domPropsRender = useCallback((mails: MailEntryModel, menuConfig: CommonMailMenuConfig) => {
    return {
      'data-test-id': 'mail-menu-list-multPanel-' + menuConfig?.key,
    };
  }, []);

  // 返回dom
  return (
    <div
      className={style.multipleOperationNew}
      style={{
        justifyContent: isLeftRight ? 'space-between' : 'flex-start',
        paddingLeft: !isLeftRight ? '32px' : undefined,
      }}
    >
      {/* 多选框 */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Checkbox data-test-id="mail-list-tab-all-checkbox-checked" indeterminate={indeterminate} checked={checkAll} onChange={onCheckAllChange}></Checkbox>
        <div style={{ cursor: 'pointer', height: '14px', marginLeft: '6px' }}>
          <MailSignCheckboxMenu />
        </div>
        <div style={{ padding: '0 10px' }} data-test-id="mail-list-tab-all-checked-number">
          {getIn18Text('YIXUAN')}({checkedNum})
        </div>
      </div>
      {/* 取消全选 */}
      <span className={style.cancle} onClick={onCancel} data-test-id="mail-list-tab-filter-cancel-btn">
        {getIn18Text('QUXIAO')}
      </span>
      {/* 批量操作按钮,通栏下展示 */}
      {!isLeftRight && <MailMultOperationBtns size="mini" domProps={domPropsRender} />}
    </div>
  );
};
export default MailMultOperation;
