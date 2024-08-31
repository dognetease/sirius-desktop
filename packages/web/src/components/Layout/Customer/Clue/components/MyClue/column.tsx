import React, { useState } from 'react';
import { Table, Popover, Tooltip, Pagination, Modal } from 'antd';
import style from './MyClue.module.scss';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { ReactComponent as ClientCombineIcon } from '@/images/icons/edm/client-combine.svg';
import { myClueItem as tableItemType } from 'api';
import classnames from 'classnames';
import NotAllowIcon from '@/components/Layout/Customer/components/notAllowIcon/notAllowIcon';
import { getIn18Text } from 'api';
const modalStatus = {
  new: 'new',
  edit: 'edit',
  examine: 'examine',
};
interface nameItem {
  name: string;
}
interface fieldType {
  field: string;
  value: string;
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
const CommonCustomerData = props => {
  const { record, examineClue, editClue, deleteRepeatClue } = props;
  const [visible, setVisible] = useState<boolean>(false);
  const customerHandler = (id: string) => {
    examineClue(id);
    setVisible(false);
  };
  const combineEvent = () => {
    setVisible(true);
  };
  const handleVisibleChange = (visible: boolean) => {
    setVisible(visible);
  };
  const getDupField = (arr: fieldType[]) => {
    if (Array.isArray(arr) && arr.length) {
      let name = arr[0].field;
      let value = arr.map(item => item.value).join('，');
      if (value) {
        return `${name}：${value}`;
      } else {
        return name;
      }
    }
    return '';
  };
  const columns = [
    {
      title: getIn18Text('XIANSUOMINGCHENG'),
      dataIndex: 'clue_name',
      key: 'clue_name',
      width: 220,
      ellipsis: {
        showTitle: false,
      },
      render: (text, record) => (
        <EllipsisTooltip>
          <span
            className={style.companyName}
            onClick={() => {
              customerHandler(record.clue_id);
            }}
          >
            {' '}
            {text || '-'}
          </span>
        </EllipsisTooltip>
      ),
    },
    {
      title: getIn18Text('XIANSUOBIANHAO'),
      dataIndex: 'clue_number',
      key: 'clue_number',
      width: 108,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('FUZEREN'),
      dataIndex: 'manager_list',
      width: 108,
      render: (text: nameItem[]) => getOwnerList(text) || '-',
    },
    {
      title: getIn18Text('ZHONGFUZIDUAN'),
      dataIndex: 'items',
      key: 'items',
      width: 108,
      render: (text: fieldType[]) => <EllipsisTooltip>{getDupField(text) || ''}</EllipsisTooltip>,
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
              editClue(record.clue_id, modalStatus.edit);
              setVisible(false);
            }}
          >
            {getIn18Text('BIANJI')}
          </a>
          <a
            onClick={() => {
              deleteRepeatClue(record.clue_id);
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
          {getIn18Text('XIANSUOSHUJUCUNZAIZHONGFUXINXI')}
          <span className={style.subTitle}>({record?.duplicate_data?.length})</span>
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
const TableElement = (props: any) => {
  const { email, contact_id, clue_id, valid, onOk } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {!valid && contact_id && <NotAllowIcon condition="clue" id={clue_id} contactId={contact_id} onOk={() => onOk()} />}
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <EllipsisTooltip>{email || '-'}</EllipsisTooltip>
      </div>
    </div>
  );
};
const getColumns = (
  editClue: (id: string, status: string) => void,
  examineClue: (id: string) => void,
  requestTableData: () => void,
  deleteRepeatClue: (id: string) => void
) => {
  return [
    {
      title: getIn18Text('XIANSUOMINGCHENG'),
      dataIndex: 'name',
      width: 332,
      fixed: 'left',
      ellipsis: {
        showTitle: false,
      },
      // render: (text, record, index) =>
      //     <EllipsisTooltip>
      //         <span className={ style.companyName } onClick={ ()=> {examineClue(record.id)} }> { text || '-' }</span>
      //     </EllipsisTooltip>
      render: (text: string, record: tableItemType) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <EllipsisTooltip>
            <span
              className={style.companyName}
              onClick={() => {
                examineClue(record.id);
              }}
            >
              {text || '-'}
            </span>
          </EllipsisTooltip>
          {/* 重复的线索  classnames*/}
          {record?.duplicate_data?.length ? <CommonCustomerData record={record} examineClue={examineClue} editClue={editClue} deleteRepeatClue={deleteRepeatClue} /> : ''}
        </div>
      ),
    },
    {
      title: getIn18Text('XIANSUOZHUANGTAI'),
      width: 152,
      dataIndex: 'status_name',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('XIANSUOLAIYUAN'),
      width: 184,
      dataIndex: 'source_name',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('XIANSUOPICI'),
      width: 184,
      dataIndex: 'clue_batch_label',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('XIANSUOBEIZHU'),
      width: 184,
      dataIndex: 'remark',
      ellipsis: {
        showTitle: false,
      },
      render: text => (
        <EllipsisTooltip>
          <span> {text || '-'}</span>
        </EllipsisTooltip>
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
      title: getIn18Text('ZHUYAOLIANXIREN'),
      width: 148,
      dataIndex: 'main_contact_name',
      key: 'main_contact_name',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('YOUXIANG'),
      width: 262,
      key: 'main_contact_email',
      dataIndex: 'main_contact_email',
      ellipsis: {
        showTitle: false,
      },
      render: (text, record: tableItemType) => (
        <TableElement email={text} valid={record.valid} contact_id={record.main_contact_id} clue_id={record.id} onOk={() => requestTableData()} />
      ),
    },
    {
      title: getIn18Text('CHUANGJIANFANGSHI'),
      width: 188,
      key: 'create_type_name',
      dataIndex: 'create_type_name',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('JINRUSIHAISHIJIAN'),
      dataIndex: 'enter_time',
      width: 196,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
      sorter: true,
    },
    {
      title: getIn18Text('WANGLAIYOUJIAN'),
      width: 172,
      dataIndex: 'exchange_cnt',
      sorter: true,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('ZUIJINGENJINSHIJIAN'),
      dataIndex: 'follow_time',
      width: 196,
      sorter: true,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('WEICHULITINGLIUSHIJIAN'),
      dataIndex: 'remain_time',
      width: 196,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    // {
    //     title: '跟进人',
    //     dataIndex: 'follow_by',
    //     width: 116,
    //     render:text => text || '-',
    // },
    {
      title: getIn18Text('FUZEREN'),
      dataIndex: 'manager_list',
      width: 148,
      render: text => getOwnerList(text) || '-',
    },
    {
      title: getIn18Text('CAOZUO'),
      key: 'operation',
      fixed: 'right',
      width: 117,
      render: (text, record, index) =>
        record.status == 4 ? (
          '-'
        ) : (
          <a
            onClick={() => {
              editClue(record.id, modalStatus.edit);
            }}
          >
            {getIn18Text('BIANJI')}
          </a>
        ),
    },
  ];
};
export { getColumns };
