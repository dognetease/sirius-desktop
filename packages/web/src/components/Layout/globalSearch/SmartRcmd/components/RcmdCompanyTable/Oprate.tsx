import { EdmCustomsApi, GlobalSearchApi, GlobalSearchListContactItem, GlobalSearchItem, SmartRcmdItem, api, apis, getIn18Text } from 'api';
import React, { MouseEvent, useCallback, useMemo, useState } from 'react';
import { Space, Menu } from 'antd';
import { useMemoizedFn } from 'ahooks';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { UniDrawerModuleId, openBatchCreateLeadsModal } from '@lxunit/app-l2c-crm';
import { showUniDrawer } from '@/components/Layout/CustomsData/components/uniDrawer';
import { globalSearchDataTracker } from '../../../tracker';
import { useLeadsAdd } from '../../../hook/useLeadsAdd';
import { getCustomerAndLeadsTagInList } from '../../../utils';
import ArrowDropdownButton from '../../../component/ArrowDropdownButton/ArrowDropdownButton';
import styles from './rcmdcompanytable.module.scss';

const edmCustomsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

interface OprateProps<T = GlobalSearchItem> {
  data: T;
  onRemove?(item: T, rank: number): Promise<void>;
  selectedItem?: SmartRcmdItem | null;
  refresh?: () => Promise<void>;
  rank: number;
}

const Oprate: React.FC<OprateProps> = ({ data, onRemove, selectedItem, refresh, rank }) => {
  const [customerLoading, setCustomerLoading] = useState<boolean>(false);
  const customerTagContent = useMemo(() => getCustomerAndLeadsTagInList({ referId: data?.referId, customerLabelType: data.customerLabelType }), [data]);

  const isCustomer = useMemo(() => customerTagContent?.type === 'customer', [customerTagContent]);

  const getCustomerData = (contactList: GlobalSearchListContactItem[] = []) => {
    const getCompanySocial = () => {
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
        .filter(kv => {
          return !!kv[0];
        })
        .map(kv => {
          return kv.reverse().join(':');
        })
        .join('; ');
    };
    const getItemSocial = (item: GlobalSearchListContactItem) => {
      const platforms = [];
      if (item.linkedinUrl) {
        platforms.push(`Linkedin:${item.linkedinUrl}`);
      }
      if (item.facebookUrl) {
        platforms.push(`Facebook:${item.facebookUrl}`);
      }
      if (item.twitterUrl) {
        platforms.push(`Twitter:${item.twitterUrl}`);
      }
      if (platforms.length > 0) {
        return platforms.join('; ');
      }
      return undefined;
    };
    const customerInfo = {
      name: data.name,
      company_name: data.name,
      company_domain: data.domain,
      area: ['', data?.country || '', '', ''],
      address: data.location,
      social_media_list: getCompanySocial(),
      contact_list: contactList.map((item, index) => ({
        main_contact: index === 0,
        contact_name: item.name,
        email: item.contact,
        telephone: item?.phone?.replace(/\D/g, ''),
        social_platform_new: getItemSocial(item),
        job: item.jobTitle,
        sourceName: '智能推荐',
      })) as any,
    };
    return customerInfo;
  };

  const fetchCompanyRelationStatus = useCallback(() => edmCustomsApi.getCompanyRelationStatus({ companyName: data.name, country: data.country || '' }), [data]);

  const handleAddCustomer: React.MouseEventHandler<HTMLElement> = async evt => {
    evt.stopPropagation();
    globalSearchDataTracker.trackSmartRcmdListCompanyClick({
      rcmdType: 1,
      ruleId: selectedItem?.id,
      keyword: selectedItem?.value,
      buttonName: 'record_customers',
      id: data.id,
      rank,
      companyCountry: data.country,
      companyName: data.name,
      companyId: data.companyId,
    });
    if (customerTagContent?.type !== 'customer') {
      try {
        const res = await edmCustomsApi.getCustomerInputLimit();
        if (res?.limitReached) {
          SiriusMessage.warning({ content: '已达今日录入客户上限，请明天再试' });
          return;
        }
      } catch (e) {
        // do nothing
      }
      setCustomerLoading(true);
      const [
        contactListMap,
        {
          companyId,
          // status,
        },
      ] = await Promise.all([globalSearchApi.globalSearchGetContactById([data.id]), fetchCompanyRelationStatus()]);
      showUniDrawer({
        moduleId: UniDrawerModuleId.CustomerDetail,
        moduleProps: {
          visible: true,
          source: 'smartRcmdList',
          customerData: getCustomerData(contactListMap[data.id]),
          customerId: Number(companyId) || undefined,
          onClose: () => {},
          onSuccess: () => {
            refresh?.();
          },
          relationParams: {
            country_id: data?.countryId,
            company_name_id: data?.companyNameId,
          },
        },
      });
      setCustomerLoading(false);
    }
  };

  const handleRemove: React.MouseEventHandler<HTMLElement> = async evt => {
    evt.stopPropagation();
    await globalSearchApi.doRemoveRcmdCompany({
      idList: [data.id],
      type: 0,
    });
    await onRemove?.(data, rank);
  };

  const onLeadsPost = useCallback(
    (extraFetchParams?: any) =>
      globalSearchApi.globalBatchAddLeadsV1({
        ...extraFetchParams,
        globalInfoVOList: [
          {
            id: data.id,
          },
        ],
        sourceType: 3,
      }),
    [data.id]
  );

  const {
    handleAddLeads: hookHandleAddLeads,
    setLeadsAddLoading: setLeadsLoading,
    leadsAddLoading: leadsLoading,
  } = useLeadsAdd({
    onFetch: onLeadsPost,
    refresh,
  });

  const handleViewLeads = useCallback(
    async (evt: MouseEvent) => {
      evt.stopPropagation();
      setLeadsLoading(true);
      try {
        const { leadsId } = await fetchCompanyRelationStatus();
        showUniDrawer({
          moduleId: UniDrawerModuleId.LeadsView,
          moduleProps: {
            leadsId: leadsId as any,
            visible: true,
            onClose: (shouldUpdate?: boolean) => {
              if (!shouldUpdate) return;
              refresh?.();
            },
            source: 'smartRcmdList',
          },
        });
      } catch (e) {
        // do nothing
      }
      setLeadsLoading(false);
    },
    [fetchCompanyRelationStatus, refresh]
  );

  const handleViewCustomer = useCallback(
    async (evt: MouseEvent) => {
      evt.stopPropagation();
      setCustomerLoading(true);
      try {
        const { companyId } = await fetchCompanyRelationStatus();
        showUniDrawer({
          moduleId: UniDrawerModuleId.CustomerView,
          moduleProps: {
            customerId: companyId as any,
            visible: true,
            onClose: () => {},
            source: 'smartRcmdList',
          },
        });
      } catch (e) {
        // do nothing
      }
      setCustomerLoading(false);
    },
    [fetchCompanyRelationStatus]
  );

  const handleAddLeads = useMemoizedFn(async (evt: MouseEvent) => {
    globalSearchDataTracker.trackSmartRcmdListCompanyClick({
      rcmdType: 1,
      ruleId: selectedItem?.id,
      keyword: selectedItem?.value,
      buttonName: 'record_clue',
      id: data.id,
      rank,
      companyCountry: data.country,
      companyName: data.name,
      companyId: data.companyId,
    });
    evt.stopPropagation();
    openBatchCreateLeadsModal({
      submit: ({ groupIds, isAddToGroup }) => hookHandleAddLeads({ extraFetchParams: { leadsGroupIdList: groupIds, isAddToGroup } }),
    });
  });

  return (
    <div className={styles.dropdownBtn} style={{ display: 'flex', alignItems: 'flex-end', flexDirection: 'column', width: 'fit-content' }}>
      {!customerTagContent ? (
        <ArrowDropdownButton
          onClick={handleAddLeads}
          buttonName={getIn18Text('LURUXIANSUO')}
          style={{ margin: 0, marginBottom: 12, minWidth: 113, wordBreak: 'keep-all' }}
          overlay={
            <Menu>
              <Menu.Item disabled={customerLoading}>
                <Space onClick={handleAddCustomer}>{getIn18Text('LURUKEHU')}</Space>
              </Menu.Item>
            </Menu>
          }
        />
      ) : (
        <Button
          style={{ margin: 0, marginBottom: 12, minWidth: 113, wordBreak: 'keep-all' }}
          loading={isCustomer ? customerLoading : leadsLoading}
          onClick={isCustomer ? handleViewCustomer : handleViewLeads}
          btnType="primary"
          inline
        >
          {isCustomer ? getIn18Text('CHAKANKEHU') : getIn18Text('CHAKANXIANSUO')}
        </Button>
      )}
      <Button style={{ margin: 0, minWidth: 113, wordBreak: 'keep-all' }} onClick={handleRemove} btnType="default">
        {getIn18Text('BUGANXINGQU')}
      </Button>
    </div>
  );
};

export default Oprate;
