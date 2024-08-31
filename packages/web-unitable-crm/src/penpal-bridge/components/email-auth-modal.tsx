import React from 'react';
import ReactDOM from 'react-dom';
import { CustomerEmailEmailList } from 'api';
import { EmailAuthModal } from '@/components/Layout/Customer/components/emailList/uniIndex';

export const showAuthInfo = (contactEmails: CustomerEmailEmailList) => {
  const el = document.createElement('div');
  ReactDOM.render(
    <EmailAuthModal
      contactEmails={contactEmails}
      onClose={() => {
        ReactDOM.unmountComponentAtNode(el);
      }}
    />,
    el
  );
};
