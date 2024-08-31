import { useMemo, useRef } from 'react';
import { useMemoizedFn } from 'ahooks';
import _isEmpty from 'lodash/isEmpty';
import { EdmSendConcatInfo, ExcavateCompanyItem, GlobalSearchCompanyDetail, GlobalSearchContactItem, PrevScene } from 'api';
import { UniDrawerModuleId, getSocialPlatform, openAddLeadsContactModal, openSingleCreateLeadsModal, showUniDrawer, source2CreateType } from '@lxunit/app-l2c-crm';
import { showValidEmailAddressModal } from '@web-edm/send/validEmailAddress';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { OutPutContactItem } from '../../CustomsData/customs/customsDetail/components/contactsSelectModal/contactsSelectModal';
import { doValidEmailsConfirm, generateHandleFilterReceivers, getSouceTypeFromSen, getUniSourceTypeFromScene } from '../utils';
import { IEdmEmailList } from '../../Customer/components/hooks/useEdmSendCount';
import { edmApi, edmCustomsApi, globalSearchApi } from '../constants';
import { showFilterResultModal } from '../component/FilterResultModal';
import { isReachTheLimit } from '../../CustomsData/customs/utils';
import { showZnCompanySelect } from '../../CustomsData/customs/customsDetail/components/znCompanySelect';

interface Props {
  data?: GlobalSearchCompanyDetail;
  refreshData?: () => void;
  scene: PrevScene;
  companyRelationState: {
    companyId: string;
    status: string;
    leadsId: string;
  };
  refreshRelationState?: () => void;
  onLeadsPost: (extraParams: any) => Promise<void>;
  znCompanyList?: ExcavateCompanyItem[];
  crmOpsCallback: (props: any) => void;
}

export const useCrmOps = ({ data, scene, companyRelationState, refreshRelationState, znCompanyList = [], onLeadsPost, refreshData, crmOpsCallback }: Props) => {
  const inputType = useRef<string>('');
  const companySocial = useMemo(() => {
    if (!data) {
      return '';
    }
    return [
      [data.facebook, 'Facebook'],
      [data.linkedin, 'Linkedin'],
      [data.instagram, 'Instagram'],
      [data.twitter, 'Twitter'],
      [data.youtube, 'Youtube'],
    ]
      .filter(kv => !!kv[0])
      .map(kv => kv.reverse().join(':'))
      .join('; ');
  }, [data]);
  const checkCallback = useMemoizedFn((allEmails: IEdmEmailList[]) => {
    const emailCheckResult: { key: string; value: string[] }[] = [];
    const validEmails = allEmails.map(item => item.contactEmail);
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
  });
  const doAddLeads = useMemoizedFn((selected: OutPutContactItem[], extraFetchParams?: any) => {
    const selectIds = selected.map(sItem => sItem.id);
    const selectedContacts = (data?.contactList ?? []).filter(item => selectIds.includes(item.contactId));
    openSingleCreateLeadsModal({
      dataCount: selectedContacts.length,
      submit: ({ groupIds }) => onLeadsPost({ ...extraFetchParams, contactList: selectedContacts, leadsGroupIdList: groupIds }),
    });
  });
  const validZnCompanyList = useMemo(() => znCompanyList.filter(item => Number(item.status || 0) === 1), [znCompanyList]);
  const onZhCompanyModalConfirm = useMemoizedFn(async (newCheckedId: string, selected: OutPutContactItem[]) => doAddLeads(selected, { chineseCompanyId: newCheckedId }));
  const onInputBySelected = useMemoizedFn(async (selected: OutPutContactItem[]) => {
    const selectedContact = selected.filter(item => Object.values(item).some(value => !_isEmpty(value)));
    if (inputType.current === 'leads') {
      if (companyRelationState.leadsId) {
        if (!selectedContact) {
          SiriusMessage.warning({ content: '请选择有效的联系人' });
          return;
        }
        openAddLeadsContactModal({
          leads_id: Number(companyRelationState.leadsId),
          contacts: selectedContact.map(item => ({
            ...item,
            contact_name: item.contactName,
            social_platform: getSocialPlatform(item.social_platform_new) as any,
            telephone: item.telephones && item.telephones[0]?.replace(/\D/g, ''),
            source_name: getSouceTypeFromSen(scene),
            create_type: source2CreateType[getUniSourceTypeFromScene(scene)],
          })),
        });
      } else if (znCompanyList.length) {
        if (validZnCompanyList.length <= 1) {
          if (validZnCompanyList.length <= 0) {
            onZhCompanyModalConfirm(znCompanyList[0].id, selected);
            const res = await edmCustomsApi.doGetUserQuota();
            if (isReachTheLimit(res)) {
              SiriusMessage.warning({ content: '因当前国内企业查询额度不足，本次录入无法补充国内工商信息' });
            }
          } else {
            onZhCompanyModalConfirm(validZnCompanyList[0]?.id, selected);
          }
        } else {
          showZnCompanySelect({
            companyList: validZnCompanyList,
            companyName: data?.name ?? '',
            onConfirm: newCheckedId => onZhCompanyModalConfirm(newCheckedId, selected),
          });
        }
      } else {
        doAddLeads(selected);
      }
    } else if (inputType.current === 'customer') {
      const customerData = {
        name: data?.name,
        company_name: data?.name,
        company_domain: data?.domain,
        address: data?.location,
        area: ['', data?.country || '', '', ''],
        social_media_list: companySocial,
        contact_list: selectedContact.map(e => ({
          ...e,
          contact_name: e.contactName,
          telephone: e.telephones && e.telephones[0]?.replace(/\D/g, ''),
          sourceName: getSouceTypeFromSen(scene),
          create_type: source2CreateType[getUniSourceTypeFromScene(scene)],
        })) as any,
      };
      const customerId = companyRelationState?.companyId ? Number(companyRelationState.companyId) : undefined;
      showUniDrawer({
        moduleId: UniDrawerModuleId.CustomerDetail,
        moduleProps: {
          visible: true,
          source: getUniSourceTypeFromScene(scene),
          customerData,
          customerId,
          onSuccess: () => {
            refreshRelationState?.();
          },
          onClose: () => {},
          relationParams: {
            country_id: data?.countryId,
            company_name_id: data?.companyNameId,
          },
        },
      });
    }
  });
  const generateValidateEmail = useMemoizedFn((selected: OutPutContactItem[], allEmails: IEdmEmailList[], receivers: any[]) => async () => {
    const newDraftId = await edmApi.createDraft();
    crmOpsCallback({
      receivers,
      draftId: newDraftId,
      businessType: 'global_search',
      onCancelFilterAndSend: () => onInputBySelected(selected),
      onSendAll: generateHandleFilterReceivers(
        allEmails,
        newEmails => {
          // 录入线索
          const emailsList = newEmails.map(eItem => eItem.contactEmail);
          onInputBySelected(selected.filter(item => emailsList.includes(item.email)));
        },
        data?.id,
        refreshData
      ),
      showNoneInvalidListModal: () => {
        showFilterResultModal({
          onConfirm: () => {
            // 录入线索
            onInputBySelected(selected);
          },
        });
        checkCallback(allEmails);
      },
      minimizeable: false,
    });
  });
  const formatContact = useMemoizedFn((item: GlobalSearchContactItem) => ({
    contactName: item.name || '',
    contactEmail: item.contact,
    sourceName: getSouceTypeFromSen(scene),
    increaseSourceName: scene,
  }));
  const checkCompanyContacts = useMemoizedFn((selected: OutPutContactItem[], currInputType: 'leads' | 'customer' | string) => {
    if (!data) return;
    inputType.current = currInputType;
    const selectIds = selected.map(sItem => sItem.id);
    const selectedContactsInfos = (data.contactList ?? []).filter(item => selectIds.includes(item.contactId));
    // checkStatus    null/0:未校验，-1:校验不通过，1:校验通过
    const emails = selectedContactsInfos.map(formatContact).filter(item => item.contactEmail);

    const needCheckEmailList = selectedContactsInfos
      .filter(item => !item.checkStatus)
      .map(formatContact)
      .filter(item => item.contactEmail);
    if (needCheckEmailList.length) {
      doValidEmailsConfirm(generateValidateEmail(selected, emails, emails), () => onInputBySelected(selected), '直接录入');
    } else {
      onInputBySelected(selected);
    }
  });
  const fetchCustomerLimit = useMemoizedFn(async () => {
    let limitReached = false;
    // 录入客户时需要限制额度
    try {
      const res = await edmCustomsApi.getCustomerInputLimit();
      if (res?.limitReached) {
        limitReached = true;
        SiriusMessage.warning({ content: '已达今日录入客户上限，请明天再试' });
      }
    } catch (e) {
      // do nothing
    }
    return limitReached;
  });
  return { checkCompanyContacts, fetchCustomerLimit };
};
