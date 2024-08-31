import React, { useContext, useEffect, useState } from 'react';
import { Button, Input } from 'antd';
import NationList from './nationList/nationList';
import style from './followNation.module.scss';
import NationModal from './nationModal/nationModal';
import { apiHolder, apis, EdmCustomsApi, resCustomsFollowCountry } from 'api';
import EditFollowModal from './editFollowModal/editFollowModal';
import { getIn18Text } from 'api';
import { ForwarderContext } from '../ForwarderSearch/context/forwarder';
import { useCustomsCountryHook } from '../docSearch/component/CountryList/customsCountryHook';
import { CountryWithContinent } from '../docSearch/component/CountryList/customsCountryHook';
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
export type NationListType = {
  id: string;
  country: string;
  countryChinese: string;
  code: string;
};
interface IProps {
  onClick: (nation: resCustomsFollowCountry) => void;
  setAllCountry?: (data: CountryWithContinent) => void;
}
const FollowNation = (props: IProps) => {
  const { onClick, setAllCountry } = props;
  const [visible, setVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [nationList, setNationList] = useState<resCustomsFollowCountry[]>([]);
  const [_, dispatch] = useContext(ForwarderContext);
  const [continentList, allCountry] = useCustomsCountryHook(true, true);
  const [_con, newAllCountry] = useCustomsCountryHook(true);
  useEffect(() => {
    console.log('getFollowCountry-res-1');
    fetchMyFollowCountries();
  }, []);
  useEffect(() => {
    if (newAllCountry) {
      setAllCountry && setAllCountry(newAllCountry);
    }
  }, [newAllCountry]);
  const fetchMyFollowCountries = () => {
    edmCustomsApi
      .getFollowCountry()
      .then(res => {
        setNationList(res);
        dispatch({
          type: 'FOLLOW_COUNTRY_CHANGE',
          payload: res,
        });
      })
      .catch(() => setNationList([]));
  };
  const onOk = () => {
    fetchMyFollowCountries();
    setVisible(false);
  };
  const onEditOk = () => {
    fetchMyFollowCountries();
    setEditVisible(false);
  };
  const selectCountryHandle = (param: resCustomsFollowCountry) => {
    const arr = continentList.filter(cn => {
      const { countries } = cn;
      return countries.some(item => item.name === param.country);
    });
    return arr.length > 0
      ? {
          ...param,
          continent: arr[0].continent,
        }
      : param;
  };
  return (
    <div className={style.wrapper}>
      <div className={style.titleWrap}>
        <span className={style.title}>{getIn18Text('CHANGYONGGUOJIADEQU\uFF1A')}</span>
        {/* {!!nationList.length && <span className={style.follow} onClick={() => setEditVisible(true)}>{getIn18Text("BIANJI")}</span>} */}
      </div>
      <div className={style.container}>
        <NationList
          nationList={nationList}
          updateNationList={fetchMyFollowCountries}
          onOpen={() => setVisible(true)}
          onClick={value => {
            onClick(selectCountryHandle(value));
          }}
        />
      </div>
      <NationModal
        visible={visible}
        nationList={nationList}
        countryList={allCountry}
        updateNationList={fetchMyFollowCountries}
        onCancel={() => setVisible(false)}
        onOk={onOk}
      />
      <EditFollowModal nationList={nationList} visible={editVisible} onCancel={() => setEditVisible(false)} onOk={onEditOk} updateNationList={fetchMyFollowCountries} />
    </div>
  );
};
export default FollowNation;
