import React, { useState } from 'react';
import { resCustomsFollowCountry } from 'api';
import { ReactComponent as AddFollow } from '@/images/icons/customs/add-follow.svg';
import styles from './countrycompactselect.module.scss';
import EditFollowModal from '../../followNation/editFollowModal/editFollowModal';
import NationModal from '../../followNation/nationModal/nationModal';
import { useCustomsCountryHook } from '../../docSearch/component/CountryList/customsCountryHook';

interface FollowCountryEditProps {
  followCountry: resCustomsFollowCountry[];
  onUpdateFollowCountry(): void;
}

const FollowCountryEdit: React.FC<FollowCountryEditProps> = ({ followCountry, onUpdateFollowCountry }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [editVisible, setEditVisible] = useState<boolean>(false);
  const [continentList, nationModalAllCountry] = useCustomsCountryHook(true);
  const onOk = () => {
    onUpdateFollowCountry();
    setVisible(false);
  };
  const onEditOk = () => {
    onUpdateFollowCountry();
    setEditVisible(false);
  };
  return (
    <>
      <div className={styles.tail}>
        <div
          onClick={() => {
            setVisible(true);
          }}
          className={styles.addCou}
        >
          <AddFollow />
          添加收藏国家
        </div>
      </div>
      <NationModal
        countryList={nationModalAllCountry}
        visible={visible}
        nationList={followCountry}
        updateNationList={onUpdateFollowCountry}
        onCancel={() => setVisible(false)}
        onOk={onOk}
      />
      <EditFollowModal visible={editVisible} nationList={followCountry} onCancel={() => setEditVisible(false)} onOk={onEditOk} updateNationList={onUpdateFollowCountry} />
    </>
  );
};

export default FollowCountryEdit;
