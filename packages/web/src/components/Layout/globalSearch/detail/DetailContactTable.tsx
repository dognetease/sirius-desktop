/* eslint-disable max-statements */
import React, { useState, useEffect, useMemo, useRef, CSSProperties } from 'react';
import classnames from 'classnames';
import { useMemoizedFn } from 'ahooks';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import AiMarketingEnter from '@web-edm/components/AiMarketingEnter/aiMarketingEnter';
import { ValidEmailAddressModal } from '@web-edm/send/validEmailAddress';
// import { Tabs } from '@web-common/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { Checkbox, Tooltip } from 'antd';
import { GlobalSearchCompanyDetail, GlobalSearchContactItem, PrevScene, GrubStatus, getIn18Text, api, DataStoreApi, ExcavateCompanyItem, EdmSendConcatInfo } from 'api';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';
import { ReactComponent as HideContactInfoIcon } from '../assets/hide-contact-info.svg';
import { globalSearchDataTracker, GlobalSearchDetailEvent, jopType } from '../tracker';
import useEdmSendCount, { IEdmEmailList } from '../../Customer/components/hooks/useEdmSendCount';
import { ContactsTable, filiterCondition, UpdateEmail } from './contactList';
import getPageRouterWithoutHash from '../hook/getPageRouterWithoutHash';
import style from './companyDetail.module.scss';
import { globalSearchApi, edmApi } from '../constants';
import {
  doValidEmailsConfirm,
  formatDataContactsToOutputItem,
  generateHandleFilterReceivers,
  getButtonNameByGrubStatus,
  getSouceTypeFromSen,
  getTSourceByScene,
  getWmPageCurrUrl,
} from '../utils';
import { asyncTaskMessage$ } from '../search/GrubProcess/GrubProcess';
import { showFilterResultModal } from '../component/FilterResultModal';
import { CustomerEntry } from './CustomerEntry';
import { DetailMarketingOperation } from './DetailMarketingOperation';
import { CompanyRelationState } from './HeaderButtons';
import { useLeadsAdd } from '../hook/useLeadsAdd';
import { useCrmOps } from '../hook/useCrmOps';
import { AddContact } from '@web-edm/AIHosting/Receiver';

interface GlobalSearchDetailProps {
  scene?: PrevScene;
  productSubPage?: boolean;
  data?: GlobalSearchCompanyDetail;
  refreshData?: () => void;
  onToggleHideCommon?: (hide: boolean) => void;
  hideGrubButton?: boolean;
  title?: string;
  style?: CSSProperties;
  extraParams?: any;
  companyRelationState: CompanyRelationState;
  refreshRelationState?: () => Promise<void>;
  znCompanyList?: ExcavateCompanyItem[];
  setShowDetailClose?: () => void;
  onLeadsFetch: (extraFetchParams?: any) => Promise<void>;
  hideGlobalButtons?: boolean;
}

const GLOBAL_SEARCH_DETAIL = 'GLOBAL_SEARCH_DETAIL';
const dataStoreApi = api.getDataStoreApi() as DataStoreApi;

export const DetailContactTable: React.FC<GlobalSearchDetailProps> = props => {
  const {
    productSubPage,
    scene = 'globalSearch',
    data,
    refreshData,
    onToggleHideCommon,
    hideGrubButton,
    title,
    style: innerStyle,
    extraParams,
    companyRelationState,
    refreshRelationState,
    znCompanyList,
    setShowDetailClose,
    onLeadsFetch,
    hideGlobalButtons,
  } = props;
  console.log(hideGlobalButtons, 'hideGlobalButtons');
  const [contactPage, setContactPage] = useState(1);
  const [displayContactList, setDisplayContactList] = useState<GlobalSearchContactItem[]>([]);
  const [emailList, setEmailList] = useState<IEdmEmailList[]>([]);

  const tempEmailList = useRef<IEdmEmailList[]>([]);
  const needCheckEmailList = useRef<IEdmEmailList[]>([]);

  const [grubStatus, setGrubStatus] = useState<GrubStatus>(data?.grubStatus ?? 'NOT_GRUBBING');
  // 过滤弹窗是否展示
  const [showValidateEmailModal, setShowValidateEmailModal] = useState(false);
  const [receivers, setReceivers] = useState<Array<IEdmEmailList>>([]);
  const [draftId, setDraftId] = useState<string>('');
  const [concatPageSize, setconcatPageSize] = useState<number>(() => {
    const { data } = dataStoreApi.getSync(GLOBAL_SEARCH_DETAIL);
    return data ? Number(data as unknown as number) : 20;
  });
  const [sendType, setSendType] = useState<'filter' | 'normal'>('filter');
  const [selectKey, setSelectKey] = useState<'ALL' | 'SALE' | 'LEADERS' | 'MANAGER' | 'NULL'>('ALL');
  //  选中联系人
  const [selectContacts, setSelectContacts] = useState<GlobalSearchContactItem[]>([]);
  //  表头筛选
  const [selectChange, setSelectChange] = useState<CheckboxValueType[]>([]);
  // 是否选中所有联系人
  const [checkSelectedContacts, setCheckSelectedContacts] = useState<boolean>(false);
  // 全选文案是否展示
  const [allSelectTextStatus, selAllSelectTextStatus] = useState<boolean>(false);

  const [selectedConcats, setSelectedConcats] = useState<string[]>([]);

  const [contactTableList, setContactTableList] = useState<GlobalSearchContactItem[]>([]);

  const [addContactProp, setAddContactProp] = useState<any>({});
  useEdmSendCount(emailList, sendType, 'global_search', draftId, 'globalSearch', scene, getPageRouterWithoutHash());
  const handleHeaderScreenData = (params: CheckboxValueType[], contactList: Array<GlobalSearchContactItem>) => {
    let finallyArr: Array<GlobalSearchContactItem> = [];
    params.forEach(item => {
      let concantArr: Array<GlobalSearchContactItem> = [];
      if (item === 'contact') {
        concantArr = contactList.filter(v => v.contact);
      } else if (item === 'phone') {
        concantArr = contactList.filter(v => v.phone);
      } else if (item === 'other') {
        concantArr = contactList.filter(v => v.twitterUrl || v.facebookUrl || v.linkedinUrl);
      }
      finallyArr = finallyArr.concat(concantArr);
    });
    return finallyArr.filter((item, index, self) => self.findIndex(el => el.contactId === item.contactId) === index);
  };
  const handleUpdateData = () => {
    if (!data || !contactTableList || contactTableList.length === 0) {
      setDisplayContactList([]);
      return;
    }
    // 通过过滤条件
    let currentDisplayContactList = [];
    if (selectKey === 'ALL') {
      currentDisplayContactList = contactTableList;
    } else if (selectKey === 'NULL') {
      currentDisplayContactList = contactTableList.filter(item => !item.type || item.type === 'COMMON');
    } else {
      currentDisplayContactList = contactTableList.filter(item => item.type === selectKey);
    }
    if (selectChange.length === 1 || selectChange.length === 2) {
      currentDisplayContactList = handleHeaderScreenData(selectChange, currentDisplayContactList);
    }
    setDisplayContactList(currentDisplayContactList);
  };

  useEffect(() => {
    if (data?.contactList && data?.contactList.length > 0) {
      setContactTableList(data.contactList);
    }
  }, [data?.contactList]);

  useEffect(() => {
    handleUpdateData();
    selAllSelectTextStatus(false);
  }, [selectKey, contactTableList]);

  const checkCallback = () => {
    const emailCheckResult: { key: string; value: string[] }[] = [];
    const validEmails = tempEmailList.current?.map(item => item.contactEmail);
    emailCheckResult.push({
      key: 'valid',
      value: validEmails,
    });
    if (!data) return;
    globalSearchApi
      .globalEmailCheckCallback({
        id: data.id,
        emailCheckResult,
      })
      .then(() => {
        refreshData?.();
      });
  };

  const handleFilterReceivers = generateHandleFilterReceivers(
    tempEmailList.current,
    (newEmails, newType) => {
      globalSearchDataTracker.trackEmailVerify('sendEdm', 'verify', selectKey as jopType);
      setSendType(newType);
      setEmailList(newEmails);
    },
    data?.id,
    refreshData
  );

  const showNoneInvalidListModal = () => {
    setShowValidateEmailModal(false);
    showFilterResultModal({
      onConfirm: () => {
        setSendType('filter');
        setEmailList(Array.isArray(tempEmailList.current) && tempEmailList.current.length ? tempEmailList.current : [{ contactEmail: 'noEmials', contactName: '' }]);
      },
    });
    checkCallback();
  };

  const handleToggleHideCommon = (hide: boolean) => {
    onToggleHideCommon?.(hide);
    setSelectContacts([]);
    setSelectedConcats([]);
    setCheckSelectedContacts(false);
    selAllSelectTextStatus(false);
    setContactPage(1);
    globalSearchDataTracker.trackDetailClick(GlobalSearchDetailEvent.CommonMailFilter, scene, data?.companyId, data?.id, extraParams);
  };

  useEffect(() => {
    handleUpdateData();
  }, [selectChange.length]);
  const validateEmail = async () => {
    setReceivers(tempEmailList.current);
    const newDraftId = await edmApi.createDraft();
    setDraftId(newDraftId);
    setShowValidateEmailModal(true);
  };
  const directSendEmail = () => {
    // 直接发送 ===>  走便捷发送 sendType=normal
    globalSearchDataTracker.trackEmailVerify('sendEdm', 'add', selectKey as jopType);
    setSendType('normal');
    setEmailList(
      Array.isArray(tempEmailList.current) && tempEmailList.current.length
        ? tempEmailList.current.map(e => ({ ...e, sourceName: getSouceTypeFromSen(scene), increaseSourceName: scene }))
        : [{ contactEmail: 'noEmials', contactName: '' }]
    );
  };
  const doOperateWithContacts = (callback: () => void) => {
    if (selectedConcats.length === 0) {
      SiriusMessage.warning({
        content: getIn18Text('QINGXUANZELIANXI'),
      });
      return;
    }
    const selectedContactsInfos = contactTableList.filter(item => selectedConcats.includes(item.contactId));
    // checkStatus    null/0:未校验，-1:校验不通过，1:校验通过
    const emails = selectedContactsInfos
      .map(item => ({
        contactName: item.name || '',
        contactEmail: item.contact,
        sourceName: getSouceTypeFromSen(scene),
        increaseSourceName: scene,
      }))
      .filter(item => item.contactEmail);

    if (selectedContactsInfos.length) {
      needCheckEmailList.current = selectedContactsInfos
        .filter(item => !item.checkStatus)
        .map(item => ({
          contactName: item.name || '',
          contactEmail: item.contact,
          sourceName: getSouceTypeFromSen(scene),
          increaseSourceName: scene,
        }))
        .filter(item => item.contactEmail);
    } else {
      needCheckEmailList.current = [];
    }

    if (emails && emails?.length) {
      tempEmailList.current = emails;
    } else {
      tempEmailList.current = [];
    }
    callback();
  };
  /**
   *  @param
   *  tempEmailList 选中的数据
   *  needCheckEmailList 选中数据中需要过滤的数据
   * * */
  const onMarketing = () => {
    doOperateWithContacts(() => {
      // 埋点事件和后续逻辑无关 点击就触发
      globalSearchDataTracker.trackEmailVerify('sendEdm', 'add', selectKey as jopType);
      globalSearchDataTracker.trackDetailClick(GlobalSearchDetailEvent.SendEdm, scene, data?.companyId, data?.id, extraParams);
      if (needCheckEmailList.current.length) {
        doValidEmailsConfirm(validateEmail, directSendEmail, '直接发信');
      } else {
        // 直接发送 ===>  走便捷发送 sendType=normal
        setSendType('normal');
        setEmailList(Array.isArray(tempEmailList.current) && tempEmailList.current.length ? tempEmailList.current : [{ contactEmail: 'noEmials', contactName: '' }]);
      }
    });
  };
  const { handleAddLeads } = useLeadsAdd({
    onFetch: onLeadsFetch,
    refresh: refreshRelationState,
    onNavigate: setShowDetailClose,
  });
  const { checkCompanyContacts, fetchCustomerLimit } = useCrmOps({
    data: data
      ? ({
          ...data,
          contactList: contactTableList,
        } as any)
      : undefined,
    scene,
    refreshData,
    companyRelationState,
    refreshRelationState,
    znCompanyList,
    onLeadsPost: (extraFetchParams: any) => handleAddLeads({ extraFetchParams }),
    crmOpsCallback: param => crmOpsCallback(param),
  });
  const crmOpsCallback = (param: any) => {
    setAddContactProp(param);
    setDraftId(param.draftId);
    setShowValidateEmailModal(true);
  };
  const inputLeads = () => {
    const selected = formatDataContactsToOutputItem(contactTableList.filter(item => selectedConcats.includes(item.contactId)));
    globalSearchDataTracker.trackDetailClick(GlobalSearchDetailEvent.ImportClue, scene, data?.companyId, data?.id, extraParams);
    checkCompanyContacts(selected, 'leads');
  };

  const inputCustomer = async () => {
    const limitReached = await fetchCustomerLimit();
    if (limitReached) return;
    const selected = formatDataContactsToOutputItem(contactTableList.filter(item => selectedConcats.includes(item.contactId)));
    globalSearchDataTracker.trackDetailClick(GlobalSearchDetailEvent.ImportCustomer, scene, data?.companyId, data?.id, extraParams);
    checkCompanyContacts(selected, 'customer');
  };

  const hasEmailContact = useMemo(
    () => data && contactTableList && contactTableList.length > 0 && contactTableList.some(each => each.contact && each.contact.length > 0),
    [data, contactTableList]
  );

  const handleGuessMail = useMemoizedFn((param: UpdateEmail) => {
    setContactTableList(prv =>
      prv.map(item => {
        if (item.contactId === param.contactId) {
          return {
            ...item,
            checkStatus: param.info.checkStatus ?? 0,
            contact: param.info.contact ?? '',
            emails: param.info.emails as any,
            guessStatus: param.guessStatus,
            guess: param.guess,
          };
        }
        return item;
      })
    );
  });

  useEffect(() => {
    setGrubStatus(data?.grubStatus || 'NOT_GRUBBING');
  }, [data?.grubStatus]);

  const selectContactIds = useMemo(() => selectContacts.map(item => item.contactId), [selectContacts]);

  return (
    <div className={style.block} style={innerStyle}>
      <div className={style.contactOpHeader}>
        <h3>
          {title && <span style={{ marginRight: '8px' }}>{title}</span>}
          <span className={style.subtitle}>
            {getIn18Text('GONGZHAODAO')}
            {data?.contactCount || 0}
            {getIn18Text('GELIANXIREN')}
            {selectedConcats.length > 0 ? `，${getIn18Text('YIXUANZE')} ${selectedConcats.length} ${getIn18Text('GELIANXIREN')}` : ''}
          </span>
        </h3>
        <div className={style.hideContact}>
          <Checkbox
            onChange={ev => {
              handleToggleHideCommon(ev.target.checked);
            }}
          >
            {getIn18Text('YINCANGGONGGONGYOUXIANGDIZHI')}
          </Checkbox>
          <Tooltip title="不显示前缀为info、service、support等内容的公共邮箱" placement="topRight">
            <HideContactInfoIcon />
          </Tooltip>
        </div>
      </div>
      {allSelectTextStatus && (
        <div className={style.selectContacts}>
          <div>
            {checkSelectedContacts ? ` 已选择全部 ${displayContactList.length} 个联系人。 ` : `已选择此页面上所有 ${selectContacts.length}个联系人。`}
            <Button
              btnType="link"
              onClick={() => {
                if (checkSelectedContacts) {
                  setCheckSelectedContacts(false);
                  setSelectContacts([]);
                  selAllSelectTextStatus(false);
                  setSelectedConcats([]);
                } else {
                  setCheckSelectedContacts(true);
                  setSelectContacts(displayContactList);
                  setSelectedConcats(displayContactList.map(item => item.contactId));
                }
              }}
              className={style.selectBtn}
            >
              {checkSelectedContacts ? '清除所选内容' : `选择全部 ${displayContactList.length}个联系人`}
            </Button>
          </div>
        </div>
      )}
      <div className={classnames(style.contactHeader)}>
        <span className={style.subtitle}>
          <Tabs
            activeKey={selectKey}
            bgmode="white"
            size="small"
            type="capsule"
            onChange={key => {
              setSelectKey(key as any);
              setContactPage(1);
              globalSearchDataTracker.trackJobtitleFilter(key as 'ALL' | 'MANAGER' | 'SALE' | 'COMMON');
            }}
          >
            {filiterCondition.map(item => (
              <Tabs.TabPane key={item.key} className={style.tab} tab={item.label} />
            ))}
          </Tabs>
        </span>
        <div hidden={hideGlobalButtons || !!productSubPage} style={{ display: 'flex', alignItems: 'center' }}>
          {!hideGrubButton && (
            <Button
              btnType="link"
              disabled={grubStatus !== 'NOT_GRUBBING'}
              onClick={() => {
                globalSearchDataTracker.trackDeepSearchContact('detail');
                setGrubStatus('GRUBBING');
                if (data) {
                  asyncTaskMessage$.next({
                    eventName: 'globalSearchGrubTaskAdd',
                    eventData: {
                      type: 'contact',
                      data: {
                        id: data.id,
                        name: data.name,
                        grubStatus: 'GRUBBING',
                      },
                    },
                  });
                }
              }}
            >
              {getButtonNameByGrubStatus(grubStatus)}
            </Button>
          )}
          {hasEmailContact && (
            <AiMarketingEnter
              btnType="text"
              btnClass={classnames(style.blockButton, {
                [style.disabled]: selectedConcats.length === 0,
              })}
              needDisable={selectedConcats.length === 0}
              text={getIn18Text('YIJIANYINGXIAO')}
              handleType="assembly"
              from={scene}
              afterClickType="sync"
              afterClick={() => {
                if (selectedConcats.length === 0) return;
                onMarketing();
              }}
              back={getWmPageCurrUrl()}
            />
          )}
          {contactTableList?.some(item => item.phone) && <DetailMarketingOperation phoneNums={selectContacts?.filter(item => item.phone)?.map(item => item.phone)} />}
          {Boolean(contactTableList.length) && (
            <CustomerEntry
              companyRelationState={companyRelationState}
              inputLeads={inputLeads}
              inputCustomer={inputCustomer}
              btnType="link"
              disabled={selectedConcats.length === 0}
            />
          )}
        </div>
      </div>
      <div className={style.contactList}>
        <ContactsTable
          hideMutiCheck={!!productSubPage}
          data={data}
          total={displayContactList.length}
          tableData={displayContactList}
          selectChange={value => {
            setSelectChange(value);
            setContactPage(1);
            selAllSelectTextStatus(false);
          }}
          selectData={selectContactIds}
          isCheckAll={value => {
            selAllSelectTextStatus(value);
            if (!value) {
              setCheckSelectedContacts(false);
              setSelectContacts([]);
            }
          }}
          pageSize={concatPageSize}
          onSelect={value => {
            setSelectContacts(value);
            setCheckSelectedContacts(false);
            setSelectedConcats(value.map(item => item.contactId));
            if (value.length !== concatPageSize) {
              selAllSelectTextStatus(false);
            } else {
              selAllSelectTextStatus(true);
            }
          }}
          handleGuessMail={param => {
            handleGuessMail(param);
          }}
          paginationOptions={
            data && displayContactList.length > 20
              ? {
                  current: contactPage,
                  total: data ? displayContactList.length : 0,
                  showLessItems: false,
                  pageSize: concatPageSize,
                  onChange: (page, pageSize) => {
                    setContactPage(page);
                    try {
                      if (typeof pageSize === 'number') {
                        dataStoreApi.putSync(GLOBAL_SEARCH_DETAIL, JSON.stringify(pageSize), {
                          noneUserRelated: false,
                        });
                      }
                    } catch (error) {}
                    pageSize && setconcatPageSize(pageSize);
                  },
                  showSizeChanger: true,
                  showQuickJumper: true,
                  size: 'small',
                  showTotal: total => `${getIn18Text('GONG')}${total}${getIn18Text('TIAO')}`,
                  className: 'pagination-wrap pagination-wrap-customs pagination-customs',
                }
              : false
          }
        />
      </div>
      {showValidateEmailModal && draftId && (
        <AddContact
          receivers={receivers as any[]}
          draftId={draftId}
          businessType="global_search"
          onCancelFilterAndSend={directSendEmail}
          onSendAll={handleFilterReceivers}
          showNoneInvalidListModal={showNoneInvalidListModal}
          visible={showValidateEmailModal}
          {...addContactProp}
          directCheck
          minimizeable={false}
          onClose={() => {
            setShowValidateEmailModal(false);
            setAddContactProp({});
          }}
        />
      )}
    </div>
  );
};
