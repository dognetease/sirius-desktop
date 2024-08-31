import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiHolder, apis, AddressBookNewApi, EdmSendBoxApi, MarktingContactGroup } from 'api';
import { Tabs, Form, message } from 'antd';
import classnames from 'classnames/bind';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import style from './marktingConfigModal.module.scss';
// /Users/randolph/Desktop/work/sirius-desktop/packages/web-edm/src/AIHosting/components/SchemeInputBox/SchemeInputBox.tsx
import SchemeInputBox, { SchemeInputValue } from '../../../AIHosting/components/SchemeInputBox/SchemeInputBox';

const realStyle = classnames.bind(style);
const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export const MarktingGroupConfig: React.FC<{ visible: boolean; onclose(hasChange?: boolean): void; groupItem: MarktingContactGroup }> = props => {
  const { visible, onclose, groupItem } = props;

  const [marktingPlanId, setMarktingPlanId] = useState('');
  // const defaultPlanIdRef = useRef(groupItem.edm_plan_id)

  // 获取taskId
  const [taskId, setTaskId] = useState('');

  // 获取taskId
  useEffect(() => {
    edmApi.getSendBoxConf({ type: 2 }).then(result => {
      // const manualTask = result?.manualPlan === 1;
      const taskId = result.hostingTaskId || '';
      setTaskId(taskId);
    });
  }, []);

  const confirmChangeMarktingTask = async () => {
    // 如果没有变化直接提交
    if (!marktingPlanId || !marktingPlanId.length || marktingPlanId === groupItem.edm_plan_id) {
      onclose(false);
      return;
    }

    await addressBookNewApi.associateEdm([
      {
        group_id: groupItem.id,
        edm_plan_id: marktingPlanId,
      },
    ]);
    // 提交变更
    onclose(true);
  };

  const cancelPlanAssociate = async () => {
    await addressBookNewApi.cancelGroupEdm([groupItem.id]);
    onclose(true);
  };

  return (
    <Modal
      destroyOnClose
      visible={visible}
      onCancel={() => {
        onclose();
      }}
      footer={
        <div className={realStyle('footer')}>
          <Button
            btnType="minorLine"
            onClick={() => {
              onclose();
            }}
          >
            取消
          </Button>
          {groupItem.edm_plan_id && groupItem.edm_plan_id.length ? (
            <Button btnType="minorLine" onClick={cancelPlanAssociate}>
              删除规则
            </Button>
          ) : null}

          <Button btnType="primary" onClick={confirmChangeMarktingTask}>
            确定
          </Button>
        </div>
      }
      onOk={confirmChangeMarktingTask}
      title="营销托管配置"
      className={realStyle('marktingConfigWrapper')}
    >
      <>
        <div className={realStyle('tips')}>将以下分组的联系人，自动同步至营销托管进行自动营销</div>
        <Form>
          <Form.Item name="groupId" label="分组名称">
            <input type="hidden" value={groupItem.id} />
            {groupItem.group_name}
          </Form.Item>
          {taskId ? (
            <Form.Item name="marktingTaskId" label="任务ID">
              <input type="hidden" value={marktingPlanId} name="marktingTaskId" />
              <SchemeInputBox
                // showCreate
                taskId={taskId}
                defaultPlanId={groupItem.edm_plan_id}
                onChange={(params: SchemeInputValue) => {
                  setMarktingPlanId(params.schemeId);
                }}
              />
            </Form.Item>
          ) : null}
        </Form>
      </>
    </Modal>
  );
};
