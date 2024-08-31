/* eslint-disable camelcase */
/* eslint-disable max-statements */
import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import {
  MailApi,
  apiHolder,
  apis,
  CustomerApi,
  CustomerDetail as CustomerDetailType,
  ContactDetail,
  CustomerOperateHistoryItem,
  CustomerOperateDetailRes,
  ResDocumentList,
  CustomerEmailListCondition,
} from 'api';
import { Button, Tabs, Tooltip, BackTop, Pagination } from 'antd';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import DetailHeader from '@/components/Layout/Customer/components/detailHeader/detailHeader';
import * as defaultLogo from '@/images/icons/customerDetail/default-logo.png';
import ContactPicker from '@/components/Layout/Customer/components/contactPicker/contactPicker';
import OperateHistory from '@/components/Layout/Customer/components/operateHistory/operateHistory';
import useEventListener from '@web-common/hooks/useEventListener';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import FoldCard from '@/components/Layout/Customer/components/foldCard/foldCard';
import Contacts from '@/components/Layout/Customer/components/contacts/contacts';
import OperatePreview from '@/components/Layout/Customer/components/operatePreview/operatePreview';
import BaseInfo from './components/baseInfo';
import { Follows } from '../../../components/moments/follows';
import { customerDataTracker } from '../../../tracker/customerDataTracker';
import style from './customerDetail.module.scss';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { DocumentList, DocumentListFilter } from '../../../components/documentList/documentList';
import { SearchContact } from '../../../components/contacts/searchContact';
import { EmailList } from '../../../components/emailList';
import ShowConfirm from '@/components/Layout/Customer/components/confirm/makeSureConfirm';
import DistributeClueStatusModal from '@/components/Layout/Customer/components/DistributeClueModal/distributeClueStatus';
import { getIn18Text } from 'api';
interface CustomerDetailProps {
  visible: boolean;
  companyId?: string;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: (shouldUpdate: boolean) => void;
}
const { TabPane } = Tabs;
type TabConfig = {
  key: string;
  text: string;
  trackerName: string;
};
const RESOURCE_LABEL = 'CONTACT_OPEN_SEA';
const tabs: TabConfig[] = [
  { key: 'email', text: getIn18Text('WANGLAIYOUJIAN'), trackerName: 'clickEmailTab' },
  // { key: 'schedule', text: '日程提醒', trackerName: 'clickScheduleTab' },
  { key: 'document', text: getIn18Text('WENJIAN'), trackerName: 'clickDocumentTab' },
  // { key: 'customs', text: '海关数据', trackerName: 'clickCustomsDataTab' },
  { key: 'operate', text: getIn18Text('CAOZUOLISHI'), trackerName: 'clickOperaHistoryTab' },
];
type FollowsVisible = {
  visible: boolean;
  options?: {
    autoOpen?: boolean;
  };
};
interface PaginationTypes {
  current: number;
  pageSize: number;
  pageSizeOptions: string[];
  showSizeChanger: boolean;
}
const defaultPagination: PaginationTypes = {
  current: 1,
  pageSize: 20,
  pageSizeOptions: ['20', '50', '100'],
  showSizeChanger: true,
};
interface ParamsType extends PaginationTypes {
  customerOpenSeaId: string | null;
}
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const CustomerDetail: React.FC<CustomerDetailProps> = props => {
  const { visible, companyId, prevDisabled, nextDisabled, onPrev, onNext, onClose, children } = props;
  const [detail, setDetail] = useState<CustomerDetailType>({} as CustomerDetailType);
  const [contacts, setContacts] = useState<ContactDetail[]>([]);
  const [contactFolded, setContactFolded] = useState(true);
  const [contactPickerVisible, setContactPickerVisible] = useState<boolean>(false);
  const [contactCurrentPage, setContactCurrentPage] = useState<number>(1);
  const [contactCurrentTotal, setContactCurrentTotal] = useState<number>(0);
  const [contactSearchParam, setContactSearchParam] = useState<Record<string, string>>();
  const tabs2: TabConfig[] = [{ key: 'contacts', text: `联系人(${contactCurrentTotal})`, trackerName: '' }];
  const [tabKey2, setTabKey2] = useState<string>(tabs2[0].key);
  const [tabKey, setTabKey] = useState<string>(tabs[0].key);
  const [infoFolded, setInfoFolded] = useState<boolean>(false);
  const [followsVisible, setFollowsVisible] = useState<FollowsVisible>({ visible: true });
  const [operates, setOperates] = useState<CustomerOperateHistoryItem[]>([]);
  const [operatesTotal, setOperatesTotal] = useState<number>(0);
  const [operateDetail, setOperateDetail] = useState<CustomerOperateDetailRes | null>(null);
  const [operateDetailVisible, setOperateDetailVisible] = useState<boolean>(false);
  const [operatesParams, setOperatesParams] = useState<ParamsType>({
    customerOpenSeaId: null,
    ...defaultPagination,
  });
  const [documentList, setDocumentList] = useState<ResDocumentList>();
  const [documentParams, setDocumentParams] = useState<DocumentListFilter>({
    page: 1,
    page_size: defaultPagination.pageSize,
  });
  const hasCustomsViewPermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CUSTOMS', 'VIEW'));
  console.log('!hasCustomsViewPermission &&', hasCustomsViewPermission);
  const followsRef = useRef<any>(null);
  const [shouldUpdate, setShouldUpdate] = useState<boolean>(false);
  const [statusVisible, setStatusVisible] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const onBodyScroll = (event: any) => setScrollTop(event.target.scrollTop);
  const fetchContactsList = () => {
    let params = {
      condition: 'customer_open_sea' as 'company' | 'clue' | 'opportunity' | 'open_sea' | 'customer_open_sea',
      customer_open_sea_id: companyId,
      page: contactCurrentPage,
      page_size: 20,
      contact_search_key: contactSearchParam,
    };
    customerApi.contactListPageById(params).then(res => {
      setContacts(res?.content || []);
      setContactCurrentTotal(res.total_size);
    });
  };
  useEffect(() => {
    if (visible && companyId) {
      fetchCustomerDetail(companyId);
      setOperatesParams({ customerOpenSeaId: companyId, ...defaultPagination });
    } else {
      setOperatesParams({ customerOpenSeaId: null, ...defaultPagination });
    }
    setDocumentParams({ page: 1, page_size: defaultPagination.pageSize });
    setContactSearchParam(undefined);
  }, [visible, companyId]);
  useEventListener('scroll', onBodyScroll, bodyRef.current);
  useEffect(() => {
    followsVisible.visible && bodyRef.current?.scrollTo(0, 0);
  }, [followsVisible.visible]);
  const fetchCustomerDetail = (id: string) => {
    customerApi.openSeaCustomerDetail({ id }).then(data => {
      if (data) {
        const { contact_list, ...rest } = data;
        setDetail(rest as CustomerDetailType);
      } else {
        Toast.error({ content: getIn18Text('WEICHAXUNDAOHAIGUANKEHUXIANGQING') });
      }
    });
  };
  useEffect(() => {
    if (companyId && visible) {
      fetchCustomerDetail(companyId);
    }
  }, [companyId, visible]);
  useEffect(() => {
    if (companyId && visible) {
      fetchContactsList();
    }
  }, [companyId, visible, contactCurrentPage, contactSearchParam]);
  const handleTabTracker = (key: string) => {
    const target = tabs.find(item => item.key === key) as TabConfig;
    // customerDataTracker.trackCustomerDetailTab(target.trackerName);
  };
  const handleWriteMail = (contacts: string[]) => {
    mailApi.doWriteMailToContact(contacts);
    // customerDataTracker.trackCustomerDetailContact('EmailContact');
  };
  useEffect(() => {
    if (visible && tabKey === 'document' && companyId) {
      customerApi
        .getDocumentList({
          condition: 'customer_open_sea',
          condition_id: companyId as string,
          ...documentParams,
        })
        .then(data => {
          setDocumentList(data);
        });
    }
  }, [visible, tabKey, documentParams]);
  const handleDocumentFilterChange = (filter: DocumentListFilter) => {
    const { page_size, page } = filter;
    setDocumentParams(previous => ({
      ...documentParams,
      ...filter,
      page: page_size === previous.page_size ? page : 1,
    }));
  };
  useEffect(() => {
    if (visible && tabKey === 'operate' && operatesParams.customerOpenSeaId) {
      const { current: page, pageSize: page_size, customerOpenSeaId: id } = operatesParams;
      customerApi
        .getCustomerOperateHistory({
          page,
          page_size,
          customer_open_sea_id: id,
          condition: 'customer_open_sea',
          ...operatesParams,
        })
        .then(data => {
          setOperates(data?.item_list || []);
          setOperatesTotal(data?.total_size || 0);
        });
    }
  }, [visible, tabKey, operatesParams]);
  const handleOperateChange = (page: number, pageSize: number) => {
    setOperatesParams(previous => ({
      ...operatesParams,
      current: pageSize === previous.pageSize ? page : 1,
      pageSize,
    }));
  };
  const handleFetchOperateDetail = (id: string) => {
    setOperateDetailVisible(true);
    customerApi
      .getCustomerOperateDetail({
        condition: 'customer_open_sea',
        customer_open_sea_id: companyId,
        history_id: id,
      })
      .then(data => {
        setOperateDetail(data);
      });
    // customerDataTracker.trackCustomerDetailLogTab('DiffContentClickNum');
  };
  const handleClueReceive = () => {
    ShowConfirm({ title: getIn18Text('QUERENLINGQUKEHUMA\uFF1F'), makeSure: makeSureReceive });
  };
  const makeSureReceive = () => {
    if (!companyId) return;
    customerApi.openSeaCustomerReceive([companyId]).then(res => {
      if (res) {
        onClose(true);
        Toast.info({
          content: getIn18Text('LINGQUCHENGGONG'),
        });
      }
    });
  };
  const handleClueDistribute = () => {
    setStatusVisible(true);
  };
  const closeAllocateModal = (param?: boolean) => {
    setStatusVisible(false);
    if (param == true) {
      onClose(true);
    }
  };
  return (
    <Drawer className={style.customerDetail} visible={visible} onClose={() => onClose(shouldUpdate)}>
      <DetailHeader
        className={classnames(style.header, { [style.shadow]: scrollTop > 0 })}
        logo={detail.company_logo}
        defaultLogo={defaultLogo as unknown as string}
        title={detail.company_name}
        titleId={detail.company_number}
        content={<></>}
        options={
          <div className={style.options}>
            <PrivilegeCheck accessLabel="ALLOT" resourceLabel={RESOURCE_LABEL}>
              <Button onClick={handleClueDistribute}>{getIn18Text('FENPEI')}</Button>
            </PrivilegeCheck>
            <PrivilegeCheck accessLabel="CLAIM" resourceLabel={RESOURCE_LABEL}>
              <Button onClick={handleClueReceive}>{getIn18Text('LINGQU')}</Button>
            </PrivilegeCheck>
          </div>
        }
        prevDisabled={prevDisabled}
        nextDisabled={nextDisabled}
        onPrev={() => {
          onPrev();
          // customerDataTracker.trackCustomerDetailTopbar('next');
        }}
        onNext={() => {
          onNext();
          // customerDataTracker.trackCustomerDetailTopbar('next');
        }}
      />
      {!followsVisible.visible && (
        <div
          className={style.showFollowsTrigger}
          onClick={() =>
            setFollowsVisible({
              visible: true,
            })
          }
        >
          {getIn18Text('DONGTAI')}
        </div>
      )}
      <div style={{ paddingLeft: '24px' }}>{children}</div>
      <div className={classnames([style.body, { [style.showFollows]: followsVisible.visible }])} ref={bodyRef}>
        <FoldCard
          className={style.baseInfo}
          title={getIn18Text('JIBENXINXI')}
          folded={infoFolded}
          foldHeight={followsVisible.visible ? 216 : 114}
          onFoldChange={setInfoFolded}
        >
          <BaseInfo data={detail} />
        </FoldCard>
        <FoldCard
          className={style.contact}
          title={
            <Tabs size="small" tabBarGutter={20} activeKey={tabKey2}>
              {tabs2.map(item => (
                <TabPane tab={item.text} key={item.key} />
              ))}
            </Tabs>
          }
          folded={contactFolded}
          foldHeight={followsVisible.visible ? 250 + 48 : 250 + 48}
          onFoldChange={nextFolded => {
            setContactFolded(nextFolded);
            if (!nextFolded) {
              if (tabKey2 === 'contacts') {
                // customerDataTracker.trackCustomerDetailContact('Unfold');
              }
            }
          }}
        >
          {tabKey2 === 'contacts' && (
            <>
              <div className="sirius-scroll" style={{ overflowY: contactFolded ? 'scroll' : 'visible', maxHeight: contactFolded ? 250 : 'none' }}>
                <SearchContact onSearch={setContactSearchParam} searchParams={contactSearchParam} />
                <Contacts list={contacts} mode={contactFolded ? 'simple' : 'complete'} options={[]} />
              </div>
              <div className={style.contactsPagination}>
                <Pagination
                  size="small"
                  className="pagination-wrap"
                  onChange={page => {
                    setContactCurrentPage(page);
                  }}
                  current={contactCurrentPage}
                  pageSize={20}
                  defaultCurrent={1}
                  total={contactCurrentTotal}
                />
              </div>
            </>
          )}
        </FoldCard>
        <FoldCard
          className={style.detail}
          title={
            <Tabs size="small" tabBarGutter={20} activeKey={tabKey} onChange={setTabKey} onTabClick={handleTabTracker}>
              {tabs
                .filter(el => el.key !== 'customs' || hasCustomsViewPermission)
                .map(item => (
                  <TabPane tab={item.text} key={item.key} />
                ))}
            </Tabs>
          }
        >
          {tabKey === 'email' && (
            <div className={style.contactEmails} style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '840px', padding: '10px' }}>
                <EmailList
                  relationDomain={detail.company_domain}
                  relationName={detail.company_name}
                  mainResourceId={companyId}
                  condition={CustomerEmailListCondition.CustomerOpenSea}
                />
              </div>
            </div>
          )}
          {tabKey === 'document' && (
            <DocumentList
              type="company"
              sourceId={companyId as string}
              data={documentList}
              onFilterChange={handleDocumentFilterChange}
              dataTracker={customerDataTracker}
              source={documentParams.source}
              query={documentParams.file_name}
              startDate={documentParams.start_time}
              endDate={documentParams.end_time}
              pagination={{
                current: documentParams.page || 1,
                pageSize: documentParams.page_size || 20,
              }}
            />
          )}
          {tabKey === 'operate' && (
            <div className={style.operate}>
              <OperateHistory
                list={operates}
                pagination={{ ...operatesParams, total: operatesTotal }}
                onChange={handleOperateChange}
                onPreview={handleFetchOperateDetail}
                onOperateNameClick={() => {
                  // customerDataTracker.trackCustomerDetailLogTab('ViewOperator');
                }}
              />
              <OperatePreview
                visible={operateDetailVisible}
                data={operateDetail}
                onCancel={() => {
                  setOperateDetail(null);
                  setOperateDetailVisible(false);
                }}
              />
            </div>
          )}
        </FoldCard>
        <FoldCard
          className={style.follows}
          title={<span style={{ marginLeft: -4 }}>{getIn18Text('GENJINDONGTAI')}</span>}
          options={
            <div
              className={style.hideFollowsTrigger}
              onClick={() =>
                setFollowsVisible({
                  visible: false,
                })
              }
            >
              {getIn18Text('SHOUQI')}
            </div>
          }
        >
          {detail && (
            <Follows
              ref={followsRef}
              id={companyId as string}
              type="customerOpenSea"
              visible={followsVisible.visible}
              options={followsVisible.options}
              disabled
              disabledText={getIn18Text('GONGHAIKEHUWUFATIANJIAGENJINJILU')}
            />
          )}
        </FoldCard>
      </div>
      <ContactPicker
        visible={contactPickerVisible}
        data={contacts}
        onCancel={() => setContactPickerVisible(false)}
        onSubmit={(pickedIds, pickedEmails) => {
          setContactPickerVisible(false);
          handleWriteMail(pickedEmails);
        }}
      />
      <BackTop target={() => bodyRef.current as HTMLElement} visibilityHeight={500}>
        <Tooltip title={getIn18Text('HUIDAODINGBU')} placement="bottomRight">
          <div className={style.backTopIcon} />
        </Tooltip>
      </BackTop>
      {statusVisible && <DistributeClueStatusModal visible={statusVisible} onCancel={closeAllocateModal} ids={[companyId as string]} isCustomer={true} />}
    </Drawer>
  );
};
CustomerDetail.defaultProps = {
  visible: false,
  prevDisabled: false,
  nextDisabled: false,
  onClose: () => {},
};
export default CustomerDetail;
