import React, { useEffect, useState } from 'react';
import style from './clientTableList.module.scss';
import { ReactComponent as StarIcon } from '@/images/icons/edm/star.svg';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import NotAllowIcon from '@/components/Layout/Customer/components/notAllowIcon/notAllowIcon';
import { RresponseCompanyCommonItem as tableItemType } from 'api';
import { getIn18Text } from 'api';
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
const rederStar = (nums: number) => {
  let element = '-' as any;
  if (nums) {
    element = new Array(nums).fill(1).map((key, index) => {
      return <StarIcon key={index} />;
    });
  }
  return element;
};
const getColumns = (editClientInfo: (id: string, type: string) => void, seeClientInfo: (id: string) => void, deleteRepeatCompany: (id: string) => void) => {
  return [
    {
      title: getIn18Text('GONGSIMINGCHENG'),
      dataIndex: 'company_name',
      width: 228,
      fixed: 'left',
      render: (text: string, record: tableItemType) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <EllipsisTooltip>
            <span
              className={style.companyName}
              onClick={() => {
                seeClientInfo(record.id);
              }}
            >
              {text || '-'}
            </span>
          </EllipsisTooltip>
        </div>
      ),
    },
    {
      title: getIn18Text('GUOJIADEQU'),
      width: 140,
      key: 'area',
      dataIndex: 'area',
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('KEHUFENJI'),
      width: 140,
      key: 'company_level',
      dataIndex: 'company_level',
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('QIANFUZEREN'),
      dataIndex: 'last_manager_name',
      width: 148,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('ZUIJINTUIGONGHAIYUANYIN'),
      dataIndex: 'last_return_reason',
      width: 196,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('ZHUYAOLIANXIREN'),
      width: 196,
      dataIndex: 'contact_list_contact_name',
      key: 'contact_list_contact_name',
      render: (text: string, record: tableItemType) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <EllipsisTooltip>{getMainContact(record.contact_list, 'contact_name')}</EllipsisTooltip>
          {/* 层级退信说明 */}
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
      title: getIn18Text('ZUIJINGENJINSHIJIAN'),
      dataIndex: 'active_time',
      width: 196,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
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
    {
      title: getIn18Text('XUQIUCHANPINLEIXING'),
      width: 152,
      key: 'require_product_type_label',
      dataIndex: 'require_product_type_label',
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('CHANPINXUQIUDU'),
      width: 162,
      key: 'product_require_level_label',
      dataIndex: 'product_require_level_label',
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
  ];
};
export { getColumns };
