import { Radio, Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import React, { useState, useEffect } from 'react';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import style from './checkField.module.scss';
import { actions, getCompanyCheckRules, updateCompanyCheckRules } from '@web-common/state/reducer/customerReducer';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { resCompanyRules } from 'api';
import classnames from 'classnames';
import { cloneDeep } from 'lodash';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import ExcludeEmailModal from './ExcludeEmailSuffixModal';
import { getIn18Text } from 'api';
interface fieldItem {
  field: string;
  name: string;
  checked: number;
  disabled?: boolean;
}
export const CheckField = () => {
  // const checkFields = ['company_name', 'company_domain', 'telephone', 'email', 'telephones', 'whats_app', 'social_platform', 'home_page'];
  // checked 0 是查重 1 警告 2 暂不查重
  const { setGlobalField } = actions;
  const dispatch = useAppDispatch();
  const globalField = useAppSelector(state => state.customerReducer.globalField);
  const [data, setData] = useState<fieldItem[]>([]);
  const [visible, setVisible] = useState<boolean>(false);
  useEffect(() => {
    dispatch(getCompanyCheckRules());
  }, []);
  useEffect(() => {
    if (globalField) {
      setData([...globalField]);
    }
  }, [globalField]);
  const changeConfig = (key: string, checked: number) => {
    let newList = [...cloneDeep(globalField)].map(item => {
      if (item.field === key) {
        item.checked = checked;
      }
      return item;
    });
    dispatch(setGlobalField(newList));
  };
  const changeRadio = (key: string, checked: number) => {
    let reqParams = {} as any;
    type keyType = keyof resCompanyRules;
    data.map(item => {
      if (item.field === key) {
        reqParams[item.field] = checked;
      } else {
        reqParams[item.field] = item.checked;
      }
    });
    dispatch(updateCompanyCheckRules(reqParams)).then(res => {
      console.log('xxxxdispatch', res);
      if (res.payload && res.payload.result) {
        Message.success({
          content: getIn18Text('BIANGENGCHENGGONG'),
        });
        changeConfig(key, checked);
        // dispatch(getCompanyCheckRules());
      }
    });
  };
  const columns: ColumnsType<fieldItem> = [
    {
      title: getIn18Text('ZIDUAN'),
      dataIndex: 'name',
    },
    {
      title: getIn18Text('CHAZHONGGUIZE'),
      dataIndex: 'fieldSetting',
      render(_, item) {
        return (
          <div>
            <Radio.Group className={style.checkRadio} onChange={e => changeRadio(item.field, e.target.value)} value={item.checked} disabled={item.disabled}>
              <Radio value={1}>{getIn18Text('CHAZHONG')}</Radio>
              <Radio value={0}>{getIn18Text('BUCHAZHONG')}</Radio>
            </Radio.Group>
            {item.field === 'email_suffix' && <a onClick={() => setVisible(true)}>{getIn18Text('PAICHUHOUZHUI')}</a>}
          </div>
        );
      },
    },
  ];
  return (
    <PermissionCheckPage resourceLabel="ORG_SETTINGS" accessLabel="CONTACT_DUPLICATE_CHECK_SETTING" menu="ORG_SETTINGS_DUPLICATE_CHECK_SETTING">
      <div className={style.pageContainer}>
        <h3 className={style.pageTitle}>{getIn18Text('ZIDUANCHAZHONG')}</h3>
        <p className={style.subtitle}>{getIn18Text('PEIZHIBUTONGZIDUANDECHAZHONGGUIZE\uFF0CDUIKEHUSHUJUDEXINJIAN\u3001BIANJI\u3001DAORU\uFF0CJINXINGCHAZHONG\u3002')}</p>
        <Table className={classnames('edm-table', style.fieldTable)} columns={columns} dataSource={data} pagination={false} rowKey="field" />
        {visible && <ExcludeEmailModal visible={visible} onCancel={() => setVisible(false)} />}
      </div>
    </PermissionCheckPage>
  );
};
