import React, { useRef, useState, useEffect, useCallback, useMemo, useImperativeHandle } from 'react';
import lodashGet from 'lodash/get';
import { isObject } from 'lodash';
import { Spin, Tooltip, Button, Form } from 'antd';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import debounce from 'lodash/debounce';
import {
  apiHolder as api,
  apis,
  MailApi,
  DataTrackerApi,
  MailBoxModel,
  SystemApi,
  MailSearchTypes,
  AccountApi,
  getFolderStartContactId,
  PersonalMarkParams,
  SystemEventTypeNames,
} from 'api';
import { useActions, useAppDispatch, MailActions, useAppSelector, HollowOutGuideAction } from '@web-common/state/createStore';
import NetWatcher from '@web-common/components/UI/NetWatcher';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import useMsgCallback from '@web-common/hooks/useMsgCallback';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { actions as mailTabActions, tabId, tabType } from '@web-common/state/reducer/mailTabReducer';
import MultAccountsLoginModal from '@web-common/components/UI/MultAccountsLoginModal/index';
import { accountObj } from '../../types';
import AdvancedSearchForm from '../AdvancedSearchForm/AdvancedSearchForm';
import useState2RM from '../../hooks/useState2ReduxMock';
import BaseSearchFilter from '../BaseSearchFilter';
import SearchResult from './SearchResult';
import { FLOLDER, MAIL_SEARCH_FILTER } from '../../common/constant';
import PersonalMarkModalProps from '@web-common/components/UI/SiriusContact/personalMark/modal';
import { folderId2Number, buildSearchString, getFolderNameById, folderIdIsContact, promiseIsTimeOut } from '../../util';
// 17版本智能模式下线，FolderName组件无引用，可以删除
// import FolderName from './FolderName';
import MailSubTab from './MailSubTab';

// import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
import EmlUploader from './EmlUploader';
import SearchBox from './SearchBox';
import MailFolders from './MailFolders';
import { getIn18Text } from 'api';
import { AddTagIcon } from '@web-mail/components/MailTagList/Icon';
import { eventApi } from '@web-contact/_mock_';

const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

// const ADD_ACCOUNT_TIP_FLAG = 'addAccountTipShowed';

const ColumnMailBox: React.ForwardRefRenderFunction<any, any> = (props, ref) => {
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const dispatch = useAppDispatch();
  const reducer = useActions(MailActions);
  // const { doNextStep } = useActions(HollowOutGuideAction);
  // 邮件-搜索-搜索类型
  const [mailSearching, doUpdateMailSearching] = useState2RM('mailSearching', 'doUpdateMailSearching');
  // 邮件-搜索-搜索状态对象
  const [mailSearchStateMap, doUpdateMailSearchStateMap] = useState2RM('mailSearchStateMap', 'doUpdateMailSearchStateMap');
  // 邮件-搜索-关键字
  // const [mailSearchKey, setMailSearchKey] = useState2RM('mailSearchKey', 'doUpdateMailSearchKey');
  // 邮件-搜索-是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  // 邮件-搜索-是否是高级搜素
  const isAdvancedSearch = useMemo(() => mailSearching === 'advanced', [mailSearching]);
  // 邮件-搜索-类别
  const [searchType, setSearchType] = useState2RM('mailSearchType', 'doUpdateMailSearchType');
  // 邮件-搜索-是否需要记录
  const [, setMailSearchRecord] = useState2RM('', 'doUpdateMailSearchRecord');
  // 邮件搜索是否处于loading
  const [searchLoading, setSearchLoading] = useState2RM('searchLoading', 'doUpdateMailSearchLoading');
  // 邮件列表是否处于loading
  const [, setListLoading] = useState2RM('', 'doUpdateMailListLoading');
  // 搜索列表-当前选中的key
  const [selectedSearchKeys, setSelectedSearchKeys] = useState2RM('selectedSearchKeys', 'doUpdateSelectedSearchKey');
  // 邮件列表-当前选中的key
  const [selectedKeys, setSelectedKeys] = useState2RM('selectedKeys', 'doUpdateSelectedKey');
  // 收信按钮-loading状态
  const [refreshBtnLoading, setRefreshBtnLoading] = useState2RM('refreshBtnLoading', 'doUpdateRefershBtnLoading');
  // 当前页签
  const currentTabType = useAppSelector(state => state.mailTabReducer.currentTab.type);
  // 是否显示高级搜索弹窗
  const [advancedSearchVisible, setAdvancedSearchVisible] = useState2RM('advancedSearchVisible', 'doUpdateAdvancedSearchVisible');
  // 搜索-文件夹树-展开的key
  const [expandedSearchKeys, setExpandedSearchKeys] = useState2RM('expandedSearchKeys', 'doUpdateExpandedSearchKeys');
  // 邮件文件夹相关状态map
  const [mailTreeStateMap, setTreeState] = useState2RM('mailTreeStateMap', 'doUpdateMailTreeState');
  // 获取左侧列表头部二级tab
  // const subTabList = useAppSelector(state => state.mailTabReducer?.tabList[0]?.subTabs);
  // 是否展示添加联系人弹窗
  const [addContactModelVisiable, setAddContactModelVisiable] = useState2RM('addContactModelVisiable');

  // 邮件文件夹-强化提醒的folderid list
  // const [activeFolderList, setActiveFolderList] = useState2RM('activeFolderList', 'doUpdateActiveFolderList');
  // 邮件-高级搜索-loading状态
  const [advancedSearchLoading, setAdvancedSearchLoading] = useState2RM('advancedSearchLoading', 'doUpdateAdvancedSearchLoading');
  // 邮件-搜索-选中的邮件id
  const [, setSearchMail] = useState2RM('', 'doUpdateActiveSearchMailId');
  // 当前搜索账号
  const [mailSearchAccount, doUpdateMailSearchAccount] = useState2RM('mailSearchAccount', 'doUpdateMailSearchAccount');
  // 设置高级搜索的表单字段
  const [advanceSearchFromValues, setAdvanceSearchFromValues] = useState2RM('advanceSearchFromValues', 'doUpdateAdvanceSearchFromValues');
  // 邮件待办 稍后处理
  // const [deferSelected, setDeferSelected] = useState2RM('deferMailListStateTab', 'doUpdateDeferMailListStateTab');
  // 搜索-输入框的应用
  // todo：这个引用是否改为引用转发更合适一些？
  // const [referenceElement, setReferenceElement] = useState<any>(null);
  const referenceElement = useRef();
  // 写邮件按钮的loading状态
  const [btnWriteMailLoading, setBtnWriteMailLoading] = useState(false);
  const [advancedSearchForm] = Form.useForm();
  // 写邮件-按钮-超时计时器
  const btnWriteMailLoadingTimer = useRef<number | null>(null);
  // 是否展示多账号弹窗
  const [addAccountVisible, setAddAccountVisible] = useState(false);
  const [totalAccount, setTotalAccount] = useState<accountObj[]>([]);
  const [subAccountCount, setSubAccountCount] = useState<number>(0);

  const curTabIsReadTab = useMemo(() => currentTabType === tabType.read, [currentTabType]);

  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);

  const uploadFileRef = useRef<HTMLInputElement>(null);

  // 回到默认页签
  const switchDefaultTab = useCallback(() => {
    dispatch(mailTabActions.doChangeCurrentTab('-1'));
  }, []);

  // 搜索状态下，搜索账号发生变化，读信内容清空
  useEffect(() => {
    if (isSearching) {
      setSearchMail({
        id: '',
        accountId: '',
      });
    }
  }, [mailSearchAccount, isSearching]);

  // 接受写信页窗口/tab准备好的消息 停止loading
  useMsgCallback('writePageDataExchange', e => {
    const { eventStrData } = e;
    if (eventStrData && ['writePageWindowCreated', 'writeTabCreated'].includes(eventStrData)) {
      setBtnWriteMailLoading(false);
      if (btnWriteMailLoadingTimer.current) {
        clearTimeout(btnWriteMailLoadingTimer.current);
        btnWriteMailLoadingTimer.current = null;
      }
    }
  });

  // 获取所有账号
  useEffect(() => {
    getTotalAccountList();
    const subAccountEvents: Array<SystemEventTypeNames> = ['SubAccountAdded', 'SubAccountDeleted'];
    const eids: Array<number> = [];
    subAccountEvents.forEach(evName => {
      eids.push(
        eventApi.registerSysEventObserver(evName, {
          name: 'columnMailBox-' + evName,
          func: () => {
            setTimeout(() => {
              getTotalAccountList();
            }, 10);
          },
        })
      );
    });
    return () => {
      if (eids && eids.length) {
        eids.forEach((eid, inx) => eventApi.unregisterSysEventObserver(subAccountEvents[inx], eid));
      }
    };
  }, []);

  const getTotalAccountList = async () => {
    // 初始化登录账号即主账号类型为企业邮箱
    const totalAccounts = ((await accountApi.getMainAndSubAccounts({ expired: false })) || []).map(item => ({
      key: item.id,
      value: item.agentEmail,
    }));
    setTotalAccount(totalAccounts);
    updateAllTotalSubAccount();
  };

  const updateAllTotalSubAccount = async () => {
    const subAccounts = (await accountApi.getAllSubAccounts()) || [];
    setSubAccountCount(subAccounts.length);
  };

  // 多账号遍历搜索
  const onSearchMail = useCallback(
    debounce((value: string, account: string) => {
      const sType = mailSearchStateMap[account] || 'local';
      reducer.onSearchMailUpdateTreeStateMap({ account, value });
      dispatch(
        Thunks.searchMail({
          value,
          // 本地搜索则额外搜索云端
          ...(sType === 'local' ? { extraCloud: true } : null),
        })
      );
      trackApi.track('pcMail_executeMailSearch', {
        searchMode: `全文搜索（${sType === 'local' ? '本地' : '云端'}）`,
      });
    }, 500),
    [totalAccount, mailSearchStateMap]
  );

  // 当搜索关键词发生变化的时候
  // value-关键词
  // account-重置某个账号下的搜索时传入该账号
  // showLoading-是否展示loading，重置某个账号下的搜索时传入false
  const onSearchChange = useCallback(
    debounce((value, account?: string, showLoading: boolean = true) => {
      switchDefaultTab();
      if (!value) {
        reducer.reseOnSearchChange({});
        // if (Object.values(mailSearchStateMap).some(item => item === 'server')) {
        //   setCurrentAccount();
        //   mailApi.doClearSearchCache().then();
        // }
        advancedSearchForm.resetFields();
        reducer.doResetMailSearch({});
      } else {
        !account && setSearchLoading(showLoading);
        setListLoading(true);
        const userInfo = systemApi.getCurrentUser();
        const mainAccount = userInfo?.id || '';
        onSearchMail(value, account || totalAccount[0]?.value || mainAccount);
      }
    }, 500),
    [onSearchMail]
  );

  // 重置搜索
  const reSearch = useCallback(
    (value, account) => {
      if (isAdvancedSearch) {
        handleAdvancedSearch(advanceSearchFromValues);
      } else {
        onSearchChange(value, account, false);
      }
      trackApi.track('pcMail_select_leftOptions_mailSearchResultPage', {
        filtratesName: '重置按钮',
      });
    },
    [isAdvancedSearch, advanceSearchFromValues]
  );

  // 单账号云端搜索
  const onSeverSearch = useCallback((account: string) => {
    reducer.beforeSearchServer({ account });
    dispatch(
      Thunks.loadSearchMailList({
        startIndex: 0,
        noCache: false,
      })
    );
    trackApi.track('pcMail_executeMailSearch', {
      searchMode: '全文搜索（云端）',
    });
  }, []);

  // 点击收信按钮后的toast
  const refreshPageCb = useCallback(
    refreshHasNewMail => {
      // 通栏模式，读信页签下才会展示是否有新邮件
      if (curTabIsReadTab && !isSearching) {
        // 有新邮件
        if (refreshHasNewMail) {
          setTimeout(() => {
            Message.success({
              content: (
                <span>
                  {getIn18Text('SHOUXINCHENGGONG\uFF0C11')}
                  <span onClick={switchDefaultTab} style={{ color: '#386ee7', marginLeft: '24px', cursor: 'pointer' }}>
                    {getIn18Text('QUCHAKAN')}
                  </span>
                </span>
              ),
            });
          }, 0);
        } else {
          setTimeout(() => {
            Message.success({
              content: getIn18Text('SHOUXINCHENGGONG\uFF0C'),
            });
          });
        }
      } else {
        // 其他情况保持原状
        setTimeout(() => {
          Message.success({
            content: getIn18Text('SHOUXINCHENGGONG'),
          });
        }, 0);
      }
    },
    [curTabIsReadTab, isSearching, switchDefaultTab]
  );

  const handleAdvancedSearch = useCallback(
    async values => {
      switchDefaultTab();
      await getTotalAccountList();
      const userInfo = systemApi.getCurrentUser();
      const mainAccount = userInfo?.id || '';
      const account = totalAccount.find(item => item.value === values?.account)?.value || mainAccount;
      const mapKey = !account || account === mainAccount ? 'main' : account;
      const treeList = mailTreeStateMap[mapKey].mailFolderTreeList;
      const newInput = buildSearchString({
        ...values,
        fids: values.fids && values.fids !== '_ALL_FOLDER_' ? getFolderNameById(values.fids, treeList) : undefined,
      });
      setInputValue(newInput);
      setAdvanceSearchFromValues(values);
      setSearchMail({
        id: '',
        accountId: '',
      });
      doUpdateMailSearchAccount(account);
      doUpdateMailSearchStateMap({
        [account]: 'advanced',
      });
      doUpdateMailSearching('advanced');
      setSearchLoading(true);
      setListLoading(true);
      setAdvancedSearchVisible(false);
      setSelectedSearchKeys({});
      dispatch(
        Thunks.loadAdvanceSearchMailList({
          startIndex: 0,
          noCache: true,
        })
      );
      trackApi.track('pcMail_executeMailSearch', {
        searchMode: '高级搜索（云端）',
      });
    },
    [totalAccount, mailTreeStateMap, advancedSearchForm]
  );

  // 前后触发，削减点击触发的数量
  const handleSwitchFolder = useCallback(
    debounce(
      (node: MailBoxModel) => {
        if (node) {
          let key = selectedSearchKeys[mailSearchAccount]?.folder || FLOLDER.SEARCH_ALL_RESULT;

          console.log('[FolderTree] 选择文件夹 handleSwitchFolder:', key, Date.now());
          const account: string = node?._account || mailSearchAccount;
          if (node.entry) {
            const { mailBoxId, mailBoxName } = node.entry;
            key = mailBoxId;
            const folderName = mailBoxName;
            if (isSearching) {
              trackApi.track('pcMail_select_leftOptions_mailSearchResultPage', {
                filtratesName: '文件夹筛选',
              });
            } else {
              // 埋点，收集文件夹切换
              if (key != FLOLDER.OTHERS && key != FLOLDER.TAG && key != FLOLDER.STAR) {
                try {
                  const isContant = folderIdIsContact(key);
                  let trackFolderName = folderName;
                  let trackFolderKey = key;
                  if (isContant) {
                    trackFolderKey = FLOLDER.STAR;
                    trackFolderName = getIn18Text('markContact');
                  } else {
                    if (key >= 100) {
                      trackFolderName = getIn18Text('ZIDINGYIWENJIAN');
                    }
                  }

                  trackApi.track('pcMail_switch_folder_folderList', {
                    folderType: trackFolderKey,
                    folderTypeName: trackFolderName,
                  });
                } catch (err) {
                  console.error(err);
                }
              }
            }
          }
          reducer.doSwitchFolder({
            id: key,
            accountId: account,
            authAccountType: node?.authAccountType,
          });
          if (isSearching) {
            if (!node?.entry) {
              let filterKey = '';
              if (isObject(node?.filterCond?.operand)) {
                filterKey = Object.keys(node.filterCond.operand)[0];
              } else {
                filterKey = node?.filterCond?.field;
              }
              trackApi.track('pcMail_select_leftOptions_mailSearchResultPage', {
                filtratesName: MAIL_SEARCH_FILTER[filterKey],
              });
            }
            // 搜索时判断父文件夹结果为0默认展开
            if (node?.entry && lodashGet(node, 'children.length', 0) > 0) {
              const parentCount = lodashGet(node, 'entry.mailBoxUnread', 0);
              const childrenCount = (node.children || []).reduce((prev, cur) => prev + lodashGet(cur, 'entry.mailBoxUnread', 0), 0);
              if (parentCount === childrenCount && node?.mailBoxId && !expandedSearchKeys.includes(node.mailBoxId)) {
                const expandList = [...expandedSearchKeys];
                expandList.push(node.mailBoxId);
                expandFolder(expandList);
              }
            }
            dispatch(Thunks.refreshMailList({ showLoading: false }));
            const sType = mailSearchStateMap[account] || 'local';
            trackApi.track('pcMail_executeMailSearch', {
              searchMode: `全文搜索（${sType === 'local' ? '本地' : '云端'}）`,
            });
          }
        }
      },
      300,
      {
        leading: true,
        trailing: true,
      }
    ),
    [isSearching, expandedSearchKeys, mailSearchStateMap]
  );

  const expandFolder = useCallback((keys: any, accountId?: string) => {
    const numberKeys = folderId2Number(keys);
    setTreeState({
      accountId,
      name: 'expandedKeys',
      value: numberKeys,
    });
  }, []);

  const expandSearchFolder = (keys: any, accountId?: string) => {
    const numberKeys = folderId2Number(keys);
    setExpandedSearchKeys(numberKeys);
  };

  useImperativeHandle(ref, () => ({
    changeInputValue: (v: string) => {
      setInputValue(v);
    },
  }));

  const handleWriteBtnClick = useCallback(
    debounce(() => {
      // 唤起写信页
      // mailApi.doWriteMailToContact();
      mailApi.callWriteLetterFunc({
        contact: [],
        writeType: 'common',
        mailType: 'common',
        mailFormClickWriteMail: selectedKeys?.accountId,
      });
      // 打点
      trackApi.track('pcMail_click_writeMailButton_topBar', { source: 'Inbox' });
      setBtnWriteMailLoading(true);
      // 新标签方式打开，1.5秒足够
      if (!btnWriteMailLoadingTimer.current) {
        btnWriteMailLoadingTimer.current = setTimeout(() => {
          setBtnWriteMailLoading(false);
          btnWriteMailLoadingTimer.current = null;
        }, 1500) as any;
      }
    }, 200),
    [selectedKeys]
  );

  const onSearchTypeChange = useCallback(
    (type: MailSearchTypes, toRecord: boolean) => {
      setSearchMail({
        id: '',
        accountId: '',
      });
      setSearchType(type);
      setMailSearchRecord(toRecord);
    },
    [setSearchMail, setSearchType, setMailSearchRecord]
  );

  const MailFoldersElement = useMemo(() => {
    return <MailFolders uploadFileRef={uploadFileRef} />;
  }, []);

  // 添加邮箱弹窗关闭
  const addAccountCloseModel = useCallback(refresh => {
    setAddAccountVisible(false);
  }, []);

  // 点击添加账号
  const onAddAccount = useCallback(() => {
    // 如果账号总数大于等于5，其实等于5就不许添加了，此时这个账号数量是否需要刷新
    if (subAccountCount >= 4) {
      Message.warn({
        content: getIn18Text('accountMaxTip'),
      });
    } else {
      setAddAccountVisible(true);
    }
  }, [subAccountCount]);

  const isShareadAccount = systemApi.getCurrentUser()?.isSharedAccount || false;
  // 渲染添加邮箱账号
  const AddAccountElement = useMemo(() => {
    // if (!process.env.BUILD_ISELECTRON) {
    //   return null;
    // }
    return (
      <>
        <p className="m-add-account">
          <span style={{ fontSize: '12px', flex: '1 1 auto' }}>邮箱</span>
          {/* <HollowOutGuide
            guideId={ADD_ACCOUNT_TIP_FLAG}
            title={getIn18Text('XINZENGDISANFANGYOUXIANG')}
            intro=""
            borderRadius={5}
            refresh={subTabList?.length || 0}
            renderFooter={
              <div className="m-add-account-tip-footer">
                <span
                  className="m-add-account-tip-footer-cancel"
                  onClick={() => {
                    doNextStep({ step: 1, guideId: ADD_ACCOUNT_TIP_FLAG });
                  }}
                >
                  {getIn18Text('HULVE')}
                </span>
                <Button
                  className="m-add-account-tip-footer-confirm"
                  onClick={() => {
                    doNextStep({ step: 1, guideId: ADD_ACCOUNT_TIP_FLAG });
                    onAddAccount();
                  }}
                >
                  <span>{getIn18Text('QUBANGDING')}</span>
                </Button>
              </div>
            }
          > */}
          {!isShareadAccount ? (
            <Tooltip title={getIn18Text('TIANJIAYOUXIANGZHANG')} trigger={['hover']}>
              <span
                data-test-id="mail-add-account-btn"
                hidden={isSearching}
                className="title-add-btn dark-invert"
                onClick={() => {
                  onAddAccount();
                }}
              >
                <AddTagIcon />
              </span>
            </Tooltip>
          ) : null}
          {/* </HollowOutGuide> */}
        </p>
        {/* 添加邮箱弹窗 */}
        <MultAccountsLoginModal visible={addAccountVisible} closeModel={addAccountCloseModel} loginInfo={{ type: 'bind', way: 'mailList' }} />
      </>
    );
    // }, [subTabList?.length, isSearching, addAccountVisible, doNextStep, onAddAccount, addAccountCloseModel]);
  }, [isSearching, addAccountVisible, onAddAccount, addAccountCloseModel, isShareadAccount]);

  // 监听多账号添加账号
  // useMsgRenderCallback('SubAccountWindowReady', ev => {
  //   try {
  //     if (ev) {
  //       const { eventData } = ev;
  //       const { agentEmail } = eventData;
  //       // 延时设置
  //       setTimeout(() => {
  //         // 设置仅仅展开当前账号
  //         setActiveKey([agentEmail]);
  //         // 设置选中新打开的账号，选中收件箱
  //         setSelectedKeys({
  //           id: 1,
  //           accountId: agentEmail
  //         });
  //       }, 100);
  //     }
  //   } catch (e) {
  //     console.error(e);
  //   }
  // });

  /**
   * 星标联系人完成添加之后，展开并选中对应的联系人id
   */
  const activeAddedStarContact = useCallback(
    (list: PersonalMarkParams[]) => {
      try {
        const key = mailTreeStateMap?.main?.expandedKeys || [];
        const treeExpandKeys = [...new Set([...key, FLOLDER.STAR])];
        setTreeState({
          name: 'expandedKeys',
          value: treeExpandKeys,
        });
        if (list && list.length) {
          const { type, id } = list[0] || {};
          if (type && id) {
            const key = getFolderStartContactId(id, type);
            setSelectedKeys({
              id: key,
            });
          }
        }
      } catch (e) {
        console.error('[error: expandStarContactFolder]', e);
      }
    },
    [setSelectedKeys, mailTreeStateMap?.main?.expandedKeys]
  );

  /**
   * eml文件上传组件
   */
  const EmlUploaderElement = useMemo(() => {
    return <EmlUploader ref={uploadFileRef} />;
  }, []);

  /**
   * 二级文件夹页签
   */
  const MailSubTabElement = useMemo(() => {
    return process.env.BUILD_ISEDM ? <MailSubTab /> : <></>;
  }, []);

  /**
   * 写信按钮及刷新安妮局
   */
  const WriteBtnElement = useMemo(() => {
    return (
      <Button
        data-test-id="mail-write-mail-btn"
        type="primary"
        className="u-mail-btn sirius-no-drag"
        icon={
          <span className="icon">
            <ReadListIcons.EditSvg />
          </span>
        }
        onClick={handleWriteBtnClick}
        loading={btnWriteMailLoading}
      >
        <span className="text">{getIn18Text('XIEYOUJIAN')}</span>
      </Button>
    );
  }, [handleWriteBtnClick, btnWriteMailLoading]);

  /**
   * 收信阿牛
   */
  const RefreshBtn = useMemo(() => {
    return (
      <Tooltip placement="bottom" title={getIn18Text('SHOUXIN')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
        <div
          data-test-id="mail-refresh-btn"
          className={`u-refresh sirius-no-drag btn ${refreshBtnLoading ? 'sirius-spin' : ''}`}
          onClick={() => {
            trackApi.track('pcMail_click_receivingMailButton_topBar');
            // 超时检测
            promiseIsTimeOut(
              dispatch(
                Thunks.refreshPage({
                  successCb: (refreshHasNewMail: any) => {
                    refreshPageCb(refreshHasNewMail);
                  },
                })
              ),
              'pc_refreshPage_timeout',
              {
                from: 'columnMailBox_btn',
              }
            );
            if (isSearching) {
              // 搜索模式下，刷新搜索结果
              reSearch(inputValue, mailSearchAccount);
            }
            // 只刷新了一个客户页签，如果有多个的话，其他并没有刷新
            if (process.env.BUILD_ISEDM) {
              dispatch(
                Thunks.refreshPage_cm({
                  sliceId: tabId.readCustomer,
                })
              );
            }
          }}
        />
      </Tooltip>
    );
  }, [refreshBtnLoading, refreshPageCb]);

  /**
   * 搜索框
   */
  const SearchBoxElement = useMemo(() => {
    return <SearchBox ref={referenceElement} inputValue={inputValue} setInputValue={setInputValue} advancedSearchForm={advancedSearchForm} totalAccount={totalAccount} />;
  }, [totalAccount, inputValue, advancedSearchForm]);

  /**
   * 星标联系人添加Model
   */
  const PersonalMarkModalElement = useMemo(() => {
    return (
      addContactModelVisiable && (
        <PersonalMarkModalProps
          onCancel={() => {
            setAddContactModelVisiable(false);
          }}
          onSure={list => {
            if (list && list.length) {
              activeAddedStarContact(list);
            }
            setAddContactModelVisiable(false);
          }}
        />
      )
    );
  }, [addContactModelVisiable, activeAddedStarContact]);

  /**
   * 高级搜索弹窗
   */
  const AdvancedSearchFormElement = useMemo(() => {
    return (
      advancedSearchVisible && (
        <AdvancedSearchForm
          isSearching={isSearching}
          treeMap={mailTreeStateMap}
          advancedSearchLoading={advancedSearchLoading}
          advancedSearchVisible={advancedSearchVisible}
          referenceElement={referenceElement}
          // triggerElment={popTriggerElment}
          onSubmit={handleAdvancedSearch}
          form={advancedSearchForm}
          onClose={setAdvancedSearchVisible}
        />
      )
    );
  }, [advancedSearchVisible, isSearching, mailTreeStateMap, advancedSearchLoading, handleAdvancedSearch, advancedSearchForm, setAdvancedSearchVisible]);

  return (
    <>
      <NetWatcher />
      {/* eml文件上传 */}
      {EmlUploaderElement}
      {/* 二级文件夹页签 */}
      {MailSubTabElement}
      <div className="m-edit-container">
        {WriteBtnElement}
        {RefreshBtn}
      </div>
      {/* 搜索框 */}
      {SearchBoxElement}
      {/* 添加邮箱 */}
      {AddAccountElement}

      {/* 文件夹树 */}
      {MailFoldersElement}

      {/* 普通搜索过程: 当前账号个数n === 1 ? 直接执行当前账号下的搜索并展示结果 : 先搜索n个账号对应的搜索结果个数待用户点击某个账号后再执行当前账号下的搜索并展示结果（默认后台开始搜索第一个账号即主账号） */}
      {isSearching && (
        <div className="m-tree-container m-tree-container-relative" style={{ display: isSearching ? 'block' : 'none' }}>
          {searchLoading && (
            <div className="u-loading">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            </div>
          )}
          {/* 搜索中或高级搜索状态下 */}
          <div className="m-search-res" style={{ display: searchLoading || isAdvancedSearch ? 'none' : 'block' }}>
            {!isCorpMail && (
              <BaseSearchFilter
                searchWord={inputValue || ''}
                searchType={searchType}
                setSearchType={type => onSearchTypeChange(type, false)}
                onSearchChange={onSearchChange}
              />
            )}
          </div>
          {/* 搜索返回文件夹结构 */}
          {isSearching && (
            <SearchResult
              handleSwitchFolder={handleSwitchFolder}
              expandFolder={expandSearchFolder}
              reSearch={account => reSearch(inputValue, account)}
              onSeverSearch={onSeverSearch}
            />
          )}
        </div>
      )}
      {/* 高级搜索弹窗 */}
      {AdvancedSearchFormElement}
      {/* 星标联系人添加弹窗 */}
      {PersonalMarkModalElement}
    </>
  );
};

export default React.forwardRef(ColumnMailBox);
