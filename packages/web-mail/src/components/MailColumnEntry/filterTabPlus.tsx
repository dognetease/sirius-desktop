import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Divider, Menu, Dropdown, Tooltip } from 'antd';
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
import { ReactComponent as MailClearIcon } from '@/images/icons/mail_clear.svg';
import { ReactComponent as FilterTriangleUpIcon } from '@/images/icons/filter_triangle_up.svg';
import QuickSettingButton from './quickSettingButton';
import SortTimeRangeModel from '@web-mail/common/components/MailSort/SortTimeRangeModel/sortTimeRangeModel';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { useAppDispatch, useAppSelector, MailActions, useActions } from '@web-common/state/createStore';
import { Button } from 'antd';
import { isMainAccount, getTreeStatesByAccount } from '@web-mail/util';
import RealListPager from './realListPager';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import MailSignCheckbox from './MailSignCheckbox';
import { getIn18Text } from 'api';
import AutoSizeOperTab, { AutoSizeOperTabItem } from '@web-mail/common/components/AutoSizeOperTab/AutoSizeOperTab';

interface FilterTabPlusProps {
  unread: number;
  // 点击tab
  clickItem: (item: any) => void;
  handleAllRead: () => Promise<any>;
  isMerge: boolean;
  hiddenFilter: boolean;
  operElement?: any;
}

const { SubMenu } = Menu;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const FilterTabPlus: React.FC<any> = (props: FilterTabPlusProps) => {
  const { unread, clickItem, handleAllRead, isMerge, hiddenFilter, operElement } = props || {};
  const dispatch = useAppDispatch();
  // 是否通栏
  const [configMailLayout, setConfigMailLayout] = useState2RM('configMailLayout', 'doUpdateConfigMailLayout');
  const [selectedKeys, setSelectedKeys] = useState2RM('selectedKeys', 'doUpdateSelectedKey');
  const [, setDateRange] = useState2RM('orderDateRange', 'doUpdateOrderDateRange');
  // 是否展示我的客户筛选
  const [showCustomerTab] = useState2RM('configMailListShowCustomerTab', 'doUpdateConfigMailListShowCustomerTab');

  const isLeftRight = useMemo(() => configMailLayout === '1', [configMailLayout]);
  const isLong = useMemo(() => configMailLayout === '2', [configMailLayout]);
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
    const map = getTreeStatesByAccount(state.mailReducer.mailTreeStateMap, account)?.allReadLoadingMap;
    // state.mailReducer.mailTreeStateMap[account]?.allReadLoadingMap;
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

  // 二级结构
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

  // 一级结构
  const MenuLevel1 = useMemo(() => {
    const level1 = filterData.filter(item => item.level === 1);
    const level2 = filterData.filter(item => item.level === 2);
    if (level1.length <= 0) {
      return MenuLevel2;
    }
    return (
      <>
        {level1.map((item, index) => (
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
            {item?.needDivider && index !== level1.length - 1 && <Divider className="divider-horizontal" />}
          </>
        ))}
        {level2.length > 0 && (
          <>
            <Divider className="divider-horizontal" />
            <SubMenu key="level2" title={getIn18Text('PAIXU')} className={level2.some(item => item.key === selected) ? 'm-list-filter-select-sub' : ''}>
              {MenuLevel2}
            </SubMenu>
          </>
        )}
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
      // <AutoSizeOperTab className="m-list-title-wrap" style={{ paddingLeft: isLong ? '9px' : undefined }}>
      <AutoSizeOperTab className="m-list-title m-list-filter">
        <div className="m-list-tab">
          <AutoSizeOperTabItem tabkey="MailSignCheckbox">
            <div className="checkbox-wrap">
              <MailSignCheckbox />
            </div>
          </AutoSizeOperTabItem>
          {
            // 外贸通下，需要展示我的客户筛选
            process.env.BUILD_ISEDM && (
              <>
                {selected !== MAIL_SORT_ITEM.ORDER_BY_DATE_DESC && (
                  <>
                    <AutoSizeOperTabItem tabkey="FilterCloseIcon" className="m-list-filter-icon" onClick={() => setFilterTab(MAIL_SORT_ITEM.ORDER_BY_DATE_DESC, 'reset')}>
                      <FilterCloseIcon />
                    </AutoSizeOperTabItem>
                    {/* 有筛选时分割线展示在关闭按钮右侧，筛选按钮左侧 */}
                    {/* <Divider className="divider-vertical" type="vertical" /> */}
                  </>
                )}
                {/* 下拉筛选项，默认展示筛选icon，有筛选时展示筛选按钮 */}
                {filterData?.length ? (
                  <AutoSizeOperTabItem tabkey="Dropdown">
                    <Dropdown
                      overlay={
                        <Menu getPopupContainer={node => node} onClick={({ item, key }) => setFilterTab(key as MAIL_SORT_ITEM)}>
                          {MenuLevel1}
                        </Menu>
                      }
                      trigger={['click']}
                      overlayClassName="m-list-filter-dropdown"
                      onVisibleChange={open => handelDropdownOpen(open)}
                    >
                      {selected === MAIL_SORT_ITEM.ORDER_BY_DATE_DESC ? (
                        <Tooltip placement="top" title={getIn18Text('SHAIXUANYUPAIX')}>
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
                  </AutoSizeOperTabItem>
                ) : null}
              </>
            )
          }
          <AutoSizeOperTabItem tabkey="unread" level={3} defaultWidth={151} smallWidth={80}>
            {size => {
              return (
                <span className={classnames(['sirius-no-drag', 'unread-txt'])} style={{ marginTop: '15px', marginLeft: '12px' }}>
                  {size == 2 ? getIn18Text('GAIYOUXIANGZHONGYOU') : <></>}
                  <span className="text-highlight" style={{ margin: '0 3px' }}>
                    {unread}
                  </span>
                  {getIn18Text('FENGWEIDUYOUJIAN')}
                </span>
              );
            }}
          </AutoSizeOperTabItem>
        </div>
        <div className="u-mark-read sirius-no-drag">
          {/* 实体列表分页器 */}
          {!isLeftRight && shouldUseRealList && (
            <AutoSizeOperTabItem className="mail-list-filter-page-wrapper" level={3} defaultWidth={430} smallWidth={260}>
              {size => {
                return (
                  <RealListPager
                    size={size != 2 ? 'small' : 'normal'}
                    hidePaginationItem={process.env.BUILD_ISEDM ? true : undefined}
                    showCustomPageSelect={true}
                    hideQuickJumper={true}
                    style={size != 2 ? { marginTop: 3 } : undefined}
                  />
                );
              }}
            </AutoSizeOperTabItem>
          )}
          {/* <span className="u-mark-read sirius-no-drag" onClick={beforeHandleAllRead}>
            {getIn18Text('QUANBIAOYIDU')}
          </span> */}
          {/* 全表已读 */}
          {showUnread ? (
            <AutoSizeOperTabItem level={2} tabkey="qbyd" defaultWidth={67} smallWidth={17.5}>
              {size => {
                return size == 2 ? (
                  <Button
                    className="u-mark-read sirius-no-drag"
                    onClick={beforeHandleAllRead}
                    loading={!!allReadLoadingMap[selectedKeys?.id + '']}
                    type="link"
                    style={{ height: '26px', marginTop: '10px', padding: ' 4px 2px', minWidth: 'auto' }}
                    data-test-id="mail-list-tab-mard-all-read"
                  >
                    {getIn18Text('QUANBIAOYIDU')}
                  </Button>
                ) : (
                  <Tooltip placement="top" title={getIn18Text('QUANBIAOYIDU')}>
                    <Button
                      data-test-id="mail-list-tab-mard-all-read"
                      className="u-mark-read sirius-no-drag"
                      onClick={beforeHandleAllRead}
                      loading={!!allReadLoadingMap[selectedKeys?.id + '']}
                      type="link"
                      style={{ height: '26px', marginTop: '12px', padding: ' 4px 2px', minWidth: 'auto' }}
                    >
                      <MailClearIcon />
                    </Button>
                  </Tooltip>
                );
              }}
            </AutoSizeOperTabItem>
          ) : (
            <></>
          )}
          {/* 快捷设置 */}
          <AutoSizeOperTabItem tabkey="quicksetting" gapSize={13}>
            <div style={{ marginTop: '15px' }}>
              <QuickSettingButton isMini={isLeftRight} />
            </div>
          </AutoSizeOperTabItem>
        </div>
        {operElement}
      </AutoSizeOperTab>
      // </AutoSizeOperTab>
    );
  }

  /**
   * 正常流程
   * 注意，AutoSizeOperTab 的相关样式，涉及到自动测量相关业务，谨慎改动。
   */
  return (
    <AutoSizeOperTab className="m-list-title-wrap" style={{ paddingLeft: isLong ? '9px' : undefined }}>
      <div className="m-list-title m-list-filter" style={{ borderBottom: 'none' }}>
        <div className="m-list-tab">
          <AutoSizeOperTabItem tabkey="MailSignCheckbox">
            <div className="checkbox-wrap">
              <MailSignCheckbox />
            </div>
          </AutoSizeOperTabItem>
          {!hiddenFilter && !isSearching && filterData?.length ? (
            <>
              {/* 有筛选时展示清空筛选按钮 */}
              {selected !== MAIL_SORT_ITEM.ORDER_BY_DATE_DESC && (
                <>
                  <AutoSizeOperTabItem
                    tabkey="FilterCloseIcon"
                    className="m-list-filter-icon"
                    data-test-id="mail-list-tab-filter-btn"
                    onClick={() => setFilterTab(MAIL_SORT_ITEM.ORDER_BY_DATE_DESC, 'reset')}
                  >
                    <FilterCloseIcon />
                  </AutoSizeOperTabItem>
                  {/* 有筛选时分割线展示在关闭按钮右侧，筛选按钮左侧 */}
                  {/* <Divider className="divider-vertical" type="vertical" /> */}
                </>
              )}
              {/* 下拉筛选项，默认展示筛选icon，有筛选时展示筛选按钮 */}
              <AutoSizeOperTabItem tabkey="Dropdown">
                <Dropdown
                  overlay={
                    <Menu getPopupContainer={node => node} onClick={({ item, key }) => setFilterTab(key as MAIL_SORT_ITEM)}>
                      {MenuLevel1}
                    </Menu>
                  }
                  trigger={['click']}
                  overlayClassName="m-list-filter-dropdown"
                  onVisibleChange={open => handelDropdownOpen(open)}
                >
                  {selected === MAIL_SORT_ITEM.ORDER_BY_DATE_DESC ? (
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
              </AutoSizeOperTabItem>

              {/* 默认筛选且有未读时或稍后处理文件夹下 分割线展示在筛选按钮右侧，未读按钮左侧 */}
              {/* {selected === MAIL_SORT_ITEM.ORDER_BY_DATE_DESC && (showUnread || selectedKeys?.id == FLOLDER.DEFER) ? (
                // <Divider className="divider-vertical" type="vertical" />
              ) : (
                <></>
              )} */}
              {/* 有未读时且排序方式为时间升降序时展示x封未读 */}
              {showUnread && [MAIL_SORT_ITEM.ORDER_BY_DATE_DESC, MAIL_SORT_ITEM.ORDER_BY_DATE_ASC].includes(selected as MAIL_SORT_ITEM) ? (
                <AutoSizeOperTabItem tabkey="unread">
                  <div
                    className={classnames(['sirius-no-drag', 'm-list-filter-btn', 'unread-txt', selected === MAIL_SORT_ITEM.UNREAD ? 'm-list-filter-selected' : ''])}
                    onClick={() => handleUnRead()}
                  >
                    <>
                      <span className="text-highlight" data-test-id="mail-list-tab-unread">
                        {unread}
                      </span>
                      {getIn18Text('FENGWEIDU')}
                    </>
                  </div>
                </AutoSizeOperTabItem>
              ) : (
                <></>
              )}
              {/* 仅时间降序、时间升序和仅未读，有全标已读按钮 */}
              {allReadConditionList.includes(selected as MAIL_SORT_ITEM) && showUnread ? (
                // <span className="u-mark-read sirius-no-drag" onClick={() => beforeHandleAllRead()}>{getIn18Text('QUANBIAOYIDU')}</span>
                <AutoSizeOperTabItem level={2} tabkey="qbyd" defaultWidth={67} smallWidth={17.5}>
                  {size => {
                    return size == 2 ? (
                      <Button
                        data-test-id="mail-list-tab-mard-all-read"
                        className="u-mark-read sirius-no-drag"
                        onClick={beforeHandleAllRead}
                        loading={!!allReadLoadingMap[selectedKeys?.id + '']}
                        type="link"
                        style={{ height: '26px', marginTop: '10px', padding: ' 4px 2px', minWidth: 'auto' }}
                      >
                        {getIn18Text('QUANBIAOYIDU')}
                      </Button>
                    ) : (
                      <Tooltip placement="top" title={getIn18Text('QUANBIAOYIDU')}>
                        <Button
                          data-test-id="mail-list-tab-mard-all-read"
                          className="u-mark-read sirius-no-drag"
                          onClick={beforeHandleAllRead}
                          loading={!!allReadLoadingMap[selectedKeys?.id + '']}
                          type="link"
                          style={{ height: '26px', marginTop: '12px', padding: ' 4px 2px', minWidth: 'auto' }}
                        >
                          <MailClearIcon />
                        </Button>
                      </Tooltip>
                    );
                  }}
                </AutoSizeOperTabItem>
              ) : (
                <></>
              )}
              {/* 全标已处理 */}
              {selectedKeys?.id == FLOLDER.DEFER ? (
                //  <span className="u-mark-read sirius-no-drag" onClick={() => { handleAllDefer() }}>{getIn18Text('QUANBIAOYIJIEJUE')}</span>
                <AutoSizeOperTabItem tabkey="ycyd">
                  <Button
                    data-test-id="mail-list-tab-mard-all-read"
                    className="u-mark-read sirius-no-drag"
                    onClick={handleAllDefer}
                    loading={!!allReadLoadingMap[selectedKeys?.id + '']}
                    type="link"
                    style={{ height: '26px', marginTop: '10px', padding: ' 4px 2px', minWidth: 'auto' }}
                  >
                    {getIn18Text('QUANBIAOYIJIEJUE')}
                  </Button>
                </AutoSizeOperTabItem>
              ) : (
                <></>
              )}
            </>
          ) : (
            <></>
          )}
        </div>
        <div style={{ display: 'flex' }}>
          {/* 实体列表分页器 */}
          {!isLeftRight && shouldUseRealList && (
            <AutoSizeOperTabItem className="mail-list-filter-page-wrapper" level={3} defaultWidth={430} smallWidth={260}>
              {size => {
                return (
                  <RealListPager
                    size={size != 2 ? 'small' : 'normal'}
                    hidePaginationItem={process.env.BUILD_ISEDM ? true : undefined}
                    showCustomPageSelect={true}
                    hideQuickJumper={true}
                    style={size != 2 ? { marginTop: 3 } : undefined}
                  />
                );
              }}
            </AutoSizeOperTabItem>
          )}
          {/* 快捷设置 */}
          <AutoSizeOperTabItem tabkey="quicksetting">
            <div className="u-mark-read sirius-no-drag" style={{ marginTop: '15px' }}>
              <QuickSettingButton isMini={isLeftRight} onDrawerOpen={handelQuickSettingOpen} />
            </div>
          </AutoSizeOperTabItem>
        </div>
      </div>
      {operElement}
    </AutoSizeOperTab>
  );
};
export default FilterTabPlus;
