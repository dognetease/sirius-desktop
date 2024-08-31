import React, { useState, useRef, useEffect } from 'react';
import classnames from 'classnames';
import {
  apis,
  apiHolder,
  CustomerApi,
  openSeaDetail as ClueDetailType,
  ContactDetail,
  CustomerOperateHistoryItem,
  CustomerOperateDetailRes,
  ResDocumentList,
  CustomerEmailListCondition,
} from 'api';
import { Button, Tooltip, BackTop, Pagination } from 'antd';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import Tabs from '@/components/Layout/Customer/components/UI/Tabs/tabs';
import FoldCard from '@/components/Layout/Customer/components/foldCard/foldCard';
import DetailHeader from '@/components/Layout/Customer/components/detailHeader/detailHeader';
import ContactEmails, { readEmail } from '@/components/Layout/Customer/components/contactEmails/contactEmails';
import OperateHistory from '@/components/Layout/Customer/components/operateHistory/operateHistory';
import OperatePreview from '@/components/Layout/Customer/components/operatePreview/operatePreview';
import Contacts from '@/components/Layout/Customer/components/contacts/contacts';
import BaseInfo from './components/baseInfo';
import * as clueLogo from '@/images/icons/customerDetail/clue-logo.png';
import useEventListener from '@web-common/hooks/useEventListener';
import { Follows } from '../../../components/moments/follows';
import { openSeaDataTracker } from '../../../tracker/openSeaDataTracker';
import style from './seaClueDetail.module.scss';
import ShowConfirm from '../../../components/confirm/makeSureConfirm';
import DistributeClueStatusModal from '@/components/Layout/Customer/components/DistributeClueModal/distributeClueStatus';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
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
const tabs: TabConfig[] = [
  { key: 'email', text: getIn18Text('WANGLAIYOUJIAN'), trackerName: 'clickEmailTab' },
  { key: 'document', text: getIn18Text('WENJIAN'), trackerName: 'clickDocumentTab' },
  { key: 'operate', text: getIn18Text('CAOZUOLISHI'), trackerName: 'clickOperaHistoryTab' },
];
const RESOURCE_LABEL = 'CHANNEL_OPEN_SEA';
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
interface SeaClueDetailProps {
  visible: boolean;
  openSeaId: string;
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
  openSeaId: string | null;
}
interface EmailsParamsType extends ParamsType {
  fromEmail?: string;
  toEmail?: string;
  startDate?: string;
  endDate?: string;
  labels?: string[];
}
const SeaClueDetail: React.FC<SeaClueDetailProps> = props => {
  const { visible, openSeaId, prevDisabled, nextDisabled, onPrev, onNext, onClose, children } = props;
  const [detail, setDetail] = useState<ClueDetailType>({} as ClueDetailType);
  const [tabKey, setTabKey] = useState<string>(tabs[0]?.key);
  const [followsVisible, setFollowsVisible] = useState<FollowsVisible>({ visible: true });
  const [infoFolded, setInfoFolded] = useState<boolean>(false);
  const [contacts, setContacts] = useState<ContactDetail[]>([]);
  const [contactsFolded, setContactsFolded] = useState<boolean>(true);
  const [operates, setOperates] = useState<CustomerOperateHistoryItem[]>([]);
  const [operatesTotal, setOperatesTotal] = useState<number>(0);
  const [operateDetail, setOperateDetail] = useState<CustomerOperateDetailRes | null>(null);
  const [operateDetailVisible, setOperateDetailVisible] = useState<boolean>(false);
  const [operatesParams, setOperatesParams] = useState<ParamsType>({
    openSeaId: null,
    ...defaultPagination,
  });
  const [statusVisible, setStatusVisible] = useState(false);
  const [documentList, setDocumentList] = useState<ResDocumentList>();
  const [documentParams, setDocumentParams] = useState<DocumentListFilter>({
    page: 1,
    page_size: defaultPagination.pageSize,
  });
  // set header shadow & back-top on body scroll
  const [scrollTop, setScrollTop] = useState<number>(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const onBodyScroll = event => setScrollTop(event.target.scrollTop);
  const followsRef = useRef<any>(null);
  // notify parent container whether should update data
  const [contactCurrentPage, setContactCurrentPage] = useState<number>(1);
  const [contactCurrentTotal, setContactCurrentTotal] = useState<number>(0);
  const [contactSearchParam, setContactSearchParam] = useState<Record<string, string>>();
  const fetchClueDetail = id => {
    customerApi.openSeaDetail({ id }).then(data => {
      if (data) {
        console.log('openSeaDetail', data);
        const { contact_list, ...rest } = data;
        setDetail(rest as ClueDetailType);
      } else {
        Toast.error({ content: getIn18Text('WEICHAXUNDAOXIANSUOXIANGQING') });
      }
    });
    // .catch(res => {
    //   Toast.error({ content: `线索详情接口异常: ${res?.data?.message}` });
    // });
  };
  useEventListener('scroll', onBodyScroll, bodyRef.current);
  useEffect(() => {
    if (visible && openSeaId) {
      fetchClueDetail(openSeaId);
      setOperatesParams({ openSeaId, ...defaultPagination });
    } else {
      setOperatesParams({ openSeaId: null, ...defaultPagination });
    }
    setDocumentParams({ page: 1, page_size: defaultPagination.pageSize });
    setContactSearchParam(undefined);
  }, [visible, openSeaId]);
  useEffect(() => {
    followsVisible.visible && bodyRef.current?.scrollTo(0, 0);
  }, [followsVisible.visible]);
  useEffect(() => {
    if (visible && tabKey === 'operate' && operatesParams.openSeaId) {
      const { current: page, pageSize: page_size, openSeaId: clue_open_sea_id } = operatesParams;
      // let copyParams = {...operatesParams};
      // copyParams.openSeaId && delete copyParams.openSeaId;
      customerApi
        .getCustomerOperateHistory({
          page,
          page_size,
          clue_open_sea_id,
          condition: 'open_sea',
          ...operatesParams,
        })
        .then(data => {
          setOperates(data?.item_list || []);
          setOperatesTotal(data?.total_size || 0);
        })
        .catch(res => {
          Toast.error({ content: `操作列表接口异常: ${res?.data?.message}` });
        });
    }
  }, [visible, tabKey, operatesParams]);
  const handleTabTracker = key => {
    const target = tabs.find(item => item.key === key) as TabConfig;
    openSeaDataTracker.trackClueDetailTab(target.trackerName);
  };
  const handleOperateChange = (page, pageSize) => {
    setOperatesParams(previous => ({
      ...operatesParams,
      current: pageSize === previous.pageSize ? page : 1,
      pageSize,
    }));
  };
  const handleFetchOperateDetail = id => {
    setOperateDetailVisible(true);
    customerApi
      .getCustomerOperateDetail({
        condition: 'open_sea',
        clue_open_sea_id: openSeaId,
        history_id: id,
      })
      .then(data => {
        setOperateDetail(data);
      })
      .catch(res => {
        Toast.error({ content: `操作历史接口异常: ${res?.data?.message}` });
      });
    openSeaDataTracker.trackClueDetailOperateOption('DiffContentClickNum');
  };
  useEffect(() => {
    if (visible && tabKey === 'document' && openSeaId) {
      customerApi
        .getDocumentList({
          condition: 'open_sea',
          condition_id: openSeaId as string,
          ...documentParams,
        })
        .then(data => {
          setDocumentList(data);
        });
    }
  }, [visible, tabKey, documentParams]);
  const fetchContactsList = () => {
    customerApi
      .contactListPageById({
        condition: 'open_sea',
        clue_open_sea_id: openSeaId,
        page: contactCurrentPage,
        page_size: 20,
        contact_search_key: contactSearchParam,
      })
      .then(res => {
        setContacts(res?.content || []);
        setContactCurrentTotal(res.total_size);
      });
  };
  useEffect(() => {
    if (openSeaId && visible) {
      fetchContactsList();
    }
  }, [openSeaId, visible, contactCurrentPage, contactSearchParam]);
  const handleDocumentFilterChange = (filter: DocumentListFilter) => {
    const { page_size, page } = filter;
    setDocumentParams(previous => ({
      ...documentParams,
      ...filter,
      page: page_size === previous.page_size ? page : 1,
    }));
  };
  const handleClueReceive = () => {
    openSeaDataTracker.trackClueDetailTopbar('claim');
    ShowConfirm({ title: getIn18Text('QUERENLINGQUXIANSUOMA\uFF1F'), makeSure: makeSureReceive });
  };
  const makeSureReceive = () => {
    if (!openSeaId) return;
    customerApi.openSeaReceive([openSeaId]).then(res => {
      if (res) {
        onClose(true);
        Toast.info({
          content: getIn18Text('LINGQUCHENGGONG'),
        });
      }
    });
  };
  const handleClueDistribute = () => {
    openSeaDataTracker.trackClueDetailTopbar('assign');
    setStatusVisible(true);
    // Toast.info({ content: 'TODO: 分配线索' });
  };
  /*
   *  关闭分配线索弹框
   */
  const closeAllocateModal = (param?: boolean) => {
    setStatusVisible(false);
    // 请求数据
    if (param == true) {
      onClose(true);
    }
  };
  // 查看邮件详情
  const readEmailDetail = ({ snapshot_id }) => {
    let params = {
      condition: 'open_sea',
      company_id: openSeaId,
      mailSnapshotId: snapshot_id,
    };
    console.log('params-list', params);
    readEmail(params);
  };
  return (
    <Drawer className={style.seaClueDetail} visible={visible} onClose={() => onClose(false)}>
      <DetailHeader
        className={classnames(style.header, { [style.shadow]: scrollTop > 0 })}
        defaultLogo={clueLogo as unknown as string}
        title={detail.clue_name}
        titleId={detail.clue_number}
        content={
          <div className={style.clueStatus}>
            {getIn18Text('XIANSUOZHUANGTAI\uFF1A')}
            {detail.clue_status_name}
          </div>
        }
        options={
          <div className={style.options}>
            <PrivilegeCheck accessLabel="CLAIM" resourceLabel={RESOURCE_LABEL}>
              <Button onClick={handleClueReceive}>{getIn18Text('LINGQU')}</Button>
            </PrivilegeCheck>
            <PrivilegeCheck accessLabel="ALLOT" resourceLabel={RESOURCE_LABEL}>
              <Button onClick={handleClueDistribute}>{getIn18Text('FENPEI')}</Button>
            </PrivilegeCheck>
          </div>
        }
        prevDisabled={prevDisabled}
        nextDisabled={nextDisabled}
        onPrev={() => {
          onPrev();
          openSeaDataTracker.trackClueDetailTopbar('next');
        }}
        onNext={() => {
          onNext();
          openSeaDataTracker.trackClueDetailTopbar('next');
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
          title={`联系人(${contactCurrentTotal})`}
          folded={contactsFolded}
          foldHeight={followsVisible.visible ? 250 + 48 : 250 + 48}
          onFoldChange={nextFolded => {
            setContactsFolded(nextFolded);
            !nextFolded && openSeaDataTracker.trackClueDetailContact('Unfold');
          }}
        >
          <>
            <div className="sirius-scroll" style={{ overflowY: contactsFolded ? 'scroll' : 'visible', maxHeight: contactsFolded ? 250 : 'none' }}>
              <SearchContact onSearch={setContactSearchParam} searchParams={contactSearchParam} />
              <Contacts
                list={contacts}
                mode={contactsFolded ? 'simple' : 'complete'}
                hiddenFields={['label_list', 'job', 'home_page', 'gender', 'birthday', 'pictures']}
                completeHeight={250}
                options={[]}
              />
            </div>
            {contactCurrentTotal ? (
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
                  mainResourceId={openSeaId}
                  condition={CustomerEmailListCondition.OpenSea}
                />
              </div>
            </div>
          )}
          {tabKey === 'document' && (
            <DocumentList
              type="open_sea"
              sourceId={openSeaId as string}
              data={documentList}
              onFilterChange={handleDocumentFilterChange}
              dataTracker={openSeaDataTracker}
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
                onOperateNameClick={() => openSeaDataTracker.trackClueDetailOperateOption('ViewOperator')}
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
            id={openSeaId}
            ref={followsRef}
            type="openSea"
            visible={followsVisible.visible}
            options={followsVisible.options}
            disabled
            disabledText={getIn18Text('GONGHAIXIANSUOWUFATIANJIAGENJINJILU')}
          />
        </FoldCard>
      </div>
      <BackTop target={() => bodyRef.current as HTMLElement} visibilityHeight={500}>
        <Tooltip title={getIn18Text('HUIDAODINGBU')} placement="bottomRight">
          <div className={style.backTopIcon} />
        </Tooltip>
      </BackTop>
      {statusVisible && <DistributeClueStatusModal visible={statusVisible} onCancel={closeAllocateModal} ids={[openSeaId]} />}
    </Drawer>
  );
};
export default SeaClueDetail;
