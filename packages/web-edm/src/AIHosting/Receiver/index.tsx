import React, { useEffect, useState, useRef, useImperativeHandle, useMemo, useReducer } from 'react';
import { SendStepProps, ReceiverInfoModel, EdmSendConcatInfo, apiHolder, apis, EdmSendBoxApi, ResponseEdmDraftInfo, DataStoreApi } from 'api';
// import { AddContactModal } from '../../send/ReceiverSettingNew/addContact';
import { AddContactModal } from '../../send/ReceiverSettingDrawer/addContact';
import { edmDataTracker } from '../../tracker/tracker';

import { edmWriteContext, EmptyContactType, IEdmWriteState, writeContextReducer } from '../../send/edmWriteContext';
import { userGuideReducer, UserGuideContext } from '../../components/UserGuide/context';
import { ResultByStatus } from '../../send/validEmailAddress';
import { guardString } from '../../utils';
interface ReceiverSettingProps {
  // qs: Record<string, string>
  containerHeight: number;
  receivers?: EdmSendConcatInfo[];
  sendReceivers: (receivers: EdmSendConcatInfo[], directSend?: boolean) => void;
  // capacity: number;
  onClose?: (type?: string) => void;
  sourceFrom?: 'hostingManage' | 'hostingIndex' | 'global_search';
  directCheck?: boolean;
  businessType?: string;
  draftId?: string;

  // 大数据那边会根据这个返回结果, 做逻辑, 所以这一块的改造, 还是得按照这个数据返回
  onSendAll?: (all: Map<string, string[]>, remove: string[], checkResult?: ValidateResult) => void;
  onCancelFilterAndSend?: () => void;
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

export const AddContact = React.forwardRef((props: SendStepProps & ReceiverSettingProps, ref) => {
  const { visible, directCheck = false, containerHeight, receivers, sendReceivers, onClose, sourceFrom, onSendAll, onCancelFilterAndSend, businessType, draftId } = props;
  const [addContactVisible, setAddContactVisible] = useState<boolean>(false);
  console.log('containerHeight=========', containerHeight);
  // 当前处于的过滤收件人模式
  // const [receiveType, setReceiveType] = useState<'normal' | 'filter'>('filter');
  const [newReceivers, setNewReceivers] = useState<EdmSendConcatInfo[]>(receivers || []);
  // 实际发送人数限制 ===过滤数
  // const [filterCapacity, setFilterCapacity] = useState<ResponseEdmDraftInfo>();
  const addContactRef1 = useRef<any>();

  const [state, dispatch] = useReducer(writeContextReducer, {
    currentStage: 0,
    canSend: false,
    isReady: false,
    editorCreated: false,
    draftId: props.draftId,
    edmEmailId: undefined,
    emptyContactType: dataStoreApi.getSync('EmptyContactSetting').data || EmptyContactType.Email,
    templateParamsFromEditor: [] as unknown,
  } as IEdmWriteState);
  const [userGuideState, userGuideDispatch] = useReducer(userGuideReducer, { currentStep: -1, shouldShow: false, hasOperate: false, guideState: 'unknow' });

  const getDraftId = async () => {
    var id = '';
    if (guardString(props.draftId)) {
      id = props.draftId || '';
    } else {
      id = await edmApi.createDraft();
    }

    dispatch({
      type: 'setState',
      payload: { draftId: id },
    });
  };

  const getSendCapacity = () => {
    edmApi.getSendCount().then(data => {
      // setFilterCapacity(data)
      dispatch({
        type: 'setState',
        payload: {
          sendCapacity: data,
        },
      });
    });
  };

  useImperativeHandle(ref, () => ({
    closeAllModal() {
      return addContactRef1.current?.closeAllModal();
    },
    getShowValidateEmailModal() {
      return addContactRef1.current?.getShowValidateEmailModal() || false;
    },
  }));

  useEffect(() => {
    if (visible) {
      getDraftId();
      getSendCapacity();
    }
    setAddContactVisible(visible);
  }, [visible]);

  return (
    <>
      <UserGuideContext.Provider value={{ state: userGuideState, dispatch: userGuideDispatch }}>
        <edmWriteContext.Provider value={{ value: { state, dispatch } }}>
          {addContactVisible && (
            <AddContactModal
              visible={addContactVisible}
              directCheck={directCheck}
              closeModal={(directSend, notDestroy) => {
                // setAddContactVisible 是局部销毁添加联系人页面
                // onClose 是彻底销毁，当过滤时，需要局部销毁，否则receivers 会重置
                setAddContactVisible(false);
                if (!notDestroy) {
                  onClose && onClose(directSend);
                }
              }}
              containerHeight={containerHeight}
              hasVariable={false}
              receivers={receivers}
              capacity={state.sendCapacity ? state.sendCapacity.availableSendCount : 1000}
              receiveType={'filter'}
              sendReceivers={(receivers, directSend, needSave, checkResult) => {
                if (onSendAll) {
                  if (directSend) {
                    onCancelFilterAndSend && onCancelFilterAndSend();
                  } else {
                    let result: ResultByStatus = addContactRef1.current?.fetchResultByStatus();
                    if (result) {
                      onSendAll(result.all, result.remove, result.checkResult);
                    }
                  }
                } else {
                  if (needSave) {
                    sendReceivers(receivers, directSend);
                  }
                }
              }}
              ref={addContactRef1}
              showFilterTips={false}
              needCheckAllLogic={false}
              sourceFrom={sourceFrom}
              businessType={businessType}
              controlAddContactModal={setAddContactVisible}
            />
          )}
        </edmWriteContext.Provider>
      </UserGuideContext.Provider>
    </>
  );
});
