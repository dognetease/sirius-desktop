/* eslint-disable react/destructuring-assignment */
import React, { useState, useEffect } from 'react';
import { api, DataStoreApi } from 'api';
import classnames from 'classnames';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import style from './insertVariable.module.scss';
import { EmptyContactType } from '../../send/edmWriteContext';
import { getIn18Text } from 'api';
interface EmptyContactSettingModalProps {
  visible: boolean;
  value?: EmptyContactType;
  onClose?: () => void;
  onOk?: (value: EmptyContactType) => void;
}
const dataStoreApi = api.getDataStoreApi() as DataStoreApi;
const STORAGE_KEY = 'EmptyContactSetting';
const SettingSvg = (props: { selected?: boolean; text: string }) => {
  const { selected, text } = props;
  return (
    <div className={classnames(style.settingSvg, selected ? style.selected : '')}>
      <div>{text}</div>
      <div className={style.bar1} />
      <div className={style.bar2} />
    </div>
  );
};
export const EmptyContactSettingModal = (props: EmptyContactSettingModalProps) => {
  const [value, setValue] = useState(props.value || EmptyContactType.Empty);
  useEffect(() => {
    setValue(props.value || EmptyContactType.Empty);
  }, [props.value]);
  const handleOk = () => {
    dataStoreApi.put(STORAGE_KEY, value, {
      noneUserRelated: false,
    });
    props.onOk && props.onOk(value);
  };
  return (
    <SiriusModal
      title={getIn18Text('LIANXIRENBIANLIANGSHEZHI')}
      visible={props.visible}
      className={style.emptyContactSettingModal}
      onOk={handleOk}
      onCancel={props.onClose}
      getContainer="#edm-write-root"
    >
      <p>{getIn18Text('RUODANGQIANKEHUGUANLIZHONG\uFF0CWEIBAOCUNLIANXIRENCHENGHU\uFF0CZEBIANLIANGDEXIANSHIGUIZEWEI\uFF1A')}</p>
      <div className={style.optionList}>
        <div onClick={() => setValue(EmptyContactType.Friend)}>
          <SettingSvg text="Friend" selected={value === EmptyContactType.Friend} />
          <div className={style.label}>{getIn18Text('XIANSHIWEIFriend')}</div>
        </div>
        <div onClick={() => setValue(EmptyContactType.Email)}>
          <SettingSvg text="Zhangsan" selected={value === EmptyContactType.Email} />
          <div className={style.label}>{getIn18Text('XIANSHIWEIYOUXIANGQIANZHUI')}</div>
        </div>
        <div onClick={() => setValue(EmptyContactType.Empty)}>
          <SettingSvg text="-" selected={value === EmptyContactType.Empty} />
          <div className={style.label}>{getIn18Text('XIANSHIWEIKONG')}</div>
        </div>
      </div>
    </SiriusModal>
  );
};
