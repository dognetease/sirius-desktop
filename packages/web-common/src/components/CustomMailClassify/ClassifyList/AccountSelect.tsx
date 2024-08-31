/*
 * @Author: your name
 * @Date: 2022-03-21 16:04:10
 * @LastEditTime: 2022-03-24 15:16:01
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web-setting/src/Mail/components/CustomMailClassify/ClassifyList/ClassifyList.tsx
 */
import React, { useState, useCallback, useEffect, useRef, ReactElement } from 'react';
import { Select, Checkbox } from 'antd';
import classnames from 'classnames';
import TriangleDownIcon from '@web-common/components/UI/Icons/svgs/TriangleDown';
import TagCloseIcon from '@web-common/components/UI/Icons/svgs/TagCloseSvg';
import { apiHolder as api, SystemApi } from 'api';
import listStyle from './classifyList.module.scss';
import { getIn18Text } from 'api';
const { Option } = Select;
interface Props {
  selectedAccount: string[];
  setSelectedAccount: React.Dispatch<React.SetStateAction<string[]>>;
}
const systemApi: SystemApi = api.api.getSystemApi();
const AccountSelect: React.FC<Props> = ({ selectedAccount, setSelectedAccount }) => {
  const selectRef = useRef(null);
  const optionsList = (systemApi.getCurrentUser()?.prop?.accountAlias || []) as string[];
  const handleChange = (account: string) => {
    setSelectedAccount((selectedAccount: string[]) => {
      if (selectedAccount.includes(account)) {
        return selectedAccount.filter(i => i !== account);
      }
      return selectedAccount.concat(account);
    });
  };
  const selectAll = () => {
    setSelectedAccount((selectedAccount: string[]) => {
      if (selectedAccount.length === optionsList.length) {
        return [];
      }
      return optionsList.slice(0);
    });
  };
  const dropdownRender = () => {
    return (
      <div className={classnames(listStyle.optionWrapper)}>
        <div className={classnames(listStyle.option)} onClick={selectAll} hidden={!optionsList.length}>
          <Checkbox checked={selectedAccount.length === optionsList.length} />
          <span>
            {getIn18Text('YIXUAN')}({selectedAccount.length})
          </span>
        </div>
        {optionsList.map(account => {
          return (
            <div
              className={classnames(listStyle.option)}
              onClick={() => {
                handleChange(account);
              }}
            >
              <Checkbox key={account} checked={selectedAccount.includes(account)} />
              <span>{account}</span>
            </div>
          );
        })}
      </div>
    );
  };
  const onDeselect = (account: string) => {
    setSelectedAccount((selectedAccount: string[]) => {
      return selectedAccount.filter(act => act !== account);
    });
  };
  const onClear = () => {
    setSelectedAccount([]);
  };
  return (
    <div className={classnames(listStyle.selectWrapper)} ref={selectRef}>
      <span className={classnames(listStyle.title)}>{getIn18Text('GUIZESHIYONGZHANG')}</span>
      <Select
        mode="multiple"
        style={{ width: '100%' }}
        maxTagCount={'responsive'}
        placeholder={getIn18Text('XUANZEGUIZESHI')}
        getPopupContainer={() => selectRef.current || document.body}
        dropdownRender={dropdownRender}
        allowClear
        onDeselect={onDeselect}
        onClear={onClear}
        showArrow={true}
        suffixIcon={<TriangleDownIcon className="dark-invert" />}
        removeIcon={<TagCloseIcon className="dark-invert" />}
        value={selectedAccount}
      />
    </div>
  );
};
export default AccountSelect;
