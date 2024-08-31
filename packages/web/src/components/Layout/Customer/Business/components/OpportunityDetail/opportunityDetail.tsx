import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import {
  apis,
  apiHolder,
  MailApi,
  CustomerApi,
  OpportunityDetail as OpportunityDetailType,
  OpportunityStageItem,
  ContactDetail,
  CustomerSchedule as CustomerScheduleType,
  CustomerOperateHistoryItem,
  CustomerOperateDetailRes,
  UpdateOpportunityStageParams,
  OpportunityCloseRecordItem,
  ResDocumentList,
  CustomerEmailListCondition,
} from 'api';
import { Button, Dropdown, Menu, Tooltip, BackTop, Pagination } from 'antd';
import CaretDownFilled from '@ant-design/icons/CaretDownFilled';
import moment from 'moment';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import Tabs from '@/components/Layout/Customer/components/UI/Tabs/tabs';
import FoldCard from '@/components/Layout/Customer/components/foldCard/foldCard';
import DetailHeader from '@/components/Layout/Customer/components/detailHeader/detailHeader';
import ContactPicker from '@/components/Layout/Customer/components/contactPicker/contactPicker';
import ContactEmails, { readEmail } from '@/components/Layout/Customer/components/contactEmails/contactEmails';
import Schedules from '@/components/Layout/Customer/components/schedules/schedules';
import OperateHistory from '@/components/Layout/Customer/components/operateHistory/operateHistory';
import OperatePreview from '@/components/Layout/Customer/components/operatePreview/operatePreview';
import EditSchedule from '@/components/Layout/Customer/components/editSchedule/editSchedule';
import Contacts from '@/components/Layout/Customer/components/contacts/contacts';
import BaseInfo from './components/baseInfo';
import AddContact from './components/addContact';
import DealInfo from './components/dealInfo';
import CloseReason from './components/closeReason';
import CloseRecord from './components/closeRecord';
import opportunityLogo from '@/images/icons/customerDetail/opportunity-logo.png';
import Stages, { DEAL_TYPE, CLOSE_TYPE, REOPEN_TYPE } from './components/stages';
import ClientBusinessModal from '../../components/CreateNewBusinessModal/createNewBussinessModal';
import useEventListener from '@web-common/hooks/useEventListener';
import { Follows } from '../../../components/moments/follows';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { businessDataTracker } from '../../../tracker/businessDataTracker';
import style from './opportunityDetail.module.scss';
import { DocumentList, DocumentListFilter } from '../../../components/documentList/documentList';
import { SearchContact } from '../../../components/contacts/searchContact';
import { EmailList } from '../../../components/emailList';
import { getIn18Text } from 'api';
type FollowsVisible = {
  visible: boolean;
  options?: {
    autoOpen?: boolean;
  };
};
type TabConfig = {
  key: string;
  text: string;
  trackerName: string;
};
const { TabPane } = Tabs;
const headerOptions = [
  { key: 'schedule', text: getIn18Text('XINJIANRICHENG') },
  { key: 'follows', text: getIn18Text('XINJIANGENJIN') },
];
const tabs: TabConfig[] = [
  { key: 'email', text: getIn18Text('WANGLAIYOUJIAN'), trackerName: 'clickEmailTab' },
  { key: 'schedule', text: getIn18Text('RICHENGTIXING'), trackerName: 'clickScheduleTab' },
  { key: 'document', text: getIn18Text('WENJIAN'), trackerName: 'clickDocumentTab' },
  { key: 'operate', text: getIn18Text('CAOZUOLISHI'), trackerName: 'clickOperaHistoryTab' },
];
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
interface OpportunityDetailProps {
  visible: boolean;
  opportunityId: string;
  prevDisabled: boolean;
  nextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: (shouldUpdate: boolean) => void;
}
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
  opportunityId: string | null;
}
interface EmailsParamsType extends ParamsType {
  fromEmail?: string;
  toEmail?: string;
  startDate?: string;
  endDate?: string;
  labels?: string[];
}
const OpportunityDetail: React.FC<OpportunityDetailProps> = props => {
  const { visible, opportunityId, prevDisabled, nextDisabled, onPrev, onNext, onClose, children } = props;
  const [detail, setDetail] = useState<OpportunityDetailType>({} as OpportunityDetailType);
  const [tabKey, setTabKey] = useState<string>(tabs[0]?.key);
  const [followsVisible, setFollowsVisible] = useState<FollowsVisible>({ visible: true });
  const [infoFolded, setInfoFolded] = useState<boolean>(false);
  const [opportunityEditVisible, setOpportunityEditVisible] = useState<boolean>(false);
  const [contactPickerVisible, setContactPickerVisible] = useState<boolean>(false);
  const [dealInfoVisible, setDealInfoVisible] = useState<boolean>(false);
  const [closeReasonVisible, setCloseReasonVisible] = useState<boolean>(false);
  const [closeRecord, setCloseRecord] = useState<OpportunityCloseRecordItem[]>([]);
  const [stages, setStages] = useState<OpportunityStageItem[]>([]);
  const [contacts, setContacts] = useState<ContactDetail[]>([]);
  const [customerContacts, setCustomerContacts] = useState<ContactDetail[]>([]);
  const [contactsFolded, setContactsFolded] = useState<boolean>(true);
  const [addContactVisible, setAddContactVisible] = useState<boolean>(false);
  const [emailsParams, setEmailsParams] = useState<EmailsParamsType>({
    opportunityId: null,
    ...defaultPagination,
  });
  const [schedules, setSchedules] = useState<CustomerScheduleType[]>([]);
  const [schedulesTotal, setSchedulesTotal] = useState<number>(0);
  const [scheduleActiveId, setScheduleActiveId] = useState<number | null>(null);
  const [scheduleEditVisible, setScheduleEditVisible] = useState<boolean>(false);
  const [schedulesParams, setSchedulesParams] = useState<ParamsType>({
    opportunityId: null,
    ...defaultPagination,
  });
  const [operates, setOperates] = useState<CustomerOperateHistoryItem[]>([]);
  const [operatesTotal, setOperatesTotal] = useState<number>(0);
  const [operateDetail, setOperateDetail] = useState<CustomerOperateDetailRes | null>(null);
  const [operateDetailVisible, setOperateDetailVisible] = useState<boolean>(false);
  const [operatesParams, setOperatesParams] = useState<ParamsType>({
    opportunityId: null,
    ...defaultPagination,
  });
  const [documentList, setDocumentList] = useState<ResDocumentList>();
  const [documentParams, setDocumentParams] = useState<DocumentListFilter>({
    page: 1,
    page_size: defaultPagination.pageSize,
  });
  const hasEditPermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'COMMERCIAL', 'OP'));
  const hasDeletePermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'COMMERCIAL', 'DELETE'));
  // set header shadow & back-top on body scroll
  const [scrollTop, setScrollTop] = useState<number>(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const onBodyScroll = event => setScrollTop(event.target.scrollTop);
  const followsRef = useRef<any>(null);
  // notify parent container whether should update data
  const [shouldUpdate, setShouldUpdate] = useState<boolean>(false);
  const [companyId, setCompanyId] = useState<string>('');
  const [contactCurrentPage, setContactCurrentPage] = useState<number>(1);
  const [contactCurrentTotal, setContactCurrentTotal] = useState<number>(0);
  const [contactSearchParam, setContactSearchParam] = useState<Record<string, string>>();
  const fetchOpportunityDetail = id => {
    return customerApi.getOpportunityDetail({ id }).then(data => {
      if (data) {
        const { contact_list, ...rest } = data;
        setDetail(rest as OpportunityDetailType);
        return data;
      } else {
        Toast.error({ content: getIn18Text('WEICHAXUNDAOSHANGJIXIANGQING') });
        return null;
      }
    });
  };
  const fetchOpportunityStages = id => {
    customerApi.getOpportunityStages({ id }).then(data => {
      setStages(data.stages || []);
    });
  };
  const fetchCustomerContacts = company_id => {
    customerApi
      .businessContactListById({
        company_id,
        condition: 'company',
      } as any)
      .then(data => {
        setCustomerContacts(data as unknown as ContactDetail[]);
      });
  };
  const fetchCloseRecord = id => {
    customerApi.getOpportunityCloseRecord({ id }).then(data => {
      setCloseRecord(data?.records || []);
    });
  };
  useEventListener('scroll', onBodyScroll, bodyRef.current);
  useEffect(() => {
    if (visible && opportunityId) {
      fetchOpportunityDetail(opportunityId).then(data => {
        data?.company_id ? setCompanyId(data?.company_id) : setCustomerContacts([]);
      });
      fetchOpportunityStages(opportunityId);
      setSchedulesParams({ opportunityId, ...defaultPagination });
      setOperatesParams({ opportunityId, ...defaultPagination });
    } else {
      setSchedulesParams({ opportunityId: null, ...defaultPagination });
      setOperatesParams({ opportunityId: null, ...defaultPagination });
    }
    setDocumentParams({ page: 1, page_size: defaultPagination.pageSize });
    setContactSearchParam(undefined);
  }, [visible, opportunityId]);
  useEffect(() => {
    if (companyId && addContactVisible) {
      fetchCustomerContacts(companyId);
    }
  }, [companyId, addContactVisible]);
  useEffect(() => {
    if (visible && detail.stage && detail.stage.type === CLOSE_TYPE) {
      fetchCloseRecord(opportunityId);
    }
  }, [visible, detail.stage]);
  useEffect(() => {
    followsVisible.visible && bodyRef.current?.scrollTo(0, 0);
  }, [followsVisible.visible]);
  useEffect(() => {
    if (visible && tabKey === 'schedule' && schedulesParams.opportunityId) {
      const { current: page, pageSize: page_size, opportunityId: opportunity_id, ...restParams } = schedulesParams;
      customerApi.getCustomerScheduleList({ opportunity_id, page, page_size, ...restParams }).then(data => {
        setSchedules(data.item_list);
        setSchedulesTotal(data.total_size);
      });
    }
  }, [visible, tabKey, schedulesParams]);
  useEffect(() => {
    if (visible && tabKey === 'operate' && operatesParams.opportunityId) {
      const { current: page, pageSize: page_size, opportunityId: opportunity_id } = operatesParams;
      customerApi
        .getCustomerOperateHistory({
          page,
          page_size,
          opportunity_id,
          condition: 'opportunity',
          ...operatesParams,
        })
        .then(data => {
          setOperates(data?.item_list || []);
          setOperatesTotal(data?.total_size || 0);
        });
    }
  }, [visible, tabKey, operatesParams]);
  const handleClickMenu = event => {
    if (event.key === 'schedule') {
      setTabKey('schedule');
      setScheduleEditVisible(true);
      businessDataTracker.trackOpportunityDetailTopbar('AddSchedule');
    }
    if (event.key === 'follows') {
      setFollowsVisible({
        visible: true,
        options: { autoOpen: true },
      });
      businessDataTracker.trackOpportunityDetailTopbar('AddFollowup');
    }
  };
  const handlePickContact = () => {
    businessDataTracker.trackOpportunityDetailTopbar('email');
    if (!contacts.length) return Toast.info({ content: getIn18Text('ZANWULIANXIREN') });
    if (contacts.length === 1) return handleWriteMail([contacts[0].email]);
    setContactPickerVisible(true);
  };
  const handleTabTracker = (key: string) => {
    const target = tabs.find(item => item.key === key) as TabConfig;
    businessDataTracker.trackOpportunityDetailTab(target.trackerName);
  };
  const handleWriteMail = emailIds => {
    mailApi.doWriteMailToContact(emailIds);
  };
  const handleEmailsChange = (page, pageSize) => {
    setEmailsParams(previous => ({
      ...emailsParams,
      current: pageSize === previous.pageSize ? page : 1,
      pageSize,
    }));
  };
  const handleSchedulesChange = params => {
    const { current, pageSize } = params;
    setSchedulesParams(previous => ({
      ...schedulesParams,
      current: pageSize === previous.pageSize ? current : 1,
      pageSize,
    }));
  };
  const handleOperateChange = (page, pageSize) => {
    setOperatesParams(previous => ({
      ...operatesParams,
      current: pageSize === previous.pageSize ? page : 1,
      pageSize,
    }));
  };
  const handleScheduleSubmit = data => {
    if (!scheduleActiveId) {
      customerApi
        .createCustomerSchedule({ ...data, opportunity_id: opportunityId })
        .then(() => {
          followsRef.current.refresh();
        })
        .finally(() => {
          setScheduleActiveId(null);
          setScheduleEditVisible(false);
          setSchedulesParams({ ...schedulesParams, ...defaultPagination });
          setShouldUpdate(true);
        });
      businessDataTracker.trackOpportunityDetailScheduleSubmit('AddSaveSchedule', data.start, moment().format('YYYY-MM-DD HH:mm:ss'));
    } else {
      customerApi
        .updateCustomerSchedule({
          ...data,
          opportunity_id: opportunityId,
          schedule_id: scheduleActiveId,
        })
        .then(() => {
          followsRef.current.refresh();
        })
        .finally(() => {
          setScheduleActiveId(null);
          setScheduleEditVisible(false);
          setSchedulesParams({ ...schedulesParams });
          setShouldUpdate(true);
        });
      businessDataTracker.trackOpportunityDetailScheduleSubmit('EditSaveSchedule', data.start, moment().format('YYYY-MM-DD HH:mm:ss'));
    }
  };
  const handleDeleteSchedule = schedule_id => {
    Modal.confirm({
      title: getIn18Text('QUEDINGSHANCHURICHENG'),
      content: null,
      okText: getIn18Text('SHANCHU'),
      okButtonProps: { type: 'default', danger: true },
      onOk: () => {
        customerApi.deleteCustomerSchedule({ schedule_id, condition: 'opportunity' }).then(() => {
          setSchedulesParams({ ...schedulesParams });
        });
      },
    });
    const { schedule_time } = schedules.find(item => item.schedule_id === schedule_id) || {};
    businessDataTracker.trackOpportunityDetailSchedule('DeleteSchedule', schedule_time as string, moment().format('YYYY-MM-DD HH:mm:ss'));
  };
  const handleFetchOperateDetail = id => {
    setOperateDetailVisible(true);
    customerApi
      .getCustomerOperateDetail({
        condition: 'opportunity',
        opportunity_id: opportunityId,
        history_id: id,
      })
      .then(data => {
        setOperateDetail(data);
      });
    businessDataTracker.trackOpportunityDetailOperateOption('DiffContentClickNum');
  };
  const fetchContactsList = () => {
    const params = {
      condition: 'opportunity' as 'company' | 'clue' | 'opportunity' | 'open_sea',
      opportunity_id: opportunityId,
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
    if (opportunityId && visible) {
      fetchContactsList();
    }
  }, [opportunityId, visible, contactCurrentPage, contactSearchParam]);
  useEffect(() => {
    if (visible && tabKey === 'document' && opportunityId) {
      customerApi
        .getDocumentList({
          condition: 'opportunity',
          condition_id: opportunityId as string,
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
  const handleStageChange = (stage: number, type: number) => {
    const stageName = stages.find(item => item.stage === stage)?.name;
    if (type === DEAL_TYPE) {
      businessDataTracker.trackOpportunityDetailStageChange('deal', stageName as string);
      return setDealInfoVisible(true);
    }
    if (type === CLOSE_TYPE) {
      businessDataTracker.trackOpportunityDetailStageChange('close', stageName as string);
      return setCloseReasonVisible(true);
    }
    handleStageUpdate({ id: opportunityId, stage });
    if (type === REOPEN_TYPE) {
      businessDataTracker.trackOpportunityDetailStageChange('reopen', stageName as string);
    } else {
      businessDataTracker.trackOpportunityDetailStageChange('normal', stageName as string);
    }
  };
  const handleStageUpdate = (params: UpdateOpportunityStageParams) => {
    customerApi.updateOpportunityStage(params).then(data => {
      const { contact_list, ...rest } = data;
      setContacts(contact_list || []);
      setDetail(rest as OpportunityDetailType);
      setShouldUpdate(true);
      tabKey === 'operate' && setOperatesParams({ ...operatesParams, ...defaultPagination });
      followsRef.current.refresh();
    });
  };
  const handleDeleteContact = contactId => {
    Modal.confirm({
      title: getIn18Text('QUEDINGSHANCHULIANXIREN'),
      content: null,
      okText: getIn18Text('SHANCHU'),
      okButtonProps: { type: 'default', danger: true },
      onOk: () => {
        customerApi
          .deleteOpportunityContact({
            opportunity_id: opportunityId,
            contact_id: contactId,
            condition: 'opportunity',
          })
          .then(success => {
            success && fetchContactsList();
            setShouldUpdate(true);
          });
      },
    });
    businessDataTracker.trackOpportunityDetailContact('unlink');
  };
  const handleAddContact = contactId => {
    setAddContactVisible(false);
    customerApi
      .contactAdd({
        contact_id: contactId,
        opportunity_id: opportunityId,
        condition: 'opportunity',
      } as any)
      .then(success => {
        success && fetchContactsList();
        setShouldUpdate(true);
      });
  };
  const readEmailDetail = ({ snapshot_id }: { snapshot_id: string }) => {
    let params = {
      condition: 'opportunity',
      opportunity_id: opportunityId,
      mailSnapshotId: snapshot_id,
    };
    readEmail(params);
  };
  return (
    <Drawer className={style.opportunityDetail} visible={visible} onClose={() => onClose(shouldUpdate)}>
      <DetailHeader
        className={classNames(style.header, { [style.shadow]: scrollTop > 0 })}
        defaultLogo={opportunityLogo}
        title={detail.name}
        titleId={detail.number}
        content={null}
        options={
          <PrivilegeCheck resourceLabel="COMMERCIAL" accessLabel="OP">
            <div className={style.options}>
              <Button
                onClick={() => {
                  setOpportunityEditVisible(true);
                  businessDataTracker.trackOpportunityDetailTopbar('edit');
                }}
              >
                {getIn18Text('BIANJI')}
              </Button>
              <Button onClick={handlePickContact}>{getIn18Text('XIEYOUJIAN')}</Button>
              <Dropdown
                placement="bottomRight"
                overlay={
                  <Menu onClick={handleClickMenu}>
                    {headerOptions.map(item => (
                      <Menu.Item key={item.key}>
                        <span>{item.text}</span>
                      </Menu.Item>
                    ))}
                  </Menu>
                }
              >
                <Button>
                  {getIn18Text('GUANLIANCAOZUO')}
                  <CaretDownFilled />
                </Button>
              </Dropdown>
            </div>
          </PrivilegeCheck>
        }
        prevDisabled={prevDisabled}
        nextDisabled={nextDisabled}
        onPrev={() => {
          onPrev();
          businessDataTracker.trackOpportunityDetailTopbar('next');
        }}
        onNext={() => {
          onNext();
          businessDataTracker.trackOpportunityDetailTopbar('next');
        }}
      />
      <ContactPicker
        visible={contactPickerVisible}
        data={contacts}
        onCancel={() => setContactPickerVisible(false)}
        onSubmit={(pickedIds, pickedEmails) => {
          setContactPickerVisible(false);
          handleWriteMail(pickedEmails);
        }}
      />
      <div style={{ paddingLeft: '24px' }}>{children}</div>
      <div
        className={classNames(style.body, {
          [style.showFollows]: followsVisible.visible,
        })}
        ref={bodyRef}
      >
        <Stages
          className={style.stages}
          checkedStage={detail.stage?.stage}
          list={stages}
          disabled={!hasEditPermission}
          closeRecord={<CloseRecord data={closeRecord} />}
          onStageChange={handleStageChange}
        />
        <FoldCard
          className={style.baseInfo}
          title={getIn18Text('JIBENXINXI')}
          folded={infoFolded}
          foldHeight={followsVisible.visible ? 180 : 114}
          onFoldChange={setInfoFolded}
        >
          <BaseInfo detail={detail} />
        </FoldCard>
        <FoldCard
          className={style.contacts}
          title={`联系人(${contactCurrentTotal})`}
          folded={contactsFolded}
          foldHeight={followsVisible.visible ? 250 + 48 : 250 + 48}
          onFoldChange={nextFolded => {
            setContactsFolded(nextFolded);
            !nextFolded && businessDataTracker.trackOpportunityDetailContact('Unfold');
          }}
          options={
            <PrivilegeCheck resourceLabel="COMMERCIAL" accessLabel="OP">
              <span
                className={style.createContact}
                onClick={() => {
                  setAddContactVisible(true);
                  businessDataTracker.trackOpportunityDetailContact('AddContact');
                }}
              >
                {getIn18Text('XINZENG')}
              </span>
            </PrivilegeCheck>
          }
        >
          <>
            <div className="sirius-scroll" style={{ overflowY: contactsFolded ? 'scroll' : 'visible', maxHeight: contactsFolded ? 250 : 'none' }}>
              <SearchContact onSearch={setContactSearchParam} searchParams={contactSearchParam} />
              <Contacts
                list={contacts}
                mode={contactsFolded ? 'simple' : 'complete'}
                options={hasEditPermission ? ['mail', 'delete'] : []}
                onWriteMail={email => {
                  handleWriteMail([email]);
                  businessDataTracker.trackOpportunityDetailContact('EmailContact');
                }}
                onDelete={handleDeleteContact}
              />
            </div>
            <div className={style.contactsPagination}>
              <Pagination
                size="small"
                className="pagination-wrap"
                pageSize={20}
                onChange={page => setContactCurrentPage(page)}
                current={contactCurrentPage}
                defaultCurrent={1}
                total={contactCurrentTotal}
              />
            </div>
          </>
        </FoldCard>
        <FoldCard
          className={style.tabs}
          title={
            <Tabs size="small" tabBarGutter={20} activeKey={tabKey} onChange={setTabKey} onTabClick={handleTabTracker}>
              {tabs.map(item => (
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
                  mainResourceId={opportunityId}
                  condition={CustomerEmailListCondition.Opportunity}
                />
              </div>
            </div>
          )}
          {tabKey === 'schedule' && (
            <div className={style.schedules}>
              <Schedules
                data={schedules}
                pagination={{ ...schedulesParams, total: schedulesTotal }}
                onChange={handleSchedulesChange}
                canEdit={hasEditPermission}
                canDelete={hasDeletePermission}
                onCreate={() => {
                  setScheduleEditVisible(true);
                }}
                onEdit={scheduleId => {
                  setScheduleActiveId(scheduleId);
                  setScheduleEditVisible(true);
                }}
                onDelete={handleDeleteSchedule}
              />
            </div>
          )}
          {tabKey === 'document' && (
            <DocumentList
              type="opportunity"
              sourceId={opportunityId as string}
              data={documentList}
              onFilterChange={handleDocumentFilterChange}
              dataTracker={businessDataTracker}
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
                onOperateNameClick={() => businessDataTracker.trackOpportunityDetailOperateOption('ViewOperator')}
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
        <EditSchedule
          visible={scheduleEditVisible}
          title={scheduleActiveId ? getIn18Text('BIANJIRICHENG') : getIn18Text('XINJIANRICHENG')}
          data={schedules.find(item => item.schedule_id === scheduleActiveId) || null}
          onOpen={schedule_time => {
            businessDataTracker.trackOpportunityDetailSchedule(scheduleActiveId ? 'EditSchedule' : 'AddSchedule', schedule_time, moment().format('YYYY-MM-DD HH:mm:ss'));
          }}
          onSubmit={handleScheduleSubmit}
          onCancel={() => {
            setScheduleActiveId(null);
            setScheduleEditVisible(false);
          }}
        />
        <AddContact
          visible={addContactVisible}
          list={customerContacts}
          disabledIds={contacts.map(item => item.contact_id)}
          onCancel={() => setAddContactVisible(false)}
          onOk={handleAddContact}
        />
        <DealInfo
          visible={dealInfoVisible}
          currencyName={detail.currency_name}
          onCancel={() => setDealInfoVisible(false)}
          onOk={dealExt => {
            handleStageUpdate({
              id: opportunityId,
              stage: stages.find(item => item.type === DEAL_TYPE)?.stage as unknown as number,
              dealExt,
            });
            setDealInfoVisible(false);
          }}
        />
        <CloseReason
          visible={closeReasonVisible}
          onCancel={() => setCloseReasonVisible(false)}
          onOk={closeExt => {
            handleStageUpdate({
              id: opportunityId,
              stage: stages.find(item => item.type === CLOSE_TYPE)?.stage as unknown as number,
              closeExt,
            });
            setCloseReasonVisible(false);
          }}
        />
        {opportunityEditVisible && (
          <ClientBusinessModal
            visible={opportunityEditVisible}
            width={768}
            id={opportunityId}
            pageType="edit"
            onCancel={success => {
              if (success) {
                fetchOpportunityDetail(opportunityId);
                fetchContactsList();
              }
              setOpportunityEditVisible(false);
              setShouldUpdate(true);
              tabKey === 'operate' && setOperatesParams({ ...operatesParams, ...defaultPagination });
              followsRef.current.refresh();
            }}
          />
        )}
        {!followsVisible.visible && (
          <div className={style.showFollowsTrigger} onClick={() => setFollowsVisible({ visible: true })}>
            {getIn18Text('DONGTAI')}
          </div>
        )}
        <FoldCard
          className={style.follows}
          title={<span style={{ marginLeft: -4 }}>{getIn18Text('GENJINDONGTAI')}</span>}
          options={
            <div className={style.hideFollowsTrigger} onClick={() => setFollowsVisible({ visible: false })}>
              {getIn18Text('SHOUQI')}
            </div>
          }
        >
          <Follows
            id={opportunityId}
            ref={followsRef}
            type="business"
            visible={followsVisible.visible}
            options={followsVisible.options}
            readonly={!hasEditPermission}
            onSave={() => {
              setShouldUpdate(true);
              fetchOpportunityDetail(opportunityId);
              tabKey === 'schedule' && setSchedulesParams({ ...schedulesParams, ...defaultPagination });
            }}
          />
        </FoldCard>
      </div>
      <BackTop target={() => bodyRef.current as HTMLElement} visibilityHeight={500}>
        <Tooltip title={getIn18Text('HUIDAODINGBU')} placement="bottomRight">
          <div className={style.backTopIcon} />
        </Tooltip>
      </BackTop>
    </Drawer>
  );
};
export default OpportunityDetail;
