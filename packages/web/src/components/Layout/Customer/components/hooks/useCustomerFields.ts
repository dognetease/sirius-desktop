import React, { useState, useEffect } from 'react';
import { cloneDeep } from 'lodash';
import { getIn18Text } from 'api';
const repeatNumber = 1; // 查重校验
export interface formListItem {
  type: string;
  label: string;
  name: string;
  required: boolean;
  width?: number | string;
  maxLength?: number;
  message?: string;
  placeholder?: string;
  option?: {
    key: string;
    value: string;
  }[];
  selectField?: string;
  selfMessage?: string;
  isSubmit?: boolean;
  asyncCheck?: (value: string, item: any, isError: boolean) => void;
  regular?: string;
  multiple?: string;
  remote?: boolean;
  mode?: string;
  labelType?: number;
  dateFormat?: string;
  errArrMap?: {
    col: number;
    row: number;
  }[];
  isMulChecked?: boolean;
  children?: formListItem[];
}
export default (setCustomerList: ((params: any) => void) | null, setContactsData: (params: any) => void) => {
  useEffect(() => {}, []);
  const initConfig = (obj: any, customerFormList: any, customerContact: any, asyncCheck: (value: string, item: any, isError: boolean) => void) => {
    let customerList = [...customerFormList].map(item => {
      if (obj[item.name] === repeatNumber) {
        return {
          ...item,
          selfMessage: '',
          isSubmit: false,
          asyncCheck,
        };
      } else {
        if (item.children) {
          let newItem = item.children.map(child => {
            if (obj[child.name] === repeatNumber) {
              return {
                ...child,
                selfMessage: '',
                isSubmit: false,
                asyncCheck,
              };
            } else {
              return { ...child };
            }
          });
          return {
            ...item,
            children: newItem,
          };
        }
        return { ...item };
      }
    });
    console.log('...xxxx-123', customerList);
    setCustomerList && setCustomerList([...customerList]);
    let data = { ...customerContact };
    data.children.map(item => {
      if (obj[item.name] === repeatNumber) {
        item.selfMessage = '';
        item.isMulChecked = true;
        item.isSubmit = false;
        item.asyncCheck = asyncCheck;
      }
      return item;
    });
    console.log('xxxdata', data);
    setContactsData({ ...data });
  };
  const changeConfigList = (isSubmit: boolean, customerList?: any, contactsData?: any, data?: any) => {
    // 整体提交  不走接口校验
    if (isSubmit) {
      let newList = cloneDeep(customerList).map(item => {
        if (item.isSubmit === false) {
          item.isSubmit = true;
          item.selfMessage = '';
        }
        item.children &&
          item.children.map(child => {
            if (child.isSubmit === false) {
              child.isSubmit = true;
              child.selfMessage = '';
            }
          });
        return item;
      });
      setCustomerList && setCustomerList([...newList]);
      contactsData.children.map(item => {
        if (item.isSubmit === false) {
          item.isSubmit = true;
          item.selfMessage = '';
          item.errArrMap = [];
        }
        return item;
      });
      setContactsData({ ...contactsData });
      return;
    }
    // 整体校验
    else {
      const { company_name, company_domain, telephone, contact_list } = data;
      let isError = false;
      customerList.map(item => {
        item.selfMessage = '';
        if (item.name === 'company_domain' && company_domain === 'true') {
          item.selfMessage = getIn18Text('CUNZAIZHONGFUZIDUAN');
          isError = true;
        }
        if (item.name === 'telephone' && telephone === 'true') {
          item.selfMessage = getIn18Text('CUNZAIZHONGFUZIDUAN');
          isError = true;
        }
        item.children &&
          item.children.map(child => {
            child.selfMessage = '';
            if (child.name === 'company_name' && company_name === 'true') {
              child.selfMessage = getIn18Text('CUNZAIZHONGFUZIDUAN');
              isError = true;
            }
          });
      });
      setCustomerList && setCustomerList([...customerList]);
      contactsData.children.map(item => {
        if (item.name === 'whats_app' || item.name === 'home_page' || item.name === 'email') {
          let errArrMap = [] as formListItem['errArrMap'];
          contact_list.map((ele, childIndex) => {
            if (ele[item.name] === 'true') {
              isError = true;
              errArrMap &&
                errArrMap.push({
                  row: childIndex,
                  col: 0,
                });
            }
          });
          item.errArrMap = errArrMap;
          item.selfMessage = errArrMap?.length ? getIn18Text('CUNZAIZHONGFUZIDUAN') : '';
        }
        if (item.name === 'telephones') {
          let errArrMap = [] as formListItem['errArrMap'];
          contact_list.map((ele, childIndex) => {
            if (ele[item.name] && Array.isArray(ele[item.name])) {
              ele[item.name].forEach((tel, telIndex) => {
                if (tel === 'true') {
                  isError = true;
                  errArrMap &&
                    errArrMap.push({
                      row: childIndex,
                      col: telIndex,
                    });
                }
              });
            }
          });
          item.errArrMap = errArrMap;
          item.selfMessage = errArrMap?.length ? getIn18Text('CUNZAIZHONGFUZIDUAN') : '';
        }
      });
      setContactsData({ ...contactsData });
      return isError;
    }
  };
  const onFinishFailed = (customerList: any, contactsData: any) => {
    let list = customerList.map(item => {
      if (item.isSubmit) {
        item.isSubmit = false;
        item.selfMessage = '';
      }
      item.children &&
        item.children.map(child => {
          if (child.isSubmit === true) {
            child.isSubmit = false;
            item.selfMessage = '';
          }
        });
      return item;
    });
    setCustomerList && setCustomerList([...list]);
    contactsData.children.map(item => {
      if (item.isSubmit) {
        item.isSubmit = false;
        item.selfMessage = '';
        item.errArrMap = [];
      }
      return item;
    });
    setContactsData({ ...contactsData });
  };
  return {
    initConfig,
    changeConfigList,
    onFinishFailed,
  };
};
