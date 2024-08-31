import React, { useEffect, useState } from 'react';
import { Table, Tooltip, Popover } from 'antd';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import style from './clientTableList.module.scss';
import { ReactComponent as StarIcon } from '@/images/icons/edm/star.svg';
import { ReactComponent as StartIcon } from '@/images/icons/edm/business-start.svg';
import { ReactComponent as CloseIcon } from '@/images/icons/edm/business-close.svg';
import { ReactComponent as ClientCombineIcon } from '@/images/icons/edm/client-combine.svg';
import { ReactComponent as CountryIcon } from '@/images/icons/edm/country.svg';
import { ReactComponent as PersonsIcon } from '@/images/icons/edm/persons.svg';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import EllipsisLabels from '@/components/Layout/Customer/components/ellipsisLabels/ellipsisLabels';
import { customerDataTracker } from '../../../tracker/customerDataTracker';
import NotAllowIcon from '@/components/Layout/Customer/components/notAllowIcon/notAllowIcon';
import { apiHolder, apis, CustomerApi, api, ContactDetailRes, RresponseCompanyCommonItem as tableItemType } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const systemApi = api.getSystemApi();
import classnames from 'classnames';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/question.svg';
import { getIn18Text } from 'api';
const modalStatus = {
  new: 'new',
  edit: 'edit',
  examine: 'examine',
};
interface nameItem {
  name: string;
  id: string;
}
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
interface tableProps {
  list: tableItemType['contact_list'];
  contactKey: string;
  company_id: string;
}
const TableElement = (props: tableProps) => {
  const { list, contactKey, company_id } = props;
  const [contactList, setContactList] = useState<tableItemType['contact_list']>(() => list);
  useEffect(() => {
    if (list && list.length) console.log('xxxxlist-contact-list-123', list[0]);
    setContactList(list);
  }, [list]);
  if (contactList && contactList.length) {
    const item = contactList[0];
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {!item.valid && (
          <NotAllowIcon
            condition="company"
            id={company_id}
            contactId={item.contact_id}
            onOk={() => {
              contactList[0].valid = true;
              let newContat = [...contactList];
              setContactList(newContat);
            }}
          />
        )}
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <EllipsisTooltip>{item[contactKey] || '-'}</EllipsisTooltip>
        </div>
      </div>
    );
  } else {
    return <>-</>;
  }
};
const getMainContact = (list: tableItemType['contact_list'], key: string) => {
  if (list && list.length) {
    const item = list[0];
    return item[key] || '-';
  } else {
    return '-';
  }
};
const getMainContactRejected = (list: tableItemType['contact_list'], key: string) => {
  if (list && list.length) {
    const item = list[0];
    return (
      item.rejected && (
        <div style={{ paddingLeft: 5, color: '#FFAA00', cursor: 'pointer' }}>
          <Tooltip placement="topLeft" title={getIn18Text('ZENGTUIDING')}>
            <ExclamationCircleOutlined />
          </Tooltip>
        </div>
      )
    );
  } else {
    return null;
  }
};
const rederStar = (nums: number) => {
  let element = '-' as any;
  if (nums) {
    element = new Array(nums).fill(1).map((key, index) => {
      return <StarIcon key={index} />;
    });
  }
  return element;
};
const businessIng = flag => {
  if (typeof flag === 'boolean') {
    return true;
  }
  return false;
};
const BusinessIcon = flag => {
  if (flag) {
    return <StartIcon style={{ display: 'block' }} />;
  }
  return <CloseIcon style={{ display: 'block' }} />;
};
const getNumber = (nums, record) => {
  if (isNaN(nums) || typeof nums === 'object') {
    return nums;
  } else {
    if (record.currency_code) {
      return `${record.currency_code} ${Number(nums).toLocaleString()}`;
    } else {
      return Number(nums).toLocaleString();
    }
  }
};
// 多联系人展示
const PopoverContactList = props => {
  const id = props.id;
  const [list, setList] = useState<ContactDetailRes[]>([]);
  const getContactList = id => {
    const param = {
      company_id: id,
      condition: 'company',
    };
    clientApi.companyContactListById(param).then(res => {
      console.log('contact-list', res);
      setList(res);
    });
  };
  interface arrData {
    type: string;
    number: string;
    name: string;
  }
  const getSocialPlatForm = (arrData: arrData[]) => {
    if (arrData && arrData.length) {
      return arrData
        .map(item => {
          return `${[item.name]}：${item.number}`;
        })
        .join('；');
    }
    return '-';
  };
  const columns = [
    {
      title: getIn18Text('LIANXIREN'),
      dataIndex: 'contact_name',
      width: 116,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('YOUXIANG'),
      width: 86,
      dataIndex: 'email',
      render: (text, record) => <TableElement list={[{ ...record }]} contactKey={'email'} company_id={props.id} />,
      // render:text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>
    },
    {
      title: getIn18Text('DIANHUA'),
      width: 108,
      dataIndex: 'telephones',
      render: text => <EllipsisTooltip>{(text && text.join(',')) || '-'}</EllipsisTooltip>,
    },
    {
      title: 'WhatsApp',
      dataIndex: 'whats_app',
      width: 110,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('SHEJIAOPINGTAI'),
      width: 100,
      dataIndex: 'social_platform',
      render: text => <EllipsisTooltip>{getSocialPlatForm(text) || '-'}</EllipsisTooltip>,
    },
  ] as any;
  const content = (
    <div className={style.customerTalbleColumn}>
      <div style={{ marginBottom: 12 }}>
        <h3 className={style.title}>
          {getIn18Text('LIANXIREN')}
          <span className={style.subTitle}>({list.length})</span>
        </h3>
      </div>
      <Table className="edm-table" rowKey={() => Math.random()} scroll={{ y: 220 }} columns={columns} pagination={false} dataSource={list} />
    </div>
  );
  return (
    <Popover placement="bottomLeft" content={content} trigger="click">
      <div
        onClick={() => {
          getContactList(id);
        }}
        style={{ paddingLeft: 5, color: '#FFAA00', cursor: 'pointer', height: 16 }}
      >
        <PersonsIcon style={{ display: 'block' }} />
      </div>
    </Popover>
  );
};
// 展示国家
const PopoverCountry = () => {
  return (
    <Popover
      placement="bottomLeft"
      content={<span style={{ padding: '16px', display: 'inline-block' }}>{getIn18Text('GUOJIADEQUZIDUANGESHIBUBIAOZHUN\uFF0CKEZHONGXINBIANJI')}</span>}
      trigger="hover"
    >
      <div style={{ paddingLeft: 5, color: '#FFAA00', cursor: 'pointer', height: 16 }}>
        <CountryIcon style={{ display: 'block' }} />
      </div>
    </Popover>
  );
};
const PopoverContent = props => {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const getBusinessList = id => {
    customerDataTracker.trackCustomerBusinessClick();
    let params = {
      company_id_list: [id],
      page: 1,
      page_size: 100,
    };
    clientApi.opportunityListAll(params).then(res => {
      const { total_size, content } = res;
      setList(content);
      setTotal(total_size);
      console.log('xxxxxx---opportunity', res);
    });
  };
  const examineBusinessInfo = (id: string) => {
    console.log('查看商机信息id', id);
    const previewPath = `/opportunityPreview/?opportunity_id=${id}`;
    systemApi.handleJumpUrl(Date.now(), previewPath);
  };
  const columns = [
    {
      title: getIn18Text('SHANGJIMINGCHENG'),
      dataIndex: 'name',
      width: 116,
      // fixed: 'left',
      ellipsis: {
        showTitle: false,
      },
      render: (text, record) => (
        <EllipsisTooltip>
          <span
            className={style.companyName}
            onClick={() => {
              examineBusinessInfo(record.id);
            }}
          >
            {' '}
            {text || '-'}
          </span>
        </EllipsisTooltip>
      ),
    },
    {
      title: getIn18Text('SHANGJIJIEDUAN'),
      width: 86,
      dataIndex: 'stage_name',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('YUGUSHANGJIJINE'),
      width: 108,
      dataIndex: 'estimate',
      render: (text, record) => <EllipsisTooltip>{getNumber(text, record) || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('CHENGJIAORIQI'),
      dataIndex: 'deal_at',
      width: 110,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
      // sorter: true
    },
    {
      title: getIn18Text('CHENGJIAOJINE'),
      width: 100,
      dataIndex: 'turnover',
      render: (text, record) => <EllipsisTooltip>{getNumber(text, record) || '-'}</EllipsisTooltip>,
    },
  ] as any;
  const content = (
    <div className={style.customerTalbleColumn}>
      <div style={{ marginBottom: 12 }}>
        <h3 className={style.title}>
          {getIn18Text('SHANGJI')}
          <span className={style.subTitle}>({total})</span>
        </h3>
      </div>
      <Table className="edm-table" rowKey={() => Math.random()} scroll={{ y: 220 }} columns={columns} pagination={false} dataSource={list} />
    </div>
  );
  return (
    <Popover placement="bottomLeft" content={content} trigger="click">
      <div
        onClick={() => {
          getBusinessList(props.record.company_id);
        }}
        style={{ paddingLeft: 5, color: '#FFAA00', cursor: 'pointer', height: 16 }}
      >
        {BusinessIcon(props.record.ongoing_opportunity_flag)}
      </div>
    </Popover>
  );
};
const CommonCustomerData = props => {
  const { record, seeInfo, editClientInfo, deleteRepeatCompany } = props;
  const [visible, setVisible] = useState<boolean>(false);
  const customerHandler = (id: string) => {
    seeInfo(id);
    setVisible(false);
  };
  const combineEvent = () => {
    setVisible(true);
  };
  const handleVisibleChange = (visible: boolean) => {
    setVisible(visible);
  };
  const getDupField = (
    data: string,
    arr2: {
      field: string;
      value: string;
    }[]
  ) => {
    let showValue = '';
    let arr1 = data.split('，');
    if (data && arr1 && arr1.length) {
      let map = new Map();
      arr1.forEach(key => {
        map.set(key, []);
      });
      arr2 &&
        arr2.length &&
        arr2.forEach(item => {
          if (map.has(item.field)) {
            let oldValue = map.get(item.field);
            map.set(item.field, [...oldValue, item.value]);
          }
        });
      map.forEach((value, key) => {
        if (showValue) {
          showValue = `${showValue}，${key}：${value.join('，')}`;
        } else {
          showValue = `${key}：${value.join('，')}`;
        }
      });
      return showValue;
    } else {
      return '-';
    }
  };
  const columns = [
    {
      title: getIn18Text('KEHUMINGCHENG'),
      dataIndex: 'company_name',
      key: 'company_name',
      width: 220,
      ellipsis: {
        showTitle: false,
      },
      render: (text, record) => (
        <EllipsisTooltip>
          <span
            className={style.companyName}
            onClick={() => {
              customerHandler(record.company_id);
            }}
          >
            {' '}
            {text || '-'}
          </span>
        </EllipsisTooltip>
      ),
    },
    {
      title: getIn18Text('KEHUBIANHAO'),
      dataIndex: 'company_number',
      key: 'company_number',
      width: 108,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('FUZEREN'),
      dataIndex: 'manager_list',
      width: 116,
      render: (text: nameItem[]) => getOwnerList(text) || '-',
    },
    {
      title: getIn18Text('ZHONGFUZIDUAN'),
      dataIndex: 'dup_field',
      key: 'dup_field',
      width: 102,
      render: (text: string, record) => <EllipsisTooltip>{getDupField(text, record?.items)}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('CAOZUO'),
      key: 'operation',
      dataIndex: 'operation',
      fixed: 'right',
      width: 88,
      render: (text: string, record) => (
        <>
          <a
            style={{ marginRight: 5 }}
            onClick={() => {
              editClientInfo(record.company_id, modalStatus.edit);
              setVisible(false);
            }}
          >
            {getIn18Text('BIANJI')}
          </a>
          <a
            onClick={() => {
              deleteRepeatCompany(record.company_id);
              setVisible(false);
            }}
          >
            {getIn18Text('SHANCHU')}
          </a>
        </>
      ),
    },
  ] as any;
  const content = (
    <div className={classnames(style.customerTalbleColumn, style.customerTalbleColumnWidth)}>
      <div style={{ marginBottom: 12 }}>
        <h3 className={style.title}>
          {getIn18Text('KEHUSHUJUCUNZAIZHONGFUXINXI')}
          <span className={style.subTitle}>({record.duplicate_data.length})</span>
        </h3>
        <span className={style.subDec}>{getIn18Text('KESHOUDONGXIUGAIHUOSHANCHUZHONGFUSHUJU')}</span>
      </div>
      <Table className="edm-table" rowKey={() => Math.random()} columns={columns} scroll={{ y: 220 }} pagination={false} dataSource={record.duplicate_data} />
    </div>
  );
  return (
    <Popover placement="bottomLeft" content={content} trigger="click" visible={visible} onVisibleChange={handleVisibleChange}>
      <div style={{ paddingLeft: 5, color: '#FFAA00', cursor: 'pointer', height: 16 }}>{<ClientCombineIcon style={{ display: 'block' }} onClick={combineEvent} />}</div>
    </Popover>
  );
};
const content = (
  <div style={{ width: 'fit-content', borderRadius: 5, padding: 16 }}>
    <h4 style={{ margin: 0 }}>{getIn18Text('ZUIJINGENJINSHIJIANBIANHUADONGZUO')}</h4>
    <p style={{ margin: 0, paddingLeft: 2 }}>{getIn18Text('1\u3001FUZERENGEILIANXIRENFAYOUJIAN')}</p>
    <p style={{ margin: 0, paddingLeft: 2 }}>{getIn18Text('2\u3001FUZERENSHOUDAOLIANXIRENYOUJIAN')}</p>
    <p style={{ margin: 0, paddingLeft: 2 }}>{getIn18Text('3\u3001SHOUTIANGENJINJILU')}</p>
  </div>
);
const getColumns = (editClientInfo: (id: string, type: string) => void, seeClientInfo: (id: string) => void, deleteRepeatCompany: (id: string) => void) => {
  return [
    {
      title: getIn18Text('GONGSIMINGCHENG'),
      dataIndex: 'company_name',
      width: 260,
      fixed: 'left',
      render: (text: string, record: tableItemType) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <EllipsisTooltip>
            <span
              className={style.companyName}
              onClick={() => {
                seeClientInfo(record.company_id);
              }}
            >
              {text || '-'}
            </span>
          </EllipsisTooltip>
          {/* 暂时屏蔽合并客户 */}
          {record.exist_duplicate && (
            <CommonCustomerData record={record} seeInfo={seeClientInfo} editClientInfo={editClientInfo} deleteRepeatCompany={deleteRepeatCompany} />
          )}
          {/* 商机相关操作 */}
          {businessIng(record.ongoing_opportunity_flag) && <PopoverContent record={record} />}
        </div>
      ),
    },
    {
      title: getIn18Text('BIAOQIAN'),
      width: 204,
      ellipsis: {
        showTitle: false,
      },
      dataIndex: 'label_list',
      render: (text: tableItemType['label_list']) => <EllipsisLabels list={text || []} />,
    },
    {
      title: getIn18Text('GUOJIADEQU'),
      width: 140,
      key: 'area',
      dataIndex: 'area',
      ellipsis: {
        showTitle: false,
      },
      render: (text: string, record: tableItemType) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <EllipsisTooltip>{text || '-'}</EllipsisTooltip>
          {!record.standard_area_format && <PopoverCountry />}
        </div>
      ),
    },
    {
      title: getIn18Text('KEHUFENJI'),
      width: 140,
      key: 'company_level',
      dataIndex: 'company_level',
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('ZHUYAOLIANXIREN'),
      width: 148,
      dataIndex: 'contact_list_contact_name',
      key: 'contact_list_contact_name',
      render: (text: string, record: tableItemType) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <EllipsisTooltip>{getMainContact(record.contact_list, 'contact_name')}</EllipsisTooltip>
          {/* 层级退信说明 */}
          {getMainContactRejected(record.contact_list, 'contact_name')}
          {/* 联系人 */}
          {record.multi_contact_flag && <PopoverContactList id={record.company_id}></PopoverContactList>}
        </div>
      ),
    },
    {
      title: getIn18Text('YOUXIANG'),
      width: 248,
      dataIndex: 'contact_list_contact_emial',
      key: 'contact_list_contact_emial',
      ellipsis: {
        showTitle: false,
      },
      render: (text: tableItemType['contact_list'], record: tableItemType) => (
        <TableElement list={record.contact_list} contactKey={'email'} company_id={record.company_id} />
      ),
    },
    {
      title: getIn18Text('WANGLAIYOUJIAN'),
      width: 140,
      dataIndex: 'exchange_cnt',
      sorter: true,
    },
    {
      title: getIn18Text('CHUANGJIANSHIJIAN'),
      dataIndex: 'create_time',
      width: 196,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
      sorter: true,
    },
    {
      // title: '最近跟进时间',
      title: () => (
        <Popover placement="bottomRight" overlayClassName={style.openSeaRules} content={content} trigger="hover">
          <div className={style.tips}>
            {getIn18Text('ZUIJINGENJINSHIJIAN')}
            <QuestionIcon />
          </div>
        </Popover>
      ),
      dataIndex: 'active_time',
      width: 196,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
      sorter: true,
    },
    {
      title: getIn18Text('KEHULAIYUAN'),
      width: 140,
      key: 'source',
      dataIndex: 'source',
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('GONGSIJIANCHENG'),
      width: 140,
      ellipsis: {
        showTitle: false,
      },
      dataIndex: 'short_name',
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('GONGSIXINGJI'),
      width: 140,
      key: 'start_level',
      dataIndex: 'start_level',
      sorter: true,
      render: (text: number) => rederStar(text),
    },
    // {
    //     title: '主营产品',
    //     width: 108,
    //     key: 'start_level',
    //     dataIndex: 'start_level',
    //     render: (text) =>
    //         <EllipsisTooltip>
    //             <span>{ text || '-' }</span>
    //         </EllipsisTooltip>
    // },
    {
      title: getIn18Text('XUQIUCHANPINLEIXING'),
      width: 152,
      key: 'require_product_type_label',
      dataIndex: 'require_product_type_label',
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('CHANPINXUQIUDU'),
      width: 142,
      key: 'product_require_level_label',
      dataIndex: 'product_require_level_label',
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('WANGZHI'),
      width: 142,
      key: 'website',
      dataIndex: 'website',
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('CHUANGJIANFANGSHI'),
      width: 186,
      key: 'create_type_name',
      dataIndex: 'create_type_name',
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('FUZEREN'),
      dataIndex: 'manager_list',
      width: 148,
      render: (text: nameItem[]) => getOwnerList(text) || '-',
    },
    {
      title: getIn18Text('NIANCAIGOUE'),
      width: 142,
      key: 'purchase_amount',
      dataIndex: 'purchase_amount',
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('GONGSIGUIMO'),
      width: 142,
      key: 'scale',
      dataIndex: 'scale',
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('ZHUYINGCHANPINXINGYE'),
      width: 142,
      key: 'main_industry',
      dataIndex: 'main_industry',
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('KEHUYIXIANG'),
      width: 142,
      key: 'intent',
      dataIndex: 'intent',
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('CAOZUO'),
      key: 'operation',
      dataIndex: 'operation',
      fixed: 'right',
      width: 100,
      render: (text: string, record: tableItemType) => (
        <a
          onClick={() => {
            editClientInfo(record.company_id, modalStatus.edit);
          }}
        >
          {getIn18Text('BIANJI')}
        </a>
      ),
    },
  ];
};
export { getColumns };
