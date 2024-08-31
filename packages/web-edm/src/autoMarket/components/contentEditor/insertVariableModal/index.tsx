import React, { useEffect, useState, useRef } from 'react';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import classname from 'classnames';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { api, apiHolder, apis, FieldSettingApi, DataStoreApi } from 'api';
import { ReactComponent as SelectedRightSvg } from '../icons/selected-right.svg';
import { EmptyContactType } from '../../../../send/edmWriteContext';
import style from './insertVariable.module.scss';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';

interface VariableModel {
  show: string;
  code: string;
}

interface VariableNameModel {
  code: string;
  picture: string;
  pictureValue: string;
}

const VARIABLE_KEY = 'variableSystemListData';
const dataStoreApi = api.getDataStoreApi() as DataStoreApi;
const fieldSettingApi = apiHolder.api.requireLogicalApi(apis.fieldSettingApiImpl) as FieldSettingApi;

export const InsertVariablModal = ({
  onChange,
  onVisible,
  variableVisible,
}: {
  emptyContactType?: EmptyContactType;
  onVisible?: (visible: boolean) => any;
  onChange: (value: Array<string | number>) => void;
  defaultOpen?: boolean;
  expandPosition?: string;
  variableVisible: boolean;
}) => {
  const [source, setSource] = useState<'addressBook' | 'customer'>('addressBook');
  const [variable, setVariable] = useState('address_book_name');
  const [variableList, setVariableList] = useState<VariableModel[]>([]);
  const [variableNameList, setVariableNameList] = useState<VariableNameModel[]>([]);
  const [contactNameCode, setContactNameCode] = useState<string>('address_book_name_0');
  const varibaleRef = useRef<any>(null);

  const onSourceChange = (e: RadioChangeEvent) => {
    setSource(e.target.value);
    if (e.target.value === 'addressBook') {
      setVariable('address_book_name');
      setContactNameCode('address_book_name_0');
    } else if (e.target.value === 'customer') {
      setVariable('customer_name');
      setContactNameCode('name_0');
    }
    setListByVar(e.target.value);
  };

  const onVariableChange = (e: RadioChangeEvent) => {
    setVariable(e.target.value);
    if (e.target.value === 'address_book_name') {
      setContactNameCode('address_book_name_0');
    } else if (e.target.value === 'customer_name') {
      setContactNameCode('name_0');
    }
  };

  const getVariableSystemList = () => {
    fieldSettingApi.getVariableSystemList().then(res => {
      varibaleRef.current = res;
      setListByVar('addressBook');
      dataStoreApi.putSync(VARIABLE_KEY, JSON.stringify(res), {
        noneUserRelated: false,
      });
    });
  };

  const setListByVar = (type: 'addressBook' | 'customer') => {
    const tempList = type === 'addressBook' ? varibaleRef.current.addressBook : varibaleRef.current.customer;
    setVariableList([{ show: tempList.name.show, code: type === 'addressBook' ? 'address_book_name' : 'customer_name' }, ...tempList.other]);
    setVariableNameList(tempList.name.value);
  };

  const onConfirm = () => {
    let key = '';
    if (['address_book_name', 'customer_name'].includes(variable)) {
      key = contactNameCode;
    } else {
      key = variable;
    }
    onChange([key]);
  };

  useEffect(() => {
    const variableListData = dataStoreApi.getSync(VARIABLE_KEY).data;
    if (!!variableListData) {
      varibaleRef.current = JSON.parse(variableListData);
      setListByVar('addressBook');
    }
    getVariableSystemList();
  }, []);
  return (
    <SiriusModal
      visible={variableVisible}
      width={494}
      title={getTransText('CHARUBIANLIANG')}
      onCancel={() => {
        onVisible && onVisible(false);
      }}
      maskClosable={false}
      // destroyOnClose={true}
      closable={true}
      centered={true}
      className={style.insertVariableModal}
      onOk={onConfirm}
      getContainer={() => document.body}
    >
      <div className={style.tabContainer}>
        <div className={style.tabTitle}>{getIn18Text('XUANZELAIYUAN')}</div>
        <Radio.Group className={style.tabRadio} onChange={onSourceChange} value={source}>
          <Radio value="addressBook">{getIn18Text('DEZHIBAO')}</Radio>
          <Radio value="customer">{getIn18Text('KEHU')}</Radio>
        </Radio.Group>

        <div className={style.tabTitle}>{getIn18Text('XUANZEBIANLIANG')}</div>
        <Radio.Group onChange={onVariableChange} value={variable}>
          {variableList.map(item => {
            return <Radio value={item.code}>{item.show}</Radio>;
          })}
        </Radio.Group>
        <div className={style.contactName}>
          {['address_book_name', 'customer_name'].includes(variable) && (
            <>
              <div className={style.contactNameTitle}>{getIn18Text('*RUOWUFACHAZHAOLIAN')}</div>
              <div className={style.contactNameList}>
                {variableNameList.map(contact => {
                  return (
                    <div
                      className={style.contactNameItem}
                      onClick={() => {
                        setContactNameCode(contact.code);
                      }}
                    >
                      <div className={classname(style.contactNameContent, contact.code === contactNameCode ? style.contactNameSelect : '')}>
                        <div className={style.contactNameName}>{contact.picture}</div>
                        <div className={style.contactNameBar} style={{ marginBottom: '6px' }}></div>
                        <div className={style.contactNameBar}></div>
                        {contact.code === contactNameCode && <SelectedRightSvg className={style.contactNameSelectIcon} />}
                      </div>
                      <div className={style.contactNameFooter}>{contact.pictureValue}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </SiriusModal>
  );
};
