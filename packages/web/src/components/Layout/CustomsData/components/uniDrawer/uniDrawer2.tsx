// 封装UNI的：新建商机弹窗，商机详情弹窗，认领公海客户，退回公海
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  showCustomerBackToOpenseaModal,
  showOpenseaCustomerReceiveModal,
  SirusExternalBusinessCreate,
  SirusExternalBusinessDetail,
  setUpL2cConf,
  setHttpConfig,
} from '@lxunit/app-l2c-crm';
import { OpportunityBaseInfo } from 'api';
import { config } from 'env_def';

// 退回公海弹窗，是一个方法
export const customerBackToOpenseaModal = (companyId: string, callback?: () => void) => {
  try {
    showCustomerBackToOpenseaModal(companyId, callback);
  } catch (err) {
    console.log('[showCustomerBackToOpenseaModal] err:', err);
  }
};
// 公海客户，认领为客户
export const openseaCustomerReceiveModal = (id: string, callback?: () => void) => {
  try {
    showOpenseaCustomerReceiveModal(id, callback);
  } catch (err) {
    console.log('[showOpenseaCustomerReceiveModal] err:', err);
  }
};

const isWeb = config('build_for') === 'web';
const host: string = isWeb ? '' : (config('host') as string);
const stage = config('stage');
setUpL2cConf({
  isProduction: stage === 'prod',
});
// 临时解决
setHttpConfig({
  httpHost: host,
} as any);

export interface UniDrawerOpportunityProps {
  visible: boolean;
  type?: 'add' | 'detail'; // 新建商机和查看商机详情两个
  companyId?: string; // 新建商机传入的客户ID
  companyName?: string; // 新建商机传入的客户名称
  detail?: OpportunityBaseInfo; // 查看商机详情的时候，传入商机详情数据
  onClose?: (shouleUpdate?: boolean) => void; // 关闭弹窗，如果是商机详情，会有shouleUpdate标识是否需要更新
  onSuccess?: () => void;
}

/**
 * @deprecated
 * 商机弹窗：新建商机和商机详情
 * 邮件+相关的引用已经在 jjw-edm-1010 删除，目前已经没有调用方了，方法在1010版本分支合并后移除
 * @param prop
 * @returns
 */
export const UniDrawerOpportunity = (prop: UniDrawerOpportunityProps) => {
  const { visible, type, companyId, companyName, detail, onClose, onSuccess } = prop;

  if (!visible) {
    return null;
  }
  // 新建商机
  if (type === 'add') {
    return (
      <SirusExternalBusinessCreate
        sourceId="1"
        open={visible}
        onClose={() => {
          onClose && onClose();
        }}
        extraParams={{
          company_id: companyId,
          company_name: companyName,
        }}
        afterSubmit={() => {
          console.log('商机创建成功');
          onSuccess && onSuccess();
        }}
      />
    );
  }
  // 商机详情
  if (type === 'detail') {
    return (
      <SirusExternalBusinessDetail
        sourceId="1"
        open={visible}
        onClose={(shouleUpdate: any) => {
          onClose && onClose(!!shouleUpdate);
        }}
        detail={detail}
      />
    );
  }
  return null;
};
