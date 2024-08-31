import React, { useMemo, useEffect } from 'react';
import { useCompanyUser } from '@web-entry-ff/hooks/useCompanyUser';
import { EnhanceSelect, EnhanceSelectProps } from '@web-common/components/UI/Select';

interface Props extends EnhanceSelectProps<string> {
  onInit?: (val: string) => void;
}

export const ContactSelect: React.FC<Props> = props => {
  const { onInit, ...restProps } = props;
  const { contactList } = useCompanyUser();

  const options = useMemo(() => {
    return (contactList || []).map(contact => {
      return {
        label: contact.accountName,
        value: contact?.id,
      };
    });
  }, [contactList]);

  useEffect(() => {
    if (onInit) {
      onInit(options?.[0]?.value || '');
    }
  }, [options]);

  return <EnhanceSelect {...restProps} showSearch optionFilterProp="label" options={options} />;
};
