import React, { useState } from 'react';
import { ModalProps } from 'antd';
import SelectInput, { ContactSelectProps } from '../selectInput';
import ContactModal from '../modal';
import useContactItemEffect from '@web-common/components/UI/SiriusContact/useContactItemEffect';
import { ContactItem } from '@web-common/utils/contact_util';
import { ContactTreeType } from 'api';

interface ScheduleModalProps extends ContactSelectProps {
  onChange?(item: ContactItem[]): void;
  modalProps?: ModalProps;
  includeSelf?: boolean;
  firstPositionNotDelEmail?: string;
  type?: ContactTreeType[];
  useEdm?: boolean;
  accountRootKey?: string; // 账号信息
}

const ContactScheduleModal: React.FC<ScheduleModalProps> = props => {
  const { onChange, modalProps, defaultSelectList = [], firstPositionNotDelEmail, noRelateEnterprise = false, accountRootKey, ...rest } = props;
  const [selectList, setSelectList] = useState<ContactItem[]>(defaultSelectList);

  const [visible, setVisible] = useState<boolean>(false);
  const handleChange = (item: ContactItem[]) => {
    setSelectList(item);
    onChange && onChange(item);
  };

  useContactItemEffect(defaultSelectList, () => {
    setSelectList(defaultSelectList);
  });

  return (
    <>
      <SelectInput
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rest}
        useEdm={rest.useEdm}
        firstPositionNotDelEmail={firstPositionNotDelEmail}
        isIM={false}
        showSuffix={!rest.disabled}
        showNoData={rest.showNoData}
        defaultSelectList={selectList}
        onClickSuffix={() => {
          setVisible(true);
        }}
        _account={accountRootKey}
        changeHandle={handleChange}
        noRelateEnterprise={noRelateEnterprise}
      />
      <ContactModal
        includeSelf={rest.includeSelf}
        accountRootKey={accountRootKey}
        firstPositionNotDelEmail={firstPositionNotDelEmail}
        defaultSelectList={selectList}
        isIM={false}
        showAddOrgBtn
        showAddTeamBtn
        showAddPersonalBtn
        visible={visible}
        onCancel={() => {
          setVisible(false);
        }}
        onSure={item => {
          setVisible(false);
          handleChange(item);
        }}
        modalProps={modalProps}
        noRelateEnterprise={noRelateEnterprise}
        type={rest.type}
        useEdm={rest.useEdm}
      />
    </>
  );
};

export default ContactScheduleModal;
