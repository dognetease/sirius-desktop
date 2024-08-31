import { getIn18Text } from 'api';
import React, { useState } from 'react';
// import { Radio } from '@web-common/components/UI/Radio';
import Radio from '@lingxi-common-component/sirius-ui/Radio';
import { RadioChangeEvent } from 'antd';
import { api, AddressRepeatedAction, AddressRepeatedActionName } from 'api';

interface ActionRadioGroupProps {
  className?: string;
  style?: React.CSSProperties;
}

const storeApi = api.getDataStoreApi();
const ADDRESS_REPEATED_ACTION = 'ADDRESS_REPEATED_ACTION';

export const useAddressRepeatedAction: (props?: { disabled: boolean }) => {
  action: AddressRepeatedAction;
  ActionRadioGroup: React.FC<ActionRadioGroupProps>;
} = props => {
  const { disabled } = props || {};
  const [action, setAction] = useState<AddressRepeatedAction>(() => {
    const actionFromStore = storeApi.getSync(ADDRESS_REPEATED_ACTION).data as AddressRepeatedAction;

    return actionFromStore || AddressRepeatedAction.DISCARD;
  });

  const handleChange = (e: RadioChangeEvent) => {
    const nextAction = e.target.value as AddressRepeatedAction;

    storeApi.putSync(ADDRESS_REPEATED_ACTION, nextAction);
    setAction(nextAction);
  };

  const ActionRadioGroup: React.FC<ActionRadioGroupProps> = props => (
    <div className={props.className} style={props.style}>
      <div style={{ marginBottom: 12 }}>{getIn18Text('RUOYUXIANYOULIANXIREN')}</div>
      <Radio.Group value={action} disabled={disabled} onChange={handleChange}>
        <Radio value={AddressRepeatedAction.OVERRIDE}>{AddressRepeatedActionName[AddressRepeatedAction.OVERRIDE]}</Radio>
        <Radio value={AddressRepeatedAction.DISCARD}>{AddressRepeatedActionName[AddressRepeatedAction.DISCARD]}</Radio>
        <Radio value={AddressRepeatedAction.APPEND}>{AddressRepeatedActionName[AddressRepeatedAction.APPEND]}</Radio>
      </Radio.Group>
    </div>
  );

  return {
    action,
    ActionRadioGroup,
  };
};
