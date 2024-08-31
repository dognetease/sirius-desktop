import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input, Select, Button, Table } from 'antd';
import useSessionStorage from 'react-use/esm/useLocalStorage';
import moment from 'moment';
import escapeRegExp from 'lodash/escapeRegExp';
import { navigate } from '@reach/router';
import { apiHolder, apis, CustomerApi, JudgeRepeatItem } from 'api';
import { getTransText } from '@/components/util/translate';
import { ReactComponent as UpLine } from '@/images/icons/edm/up-line.svg';

import style from './style.module.scss';

const { Option } = Select;
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

const options = [
  {
    label: getTransText('KEHUMINGCHENG'),
    value: 'companyName',
  },
  {
    label: getTransText('YOUXIANG'),
    value: 'contactEmail',
  },
  {
    label: getTransText('GONGSIYUMING'),
    value: 'companyDomain',
  },
  {
    label: getTransText('ZUOJIDIANHUA'),
    value: 'companyTelephone',
  },
  // {
  //   label: '联系人名称',
  //   value: 'contactName'
  // },
  {
    label: getTransText('YOUXIANGHOUZHUI'),
    value: 'contactEmailSuffix',
  },
  {
    label: getTransText('DIANHUA'),
    value: 'contactTelephone',
  },
  {
    label: 'WhatsApp',
    value: 'contactWhatsapp',
  },
  {
    label: getTransText('GERENZHUYE'),
    value: 'contactHomePage',
  },
];
const fields = [
  {
    label: getTransText('GONGSIYUMING'),
    value: 'companyDomain',
    highlightFields: ['companyDomain'],
  },
  {
    label: getTransText('ZUOJIDIANHUA'),
    value: 'companyTelephone',
    highlightFields: ['companyTelephone'],
  },
  {
    label: getTransText('YOUXIANG'),
    value: 'contactEmail',
    highlightFields: ['contactEmail', 'contactEmailSuffix'],
  },
  {
    label: getTransText('DIANHUA'),
    value: 'contactTelephone',
    highlightFields: ['contactTelephone'],
  },
  {
    label: 'WhatsApp',
    value: 'contactWhatsapp',
    highlightFields: ['contactWhatsapp'],
  },
  {
    label: getTransText('GERENZHUYE'),
    value: 'contactHomePage',
    highlightFields: ['contactHomePage'],
  },
];
function renderTime(value: number) {
  return moment(value).format('YYYY-MM-DD HH:mm');
}

interface HighlightedProps {
  enable: boolean;
  text: string;
  highlight: string;
}
const Highlighted: React.FC<HighlightedProps> = ({ text = '', highlight = '', enable = false }: HighlightedProps) => {
  if (!highlight.trim() || !enable) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
  const parts = text.split(regex);

  return <span>{parts.filter(String).map((part, i) => (regex.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>))}</span>;
};
const ModuleFlag = [getTransText('KEHULIEBIAO'), getTransText('KEHUGONGHAI')];

interface CustomerDuplicateCheckProps {}
export const CustomerDuplicateCheck: React.FC = (props: CustomerDuplicateCheckProps) => {
  const [searchType, setSearchType] = useSessionStorage('customer-check-search-type', 'all');
  const [searchKey, setSearchKey] = useState('');
  const [searchKeyCache, setSearchKeyCache] = useSessionStorage('customer-check-search-key', '');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<JudgeRepeatItem[]>([]);
  const placeholder: string = useMemo(() => {
    const found = options.find(option => option.value === searchType);
    if (found) {
      return `${getTransText('QINGSHURU')} ${found.label}`;
    }
    return `${getTransText('SHURU')} ${getTransText('KEHUMINGCHENG')}、${getTransText('YOUXIANG')}、${getTransText('GONGSIYUMING')}、${getTransText(
      'ZUOJIDIANHUA'
    )}、${getTransText('DIANHUA')}、WhatsApp、${getTransText('GERENZHUYE')}、${getTransText('YOUXIANGHOUZHUI')}`;
  }, [searchType]);
  const columns = useMemo(
    () => [
      {
        title: getTransText('MOKUAI'),
        width: 100,
        dataIndex: 'moduleFlag',
        key: 'moduleFlag',
        render(_: number) {
          return ModuleFlag[_];
        },
      },
      // {
      //   title: '客户编号',
      //   dataIndex: 'companyNumber',
      //   key: 'companyNumber',
      // },
      {
        title: getTransText('GONGSIMINGCHENG'),
        dataIndex: 'companyName',
        key: 'companyName',
        render: (text: string) => <Highlighted text={text || '-'} enable={['all', 'companyName'].includes(searchType)} highlight={searchKeyCache} />,
      },
      {
        title: getTransText('FUZEREN'),
        dataIndex: 'owners',
        key: 'owners',
        width: 80,
        render: (text: { name: string }[]) => text.map(person => person.name).join('; '),
      },
      {
        title: getTransText('ZIDUAN'),
        dataIndex: 'fields',
        key: 'fields',
        render: (text: string, record: JudgeRepeatItem) => (
          <>
            {fields.map(({ value, label, highlightFields }) => (
              <div key={value}>
                {label}
                :
                <Highlighted text={record[value] || '-'} enable={['all'].concat(highlightFields).includes(searchType)} highlight={searchKeyCache} />
              </div>
            ))}
          </>
        ),
      },
      {
        title: getTransText('CHUANGJIANSHIJIAN'),
        dataIndex: 'companyCreateTime',
        key: 'companyCreateTime',
        width: 150,
        render: (text: number) => (text ? renderTime(text) : '-'),
      },
      {
        title: getTransText('ZUIJINGENJINSHIJIAN'),
        dataIndex: 'companyFollowAt',
        key: 'companyFollowAt',
        width: 150,
        render: (text: number) => (text ? renderTime(text) : '-'),
      },
      {
        title: getTransText('CAOZUO'),
        dataIndex: 'op',
        key: 'op',
        fixed: 'right',
        width: 76,
        render: (text: any, record: JudgeRepeatItem) => {
          let url = '';
          switch (record.moduleFlag) {
            case 0:
              if (record.canViewDetail === false) {
                return '-';
              }
              url = `#customer?page=customer&id=${record.companyId}&tab=2`;
              break;
            case 1:
              url = `#customer?page=customerOpenSea&id=${record.companyOpenSeaId}`;
              break;
            default:
              return null;
          }
          return <a onClick={() => navigate(url)}>{getTransText('CHAKAN')}</a>;
        },
      },
    ],
    [searchType, searchKeyCache]
  );
  useEffect(() => {
    if (searchKeyCache) {
      setSearchKey(searchKeyCache);
    }
  }, []);
  useEffect(() => {
    search();
  }, [searchType, searchKeyCache]);
  const updateSearchCache = useCallback(() => {
    setSearchKeyCache(searchKey);
  }, [searchKey]);
  const reset = useCallback(() => {
    setSearchType('all');
    setSearchKey('');
    setSearchKeyCache('');
  }, []);
  const search = async () => {
    if (!searchKeyCache) {
      return setData([]);
    }
    setLoading(true);
    try {
      const data = await clientApi.judgeRepeatSearch({
        conditions: [
          {
            field: searchType,
            value: searchKeyCache.trim(),
          },
        ],
      });
      setData(data);
    } catch (error) {}
    setLoading(false);
  };

  return (
    <div className={style.container}>
      <h2 className={style.heading}>
        <span className={style.title} onClick={reset}>
          {getTransText('KEHUCHAZHONG')}
        </span>
        <span className={style.desc}>{getTransText('CustomerDuplicateCheckTip')}</span>
      </h2>
      <Input.Group compact className={style.search}>
        <Input
          allowClear
          className={style.searchKey}
          value={searchKey}
          onPressEnter={updateSearchCache}
          onChange={e => setSearchKey(e.target.value)}
          placeholder={placeholder}
          prefix={
            <Select value={searchType} onChange={setSearchType} className={style.searchType} dropdownMatchSelectWidth={false} suffixIcon={<UpLine />}>
              <Option value="all">{getTransText('QUANBU')}</Option>
              {options.map(({ label, value }) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          }
        />
        <Button type="primary" className={style.btnSearch} loading={loading} onClick={updateSearchCache}>
          {getTransText('KEHUCHAZHONG')}
        </Button>
      </Input.Group>
      {data.length > 0 && <Table row="companyId" pagination={false} loading={loading} columns={columns} dataSource={data} scroll={{ x: 910 }} />}
      {searchKeyCache && data.length === 0 && !loading && (
        <div className={style.empty}>
          <div className={style.emptyImg} />
          <div>{getTransText('ZANWUSHUJU')}</div>
        </div>
      )}
    </div>
  );
};
