import React, { useState, useEffect, useCallback } from 'react';
import { Form, Select, message, Tag } from 'antd';
import { apiHolder, apis, AddressBookApi, AddressBookNewApi, MarktingContactGroup, EdmSendBoxApi } from 'api';
import style from './createAutoMarktingTask.module.scss';
import classnames from 'classnames/bind';
// import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import { ReactComponent as FoldAdd } from '@/images/icons/contact/fold_add.svg';
import SchemeInputBox, { SchemeInputValue } from '../../../AIHosting/components/SchemeInputBox/SchemeInputBox';
// import { EnhanceSelect } from '@web-common/components/UI/Select/index';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
import lodashGet from 'lodash/get';
import { setRefreshParams } from '../../utils';
import { ReactComponent as TongyongShanchu } from '@web-common/images/newIcon/tongyong_shanchu.svg';

const realStyle = classnames.bind(style);
const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

interface AutoMarktingGroupSelectProps {
  options: { label: string; value: number }[];
  totalOptions: { label: string; value: number }[];
  onChange: (val: number | undefined, options: { label: string; value: number }[]) => void;
}

export const AutoMarktingGroupSelect: React.FC<AutoMarktingGroupSelectProps> = props => {
  const { options, totalOptions, onChange } = props;
  const [value, setValue] = useState<number[]>([]);
  const tagRender = useCallback(
    props => {
      const { label, value, closable, onClose } = props;

      const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
        event.preventDefault();
        event.stopPropagation();
      };

      const text =
        totalOptions.find(item => {
          return item.value === value;
        })?.label || value;

      return (
        <Tag color={'blue'} onMouseDown={onPreventMouseDown} closable={closable} onClose={onClose} style={{ marginRight: 3 }}>
          {text}
        </Tag>
      );
    },
    [totalOptions.length]
  );

  const onGroupChange = (val: number[]) => {
    let currentVal: undefined | number = undefined;
    if (val.length >= 1) {
      currentVal = val.pop();
    }
    setValue(currentVal ? [currentVal] : []);
    props.onChange && props.onChange(currentVal, options);
  };
  return <Select placeholder="请选择联系人分组" options={options} value={value} mode="tags" tagRender={tagRender} allowClear={true} onChange={onGroupChange}></Select>;
};

// 创建自动营销托管任务
export const CreateAutoMarktingTask: React.FC<{}> = props => {
  const [showModal, setShowModal] = useState(false);

  const [groups, setGroups] = useState<{ value: number; label: string }[]>([]);

  const [taskId, setTaskId] = useState<string | null>(null);

  const [checkedGroupIds, setCheckedGroupIds] = useState<number[]>([]);

  const [form] = Form.useForm<{
    users: {
      groupId: number;
      planInfo: {
        schemeId: string;
        [key: string]: string;
      };
    }[];
  }>();

  useEffect(() => {
    if (!showModal) {
      return;
    }
    // 获取分组数据
    addressBookNewApi.getGroupList({}).then(list => {
      const options: { value: number; label: string }[] = [];
      list.forEach(item => {
        if (item.edm_plan_id && item.edm_plan_id.length) {
          return;
        }
        options.push({ value: item.id, label: item.group_name });
      });
      setGroups(options);
    });
    // 获取TaskId
    edmApi.getSendBoxConf({ type: 2 }).then(result => {
      // const manualTask = result?.manualPlan === 1;
      const taskId = result.hostingTaskId || '';
      setTaskId(taskId);
    });
  }, [showModal]);

  // 弹窗关闭之后重置所有的数据
  useEffect(() => {
    if (showModal) {
      return;
    }
    form.resetFields();
    setGroups([]);
    setCheckedGroupIds([]);
  }, [showModal]);

  const onconfirm = async () => {
    // 校验所有的提交提交
    const values = await form.validateFields();
    console.log('[createAutoMarktingTask]onconfirm', values);
    await addressBookNewApi.associateEdm(
      values.users.map(item => {
        return {
          group_id: item.groupId,
          edm_plan_id: item.planInfo.schemeId,
        };
      })
    );
    // 调用接口进行提交
    setShowModal(false);
    setRefreshParams('groups');
    message.success('创建成功');
  };

  // groupId不可以重复

  const onGroupChange = (...args: unknown[]) => {
    console.log('hahahah-change', args);
    const list: { groupId: number }[] = form.getFieldValue('users');
    setCheckedGroupIds(
      list
        .filter(item => {
          return item.groupId;
        })
        .map(item => {
          return item.groupId;
        })
    );
  };

  return (
    <>
      <span
        className={realStyle('autoMarktingOpertion')}
        onClick={() => {
          setShowModal(true);
        }}
      >
        <span className={realStyle('icon')}></span>
        自动同步营销托管
      </span>

      <Modal
        destroyOnClose
        visible={showModal}
        title="自动同步至营销托管"
        onOk={onconfirm}
        onCancel={() => {
          setShowModal(false);
        }}
        headerBottomLine={false}
        footerTopLine={false}
        className={realStyle('createMarktingRuleWrapepr')}
      >
        <>
          <p className={realStyle('tip')}>将以下标签的联系人 自动同步至营销托管进行自动营销</p>
          {/* 规则列表 */}
          <Form form={form} labelAlign="right" labelCol={{ span: 6 }} className={realStyle('form')}>
            <Form.List name="users" initialValue={[{ planInfo: {} }]}>
              {(formlist, { add, remove }) => {
                return (
                  <>
                    {/* 规则遍历 */}
                    {formlist.map((item, index) => {
                      return (
                        <div className={realStyle('ruleItem')} key={item.key}>
                          {formlist.length > 1 ? (
                            <div className={realStyle('ruleAndRemove')}>
                              <span className={realStyle('serialNum')}>规则{index + 1}:</span>
                              <span
                                onClick={() => {
                                  remove(item.name);
                                  // 删除之后当前分组可以被选择
                                  onGroupChange(undefined, []);
                                }}
                                className={realStyle('removeRuleIcon', { visible: index !== 0 })}
                              >
                                <TongyongShanchu />
                                删除
                              </span>
                            </div>
                          ) : null}
                          <Form.Item name={[item.name, 'groupId']} rules={[{ required: true, message: '请选择联系人分组' }]} label="联系人分组">
                            {/* <AutoMarktingGroupSelect
                              options={groups.filter(item => {
                                return !checkedGroupIds.includes(item.value);
                              })}
                              totalOptions={groups.}
                              onChange={onGroupChange}
                            /> */}
                            <EnhanceSelect
                              placeholder="请选择联系人分组"
                              allowClear={true}
                              options={groups.map(item => {
                                return {
                                  value: item.value,
                                  label: item.label,
                                  className: realStyle('autoMarktingTaskGroupOptions'),
                                  disabled: checkedGroupIds.includes(item.value),
                                };
                              })}
                              onChange={onGroupChange}
                            ></EnhanceSelect>
                          </Form.Item>
                          <Form.Item name={[item.name, 'planInfo']} rules={[{ required: true, message: '请选择方案' }]} label="营销托管任务">
                            {taskId ? (
                              <SchemeInputBox
                                taskId={taskId}
                                onChange={(...args) => {
                                  console.log('hahahaha', args);
                                }}
                              />
                            ) : null}
                          </Form.Item>
                        </div>
                      );
                    })}

                    {/* 移除规则 */}
                    <div
                      onClick={() => {
                        add();
                      }}
                      className={realStyle('addRuleOperation')}
                    >
                      <FoldAdd />
                      新增规则
                    </div>
                  </>
                );
              }}
            </Form.List>
          </Form>
        </>
      </Modal>
    </>
  );
};
