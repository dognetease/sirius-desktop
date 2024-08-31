import React, { useState, useEffect, useRef } from 'react';
import classnamesBind from 'classnames/bind';
import { Collapse, Menu, Tooltip, Dropdown, Modal, Input } from 'antd';
import { AccountTypes, getIn18Text } from 'api';
import { navigate } from 'gatsby';
import MailMainIcon from '@web-common/components/UI/Icons/svgs/MailMain';
import Mail163Icon from '@web-common/images/mail_163.png';
import MailQqIcon from '@web-common/images/mail_qq.png';
import MailOutlookIcon from '@web-common/images/mail_outlook.png';
import MailQiyeQQIcon from '@web-common/images/mail_qiye_qq.png';
import MailGmailIcon from '@web-common/images/mail_gmail.png';
import MailOtherIcon from '@web-common/components/UI/Icons/svgs/MailOther';
import AccountExpiredIcon from '@web-common/components/UI/Icons/svgs/AccountExpiredIcon';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import styles from './index.module.scss';
import { apiHolder as api, apis, AccountApi } from 'api';
import { getMainAccount } from '@web-mail/util';
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { MenuInfo } from 'rc-menu/lib/interface';
import { stringMap } from '@web-mail/types';
import { useAppDispatch } from '@web-common/state/createStore';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';

const { Panel } = Collapse;
const realStyle = classnamesBind.bind(styles);

interface dataItem {
  key: string; // 自定义唯一
  title: string; // 邮箱地址
  type: AccountTypes; // 邮箱类型
  count: string; // 个数，为0不展示
  expired?: boolean; // 是否失效
  children: React.ReactElement; // 自定义子内容dom
}

interface SiriusCollapseProps {
  dataList: dataItem[];
  activeKey?: string[]; // 默认激活的key
  intermediateKey?: string[]; // 默认处于中间态的key
  single?: boolean; // 同时只打开一个面板，用于搜索结果
  showTooltip?: boolean; // 是否展示tooltip
  openCb?: (key: string) => void; // 下拉打开回调，用于开始搜索
  closeCb?: () => void; // 下拉关闭回调，用于重置筛选
  changeCb?: (key: string[]) => void; // 下拉变化回调，用于非single
  revalidateAccountFromPanel?: (params: { accountType: AccountTypes; agentEmail: string; agentNickname: string }) => void;
  collapseStyle?: React.CSSProperties; // collapse的自定义样式
  panelStyle?: React.CSSProperties; // panel的自定义样式
  operateSeparate?: boolean; // 下拉箭头和title点击逻辑分开，用于搜索结果
  searchAccount?: string; // 搜索状态下当前搜索账号
  resetSearch?: (key: string, loading?: boolean) => void; // 重置搜索方法
  activeAccount?: string; // 当前选中文件夹的
  source?: string; // 来源
}

const mailIconList = new Map([
  ['NeteaseQiYeMail', <MailMainIcon />],
  ['163Mail', <img src={Mail163Icon} className={realStyle('siriusCollapseLogo')} />],
  ['Gmail', <img src={MailGmailIcon} className={realStyle('siriusCollapseLogo')} />],
  ['Outlook', <img src={MailOutlookIcon} className={realStyle('siriusCollapseLogo')} />],
  ['TencentQiye', <img src={MailQiyeQQIcon} className={realStyle('siriusCollapseLogo')} />],
  ['QQMail', <img src={MailQqIcon} className={realStyle('siriusCollapseLogo')} />],
  ['Others', <MailOtherIcon />],
]);

const SiriusCollapse: React.FC<SiriusCollapseProps> = ({
  dataList,
  activeKey,
  intermediateKey,
  single,
  showTooltip = false,
  openCb,
  closeCb,
  changeCb,
  revalidateAccountFromPanel,
  collapseStyle,
  panelStyle,
  operateSeparate,
  searchAccount,
  resetSearch,
  activeAccount,
  source,
}) => {
  const dispatch = useAppDispatch();
  // 中间态项
  const [middleKeys, setMiddleKeys] = useState<string[]>([]);
  const [mailAccountAliasMap] = useState2RM('mailAccountAliasMap');
  // 当前展开项
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  // 当前处于编辑状态的账号Map
  const [editAccountMap, setEditAccountMap] = useState<stringMap>({});
  // 当前编辑状态是否处于loadingMap
  const [loadingMap, setLoadingMap] = useState<stringMap>({});
  // 当前编辑中的账号名称数据Map
  const nameMapRef = useRef<stringMap>({});
  // 输入框RefMapRef
  const inputRefMapRef = useRef<stringMap>({});
  /**
   * 账号点击事件是否屏蔽Map
   * 因为账号失效之后，点击回重新绑定，在这种状态下，进行账号别名的操作，很容易误触其他弹窗逻辑，所以在操作的过程中，需要一个屏蔽窗口期
   */
  const [accountClickDisabledMap, setAccountClickDisabledMap] = useState<stringMap>({});

  // 首次默认展开第一个，后续只依赖用户选中
  useEffect(() => {
    if (!openKeys.length && dataList[0]?.key) {
      setOpenKeys([dataList[0].key]);
      changeCb && changeCb([dataList[0].key]);
    }
  }, [dataList]);

  useEffect(() => {
    if (activeKey) {
      setOpenKeys(activeKey);
    }
  }, [activeKey]);

  useEffect(() => {
    if (intermediateKey) {
      setMiddleKeys(intermediateKey);
    }
  }, [intermediateKey]);

  const goToSetting = (e: MenuInfo, type: 'main' | 'sub') => {
    e.domEvent.stopPropagation();
    if (type === 'main') {
      navigate('/#setting', { state: { currentTab: 'mail' } });
    }
    if (type === 'sub') {
      navigate('/#setting', { state: { currentTab: 'mail', mailConfigTab: 'OTHER' } });
    }
  };

  // 移除账号
  const removeAccount = (e: MenuInfo, item: dataItem) => {
    e.domEvent.stopPropagation();
    // key是agentEmail
    const { key: agentEmail, title, type } = item;
    Modal.confirm({
      title: `是否确认移除邮箱“${title}”？`,
      content: '',
      okText: getIn18Text('SHANCHU'),
      cancelText: getIn18Text('QUXIAO'),
      width: '448px',
      centered: true,
      onOk: async () => {
        let accountId = '';
        // 企业邮，两者同名
        if (['NeteaseQiYeMail', 'qyEmail'].includes(type)) {
          accountId = agentEmail;
        } else {
          // 本地获取 （这个方法的命名反了..）
          const localAccountId = accountApi.getEmailIdByEmail(agentEmail);
          if (localAccountId) {
            accountId = localAccountId;
          } else {
            // 远端获取
            const bindDatas = await accountApi.getPersonalBindAccountsFromServer();
            const targetData = (bindDatas || []).find(item => item.agentEmail === agentEmail);
            if (targetData) {
              accountId = targetData.accountEmail;
            }
          }
        }
        if (!accountId) {
          SiriusMessage.error({ content: '移除失败' });
        }
        const params = {
          email: accountId,
          agentEmail,
          accountType: ['NeteaseQiYeMail', 'qyEmail'].includes(type) ? 'qyEmail' : 'personalEmail',
        };
        try {
          const res = await accountApi.deleteBindAccount(params);
          if (res?.success) {
            SiriusMessage.success({ content: '移除成功' });
            // setTreeState({
            //   accountId: agentEmail,
            //   name: 'remKey',
            //   value: null,
            // });
          } else {
            SiriusMessage.error({ content: res.errMsg || '移除失败' });
          }
        } catch (error) {
          console.log('移除失败 error', error);
          SiriusMessage.error({ content: '移除失败' });
        }
      },
      onCancel(close) {
        close();
      },
    });
  };

  // 重新校验
  const reCheck = async (e: MenuInfo, item: dataItem) => {
    e.domEvent.stopPropagation();
    const { key: agentEmail, type } = item;
    let agentNickname = '';
    // 企业邮用agentEmail
    if (type === 'NeteaseQiYeMail') {
      agentNickname = agentEmail;
    } else {
      // 远端获取
      const bindDatas = await accountApi.getPersonalBindAccountsFromServer();
      const targetData = (bindDatas || []).find(item => item.agentEmail === agentEmail);
      if (targetData) {
        agentNickname = targetData.agentNickname || targetData.agentEmail;
      }
    }
    revalidateAccountFromPanel &&
      revalidateAccountFromPanel({
        accountType: ['NeteaseQiYeMail', 'qyEmail'].includes(type) ? 'NeteaseQiYeMail' : (type as AccountTypes),
        agentEmail,
        agentNickname,
      });
  };

  // 屏蔽账号点击事件
  const disabledAccountClick = (accountName: string) => {
    setAccountClickDisabledMap(map => {
      return { ...map, [accountName]: true };
    });
  };

  // 修改显示名称
  const editAccountName = (accountName: string) => {
    // 屏蔽账号的点击设置
    disabledAccountClick(accountName);
    // 重置当前编辑状态
    nameMapRef.current[accountName] = mailAccountAliasMap[accountName] || accountName;
    // 开启编辑状态
    setEditAccountMap(map => {
      return { ...map, [accountName]: true };
    });
    // 将焦点对过去
    setTimeout(() => {
      const inputRef = inputRefMapRef.current[accountName];
      if (inputRef) {
        inputRef.focus({ cursor: 'all' });
      }
    }, 200);
  };

  // TODO 拆出以child方式注入
  const accountMenu = (item: dataItem, index: number) => {
    if (source !== 'folder') return <></>;
    const { key, expired } = item;
    const mainAccountId = getMainAccount();
    // 主账号 或者首位账号
    if (key === mainAccountId || index === 0) {
      return (
        <Menu className={styles.accountMenu}>
          <Menu.Item key="0" onClick={e => goToSetting(e, 'main')}>
            {getIn18Text('YOUXIANGSHEZHI')}
          </Menu.Item>
        </Menu>
      );
    }

    return (
      <Menu className={styles.accountMenu} mode="vertical">
        <Menu.Item
          key="0"
          onClick={e => {
            if (e?.domEvent?.stopPropagation) {
              e.domEvent.stopPropagation();
            }
            editAccountName(key);
          }}
        >
          {getIn18Text('XIUGAIXIANSHIMINGC')}
        </Menu.Item>
        <Menu.Item key="1" onClick={e => goToSetting(e, 'sub')}>
          {getIn18Text('YOUXIANGSHEZHI')}
        </Menu.Item>
        <Menu.Item key="2" onClick={e => removeAccount(e, item)}>
          {getIn18Text('JIEBANG')}
        </Menu.Item>
        {expired ? (
          <Menu.Item key="3" onClick={e => reCheck(e, item)}>
            {getIn18Text('recheck')}
          </Menu.Item>
        ) : (
          <></>
        )}
      </Menu>
    );
  };

  // Collapse组件事件，在operateSeparate为false时使用
  const onOpenChange = (openKey: string | string[]) => {
    if (operateSeparate) {
      return;
    }
    const openKeys = Array.isArray(openKey) ? openKey : [openKey];
    let lastestOpenKeys = openKeys;
    const len = openKeys.length;
    if (single) {
      lastestOpenKeys = openKeys[len - 1] ? [openKeys[len - 1]] : [];
      // 设置当前选中，因为lastestOpenKeys最多一项所以直接取
      if (lastestOpenKeys[0]) {
        openCb && openCb(lastestOpenKeys[0]);
      } else {
        closeCb && closeCb();
      }
    } else {
      changeCb && changeCb(lastestOpenKeys);
    }
    setOpenKeys(lastestOpenKeys);
  };

  // 点击打开箭头的自定义事件，在operateSeparate为true时使用
  const openPanel = (openKey: string, e?: React.MouseEvent) => {
    if (!openKeys.includes(openKey) && operateSeparate) {
      e?.stopPropagation();
      if (single) {
        // 展开账号和搜索账号不一致，重新搜索
        if (searchAccount != openKey && resetSearch) {
          resetSearch(openKey, true);
        }
        setOpenKeys([openKey]);
      } else {
        const lastestOpenKeys = [openKey, ...openKeys];
        setOpenKeys(lastestOpenKeys);
      }
    }
  };
  // 点击关闭箭头的自定义事件，在operateSeparate为true时使用
  const closePanel = (openKey: string, e?: React.MouseEvent) => {
    const index = openKeys.indexOf(openKey);
    if (index > -1 && operateSeparate) {
      e?.stopPropagation();
      const lastestOpenKeys = [...openKeys];
      lastestOpenKeys.splice(index, 1);
      setOpenKeys(lastestOpenKeys);
    }
  };

  // 点击title的自定义事件，在operateSeparate为true时使用
  const handleClickPanel = (openKey: string) => {
    if (!operateSeparate) {
      return;
    }
    // 关闭状态已选中则打开，关闭状态并未选中则重置且打开
    // 打开状态已选中则不响应，打开状态并未选中则重置且不关闭
    // 处于中间态则重新搜索
    if (intermediateKey?.includes(openKey)) {
      resetSearch && resetSearch(openKey);
      // 未打开则打开
      !openKeys.includes(openKey) && openPanel(openKey);
    } else if (!openKeys.includes(openKey)) {
      // 非中间态且未打开，在有其他已打开的情况下，重新搜索并打开
      openPanel(openKey);
    }
  };

  /**
   * 节点编辑事件
   */
  const handleNodeUpdate = (key: string) => {
    // 开启loading
    setLoadingMap(map => {
      return { ...map, [key]: true };
    });
    // 发送请求 - dispatch redux
    dispatch(
      Thunks.updateUserFolderAlias({
        account: key,
        name: nameMapRef.current[key],
      })
    ).finally(() => {
      // 结束后关闭loading状态
      setLoadingMap(map => {
        return { ...map, [key]: false };
      });
      // 关闭编辑状态
      setEditAccountMap(map => {
        return { ...map, [key]: false };
      });
      nameMapRef.current[key] = '';
      // 增加屏蔽周期
      setTimeout(() => {
        setAccountClickDisabledMap(map => {
          return { ...map, [key]: false };
        });
      }, 2000);
    });
  };

  // 处理账户名称变更
  const debounceHandleNodeUpdate = useDebounceForEvent(handleNodeUpdate, 500);

  // 取消编辑
  const handleCancelEditNode = (key: string) => {
    if (nameMapRef.current) {
      nameMapRef.current[key] = '';
    }
    // 关闭编辑状态
    setEditAccountMap(map => {
      return { ...map, [key]: false };
    });
    // 屏蔽器结束后，开启点击事件
    setTimeout(() => {
      setAccountClickDisabledMap(map => {
        return { ...map, [key]: false };
      });
    }, 2000);
  };

  if (dataList.length === 1) {
    return <div style={collapseStyle}>{dataList[0]?.children}</div>;
  }

  return (
    <Collapse className={realStyle('siriusCollapseWrap')} style={collapseStyle} activeKey={openKeys} onChange={onOpenChange}>
      {dataList.map((item, index) => (
        <Panel
          key={item.key}
          header={
            <Dropdown
              overlay={accountMenu(item, index)}
              trigger={['contextMenu']}
              // visible={true}
            >
              <Tooltip title={showTooltip ? item.title : ''} placement="bottom">
                <div
                  className={realStyle('siriusCollapseTitle')}
                  data-test-id="mail-folder-more-btn"
                  onClick={() => {
                    if (accountClickDisabledMap[item.key]) {
                      return false;
                    }
                    handleClickPanel(item.key);
                  }}
                >
                  {openKeys.includes(item.key) ? (
                    <div className={realStyle('siriusCollapseOpen')} onClick={e => closePanel(item.key, e)}>
                      <span className={`dark-invert ${realStyle('siriusCollapseIconDown')}`} />
                    </div>
                  ) : (
                    <div className={realStyle('siriusCollapseClose')} onClick={e => openPanel(item.key, e)}>
                      <span className={`dark-invert ${realStyle('siriusCollapseIconRight')}`} />
                    </div>
                  )}
                  <span className={realStyle('siriusCollapseTitleType')}>
                    {source == 'folder' && loadingMap[item.key] ? (
                      <LoadingOutlined />
                    ) : (
                      <>
                        {mailIconList.get(item.type) || mailIconList.get('Others')}
                        {item.expired && (
                          <span className={realStyle('siriusCollapseTitleTypeExpired')}>
                            <AccountExpiredIcon />
                          </span>
                        )}
                      </>
                    )}
                  </span>
                  {editAccountMap && editAccountMap[item.key] && source == 'folder' ? (
                    <>
                      <Input
                        className={realStyle('editTreeInput')}
                        defaultValue={mailAccountAliasMap[item.key] || item.key}
                        ref={inputref => {
                          if (inputRefMapRef.current) {
                            inputRefMapRef.current[item.key] = inputref;
                          }
                        }}
                        onPressEnter={e => {
                          debounceHandleNodeUpdate(item.key);
                        }}
                        onBlur={e => {
                          debounceHandleNodeUpdate(item.key);
                        }}
                        onClick={e => e.stopPropagation()}
                        disabled={!!loadingMap[item.key]}
                        maxLength={30}
                        onChange={e => {
                          if (nameMapRef.current) {
                            const str = e?.target?.value.trim();
                            // 限制最大30个字符
                            nameMapRef.current[item.key] = str.slice(0, 30);
                          }
                        }}
                        suffix={
                          !loadingMap[item.key] ? (
                            <span
                              className={realStyle('folderInputCancel')}
                              onClick={() => {
                                handleCancelEditNode(item.key);
                              }}
                            >
                              取消
                            </span>
                          ) : null
                        }
                      />
                    </>
                  ) : (
                    <>
                      <span className={realStyle('siriusCollapseTitleName')}>{mailAccountAliasMap[item.key] || item.title}</span>
                      {item.count && item.count !== '0' ? (
                        <span data-test-id="mail-account-folder-panel-unread" className={realStyle('siriusCollapseTitleRight')}>
                          {item.count && item.count}
                        </span>
                      ) : (
                        <></>
                      )}
                    </>
                  )}
                </div>
              </Tooltip>
            </Dropdown>
          }
          className={realStyle(
            middleKeys.includes(item.key) ? 'siriusCollapseMiddle' : item.key === searchAccount ? 'siriusCollapseSelected' : '',
            operateSeparate ? 'siriusCollapseNoHover' : '',
            activeAccount && accountApi.getIsSameSubAccountSync(activeAccount, item.key) && !openKeys.includes(item.key) ? 'avtivePanelHead' : ''
          )}
          data-test-id="mail-account-folder-panel"
          style={panelStyle}
        >
          {item.children}
        </Panel>
      ))}
    </Collapse>
  );
};
export default SiriusCollapse;
