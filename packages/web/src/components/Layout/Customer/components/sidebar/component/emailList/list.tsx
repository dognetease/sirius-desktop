import React, { useEffect, useState, useRef } from 'react';
import classnames from 'classnames';
import { Modal, message, Button, Spin } from 'antd';
import {
  api,
  apis,
  CustomerAuthDataType,
  CustomerDiscoveryApi,
  CustomerEmailAuthManager,
  CustomerEmailEmailList,
  CustomerEmailItem,
  CustomerEmailItemHideState,
  CustomerEmailListReq,
} from 'api';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import InfiniteLoader from 'react-window-infinite-loader';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import style from './emailList.module.scss';
import { EmailItem } from './mailItem';
import { EmptyTips } from '../emptyTips';
import { getIn18Text } from 'api';
const customerDiscoveryApi = api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
const systemApi = api.getSystemApi();
export interface EmailListProps {
  resourceId: string;
  condition: CustomerAuthDataType;
  relationName?: string;
  relationDomain?: string;
}
interface ManagerInfo {
  list: Array<CustomerEmailAuthManager>;
  loading: boolean;
}
export const EmailList = (props: EmailListProps) => {
  const { condition, resourceId, relationDomain, relationName } = props;
  const [loading, setLoading] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [contactEmails, setContactEmails] = useState<CustomerEmailEmailList>({} as CustomerEmailEmailList);
  // const [list, setList] = useState<CustomerEmailItem[]>([]);
  const listRef = useRef<CustomerEmailItem[]>([]);
  const [managerInfo, setManager] = useState<ManagerInfo>({ list: [], loading: false });
  const [searchParams, setSearchParams] = useState<CustomerEmailListReq>({
    condition,
    main_resource_id: resourceId,
    page: 1,
    page_size: 20,
    type: '',
  });
  const [pagination, setPagination] = useState({
    pageSize: 20,
    current: 1,
    total: 0,
    // hideOnSinglePage: true
  });
  const fetchData = async () => {
    try {
      setLoading(true);
      const { page } = searchParams;
      const res = await customerDiscoveryApi.getCustomerEmailList({
        ...searchParams,
        main_resource_id: resourceId,
      });
      // setList(prev => (page === 1 ? res.content : [...prev, ...res.content]));
      listRef.current = page === 1 ? res.content : [...listRef.current, ...res.content];
      setPagination({ ...pagination, total: res.total_size || 0 });
      setContactEmails(res);
    } finally {
      setLoading(false);
    }
  };
  const emailTypeChange = (v: string) => {
    setPagination({ ...pagination, current: 1 });
    setSearchParams({
      ...searchParams,
      type: v,
      page: 1,
    });
  };
  const fetchManagerList = async () => {
    if (managerInfo?.list?.length) {
      return;
    }
    try {
      setManager({ list: [], loading: true });
      const managers = await customerDiscoveryApi.getAuthManagerList();
      setManager({ list: managers, loading: false });
    } catch {
      setManager({ ...managerInfo, loading: false });
    }
  };
  useEffect(() => {
    setContactEmails({} as CustomerEmailEmailList);
    setSearchParams(prev => {
      const obj: CustomerEmailListReq = {
        ...prev,
        main_resource_id: resourceId,
        type: '',
        page: 1,
        page_size: 20,
      };
      return Object.keys(prev).some(k => (prev as any)[k] !== (obj as any)[k]) ? obj : prev;
    });
  }, [resourceId]);
  useEffect(() => {
    if (searchParams.condition && searchParams.main_resource_id) {
      fetchData();
    }
  }, [searchParams]);
  const renderEmailRelation = (useGrantInfo = false) => {
    let fromList;
    let toList;
    let totalSize;
    if (useGrantInfo) {
      fromList = contactEmails?.grantRecord?.fromNicknameSet ?? [];
      toList = contactEmails?.grantRecord?.toNicknameSet ?? [];
      totalSize = contactEmails?.grantRecord?.totalEmailNum ?? 0;
    } else {
      fromList = contactEmails?.need_permission_publisher ?? [];
      toList = contactEmails?.need_permission_receiver ?? [];
      totalSize = contactEmails?.hide_size ?? 0;
    }
    return (
      <div className={style.authInfo}>
        <span>{getIn18Text('BAOHAN')}</span>
        {
          // eslint-disable-next-line
          (fromList || []).map((name, index) => {
            const nickName = String(name).trim();
            if (index !== 0) {
              return <span className={style.nickName}>,{nickName}</span>;
            }
            return <span className={style.nickName}>{nickName}</span>;
          })
        }
        <span>{getIn18Text('YU')}</span>
        {
          // eslint-disable-next-line
          (toList || []).map((name, index) => {
            const nickName = String(name).trim();
            if (index !== 0) {
              return <span className={style.nickName}>,{nickName}</span>;
            }
            return <span className={style.nickName}>{nickName}</span>;
          })
        }
        <span>{getIn18Text('DE')}</span>
        <span className={style.num}>{totalSize ?? '--'}</span>
        <span>{getIn18Text('FENGWANGLAIYOUJIANNEIRONG')}</span>
      </div>
    );
  };
  /**
   * 申请查看权限
   */
  let lock = false;
  const createAuthorization = async () => {
    if (lock) {
      return;
    }
    lock = true;
    Modal.confirm({
      centered: true,
      content: renderEmailRelation(),
      onOk: async () => {
        try {
          await customerDiscoveryApi.createAuth({
            relationDomain: relationDomain as string,
            relationName: relationName as string,
            relationId: resourceId,
            relationType: condition,
            resources: contactEmails.need_permission,
          });
          message.success(getIn18Text('SHENQINGCHENGGONG'));
          fetchData();
        } finally {
          lock = false;
        }
      },
      onCancel: () => {
        lock = false;
      },
    });
  };
  /**
   * 预览邮件
   * @param snapshot_id
   */
  const readEmailDetail = async (snapshotId: string) => {
    const previewLink = await customerDiscoveryApi.getCustomerEmailPreviewUrl(condition, snapshotId, resourceId);
    if (previewLink) {
      if (systemApi.isElectron()) {
        systemApi.createWindowWithInitData('iframePreview', {
          eventName: 'initPage',
          eventData: {
            iframeSrc: previewLink,
          },
        });
      } else {
        window.open(previewLink);
      }
    }
  };
  const isItemLoaded = (index: number) => index < listRef.current.length;
  const loadMore = () => {
    setSearchParams(prev => ({
      ...prev,
      page: prev.page + 1,
    }));
  };
  const getSize = (index: number) => {
    if (index < listRef.current.length) {
      const email = listRef.current[index];
      if (email.hideState === CustomerEmailItemHideState.NoNeedAuth && email.attachments.length > 0) {
        return 122;
      }
    }
    return 94;
  };
  const RowData = ({ data, index, style }: { data: CustomerEmailItem[]; index: number; style: React.CSSProperties }) => {
    if (index >= data.length) {
      return <div style={style}>{getIn18Text('JIAZAIZHONG...')}</div>;
    }
    return (
      <div style={style}>
        <EmailItem
          email={data[index]}
          onPreview={item => readEmailDetail(item.snapshot_id)}
          onCreateAuth={createAuthorization}
          onViewAuthProgress={() => setAuthModalVisible(true)}
        />
      </div>
    );
  };
  return (
    <div className={style.emailList}>
      <div className={style.searchBlock}>
        <Select style={{ width: '100%' }} placeholder={getIn18Text('ANSHOUFALEIXING')} onChange={v => emailTypeChange(v as string)}>
          <Select.Option value="">{getIn18Text('QUANBU')}</Select.Option>
          <Select.Option value="receive">{getIn18Text('SHOUJIAN')}</Select.Option>
          <Select.Option value="send">{getIn18Text('FAJIAN')}</Select.Option>
        </Select>
      </div>
      {listRef.current.length === 0 ? <EmptyTips text={getIn18Text('ZANWUWANGLAIYOUJIAN')} /> : null}
      <div className={style.emailListScroller}>
        <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={pagination.total} loadMoreItems={loadMore}>
          {({ onItemsRendered, ref }) => (
            <AutoSizer>
              {({ height, width }) => (
                <List
                  className={classnames(style.list, 'sirius-scroll')}
                  height={height}
                  width={width}
                  itemCount={pagination.total}
                  itemSize={getSize}
                  estimatedItemSize={78}
                  onItemsRendered={onItemsRendered}
                  itemData={listRef.current}
                  ref={ref}
                >
                  {RowData}
                </List>
              )}
            </AutoSizer>
          )}
        </InfiniteLoader>
      </div>

      <Modal
        title={getIn18Text('SHOUQUANSHENQING')}
        visible={authModalVisible}
        centered
        onCancel={() => setAuthModalVisible(false)}
        footer={
          <Button type="primary" onClick={() => setAuthModalVisible(false)}>
            {getIn18Text('QUEDING')}
          </Button>
        }
      >
        {renderEmailRelation(true)}
        <div>
          {getIn18Text('YIXIANG')}
          <span className={style.linkBtn} onClick={fetchManagerList}>
            {getIn18Text('GUANLIYUAN')}
          </span>
          {getIn18Text('FAQISHENQING\uFF0CSHENPITONGGUOHOUKECHAKAN')}
        </div>
        <div className={style.managerList}>
          {managerInfo.loading ? (
            <Spin />
          ) : (
            <>
              {managerInfo.list.length > 0 ? <span>{getIn18Text('GUANLIYUAN\uFF1A')}</span> : ''}
              {(managerInfo.list || []).map((manager, index) => {
                const nickName = String(manager.accNickname).trim();
                if (index !== 0) {
                  return <span className={style.nickName}>,{nickName}</span>;
                }
                return <span className={style.nickName}>{nickName}</span>;
              })}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
