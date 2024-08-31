import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from '@web-common/state/createStore';
import { isMailListDiff } from '@web-mail/utils/mailCompare';
import MailListMenuMultConfig from '@web-mail/common/components/MailMenu/mailMenuConifg/MailListMenuMultConfig';
import MailMenuBase from '@web-mail/common/components/MailMenu/MailMenuBase/MailMenuBase';
import { MailEntryModel } from 'api';

const defaultArray: any[] = [];

const MailMenuMult: React.FC<any> = props => {
  const { activeMailId, setVisible, domProps } = props;

  const checkedMails: MailEntryModel[] =
    useAppSelector(
      state => {
        if (state?.mailReducer?.mailEntities) {
          const mailList: MailEntryModel[] = [];
          activeMailId.forEach(id => {
            mailList.push(state?.mailReducer?.mailEntities[id]);
          });
          return mailList;
        }
      },
      (old, newValue) => {
        return !isMailListDiff(old as MailEntryModel[], newValue as MailEntryModel[]);
      }
    ) || defaultArray;

  return (
    <MailMenuBase
      mail={checkedMails}
      onMenuClick={() => {
        setVisible(false);
      }}
      defaultMenu={MailListMenuMultConfig}
      domProps={domProps}
    ></MailMenuBase>
  );
};
export default MailMenuMult;
