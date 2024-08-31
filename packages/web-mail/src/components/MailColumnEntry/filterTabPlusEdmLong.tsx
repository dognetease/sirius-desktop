import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Divider, Menu, Dropdown, Tooltip, Tabs } from 'antd';
import { apiHolder, apis, DataTrackerApi } from 'api';
import classnames from 'classnames';
import useState2RM from '../../hooks/useState2ReduxMock';
import useShouldUseRealList from '../../hooks/useShouldUseRealList';
import { FLOLDER, MAIL_SORT_ITEM } from '@web-mail/common/constant';
import DefaultMailSortConfig from '@web-mail/common/components/MailSort/DefaultMailSortConfig';
import { allReadConditionList } from '@web-mail/common/components/MailSort/DefaultMailSortConfig';
import { needTimeRangeByMailOrderType } from '@web-mail/state/customize/utils';
import { ReactComponent as FilterIcon } from '@/images/icons/filter.svg';
import { ReactComponent as FilterCheckedIcon } from '@/images/icons/filter_checked.svg';
import { CommonMailSortConfig } from '@web-mail/types';
import { ReactComponent as FilterSelectedIcon } from '@/images/icons/filter_selected.svg';
import { ReactComponent as FilterCloseIcon } from '@/images/icons/filter_close.svg';
import { ReactComponent as FilterTriangleDownIcon } from '@/images/icons/filter_triangle_down.svg';
import { ReactComponent as FilterTriangleUpIcon } from '@/images/icons/filter_triangle_up.svg';
import QuickSettingButton from './quickSettingButton';
import SortTimeRangeModel from '@web-mail/common/components/MailSort/SortTimeRangeModel/sortTimeRangeModel';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { useAppDispatch, useAppSelector, MailActions, useActions } from '@web-common/state/createStore';
import { Button } from 'antd';
import { isMainAccount } from '@web-mail/util';
import RealListPager from './realListPager';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import MailSignCheckbox from './MailSignCheckbox';
import { getIn18Text } from 'api';
import style from './filterTabPlusEdmLong.module.scss';
const { TabPane } = Tabs;

interface FilterTabPlusProps {
  unread: number;
  // 点击tab
  clickItem: (item: any) => void;
  handleAllRead: () => Promise<any>;
  isMerge: boolean;
  hiddenFilter: boolean;
  operElement?: any;
}

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

// 外贸通，通栏下的筛选组件
const FilterTabEdmLong: React.FC<any> = (props: FilterTabPlusProps) => {
  const { unread, clickItem, handleAllRead, isMerge, hiddenFilter, operElement } = props || {};
  const dispatch = useAppDispatch();
  // 是否通栏
  const [configMailLayout, setConfigMailLayout] = useState2RM('configMailLayout', 'doUpdateConfigMailLayout');
  const [selectedKeys, setSelectedKeys] = useState2RM('selectedKeys', 'doUpdateSelectedKey');
  const [, setDateRange] = useState2RM('orderDateRange', 'doUpdateOrderDateRange');
  // 是否展示我的客户筛选
  const [showCustomerTab] = useState2RM('configMailListShowCustomerTab', 'doUpdateConfigMailListShowCustomerTab');
  // 是否左右布局
  const isLeftRight = useMemo(() => configMailLayout === '1', [configMailLayout]);
  // 邮件列表-上部-二级tab选中
  const [selected, setSelected] = useState2RM('mailListStateTab', 'doUpdateMailListStateTab');

  const shouldUseRealList = useShouldUseRealList();
  // 展示筛选
  const [filterData, setFilterData] = useState<CommonMailSortConfig[]>([]);
  // 筛选项是否展开
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2RM('mailSearching');
  // 邮件-搜索-是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  // 获取文件夹treeMap
  const allReadLoadingMap = useAppSelector(state => {
    const account = isMainAccount(selectedKeys?.accountId) ? 'main' : selectedKeys?.accountId;
    const map = state.mailReducer.mailTreeStateMap[account]?.allReadLoadingMap;
    return map || {};
  });
  const reducer = useActions(MailActions);
  // 点击未读
  const handleUnRead = () => {
    clickItem({ type: MAIL_SORT_ITEM.UNREAD, title: '未读' });
    trackApi.track('pcMail_click_topButton_mailListPage', { buttonName: '未读' });
  };
  // 点击全标已读
  const beforeHandleAllRead = () => {
    SiriusModal.confirm({
      title: getIn18Text('markAllConfirm'),
      hideCancel: true,
      okText: getIn18Text('QUEREN'),
      okButtonProps: { danger: true, type: 'default' },
      onOk: () => {
        trackApi.track('pcMail_click_topButton_mailListPage', { buttonName: '全标已读' });
        handleAllRead();
      },
      onCancel: () => {
        return false;
      },
    });
  };
  // 点击进行筛选
  const handelDropdownOpen = (open: boolean) => {
    setDropdownOpen(open);
    // 在默认筛选情况下点击上报
    if (selected === MAIL_SORT_ITEM.ORDER_BY_DATE_DESC) {
      trackApi.track('pcMail_click_topButton_mailListPage', { buttonName: '筛选按钮' });
    }
  };
  // 点击快捷设置
  const handelQuickSettingOpen = () => {
    trackApi.track('pcMail_click_topButton_mailListPage', { buttonName: '邮箱设置' });
  };

  // 时间选择弹窗
  const sortTimeRangeSelect = (key: MAIL_SORT_ITEM) => {
    const div = document.createElement('div');
    const parent = document.body;
    const destroy = () => {
      ReactDOM.unmountComponentAtNode(div);
      parent.removeChild(div);
    };
    const onComplete = (success: boolean, data: string[]) => {
      if (success && data.length >= 2) {
        setDateRange({
          startDate: data[0],
          endDate: data[1],
        });
        setSelected(key);
        setDropdownOpen(false);
      } else {
      }
    };
    const options = { destroy, onComplete };
    parent.appendChild(div);
    ReactDOM.render(<SortTimeRangeModel {...options} />, div);
  };

  // 整理筛选项可展示数据
  useEffect(() => {
    if (!DefaultMailSortConfig || !selectedKeys) {
      return;
    }
    const defaultList: CommonMailSortConfig[] = [];
    const data = Object.values(DefaultMailSortConfig);
    // 分组
    data.forEach(item => {
      let show = typeof item.show == 'function' ? item.show : () => item.show;
      if (show(selectedKeys.id as number)) {
        defaultList.push(item);
      }
    });
    setFilterData(defaultList);
  }, [selectedKeys?.id, isMerge, showCustomerTab]);

  // 点击tab筛选
  const tabChange = (key: any) => {
    setFilterTab(key as MAIL_SORT_ITEM);
  };

  // 非排序类的筛选
  const tabLevel1 = useMemo(() => {
    const level1 = filterData.filter(item => item.level === 1);
    // 是否展示tab, 当前选中的筛选不是时间倒序（默认的），也不是level1级别的的，就不展示
    const showTab = level1.map(item => item.key).some(item => item === selected) || selected === MAIL_SORT_ITEM.ORDER_BY_DATE_DESC;
    // 先判断是否展示
    if (!level1.length || !showTab) {
      return <></>;
    }
    // 补充一个全部的tab
    level1.unshift({
      key: MAIL_SORT_ITEM.ORDER_BY_DATE_DESC,
      level: 1,
      name: getIn18Text('QUANBU'),
    });
    return (
      <div className={style.tabList}>
        <Tabs className={style.customerTab} tabBarGutter={28} activeKey={selected} onChange={tabChange}>
          {level1.map(item => (
            <TabPane tab={item.tabName || item.name} key={item.key} />
          ))}
        </Tabs>
      </div>
    );
  }, [filterData, selected]);

  // 二级结构,排序类的筛选
  const MenuLevel2 = useMemo(() => {
    const level2 = filterData.filter(item => item.level === 2);
    return (
      <>
        {level2.map((item, index) => (
          <>
            <Menu.Item key={item.key}>
              {item.key === selected ? (
                <span className="m-list-filter-select">
                  <span>{item.name}</span>
                  <FilterCheckedIcon />
                </span>
              ) : (
                <>{item.name}</>
              )}
            </Menu.Item>
            {index % 2 == 1 && index !== level2.length - 1 && <Divider className="divider-horizontal" />}
          </>
        ))}
      </>
    );
  }, [filterData, selected]);

  // 选中筛选项
  const setFilterTab = (key: MAIL_SORT_ITEM, type?: string) => {
    setDropdownOpen(false);
    const name = filterData?.find(item => item.key === key)?.name;
    type === 'reset'
      ? trackApi.track('pcMail_click_options_mailFiltrate__mailListPage', { option: '退出筛选排序' })
      : trackApi.track('pcMail_click_options_mailFiltrate__mailListPage', { option: name });
    if (needTimeRangeByMailOrderType(key)) {
      sortTimeRangeSelect(key);
      return;
    }
    setSelected(key);
  };

  // 是否显示未读
  const showUnread = useMemo(() => {
    return unread > 0 && ![FLOLDER.DEFER, FLOLDER.DRAFT].includes(selectedKeys?.id);
  }, [unread, selectedKeys?.id]);

  // 邮件待办 全标已处理
  const handleAllDefer = () => {
    // 代办只有主账号
    reducer.updateAllReadLoading({
      folderId: FLOLDER.DEFER,
      loading: true,
    });
    dispatch(
      Thunks.doActiveAllReadDefer({
        folderId: selectedKeys.id,
        deferTime: selected === 'DEFER' ? `:${moment().format('YYYYMMDD')}` : undefined,
      })
    )
      .unwrap()
      .finally(() => {
        // 延迟消失，以让用户可以看到loading状态
        setTimeout(() => {
          reducer.updateAllReadLoading({
            folderId: FLOLDER.DEFER,
            loading: false,
          });
        }, 1500);
      });
  };

  // 如果是未读文件夹
  if (selectedKeys?.id == FLOLDER.UNREAD) {
    return (
      <>
        <div className="m-list-title-wrap" style={{ paddingLeft: 9 }}>
          <div className="m-list-title m-list-filter" style={{ height: 47, borderBottom: 'none' }}>
            <div className="m-list-tab">
              <div className="checkbox-wrap">
                <MailSignCheckbox />
              </div>
              <span className={classnames(['sirius-no-drag', 'unread-txt'])} style={{ marginTop: '15px', marginLeft: '12px' }}>
                {getIn18Text('GAIYOUXIANGZHONGYOU')}
                <span className="text-highlight" style={{ margin: '0 3px' }}>
                  {unread}
                </span>
                {getIn18Text('FENGWEIDUYOUJIAN')}
              </span>
            </div>
            <div className="u-mark-read sirius-no-drag">
              {/* 实体列表分页器 */}
              {!isLeftRight && shouldUseRealList && (
                <div className="mail-list-filter-page-wrapper">
                  <RealListPager hidePaginationItem={process.env.BUILD_ISEDM ? true : undefined} hideQuickJumper={true} showCustomPageSelect={true} />
                </div>
              )}
              {/* <span className="u-mark-read sirius-no-drag" onClick={beforeHandleAllRead}>
                {getIn18Text('QUANBIAOYIDU')}
              </span> */}
              {/* 全表已读 */}
              {showUnread ? (
                <Button
                  className="u-mark-read sirius-no-drag"
                  onClick={beforeHandleAllRead}
                  loading={!!allReadLoadingMap[selectedKeys?.id + '']}
                  type="link"
                  style={{ height: '26px', marginTop: '12px', padding: ' 4px 2px', minWidth: 'auto', marginLeft: '10px' }}
                >
                  {getIn18Text('QUANBIAOYIDU')}
                </Button>
              ) : (
                <></>
              )}
              {/* 快捷设置 */}
              <div style={{ marginTop: '16px' }}>
                <QuickSettingButton isMini={isLeftRight} />
              </div>
            </div>
          </div>
        </div>
        {/* 渲染非排序类的筛选 */}
        {tabLevel1}
      </>
    );
  }

  // 正常流程
  return (
    <>
      <div className="m-list-title-wrap" style={{ paddingLeft: 9 }}>
        <div className="m-list-title m-list-filter" style={{ borderBottom: 'none', height: 47 }}>
          <div className="m-list-tab">
            <div className="checkbox-wrap">
              <MailSignCheckbox />
            </div>
            {!hiddenFilter && !isSearching && filterData?.length ? (
              <>
                {/* 有筛选时展示清空筛选按钮 */}
                {selected !== MAIL_SORT_ITEM.ORDER_BY_DATE_DESC && !filterData.filter(item => item.level === 1).some(item => item.key === selected) && (
                  <>
                    <div className="m-list-filter-icon" onClick={() => setFilterTab(MAIL_SORT_ITEM.ORDER_BY_DATE_DESC, 'reset')}>
                      <FilterCloseIcon />
                    </div>
                  </>
                )}
                {/* 下拉筛选项，默认展示筛选icon，有筛选时展示筛选按钮,仅展示排序类的筛选 */}
                {!!filterData.filter(item => item.level === 2).length && (
                  <Dropdown
                    overlay={
                      <Menu getPopupContainer={node => node} onClick={({ item, key }) => setFilterTab(key as MAIL_SORT_ITEM)}>
                        {MenuLevel2}
                      </Menu>
                    }
                    trigger={['click']}
                    overlayClassName="m-list-filter-dropdown"
                    onVisibleChange={open => handelDropdownOpen(open)}
                  >
                    {selected === MAIL_SORT_ITEM.ORDER_BY_DATE_DESC || filterData.filter(item => item.level === 1).some(item => item.key === selected) ? (
                      <Tooltip placement="top" title={getIn18Text('SHAIXUAN')}>
                        <div className={classnames('m-list-filter-icon', dropdownOpen ? 'm-list-filter-icon-selected' : '')}>
                          {dropdownOpen ? <FilterSelectedIcon /> : <FilterIcon />}
                        </div>
                      </Tooltip>
                    ) : (
                      <div className="m-list-filter-btn m-list-filter-btn-selected">
                        <span>{Object.values(DefaultMailSortConfig).find(item => item.key === selected)?.name}</span>
                        {dropdownOpen ? <FilterTriangleUpIcon /> : <FilterTriangleDownIcon />}
                      </div>
                    )}
                  </Dropdown>
                )}
                {/* 有未读时且排序方式为时间升降序时展示x封未读 */}
                {showUnread && [MAIL_SORT_ITEM.ORDER_BY_DATE_DESC, MAIL_SORT_ITEM.ORDER_BY_DATE_ASC].includes(selected as MAIL_SORT_ITEM) ? (
                  <div
                    className={classnames(['sirius-no-drag', 'm-list-filter-btn', 'unread-txt', selected === MAIL_SORT_ITEM.UNREAD ? 'm-list-filter-selected' : ''])}
                    onClick={() => handleUnRead()}
                  >
                    <span className="text-highlight">{unread}</span>
                    {getIn18Text('FENGWEIDU')}
                  </div>
                ) : (
                  <></>
                )}
                {/* 仅时间降序、时间升序和仅未读，有全标已读按钮 */}
                {allReadConditionList.includes(selected as MAIL_SORT_ITEM) && showUnread ? (
                  // <span className="u-mark-read sirius-no-drag" onClick={() => beforeHandleAllRead()}>{getIn18Text('QUANBIAOYIDU')}</span>
                  <Button
                    className="u-mark-read sirius-no-drag"
                    onClick={beforeHandleAllRead}
                    loading={!!allReadLoadingMap[selectedKeys?.id + '']}
                    type="link"
                    style={{ height: '26px', marginTop: '10px', padding: ' 4px 2px', minWidth: 'auto', marginLeft: '10px' }}
                  >
                    {getIn18Text('QUANBIAOYIDU')}
                  </Button>
                ) : (
                  <></>
                )}
                {/* 全标已处理 */}
                {selectedKeys?.id == FLOLDER.DEFER ? (
                  //  <span className="u-mark-read sirius-no-drag" onClick={() => { handleAllDefer() }}>{getIn18Text('QUANBIAOYIJIEJUE')}</span>
                  <Button
                    className="u-mark-read sirius-no-drag"
                    onClick={handleAllDefer}
                    loading={!!allReadLoadingMap[selectedKeys?.id + '']}
                    type="link"
                    style={{ height: '26px', marginTop: '10px', padding: ' 4px 2px', minWidth: 'auto', marginLeft: '10px' }}
                  >
                    {getIn18Text('QUANBIAOYIJIEJUE')}
                  </Button>
                ) : (
                  <></>
                )}
              </>
            ) : (
              <></>
            )}
          </div>
          {/* 实体列表分页器 */}
          {!isLeftRight && shouldUseRealList && (
            <div className="mail-list-filter-page-wrapper">
              <RealListPager hidePaginationItem={process.env.BUILD_ISEDM ? true : undefined} showCustomPageSelect={true} hideQuickJumper={true} />
            </div>
          )}
          {/* 快捷设置 */}
          <div className="u-mark-read sirius-no-drag" style={{ marginTop: '15px' }}>
            <QuickSettingButton isMini={isLeftRight} onDrawerOpen={handelQuickSettingOpen} />
          </div>
        </div>
        {operElement}
      </div>
      {/* 通栏下一级筛选提取出来 */}
      {/* 渲染非排序类的筛选 */}
      {tabLevel1}
    </>
  );
};
export default FilterTabEdmLong;
