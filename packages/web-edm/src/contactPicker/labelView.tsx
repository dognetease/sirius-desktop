import React, { useState, useEffect, useRef } from 'react';
import { Input, Spin, Checkbox, Button } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox';
import { apiHolder, CustomerApi, ICustomerContactData, ILabelData, View, ViewChangeParams } from 'api';
// import { View, ViewChangeParams } from './customer';
import Breadcrumb from './breadcrumb';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import LabelItem from './labelItem';
import { debounce } from 'lodash';
import style from './pickerView.module.scss';
import { getIn18Text } from 'api';

const customerApi = apiHolder.api.requireLogicalApi('customerApiImpl') as CustomerApi;

interface LabelViewProps {
  onPickedChange: (contacts: ICustomerContactData[]) => void;
  onViewChange: (view: View, params?: ViewChangeParams) => void;
}

const LabelView: React.FC<LabelViewProps> = props => {
  const { onPickedChange, onViewChange } = props;

  const [searchKey, setSearchKey] = useState<string>('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [labels, setLabels] = useState<ILabelData[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  const breadcrumbList = [{ name: getIn18Text('KEHULIEBIAO'), highlight: true, onClick: () => onViewChange('customer') }, { name: getIn18Text('KEHUBIAOQIAN') }];

  const lastFetchTime = useRef(0);

  const debouncedSearch = useRef(
    debounce(
      (key: string) => {
        const fetchTime = (lastFetchTime.current = Date.now());

        setSearching(true);

        customerApi
          .search({ range: 'ALL', key })
          .then(data => {
            if (fetchTime === lastFetchTime.current) {
              setLabels(data.label_list);
            }
          })
          .finally(() => {
            fetchTime === lastFetchTime.current && setSearching(false);
          });
      },
      400,
      { leading: true }
    )
  );

  useEffect(() => {
    debouncedSearch.current(searchKey);
  }, [searchKey]);

  const handleCheckAllChange = (event: CheckboxChangeEvent) => {
    event.target.checked ? setCheckedKeys(labels.map(label => label.label_id)) : setCheckedKeys([]);
  };

  const handleLabelCheckedChange = (labelId: string) => {
    checkedKeys.includes(labelId) ? setCheckedKeys(checkedKeys.filter(key => key !== labelId)) : setCheckedKeys([...checkedKeys, labelId]);
  };

  const handleSubmit = () => {
    setSubmitting(true);

    customerApi
      .search({
        range: 'LABEL',
        key: searchKey,
        label_id_limit: checkedKeys.join(','),
      })
      .then(data => {
        data.company_list.forEach(customer => {
          const { company_id, contacts } = customer;

          contacts.forEach(contact => (contact.company_id = company_id));
        });

        const contacts: ICustomerContactData[] = data.company_list.reduce<ICustomerContactData[]>((accumulator, customer) => [...accumulator, ...customer.contacts], []);

        onPickedChange(contacts);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div className={style.pickerView}>
      <div className={style.header}>
        <Input
          value={searchKey}
          onChange={event => {
            setSearchKey(event.target.value);
            setCheckedKeys([]);
          }}
          placeholder={getIn18Text('QINGSHURUBIAOQIANXINXI')}
          prefix={<SearchIcon />}
          disabled={submitting}
          allowClear
        />
      </div>
      <Breadcrumb className={style.breadcrumb} list={breadcrumbList} />
      <div className={style.body}>
        {searching ? (
          <Spin className={style.searching} />
        ) : (
          <>
            {!labels.length && <div className={style.empty}>{getIn18Text('ZANWUSHUJU')}</div>}
            <div className={style.labels}>
              {labels.map(label => (
                <LabelItem
                  key={label.label_id}
                  name={label.label_name}
                  count={label.label_company_count}
                  checkable
                  checked={checkedKeys.includes(label.label_id)}
                  onCheckedChange={() => handleLabelCheckedChange(label.label_id)}
                  disabled={submitting}
                  onClick={() => {
                    onViewChange('labelDetail', {
                      labelId: label.label_id,
                      labelName: label.label_name,
                    });
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className={style.footer}>
        <Checkbox
          checked={checkedKeys.length > 0 && checkedKeys.length === labels.length}
          indeterminate={checkedKeys.length > 0 && checkedKeys.length < labels.length}
          disabled={searching || submitting || labels.length === 0}
          onChange={handleCheckAllChange}
        >
          {getIn18Text('QUANXUAN')}
        </Checkbox>
        <Button type="primary" loading={submitting} disabled={searching || !checkedKeys.length} onClick={handleSubmit}>
          {getIn18Text('TIANJIA')}
        </Button>
      </div>
    </div>
  );
};

LabelView.defaultProps = {};

export default LabelView;
