import React, { FC, useEffect, useCallback, useState } from 'react';
import { apiHolder, api, apis, ContactAndOrgApi, ContactModel, EdmSendBoxApi } from 'api';
import CustomerDetail, { Source } from '@web-contact/component/Detail/detail_edm';
import { Skeleton, message } from 'antd';
import { edmDataTracker } from '../../tracker/tracker';
import { getIn18Text } from 'api';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

let timer: NodeJS.Timeout;
export const CustomerCard: FC<{
  email: string;
  needDecrypt?: boolean;
  decryptEmail?: string;
  source?: Source;
}> = ({ email, needDecrypt, decryptEmail, source }) => {
  // const [contactInfo, setContactInfo] = useState<ContactModel>();
  const [show, setShow] = useState(true);
  const [visible, setVisible] = useState(true);

  const getMailInfo = useCallback(() => {
    if (needDecrypt && decryptEmail) {
      edmApi.getDecryptEmail({ contactEmails: decryptEmail }).then(() => {
        clearTimeout(timer);
        setShow(false);
      });
    } else {
      clearTimeout(timer);
      setShow(false);
    }
  }, [email]);

  useEffect(() => {
    getMailInfo();
    clearTimeout(timer);
    timer = setTimeout(() => {
      // message.error(getIn18Text('KEHUXINXIQINGQIUSHI'));
      setShow(false);
    }, 5000);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  if (show) {
    return (
      <div
        style={{
          padding: 16,
          width: 456,
          height: 314,
        }}
      >
        <Skeleton active />
        <Skeleton active />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
      }}
    >
      <div
        style={{
          padding: 16,
          width: 456,
          height: 314,
        }}
      >
        <Skeleton active />
        <Skeleton active />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          background: '#fff',
        }}
      >
        <CustomerDetail
          source={source}
          email={email}
          onlyCustomer
          handleAddContact={() => {}}
          requiredInfo={{
            hideAddChance: true,
            hideAddContact: true,
            hideRelateMail: true,
          }}
          onNotifyParent={() => {
            edmDataTracker.trackCustomerCardOp();
            setTimeout(() => {
              // setShow(false);
              setVisible(false);
            }, 300);
          }}
        />
      </div>
    </div>
  );
};
