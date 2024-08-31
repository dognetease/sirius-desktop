/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/alt-text */
import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import moment from 'moment';
import { DatePicker } from 'antd';
import { ColumnsType } from 'antd/es/table';
import {
  apiHolder,
  apis,
  WhatsAppApi,
  WhatsAppJobStat,
  WhatsAppJobState,
  getWhatsAppJobStateName,
  WhatsAppJobSendType,
  getWhatsAppJobSendTypeName,
  WhatsAppJobDetailV2,
  RequestWhatsAppJobs,
  WhatsAppJobSubmitType,
  getIn18Text,
  RequestEditWhatsAppJobV2,
} from 'api';
import { navigate } from '@reach/router';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
// import Input from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';

import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import JobIcon from '@/images/icons/edm/statistics1.png';
import DeliveryIcon from '@/images/icons/edm/statistics2.png';
import { RefreshSvg } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { ReactComponent as CreateJobIcon } from '@/images/icons/whatsApp/create-job.svg';
import ReadIcon from '@/images/icons/edm/statistics3.png';
import ReplyIcon from '@/images/icons/edm/statistics4.png';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { EmptyList } from '@web-edm/components/empty/empty';
import Stat, { getNum, getRatio } from './components/stat/stat';
import Quota, { QuotaMethods } from '../components/quota/quota';
import edmStyle from '@web-edm/edm.module.scss';
import { whatsAppTracker } from '@/components/Layout/SNS/tracker';
import { useResponsiveTable } from '@/hooks/useResponsiveTable';
import { getTransText } from '@/components/util/translate';
import { useWaContextV2 } from '../context/WaContextV2';
import style from './job.module.scss';

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const WhatsAppJobStateName = getWhatsAppJobStateName();
const WhatsAppJobSendTypeName = getWhatsAppJobSendTypeName();
const { RangePicker } = DatePicker;
const JOB_STATUS_OPTIONS = Object.values(WhatsAppJobState)
  .filter(value => typeof value === 'number')
  .map(value => ({
    label: WhatsAppJobStateName[value as WhatsAppJobState],
    value,
  }));
const JOB_SEND_TYPE_OPTIONS = Object.values(WhatsAppJobSendType)
  .filter(value => typeof value === 'number')
  .map(value => ({
    label: WhatsAppJobSendTypeName[value as WhatsAppJobSendType],
    value,
  }));
const Job = () => {
  const { refreshOrgStatus, refreshAllotPhones } = useWaContextV2();
  const [params, setParams] = useState<RequestWhatsAppJobs>({
    page: 1,
    pageSize: 20,
    keyWord: undefined,
    beginTime: undefined,
    endTime: undefined,
    jobState: undefined,
    sendType: undefined,
  });
  const [total, setTotal] = useState<number>(0);
  const [fetching, setFetching] = useState<boolean>(false);
  const [tableData, setTableData] = useState<WhatsAppJobDetailV2[]>([]);
  const [statData, setStatData] = useState<WhatsAppJobStat | null>(null);
  const quotaRef = useRef<QuotaMethods>(null);
  const { layout, growRef, scrollY } = useResponsiveTable();
  const handleReport = (jobId: string) => {
    navigate(`#edm?page=whatsAppJobReport&jobId=${jobId}`);
  };
  const columns: ColumnsType<WhatsAppJobDetailV2> = [
    {
      title: getIn18Text('RENWUMINGCHENG'),
      dataIndex: 'jobName',
      ellipsis: true,
      className: style.columnRangedWidth,
      render: (text: string) => text || '-',
    },
    {
      title: getIn18Text('ZHUANGTAI'),
      width: 90,
      dataIndex: 'jobState',
      render: (text: keyof typeof WhatsAppJobStateName) => WhatsAppJobStateName[text],
    },
    {
      title: getIn18Text('WhatsApv16'),
      width: 150,
      dataIndex: 'businessPhone',
    },
    {
      title: getIn18Text('MUBIAORENSHU'),
      width: 90,
      dataIndex: 'receiverNum',
    },
    {
      title: getIn18Text('CHUDARENSHU'),
      width: 90,
      dataIndex: 'deliveryNum',
    },
    {
      title: getIn18Text('DUQURENSHU'),
      width: 90,
      dataIndex: 'readNum',
    },
    {
      title: getIn18Text('HUIFURENSHU'),
      width: 90,
      dataIndex: 'replyNum',
    },
    {
      title: getIn18Text('LEIXING'),
      width: 90,
      dataIndex: 'sendType',
      render: (value: WhatsAppJobSendType) => WhatsAppJobSendTypeName[value],
    },
    {
      title: getIn18Text('ZHIXINGSHIJIAN'),
      width: 170,
      dataIndex: 'sendTime',
      render: (value: number, row: WhatsAppJobDetailV2) => {
        if (row.jobState === WhatsAppJobState.DRAFT) return '-';
        return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : '-';
      },
    },
    {
      title: getIn18Text('CHUANGJIANSHIJIAN'),
      width: 170,
      dataIndex: 'createTime',
      render: (value: number) => moment(value).format('YYYY-MM-DD'),
    },
    {
      title: getIn18Text('CHUANGJIANREN'),
      width: 90,
      dataIndex: 'createAccName',
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 140,
      fixed: 'right',
      dataIndex: 'operations',
      className: style.operations,
      render: (_: any, jobDetail: WhatsAppJobDetailV2) => (
        <>
          {jobDetail.jobState === WhatsAppJobState.DRAFT && (
            <>
              <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
                <a onClick={() => handleEdit(jobDetail.jobId)}>{getIn18Text('BIANJI')}</a>
              </PrivilegeCheck>
              <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
                <a onClick={() => handleCopy(jobDetail.jobId)}>{getIn18Text('FUZHI')}</a>
              </PrivilegeCheck>
              <PrivilegeCheck accessLabel="DELETE" resourceLabel="WHATSAPP">
                <a onClick={() => handleDelete(jobDetail.jobId)}>{getIn18Text('SHANCHU')}</a>
              </PrivilegeCheck>
            </>
          )}
          {jobDetail.jobState === WhatsAppJobState.TO_BE_SEND && (
            <>
              <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
                <a onClick={() => handleRevert(jobDetail.jobId)}>{getIn18Text('CHEXIAO')}</a>
              </PrivilegeCheck>
              <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
                <a onClick={() => handleEdit(jobDetail.jobId)}>{getIn18Text('BIANJI')}</a>
              </PrivilegeCheck>
              <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
                <a onClick={() => handleCopy(jobDetail.jobId)}>{getIn18Text('FUZHI')}</a>
              </PrivilegeCheck>
            </>
          )}
          {jobDetail.jobState === WhatsAppJobState.SENDING && (
            <>
              <PrivilegeCheck accessLabel="VIEW" resourceLabel="WHATSAPP">
                <a onClick={() => handleReport(jobDetail.jobId)}>{getIn18Text('BAOGAO')}</a>
              </PrivilegeCheck>
              <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
                <a onClick={() => handleCopy(jobDetail.jobId)}>{getIn18Text('FUZHI')}</a>
              </PrivilegeCheck>
            </>
          )}
          {jobDetail.jobState === WhatsAppJobState.SENT && (
            <>
              <PrivilegeCheck accessLabel="VIEW" resourceLabel="WHATSAPP">
                <a onClick={() => handleReport(jobDetail.jobId)}>{getIn18Text('BAOGAO')}</a>
              </PrivilegeCheck>
              <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
                <a onClick={() => handleCopy(jobDetail.jobId)}>{getIn18Text('FUZHI')}</a>
              </PrivilegeCheck>
            </>
          )}
          {jobDetail.jobState === WhatsAppJobState.REVERT && (
            <>
              <PrivilegeCheck accessLabel="VIEW" resourceLabel="WHATSAPP">
                <a onClick={() => handleReport(jobDetail.jobId)}>{getIn18Text('BAOGAO')}</a>
              </PrivilegeCheck>
              <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
                <a onClick={() => handleCopy(jobDetail.jobId)}>{getIn18Text('FUZHI')}</a>
              </PrivilegeCheck>
            </>
          )}
        </>
      ),
    },
  ];
  useEffect(() => {
    whatsAppTracker.trackJob('show');
  }, []);
  useEffect(() => {
    refreshAllotPhones();
  }, []);
  useEffect(() => {
    let didCancel = false;
    setFetching(true);
    whatsAppApi
      .getJobsV2(params)
      .then(data => {
        if (didCancel) return;
        if (!data) return;
        setTableData(data.jobList || []);
        setTotal(data.pageInfo?.totalSize || 0);
      })
      .finally(() => {
        if (didCancel) return;
        setFetching(false);
      });
    return () => {
      didCancel = true;
    };
  }, [params]);
  useEffect(() => {
    let didCancel = false;
    const { page, pageSize, ...restParams } = params;
    whatsAppApi
      .getJobsStatV2(restParams)
      .then(data => {
        if (didCancel) return;
        setStatData(data);
      })
      .finally(() => {
        if (didCancel) return;
        setFetching(false);
      });
    return () => {
      didCancel = true;
    };
  }, [params]);
  const handleEdit = (jobId: string) => {
    navigate(`#edm?page=whatsAppJobEdit&jobId=${jobId}`);
  };
  const handleDelete = (jobId: string) => {
    Modal.confirm({
      title: getIn18Text('SHANCHURENWU'),
      content: getIn18Text('QUERENSHANCHUCIRENWUMA\uFF1F'),
      onOk: () =>
        whatsAppApi.deleteJobV2({ jobId }).then(() => {
          setParams({ ...params, page: 1 });
          Toast.success({ content: getIn18Text('SHANCHUCHENGGONG\uFF01') });
        }),
    });
  };
  const handleRevert = (jobId: string) => {
    Modal.confirm({
      title: getIn18Text('CHEXIAORENWU'),
      content: getIn18Text('QUERENCHEXIAOCIRENWUMA\uFF1F'),
      onOk: () =>
        whatsAppApi.revertJobV2({ jobId }).then(() => {
          setParams({ ...params, page: 1 });
          Toast.success({ content: getIn18Text('CHEXIAOCHENGGONG\uFF01') });
        }),
    });
  };
  const handleCopy = (jobId: string) => {
    setFetching(true);
    whatsAppApi.getJobDetailV2({ jobId }).then(jobDetail => {
      const { id, jobId, ...jobDetailWithoutJobId } = jobDetail;
      whatsAppApi
        .createJobV2({
          ...jobDetailWithoutJobId,
          submit: WhatsAppJobSubmitType.DRAFT,
        } as unknown as RequestEditWhatsAppJobV2)
        .then(nextJob => {
          navigate(`#edm?page=whatsAppJobEdit&jobId=${nextJob.jobId}`);
        })
        .finally(() => {
          setFetching(false);
        });
    });
  };

  return (
    <PermissionCheckPage resourceLabel="WHATSAPP" accessLabel="VIEW" menu="WHATSAPP_SEND_TASK">
      <div className={classnames('edm', edmStyle.container, style.job, layout.container)}>
        <div className={layout.static}>
          <div className={classnames(edmStyle.pageHeader, style.header)}>
            <span className={classnames(edmStyle.title, style.title)}>
              <span className={style.titleText}>{getIn18Text('WhatsApp QUNFARENWU')}</span>
              <Quota className={style.topbarQuota} ref={quotaRef} />
              <span
                className={classnames(style.refresh, 'sirius-no-drag')}
                onClick={() => {
                  setParams({ ...params });
                  quotaRef.current?.refresh();
                  refreshOrgStatus();
                  refreshAllotPhones();
                }}
              >
                <RefreshSvg />
              </span>
            </span>
            <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
              <Button
                className={classnames(style.headerButton, 'sirius-no-drag')}
                btnType="primary"
                // icon={}
                onClick={() => {
                  navigate('#sns?page=whatsAppJobEdit');
                  whatsAppTracker.trackJob('create');
                }}
              >
                <CreateJobIcon className={style.createJobIcon} />
                {getIn18Text('CHUANGJIANRENWU')}
              </Button>
            </PrivilegeCheck>
          </div>
          <div className={classnames(edmStyle.filterBlock, style.filter)}>
            <Input
              placeholder={getIn18Text('QINGSHURUSOUSUONEIRONG')}
              prefix={<SearchIcon />}
              suffix={null}
              value={params.keyWord}
              allowClear
              onChange={event =>
                setParams({
                  ...params,
                  keyWord: event.target.value,
                  page: 1,
                })
              }
              onBlur={event =>
                setParams({
                  ...params,
                  keyWord: event.target.value,
                  page: 1,
                })
              }
              onPressEnter={event =>
                setParams({
                  ...params,
                  keyWord: event.currentTarget.value,
                  page: 1,
                })
              }
            />
            <RangePicker
              className="edm-range-picker"
              dropdownClassName="edm-date-picker-dropdown-wrap"
              placeholder={[getIn18Text('QINGXUANZERENWURIQI'), '']}
              value={params.beginTime && params.endTime ? [moment(params.beginTime), moment(params.endTime)] : undefined}
              onChange={values => {
                if (values && values[0] && values[1]) {
                  setParams({
                    ...params,
                    beginTime: values[0].startOf('day').valueOf(),
                    endTime: values[1].endOf('day').valueOf(),
                    page: 1,
                  });
                } else {
                  setParams({
                    ...params,
                    beginTime: undefined,
                    endTime: undefined,
                    page: 1,
                  });
                }
              }}
            />
            <EnhanceSelect
              placeholder={getIn18Text('XUANZEZHUANGTAI')}
              className="no-border-select"
              suffixIcon={<DownTriangle />}
              dropdownClassName="edm-selector-dropdown"
              allowClear
              options={JOB_STATUS_OPTIONS}
              value={params.jobState}
              onChange={jobState =>
                setParams({
                  ...params,
                  jobState,
                  page: 1,
                })
              }
            />
            <EnhanceSelect
              placeholder={getIn18Text('XUANZELEIXING')}
              className="no-border-select"
              suffixIcon={<DownTriangle />}
              dropdownClassName="edm-selector-dropdown"
              allowClear
              options={JOB_SEND_TYPE_OPTIONS}
              value={params.sendType}
              onChange={sendType =>
                setParams({
                  ...params,
                  sendType,
                  page: 1,
                })
              }
            />
          </div>
          <div className={style.stats}>
            <Stat className={style.stat} icon={<img src={JobIcon} />} name={getIn18Text('RENWUZONGSHU')} title={getNum(statData?.jobNum)} />
            <Stat
              className={style.stat}
              icon={<img src={DeliveryIcon} />}
              name={getIn18Text('CHUDAZONGSHU')}
              title={getNum(statData?.deliveryNum)}
              subTitle={`${getTransText('CHUDALV')}：${getRatio(statData?.deliveryRatio)}`}
            />
            <Stat
              className={style.stat}
              icon={<img src={ReadIcon} />}
              name={getIn18Text('DUQUZONGSHU')}
              title={getNum(statData?.readNum)}
              subTitle={`${getTransText('DUQULV')}：${getRatio(statData?.readRatio)}`}
            />
            <Stat
              className={style.stat}
              icon={<img src={ReplyIcon} />}
              name={getIn18Text('HUIFUZONGSHU')}
              title={getNum(statData?.replyNum)}
              subTitle={`${getTransText('HUIFULV')}：${getRatio(statData?.replyRatio)}`}
            />
          </div>
        </div>
        {tableData.length ? (
          <div className={layout.grow} ref={growRef}>
            <Table
              // className={edmStyle.contactTable}
              rowKey="jobId"
              columns={columns}
              loading={fetching}
              dataSource={tableData}
              scroll={{
                x: 'max-content',
                y: scrollY,
              }}
              pagination={{
                className: 'pagination-wrap',
                size: 'small',
                total,
                current: params.page,
                pageSize: params.pageSize,
                pageSizeOptions: ['20', '50', '100'],
                showSizeChanger: true,
              }}
              onChange={pagination => {
                setParams(previous => ({
                  ...params,
                  pageSize: pagination.pageSize as number,
                  page: pagination.pageSize === previous.pageSize ? (pagination.current as number) : 1,
                }));
              }}
            />
          </div>
        ) : (
          <EmptyList style={{ height: 300 }}>
            <p>{getIn18Text('DANGQIANMEIYOURENHEQUNFARENWU')}</p>
          </EmptyList>
        )}
      </div>
    </PermissionCheckPage>
  );
};
export default Job;
