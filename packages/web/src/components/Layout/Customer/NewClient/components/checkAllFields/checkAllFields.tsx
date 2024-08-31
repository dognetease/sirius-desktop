import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './checkAllFields.module.scss';
import { apiHolder, apis, CustomerApi, reqRepeatList as resType, resRepeatList as resDataListType } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { getIn18Text } from 'api';
interface Props {
  visible: boolean;
  onCancel: () => void;
  checkData?: {
    field: string;
    value: string;
    company_id?: string;
  };
}
interface nameItem {
  name: string;
  id: string;
}
const CheckAllFields = ({ visible, onCancel, checkData }: Props) => {
  const [queryValue, setQueryValue] = useState<string | undefined>(undefined);
  const [queryKey, setQueryKey] = useState<string | undefined>('company_name');
  const [tableData, setTableData] = useState<resDataListType>([]);
  const searchKeyList: {
    label: string;
    value: string;
  }[] = [
    {
      label: getIn18Text('GONGSI'),
      value: 'company_name',
    },
    {
      label: getIn18Text('YUMING'),
      value: 'company_domain',
    },
    {
      label: getIn18Text('YOUXIANG'),
      value: 'email',
    },
    {
      label: getIn18Text('ZUOJI'),
      value: 'landline_telephone',
    },
    {
      label: getIn18Text('DIANHUA'),
      value: 'telephone',
    },
    {
      label: getIn18Text('YOUXIANGHOUZHUI'),
      value: 'email_suffix',
    },
    {
      label: 'WA',
      value: 'whats_app',
    },
    {
      label: getIn18Text('GERENZHUYE'),
      value: 'home_page',
    },
  ];
  useEffect(() => {
    console.log('xxxcheckData', checkData);
    setQueryKey(checkData?.field);
    setQueryValue(checkData?.value);
  }, [checkData]);
  useEffect(() => {
    if (queryKey && queryValue) {
      let params = {
        [queryKey]: queryValue,
        company_id: checkData?.company_id,
      } as resType;
      clientApi.repeatList(params).then(res => {
        setTableData([...res]);
      });
    }
  }, [queryValue, queryKey]);
  const getOwnerList = (text: nameItem[]) => {
    if (text && text.length) {
      return (
        <EllipsisTooltip>
          <span>{text.map(item => item.name).join(',') || '-'}</span>
        </EllipsisTooltip>
      );
    } else {
      return text;
    }
  };
  const columns = [
    // {
    // 	title: '模块',
    // 	dataIndex: 'undefind',
    // 	key: 'undefind',
    // 	width: 111,
    // 	render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>
    // },
    {
      title: getIn18Text('KEHUBIANHAO'),
      dataIndex: 'company_number',
      key: 'company_number',
      width: 111,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('GONGSIMINGCHENG'),
      dataIndex: 'company_name',
      key: 'company_name',
      width: 132,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('FUZEREN'),
      dataIndex: 'manager_list',
      key: 'manager_list',
      width: 111,
      render: (text: nameItem[]) => getOwnerList(text) || '-',
    },
    {
      title: getIn18Text('CHUANGJIANSHIJIAN'),
      dataIndex: 'create_at',
      key: 'create_at',
      width: 214,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('ZUIHOUGENJINSHIJIAN'),
      dataIndex: 'follow_time',
      key: 'follow_time',
      width: 214,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('YOUXIANG'),
      dataIndex: 'email',
      key: 'email',
      width: 214,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('YOUXIANGHOUZHUI'),
      dataIndex: 'email_suffix',
      key: 'email_suffix',
      width: 214,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('DIANHUA'),
      dataIndex: 'telephones',
      key: 'telephones',
      width: 132,
      render: text => <EllipsisTooltip>{(text && text.join(',')) || '-'}</EllipsisTooltip>,
    },
    {
      title: 'WhatsApp',
      dataIndex: 'whats_app',
      key: 'whats_app',
      width: 214,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
  ];
  const handleQueryChange = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    setQueryValue(value);
  };
  const handleKeyChange = (key: string) => {
    setQueryKey(key);
  };
  return (
    <Modal
      className={style.modalWrap}
      title={getIn18Text('CHAZHONG')}
      width={1048}
      bodyStyle={{ height: '590px', padding: '24px 24px 0' }}
      visible={visible}
      destroyOnClose={true}
      footer={null}
      onCancel={onCancel}
    >
      <div>
        <Select
          showArrow={true}
          allowClear={false}
          value={queryKey}
          dropdownClassName="edm-selector-dropdown"
          style={{ width: 100, marginRight: '8px', marginBottom: 24, verticalAlign: 'top' }}
          onChange={e => handleKeyChange(e as string)}
        >
          {searchKeyList.map((item, index) => {
            return (
              <Select.Option key={index} value={item.value}>
                {item.label}
              </Select.Option>
            );
          })}
        </Select>
        <Input
          style={{ width: 220, marginRight: '8px', marginBottom: 24, verticalAlign: 'top' }}
          className="customer-input-select"
          value={queryValue}
          maxLength={100}
          max={100}
          placeholder={getIn18Text('QINGSHURUSOUSUOSHUJU')}
          prefix={<SearchIcon />}
          allowClear
          onPressEnter={handleQueryChange}
          onBlur={handleQueryChange}
          onChange={handleQueryChange}
        />
        <Table className="edm-table" columns={columns} scroll={{ y: 440 }} rowKey="company_id" dataSource={tableData} pagination={false} />
      </div>
    </Modal>
  );
};
export default CheckAllFields;
