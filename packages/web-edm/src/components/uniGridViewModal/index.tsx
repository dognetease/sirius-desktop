import React, { useState, useRef, useEffect } from 'react';
import { L2cCustomerGridModal } from '@lxunit/app-l2c-crm';
import { L2cLeadsGridModal } from '@lxunit/app-l2c-crm';
import { WayType } from 'api';
console.log('L2cCustomerGridModal', L2cCustomerGridModal);
interface Props {
  onOk: (values: any) => void;
  onCancel?: () => void;
  activeKey?: string;
  way?: WayType;
}
const UniGridViewModal = (props: Props) => {
  const { onOk, onCancel, activeKey, way } = props;
  if (activeKey === 'leads') {
    return <L2cLeadsGridModal onOk={onOk} onCancel={onCancel} way={way} />;
  }
  return <L2cCustomerGridModal onOk={onOk} onCancel={onCancel} way={way}></L2cCustomerGridModal>;
};

export default UniGridViewModal;
