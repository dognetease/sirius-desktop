import React, { useEffect, useState } from 'react';
import styles from './subscribemenuname.module.scss';
import classNames from 'classnames';
import { ReactComponent as NewTagIcon } from '@/images/icons/edm/new-icon.svg';
import { useLocation } from 'react-use';
import { parse as qsParse } from 'querystring';
import { api } from 'api';
import { getIn18Text } from 'api';

const storeApi = api.getDataStoreApi();
const NEW_SUB_VISITED_AND_HAS_LIST = 'RCMD_VISITED_AND_HAS_LIST';

const SubscribeMenuName: React.FC = () => {
  const { hash: locationHash } = useLocation();
  const [entryed, setEntryed] = useState<boolean>(() => {
    return !!storeApi.getSync(NEW_SUB_VISITED_AND_HAS_LIST).data;
  });
  useEffect(() => {
    if (locationHash && !storeApi.getSync(NEW_SUB_VISITED_AND_HAS_LIST).data) {
      const params = qsParse(locationHash.split('?')[1]);
      const pageModule = Array.isArray(params.page) ? params.page[0] : params.page;
      if (pageModule === 'smartrcmd') {
        setEntryed(true);
        storeApi.putSync(NEW_SUB_VISITED_AND_HAS_LIST, 'true');
      }
    }
  }, [locationHash]);
  return (
    <span className={classNames(styles.name)}>
      {getIn18Text('ZHINENGTUIJIAN')}
      {!entryed && <NewTagIcon />}
    </span>
  );
};

export default SubscribeMenuName;
