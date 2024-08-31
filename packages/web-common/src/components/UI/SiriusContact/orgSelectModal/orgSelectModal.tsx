import React, { useState, useCallback } from 'react';
import { ModalProps } from 'antd';
import SelectInput, { OrgSelectProps } from '../selectOrgInput/selectOrgInput';
import OrgModal from '../modal/org';
import { useOrgItemEffect } from '@web-common/components/UI/SiriusContact/useContactItemEffect';
import { OrgItem } from '@web-common/utils/contact_util';

interface ScheduleModalProps extends OrgSelectProps {
  onChange?(item: OrgItem[]): void;
  modalProps?: ModalProps;
}

const OrgSelectModal: React.FC<ScheduleModalProps> = props => {
  const { onChange, modalProps, defaultSelectList = [], noRelateEnterprise = true, enableSearchEntityOrg = false, showAddTeamBtn = true, ...rest } = props;
  const [selectList, setSelectList] = useState<OrgItem[]>(defaultSelectList);

  const [visible, setVisible] = useState<boolean>(false);
  const handleChange = useCallback((item: OrgItem[]) => {
    setSelectList(item);
    onChange && onChange(item);
  }, []);

  useOrgItemEffect(defaultSelectList, () => {
    setSelectList(defaultSelectList);
  });

  return (
    <>
      <SelectInput
        {...rest}
        showSuffix={rest.showSuffix}
        defaultSelectList={selectList}
        onClickSuffix={() => {
          setVisible(true);
        }}
        changeHandle={handleChange}
        showAddTeamBtn={showAddTeamBtn}
        enableSearchEntityOrg={enableSearchEntityOrg}
        noRelateEnterprise={noRelateEnterprise}
      />
      <OrgModal
        defaultSelectList={selectList}
        visible={visible}
        noRelateEnterprise={noRelateEnterprise}
        onCancel={() => {
          setVisible(false);
        }}
        onSure={item => {
          setVisible(false);
          handleChange(item);
        }}
        modalProps={modalProps}
        showAddTeamBtn={showAddTeamBtn}
      />
    </>
  );
};

export default OrgSelectModal;
