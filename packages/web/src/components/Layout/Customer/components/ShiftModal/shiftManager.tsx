import React, { useEffect, useState, useRef } from 'react';
import { Form } from 'antd';
import Modal from '@/components/Layout/components/Modal/modal';
import style from './shiftManager.module.scss';
import { apiHolder, apis, CustomerApi, ContactApi } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const contactApi = apiHolder.api.requireLogicalApi('contactApi') as ContactApi;
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import { cloneDeep, debounce } from 'lodash';
import ReactDOM from 'react-dom';
import { getIn18Text } from 'api';
interface optionItem {
  label: string;
  value: string;
  disable?: boolean;
}
interface manager extends optionItem {
  key: string;
}
interface finishValue {
  manager: manager;
}
interface SelectItem {
  id: string;
  name: string;
}
interface ComsProps {
  visible: boolean;
  onCancel: (param?: boolean) => void;
  onSuccess?: (param?: boolean) => void;
  data: SelectItem[];
  shiftType: 'shift' | 'add';
  modalType?: 'company' | 'clue';
  currentManagers?: Set<string>;
}
const ShiftManager: React.FC<ComsProps> = ({ visible, onCancel, onSuccess, data, shiftType, modalType, currentManagers }) => {
  const [form] = Form.useForm();
  let [status, setStatus] = useState<string>();
  const [optionList, setOption] = useState<optionItem[]>([]);
  const originOptions = useRef<optionItem[]>([]);
  const [contactIds, setContactIds] = useState<string[]>();

  useEffect(() => {
    let param = { productId: 'fastmail', productVersionId: 'professional' };
    clientApi.getCustomerAccount(param).then(res => {
      console.log('waimao-contacts-1', res.members);
      let list = res?.members.map(item => item.memberAccId);
      setContactIds(list);
    });
  }, []);
  useEffect(() => {
    if (contactIds && contactIds.length) {
      contactApi.doGetContactById(contactIds).then(res => {
        console.log('res-contact-list', res);
        originOptions.current = res.map(item => {
          const { id, accountName, contactName } = item.contact;
          return {
            value: id,
            label: `${contactName}(${accountName})`,
            disable: currentManagers && currentManagers.has(id),
          };
        });
        // 默认截取前两百个数据
        setOption(cloneDeep(originOptions.current.slice(0, 200)));
      });
    }
  }, [contactIds, currentManagers]);
  /*
   *   提交事件
   */
  const formSubmit = () => {
    form.submit();
  };
  /*
   * onCancelCallBack
   */
  const clueChange = type => {
    if (Array.isArray(type) && !type.length) {
      setOption(cloneDeep(originOptions.current.slice(0, 200)));
    }
    setStatus(type);
  };
  const onCancelCallBack = () => {
    onCancel();
  };
  const onFinish = (values: finishValue) => {
    const { label, value } = values.manager;
    if (shiftType === 'shift') {
      let params = {
        ids: data.map(item => item.id),
        manager: {
          id: value,
          name: label.split('(')[0],
        },
      };
      if (modalType === 'company') {
        clientApi.transferCustomerManager(params).then(res => {
          SiriusMessage.success({
            content: getIn18Text('ZHUANYICHENGGONG'),
          });
          onCancel(true);
        });
      }
      if (modalType === 'clue') {
        clientApi.transferClueManager(params).then(res => {
          SiriusMessage.success({
            content: getIn18Text('ZHUANYICHENGGONG'),
          });
          onCancel(true);
        });
      }
    }
    if (shiftType === 'add' && modalType === 'company') {
      let params = {
        ids: data.map(item => item.id),
        managerList: [],
      };
      const reg = /^(.+)\((.+)\)$/;
      params.managerList = values.manager.map(item => {
        const matched = item.label.match(reg);
        return {
          id: item.value,
          name: Array.isArray(matched) ? matched[1] || item.label : item.label,
          email: Array.isArray(matched) ? matched[2] || '' : '',
        };
      });
      clientApi.addCustomerManager(params).then(res => {
        SiriusMessage.success({
          content: getIn18Text('TIANJIAFUZERENCHENGGONG'),
        });
        if (onSuccess) {
          onSuccess();
        }
        onCancel(true);
      });
    }
  };
  const searchOptions = (value: string) => {
    if (value) {
      let list = cloneDeep(originOptions.current.filter(item => item.label.includes(value)));
      setOption([...list.slice(0, 200)]);
    } else {
      setOption(cloneDeep(originOptions.current.slice(0, 200)));
    }
  };
  const renderText = () => {
    console.log('data-list', data);
    if (data.length === 1) {
      return data[0].name;
    } else {
      return `选中${data.length}${modalType === 'company' ? getIn18Text('GEKEHU') : getIn18Text('TIAOXIANSUO')}`;
    }
  };
  const config = () => {
    let layout = {} as any;
    if (shiftType === 'add') {
      layout.mode = 'multiple';
      layout.maxTagCount = 'responsive';
    }
    return layout;
  };
  return (
    <Modal
      title={shiftType === 'add' ? getIn18Text('TIANJIA') + getIn18Text('FUZEREN') : getIn18Text('ZHUANYI') + getIn18Text('FUZEREN')}
      // getContainer={false}
      wrapClassName={style.clueModalWrap}
      width={480}
      onOk={formSubmit}
      bodyStyle={{
        paddingTop: 0,
        paddingBottom: 0,
      }}
      visible={visible}
      okText={getIn18Text('QUEDING')}
      cancelText={getIn18Text('QUXIAO')}
      okButtonProps={{ disabled: !status }}
      destroyOnClose={true}
      onCancel={onCancelCallBack}
    >
      <div className={style.content}>
        <Form form={form} onFinish={onFinish} labelAlign="left" autoComplete="off">
          <div className={style.inner}>
            <Form.Item label={getIn18Text('XUANZHONG')}>
              <div className={style.title}>{renderText()}</div>
            </Form.Item>
            <Form.Item label={shiftType === 'add' ? getIn18Text('TIANJIAGEI') : getIn18Text('ZHUANYIGEI')} className={style.selectItem} name="manager">
              <Select
                placeholder={getIn18Text('QINGXUANZEFUZEREN')}
                style={{ width: '100%' }}
                onChange={clueChange}
                labelInValue={true}
                filterOption={false}
                {...config()}
                di
                showSearch
                onSearch={debounce(searchOptions, 1000)}
              >
                {optionList.map(v => (
                  <Select.Option value={v.value} key={v.value} disabled={v.disable}>
                    {v.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
ShiftManager.defaultProps = {
  modalType: 'company',
};
export default ShiftManager;
export const createShiftManagerModal = (props: Omit<ComsProps, 'visible'>, container?: HTMLElement) => {
  // console.log('shiftManagerModal', 'open', props);
  const div = document.createElement('div');
  const parent = container || document.body;
  const destroy = () => {
    ReactDOM.unmountComponentAtNode(div);
    parent.removeChild(div);
  };
  const options: ComsProps = {
    ...props,
    visible: true,
    onCancel(isSuccess?: boolean) {
      props.onCancel(isSuccess);
      destroy();
    },
  };
  parent.appendChild(div);
  // eslint-disable-next-line react/jsx-props-no-spreading
  ReactDOM.render(<ShiftManager {...options} />, div);
  return destroy;
};
