import React, { useEffect, useState } from 'react';
import { Select, Tag, Tooltip } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { apiHolder, apis, EdmCustomsApi, resCustomsFollowCountry } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import NationFlag from '../../../components/NationalFlag';
import { CountryWithContinent } from '../../docSearch/component/CountryList/customsCountryHook';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

import styles from './nationModal.module.scss';
import { getIn18Text } from 'api';
import { setDefaultLocale } from 'react-datepicker';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onOk: () => void;
  nationList: resCustomsFollowCountry[];
  updateNationList: () => void;
  countryList: CountryWithContinent;
}

type cList = {
  label: string;
  code: string;
};

const NationModal: React.FC<Props> = ({ visible, onCancel, onOk, nationList, updateNationList, countryList }: Props) => {
  const [list, setCountryList] = useState<cList[]>([]);
  const [sValue, setSValue] = useState<any[]>([]);
  useEffect(() => {
    if (!visible) return;
    setCountryList(
      (countryList ?? []).map(item => ({
        code: item.name,
        label: item.name + '-' + item.nameCn,
      }))
    );
  }, [visible, countryList]);

  const handleChange = (value: string[]) => {
    console.log('handleChange-value: ', value);
    // ['co1','co2']
    const _list: any = [];
    value.forEach(item => {
      const l = list.find(i => i.code === item);
      _list.push(l);
    });
    console.log('handleChange_list: ', _list);
    setSValue(_list);
  };

  const handleOk = () => {
    if (sValue.length === 0) {
      Toast.success({
        content: getIn18Text('QINGXIANXUANZEXIANGYAOSHOUCANGDEGUOJIA'),
      });
      return;
    }
    edmCustomsApi
      .addFollowCountry({ countryList: sValue })
      .then(res => {
        Toast.success({
          content: getIn18Text('YISHOUCANG'),
        });
        onOk();
      })
      .then(() => {
        setSValue([]);
      });
  };

  return (
    <div className={styles.nationModal}>
      <Modal
        title={getIn18Text('TIANJIAGUOJIA')}
        closable={true}
        width={400}
        visible={visible}
        onCancel={() => {
          setSValue([]);
          onCancel();
        }}
        onOk={handleOk}
        destroyOnClose
      >
        <div className={styles.item}>
          <span>{getIn18Text('GUOJIADEQU\uFF1A')}</span>
          <Select
            maxTagPlaceholder={omitValues => {
              return <Tooltip title={omitValues.map(e => (e as any).tag || e.label || e.value).join('、')}>+{omitValues.length}...</Tooltip>;
            }}
            style={{ width: '80%' }}
            maxTagCount="responsive"
            mode="multiple"
            placeholder={getIn18Text('QINGXUANZE')}
            onChange={handleChange}
            optionFilterProp={'children'}
          >
            {list.map(item => {
              return <Select.Option value={item.code}>{item.label}</Select.Option>;
            })}
          </Select>
        </div>
      </Modal>
    </div>
  );
};
export default NationModal;
