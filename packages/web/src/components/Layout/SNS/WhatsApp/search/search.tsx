import { getIn18Text } from 'api';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import qs from 'querystring';
import classnames from 'classnames';
import { Button, Input, Select, Table, Space, Form, Checkbox, Tooltip, ConfigProvider } from 'antd';
import { ColumnsType } from 'antd/es/table';
import {
  apis,
  apiHolder,
  urlStore,
  CustomerApi,
  WhatsAppApi,
  WhatsAppAiSearchParams,
  WhatsAppAiSearchResult,
  WhatsAppAiSearchTaskStatus,
  WhatsAppJobSubmitType,
  WhatsAppJobSendType,
  RequestEditWhatsAppJob,
  WhatsAppFileExtractStatus,
  WhatsAppAiSearchTag,
  WhatsAppAiSearchTagName,
  WhatsAppAiSearchTagColor,
  WhatsAppAiSearchTagBackgroundColor,
  WhatsAppAiSearchExportParams,
  WhatsAppFileExtractIndex,
} from 'api';
import { navigate, useLocation } from '@reach/router';
import { getBodyFixHeight, ELECTRON_TITLE_FIX_HEIGHT } from '@web-common/utils/constant';
import { downloadFile } from '@web-common/components/util/file';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import Label from '@/components/Layout/Customer/components/label/label';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { ReactComponent as AiSearchIcon } from '@/images/icons/whatsApp/ai-search-search.svg';
import { ReactComponent as AiSearchMatchTip } from '@/images/icons/whatsApp/ai-search-match-tip.svg';
import { whatsAppTracker } from '@/components/Layout/SNS/tracker';
import SearchProgress from './components/searchProgress';
import Quota, { QuotaMethods } from '../components/quota/quota';
import EmptyConent from './components/emptyContent';
import { useResponsiveTable } from '@/hooks/useResponsiveTable';
import { getTransText } from '@/components/util/translate';
import IntelligentSearch from '../../../Data/IntelligentSearch';
import style from './search.module.scss';
import SocailMediaLink, { autoDetect } from '@/components/Layout/globalSearch/component/SocialMediaLink/SocialMediaLink';

const httpApi = apiHolder.api.getDataTransApi();
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

const { Option } = Select;

const SEARCH_INTERVAL = 5000;

interface Country {
  label: string;
  code: string;
}

const TAG_OPTIONS = Object.values(WhatsAppAiSearchTag).map(value => ({
  label: WhatsAppAiSearchTagName[value as WhatsAppAiSearchTag],
  value,
}));

const SITE_OPTIONS = [
  {
    label: 'Facebook',
    value: 'facebook',
  },
  {
    label: 'Linkedin',
    value: 'linkedin',
  },
  {
    label: 'Twitter',
    value: 'twitter',
  },
  {
    label: 'Instagram',
    value: 'instagram',
  },
  {
    label: 'Telegram',
    value: 'telegram',
  },
  {
    label: 'Youtube',
    value: 'youtube',
  },
];

const Search = () => {
  const [params, setParams] = useState<WhatsAppAiSearchParams | null>(null);
  const [form] = Form.useForm();
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [tableData, setTableData] = useState<WhatsAppAiSearchResult[]>([]);
  const [taskStatus, setTaskStatus] = useState<WhatsAppAiSearchTaskStatus>(WhatsAppAiSearchTaskStatus.SEARCHING);
  const [isManualStop, setIsManualStop] = useState(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [minimize, setMinimize] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [marketCreating, setMarketCreating] = useState(false);
  const [resultExporting, setResultExporting] = useState(false);
  const { layout, growRef, scrollY } = useResponsiveTable();

  const hasSelectedRowKeys = !!selectedRowKeys.length;

  const isManualStopRef = useRef(isManualStop);

  const isFirstSearchedRef = useRef(true);

  const quotaRef = useRef<QuotaMethods>(null);

  const location = useLocation();

  const query = useMemo(() => qs.parse(location.hash.split('?')[1]), [location.hash]);

  useEffect(() => {
    if (query.page === 'whatsAppAiSearch') {
      quotaRef.current?.refresh();
    }
  }, [query.page]);

  const handleSearchStart = (values: WhatsAppAiSearchParams) => {
    values.content = (values.content || '').trim();

    if (values.content.length < 2) {
      Toast.error({ content: getTransText('AtLeast2Characters') || '' });
    } else if (values.content.length > 100) {
      Toast.error({ content: getTransText('NoMoreThan100Characters') || '' });
    } else {
      if (isFirstSearchedRef.current) {
        isFirstSearchedRef.current = false;
      }

      setParams({
        ...values,
        isAllMatch: Number(values.isAllMatch),
        page: 1,
        pageSize: 20,
      });
      setTotal(0);
      setTableData([]);
      setMinimize(false);
      setIsManualStop(false);
      setSelectedRowKeys([]);
    }
  };

  const handleSearchStop = () => {
    setVisible(false);
    setIsManualStop(true);
    setTaskStatus(WhatsAppAiSearchTaskStatus.STOP);

    if (total === 0) {
      Toast.error({
        content: `${getTransText('StopAISearchPrefix') || ''} 0 ${getTransText('StopAISearchSuffix') || ''}`,
      });
    } else {
      Toast.success({
        content: `${getTransText('StopAISearchPrefix') || ''} ${total} ${getTransText('StopAISearchSuffix') || ''}`,
      });
    }
  };

  const handleSearchFinish = () => {
    setVisible(false);
    Toast.success({
      content: `${getTransText('FinishAISearchPrefix') || ''} ${total} ${getTransText('FinishAISearchSuffix') || ''}`,
    });
  };

  const handleMarketHandler = (phoneNumbers: string[]) => {
    setMarketCreating(true);

    return whatsAppApi
      .extractJobReceiverText({ text: phoneNumbers.join(';') })
      .then(extractResult => {
        const extractResultFiltered = {
          ...extractResult,
          body: extractResult.body.filter(row => row.status !== WhatsAppFileExtractStatus.REPEAT),
        };

        return whatsAppApi.createJob({
          jobName: '',
          receivers: extractResultFiltered,
          sendType: WhatsAppJobSendType.SEND_NOW,
          submit: WhatsAppJobSubmitType.DRAFT,
        } as unknown as RequestEditWhatsAppJob);
      })
      .then(data => {
        navigate(`#edm?page=whatsAppJobEdit&jobId=${data.jobId}&from=whatsAppAiSearch`);
      })
      .finally(() => {
        setMarketCreating(false);
      });
  };

  const handleMarket = () => {
    whatsAppTracker.trackAiSearchAction('market');
    const selectedCount = selectedRowKeys.length;
    const quota = quotaRef.current?.getQuota();

    if (quota) {
      const remainCount24h = quota.basePackage.quotaCount - quota.basePackage.usedCount;
      const remainCountTotal = quota.whatsappSendCount.quotaCount - quota.whatsappSendCount.usedCount;

      if (remainCount24h <= 0) {
        return Toast.info(getTransText('24hReachesLimit') || '');
      }

      if (remainCountTotal <= 0) {
        return Toast.info(getTransText('EnterpriseTotalReachesLimit') || '');
      }

      if (selectedCount <= Math.min(remainCount24h, remainCountTotal)) {
        return handleMarketHandler(selectedRowKeys);
      }

      if (remainCount24h < remainCountTotal) {
        return Modal.confirm({
          className: style.quotaConfirmModal,
          title: getTransText('24hReachesLimit') || '',
          content: (
            <>
              {getTransText('24hReachesLimitContentPart1') || ''} {selectedCount} {getTransText('24hReachesLimitContentPart2') || ''}
              <span className={style.highlight}>
                {getTransText('24hReachesLimitContentPart3') || ''} {remainCount24h} {getTransText('24hReachesLimitContentPart4') || ''}
              </span>
              {getTransText('24hReachesLimitContentPart5') || ''}
            </>
          ),
          onOk: () => handleMarketHandler(selectedRowKeys.slice(0, remainCount24h)),
        });
      }

      if (remainCount24h >= remainCountTotal) {
        return Modal.confirm({
          className: style.quotaConfirmModal,
          title: getTransText('EnterpriseTotalReachesLimit') || '',
          content: (
            <>
              {getTransText('24hReachesLimitContentPart1') || ''} {selectedCount}
              {getIn18Text('GE')}
              {getTransText('24hReachesLimitContentPart2') || ''}
              <span className={style.highlight}>
                {getTransText('24hReachesLimitContentPart3') || ''} {remainCountTotal} {getTransText('24hReachesLimitContentPart4') || ''}
              </span>
              {getTransText('24hReachesLimitContentPart5') || ''}
            </>
          ),
          onOk: () => handleMarketHandler(selectedRowKeys.slice(0, remainCountTotal)),
        });
      }
    }
  };

  const handleResultExport = () => {
    whatsAppTracker.trackAiSearchAction('leadout');
    if (params) {
      setResultExporting(true);

      const { page, pageSize, ...restParams } = params;

      const exportUrl = urlStore.get('exportWhatsAppAiSearchResult') as string;

      const exportParams: WhatsAppAiSearchExportParams = {
        ...restParams,
        includePhoneNumberList: selectedRowKeys,
      };

      httpApi
        .post(exportUrl, exportParams, {
          responseType: 'blob',
          contentType: 'json',
        })
        .then(res => {
          const blob = res.rawData;
          const fileName = `${getTransText('WhatsAppExportFile') || ''}-${new Date().toLocaleString()}.xlsx`;

          downloadFile(blob, fileName);
        })
        .finally(() => {
          setResultExporting(false);
        });
    }
  };

  useEffect(() => {
    customerApi.getGlobalArea().then(({ country }: any) => {
      setCountries(country);
    });
  }, []);

  useEffect(() => {
    isManualStopRef.current = isManualStop;
  }, [isManualStop]);

  useEffect(() => {
    if (params) {
      let interval = -1 as unknown as NodeJS.Timer;

      setLoading(true);

      whatsAppApi
        .doAiSearch(params)
        .then(data => {
          setTotal(+data.total);
          setTableData(data.list);
          setTaskStatus(data.taskStatus);

          if (data.taskStatus === WhatsAppAiSearchTaskStatus.SEARCHING && !isManualStopRef.current) {
            setVisible(true);

            interval = setInterval(() => {
              whatsAppApi.doAiSearch(params).then(data => {
                if (!isManualStopRef.current) {
                  setTotal(+data.total);
                  setTableData(data.list);
                  setTaskStatus(data.taskStatus);

                  if (data.taskStatus === WhatsAppAiSearchTaskStatus.STOP) {
                    clearInterval(interval);
                  }
                } else {
                  clearInterval(interval);
                }
              });
            }, SEARCH_INTERVAL);
          }
        })
        .finally(() => {
          setLoading(false);
        });

      whatsAppTracker.trackAiSearch({
        input: params.content,
        country: params.countryList,
        source: params.siteList,
        label: params.tagList,
      });

      return () => {
        clearInterval(interval);
      };
    }
  }, [params]);

  const columns: ColumnsType<WhatsAppAiSearchResult> = [
    {
      title: getTransText('WhatsAppNumber') || '',
      width: 220,
      ellipsis: true,
      dataIndex: 'phoneNumber',
      render: (text: string, row: WhatsAppAiSearchResult) => (
        <Space>
          <span>{text}</span>
          {row.tagList.map(tag => (
            <Label key={tag} name={WhatsAppAiSearchTagName[tag]} color={WhatsAppAiSearchTagColor[tag]} backgroundColor={WhatsAppAiSearchTagBackgroundColor[tag]} />
          ))}
        </Space>
      ),
    },
    {
      title: getTransText('CountryRegion') || '',
      width: 120,
      ellipsis: true,
      dataIndex: 'countryCname',
    },
    {
      title: getTransText('PageTitle') || '',
      ellipsis: true,
      dataIndex: 'title',
    },
    {
      title: getTransText('SourceLink') || '',
      width: 300,
      ellipsis: true,
      dataIndex: 'linkUrl',
      render: (link: string) => (
        <SocailMediaLink tipType={autoDetect(link)} href={link} target="_blank" rel="noreferrer">
          {link}
        </SocailMediaLink>
      ),
    },
  ];

  return (
    <PermissionCheckPage resourceLabel="WHATSAPP" accessLabel="VIEW" menu="WHATSAPP_SEND_TASK">
      <div className={classnames('edm', style.search, layout.container)}>
        <div className={classnames(style.header, layout.static)}>
          <div className={style.title}>{getTransText('EngineSearching') || ''}</div>
          <Quota className={style.topbarQuota} type="topbar" ref={quotaRef} />
        </div>
        <div className={classnames(style.filter, layout.static)}>
          <Form form={form} layout="inline" onFinish={handleSearchStart}>
            <Form.Item name="content" initialValue="">
              <Input
                style={{ width: 188 }}
                placeholder={getTransText('EnterKeyword') || ''}
                prefix={<AiSearchIcon />}
                disabled={taskStatus === WhatsAppAiSearchTaskStatus.SEARCHING}
                allowClear
              />
            </Form.Item>
            <Form.Item name="countryList" initialValue={[]}>
              <Select
                dropdownClassName="edm-selector-dropdown"
                style={{ width: 130 }}
                mode="multiple"
                maxTagCount="responsive"
                placeholder={getTransText('Area') || ''}
                disabled={taskStatus === WhatsAppAiSearchTaskStatus.SEARCHING}
                filterOption
                optionFilterProp="label"
                options={countries.map(country => ({
                  label: country.label,
                  value: country.code,
                }))}
                suffixIcon={<DownTriangle />}
                autoFocus
                showArrow
                allowClear
                dropdownRender={menu => (
                  <>
                    <Space style={{ padding: '5px 12px' }}>
                      <a
                        onClick={() => {
                          form.setFieldsValue({ countryList: countries.map(item => item.code) });
                        }}
                      >
                        {getTransText('QUANXUAN')}
                      </a>
                      <a
                        onClick={() => {
                          form.setFieldsValue({ countryList: [] });
                        }}
                      >
                        {getTransText('QINGKONG')}
                      </a>
                    </Space>
                    {menu}
                  </>
                )}
              />
            </Form.Item>
            <Form.Item name="siteList" initialValue={[]}>
              <Select
                dropdownClassName="edm-selector-dropdown"
                style={{ width: 130 }}
                mode="multiple"
                maxTagCount="responsive"
                placeholder={getTransText('Platform') || ''}
                disabled={taskStatus === WhatsAppAiSearchTaskStatus.SEARCHING}
                filterOption
                optionFilterProp="label"
                options={SITE_OPTIONS}
                suffixIcon={<DownTriangle />}
                autoFocus
                showArrow
                allowClear
                dropdownRender={menu => (
                  <>
                    <Space style={{ padding: '5px 12px' }}>
                      <a
                        onClick={() => {
                          form.setFieldsValue({ siteList: SITE_OPTIONS.map(item => item.value) });
                        }}
                      >
                        {getTransText('QUANXUAN')}
                      </a>
                      <a
                        onClick={() => {
                          form.setFieldsValue({ siteList: [] });
                        }}
                      >
                        {getTransText('QINGKONG')}
                      </a>
                    </Space>
                    {menu}
                  </>
                )}
              />
            </Form.Item>
            <Form.Item name="tagList" initialValue={[]}>
              <Select
                dropdownClassName="edm-selector-dropdown"
                style={{ width: 130 }}
                mode="multiple"
                maxTagCount="responsive"
                placeholder={getTransText('Label') || ''}
                disabled={taskStatus === WhatsAppAiSearchTaskStatus.SEARCHING}
                filterOption
                optionFilterProp="label"
                options={TAG_OPTIONS}
                suffixIcon={<DownTriangle />}
                autoFocus
                showArrow
                allowClear
                dropdownRender={menu => (
                  <>
                    <Space style={{ padding: '5px 12px' }}>
                      <a
                        onClick={() => {
                          form.setFieldsValue({ tagList: TAG_OPTIONS.map(item => item.value) });
                        }}
                      >
                        {getTransText('QUANXUAN')}
                      </a>
                      <a
                        onClick={() => {
                          form.setFieldsValue({ tagList: [] });
                        }}
                      >
                        {getTransText('QINGKONG')}
                      </a>
                    </Space>
                    {menu}
                  </>
                )}
              />
            </Form.Item>
            <div className={style.isAllMatchFormItem}>
              <Form.Item name="isAllMatch" valuePropName="checked" initialValue>
                <Checkbox disabled={taskStatus === WhatsAppAiSearchTaskStatus.SEARCHING}>{getTransText('PreciseSearch') || ''}</Checkbox>
              </Form.Item>
              <Tooltip title={getTransText('PreciseSearchTip') || ''} placement="top" arrowPointAtCenter>
                <AiSearchMatchTip />
              </Tooltip>
            </div>
            <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
              <Form.Item className={style.searchSubmit}>
                <Button htmlType="submit" type="primary" disabled={loading} loading={taskStatus === WhatsAppAiSearchTaskStatus.SEARCHING}>
                  {taskStatus === WhatsAppAiSearchTaskStatus.STOP ? getTransText('StartSearch') || '' : getTransText('Searching') || ''}
                </Button>
              </Form.Item>
            </PrivilegeCheck>
          </Form>
        </div>
        <div className={classnames(style.table, layout.grow, layout.container)}>
          <div className={classnames(style.operations, layout.static)}>
            <Space>
              {hasSelectedRowKeys && (
                <span>
                  {getTransText('YIXUAN')}
                  {selectedRowKeys.length}
                </span>
              )}
              <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
                <Button type="primary" loading={marketCreating} disabled={!hasSelectedRowKeys} onClick={handleMarket}>
                  {getTransText('YIJIANYINGXIAO') || ''}
                </Button>
              </PrivilegeCheck>
            </Space>
            <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
              <Button loading={resultExporting} disabled={!hasSelectedRowKeys} onClick={handleResultExport}>
                {getTransText('ExportAll') || ''}
              </Button>
            </PrivilegeCheck>
          </div>
          <ConfigProvider renderEmpty={isFirstSearchedRef.current ? () => <EmptyConent height={scrollY ? scrollY - 30 : undefined} /> : undefined}>
            <div className={layout.grow} ref={growRef}>
              <Table
                rowKey="phoneNumber"
                columns={columns}
                loading={loading}
                dataSource={tableData}
                scroll={{ y: scrollY }}
                pagination={{
                  className: 'pagination-wrap',
                  size: 'small',
                  total,
                  current: params?.page,
                  pageSize: params?.pageSize,
                  pageSizeOptions: ['20', '50', '100'],
                  showSizeChanger: true,
                  showTotal: (total: number) => (
                    <span style={{ position: 'absolute', left: 0 }}>
                      {getTransText('TotalDataPart1') || ''} {Number(total).toLocaleString()} {getTransText('TotalDataPart2') || ''}
                    </span>
                  ),
                }}
                onChange={pagination => {
                  if (params) {
                    setParams(previous => ({
                      ...params,
                      pageSize: pagination.pageSize as number,
                      page: pagination.pageSize === previous?.pageSize ? (pagination.current as number) : 1,
                    }));
                  }
                }}
                rowSelection={{
                  fixed: true,
                  selectedRowKeys,
                  preserveSelectedRowKeys: true,
                  onChange: keys => setSelectedRowKeys(keys as string[]),
                }}
              />
            </div>
          </ConfigProvider>
        </div>
        <SearchProgress
          visible={visible}
          total={total}
          minimize={minimize}
          taskStatus={taskStatus}
          isManualStop={isManualStop}
          onMinimizeChange={setMinimize}
          onStop={handleSearchStop}
          onFinish={handleSearchFinish}
        />
      </div>
    </PermissionCheckPage>
  );
};

export default IntelligentSearch;
