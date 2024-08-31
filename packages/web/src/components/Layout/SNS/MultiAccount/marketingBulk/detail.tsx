import React, { useState, useEffect, useReducer } from 'react';
import { Breadcrumb, Tag, Input, Select, Table } from 'antd';
import { floor } from 'lodash';
import { navigate } from '@reach/router';
import { api, apis, InsertWhatsAppApi, MarketingTaskDetailResponse, MarketingTaskResponse as DetailProps } from 'api';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import style from '@web-edm/edm.module.scss';
import Stat from './components/stat/stat';
import JobIcon from '@/images/icons/edm/statistics1.png';
import DeliveryIcon from '@/images/icons/edm/statistics2.png';
import ReplyIcon from '@/images/icons/edm/statistics4.png';
import styles from './detail.module.scss';
import { getTransText } from '@/components/util/translate';

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

const { Option } = Select;

const optionList = [
  {
    name: '发送成功',
    id: 'SUCCESS',
  },
  {
    name: '发送失败',
    id: 'FAILURE',
  },
  {
    name: '触达',
    id: 'REACH',
  },
];
interface Props {
  qs: Record<string, string>;
}

const WaBulkDetail: React.FC<Props> = ({ qs }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [filters, setFilters] = useReducer(
    (
      state: any,
      action: {
        type: string;
        payload?: any;
      }
    ) => {
      switch (action.type) {
        case 'loadMore': {
          return {
            ...state,
            page: state.page + 1,
          };
        }
        case 'refresh': {
          return {
            ...state,
            page: 1,
          };
        }
        case 'update': {
          return {
            ...state,
            ...action.payload,
          };
        }
        default:
          return {
            ...state,
            ...action.payload,
          };
      }
    },
    {
      page: 1,
    }
  );

  const [detail, setDetail] = useState<DetailProps>({});
  const [list, setList] = useState<MarketingTaskDetailResponse[]>([]);
  const [tableHeight, setTableHeight] = useState(456);

  const columns = [
    {
      title: getTransText('MUBIAOWhatsAppHAOMA'),
      ellipsis: true,
      dataIndex: 'toNumber',
    },
    {
      title: getTransText('FASONGZHUANGTAI'),
      ellipsis: true,
      dataIndex: 'sendStatusName',
    },
    {
      title: getTransText('FASONGSHIJIAN'),
      dataIndex: 'sendAt',
    },
    {
      title: getTransText('FASONGZHANGHAO'),
      dataIndex: 'fromNumber',
    },
  ];

  const getTaskDetail = () => {
    whatsAppApi.marketTaskDetail(qs.taskId).then(res => {
      setDetail(res || {});
    });
  };

  useEffect(() => {
    if (!qs?.taskId) return;
    getTaskDetail();
  }, [qs?.taskId]);

  useEffect(() => {
    if (!qs?.taskId) return;
    setLoading(true);
    whatsAppApi
      .marketTaskDetailList({
        ...filters,
        taskId: qs.taskId,
        page: 1,
        pageSize: 100,
      })
      .then(res => {
        setTotalRecords(res.totalSize);
        setList(res.content);
      })
      .finally(() => setLoading(false));
  }, [filters, qs?.taskId]);

  const searchReceiver = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (value !== filters.searchNumber) {
      setFilters({ type: 'update', payload: { searchNumber: value, page: 1 } });
    }
  };
  const taskStateChange = (value: string) => {
    setFilters({
      type: 'update',
      payload: {
        page: 1,
        sendStatus: value,
        sort: undefined,
      },
    });
  };
  // 排序改变
  const handleTableChange = (pagination: any) => {
    setFilters({
      type: 'update',
      payload: {
        page: pagination.current,
      },
    });
    setPageSize(pagination.pageSize);
  };
  const handleExport = () => {
    return whatsAppApi
      .getWaBulkDetailExport({
        jobId: props.qs.jobId,
      })
      .then(res => {
        window.open(res.downloadUrl, '_blank');
      });
  };
  return (
    <div className={styles.container}>
      <Breadcrumb className={styles.breadcrumb} separator=">">
        <Breadcrumb.Item>
          <span onClick={() => navigate('#edm?page=marketBulk')}>{getTransText('RENWULIEBIAO')}</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{getTransText('RENWUXIANGQING')}</Breadcrumb.Item>
      </Breadcrumb>
      <div className={styles.basicInfo}>
        <div style={{ marginBottom: 16 }}>
          <span className={styles.jobName}>{detail.taskName}</span>
          <Tag>{detail.taskStatusName}</Tag>
        </div>
        <div className={styles.basicInfoText}>
          <div style={{ marginBottom: 8 }}>
            {getTransText('FASONGSHIJIAN')} {detail.createAt}
          </div>
          <div>
            {getTransText('NEIRONG：')}
            <div className={styles.mediaBox}>
              {detail.attach?.type === 'IMAGE' ? <img className={styles.img} alt="发送图片" src={detail.attach.url} /> : null}
              {detail.attach?.type === 'VIDEO' ? (
                <video style={{ width: '100%', height: '100%', maxHeight: 200 }} controlsList="nodownload" controls>
                  <source src={detail.attach.url}></source>
                </video>
              ) : null}
              <div className={styles.text}>{detail.content}</div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.heading}>
        <span className={styles.statsTitle}>{getTransText('RENWUTONGJI')}</span>
        <Select
          style={{ width: 100, marginLeft: 12, fontSize: 12 }}
          allowClear
          placeholder={getTransText('XUANZEZHUANGTAI')}
          optionFilterProp="children"
          onChange={taskStateChange}
          suffixIcon={<DownTriangle />}
          dropdownClassName="edm-selector-dropdown"
          className="no-border-select"
        >
          {optionList.map(item => (
            <Option value={item.id} key={item.id}>
              {item.name}
            </Option>
          ))}
        </Select>
        <Input
          placeholder={getTransText('QINGSHURUYAOSOUSUODEWhatsAppHAOMA')}
          style={{
            marginLeft: 8,
            width: 260,
            fontSize: 12,
            border: 'none',
            height: 32,
            verticalAlign: 'bottom',
          }}
          prefix={<SearchIcon />}
          onPressEnter={searchReceiver}
          onBlur={searchReceiver}
        />
        {/* <Button style={{ float: 'right', color: `${variables.brand6}`, borderColor: `${variables.brand6}` }} onClick={handleExport}>
          {getTransText('DAOCHU')}
        </Button> */}
      </div>
      <div className={styles.stats}>
        <Stat className={styles.stat} icon={<img alt="JobIcon" src={JobIcon} />} name={getTransText('FASONGZONGSHU')} title={detail.sentCount} />
        <Stat className={styles.stat} icon={<img alt="DeliveryIcon" src={DeliveryIcon} />} name={getTransText('CHUDAZONGSHU')} title={detail.reachCount} />
        <Stat className={styles.stat} icon={<img alt="ReplyIcon" src={ReplyIcon} />} name={getTransText('CHENGGONGLV')} title={detail.successRate} />
      </div>
      <div className="main">
        <Table
          className={`${style.contactTable}`}
          onChange={handleTableChange}
          loading={loading}
          columns={columns}
          dataSource={list}
          pagination={{
            className: 'pagination-wrap',
            size: 'small',
            total: totalRecords,
            current: filters.page,
            pageSize,
            pageSizeOptions: ['20', '50', '100'],
            showSizeChanger: true,
          }}
        />
      </div>
    </div>
  );
};

export default WaBulkDetail;
