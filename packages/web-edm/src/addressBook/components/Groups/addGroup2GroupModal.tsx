import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiHolder, apis, AddressBookNewApi, EdmSendBoxApi, MarktingContactGroup } from 'api';
import { Tabs, Form, Select, message } from 'antd';
import classnames from 'classnames/bind';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './marktingConfigModal.module.scss';
// /Users/randolph/Desktop/work/sirius-desktop/packages/web-edm/src/AIHosting/components/SchemeInputBox/SchemeInputBox.tsx
import SchemeInputBox, { SchemeInputValue } from '../../../AIHosting/components/SchemeInputBox/SchemeInputBox';
import { CheckboxSelect } from '../CheckboxSelect/index';

const realStyle = classnames.bind(style);
const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;

export const AddGroup2GroupModal: React.FC<{ visible: boolean; onclose(hasChange?: boolean): void; groupItem: MarktingContactGroup }> = props => {
  const { visible, onclose, groupItem } = props;

  const [form] = Form.useForm<{
    groupIds: number[];
  }>();

  // const checkedOptionsRef = useRef<Set<number>>(new Set());

  const [groupOptions, setGroupOptions] = useState<MarktingContactGroup[]>([]);

  useEffect(() => {
    addressBookNewApi.getGroupList({ group_type: 1 }).then(list => {
      setGroupOptions(list);
    });
  }, []);

  const confirmAddGroups = async () => {
    const { groupIds } = await form.validateFields();

    // todotianjia
    await addressBookNewApi.addGroup2Group({
      src_group_id: groupItem.id,
      target_group_ids: groupIds,
    });
    if (groupItem.count > 100) {
      message.success('添加分组成功,请稍后刷新分组列表');
    }
    // 提交变更
    onclose(true);
  };

  const addGroup = async (label: string) => {
    const groupItem = await addressBookNewApi.createGroup(label);
    setGroupOptions(list => {
      return [...list, groupItem];
    });
    return {
      id: groupItem.id,
      label: groupItem.group_name,
    };
  };

  const checkOption = (item: { id: number; label: string }, checked: boolean) => {
    // checkedOptionsRef.current[checked ? 'add' : 'delete'](item.id);
    // setTimeout(() => {
    //   form.validateFields();
    // }, 0);
  };

  const uncheckall = () => {
    // checkedOptionsRef.current.clear();
  };

  const onSelectChanged = (val: number[]) => {
    // console.log('xxxxy', val, checkedOptionsRef.current);
    // 数据发生变化 重新执行校验(YJYX-2185  【营销联系人】添加至分组必填项校验问题，如图) 错误提示要消失
    form.validateFields();
  };

  return (
    <Modal
      destroyOnClose
      visible={visible}
      onCancel={() => {
        onclose();
      }}
      className={realStyle(style.addGroupWrapper)}
      onOk={confirmAddGroups}
      title={`将【${groupItem.group_name}】的${groupItem.count}个联系人添加至分组`}
    >
      <>
        <div className={realStyle(style.addGroupTips)}>添加至新分组后，联系人仍会展示在原分组中</div>
        <Form className={realStyle('marktingConfigWrapper')} form={form}>
          <Form.Item name="groupIds" label="分组" rules={[{ required: true, message: '请选择分组' }]}>
            <CheckboxSelect
              options={groupOptions.map(item => {
                return { id: item.id, label: item.group_name };
              })}
              addGroup={addGroup}
              checkOption={checkOption}
              uncheckAll={uncheckall}
              onAsyncChange={onSelectChanged}
            />
          </Form.Item>
        </Form>
      </>
    </Modal>
  );
};
