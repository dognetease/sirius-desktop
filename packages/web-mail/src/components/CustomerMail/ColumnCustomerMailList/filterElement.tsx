import React, { useState, useMemo } from 'react';
import classnames from 'classnames';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { useAppDispatch } from '@web-common/state/createStore';
import { LIST_MODEL } from '@web-mail/common/constant';
import FilterTab from '@web-mail/components/MailColumnEntry/filterTab';
import MailMultiOperation from '@web-mail/components/CustomerMail/ColumnCustomerMailList/MaiMultiOperation/MailMultiOperation';
import { apiHolder, apis, DataTrackerApi } from 'api';
import { Dropdown, Menu } from 'antd';
import { stringMap } from 'types';
import './index.scss';
import { useState2CustomerSlice } from '@web-mail/hooks/useState2SliceRedux';

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const customerTabMenuConfig = [
  {
    title: '收发件',
    key: 'ALL',
  },
  {
    title: '仅收件',
    key: 'Receive',
  },
  {
    title: '仅发件',
    key: 'Send',
  },
];

const customerKey2TitleMap: stringMap = {};
customerTabMenuConfig.forEach(item => {
  customerKey2TitleMap[item.key] = item.title;
});

const FilterTabCm: React.FC<{ sliceId: string }> = ({ sliceId }) => {
  const dispatch = useAppDispatch();

  // 是否点击批量操作取消按钮
  const [clickCancel, setClickCancel] = useState(false);

  // 邮件列表-筛选菜单
  const [condition] = useState2CustomerSlice('mailTabs');
  // 搜索列表-上部-二级tab选中
  const [searchSelected, setSearchSelected] = useState2CustomerSlice('searchListStateTab');
  // 邮件列表-上部-二级tab选中
  const [selected, setSelected] = useState2CustomerSlice('mailListStateTab');
  // 快捷键状态
  const [listModel] = useState2CustomerSlice('defaultMailListSelectedModel');
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2CustomerSlice('mailSearching');
  // 客户列表Menu的选中
  const [tabMenuSelected, setTabMenuSelected] = useState2CustomerSlice('mailListTabMenu');
  // 搜索客户列表的menu选中
  const [tabMenuSelectedSearch, setTabMenuSelectedSearch] = useState2CustomerSlice('mailListTabMenuSearch');
  // tabMenu的选择弹窗是否展开
  const [tabMenuVisible, setTabMenuVisible] = useState<boolean>(false);

  // 是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);

  // 点击批量操作取消
  const handleCancel = () => {
    setClickCancel(true);
    setTimeout(() => {
      setClickCancel(false);
    }, 1000);
  };

  const trackTabClick = (type: string) => {
    trackApi.track('wiamao_mail_customermail_action', { type });
  };

  // 点击tab
  const clickTab = async (item: any) => {
    if (isSearching) {
      setSearchSelected(item.type);
    } else {
      trackTabClick(item.type);
      setSelected(item.type);
    }
    dispatch(
      Thunks.loadMailList_edm({
        showLoading: true,
        noCache: false,
        refresh: true,
        type: 'customer',
        sliceId,
      })
    );
  };

  // 点击下拉菜单
  const clickMenu = ({ key }: any) => {
    setTabMenuVisible(false);
    if (isSearching) {
      setTabMenuSelectedSearch(key);
    } else {
      setTabMenuSelected(key);
    }
    dispatch(
      Thunks.loadMailList_edm({
        showLoading: true,
        noCache: false,
        refresh: true,
        type: 'customer',
        sliceId,
      })
    );
  };

  const _selected = isSearching ? searchSelected : selected;

  return (
    <>
      <div
        style={{ height: '0px' }}
        className={classnames(['m-list-operation', 'm-list-operation1'], {
          ['m-list-operation100']: listModel == LIST_MODEL.MULTIPLE,
          ['m-list-cancel']: clickCancel,
        })}
      >
        <MailMultiOperation cancelFn={handleCancel} sliceId={sliceId} />
      </div>
      <FilterTab
        list={condition}
        clickItem={clickTab}
        selectedType={_selected}
        suffix={
          _selected == 'ME' ? (
            <Dropdown
              trigger={['click']}
              overlayClassName="sunTabMenu-warp-cm"
              onVisibleChange={open => setTabMenuVisible(open)}
              overlay={
                <Menu onClick={clickMenu} selectedKeys={[isSearching ? tabMenuSelectedSearch : tabMenuSelected]}>
                  {customerTabMenuConfig.map(item => {
                    return <Menu.Item key={item.key}>{item.title}</Menu.Item>;
                  })}
                </Menu>
              }
            >
              <div style={{ display: 'flex' }}>
                <div style={{ marginRight: 8 }}>{customerKey2TitleMap[isSearching ? tabMenuSelectedSearch : tabMenuSelected]}</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {tabMenuVisible ? (
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9.07551 5.00476C9.24231 5.19936 9.10404 5.5 8.84773 5.5H1.15227C0.895961 5.5 0.757688 5.19936 0.924489 5.00476L4.77222 0.51574C4.89195 0.376056 5.10805 0.376056 5.22778 0.51574L9.07551 5.00476Z"
                        fill="#8D92A1"
                      />
                    </svg>
                  ) : (
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9.07551 0.995237C9.24231 0.800635 9.10404 0.5 8.84773 0.5L1.15227 0.5C0.895961 0.5 0.757688 0.800635 0.924489 0.995237L4.77222 5.48426C4.89195 5.62394 5.10805 5.62394 5.22778 5.48426L9.07551 0.995237Z"
                        fill="#8D92A1"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </Dropdown>
          ) : (
            <></>
          )
        }
      />
    </>
  );
};
export default FilterTabCm;
