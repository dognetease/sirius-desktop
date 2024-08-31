import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiHolder, apis, AddressBookApi, AddressBookContact, AddressBookFilterType, AddressBookContactsParams, SendBoxConfRes, EdmSendBoxApi } from 'api';
import qs from 'querystring';
import classnames from 'classnames';
import { Tabs, Space, Button, Dropdown, Menu, Alert } from 'antd';
import { navigate, useLocation } from '@reach/router';
import Contacts from '../../components/Contacts';
import Groups from '../../components/Groups';
import Sources from '../../components/Sources';
import Blacklist from '../../../blacklist/blacklist';
import UnsubscribeTable from '../../../blacklist/unsubscribeTable';
import { Recycle } from '../../components/Recycle/index';
import { AddContact } from '../../views/AddContact/index';
import { AddGroup } from '../../views/AddGroup/index';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { getBodyFixHeight } from '@web-common/utils/constant';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import addressBookStyle from '../../addressBook.module.scss';
import { edmDataTracker } from '../../../tracker/tracker';
import { ReactComponent as ArrowRightIcon } from '@/images/icons/edm/arrow_right_1.svg';
import variables from '@web-common/styles/export.module.scss';
import { getTransText } from '@/components/util/translate';
import useSyncConfig from '../../hooks/useSyncConfig';
import { ReactComponent as CloseIcon } from '@/images/icons/edm/addressBook/close.svg';
import { ReactComponent as WaringIcon } from '@/images/icons/edm/addressBook/waring.svg';
import { inWindow } from 'api';
import AiMarketingEnter from '../../../components/AiMarketingEnter/aiMarketingEnter';
import OpenSea from '../openSea';
import { ReactComponent as VideoIcon } from '@/images/icons/edm/video.svg';

const sendContactsDataTracker = (action: string) => {
  edmDataTracker.track('waimao_address_book_contacts', { action });
};

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const storageApi = apiHolder.api.getDataStoreApi();

import style from './index.module.scss';
import { getIn18Text } from 'api';

const LOCAL_STORAGE_KEY = 'addressToMarketingTipClick';
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const AddressBookIndex = () => {
  const { syncEntry, syncTip } = useSyncConfig({ entryClassName: style.syncEntry, tipClassName: 'address-book-sync-tip' });
  const location = useLocation();
  const query = useMemo(() => qs.parse(location?.hash.split('?')[1] || ''), [location?.hash]);
  const [tabKey, setTabKey] = useState<string>('overview');
  const [visible, setVisible] = useState<boolean>(false);
  // 托管营销信息
  const [sendBoxCof, setSendBoxCof] = useState<SendBoxConfRes>();

  useEffect(() => {
    if (query.page === 'addressBookIndex') {
      setTabKey(previous => (query.defaultTabKey as string) || previous);
    }
  }, [query.page, query.defaultTabKey]);
  const [data, setData] = useState<AddressBookContact[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const contactsRef = useRef<any>(null);
  const [addContactVisible, setAddContactVisible] = useState<boolean>(false);
  const [addGroupVisible, setAddGroupVisible] = useState<boolean>(false);
  const [lxContactsSyncVisible, setLxContactsSyncVisible] = useState<boolean>(false);
  const [lxContactsSyncInfo, setLxContactsSyncInfo] = useState<{
    contactNum: number;
    notInContactAddressNum: number;
  }>({
    contactNum: 0,
    notInContactAddressNum: 0,
  });
  // 插件使用链接
  const extensionLink = useMemo(() => {
    return document.body.dataset.extensionInstalled
      ? 'https://waimao.163.com/?openSidebar=true'
      : 'https://chrome.google.com/webstore/detail/%E7%BD%91%E6%98%93%E5%A4%96%E8%B4%B8%E9%80%9A%E5%8A%A9%E6%89%8B/fbaccmibmbdppbofdglbfakjalaepkna';
  }, []);
  const closeTips = () => {
    storageApi.putSync(LOCAL_STORAGE_KEY, 'true', { noneUserRelated: true });
    setVisible(false);
  };
  useEffect(() => {
    if (tabKey === 'overview') {
      addressBookApi.checkLxContactsHasSync().then(({ result }) => {
        if (result) return;

        addressBookApi.scanContactsFromLxContacts().then(data => {
          if (data.contactNum > 0 && data.notInContactAddressNum > 0) {
            setLxContactsSyncVisible(true);
            setLxContactsSyncInfo(data);
          }
        });
      });
    }
  }, [tabKey]);
  // 请求是否有托管营销信息
  useEffect(() => {
    edmApi.getSendBoxConf({ type: 2 }).then(setSendBoxCof);
  }, [setSendBoxCof]);
  // 初始获取是否需要展示引导
  useEffect(() => {
    const storageRes = storageApi.getSync(LOCAL_STORAGE_KEY, { noneUserRelated: true }).data;
    setVisible(!storageRes);
  }, []);
  // if (query.page !== 'addressBookIndex')
  //     return null;
  useEffect(() => {
    addressBookApi.getStopService().then(isStop => {
      if (isStop) {
        Modal.warning({
          title: '升级通知',
          content: '地址簿功能正在升级中，新建、删除、编辑、修改分组等功能暂不可用。搜索数据、查看数据和一键营销可以正常使用。给您带来不便敬请谅解。',
          keyboard: false,
          closable: false,
          hideCancel: true,
          maskClosable: false,
          okText: '知道了',
        });
      }
    });
  }, []);
  return (
    <>
      <div className={classnames(style.container, addressBookStyle.addressBook)}>
        <div className={style.title}>
          <div>
            <span>{getIn18Text('YINGXIAODEZHIBU')}</span>
            <div className={style.subTitle}>
              <span>{getTransText('CHAJIANZHUAQUQIANKEYOUXIANG')}</span>
              <a href={extensionLink} target="_blank">
                {getTransText('LIJISHIYONG')}
                <ArrowRightIcon />
              </a>
            </div>
          </div>
          <p className={style.videoTip}></p>
        </div>
        {visible && sendBoxCof?.edmHostingState == 0 && (
          <div className={style.tip}>
            <span>
              <WaringIcon style={{ marginRight: '6px' }} />
              <span>{getIn18Text('NINDEDEZHIBUZHONGDE')}</span>
            </span>
            <span>
              <AiMarketingEnter
                btnType="text"
                text={getIn18Text('LIJIKAIQI')}
                handleType="create"
                from="addressBook"
                back="#edm?page=addressBookIndex"
                needFilter={true}
                trackFrom="addressBanner"
              />
              <CloseIcon onClick={closeTips} style={{ marginLeft: '16px', cursor: 'pointer' }} />
            </span>
          </div>
        )}
        <Tabs
          className={style.tabs}
          activeKey={tabKey}
          tabBarExtraContent={syncEntry}
          onChange={activeKey => {
            setTabKey(activeKey);
            let tab = '';
            switch (activeKey) {
              case 'overview':
                tab = 'contacts';
                break;
              case 'groups':
                tab = 'group';
                break;
              case 'sources':
                tab = 'create_mode';
                break;
              case 'blacklist':
                tab = 'blacklist';
                break;
              case 'unsubscribe':
                tab = 'unsubscribe';
                break;
              case 'recycle':
                tab = 'recycle_bin';
                break;
              default:
                tab = '';
                break;
            }
            if (tab.length > 0) {
              edmDataTracker.track('waimao_address_book_tab', {
                tab,
              });
            }
          }}
          destroyInactiveTabPane
        >
          <Tabs.TabPane key="overview" tab={getIn18Text('LIANXIRENZONGLAN')}>
            {lxContactsSyncVisible && (
              <Alert
                className={style.lxContactsSync}
                type="info"
                closable
                showIcon
                message={
                  <div className={style.lxContactsSyncContent}>
                    <span>
                      {getTransText('JIANCEDAOGERENTONGXUNLU1')}
                      {lxContactsSyncInfo.contactNum}
                      {getTransText('JIANCEDAOGERENTONGXUNLU2')}
                    </span>
                    <a
                      onClick={() => {
                        sendContactsDataTracker('synchronizing_contacts');
                        if (!lxContactsSyncInfo.contactNum) {
                          Message.info({ content: getIn18Text('GERENTONGXUNLUZANWULIANXIREN') });
                          setLxContactsSyncVisible(false);
                        } else if (!lxContactsSyncInfo.notInContactAddressNum) {
                          Message.info({ content: getIn18Text('GERENTONGXUNLUYIQUANBUTONGBUZHIYINGXIAODEZHIBU') });
                          setLxContactsSyncVisible(false);
                        } else {
                          Modal.confirm({
                            title: `个人通讯录共${lxContactsSyncInfo.contactNum}个联系人，其中${lxContactsSyncInfo.notInContactAddressNum}个未同步，是否确认同步？`,
                            content: getIn18Text('TONGBUHOUQINGJINXINGCHAKANHEXINXIWANSHAN'),
                            onOk: () => {
                              addressBookApi.importContactsFromLxContacts().then(result => {
                                const content = `个人通讯录共${result.contactTotalCnt}人，导入成功${result.contactSuccessCnt}人`;
                                Message.success({ content });
                                contactsRef.current?.reset();
                                setLxContactsSyncVisible(false);
                              });
                            },
                          });
                        }
                      }}
                    >
                      {getIn18Text('TONGBULIANXIREN')}
                    </a>
                  </div>
                }
              />
            )}
            <Contacts
              ref={contactsRef}
              data={data}
              total={total}
              loading={loading}
              scrollHeight={`calc(100vh - ${getBodyFixHeight(true) ? 396 : 428}px)`}
              onFetch={(type: AddressBookFilterType, params: AddressBookContactsParams) => {
                setLoading(true);
                addressBookApi
                  .getContacts(params)
                  .then(res => {
                    setData(res.list);
                    setTotal(res.total);
                  })
                  .finally(() => {
                    setLoading(false);
                  });
              }}
              onFetchBatchDataList={params =>
                addressBookApi.getContacts(params).then(res => ({
                  dataList: res.list || [],
                  total: res.total || 0,
                }))
              }
            >
              {(filter, operations, table) => {
                return (
                  <>
                    {filter}
                    <div
                      style={{
                        padding: '20px 20px 0',
                        backgroundColor: '#FFF',
                        border: `1px solid ${variables.line1}`,
                        borderRadius: 4,
                        marginTop: 12,
                      }}
                    >
                      <div className={style.operations}>
                        <div className={style.left}>{operations}</div>
                        <div className={style.right}>
                          {syncTip}
                          <Space>
                            <Button
                              onClick={() => {
                                sendContactsDataTracker('history_import_list');
                                navigate('#edm?page=addressHistoryIndex');
                              }}
                            >
                              {getIn18Text('LISHIDAORUMINGDAN')}
                            </Button>
                            <PrivilegeCheck accessLabel="OP" resourceLabel="ADDRESS_BOOK">
                              <Dropdown
                                trigger={['click']}
                                placement="bottomRight"
                                overlay={
                                  <Menu>
                                    <Menu.Item
                                      onClick={() => {
                                        sendContactsDataTracker('new_contact');
                                        setAddContactVisible(true);
                                      }}
                                    >
                                      {getIn18Text('XINJIANLIANXIREN')}
                                    </Menu.Item>
                                    <Menu.Item
                                      onClick={() => {
                                        sendContactsDataTracker('new_group');
                                        setAddGroupVisible(true);
                                      }}
                                    >
                                      {getIn18Text('XINJIANFENZU')}
                                    </Menu.Item>
                                  </Menu>
                                }
                              >
                                <Button type="primary">{getIn18Text('XINJIAN')}</Button>
                              </Dropdown>
                            </PrivilegeCheck>
                          </Space>
                        </div>
                      </div>
                      {table}
                    </div>
                  </>
                );
              }}
            </Contacts>
          </Tabs.TabPane>
          <Tabs.TabPane key="groups" tab={getIn18Text('FENZU')}>
            <Groups />
          </Tabs.TabPane>
          <Tabs.TabPane key="sources" tab={getIn18Text('CHUANGJIANFANGSHI')}>
            <Sources />
          </Tabs.TabPane>
          <Tabs.TabPane key="blacklist" tab={getIn18Text('HEIMINGDAN')}>
            <Blacklist />
          </Tabs.TabPane>
          <Tabs.TabPane key="unsubscribe" tab={getIn18Text('TUIDING')}>
            <UnsubscribeTable />
          </Tabs.TabPane>
          <Tabs.TabPane key="recycle" tab={getIn18Text('HUISHOUZHAN')}>
            <Recycle />
          </Tabs.TabPane>
          <Tabs.TabPane key="openSea" tab={getIn18Text('DEZHIBUGONGHAI')}>
            <OpenSea />
          </Tabs.TabPane>
        </Tabs>
        {addContactVisible && (
          <AddContact
            visible={addContactVisible}
            id={1}
            onSuccess={() => {
              setAddContactVisible(false);
              contactsRef.current?.reset();
            }}
            onError={() => {}}
            onClose={() => setAddContactVisible(false)}
          />
        )}
        <AddGroup
          visible={addGroupVisible}
          id={1}
          onSuccess={() => {
            setAddGroupVisible(false);
            contactsRef.current?.reset();
            Message.success({ content: getIn18Text('XINJIANCHENGGONG') });
          }}
          onError={() => {}}
          onClose={() => setAddGroupVisible(false)}
        />
      </div>
    </>
  );
};
export default AddressBookIndex;
