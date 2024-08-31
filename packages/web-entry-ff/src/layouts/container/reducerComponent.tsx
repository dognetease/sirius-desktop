import React, { useCallback, useMemo } from 'react';
import { syncRes, SystemEvent, EntityOrg, api, ContactPersonalMarkNotifyEventData, CustomerMapChangeEvent } from 'api';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { INIT_TASK_KEY, INIT_TASK_TIME_KEY } from '@web-mail/common/constant';
import { useAppSelector, useAppDispatch, ContactActions } from '@web-common/state/createStore';
import { doGetContactListAsync, refreshContactData } from '@web-common/state/reducer/contactReducer';
import { actions as mailTabActions, MailTabModel, tabType } from '@web-common/state/reducer/mailTabReducer';

const storageApi = api.getDataStoreApi();
const systemApi = api.getSystemApi();
const ReducerComponent: React.FC = () => {
  const dispatch = useAppDispatch();
  const contactMap = useAppSelector(state => state.contactReducer.contactMap);
  const updateCallback = (e: SystemEvent) => {
    const { contact_personal: personalIdMap, contact_enterprise: enterpriseIdMap, isAll = false } = e.eventData as syncRes;
    const { _account } = e;

    if (isAll) {
      dispatch(ContactActions.doCleanContactMap());
      return;
    }

    const contactIdList = Object.keys(contactMap);
    if (contactIdList.length && (personalIdMap || enterpriseIdMap)) {
      const idList = [
        ...(personalIdMap?.insertDiff || []),
        ...(personalIdMap?.updateDiff || []),
        ...(enterpriseIdMap?.insertDiff || []),
        ...(enterpriseIdMap?.updateDiff || []),
      ];
      const deleteIdList = [...(personalIdMap?.deleteDiff || []), ...(enterpriseIdMap?.deleteDiff || [])];
      // 只更新现有的contactMap
      const refreshIdList = contactIdList.filter(id => idList.includes(id));
      // 只删除现有的
      const deleteList = contactIdList.filter(id => deleteIdList.includes(id));
      if (deleteList.length) {
        dispatch(ContactActions.doDeleteContactMap({ idList: deleteList, _account }));
      }
      if (refreshIdList.length) {
        doGetContactListAsync(refreshIdList, _account);
      }
    }
  };

  // const updateEdmCallback = (e: SystemEvent) => {
  //   const { contactList, orgList, isForce } = e.eventData as ContactEdmSyncRes;
  //   if (isForce) {
  //     dispatch(ContactActions.doCleanContactMap());
  //     return;
  //   }
  //   const contactIdList = Object.keys(contactMap);
  //   if (contactIdList.length && (contactList?.length || orgList?.length)) {
  //     const idList = [...(contactList || [])];
  //     // 只更新现有的contactMap
  //     const refreshIdList = contactIdList.filter(id => idList.includes(id));
  //     // 只删除现有的
  //     // const deleteList = contactIdList.filter(id => deleteIdList.includes(id));
  //     // if (deleteList.length) {
  //     //   dispatch(ContactActions.doDeleteContactMap(deleteList));
  //     // }
  //     // if (refreshIdList.length) {
  //     //   dispatch(doGetCustomerContactListAsync({ idList: refreshIdList, _account: e._account }));
  //     // }
  //   }
  // };

  const PersonalMarkCallback = (e: SystemEvent) => {
    const { actionType, data, noNewMarkData } = e.eventData as ContactPersonalMarkNotifyEventData;
    if (noNewMarkData) {
      return;
    }
    const emailMap = new Map<string, Set<string>>();
    const orgIdMap = new Map<string, boolean>();
    const type = actionType === 'update' ? 'add' : 'cancel';
    data?.forEach(item => {
      if (item.type === 2) {
        orgIdMap.set(item.value, actionType === 'update');
      } else if (item.type === 1) {
        item.emails?.forEach(email => {
          const contactIdSet = emailMap.get(email) || new Set<string>();
          contactIdSet.add(item.value);
          emailMap.set(email, contactIdSet);
        });
      }
    });
    if (orgIdMap.size) {
      dispatch(ContactActions.doUpdateOrgMarkedMap(orgIdMap));
    }
    if (emailMap.size) {
      dispatch(ContactActions.doUpdateEmailMarkedMap({ type, isAll: false, data: emailMap }));
    }
  };

  const customerMapChangedCallback = async (e: SystemEvent) => {
    const { target } = e.eventData as CustomerMapChangeEvent;
    if (process.env.BUILD_ISELECTRON && !systemApi.isMainWindow() && target === 'all') {
      const cleanRes = await refreshContactData();
      console.log('[ReducerComponent] refreshContactData res', cleanRes);
    }
  };

  // 支持的带参功能map
  const initTaskNameMap = useMemo(() => {
    const map = {
      // 在页签中打开特定的读信页
      readMailTab: task => {
        // 必须得延迟，由于也签订的问题，初始化的时候会覆盖激活
        setTimeout(() => {
          // 页签的内容，应该由读信页反向去填充。
          const mailTabModel: MailTabModel = {
            id: task?.id,
            title: '读信',
            type: tabType.read,
            closeable: true,
            isActive: true,
            extra: {
              accountId: '',
            },
          };
          dispatch(mailTabActions.doSetTab(mailTabModel));
        }, 1000);
      },
      atCtTab: () => {
        storageApi.putSync('atCtTab', new Date().getTime() + '');
      },
      atSdTab: () => {
        // 定位到下属页签
        storageApi.putSync('atSdTab', new Date().getTime() + '');
        storageApi.putSync('atSdMsilList', new Date().getTime() + '');
      },
    };
    return map;
  }, []);

  const filterTask = useCallback(list => list.filter(item => initTaskNameMap[item?.type]), []);

  const clearInitStorage = () => {
    storageApi.del(INIT_TASK_TIME_KEY, { noneUserRelated: true });
    storageApi.del(INIT_TASK_KEY, { noneUserRelated: true });
  };

  /**
   * 初始化的时候，根据带参链接，执行有副作用的任务
   * 仅在初始化的时候读取一次
   * warn: 必须在useMemo中，因为这样，执行时机才能在子组件挂载前&只在初始化的时候执行1次。
   * 这种操作很危险，不要在其中设置state，防止陷入渲染死循环。
   */
  useMemo(() => {
    // 查找localStroage 中是否有task类型的任务
    try {
      let task = '';
      let taskTime = '';
      const taskStorage = storageApi.getSync(INIT_TASK_KEY, { noneUserRelated: true });
      const taskTimeStorage = storageApi.getSync(INIT_TASK_TIME_KEY, { noneUserRelated: true });
      if (taskStorage?.suc) {
        task = taskStorage.data || '';
      }
      if (taskTimeStorage?.suc) {
        taskTime = taskTimeStorage.data || '';
      }
      // 如果超时则抛弃
      if (taskTime) {
        if (new Date().getTime() - new Date(+taskTime).getTime() > 60000) {
          clearInitStorage();
          return;
        }
      }
      if (task) {
        const taskList = JSON.parse(task);
        if (taskList && taskList.length) {
          const resTaskList = filterTask(taskList);
          resTaskList.forEach(item => {
            if (initTaskNameMap[item.type] && typeof initTaskNameMap[item.type] === 'function') {
              initTaskNameMap[item.type](item);
            }
          });
        }
        clearInitStorage();
      }
    } catch (e) {
      console.warn('[initTask Error]', e);
      clearInitStorage();
    }
  }, []);

  const selectOrgCallback = (e: SystemEvent) => {
    const list = e.eventData as EntityOrg[];
    dispatch(ContactActions.doUpdateOrgMap(list));
  };
  // contactAccountNotify
  useMsgRenderCallback('contactAccountNotify', e => {
    updateCallback(e);
  });
  // useMsgRenderCallback('selectContactNotify', e => {
  //   // selectCallback(e);
  // });
  useMsgRenderCallback('selectOrgNotify', e => {
    selectOrgCallback(e);
  });
  // useMsgRenderCallback('contactEdmNotify', e => {
  //   // updateEdmCallback(e);
  // });
  useMsgRenderCallback('contactPersonalMarkNotify', e => {
    PersonalMarkCallback(e);
  });
  useMsgRenderCallback('customerMapChangeNotify', e => {
    customerMapChangedCallback(e);
  });
  return null;
};
export default ReducerComponent;
