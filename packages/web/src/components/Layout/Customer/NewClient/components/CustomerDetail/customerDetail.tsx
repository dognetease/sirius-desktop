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
  CustomerSchedule as CustomerScheduleType,
  CustomerOperateHistoryItem,
  CustomerOperateDetailRes,
  ContactEmailItem,
  EmailsContactItem,
  OpportunityDetail as OpportunityDetailType,
  ResDocumentList,
  EdmCustomsApi,
  reqBuyers as reqBuyersType,
  customsRecordItem as customsTableType,
  CustomerEmailListCondition,
  anonymousFunction,
} from 'api';
import moment from 'moment';
import { Button, Dropdown, Menu, Tabs, Tooltip, BackTop, Pagination } from 'antd';
import CaretDownFilled from '@ant-design/icons/CaretDownFilled';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import useEventListener from '@web-common/hooks/useEventListener';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import DetailHeader from '@/components/Layout/Customer/components/detailHeader/detailHeader';
import EllipsisLabels from '@/components/Layout/Customer/components/ellipsisLabels/ellipsisLabels';
import * as defaultLogo from '@/images/icons/customerDetail/default-logo.png';
import ContactPicker from '@/components/Layout/Customer/components/contactPicker/contactPicker';
import ContactEmails, { readEmail } from '@/components/Layout/Customer/components/contactEmails/contactEmails';
import OperateHistory from '@/components/Layout/Customer/components/operateHistory/operateHistory';
import Schedules from '@/components/Layout/Customer/components/schedules/schedules';
import EditSchedule, { ScheduleSubmitData } from '@/components/Layout/Customer/components/editSchedule/editSchedule';
import FoldCard from '@/components/Layout/Customer/components/foldCard/foldCard';
import Contacts from '@/components/Layout/Customer/components/contacts/contacts';
import OperatePreview from '@/components/Layout/Customer/components/operatePreview/operatePreview';
import CreateNewClientModal from '../CreateNewClientModal/createNewClientModal';
import ContactModal from '@/components/Layout/Customer/components/contactModal/contactModal';
import BaseInfo from './components/baseInfo';
import ForwardPicker, { PickedItem } from './components/forwardPicker';
import Opportunities from './components/opportunities';
import ClientBusinessModal from '../../../Business/components/CreateNewBusinessModal/createNewBussinessModal';
import { Follows } from '../../../components/moments/follows';
import { customerDataTracker } from '../../../tracker/customerDataTracker';
import style from './customerDetail.module.scss';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { DocumentList, DocumentListFilter } from '../../../components/documentList/documentList';
import { CustomsList } from '../../../components/customsList/customsList';
import LevelDrawer from '@/components/Layout/CustomsData/components/levelDrawer/levelDrawer';
import CustomsDetail from '@/components/Layout/CustomsData/customs/customsDetail/customsDetail';
import ShiftManager from '@/components/Layout/Customer/components/ShiftModal/shiftManager';
import { onDrawerClose, onDrawerOpen } from '@/components/Layout/CustomsData/utils';
import { SearchContact } from '../../../components/contacts/searchContact';
import { EmailList } from '../../../components/emailList';
import ReturnReason from '@/components/Layout/Customer/components/ReturnReasonModal/returnReasonModal';
import ShowConfirm from '../../../components/confirm/makeSureConfirm';
import { MessageHistory } from '@/components/Layout/SNS/WhatsApp/components/messageHistory';
import { getIn18Text } from 'api';
interface CustomerDetailProps {
  visible: boolean;
  companyId?: string;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: (shouldUpdate: boolean) => void;
  // 通知父组件
  onWriteMail?: () => void;
}
const { TabPane } = Tabs;
const headerOptions = [
  { key: 'opportunity', text: getIn18Text('XINJIANSHANGJI') },
  { key: 'schedule', text: getIn18Text('XINJIANRICHENG') },
  { key: 'follows', text: getIn18Text('XINJIANGENJIN') },
  { key: 'forward', text: getIn18Text('ZHUANFADAOXIAOXI') },
  { key: 'addManager', text: getIn18Text('TIANJIAFUZEREN') },
  { key: 'shift', text: getIn18Text('ZHUANYI') },
  { key: 'returnOpenSea', text: getIn18Text('TUIHUIGONGHAI') },
];
type TabConfig = {
  key: string;
  text: string;
  trackerName: string;
};
const tabs: TabConfig[] = [
  { key: 'email', text: getIn18Text('WANGLAIYOUJIAN'), trackerName: 'clickEmailTab' },
  { key: 'schedule', text: getIn18Text('RICHENGTIXING'), trackerName: 'clickScheduleTab' },
  { key: 'document', text: getIn18Text('WENJIAN'), trackerName: 'clickDocumentTab' },
  { key: 'customs', text: getIn18Text('HAIGUANSHUJU'), trackerName: 'clickCustomsDataTab' },
  { key: 'chatHistory', text: '聊天记录', trackerName: 'clickChatHistory' },
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
  companyId: string | null;
}
interface EmailsParamsType extends ParamsType {
  fromEmail?: string;
  toEmail?: string;
  startDate?: string;
  endDate?: string;
  labels?: string[];
}
interface SelectItem {
  id: string;
  name: string;
}
interface recData {
  visible: boolean;
  zIndex: number;
  to: 'buysers' | 'supplier';
  content: {
    country: string;
    to: 'buysers' | 'supplier';
    companyName: string;
    tabOneValue?: string;
    queryValue?: string;
  };
  children?: recData;
}
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const CustomerDetail: React.FC<CustomerDetailProps> = props => {
  const { visible, companyId, prevDisabled, nextDisabled, onPrev, onNext, onClose, onWriteMail, children } = props;
  const [detail, setDetail] = useState<CustomerDetailType>({} as CustomerDetailType);
  const [customerEditVisible, setCustomerEditVisible] = useState<boolean>(false);
  const [contacts, setContacts] = useState<ContactDetail[]>([]);
  const [contactFolded, setContactFolded] = useState(true);
  const [contactEditVisible, setContactEditVisible] = useState<boolean>(false);
  const [contactActiveId, setContactActiveId] = useState<string | null>(null);
  const [contactPickerVisible, setContactPickerVisible] = useState<boolean>(false);
  const [fromContacts, setFromContacts] = useState<EmailsContactItem[]>([]);
  const [toContacts, setToContacts] = useState<EmailsContactItem[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityDetailType[]>([]);
  const [opportunityEditVisible, setOpportunityEditVisible] = useState<boolean>(false);
  const [opportunityActiveId, setOpportunityActiveId] = useState<string | null>(null);
  const [emailTags, setEmailTags] = useState<string[]>([]);
  const [contactCurrentPage, setContactCurrentPage] = useState<number>(1);
  const [contactCurrentTotal, setContactCurrentTotal] = useState<number>(0);
  const [contactSearchParam, setContactSearchParam] = useState<Record<string, string>>();
  const tabs2: TabConfig[] = [
    { key: 'contacts', text: `联系人(${contactCurrentTotal})`, trackerName: '' },
    { key: 'opportunities', text: `商机(${opportunities.length})`, trackerName: '' },
  ];
  const [tabKey2, setTabKey2] = useState<string>(tabs2[0].key);
  const [emails, setEmails] = useState<ContactEmailItem[]>([]);
  const [emailsTotal, setEmailsTotal] = useState<number>(0);
  const [emailsParams, setEmailsParams] = useState<EmailsParamsType>({
    companyId: null,
    ...defaultPagination,
  });
  const [schedules, setSchedules] = useState<CustomerScheduleType[]>([]);
  const [schedulesTotal, setSchedulesTotal] = useState<number>(0);
  const [scheduleActiveId, setScheduleActiveId] = useState<number | null>(null);
  const [scheduleEditVisible, setScheduleEditVisible] = useState<boolean>(false);
  const [schedulesParams, setSchedulesParams] = useState<ParamsType>({
    companyId: null,
    ...defaultPagination,
  });
  const [tabKey, setTabKey] = useState<string>(tabs[0].key);
  const [infoFolded, setInfoFolded] = useState<boolean>(false);
  const [followsVisible, setFollowsVisible] = useState<FollowsVisible>({ visible: true });
  const [forwardVisible, setForwardVisible] = useState<boolean>(false);
  const [operates, setOperates] = useState<CustomerOperateHistoryItem[]>([]);
  const [operatesTotal, setOperatesTotal] = useState<number>(0);
  const [operateDetail, setOperateDetail] = useState<CustomerOperateDetailRes | null>(null);
  const [operateDetailVisible, setOperateDetailVisible] = useState<boolean>(false);
  const [operatesParams, setOperatesParams] = useState<ParamsType>({
    companyId: null,
    ...defaultPagination,
  });
  const [documentList, setDocumentList] = useState<ResDocumentList>();
  const [documentParams, setDocumentParams] = useState<DocumentListFilter>({
    page: 1,
    page_size: defaultPagination.pageSize,
  });
  const [customsList, setCustomsList] = useState<customsTableType[]>([]);
  const [customsParams, setCustomsParams] = useState<reqBuyersType>({
    type: 'company',
    queryValue: '',
    from: 1,
    size: defaultPagination.pageSize,
  });
  const [customsPagination, setCustomsPagination] = useState<any>({
    total: 0,
    current: 1,
    customsTabKey: 'buysers',
  });
  const [customsTableLoading, setCustomsTableLoading] = useState<boolean>(false);
  const [recData, setRecData] = useState<recData>({
    visible: false,
    to: 'buysers',
    zIndex: 0,
    content: {
      country: '',
      to: 'buysers',
      companyName: '',
    },
  });
  const hasEditPermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CONTACT', 'OP'));
  const hasDeletePermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CONTACT', 'DELETE'));
  const hasCustomsViewPermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CUSTOMS', 'VIEW'));
  console.log('!hasCustomsViewPermission &&', hasCustomsViewPermission);
  const followsRef = useRef<any>(null);
  const [shouldUpdate, setShouldUpdate] = useState<boolean>(false);
  const [shiftVisible, setShiftVisible] = useState<boolean>(false);
  const [shiftType, setShiftType] = useState<'shift' | 'add'>('shift');
  const [selectedRowItems, setSelectedRowItems] = useState<Array<SelectItem>>([]);
  const [companyCanEdit, setCompanyCanEdit] = useState<boolean>(true);
  const [reasonVisible, setReasonVisible] = useState<boolean>(false);
  const [scrollTop, setScrollTop] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const onBodyScroll = (event: any) => setScrollTop(event.target.scrollTop);
  const fetchEmailsContacts = (id: string) => {
    customerApi
      .getEmailsContacts({
        company_id: id,
        condition: 'company',
      })
      .then(data => {
        setFromContacts(data.from_email_list);
        setToContacts(data.to_email_list);
      });
  };
  const fetchOpportunityList = (id: string) => {
    customerApi
      .opportunityListAll({
        company_id_list: [id],
        page: 1,
        page_size: 100,
        order_by: 'update_at',
        asc_flag: false,
      } as any)
      .then(data => {
        if (Array.isArray(data?.content)) {
          setOpportunities(data?.content as unknown as OpportunityDetailType[]);
        }
      });
  };
  const fetchEmailTags = (id: string) =>
    customerApi
      .getMailTagList({
        condition: 'company',
        company_id: id,
      })
      .then(res => {
        setEmailTags(res.map(i => i.name));
      });
  const fetchContactsList = () => {
    const params = {
      condition: 'company' as 'company' | 'clue' | 'opportunity' | 'open_sea',
      company_id: companyId,
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
      // fetchEmailsContacts(companyId);
      fetchOpportunityList(companyId);
      // fetchEmailTags(companyId)
      setSchedulesParams({ companyId, ...defaultPagination });
      setEmailsParams({ companyId, ...defaultPagination });
      setOperatesParams({ companyId, ...defaultPagination });
    } else {
      setSchedulesParams({ companyId: null, ...defaultPagination });
      setEmailsParams({ companyId: null, ...defaultPagination });
      setOperatesParams({ companyId: null, ...defaultPagination });
    }
    setDocumentParams({ page: 1, page_size: defaultPagination.pageSize });
    setContactSearchParam(undefined);
  }, [visible, companyId]);
  useEventListener('scroll', onBodyScroll, bodyRef.current);
  useEffect(() => {
    followsVisible.visible && bodyRef.current?.scrollTo(0, 0);
  }, [followsVisible.visible]);
  const fetchCustomerDetail = (id: string) => {
    const currentUser = apiHolder.api.getSystemApi().getCurrentUser();
    const config = { params: { sid: currentUser?.sessionId } };
    customerApi.getCustomerDetail({ company_id: id }, config).then(data => {
      if (data) {
        const { contact_list, ...rest } = data;
        setDetail(rest as CustomerDetailType);
        setCompanyCanEdit(rest.edit_flag === true);
      } else {
        Toast.error({ content: getIn18Text('WEICHAXUNDAOKEHUXIANGQING') });
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
  useEffect(() => {
    if (visible && tabKey === 'schedule' && schedulesParams.companyId) {
      const { current: page, pageSize: page_size, companyId: company_id, ...restParams } = schedulesParams;
      customerApi
        .getCustomerScheduleList({
          company_id,
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
  const handleDeleteLabel = (label_id: string) => {
    const { label_name } = detail.label_list.find(item => item.label_id === label_id) || {};
    customerApi
      .deleteCustomerLabels({
        company_id: companyId as string,
        label_name_list: [label_name as string],
      })
      .then(() => {
        Toast.success({ content: getIn18Text('BIAOQIANYISHANCHU') });
        fetchCustomerDetail(companyId as string);
      });
    setShouldUpdate(true);
    customerDataTracker.trackCustomerDetailTopbar('label');
  };
  const handleClickMenu = (event: any) => {
    if (event.key === 'opportunity') {
      setTabKey2('opportunities');
      setOpportunityEditVisible(true);
      customerDataTracker.trackCustomerDetailTopbar('AddBusiness');
    }
    if (event.key === 'schedule') {
      setTabKey('schedule');
      setScheduleEditVisible(true);
      customerDataTracker.trackCustomerDetailTopbar('AddSchedule');
    }
    if (event.key === 'follows') {
      setFollowsVisible({
        visible: true,
        options: { autoOpen: true },
      });
      customerDataTracker.trackCustomerDetailTopbar('AddFollowup');
    }
    if (event.key === 'forward') {
      setForwardVisible(true);
      customerDataTracker.trackCustomerDetailTopbar('Forward');
    }
    if (event.key === 'addManager' && companyId) {
      setShiftVisible(true);
      setShiftType('add');
      setSelectedRowItems([
        {
          id: companyId,
          name: detail.company_name,
        },
      ]);
      customerDataTracker.trackCustomerDetailTopbar('addResPeople');
    }
    if (event.key === 'shift' && companyId) {
      setShiftVisible(true);
      setShiftType('shift');
      setSelectedRowItems([
        {
          id: companyId,
          name: detail.company_name,
        },
      ]);
      customerDataTracker.trackCustomerDetailTopbar('transfer');
    }
    if (event.key === 'returnOpenSea' && companyId) {
      setReasonVisible(true);
    }
  };
  const closeShiftModal = (isUpdate?: boolean) => {
    setShiftVisible(false);
    if (isUpdate === true) {
      onClose(true);
    }
  };
  const handleTabTracker = (key: string) => {
    const target = tabs.find(item => item.key === key) as TabConfig;
    customerDataTracker.trackCustomerDetailTab(target.trackerName);
  };
  const handleTab2Click = (key: string) => {
    if (key === 'contacts') {
      fetchCustomerDetail(companyId as string);
    }
    if (key === 'opportunities') {
      fetchOpportunityList(companyId as string);
    }
  };
  const handlePickContact = () => {
    if (!contacts.length) return Toast.info({ content: getIn18Text('ZANWULIANXIREN') });
    if (contacts.length === 1) return handleWriteMail([contacts[0].email]);
    setContactPickerVisible(true);
    customerDataTracker.trackCustomerDetailTopbar('email');
  };
  const handleWriteMail = (contacts: string[]) => {
    mailApi.doWriteMailToContact(contacts);
    onWriteMail && onWriteMail();
    customerDataTracker.trackCustomerDetailContact('EmailContact');
  };
  const handleEditContact = (contactId: string) => {
    setContactActiveId(contactId);
    setContactEditVisible(true);
    customerDataTracker.trackCustomerDetailContact('EditContact');
  };
  const handleDeleteContact = (constactId: string) => {
    ShowConfirm({ title: getIn18Text('QUERENSHANCHULIANXIRENMA\uFF1F'), type: 'danger', makeSure: () => makeSure(constactId) });
  };
  const makeSure = (contactId: string) => {
    customerApi
      .deleteCustomerContact({
        company_id: companyId,
        contact_id: contactId,
        condition: 'company',
      })
      .then(() => {
        Toast.success({
          content: getIn18Text('SHANCHUCHENGGONG'),
        });
        fetchContactsList();
        setShouldUpdate(true);
      });
  };
  const handleForward = (picked: PickedItem[]) => {
    customerApi
      .forwardCustomer({
        company_id: companyId as unknown as number,
        account_list: picked,
      })
      .finally(() => {
        setForwardVisible(false);
      });
  };
  const handleDeleteSchedule = (schedule_id: number) => {
    Modal.confirm({
      className: style.scheduleDeleteConfirm,
      title: getIn18Text('QUEDINGSHANCHURICHENG'),
      content: '',
      okText: getIn18Text('SHANCHU'),
      okButtonProps: {
        type: 'default',
        danger: true,
      },
      onOk: () => {
        customerApi.deleteCustomerSchedule({ schedule_id, condition: 'company' }).then(() => {
          setSchedulesParams({ ...schedulesParams });
        });
      },
    });
    const { schedule_time } = schedules.find(item => item.schedule_id === schedule_id) || {};
    customerDataTracker.trackCustomerDetailSchedule('DeleteSchedule', schedule_time as string, moment().format('YYYY-MM-DD HH:mm:ss'));
  };
  useEffect(() => {
    if (visible && tabKey === 'document' && companyId) {
      customerApi
        .getDocumentList({
          condition: 'company',
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
    if (visible && tabKey === 'customs' && detail.company_name && customsPagination.customsTabKey === 'buysers') {
      featchBuyserTable();
    }
    if (visible && tabKey === 'customs' && detail.company_name && customsPagination.customsTabKey === 'suppliers') {
      featchSppliersTable();
    }
  }, [visible, tabKey, customsParams, detail.company_name, customsPagination.customsTabKey]);
  const featchBuyserTable = () => {
    const params = {
      ...customsParams,
      queryValue: detail.company_name,
      from: customsParams.from - 1,
      groupByCountry: true,
    };
    setCustomsTableLoading(true);
    edmCustomsApi.buyersList(params).then(res => {
      const { records, total } = res;
      setCustomsList(records);
      setCustomsPagination({
        ...customsPagination,
        total,
      });
      setCustomsTableLoading(false);
    });
  };
  const featchSppliersTable = () => {
    const params = {
      ...customsParams,
      queryValue: detail.company_name,
      from: customsParams.from - 1,
      groupByCountry: true,
    };
    setCustomsTableLoading(true);
    edmCustomsApi.suppliersList(params).then(res => {
      const { records, total } = res;
      setCustomsList(records);
      setCustomsPagination({
        ...customsPagination,
        total,
      });
      setCustomsTableLoading(false);
    });
  };
  const handleCustomsDetail = (companyName: string, country: string) => {
    const data = onDrawerOpen(recData, { to: customsPagination.customsTabKey, companyName, country }, 0);
    setRecData({ ...data });
  };
  const onDrawerOpenBefore = (content: unknown, zindex: number) => {
    const data = onDrawerOpen(recData, { ...content }, zindex);
    setRecData({ ...data });
  };
  const onCustomerDrawerClose = (index: number) => {
    const data = onDrawerClose(recData, index);
    setRecData({ ...data });
  };
  useEffect(() => {
    if (visible && tabKey === 'operate' && operatesParams.companyId) {
      const { current: page, pageSize: page_size, companyId: company_id } = operatesParams;
      customerApi
        .getCustomerOperateHistory({
          page,
          page_size,
          company_id,
          condition: 'company',
          ...operatesParams,
        })
        .then(data => {
          setOperates(data?.item_list || []);
          setOperatesTotal(data?.total_size || 0);
        });
    }
  }, [visible, tabKey, operatesParams]);
  const handleEmailsChange = (page: number, pageSize: number) => {
    setEmailsParams(previous => ({
      ...emailsParams,
      current: pageSize === previous.pageSize ? page : 1,
      pageSize,
    }));
  };
  const handleSchedulesChange = (params: ParamsType) => {
    const { current, pageSize } = params;
    setSchedulesParams(previous => ({
      ...schedulesParams,
      current: pageSize === previous.pageSize ? current : 1,
      pageSize,
    }));
  };
  const handleScheduleSubmit = (data: ScheduleSubmitData) => {
    if (!scheduleActiveId) {
      customerApi
        .createCustomerSchedule({ ...data, company_id: companyId })
        .then(() => {
          followsRef.current.refresh();
        })
        .finally(() => {
          setScheduleActiveId(null);
          setScheduleEditVisible(false);
          setSchedulesParams({ ...schedulesParams, ...defaultPagination });
        });
      setShouldUpdate(true);
      customerDataTracker.trackCustomerDetailScheduleSubmit('AddSaveSchedule', data.start, moment().format('YYYY-MM-DD HH:mm:ss'));
    } else {
      customerApi
        .updateCustomerSchedule({
          ...data,
          company_id: companyId,
          schedule_id: scheduleActiveId,
        })
        .then(() => {
          followsRef.current.refresh();
        })
        .finally(() => {
          setScheduleActiveId(null);
          setScheduleEditVisible(false);
          setSchedulesParams({ ...schedulesParams });
        });
      setShouldUpdate(true);
      customerDataTracker.trackCustomerDetailScheduleSubmit('EditSaveSchedule', data.start, moment().format('YYYY-MM-DD HH:mm:ss'));
    }
  };
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
        condition: 'company',
        company_id: companyId,
        history_id: id,
      })
      .then(data => {
        setOperateDetail(data);
      });
    customerDataTracker.trackCustomerDetailLogTab('DiffContentClickNum');
  };
  const readEmailDetail = ({ snapshot_id }: { snapshot_id: string }) => {
    const params = {
      condition: 'company',
      company_id: companyId,
      mailSnapshotId: snapshot_id,
    };
    console.log('params-list', params);
    readEmail(params);
  };
  // 退回公海回调
  const returnReasonHandler = (params?: boolean) => {
    if (params === true) {
      onClose(true);
    }
    setReasonVisible(false);
  };
  console.log('customerDetail', visible, companyId);
  return (
    <Drawer className={style.customerDetail} visible={visible} onClose={() => onClose(shouldUpdate)}>
      <DetailHeader
        className={classnames(style.header, { [style.shadow]: scrollTop > 0 })}
        logo={detail.company_logo}
        defaultLogo={defaultLogo as unknown as string}
        title={detail.company_name}
        titleId={detail.company_number}
        content={<EllipsisLabels className={style.labels} list={detail.label_list} deletable={hasEditPermission} onDeleteLabel={handleDeleteLabel} />}
        options={
          companyCanEdit && (
            <PrivilegeCheck accessLabel="OP" resourceLabel="CONTACT">
              <div className={style.options}>
                <Button
                  onClick={() => {
                    setCustomerEditVisible(true);
                    customerDataTracker.trackCustomerDetailTopbar('edit');
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
          )
        }
        prevDisabled={prevDisabled}
        nextDisabled={nextDisabled}
        onPrev={() => {
          onPrev();
          customerDataTracker.trackCustomerDetailTopbar('next');
        }}
        onNext={() => {
          onNext();
          customerDataTracker.trackCustomerDetailTopbar('next');
        }}
      />
      {reasonVisible && <ReturnReason visible={reasonVisible} ids={[companyId as string]} isCustomer onCancel={returnReasonHandler} />}
      {customerEditVisible && (
        <CreateNewClientModal
          visible={customerEditVisible}
          pageType="edit"
          companyId={companyId}
          onCancel={success => {
            if (success) {
              fetchCustomerDetail(companyId as string);
              fetchContactsList();
            }
            setCustomerEditVisible(false);
            setShouldUpdate(true);
            tabKey === 'operate' && setOperatesParams({ ...operatesParams, ...defaultPagination });
          }}
        />
      )}
      {contactEditVisible && (
        <ContactModal
          width={408}
          visible={contactEditVisible}
          pageType={contactActiveId ? 'edit' : 'new'}
          condition="company"
          name={detail.company_name}
          id={companyId}
          contactId={contactActiveId as string}
          onCancel={success => {
            success && fetchContactsList();
            setContactActiveId(null);
            setContactEditVisible(false);
            setShouldUpdate(true);
            tabKey === 'operate' && setOperatesParams({ ...operatesParams, ...defaultPagination });
          }}
        />
      )}
      {opportunityEditVisible && (
        <ClientBusinessModal
          visible={opportunityEditVisible}
          width={768}
          id={opportunityActiveId || undefined}
          companyId={companyId as unknown as number}
          pageType={opportunityActiveId ? 'edit' : 'new'}
          onCancel={success => {
            success && fetchOpportunityList(companyId as string);
            setOpportunityEditVisible(false);
            setOpportunityActiveId(null);
          }}
        />
      )}
      {shiftVisible && <ShiftManager visible={shiftVisible} data={selectedRowItems} shiftType={shiftType} onCancel={closeShiftModal} />}
      <EditSchedule
        visible={scheduleEditVisible}
        title={scheduleActiveId ? getIn18Text('BIANJIRICHENG') : getIn18Text('XINJIANRICHENG')}
        data={schedules.find(item => item.schedule_id === scheduleActiveId) || null}
        onOpen={schedule_time => {
          customerDataTracker.trackCustomerDetailSchedule(scheduleActiveId ? 'EditSchedule' : 'AddSchedule', schedule_time, moment().format('YYYY-MM-DD HH:mm:ss'));
        }}
        onSubmit={handleScheduleSubmit}
        onCancel={() => {
          setScheduleActiveId(null);
          setScheduleEditVisible(false);
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
            <Tabs size="small" tabBarGutter={20} activeKey={tabKey2} onChange={setTabKey2} onTabClick={handleTab2Click}>
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
                customerDataTracker.trackCustomerDetailContact('Unfold');
              }
              if (tabKey2 === 'opportunities') {
                customerDataTracker.trackCustomerDetailBusiness('Unfold');
              }
            }
          }}
          options={
            companyCanEdit && (
              <PrivilegeCheck accessLabel="OP" resourceLabel="CONTACT">
                <span
                  className={style.createContact}
                  onClick={() => {
                    if (tabKey2 === 'contacts') {
                      setContactEditVisible(true);
                      customerDataTracker.trackCustomerDetailContact('AddContact');
                    }
                    if (tabKey2 === 'opportunities') {
                      setOpportunityEditVisible(true);
                      customerDataTracker.trackCustomerDetailBusiness('AddBusiness');
                    }
                  }}
                >
                  {getIn18Text('XINZENG')}
                </span>
              </PrivilegeCheck>
            )
          }
        >
          {tabKey2 === 'contacts' && (
            <>
              <div className="sirius-scroll" style={{ overflowY: contactFolded ? 'scroll' : 'visible', maxHeight: contactFolded ? 250 : 'none' }}>
                <SearchContact onSearch={setContactSearchParam} searchParams={contactSearchParam} />
                <Contacts
                  list={contacts}
                  mode={contactFolded ? 'simple' : 'complete'}
                  options={hasEditPermission && companyCanEdit ? ['mail', 'edit', 'delete'] : []}
                  onWriteMail={email => handleWriteMail([email])}
                  onEdit={handleEditContact}
                  onDelete={handleDeleteContact}
                />
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
          {tabKey2 === 'opportunities' && (
            <Opportunities
              list={opportunities}
              mode={contactFolded ? 'simple' : 'complete'}
              readonly={!hasEditPermission || !companyCanEdit}
              onEdit={opportunityId => {
                setOpportunityActiveId(opportunityId);
                setOpportunityEditVisible(true);
                customerDataTracker.trackCustomerDetailBusiness('EditBusiness');
              }}
            />
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
                  condition={CustomerEmailListCondition.Company}
                />
              </div>
              {/* <ContactEmails
fromEmail={emailsParams.fromEmail}
toEmail={emailsParams.toEmail}
fromContacts={fromContacts}
toContacts={toContacts}
startDate={emailsParams.startDate}
endDate={emailsParams.endDate}
list={emails}
labels={emailsParams.labels}
labelList={emailTags}
pagination={{ ...emailsParams, total: emailsTotal }}
onChange={handleEmailsChange}
onFilterChagne={payload => setEmailsParams({
...emailsParams,
...payload,
...defaultPagination,
})}
onTitleClick={() => {
customerDataTracker.trackCustomerDetailEmailTab('clickEmailTitle');
}}
onEmailClick={ readEmailDetail }
/> */}
            </div>
          )}
          {tabKey === 'schedule' && (
            <div className={style.schedules}>
              <Schedules
                data={schedules}
                pagination={{ ...schedulesParams, total: schedulesTotal }}
                onChange={handleSchedulesChange}
                canEdit={hasEditPermission && companyCanEdit}
                canDelete={hasDeletePermission && companyCanEdit}
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
          <PrivilegeCheck accessLabel="VIEW" resourceLabel="CUSTOMS">
            {tabKey === 'customs' && (
              <>
                <CustomsList
                  data={customsList}
                  tableLoading={customsTableLoading}
                  tabsCompanyChange={key => {
                    setCustomsParams({
                      ...customsParams,
                      from: 1,
                    });
                    setCustomsList([]);
                    setCustomsPagination({
                      ...customsPagination,
                      customsTabKey: key,
                      current: 1,
                    });
                    if (key === 'buysers') {
                      customerDataTracker.trackCustomerDetailCustomsDataTab('companyBuyingRecord');
                    } else {
                      customerDataTracker.trackCustomerDetailCustomsDataTab('companySupplyRecord');
                    }
                  }}
                  pageChange={from => {
                    setCustomsParams({
                      ...customsParams,
                      from,
                    });
                    setCustomsPagination({
                      ...customsPagination,
                      current: from,
                    });
                  }}
                  onSeeDetail={handleCustomsDetail}
                  pagination={{
                    current: customsPagination.current,
                    total: customsPagination.total,
                  }}
                />
                <LevelDrawer recData={recData} onClose={onCustomerDrawerClose} onOpen={onDrawerOpenBefore}>
                  <CustomsDetail />
                </LevelDrawer>
              </>
            )}
          </PrivilegeCheck>
          {tabKey === 'chatHistory' && <MessageHistory companyId={companyId as string} />}
          {tabKey === 'operate' && (
            <div className={style.operate}>
              <OperateHistory
                list={operates}
                pagination={{ ...operatesParams, total: operatesTotal }}
                onChange={handleOperateChange}
                onPreview={handleFetchOperateDetail}
                onOperateNameClick={() => {
                  customerDataTracker.trackCustomerDetailLogTab('ViewOperator');
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
              type="customer"
              visible={followsVisible.visible}
              options={followsVisible.options}
              readonly={!hasEditPermission || !companyCanEdit}
              onSave={() => {
                setShouldUpdate(true);
                fetchCustomerDetail(companyId as string);
                tabKey === 'schedule' && setSchedulesParams({ ...schedulesParams, ...defaultPagination });
              }}
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
      <ForwardPicker visible={forwardVisible} onCancel={() => setForwardVisible(false)} onFinish={handleForward} />
      <BackTop target={() => bodyRef.current as HTMLElement} visibilityHeight={500}>
        <Tooltip title={getIn18Text('HUIDAODINGBU')} placement="bottomRight">
          <div className={style.backTopIcon} />
        </Tooltip>
      </BackTop>
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
