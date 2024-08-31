import React, { useState, useRef, useEffect } from 'react';
import classnames from 'classnames';
import {
  apis,
  apiHolder,
  MailApi,
  CustomerApi,
  ClueDetail as ClueDetailType,
  ContactDetail,
  CustomerSchedule as CustomerScheduleType,
  CustomerOperateHistoryItem,
  CustomerOperateDetailRes,
  clueRecordRes,
  ResDocumentList,
  CustomerEmailListCondition,
  anonymousFunction,
} from 'api';
import { Button, Dropdown, Menu, Tooltip, BackTop, Popover, Pagination } from 'antd';
import CaretDownFilled from '@ant-design/icons/CaretDownFilled';
import moment from 'moment';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import useEventListener from '@web-common/hooks/useEventListener';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import Tabs from '@/components/Layout/Customer/components/UI/Tabs/tabs';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import FoldCard from '@/components/Layout/Customer/components/foldCard/foldCard';
import DetailHeader from '@/components/Layout/Customer/components/detailHeader/detailHeader';
import ContactPicker from '@/components/Layout/Customer/components/contactPicker/contactPicker';
import ContactEmails, { readEmail } from '@/components/Layout/Customer/components/contactEmails/contactEmails';
import Schedules from '@/components/Layout/Customer/components/schedules/schedules';
import OperateHistory from '@/components/Layout/Customer/components/operateHistory/operateHistory';
import OperatePreview from '@/components/Layout/Customer/components/operatePreview/operatePreview';
import EditSchedule from '@/components/Layout/Customer/components/editSchedule/editSchedule';
import Contacts from '@/components/Layout/Customer/components/contacts/contacts';
import ContactModal from '@/components/Layout/Customer/components/contactModal/contactModal';
import BaseInfo from './components/baseInfo';
import clueLogo from '@/images/icons/customerDetail/clue-logo.png';
import NewClueModal from '../CreateNewClueModal/createNewClueModal';
import ClientBusinessModal from '../CreateClinetBusinessModal/createClientBussinessModal';
import { Follows } from '../../../components/moments/follows';
import { clueDataTracker } from '../../../tracker/clueDataTracker';
import style from './clueDetail.module.scss';
import ReturnReason from '@/components/Layout/Customer/components/ReturnReasonModal/returnReasonModal';
import CloseRecord from '../CloseRecord/closeRecord';
import ChangeClueStatusModal from '../ChangeStatusModal/changeStatusModal';
import { DocumentList, DocumentListFilter } from '../../../components/documentList/documentList';
import ShiftManager from '@/components/Layout/Customer/components/ShiftModal/shiftManager';
import ShowConfirm from '../../../components/confirm/makeSureConfirm';
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
interface SelectItem {
  id: string;
  name: string;
}
const { Option } = Select;
const { TabPane } = Tabs;
export const CLUE_STATUS = [
  { id: '1', name: getIn18Text('WEICHULI') },
  { id: '2', name: getIn18Text('WUXIAO') },
  { id: '3', name: getIn18Text('GENJINZHONG') },
  { id: '4', name: getIn18Text('ZHUANKEHU') },
  { id: '5', name: getIn18Text('GUANBI') },
];
const CONVERT_TO_CUSTOMER_STATUS = '4';
const CONVERT_TO_CLOSE_STATUS = '5';
const headerOptions = [
  { key: 'schedule', text: getIn18Text('XINJIANRICHENG') },
  { key: 'follows', text: getIn18Text('XINJIANGENJIN') },
  { key: 'convertToCustomer', text: getIn18Text('ZHUANKEHU') },
  { key: 'backToSea', text: getIn18Text('TUIHUIGONGHAI') },
  { key: 'shift', text: getIn18Text('ZHUANYI') },
];
const tabs: TabConfig[] = [
  { key: 'email', text: getIn18Text('WANGLAIYOUJIAN'), trackerName: 'clickEmailTab' },
  { key: 'schedule', text: getIn18Text('RICHENGTIXING'), trackerName: 'clickScheduleTab' },
  { key: 'document', text: getIn18Text('WENJIAN'), trackerName: 'clickDocumentTab' },
  { key: 'operate', text: getIn18Text('CAOZUOLISHI'), trackerName: 'clickOperaHistoryTab' },
];
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
interface ClueDetailProps {
  visible: boolean;
  clueId: string;
  prevDisabled: boolean;
  nextDisabled: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: (shouldUpdate: boolean) => void;
  onWriteMail?: () => void;
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
  clueId: string | null;
}
interface EmailsParamsType extends ParamsType {
  fromEmail?: string;
  toEmail?: string;
  startDate?: string;
  endDate?: string;
  labels?: string[];
}
const ClueDetail: React.FC<ClueDetailProps> = props => {
  const { visible, clueId, prevDisabled, nextDisabled, onPrev, onNext, onClose, onWriteMail, children } = props;
  const [detail, setDetail] = useState<ClueDetailType>({} as ClueDetailType);
  const [clueDisabled, setClueDisabled] = useState<boolean>(false);
  const [tabKey, setTabKey] = useState<string>(tabs[0]?.key);
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [statusSelectOpen, setStatusSelectOpen] = useState<boolean>(false);
  const [followsVisible, setFollowsVisible] = useState<FollowsVisible>({ visible: true });
  const [infoFolded, setInfoFolded] = useState<boolean>(false);
  const [clueEditVisible, setClueEditVisible] = useState<boolean>(false);
  const [contactPickerVisible, setContactPickerVisible] = useState<boolean>(false);
  const [converSubmitVisible, setConvertSubmitVisible] = useState<boolean>(false);
  const [createOpportunity, setCreateOpportunity] = useState<boolean>(false);
  const [contacts, setContacts] = useState<ContactDetail[]>([]);
  const [contactsFolded, setContactsFolded] = useState<boolean>(true);
  const [contactActiveId, setContactActiveId] = useState<string | null>(null);
  const [contactEditVisible, setContactEditVisible] = useState<boolean>(false);
  const [emailsParams, setEmailsParams] = useState<EmailsParamsType>({
    clueId: null,
    ...defaultPagination,
  });
  const [schedules, setSchedules] = useState<CustomerScheduleType[]>([]);
  const [schedulesTotal, setSchedulesTotal] = useState<number>(0);
  const [scheduleActiveId, setScheduleActiveId] = useState<number | null>(null);
  const [scheduleEditVisible, setScheduleEditVisible] = useState<boolean>(false);
  const [schedulesParams, setSchedulesParams] = useState<ParamsType>({
    clueId: null,
    ...defaultPagination,
  });
  const [operates, setOperates] = useState<CustomerOperateHistoryItem[]>([]);
  const [operatesTotal, setOperatesTotal] = useState<number>(0);
  const [operateDetail, setOperateDetail] = useState<CustomerOperateDetailRes | null>(null);
  const [operateDetailVisible, setOperateDetailVisible] = useState<boolean>(false);
  const [operatesParams, setOperatesParams] = useState<ParamsType>({
    clueId: null,
    ...defaultPagination,
  });
  const [documentList, setDocumentList] = useState<ResDocumentList>();
  const [documentParams, setDocumentParams] = useState<DocumentListFilter>({
    page: 1,
    page_size: defaultPagination.pageSize,
  });
  const hasEditPermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CHANNEL', 'OP'));
  const hasDeletePermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CHANNEL', 'DELETE'));
  const [reasonVisible, setReasonVisible] = useState<boolean>(false);
  const [closeRecordList, setCloseRecordList] = useState<clueRecordRes | null>(null);
  const [closeReasonVisable, setCloseReasonVisable] = useState<boolean>(false);
  const [shiftVisible, setShiftVisible] = useState<boolean>(false);
  const [selectedRowItems, setSelectedRowItems] = useState<Array<SelectItem>>([]);
  const [contactCurrentPage, setContactCurrentPage] = useState<number>(1);
  const [contactCurrentTotal, setContactCurrentTotal] = useState<number>(0);
  const [contactSearchParam, setContactSearchParam] = useState<Record<string, string>>();
  // set header shadow & back-top on body scroll
  const [scrollTop, setScrollTop] = useState<number>(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const onBodyScroll = event => setScrollTop(event.target.scrollTop);
  const followsRef = useRef<any>(null);
  // notify parent container whether should update data
  const [shouldUpdate, setShouldUpdate] = useState<boolean>(false);
  const fetchClueDetail = id => {
    customerApi.getClueDetail({ id }).then(data => {
      if (data) {
        const { contact_list, ...rest } = data;
        setDetail(rest as ClueDetailType);
      } else {
        Toast.error({ content: getIn18Text('WEICHAXUNDAOXIANSUOXIANGQING') });
      }
    });
  };
  const fetchCloseRecord = (id: string) => {
    customerApi.clueCloseRecordList(id).then(res => {
      setCloseRecordList(res as any);
    });
  };
  useEventListener('scroll', onBodyScroll, bodyRef.current);
  useEffect(() => {
    if (visible && clueId) {
      fetchClueDetail(clueId);
      // fetchEmailsContacts(clueId);
      fetchCloseRecord(clueId);
      // fetchEmailTags(clueId);
      setSchedulesParams({ clueId, ...defaultPagination });
      // setEmailsParams({ clueId, ...defaultPagination });
      setOperatesParams({ clueId, ...defaultPagination });
    } else {
      setSchedulesParams({ clueId: null, ...defaultPagination });
      // setEmailsParams({ clueId: null, ...defaultPagination });
      setOperatesParams({ clueId: null, ...defaultPagination });
    }
    setDocumentParams({ page: 1, page_size: defaultPagination.pageSize });
    setContactSearchParam(undefined);
  }, [visible, clueId]);
  useEffect(() => {
    setClueDisabled(String(detail.status) === String(CONVERT_TO_CUSTOMER_STATUS));
  }, [detail.status]);
  useEffect(() => {
    followsVisible.visible && bodyRef.current?.scrollTo(0, 0);
  }, [followsVisible.visible]);
  useEffect(() => {
    if (visible && tabKey === 'schedule' && schedulesParams.clueId) {
      const { current: page, pageSize: page_size, clueId: clue_id, ...restParams } = schedulesParams;
      customerApi
        .getCustomerScheduleList({
          clue_id,
          page,
          page_size,
          ...restParams,
        })
        .then(data => {
          setSchedules(data.item_list);
          setSchedulesTotal(data.total_size);
        });
    }
  }, [visible, tabKey, schedulesParams]);
  useEffect(() => {
    if (visible && tabKey === 'operate' && operatesParams.clueId) {
      const { current: page, pageSize: page_size, clueId: clue_id } = operatesParams;
      customerApi
        .getCustomerOperateHistory({
          page,
          page_size,
          clue_id,
          condition: 'clue',
          ...operatesParams,
        })
        .then(data => {
          setOperates(data?.item_list || []);
          setOperatesTotal(data?.total_size || 0);
        });
    }
  }, [visible, tabKey, operatesParams]);
  const fetchContactsList = () => {
    const params = {
      condition: 'clue',
      clue_id: clueId,
      page: contactCurrentPage,
      page_size: 20,
      contact_search_key: contactSearchParam,
    };
    customerApi.contactListPageById(params as any).then(res => {
      setContacts(res?.content || []);
      setContactCurrentTotal(res.total_size);
    });
  };
  useEffect(() => {
    if (clueId && visible) {
      fetchContactsList();
    }
  }, [clueId, visible, contactCurrentPage, contactSearchParam]);
  const isCreateBussiness = () => {
    const content = getIn18Text('QUEDINGJIANGXIANSUOZHUANWEIKEHUBINGCHUANGJIANSHANGJI\uFF1F');
    ShowConfirm({
      content,
      okText: getIn18Text('QUEDING'),
      cancelText: getIn18Text('JINZHUANWEIKEHU'),
      makeSure: () => {
        setConvertSubmitVisible(true);
        setCreateOpportunity(true);
      },
      onCancel: () => {
        // 删除按钮
        setConvertSubmitVisible(true);
        setCreateOpportunity(false);
      },
    });
  };
  const handleClickMenu = event => {
    if (event.key === 'schedule') {
      setTabKey('schedule');
      setScheduleEditVisible(true);
      clueDataTracker.trackClueDetailTopbar('AddSchedule');
    }
    if (event.key === 'follows') {
      setFollowsVisible({
        visible: true,
        options: { autoOpen: true },
      });
      clueDataTracker.trackClueDetailTopbar('AddFollowup');
    }
    if (event.key === 'convertToCustomer') {
      isCreateBussiness();
      clueDataTracker.trackClueDetailTopbar('transfer');
    }
    if (event.key === 'backToSea') {
      setReasonVisible(true);
    }
    if (event.key === 'shift' && clueId) {
      setShiftVisible(true);
      setSelectedRowItems([
        {
          id: clueId,
          name: detail.name,
        },
      ]);
      clueDataTracker.trackClueDetailTopbar('transferLeads');
    }
  };
  const handlePickContact = () => {
    clueDataTracker.trackClueDetailTopbar('email');
    if (!contacts.length) return Toast.info({ content: getIn18Text('ZANWULIANXIREN') });
    if (contacts.length === 1) return handleWriteMail([contacts[0].email]);
    setContactPickerVisible(true);
  };
  const handleTabTracker = key => {
    const target = tabs.find(item => item.key === key) as TabConfig;
    clueDataTracker.trackClueDetailTab(target.trackerName);
  };
  const handleClueStatusChange = value => {
    if (String(value) === String(CONVERT_TO_CLOSE_STATUS)) {
      setCloseReasonVisable(true);
    } else if (String(value) === String(CONVERT_TO_CUSTOMER_STATUS)) {
      isCreateBussiness();
    } else {
      customerApi.editClueStatus({ ids: [clueId], status: value }).then(success => {
        if (success) {
          setDetail({ ...detail, status: value });
          setShouldUpdate(true);
          tabKey === 'operate' && setOperatesParams({ ...operatesParams, ...defaultPagination });
          Toast.success({ content: getIn18Text('XIANSUOZHUANGTAIYIGENGGAI') });
        } else {
          Toast.error({ content: getIn18Text('XIANSUOZHUANGTAIXIUGAISHIBAI') });
        }
      });
      setShouldUpdate(true);
    }
  };
  const handleWriteMail = emailIds => {
    mailApi.doWriteMailToContact(emailIds);
    onWriteMail && onWriteMail();
  };
  const handleEditContact = contactId => {
    setContactActiveId(contactId);
    setContactEditVisible(true);
    clueDataTracker.trackClueDetailContact('EditContact');
  };
  const handleDeleteContact = (constactId: string) => {
    ShowConfirm({ title: getIn18Text('QUERENSHANCHULIANXIRENMA\uFF1F'), type: 'danger', makeSure: () => makeSure(constactId) });
  };
  const makeSure = (contactId: string) => {
    customerApi
      .deleteClueContact({
        clue_id: clueId,
        contact_id: contactId,
        condition: 'clue',
      })
      .then(() => {
        Toast.success({
          content: getIn18Text('SHANCHUCHENGGONG'),
        });
        fetchContactsList();
        setShouldUpdate(true);
      });
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
        .createCustomerSchedule({ ...data, clue_id: clueId })
        .then(() => {
          followsRef.current.refresh();
        })
        .finally(() => {
          setScheduleActiveId(null);
          setScheduleEditVisible(false);
          setSchedulesParams({ ...schedulesParams, ...defaultPagination });
          setShouldUpdate(true);
        });
      clueDataTracker.trackClueDetailScheduleSubmit('AddSaveSchedule', data.start, moment().format('YYYY-MM-DD HH:mm:ss'));
    } else {
      customerApi
        .updateCustomerSchedule({
          ...data,
          clue_id: clueId,
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
      clueDataTracker.trackClueDetailScheduleSubmit('EditSaveSchedule', data.start, moment().format('YYYY-MM-DD HH:mm:ss'));
    }
  };
  const handleDeleteSchedule = (schedule_id: number) => {
    Modal.confirm({
      title: getIn18Text('QUEDINGSHANCHURICHENG'),
      content: null,
      okText: getIn18Text('SHANCHU'),
      okButtonProps: { type: 'default', danger: true },
      onOk: () => {
        customerApi.deleteCustomerSchedule({ schedule_id, condition: 'clue' }).then(() => {
          setSchedulesParams({ ...schedulesParams });
        });
      },
    });
    const { schedule_time } = schedules.find(item => item.schedule_id === schedule_id) || {};
    clueDataTracker.trackClueDetailSchedule('DeleteSchedule', schedule_time as string, moment().format('YYYY-MM-DD HH:mm:ss'));
  };
  useEffect(() => {
    if (visible && tabKey === 'document' && clueId) {
      customerApi
        .getDocumentList({
          condition: 'clue',
          condition_id: clueId as string,
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
  const handleFetchOperateDetail = id => {
    setOperateDetailVisible(true);
    customerApi
      .getCustomerOperateDetail({
        condition: 'clue',
        clue_id: clueId,
        history_id: id,
      })
      .then(data => {
        setOperateDetail(data);
      });
    clueDataTracker.trackClueDetailOperateOption('DiffContentClickNum');
  };
  // 退回公海回调
  const returnReasonHandler = (params?: boolean) => {
    if (params === true) {
      onClose(true);
    }
    setReasonVisible(false);
  };
  // 关闭操作
  const closeReasonHandler = (params?: boolean) => {
    setCloseReasonVisable(false);
    if (params === true) {
      fetchClueDetail(clueId);
      fetchCloseRecord(clueId);
      setShouldUpdate(true);
    }
  };
  const readEmailDetail = ({ snapshot_id }: { snapshot_id: string }) => {
    const params = {
      condition: 'clue',
      clue_id: clueId,
      mailSnapshotId: snapshot_id,
    };
    readEmail(params);
  };
  const closeShiftModal = (isUpdate?: boolean) => {
    setShiftVisible(false);
    if (isUpdate === true) {
      onClose(true);
    }
  };
  return (
    <Drawer className={style.clueDetail} visible={visible} onClose={() => onClose(shouldUpdate)}>
      <DetailHeader
        className={classnames(style.header, { [style.shadow]: scrollTop > 0 })}
        defaultLogo={clueLogo}
        title={detail.name}
        titleId={detail.number}
        content={
          <div className={style.clueStatus}>
            <span className={style.clueStatusLabel}>{getIn18Text('XIANSUOZHUANGTAI\uFF1A')}</span>
            {!statusUpdating ? (
              <span
                className={classnames(style.clueStatusText, {
                  [style.disabled]: clueDisabled || !hasEditPermission,
                })}
                onClick={() => {
                  if (!clueDisabled && hasEditPermission) {
                    setStatusUpdating(true);
                    setStatusSelectOpen(true);
                  }
                }}
              >
                {CLUE_STATUS.find(item => String(item.id) === String(detail.status))?.name}
              </span>
            ) : (
              <Select
                style={{ width: 120 }}
                placeholder={getIn18Text('XIANSUOZHUANGTAI')}
                value={String(detail.status)}
                open={statusSelectOpen}
                onDropdownVisibleChange={open => {
                  setStatusSelectOpen(open);
                  // why setTimeout: keep select transition
                  const timer = setTimeout(() => {
                    !open && setStatusUpdating(false);
                    clearTimeout(timer);
                  }, 300);
                }}
                onChange={handleClueStatusChange}
              >
                {CLUE_STATUS.map(item => (
                  <Option value={item.id} key={item.id}>
                    {item.name}
                  </Option>
                ))}
              </Select>
            )}
            {String(detail.status) === String(CONVERT_TO_CLOSE_STATUS) && (
              <span style={{ display: 'flex' }} onClick={event => event.stopPropagation()}>
                <Popover title={getIn18Text('GUANBIJILU')} content={<CloseRecord data={closeRecordList} />} placement="bottomRight" overlayClassName={style.recordTable}>
                  <span className={style.reopen} />
                </Popover>
              </span>
            )}
          </div>
        }
        options={
          !clueDisabled && hasEditPermission ? (
            <div className={style.options}>
              <Button
                onClick={() => {
                  setClueEditVisible(true);
                  clueDataTracker.trackClueDetailTopbar('edit');
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
          ) : null
        }
        prevDisabled={prevDisabled}
        nextDisabled={nextDisabled}
        onPrev={() => {
          onPrev && onPrev();
          clueDataTracker.trackClueDetailTopbar('next');
        }}
        onNext={() => {
          onNext && onNext();
          clueDataTracker.trackClueDetailTopbar('next');
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
        className={classnames(style.body, {
          [style.showFollows]: followsVisible.visible,
        })}
        ref={bodyRef}
      >
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
          title={`${getIn18Text('LIANXIREN')}(${contactCurrentTotal})`}
          folded={contactsFolded}
          foldHeight={followsVisible.visible ? 250 + 48 : 250 + 48}
          onFoldChange={nextFolded => {
            setContactsFolded(nextFolded);
            !nextFolded && clueDataTracker.trackClueDetailContact('Unfold');
          }}
          options={
            !clueDisabled &&
            hasEditPermission && (
              <span
                className={style.createContact}
                onClick={() => {
                  setContactEditVisible(true);
                  clueDataTracker.trackClueDetailContact('AddContact');
                }}
              >
                {getIn18Text('XINZENG')}
              </span>
            )
          }
        >
          <>
            <div className="sirius-scroll" style={{ overflowY: contactsFolded ? 'scroll' : 'visible', maxHeight: contactsFolded ? 250 : 'none' }}>
              <SearchContact onSearch={setContactSearchParam} searchParams={contactSearchParam} />
              <Contacts
                list={contacts}
                mode={contactsFolded ? 'simple' : 'complete'}
                hiddenFields={['label_list', 'job', 'home_page', 'gender', 'birthday', 'pictures']}
                completeHeight={250}
                options={!clueDisabled && hasEditPermission ? ['mail', 'edit', 'delete'] : []}
                onWriteMail={email => {
                  handleWriteMail([email]);
                  clueDataTracker.trackClueDetailContact('EmailContact');
                }}
                onEdit={handleEditContact}
                onDelete={handleDeleteContact}
              />
            </div>
            {contactCurrentTotal ? (
              <div className={style.contactsPagination}>
                <Pagination
                  size="small"
                  className="pagination-wrap"
                  pageSize={20}
                  onChange={page => {
                    setContactCurrentPage(page);
                  }}
                  current={contactCurrentPage}
                  defaultCurrent={1}
                  total={contactCurrentTotal}
                />
              </div>
            ) : (
              ''
            )}
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
                  mainResourceId={clueId}
                  condition={CustomerEmailListCondition.Clue}
                />
              </div>
            </div>
          )}
          {tabKey === 'schedule' && (
            <div className={style.schedules}>
              <Schedules
                data={schedules}
                pagination={{ ...schedulesParams, total: schedulesTotal }}
                canEdit={!clueDisabled && hasEditPermission}
                canDelete={!clueDisabled && hasDeletePermission}
                onChange={handleSchedulesChange}
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
              type="clue"
              sourceId={clueId as string}
              data={documentList}
              onFilterChange={handleDocumentFilterChange}
              dataTracker={clueDataTracker}
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
                onOperateNameClick={() => clueDataTracker.trackClueDetailOperateOption('ViewOperator')}
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
        {reasonVisible && <ReturnReason visible={reasonVisible} ids={[clueId]} onCancel={returnReasonHandler} />}
        {closeReasonVisable && <ChangeClueStatusModal visible={closeReasonVisable} ids={[clueId]} statusCode={CONVERT_TO_CLOSE_STATUS} onCancel={closeReasonHandler} />}
        {clueEditVisible && (
          <NewClueModal
            id={clueId}
            width={408}
            visible={clueEditVisible}
            pageType="edit"
            isContact={false}
            onCancel={() => {
              setClueEditVisible(false);
              setShouldUpdate(true);
              fetchClueDetail(clueId);
              fetchContactsList();
              tabKey === 'operate' && setOperatesParams({ ...operatesParams, ...defaultPagination });
            }}
          />
        )}
        {contactEditVisible && (
          <ContactModal
            width={408}
            visible={contactEditVisible}
            pageType={contactActiveId ? 'edit' : 'new'}
            condition="clue"
            name={detail.name}
            id={clueId}
            contactId={contactActiveId as string}
            onCancel={success => {
              if (success) {
                fetchClueDetail(clueId);
                fetchContactsList();
              }
              setContactActiveId(null);
              setContactEditVisible(false);
              setShouldUpdate(true);
              tabKey === 'operate' && setOperatesParams({ ...operatesParams, ...defaultPagination });
            }}
          />
        )}
        {converSubmitVisible && (
          <ClientBusinessModal
            width={768}
            clueId={detail.id}
            isBusiness={createOpportunity}
            visible={converSubmitVisible}
            onCancel={() => {
              setConvertSubmitVisible(false);
              setCreateOpportunity(false);
              fetchClueDetail(clueId);
              setShouldUpdate(true);
            }}
          />
        )}
        {shiftVisible && <ShiftManager visible={shiftVisible} data={selectedRowItems} modalType="clue" shiftType="shift" onCancel={closeShiftModal} />}
        <EditSchedule
          visible={scheduleEditVisible}
          title={scheduleActiveId ? getIn18Text('BIANJIRICHENG') : getIn18Text('XINJIANRICHENG')}
          data={schedules.find(item => item.schedule_id === scheduleActiveId) || null}
          onOpen={schedule_time => {
            clueDataTracker.trackClueDetailSchedule(scheduleActiveId ? 'EditSchedule' : 'AddSchedule', schedule_time, moment().format('YYYY-MM-DD HH:mm:ss'));
          }}
          onSubmit={handleScheduleSubmit}
          onCancel={() => {
            setScheduleActiveId(null);
            setScheduleEditVisible(false);
          }}
        />
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
            id={clueId}
            ref={followsRef}
            type="clue"
            visible={followsVisible.visible}
            options={followsVisible.options}
            disabled={clueDisabled}
            readonly={!hasEditPermission}
            onSave={() => {
              setShouldUpdate(true);
              fetchClueDetail(clueId);
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
export default ClueDetail;
