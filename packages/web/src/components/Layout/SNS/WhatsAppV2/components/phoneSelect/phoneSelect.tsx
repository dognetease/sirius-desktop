import { getIn18Text } from 'api';
import React, { useState } from 'react';
import classnames from 'classnames';
import { WhatsAppTemplateV2, WhatsAppPhoneV2 } from 'api';
// import { EnhanceSelect as Select, InSingleOption as Option } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select, InSingleOption as Option } from '@lingxi-common-component/sirius-ui/Select';
import { useWaContextV2 } from '../../context/WaContextV2';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { handleRegisterStart } from '../../utils';
import { ReactComponent as AddIcon } from './add.svg';
import style from './phoneSelect.module.scss';

interface PhoneSelectProps {
  className?: string;
  value?: string | null;
  disableBannedPhone?: boolean;
  onChange?: (phone: string | null) => void;
}

export const PhoneSelect: React.FC<PhoneSelectProps> = props => {
  const { className, value, disableBannedPhone = true, onChange } = props;
  const { allotPhones, registrable, refreshAllotPhones } = useWaContextV2();

  return (
    <Select
      className={classnames(style.phoneSelect, className)}
      value={value}
      placeholder={getIn18Text('QINGXUANZEWhat')}
      onChange={onChange}
      dropdownRender={menu => (
        <>
          {menu}
          {registrable && (
            <div
              className={style.addPhone}
              onClick={() =>
                handleRegisterStart('add_phone', () => {
                  refreshAllotPhones();
                })
              }
            >
              <AddIcon className={style.icon} />
              <span className={style.text}>{getIn18Text('TIANJIADIANHUAHAOMA')}</span>
            </div>
          )}
        </>
      )}
    >
      {allotPhones.map(item => {
        const banned = item.status === 'BANNED';

        return (
          <Option value={item.phone} disabled={disableBannedPhone ? banned : false}>
            <div
              className={classnames(style.item, {
                [style.banned]: banned,
              })}
            >
              <AvatarTag className={style.avatar} user={{ name: item.verified_name }} size={24} />
              <div className={style.name}>
                {item.phone} ({item.verified_name})
              </div>
              {banned && <div className={style.bannedLabel}>{getIn18Text('YIJINYONG')}</div>}
            </div>
          </Option>
        );
      })}
    </Select>
  );
};
