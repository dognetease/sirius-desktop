// 邮件列表顶部的tab切换效果，从index中抽离出来
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Checkbox, Dropdown, Menu } from 'antd';
import style from './MailMultOperation.module.scss';
import useState2RM from '../../hooks/useState2ReduxMock';
import useMailStore from '../../hooks/useMailStoreRedux';
import { useAppDispatch, useAppSelector, MailActions, useActions } from '@web-common/state/createStore';
import { FLOLDER, LIST_MODEL, TASK_MAIL_STATUS, MAIL_LIST_CHOOSE_TYPE } from '../../common/constant';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';

interface Props {
  cancelFn?: () => void;
}

const MailSignCheckbox: React.FC<Props> = props => {
  const [listModel, setListModel] = useState2RM('defaultMailListSelectedModel', 'doUpdateMailListSelectedModel');
  const [selectedKeys, setSelectedKeys] = useState2RM('selectedKeys', 'doUpdateSelectedKey');
  const reducer = useActions(MailActions);

  // 搜索-邮件列表
  const [searchList, setSearchList] = useMailStore('searchList');
  // 邮件-邮件列表
  const [mailDataList, setMailList] = useMailStore('mailDataList');
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2RM('mailSearching', 'doUpdateMailSearching');
  // 邮件列表-选中的邮件idlist
  const [activeIds, setActiveIds] = useState2RM('activeIds', 'doUpdateActiveIds');

  const mailIdList = useMemo(() => {
    const isSearching = !!mailSearching;
    const mailList = isSearching ? searchList : mailDataList;
    return mailList.filter(mail => mail?.taskInfo?.status !== TASK_MAIL_STATUS.PROCESSING).map(mail => mail.id);
  }, [mailSearching, searchList, mailDataList]);

  // 多选框是否半选
  const indeterminate = useMemo(() => {
    return listModel === LIST_MODEL.MULTIPLE && mailIdList.length > activeIds.length;
  }, [mailIdList?.length, listModel, activeIds?.length]);

  const checkAll = useMemo(() => {
    return listModel === LIST_MODEL.MULTIPLE && mailIdList?.length <= activeIds.length;
  }, [mailIdList?.length, activeIds?.length, listModel]);

  // 点击多选
  const onCheckAllChange = e => {
    // 选中则全选，取消则完全取消
    if (e.target.checked && selectedKeys?.id !== FLOLDER.TASK) {
      // setActiveIds(mailIdList);
      reducer.chooseMailFromList({
        key: MAIL_LIST_CHOOSE_TYPE.ALL,
      });
      setTimeout(() => {
        setListModel(LIST_MODEL.MULTIPLE);
      }, 0);
    } else {
      // afterListMultCancel();
      // // 取消时打点
      // trackApi.track('pcMail_click_cancel_ingeneralcheckbox');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Checkbox
        data-test-id="mail-list-tab-all-checkbox"
        indeterminate={indeterminate}
        disabled={selectedKeys?.id === FLOLDER.TASK}
        checked={checkAll}
        onChange={onCheckAllChange}
      ></Checkbox>
      <div style={{ cursor: 'pointer', height: '14px', marginLeft: '6px' }}>
        <MailSignCheckboxMenu />
      </div>
    </div>
  );
};

export const MailSignCheckboxMenu: React.FC<Props> = props => {
  const reducer = useActions(MailActions);

  const handleMenuClick = ({ key }) => {
    reducer.chooseMailFromList({
      key,
    });
  };

  return (
    <Dropdown
      overlay={
        <Menu onClick={handleMenuClick}>
          <Menu.Item key={MAIL_LIST_CHOOSE_TYPE.ALL}>{getIn18Text('QUANXUAN')}</Menu.Item>
          <Menu.Item key={MAIL_LIST_CHOOSE_TYPE.EMPTY}>{getIn18Text('BUXUAN')}</Menu.Item>
          <Menu.Item key={MAIL_LIST_CHOOSE_TYPE.UNREAD}>{getIn18Text('WEIDU')}</Menu.Item>
          <Menu.Item key={MAIL_LIST_CHOOSE_TYPE.READ}>{getIn18Text('YIDU')}</Menu.Item>
        </Menu>
      }
      trigger={['click']}
    >
      <svg data-test-id="mail-list-tab-checkbox-menu-btn" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8.39043 10.512L11.3501 6.81235C11.612 6.48497 11.3789 6 10.9597 6L5.04031 6C4.62106 6 4.38797 6.48497 4.64988 6.81235L7.60957 10.512C7.80973 10.7622 8.19027 10.7622 8.39043 10.512Z"
          fill="#8D92A1"
        />
      </svg>
    </Dropdown>
  );
};

export default MailSignCheckbox;
