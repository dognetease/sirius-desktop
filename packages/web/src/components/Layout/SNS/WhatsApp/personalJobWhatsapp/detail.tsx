import { getIn18Text } from 'api';
import React, { useState, useEffect, useReducer, useRef } from 'react';
import { Breadcrumb, Tag, Input, Select, Table, Button } from 'antd';
import { floor } from 'lodash';
import { navigate } from '@reach/router';
import { apis, apiHolder, WhatsAppApi, TaskInfo } from 'api';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { EdmPageProps } from '@web-edm/pageProps';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import Stat from '../job/components/stat/stat';
import JobIcon from '@/images/icons/edm/statistics1.png';
import DeliveryIcon from '@/images/icons/edm/statistics2.png';
import ReplyIcon from '@/images/icons/edm/statistics4.png';
import style from '@web-edm/edm.module.scss';
import styles from './detail.module.scss';
import variables from '@web-common/styles/export.module.scss';
import { getTransText } from '@/components/util/translate';

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

const { Option } = Select;

const optionList = [
  {
    name: getIn18Text('CHENGGONG'),
    id: 0,
  },
  {
    name: getIn18Text('SHIBAI'),
    id: 1,
  },
];
const initialDetail = {
  jobName: '',
  jobStatus: '',
  executeTime: '',
  content: '',
};
const initialStats = {
  deliveryCount: '',
  sentCount: '',
  successRadio: 0,
};

export const getRatio = (num: any) => {
  if (typeof num !== 'number') return '-';
  return `${floor(num * 100, 2)}%`;
};
const PersonalJobWhatsAppDetail: React.FC<EdmPageProps> = props => {
  const [loading, setLoading] = useState<boolean>(false);
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
      }
      return {
        ...state,
        ...action.payload,
      };
    },
    {
      page: 1,
    }
  );
  const [detail, setDetail] = useState<typeof initialDetail>(initialDetail);
  const [stats, setStats] = useState<typeof initialStats>(initialStats);
  const [list, setList] = useState<TaskInfo[]>([]);
  const [tableHeight, setTableHeight] = useState(456);
  const mainRef = useRef<HTMLDivElement>(null);

  const columns = [
    {
      title: getTransText('MUBIAOWhatsAppHAOMA'),
      ellipsis: true,
      dataIndex: 'receiverPhone',
    },
    {
      title: getTransText('FASONGZHUANGTAI'),
      ellipsis: true,
      dataIndex: 'taskStatus',
    },
    {
      title: getTransText('FASONGSHIJIAN'),
      dataIndex: 'sendTime',
    },
    {
      title: getTransText('FASONGZHANGHAO'),
      dataIndex: 'sender',
    },
  ];

  useEffect(() => {
    const payload = { jobId: props.qs.jobId };
    whatsAppApi.getPersonalJobWhatsAppDetail(payload).then(res => setDetail(res));
    whatsAppApi.getPersonalJobWhatsAppStatistic(payload).then(res => setStats(res));
    whatsAppApi
      .getPersonalJobWhatsAppDetailTable({
        ...payload,
        page: 1,
        pageSize: 100,
      })
      .then(res => setList(res.taskInfoList));
  }, []);
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const dimensions = entry.contentRect;
        setTableHeight(dimensions.height - 80);
      }
    });
    if (mainRef.current) {
      setTableHeight(mainRef.current.clientHeight - 80);
      observer.observe(mainRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [mainRef.current]);
  useEffect(() => {
    whatsAppApi
      .getPersonalJobWhatsAppDetailTable({
        ...filters,
        jobId: props.qs.jobId,
        page: 1,
        pageSize: 100,
      })
      .then(res => setList(res.taskInfoList));
  }, [filters]);

  const searchReceiver = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (value !== filters.receiver) {
      setFilters({ type: 'update', payload: { receiver: value, page: 1 } });
    }
  };
  const taskStateChange = (value: number) => {
    setFilters({
      type: 'update',
      payload: {
        page: 1,
        taskState: value,
        sort: undefined,
      },
    });
  };
  const handleExport = () => {
    return whatsAppApi
      .getPersonalJobWhatsAppDetailExport({
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
          <span onClick={() => navigate('#sns?page=pernsonalJobWhatsApp')}>{getTransText('RENWULIEBIAO')}</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{getTransText('RENWUXIANGQING')}</Breadcrumb.Item>
      </Breadcrumb>
      <div className={styles.basicInfo}>
        <div style={{ marginBottom: 16 }}>
          <span className={styles.jobName}>{detail.jobName}</span>
          <Tag>{detail.jobStatus}</Tag>
        </div>
        <div className={styles.basicInfoText}>
          <div style={{ marginBottom: 8 }}>
            {getTransText('')}
            {getTransText('FASONGSHIJIAN')} {detail.executeTime}
          </div>
          <div>
            {getTransText('NEIRONG：')} {detail.content}
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
        <Button style={{ float: 'right', color: `${variables.brand6}`, borderColor: `${variables.brand6}` }} onClick={handleExport}>
          {getTransText('DAOCHU')}
        </Button>
      </div>
      <div className={styles.stats}>
        <Stat className={styles.stat} icon={<img src={JobIcon} />} name={getTransText('FASONGZONGSHU')} title={stats.sentCount} />
        <Stat className={styles.stat} icon={<img src={DeliveryIcon} />} name={getTransText('CHUDAZONGSHU')} title={stats.deliveryCount} />
        <Stat className={styles.stat} icon={<img src={ReplyIcon} />} name={getTransText('CHENGGONGLV')} title={getRatio(stats.successRadio)} />
      </div>
      <div className="main" style={{ position: 'absolute', left: 24, right: 24, bottom: 24, top: 366 }} ref={mainRef}>
        <Table
          className={`${style.contactTable}`}
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ y: tableHeight }}
          sortDirections={['descend', 'ascend']}
          pagination={false}
        />
      </div>
    </div>
  );
};

export default PersonalJobWhatsAppDetail;
