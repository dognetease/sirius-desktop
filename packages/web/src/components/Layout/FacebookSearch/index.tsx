import React, { useContext } from 'react';
import styles from './index.module.scss';
import { FacebookProvider, FacebookContext } from './facebookProvider';
import { FacebookInitPage } from './initPage';
import { FacebookPage } from './page';
export const FaceBookSearchPage = () => {
  return (
    <FacebookProvider>
      <FacebookInitPage />
      <FacebookPage />
    </FacebookProvider>
  );
};
