import React, { useContext, useState, useRef } from 'react';
import { EntityContact, CustomerRow, apiHolder, apis, CustomerDiscoveryApi } from 'api';
import { CustomerDiscoveryContext, ActionType, CustomerSyncType } from '../context';
// import { CustomerData } from '../components/CreateNewClientModal';
import { ConcatModalProps } from '../components/ConcatSeletModal';
import { regularCustomerTracker, SyncType } from '../report';

interface CustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (customerId?: number) => void;
  domain?: string;
}

const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;

/**
 * 老客同步、分配、标记无效等操作逻辑
 * 列表和详情公用
 * @param
 * @returns
 */
export function useCustomerSync() {
  const { dispatch } = useContext(CustomerDiscoveryContext);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const currentCustomerRow = useRef<{ row: CustomerRow; callBack?: Function } | null>(null);

  const [customerModal, setCustomerModal] = useState<CustomerModalProps>({
    visible: false,
    onClose: () => {
      const { row, callBack } = currentCustomerRow?.current || {};
      dispatch({
        type: ActionType.UpdateCustomerTableRow,
        payload: { ...row, isLoading: false },
      });
      setCustomerModal({ ...customerModal, visible: false });
      if (callBack) {
        callBack(true);
      }
    },
    onSuccess: async (customerId?: number) => {
      const { row, callBack } = currentCustomerRow?.current || {};
      const regularCustomerId = row?.regularCustomerId || '';
      try {
        dispatch({
          type: ActionType.UpdateCustomerTableRow,
          payload: { regularCustomerId, isLoading: true },
        });
        await customerDiscoveryApi.synCustomerStatus(regularCustomerId, customerId as number);
        dispatch({
          type: ActionType.UpdateCustomerTableRow,
          payload: {
            regularCustomerId,
            syncInfo: {
              type: CustomerSyncType.Company,
              referId: '',
              owner: 'self',
            },
          },
        });
        if (callBack) {
          callBack();
        }
      } finally {
        dispatch({
          type: ActionType.UpdateCustomerTableRow,
          payload: { ...row, isLoading: false },
        });
      }
      // synCustomerStatus
      // console.log('@@@ customerModal args', customerId, currentCustomerRow.current);
    },
    // onCancel: () => setCustomerModal({ ...customerModal, visible: false }),
    // onSubmit: async (customerData: CustomerData, ids: string[], callBack?: () => void) => {
    //   await customerDiscoveryApi.syncCustomer({
    //     ...customerData,
    //     regularCustomerId: ids[0] // 目前仅支持单独操作，不支持批量
    //   });
    //   setCustomerModal({ ...customerModal, visible: false });
    //   ids.forEach(regularCustomerId => {
    //     dispatch({
    //       type: ActionType.UpdateCustomerTableRow,
    //       payload: {
    //         regularCustomerId,
    //         syncInfo: {
    //           type: CustomerSyncType.Company,
    //           referId: '',
    //           owner: 'self',
    //         },
    //       }
    //     });
    //   });
    //   setSelectedRowKeys([]);
    //   if (callBack) {
    //     callBack();
    //   }
    // },
    // extrData: {}
  });

  const [contactModal, setContactModal] = useState<ConcatModalProps>({
    visible: false,
    onCancel: () => setContactModal({ ...contactModal, visible: false }),
    onConfirm: async (concatInfo: EntityContact[], ids: string[], callBack?: () => void) => {
      if (!concatInfo.length) {
        return;
      }
      await customerDiscoveryApi.assignClue(ids, concatInfo[0]?.id);
      setContactModal({ ...contactModal, visible: false });
      ids.forEach(regularCustomerId => {
        dispatch({
          type: ActionType.UpdateCustomerTableRow,
          payload: {
            regularCustomerId,
            syncInfo: {
              type: CustomerSyncType.OtherClue,
              referId: '',
              owner: 'self',
            },
          },
        });
      });
      setSelectedRowKeys([]);
      if (callBack) {
        callBack();
      }
    },
    extrData: [],
  });

  /**
   * 标记 有效/无效 状态
   * @param row tableRow
   */
  const markRecord = async (row: Partial<CustomerRow>, cancel?: boolean): Promise<{ validFlag: string }> => {
    if (row.isLoading) {
      return { validFlag: '' };
    }
    try {
      Object.assign(row, { isLoading: true });
      dispatch({ type: ActionType.UpdateCustomerTableRow, payload: row });
      const res = await customerDiscoveryApi.changeValidFlag([row.regularCustomerId as string], cancel ? 0 : 2);
      regularCustomerTracker.trackSync(cancel ? SyncType.CancelMark : SyncType.MarkInValid);
      const validFlag = res?.regularCustomerVOList?.[0]?.validFlag || '';
      dispatch({
        type: ActionType.UpdateCustomerTableRow,
        payload: { regularCustomerId: row.regularCustomerId, validFlag },
      });
      return { validFlag };
    } finally {
      dispatch({ type: ActionType.UpdateCustomerTableRow, payload: { regularCustomerId: row.regularCustomerId, isLoading: false } });
    }
  };

  /**
   * 同步操作
   * @param key 同步类型
   * @param row tableRow
   */
  const syncRecord = async (key: CustomerSyncType, row: CustomerRow, callBack?: (isCancel: boolean) => void) => {
    if (row.isLoading) {
      return;
    }
    if (key === CustomerSyncType.Company) {
      regularCustomerTracker.trackSync(SyncType.Company);
      dispatch({
        type: ActionType.UpdateCustomerTableRow,
        payload: { ...row, isLoading: true },
      });
      // 同步客户
      currentCustomerRow.current = {
        row,
        callBack,
      };
      setCustomerModal({
        ...customerModal,
        visible: true,
        domain: row.regularCustomerDomain || '',
      });
      return;
    }

    try {
      Object.assign(row, { isLoading: true });
      dispatch({ type: ActionType.UpdateCustomerTableRow, payload: row });
      await customerDiscoveryApi.syncClue([row.regularCustomerId]);
      regularCustomerTracker.trackSync(SyncType.Clue);
      const syncInfo = { referId: '', owner: 'self', type: key };
      dispatch({ type: ActionType.UpdateCustomerTableRow, payload: { regularCustomerId: row.regularCustomerId, syncInfo } });
      if (callBack) {
        callBack(false);
      }
    } finally {
      dispatch({ type: ActionType.UpdateCustomerTableRow, payload: { regularCustomerId: row.regularCustomerId, isLoading: false } });
    }
  };

  // 分配操作
  const assignRecord = async (row: CustomerRow, type: CustomerSyncType, callBack?: () => void) => {
    try {
      Object.assign(row, { isLoading: true });
      dispatch({ type: ActionType.UpdateCustomerTableRow, payload: row });
      if (type === CustomerSyncType.OpenSea) {
        // 分配公海
        await await customerDiscoveryApi.syncOpenSea([row.regularCustomerId]);
        regularCustomerTracker.trackSync(SyncType.OpenSea);
        const syncInfo = { referId: '', owner: 'self', type };
        dispatch({ type: ActionType.UpdateCustomerTableRow, payload: { regularCustomerId: row.regularCustomerId, syncInfo } });
        if (callBack) {
          callBack();
        }
        return;
      }
      // 分配线索 需要选择联系人
      regularCustomerTracker.trackSync(SyncType.OtherClue);
      setContactModal({
        ...contactModal,
        visible: true,
        extrData: [row.regularCustomerId],
        callBack,
      });
    } finally {
      dispatch({ type: ActionType.UpdateCustomerTableRow, payload: { regularCustomerId: row.regularCustomerId, isLoading: false } });
    }
  };

  /**
   * 批量操作标记为无效
   * @returns
   */
  let betchLock = false;
  const betchMarkRecord = async () => {
    try {
      if (!selectedRowKeys.length || betchLock) {
        return;
      }
      setBatchLoading(true);
      betchLock = true;
      await customerDiscoveryApi.changeValidFlag(selectedRowKeys as string[], 2);
      setSelectedRowKeys([]);
    } finally {
      setBatchLoading(false);
      betchLock = false;
    }
  };

  /**
   * 批量同步
   * @returns
   */
  const betchSyncRecord = async (type: CustomerSyncType) => {
    try {
      if (!selectedRowKeys.length || betchLock) {
        return;
      }
      setBatchLoading(true);
      betchLock = true;
      if (type === CustomerSyncType.Clue) {
        // 同步线索
        await customerDiscoveryApi.syncClue(selectedRowKeys as string[]);
        const syncInfo = { owner: 'self', type };
        selectedRowKeys.forEach(regularCustomerId => {
          dispatch({ type: ActionType.UpdateCustomerTableRow, payload: { regularCustomerId, syncInfo } });
        });
        setSelectedRowKeys([]);
        return;
      }
    } finally {
      setBatchLoading(false);
      betchLock = false;
    }
  };

  /**
   * 批量分配
   * @returns
   */
  const betchAssignRecord = async (type: CustomerSyncType) => {
    try {
      if (!selectedRowKeys.length || betchLock) {
        return;
      }
      setBatchLoading(true);
      betchLock = true;
      if (type === CustomerSyncType.OpenSea) {
        // 批量分配公海
        await customerDiscoveryApi.syncOpenSea(selectedRowKeys as string[]);
        const syncInfo = { owner: 'self', type };
        selectedRowKeys.forEach(regularCustomerId => {
          dispatch({ type: ActionType.UpdateCustomerTableRow, payload: { regularCustomerId, syncInfo } });
        });
        setSelectedRowKeys([]);
        return;
      }
      // 分配指定人 需选择联系人
      setContactModal({ ...contactModal, visible: true, extrData: selectedRowKeys });
    } finally {
      setBatchLoading(false);
      betchLock = false;
    }
  };

  return {
    markRecord,
    syncRecord,
    assignRecord,
    betchMarkRecord,
    betchSyncRecord,
    betchAssignRecord,
    customerModal,
    contactModal,
    batchLoading,
    selectedRowKeys,
    setSelectedRowKeys,
  };
}
