import React, { useEffect, useState, useCallback } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { ReactComponent as AlertClose } from '@/images/icons/edm/alert-close.svg';
import style from './tableFields.module.scss';
import { Checkbox } from 'antd';
const CheckboxGroup = Checkbox.Group;
import classnames from 'classnames';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DragDomWrap from './dragDom';
import { getIn18Text } from 'api';
interface optionProps {
  label: string;
  value: string;
  disabled?: boolean;
}
[];
const customerOptions = [
  { label: getIn18Text('GONGSIMINGCHENG'), value: 'company_name', disabled: true },
  { label: getIn18Text('BIAOQIAN'), value: 'label_list' },
  { label: getIn18Text('GUOJIADEQU'), value: 'area' },
  { label: getIn18Text('KEHUFENJI'), value: 'company_level' },
  { label: getIn18Text('ZHUYAOLIANXIREN'), value: 'contact_list_contact_name' },
  { label: getIn18Text('YOUXIANG'), value: 'contact_list_contact_emial' },
  { label: getIn18Text('WANGLAIYOUJIAN'), value: 'exchange_cnt' },
  { label: getIn18Text('CHUANGJIANSHIJIAN'), value: 'create_time' },
  { label: getIn18Text('ZUIJINGENJINSHIJIAN'), value: 'active_time' },
  { label: getIn18Text('KEHULAIYUAN'), value: 'source' },
  { label: getIn18Text('GONGSIJIANCHENG'), value: 'short_name' },
  { label: getIn18Text('GONGSIXINGJI'), value: 'start_level' },
  { label: getIn18Text('XUQIUCHANPINLEIXING'), value: 'require_product_type_label' },
  { label: getIn18Text('CHANPINXUQIUDU'), value: 'product_require_level_label' },
  { label: getIn18Text('WANGZHI'), value: 'website' },
  { label: getIn18Text('CHUANGJIANFANGSHI'), value: 'create_type_name' },
  { label: getIn18Text('FUZEREN'), value: 'manager_list' },
  { label: getIn18Text('NIANCAIGOUE'), value: 'purchase_amount' },
  { label: getIn18Text('GONGSIGUIMO'), value: 'scale' },
  { label: getIn18Text('ZHUYINGCHANPINXINGYE'), value: 'main_industry' },
  { label: getIn18Text('KEHUYIXIANG'), value: 'intent' },
  // { label: '操作', value: 'operation'}
];
interface ComsProps {
  visible: boolean;
  onCancel: (param?: string[]) => void;
  list: string[];
}
const TableFieldsModal: React.FC<ComsProps> = ({ visible, onCancel, list }) => {
  const [customerList, setCustomerList] = useState<string[]>(() => {
    return list.length ? list : customerOptions.map(item => item.value);
  });
  const [checkedKeys, setCheckedKeys] = useState<string[]>(() => {
    return list.length ? list : customerOptions.map(item => item.value);
  });
  const [contactsList, setContactsList] = useState<string[]>([]);
  const [customerCheckedItems, setCustomerCheckedItems] = useState<optionProps[]>([]);
  const [contactsCheckedItems, setContactsCheckedItems] = useState<optionProps[]>([]);
  /*
   *   提交事件
   */
  const formSubmit = () => {
    console.log('保存设置formsubmit', customerList);
    onCancel(customerList);
  };
  useEffect(() => {
    let listItems = customerOptions.filter(item => customerList.includes(item.value));
    let newcontactsList = [...customerList];
    const sortByProps = (a: optionProps, b: optionProps) => {
      return newcontactsList.indexOf(a.value) - newcontactsList.indexOf(b.value);
    };
    listItems.sort(sortByProps);
    setCheckedKeys(customerList);
    setCustomerCheckedItems([...listItems]);
  }, [customerList, contactsList]);
  const onCustomerChange = (keys: string[]) => {
    console.log('checkbox', keys);
    setCustomerList(keys);
  };
  const onCancelCallBack = () => {
    console.log('保存设置');
    onCancel();
  };
  // 删除联系人和客户信息
  const deleteItems = (key: string) => {
    const keys = contactsList.filter(item => item !== key);
    setContactsList(keys);
  };
  const deleteCustomerItems = (key: string) => {
    const keys = customerList.filter(item => item !== key);
    console.log('customer-delete', key, keys);
    setCustomerList(keys);
  };
  const handleMoveTab = useCallback((id: string, hoverId: string) => {
    setCustomerList(prve => {
      let list = [...prve];
      let originIndex = list.findIndex(item => item === id);
      let tagrgeIndex = list.findIndex(item => item === hoverId);
      if (originIndex > -1 && tagrgeIndex > -1) {
        [list[originIndex], list[tagrgeIndex]] = [list[tagrgeIndex], list[originIndex]];
      }
      return list;
    });
  }, []);
  return (
    <Modal
      title={getIn18Text('SHEZHIBIAOTOUZIDUAN')}
      getContainer={false}
      wrapClassName={style.tableFieldsModalWrap}
      width={520}
      onOk={formSubmit}
      bodyStyle={{
        paddingTop: 0,
        paddingBottom: 0,
      }}
      visible={visible}
      okText={getIn18Text('BAOCUNSHEZHI')}
      cancelText={getIn18Text('QUXIAO')}
      // okButtonProps={{ disabled: !status }}
      destroyOnClose={true}
      onCancel={onCancelCallBack}
    >
      <div className={style.content}>
        <div className={style.contentLeft}>
          <h1 className={style.title}>{getIn18Text('QUANBUZIDUAN')}</h1>
          <div className={style.box}>
            <h1 className={style.boxTitle}>{getIn18Text('GONGSIXINXI')}</h1>
            <CheckboxGroup options={customerOptions} value={checkedKeys} onChange={keys => onCustomerChange(keys as string[])} />
            {/* <h1 className={style.boxTitle}>联系人信息</h1>
<CheckboxGroup options={contactsOptions} value={contactsList} onChange={onContactsChange} /> */}
          </div>
        </div>
        <DndProvider backend={HTML5Backend}>
          <div className={style.contentRight}>
            <h1 className={style.title}>{getIn18Text('YIXUANZIDUAN')}</h1>
            <div className={style.box}>
              <h1 className={style.boxTitle}>{getIn18Text('GONGSIXINXI')}</h1>
              {customerCheckedItems.map((item, index) => {
                return (
                  <div key={item.value}>
                    {index === 0 ? (
                      <div className={classnames(style.boxTitle, style.boxSelectContent)} key={index}>
                        <span>{item.label}</span>
                        {/* <span onClick={ () => deleteCustomerItems(item.value) }><AlertClose /> </span> */}
                      </div>
                    ) : (
                      <DragDomWrap onDragChange={handleMoveTab} itemData={item} index={index} key={index}>
                        <div className={classnames(style.boxTitle, style.boxSelectContent)} key={index}>
                          <span style={{ cursor: 'move' }}>{item.label}</span>
                          <span onClick={() => deleteCustomerItems(item.value)}>
                            <AlertClose />{' '}
                          </span>
                        </div>
                      </DragDomWrap>
                    )}
                  </div>
                );
              })}
              {contactsList.length ? <h1 className={style.boxTitle}>{getIn18Text('LIANXIRENXINXI')}</h1> : null}
              {contactsCheckedItems.map((item, index) => {
                return (
                  // <DragDomWrap onDragChange={onDragChange} itemData={item} index = {index} key={index}>
                  <div className={classnames(style.boxTitle, style.boxSelectContent)}>
                    <span>{item.label}</span>
                    <span onClick={() => deleteItems(item.value)}>
                      <AlertClose />{' '}
                    </span>
                  </div>
                  // </DragDomWrap>
                );
              })}
            </div>
          </div>
        </DndProvider>
      </div>
    </Modal>
  );
};
export default TableFieldsModal;
