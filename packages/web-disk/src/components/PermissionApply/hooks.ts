import React, { useState, useCallback, useEffect, useRef } from 'react';
import { apiHolder, apis, NetStorageApi, RequestGetApplyInfo, NetStorageShareApi, ResourceType } from 'api';
import { PermissionApplyInfo } from './index';

const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;

const nsShareApi = apiHolder.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;

interface PermissionApplyReq extends RequestGetApplyInfo {
  ref: string;
}

const getPermissionApplyInfoInner = (resourceId: string, resourceType: ResourceType): Promise<PermissionApplyInfo> =>
  new Promise((resolve, reject) => {
    let newPermissionApplyInfo: PermissionApplyInfo = {};
    diskApi
      .getApplyInfo({
        resourceId,
        resourceType,
      })
      .then(applyInfo => {
        newPermissionApplyInfo.applyInfo = applyInfo;

        // 如果已经在申请流程中,查询申请状态
        if (applyInfo.applyInfo) {
          newPermissionApplyInfo.applyStatus = applyInfo.applyInfo;
        }
      })
      .catch(err => {
        if (err.data?.message) {
          newPermissionApplyInfo.errMsg = err.data?.message;
        }
      })
      .finally(() => {
        resolve(newPermissionApplyInfo);
      });
  });

export const usePermissionApply = function ({ resourceId, resourceType, ref }: PermissionApplyReq, fetchFunc = () => Promise.resolve(), cb: () => void) {
  const [noPermission, setNoPermission] = useState<boolean>(false);
  const [permissionApplyInfo, setPermissionApplyInfo] = useState<PermissionApplyInfo>({});
  const [pollTimeout, setPollTimeout] = useState<any>(null);
  const lastPermissionApplyInfoRef = useRef<PermissionApplyInfo>({});

  const getPermissionApplyInfo = useCallback(() => {
    setPermissionApplyInfo({});
    getPermissionApplyInfoInner(resourceId, resourceType).then(newPermissionApplyInfo => {
      setPermissionApplyInfo(newPermissionApplyInfo);
      lastPermissionApplyInfoRef.current = newPermissionApplyInfo;
      cb();
    });
  }, [resourceId, resourceType, cb]);

  useEffect(() => {
    if (noPermission) {
      loopCheckPermission();
    } else {
      if (pollTimeout) {
        window.clearTimeout(pollTimeout);
      }
    }
    return () => {
      if (pollTimeout) {
        window.clearTimeout(pollTimeout);
      }
    };
  }, [noPermission]);

  function loopCheckPermission() {
    if (!noPermission) {
      return;
    }
    nsShareApi
      .checkShareAuth({
        resourceId: +resourceId,
        resourceType,
        ref,
      })
      .then(shareAuth => {
        if (shareAuth.roleInfos && shareAuth.roleInfos.length) {
          setPollTimeout(null);
          fetchFunc();
        } else {
          // 判断是否需要从申请状态->申请中状态
          if (!lastPermissionApplyInfoRef.current?.applyStatus) {
            getPermissionApplyInfoInner(resourceId, resourceType).then(newPermissionApplyInfo => {
              if (newPermissionApplyInfo.applyStatus) {
                setPermissionApplyInfo(newPermissionApplyInfo);
                lastPermissionApplyInfoRef.current = newPermissionApplyInfo;
              }
            });
          }
          const timeout = setTimeout(() => {
            loopCheckPermission();
          }, 2000);
          setPollTimeout(timeout);
        }
      });
  }

  return {
    noPermission,
    setNoPermission,
    permissionApplyInfo,
    getPermissionApplyInfo,
  };
};
