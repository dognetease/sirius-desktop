import React from 'react';
import styles from './nationList.module.scss';
import NationFlag from '../../../components/NationalFlag';
import { resCustomsFollowCountry } from '@/../../api/src/api/logical/edm_customs';
import { Button } from 'antd';
import { ReactComponent as AddBtn } from '@/images/icons/customs/addBtn.svg';
import { ReactComponent as CloseIcon } from '@/images/icons/customs/close-icon.svg';
import { apiHolder, apis, EdmCustomsApi } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
interface IProps {
  nationList: resCustomsFollowCountry[];
  onOpen: () => void;
  onClick: (nation: resCustomsFollowCountry) => void;
  updateNationList: (id: string) => void;
}

const NationList = ({ nationList, onOpen, onClick, updateNationList }: IProps) => {
  const handleClose = (id: string) => {
    edmCustomsApi
      .deleteFollowCountry({ countryIdList: [id] })
      .then(res => {
        Toast.success({
          content: getIn18Text('YISHANCHUSHOUCANG'),
        });
        updateNationList(id);
      })
      .catch(err => {
        console.log('deleteFollowCountry-err: ', err);
      });
  };
  return (
    <div className={styles.nationList}>
      {nationList.map(item => (
        <div key={item.code} className={styles.listItem} onClick={() => onClick(item)}>
          <NationFlag name={item.country} />
          <span
            onClick={event => {
              event.stopPropagation();
              handleClose(item.id);
            }}
            className={styles.closeIcon}
          >
            {' '}
            <CloseIcon />{' '}
          </span>
        </div>
      ))}
      <Button className={styles.addBtn} onClick={onOpen}>
        <AddBtn />
        <span>{getIn18Text('TIANJIAGUOJIA')}</span>
      </Button>
    </div>
  );
};
export default NationList;
