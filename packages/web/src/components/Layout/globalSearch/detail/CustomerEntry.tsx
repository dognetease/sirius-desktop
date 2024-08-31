import React, { CSSProperties, FC, useMemo } from 'react';
import { Menu } from 'antd';
import classnames from 'classnames';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import style from './companyDetail.module.scss';
import { getDetailCustomerAddBtnShowStatus, getDetailLeadsAddBtnShowStatus } from '../utils';
import ArrowDropdownButton from '../component/ArrowDropdownButton/ArrowDropdownButton';

interface CompanyRelationState {
  companyId: string;
  status: string;
  leadsId: string;
}

export const CustomerEntry: FC<{
  companyRelationState: CompanyRelationState;
  inputLeads: () => void;
  inputCustomer: () => void;
  leadsAddLoading?: boolean;
  btnType?: 'primary' | 'link';
  disabled?: boolean;
  btnStyle?: CSSProperties;
}> = ({ companyRelationState, inputLeads, inputCustomer, leadsAddLoading, btnType = 'primary', disabled, btnStyle = {} }) => {
  const inputCustomerBtn: { show: boolean; text: string } = useMemo(() => getDetailCustomerAddBtnShowStatus(companyRelationState), [companyRelationState]);
  const inputLeadsBtn: { show: boolean; text: string } = useMemo(() => getDetailLeadsAddBtnShowStatus(companyRelationState), [companyRelationState]);
  return (
    <>
      {inputCustomerBtn.show && inputLeadsBtn.show && (
        <ArrowDropdownButton
          onClick={inputLeads}
          btnType={btnType}
          style={btnStyle}
          buttonName={inputLeadsBtn.text}
          disabled={disabled}
          overlay={
            <Menu>
              <Menu.Item key={inputCustomerBtn.text}>
                <div onClick={inputCustomer}>{inputCustomerBtn.text}</div>
              </Menu.Item>
            </Menu>
          }
        />
      )}
      {inputCustomerBtn.show && !inputLeadsBtn.show && (
        <Button
          onClick={inputCustomer}
          style={btnStyle}
          className={classnames(btnType === 'link' ? style.blockButton : style.primaryBtnExtra)}
          btnType={btnType}
          disabled={disabled}
        >
          {inputCustomerBtn.text}
        </Button>
      )}
      {inputLeadsBtn.show && !inputCustomerBtn.show && (
        <Button
          disabled={disabled}
          onClick={inputLeads}
          style={btnStyle}
          btnType={btnType}
          loading={leadsAddLoading}
          className={classnames(btnType === 'link' ? style.blockButton : style.primaryBtnExtra)}
        >
          {inputLeadsBtn.text}
        </Button>
      )}
    </>
  );
};
