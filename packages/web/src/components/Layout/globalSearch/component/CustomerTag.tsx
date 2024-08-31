import React, { FC, useCallback, useMemo, MouseEvent, useState, useEffect } from 'react';
import { apiHolder, apis, EdmCustomsApi, getIn18Text } from 'api';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { DataSource, UniDrawerModuleId } from '@lxunit/app-l2c-crm';
import { showUniDrawer } from '@/components/Layout/CustomsData/components/uniDrawer';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { GetCustomerAndLeadsTagRes, getCustomerAndLeadsTagInDetail, getTagResourceLabel } from '../utils';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const CustomerTag: FC<{
  tagProps: GetCustomerAndLeadsTagRes;
  companyName?: string;
  country?: string;
  refresh?: () => Promise<void>;
  source?: keyof typeof DataSource; // 用于打点
  hideTooltip?: boolean; // 用于是否截禁止Tooltip跳转
}> = ({ tagProps, companyName, country, refresh, source, hideTooltip }) => {
  const [tagState, setTagState] = useState<GetCustomerAndLeadsTagRes>(tagProps);
  const fetchStatus = useCallback(async () => {
    if (!companyName) return;
    try {
      const res = await edmCustomsApi.getCompanyRelationStatus({ companyName, country: country || '' });
      const newTagState = getCustomerAndLeadsTagInDetail(res);
      if (!newTagState) return;
      setTagState(newTagState);
    } catch (e) {
      // do nothing
    }
  }, [companyName, country]);
  const toDetail = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (tagState.type === 'leads') {
        showUniDrawer({
          moduleId: UniDrawerModuleId.LeadsView,
          moduleProps: {
            leadsId: tagState.id as any,
            visible: true,
            onClose: () => {
              if (refresh) {
                refresh();
              } else {
                fetchStatus();
              }
            },
            isOpenSea: tagState.isOpenSea,
            source,
          },
        });
      } else if (tagState.type === 'customer') {
        showUniDrawer({
          moduleId: UniDrawerModuleId.CustomerView,
          moduleProps: {
            customerId: tagState.id as any,
            visible: true,
            source,
            onClose: () => {
              if (refresh) {
                refresh();
              } else {
                fetchStatus();
              }
            },
          },
        });
      }
    },
    [tagState, fetchStatus, refresh]
  );

  const detailTitle = useMemo(
    () => `${getIn18Text('CHAKAN')}${tagState.type === 'leads' ? getIn18Text('XIANSUO') : getIn18Text('KEHU')}${getIn18Text('XIANGQING')}`,
    [tagState.type]
  );

  const TipComp = useMemo(
    () => (
      <span>
        {getIn18Text('LIAOJIEGENGDUO')}
        <span style={{ color: '#4C6AFF', cursor: 'pointer' }} onClick={toDetail}>
          {detailTitle}
        </span>
      </span>
    ),
    [toDetail, detailTitle]
  );

  useEffect(() => {
    setTagState(tagProps);
  }, [tagProps]);
  const resourceLabel = useMemo(() => getTagResourceLabel(tagProps.type, tagProps.isOpenSea), [tagProps]);
  return (
    <PrivilegeCheck accessLabel="VIEW" resourceLabel={resourceLabel}>
      {hideTooltip ? (
        tagState.title
      ) : (
        <Tooltip autoAdjustOverflow placement="bottom" title={TipComp} destroyTooltipOnHide>
          {tagState.title}
        </Tooltip>
      )}
    </PrivilegeCheck>
  );
};

export default CustomerTag;
