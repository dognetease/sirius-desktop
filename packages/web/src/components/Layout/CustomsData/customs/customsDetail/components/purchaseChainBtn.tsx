import React, { useCallback, useMemo, useState } from 'react';
import { api, apis, EdmCustomsApi, GlobalSearchApi, apiHolder } from 'api';
import { useMemoizedFn } from 'ahooks';
import { openBatchCreateLeadsModal } from '@lxunit/app-l2c-crm';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { useLeadsAdd } from '@/components/Layout/globalSearch/hook/useLeadsAdd';
import style from './purchasechain.module.scss';
import SiriusMessage from '../../../../../../../../web-common/src/components/UI/Message/SiriusMessage';
import { useIsForwarder } from '../../ForwarderSearch/useHooks/useIsForwarder';
import { Tooltip } from 'antd';

const edmCustomsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const globalSearchApi = apiHolder.api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
interface PurchaseChainBtnProp {
  list: any[];
  onCompleted?: () => void;
  tips?: string;
}
const PurchaseChainBtn: React.FC<PurchaseChainBtnProp> = ({ list, onCompleted, tips }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const isForwarder = useIsForwarder();
  const handleToggleSub = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all(
        list.map(item => {
          return edmCustomsApi
            .addCompanySub({
              country: item.country,
              companyName: item.companyName,
              originCompanyName: item.originCompanyName || item.companyName,
            })
            .then()
            .catch();
        })
      );
      setLoading(false);
      onCompleted && onCompleted();
      SiriusMessage.success({
        content: '公司订阅成功，系统将为您及时推送该公司动态',
      });
    } catch (error) {
      setLoading(false);
    }
  }, [list, loading]);
  const validList = useMemo(
    () =>
      list.map(item => ({
        name: item.companyName,
        originName: item.originCompanyName || item.companyName,
        country: item.country,
        ...(isForwarder && item.chineseCompanyId ? { chineseCompanyId: item.chineseCompanyId } : {}),
      })),
    [list, isForwarder]
  );
  const onLeadsPost = useMemoizedFn((extraParams: any) =>
    globalSearchApi.customsBatchAddLeadsV1({
      customsInfoVOList: validList,
      sourceType: 1,
      ...extraParams,
    })
  );
  const { handleAddLeads, leadsAddLoading, noLeadsWarning } = useLeadsAdd({
    onFetch: onLeadsPost,
  });
  const doAddLeads = useMemoizedFn(() => {
    if (validList.length <= 0) {
      noLeadsWarning();
      return;
    }
    openBatchCreateLeadsModal({
      submit: async ({ groupIds, isAddToGroup }) => {
        await handleAddLeads({ extraFetchParams: { leadsGroupIdList: groupIds, isAddToGroup }, selectedNum: validList.length });
        onCompleted?.();
      },
    });
  });
  return (
    <div className={style.phc}>
      <div className={style.phcGroup}>
        {tips ? (
          <Tooltip title={tips}>
            <Button disabled={loading || !!tips} style={{ background: '#fff' }} onClick={handleToggleSub} size="small">
              订阅公司
            </Button>
          </Tooltip>
        ) : (
          <Button disabled={loading} style={{ background: '#fff' }} onClick={handleToggleSub} size="small">
            订阅公司
          </Button>
        )}
        <Button disabled={leadsAddLoading} style={{ marginLeft: 0 }} onClick={doAddLeads} size="small" btnType="primary">
          录入线索
        </Button>
      </div>
    </div>
  );
};
export default PurchaseChainBtn;
