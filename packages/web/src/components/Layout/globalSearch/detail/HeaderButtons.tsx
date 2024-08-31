import React, { FC, useMemo, useState, useEffect } from 'react';
import { ExcavateCompanyItem, GlobalSearchCompanyDetail, MergeCompany, PrevScene, getIn18Text, CompanyExists, CustomButtonsType, IsPageSwitchItem } from 'api';
import classnames from 'classnames';
import { useMemoizedFn } from 'ahooks';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { Tooltip } from 'antd';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { TongyongJiantou1You, TongyongJiantou1Zuo } from '@sirius/icons';
import ContactsSelectModal, { OutPutContactItem } from '@/components/Layout/CustomsData/customs/customsDetail/components/contactsSelectModal/contactsSelectModal';
import style from './companyDetail.module.scss';
import { getTSourceByScene, showStar } from '../utils';
import { GlobalSearchDetailEvent, globalSearchDataTracker } from '../tracker';
import { useLeadsAdd } from '../hook/useLeadsAdd';
import { SubscribeCompanyModal } from '../search/SubscribeCompanyModal';
import { globalSearchApi } from '../constants';
import { useIsForwarder } from '../../CustomsData/customs/ForwarderSearch/useHooks/useIsForwarder';
import useTradeQuery from '../hook/useTradeQuery';
import { CustomerEntry } from './CustomerEntry';
import { useCrmOps } from '../hook/useCrmOps';
import { ReactComponent as StarIcon } from '@/images/icons/customs/star-line.svg';
import { ReactComponent as StarHoverIcon } from '@/images/icons/customs/star-selected.svg';
import { AddContact } from '@web-edm/AIHosting/Receiver';

export interface CompanyRelationState {
  companyId: string;
  status: string;
  leadsId: string;
}

interface HeaderButtonsProps {
  showSubscribe?: boolean;
  productSubPage?: boolean;
  hideCustomerButtons?: boolean;
  onIgnoreCompany?(): void;
  onToggleSub?(id: string | number, collectId?: string | number): void;
  onToggleMergeCompanySub?(comId: string, cId?: string | number | null): void;
  data?: GlobalSearchCompanyDetail & { sourceCountry?: string };
  scene: PrevScene;
  headerCompanyList: Array<MergeCompany>;
  refresh?: () => Promise<void> | void;
  refreshRelationState?: () => Promise<void>;
  companyRelationState: CompanyRelationState;
  znCompanyList?: ExcavateCompanyItem[];
  recommendShowName?: string;
  hasImportCount?: CompanyExists | null;
  setShowDetailClose?: () => void;
  extraParams?: any;
  hideGlobalButtons?: Boolean;
  customButtons?: CustomButtonsType[];
  switchOption?: IsPageSwitchItem;
}
export const HeaderButtons: FC<HeaderButtonsProps> = ({
  showSubscribe,
  productSubPage,
  hideCustomerButtons,
  onIgnoreCompany,
  data,
  scene,
  headerCompanyList,
  refreshRelationState,
  onToggleSub,
  onToggleMergeCompanySub,
  companyRelationState,
  refresh,
  znCompanyList = [],
  recommendShowName,
  hasImportCount,
  setShowDetailClose,
  extraParams,
  hideGlobalButtons,
  customButtons,
  switchOption,
}) => {
  const [inputType, setInputType] = useState<string>('');
  const [contactsVisible, setContactsVisible] = useState(false);
  const [subscribeCompanyVisible, setSubscribeCompanyVisible] = useState<boolean>(false);
  const [collectId, setCollectId] = useState<string | number>();
  const [addContactProp, setAddContactProp] = useState<any>({});
  const [showValidateEmailModal, setShowValidateEmailModal] = useState(false);
  const isForwarder = useIsForwarder();
  const contactList = useMemo(
    () =>
      data?.contactList?.map((e, index) => ({
        type: e.type,
        key: index,
        contactName: e.name,
        email: e.contact,
        telephones: [e.phone],
        job: e.jobTitle,
        whatsApp: '',
        linkedinUrl: e.linkedinUrl,
        facebookUrl: e.facebookUrl,
        twitterUrl: e.twitterUrl,
        id: e.contactId,
      })) || [],
    [data]
  );
  const { makeTradeReport, info } = useTradeQuery({
    country: data?.domainCountry,
    name: recommendShowName ?? data?.name ?? '',
    closeDraw: setShowDetailClose,
    showBtn: !!(isForwarder && scene === 'globalSearch' && (hasImportCount?.buyer || hasImportCount?.supplier)),
  });
  useEffect(() => {
    setCollectId(data?.collectId);
  }, [data]);
  const handleToggleSub = useMemoizedFn(async () => {
    if (headerCompanyList.length > 1 && data) {
      setSubscribeCompanyVisible(true);
      return;
    }
    if (data) {
      try {
        if (collectId) {
          await globalSearchApi.doDeleteCollectById({ collectId });
          setCollectId(undefined);
          onToggleSub?.(data.id, undefined);
          SiriusMessage.success('已取消订阅，系统将不再向您推送该公司动态');
          globalSearchDataTracker.trackDetailClick(GlobalSearchDetailEvent.Unsubscribe, scene, data?.companyId, data?.id, extraParams);
        } else {
          const cId = await globalSearchApi.doCreateCollectByCompanyId(data.companyId);
          setCollectId(cId);
          onToggleSub?.(data.id, cId);
          SiriusMessage.success('公司订阅成功，系统将为您及时推送该公司动态');
          globalSearchDataTracker.trackDetailClick(GlobalSearchDetailEvent.Subscribe, scene, data?.companyId, data?.id, extraParams);
        }
      } catch (error) {
        // do nothing
      }
    }
  });

  const onLeadsFetch = useMemoizedFn(async (extraFetchParams?: any) => {
    if (!data) return;
    await globalSearchApi.globalSingleAddLeads({
      id: data.id,
      sourceType: getTSourceByScene(scene),
      ...extraFetchParams,
    });
  });
  const { handleAddLeads, leadsAddLoading } = useLeadsAdd({
    onFetch: onLeadsFetch,
    refresh: refreshRelationState,
    onNavigate: setShowDetailClose,
  });
  const { checkCompanyContacts, fetchCustomerLimit } = useCrmOps({
    data,
    scene,
    companyRelationState,
    refreshRelationState,
    znCompanyList,
    refreshData: refresh,
    onLeadsPost: (extraFetchParams: any) => handleAddLeads({ extraFetchParams }),
    crmOpsCallback: param => crmOpsCallback(param),
  });

  const crmOpsCallback = (param: any) => {
    setAddContactProp(param);
    setShowValidateEmailModal(true);
  };

  const onContactSelectOk = useMemoizedFn((selected: OutPutContactItem[]) => {
    setContactsVisible(false);
    checkCompanyContacts(selected, inputType);
  });

  const inputLeads = useMemoizedFn(async () => {
    if (!data) return;
    setInputType('leads');
    if (!contactList.length) {
      checkCompanyContacts([], 'leads');
    } else {
      setContactsVisible(true);
    }
    globalSearchDataTracker.trackDetailClick(GlobalSearchDetailEvent.ImportClue, scene, data?.companyId, data?.id, extraParams);
    if (scene === 'cantonfair') {
      globalSearchDataTracker.trackContomFairDetailClick('importClue');
    }
  });
  const inputCustomer = useMemoizedFn(async () => {
    if (!data) return;
    const limitReached = await fetchCustomerLimit();
    if (limitReached) return;
    setInputType('customer');
    if (!contactList.length) {
      checkCompanyContacts([], 'customer');
    } else {
      setContactsVisible(true);
    }
    globalSearchDataTracker.trackDetailClick(GlobalSearchDetailEvent.ImportCustomer, scene, data?.companyId, data?.id, extraParams);
    if (scene === 'cantonfair') {
      globalSearchDataTracker.trackContomFairDetailClick('importCustomer');
    }
  });
  const closeContactModal = useMemoizedFn(() => setContactsVisible(false));
  const closeSubscribeCompanyModal = useMemoizedFn(() => setSubscribeCompanyVisible(false));
  const onChangeCollect = useMemoizedFn((comId, colId) => {
    refresh?.();
    if (data && comId === data?.companyId) {
      onToggleSub?.(data.id, colId ?? undefined);
    }
    onToggleMergeCompanySub?.(comId, colId);
  });
  const contactModalTitle = useMemo(() => (inputType === 'leads' ? getIn18Text('LURUXIANSUO') : getIn18Text('LURUKEHU')), [inputType]);
  const handleOnPagTurn = (num: number) => {
    switchOption?.onPagTurn && switchOption?.onPagTurn(num);
  };

  return (
    <>
      {switchOption && (
        <>
          <Tooltip title={switchOption?.hasLast ? '上一个公司' : '已是此页的第一个公司了，请返回列表页翻页'}>
            <div
              className={classnames(style.iconStyle, style.iconZuo, {
                [style.disablePage]: !switchOption?.hasLast,
              })}
              onClick={() => handleOnPagTurn(-1)}
            >
              <TongyongJiantou1Zuo />
            </div>
          </Tooltip>

          <Tooltip title={switchOption?.hasNext ? '下一个公司' : '已是此页的最后一个公司了，请返回列表页翻页'}>
            <div
              className={classnames(style.iconStyle, style.iconYou, {
                [style.disablePage]: !switchOption?.hasNext,
              })}
              onClick={() => handleOnPagTurn(1)}
            >
              <TongyongJiantou1You />
            </div>
          </Tooltip>
        </>
      )}
      {showSubscribe && !hideGlobalButtons && (
        <Tooltip title={showStar(collectId, headerCompanyList) ? '取消订阅公司' : '订阅公司'}>
          <div className={classnames(style.titleBtnStar)} onClick={handleToggleSub}>
            {showStar(collectId, headerCompanyList) ? <StarHoverIcon /> : <StarIcon />}
          </div>
        </Tooltip>
      )}
      {isForwarder && scene === 'globalSearch' && (hasImportCount?.buyer || hasImportCount?.supplier) && !hideGlobalButtons ? (
        <Button onClick={makeTradeReport} style={{ marginLeft: 8 }}>
          {info.searchFlag ? '查看报告' : '分析报告'}
        </Button>
      ) : (
        ''
      )}
      {productSubPage && !hideGlobalButtons && (
        <Button className={classnames(style.titleBtn)} onClick={onIgnoreCompany} style={{ marginLeft: 8 }}>
          {getIn18Text('BUGANXINGQU')}
        </Button>
      )}
      {!hideCustomerButtons && !hideGlobalButtons && (
        <CustomerEntry
          inputCustomer={inputCustomer}
          inputLeads={inputLeads}
          companyRelationState={companyRelationState}
          leadsAddLoading={leadsAddLoading}
          btnStyle={{ marginLeft: 8 }}
        />
      )}
      {customButtons?.length &&
        hideGlobalButtons &&
        customButtons.map(item => (
          <Button btnType="primary" onClick={() => item.handler({ detailData: data })} style={{ marginLeft: 8 }}>
            {item.buttonName}
          </Button>
        ))}
      {contactsVisible && (
        <ContactsSelectModal title={contactModalTitle} contactsList={contactList} onOk={onContactSelectOk} onCancel={closeContactModal} visible={contactsVisible} />
      )}
      {showValidateEmailModal && (
        <AddContact
          {...addContactProp}
          directCheck
          visible={showValidateEmailModal}
          onClose={() => {
            setShowValidateEmailModal(false);
          }}
        />
      )}
      <SubscribeCompanyModal
        visible={subscribeCompanyVisible}
        companyList={headerCompanyList}
        setVisible={closeSubscribeCompanyModal}
        onChangeCollect={onChangeCollect}
        mainId={data?.companyId || ''}
      />
    </>
  );
};
