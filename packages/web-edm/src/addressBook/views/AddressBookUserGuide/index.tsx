import React, { useState } from 'react';
import { UserGuide, UserGuideProps } from '../../components/UserGuide';
import { ReactComponent as Icon1 } from './Images/icon1.svg';
import { ReactComponent as Icon2 } from './Images/icon2.svg';
import { ReactComponent as Icon3 } from './Images/icon3.svg';
import { ReactComponent as Icon4 } from './Images/icon4.svg';

import image1 from './Images/1.png';
import image2 from './Images/2.png';
import image3 from './Images/3.png';
import image4 from './Images/4.png';
import { getTransText } from '@/components/util/translate';

const LOCAL_STORAGE_KEY = 'ADDRESS_BOOK_USER_GUIDE';

export const AddressBookUserGuide = () => {
  const [visible, setVisible] = useState(() => {
    const result = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (result === null) {
      return true;
    }

    return result === 'visited' ? false : true;
  });

  const [carouseItems] = useState<UserGuideProps['carouseItems']>([
    {
      key: '1',
      title: getTransText('LIANXIRENJIZHONGGUANLI'),
      content: getTransText('JUHEGEZHONGLAIYUANDELIANXIREN'),
      icon: Icon1,
      image: image1,
    },
    {
      key: '2',
      title: getTransText('DUOQUDAOTONGBULIANXIREN'),
      content: getTransText('QUANQIUSOU_CHAJIAN'),
      icon: Icon2,
      image: image2,
    },
    {
      key: '3',
      title: getTransText('DUOWEIDUJINGXIHUAGUANLILIANXIREN'),
      content: getTransText('DUILIANXIRENANLISHIDAORUMINGDAN'),
      icon: Icon3,
      image: image3,
    },
    {
      key: '4',
      title: getTransText('QIYEJIFENPEIGUANLI'),
      content: getTransText('DIZHIBUGONGHAILIANXIREN'),
      icon: Icon4,
      image: image4,
    },
  ]);

  const closeGuide = () => {
    setVisible(false);
    localStorage.setItem(LOCAL_STORAGE_KEY, 'visited');
  };

  return <UserGuide visible={visible} onClose={closeGuide} carouseItems={carouseItems} />;
};
