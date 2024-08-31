import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import moment from 'moment';
import { Button, Input, Select, Table, DatePicker } from 'antd';
import { ColumnsType } from 'antd/es/table';
import {
  apiHolder,
  apis,
  WhatsAppApi,
  WhatsAppJobStat,
  getWhatsAppJobStateName,
  WhatsAppJobStateColor,
  WhatsAppJobDetailV2,
  WhatsAppTemplateV2,
  WhatsAppJobReportReceiver,
  WhatsAppJobSubmitType,
  RequestWhatsAppJobReport,
  RequestEditWhatsAppJobV2,
  WhatsAppJobReceiverSendStateV2,
  getWhatsAppJobReceiverSendStateNameV2,
  WhatsAppJobReceiverSendStateColorV2,
  WhatsAppJobReportReceiverType,
  getWhatsAppJobReportReceiverTypeName,
} from 'api';
import { navigate } from '@reach/router';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { getBodyFixHeight, ELECTRON_TITLE_FIX_HEIGHT } from '@web-common/utils/constant';
import { showTemplatePreviewModal } from '../components/template/templatePreview';
import ArrowRight from '@web-common/components/UI/Icons/svgs/disk/ArrowRight';
import DeliveryIcon from '@/images/icons/edm/statistics2.png';
import ReadIcon from '@/images/icons/edm/statistics3.png';
import ReplyIcon from '@/images/icons/edm/statistics4.png';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { RefreshSvg } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import Stat, { getNum, getRatio } from './components/stat/stat';
import { getPreviewTextFromTemplate, fillTemplateWithTemplateParams } from '@/components/Layout/SNS/WhatsAppV2/utils';
import { getTransText } from '@/components/util/translate';
import edmStyle from '@web-edm/edm.module.scss';
import style from './jobReport.module.scss';
import { getIn18Text } from 'api';
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const WhatsAppJobReceiverSendStateName = getWhatsAppJobReceiverSendStateNameV2();
const WhatsAppJobStateName = getWhatsAppJobStateName();
const WhatsAppJobReportReceiverTypeName = getWhatsAppJobReportReceiverTypeName();
const { RangePicker } = DatePicker;
const SEND_STATE_OPTIONS = Object.values(WhatsAppJobReceiverSendStateV2)
  .filter(value => typeof value === 'number')
  .map(value => ({
    label: WhatsAppJobReceiverSendStateName[value as WhatsAppJobReceiverSendStateV2],
    value,
  }));
const renderTime = (value: number | null) => {
  if (value === null) return '-';
  return moment(value).format('YYYY-MM-DD HH:mm:ss');
};
interface JobReportProps {
  qs: Record<string, string>;
}
const JobReport: React.FC<JobReportProps> = props => {
  const { qs } = props;
  const [jobDetail, setJobDetail] = useState<WhatsAppJobDetailV2 | null>(null);
  const [template, setTemplate] = useState<WhatsAppTemplateV2 | null>(null);
  const [params, setParams] = useState<RequestWhatsAppJobReport | null>(null);
  const [statData, setStatData] = useState<WhatsAppJobStat | null>(null);
  const [tableData, setTableData] = useState<WhatsAppJobReportReceiver[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [fetching, setFetching] = useState<boolean>(false);
  const [copying, setCopying] = useState<boolean>(false);
  const handleJobDetailFetch = (jobId: string) => {
    whatsAppApi.getJobDetailV2({ jobId }).then(nextJobDetail => {
      setJobDetail(nextJobDetail);
      if (nextJobDetail.templateId) {
        whatsAppApi.getTemplateDetailV2({ id: nextJobDetail.templateId }).then(nextTemplate => {
          setTemplate(nextTemplate);
        });
      }
    });
  };
  useEffect(() => {
    if (qs.jobId) {
      handleJobDetailFetch(qs.jobId);
      setParams({
        jobId: qs.jobId,
        page: 1,
        pageSize: 20,
        beginTime: undefined,
        endTime: undefined,
        receiverName: undefined,
        sendState: undefined,
      });
    }
    return () => {
      setJobDetail(null);
      setTemplate(null);
      setStatData(null);
      setTableData([]);
      setTotal(0);
      setFetching(false);
    };
  }, [qs.jobId]);
  useEffect(() => {
    if (params) {
      let didCancel = false;
      setFetching(true);
      params.version = 221115; // 兼容 receiver item 状态
      whatsAppApi
        .getJobReportReceiversV2(params)
        .then(data => {
          if (didCancel) return;
          if (!data) return;
          setTableData(data.receiverList || []);
          setTotal(data.pageInfo?.totalSize || 0);
        })
        .finally(() => {
          if (didCancel) return;
          setFetching(false);
        });
      return () => {
        didCancel = true;
      };
    }
    return () => {};
  }, [params]);
  useEffect(() => {
    if (params) {
      let didCancel = false;
      const { page, pageSize, ...restParams } = params;
      whatsAppApi.getJobReportStatV2(restParams).then(data => {
        if (didCancel) return;
        setStatData(data);
      });
      return () => {
        didCancel = true;
      };
    }
    return () => {};
  }, [params]);
  const columns: ColumnsType<WhatsAppJobReportReceiver> = [
    {
      title: 'WhatsApp',
      width: 150,
      dataIndex: 'receiverPhone',
    },
    {
      title: getIn18Text('LIANXIREN'),
      width: 150,
      dataIndex: 'receiverName',
    },
    {
      title: getIn18Text('FASONGZHUANGTAI'),
      width: 90,
      dataIndex: 'sendState',
      render: (value: WhatsAppJobReceiverSendStateV2) => (
        <span style={{ color: WhatsAppJobReceiverSendStateColorV2[value] }}>{WhatsAppJobReceiverSendStateName[value]}</span>
      ),
    },
    {
      title: getTransText('SHIBAIYUANYIN'),
      className: style.minWidthCell,
      dataIndex: 'failedReason',
      render: (value: string) => value || '-',
    },
    {
      title: getIn18Text('SHIFOUDUQU'),
      width: 90,
      dataIndex: 'isRead',
      render: (value: number) => (value ? getIn18Text('SHI') : getIn18Text('FOU')),
    },
    {
      title: getIn18Text('DUQUSHIJIAN'),
      width: 170,
      dataIndex: 'readTime',
      render: renderTime,
    },
    {
      title: getIn18Text('SHIFOUHUIFU'),
      width: 90,
      dataIndex: 'isReply',
      render: (value: number) => (value ? getIn18Text('SHI') : getIn18Text('FOU')),
    },
    {
      title: getIn18Text('CHUCIHUIFUSHIJIAN'),
      dataIndex: 'replyTime',
      width: 170,
      render: renderTime,
    },
    {
      title: getIn18Text('ZUIXINDUIHUASHIJIAN'),
      dataIndex: 'latestReplyTime',
      width: 170,
      render: renderTime,
    },
    {
      title: getIn18Text('LEIXING'),
      width: 90,
      dataIndex: 'receiverType',
      render: (value: WhatsAppJobReportReceiverType) => WhatsAppJobReportReceiverTypeName[value] || '-',
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 100,
      fixed: 'right',
      dataIndex: 'operations',
      className: style.operations,
      render: (_: any, row: WhatsAppJobReportReceiver) => (
        <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
          <a onClick={() => navigate(`#edm?page=whatsAppMessage&from=${row.sender}&chatId=${row.chatId}`)}>{getIn18Text('LIAOTIANJILU')}</a>
        </PrivilegeCheck>
      ),
    },
  ];
  const handleTemplatePreview = (template: WhatsAppTemplateV2) => {
    if (!jobDetail) return;
    const filledTemplate = fillTemplateWithTemplateParams({
      template,
      extraction: jobDetail.receivers,
      templateParams: jobDetail.templateParams || [],
    });
    filledTemplate && showTemplatePreviewModal(filledTemplate);
  };
  const handleCopy = (jobDetail: WhatsAppJobDetailV2) => {
    const { id, jobId, ...jobDetailWithoutJobId } = jobDetail;
    setCopying(true);
    whatsAppApi
      .createJobV2({
        ...jobDetailWithoutJobId,
        submit: WhatsAppJobSubmitType.DRAFT,
      } as unknown as RequestEditWhatsAppJobV2)
      .then(nextJob => {
        navigate(`#edm?page=whatsAppJobEdit&jobId=${nextJob.jobId}`);
      })
      .finally(() => {
        setCopying(false);
      });
  };
  return (
    <PermissionCheckPage resourceLabel="WHATSAPP" accessLabel="VIEW" menu="WHATSAPP_SEND_TASK">
      <div className={classnames('edm', edmStyle.container, style.jobReport)}>
        <div className={edmStyle.breadCrumb}>
          <div className={classnames(edmStyle.breadCrumbItem, edmStyle.clickableCrumb)} onClick={() => navigate('#sns?page=whatsAppJob')}>
            {getIn18Text('RENWULIEBIAO')}
          </div>
          <ArrowRight stroke="#51555C" />
          <div className={classnames(edmStyle.breadCrumbItem, edmStyle.breadCrumbActive)}>
            {getIn18Text('RENWUXIANGQING')}
            <span
              className={style.refresh}
              onClick={() => {
                if (params) {
                  handleJobDetailFetch(params.jobId);
                  setParams({ ...params });
                }
              }}
            >
              <RefreshSvg />
            </span>
          </div>
        </div>
        <div className={style.jobDetail}>
          <div className={style.content}>
            <div className={style.jobDetailHeader}>
              <div className={style.jobName}>{jobDetail?.jobName || '-'}</div>
              {jobDetail && (
                <div
                  className={style.jobState}
                  style={{
                    color: WhatsAppJobStateColor[jobDetail.jobState].color,
                    backgroundColor: WhatsAppJobStateColor[jobDetail.jobState].backgroundColor,
                  }}
                >
                  {WhatsAppJobStateName[jobDetail.jobState]}
                </div>
              )}
            </div>
            <div className={style.jobDetailItem}>
              {getIn18Text('FASONGSHIJIAN\uFF1A')}
              {jobDetail?.sendTime ? moment(jobDetail?.sendTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </div>
            <div className={style.jobDetailItem}>
              {getIn18Text('NEIRONG\uFF1A')}
              {template ? getPreviewTextFromTemplate(template) : '-'}
            </div>
          </div>
          <div className={style.operations}>
            <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
              <Button loading={copying} disabled={!jobDetail} onClick={() => jobDetail && handleCopy(jobDetail)}>
                {getIn18Text('ZHONGXINSHIYONG')}
              </Button>
            </PrivilegeCheck>
            <PrivilegeCheck accessLabel="VIEW" resourceLabel="WHATSAPP">
              <Button disabled={!template} onClick={() => template && handleTemplatePreview(template)}>
                {getIn18Text('CHAKAN')}
              </Button>
            </PrivilegeCheck>
          </div>
        </div>
        <div className={style.statHeader}>
          <div className={style.statTitle}>{getIn18Text('RENWUTONGJI')}</div>
          {params && (
            <div className={classnames(edmStyle.filterBlock, style.statFilter)}>
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
              <Select
                placeholder={getIn18Text('XUANZEZHUANGTAI')}
                className="no-border-select"
                suffixIcon={<DownTriangle />}
                dropdownClassName="edm-selector-dropdown"
                allowClear
                options={SEND_STATE_OPTIONS}
                value={params.sendState}
                onChange={sendState =>
                  setParams({
                    ...params,
                    sendState,
                    page: 1,
                  })
                }
              />
              <Input
                placeholder={getIn18Text('QINGSHURULIANXIRENXINGMING')}
                prefix={<SearchIcon />}
                suffix={null}
                allowClear
                value={params.receiverName}
                onChange={event =>
                  setParams({
                    ...params,
                    receiverName: event.target.value,
                    page: 1,
                  })
                }
                onBlur={event =>
                  setParams({
                    ...params,
                    receiverName: event.target.value,
                    page: 1,
                  })
                }
                onPressEnter={event =>
                  setParams({
                    ...params,
                    receiverName: event.currentTarget.value,
                    page: 1,
                  })
                }
              />
            </div>
          )}
        </div>
        <div className={style.stats}>
          <Stat className={style.stat} icon={<img src={DeliveryIcon} />} name={getTransText('FASONGZONGSHU')} title={getNum(statData?.sendNum)} />
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
        {params && (
          <Table
            className={classnames(edmStyle.contactTable, style.table)}
            rowKey="receiverPhone"
            columns={columns}
            loading={fetching}
            dataSource={tableData}
            scroll={{
              x: 'max-content',
              y: getBodyFixHeight(true) ? `calc(100vh - 506px - ${ELECTRON_TITLE_FIX_HEIGHT}px)` : 'calc(100vh - 506px)',
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
                page: pagination.pageSize === previous?.pageSize ? (pagination.current as number) : 1,
              }));
            }}
          />
        )}
      </div>
    </PermissionCheckPage>
  );
};
export default JobReport;
