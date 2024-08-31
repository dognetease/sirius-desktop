import React, { useState, useEffect, useRef } from 'react';
import { Steps, Input } from 'antd';
import { api, apis, SiteApi, getIn18Text, apiHolder, DataTrackerApi } from 'api';
import { useOpenHelpCenter } from '@web-common/utils/utils';

import { Select } from '@/components/Layout/Customer/components/commonForm/Components';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import Breadcrumb from '@web-site/components/Breadcrumb';
import { ReactComponent as StepFinishIcon } from '../../images/step-finish.svg';
import { ReactComponent as SuccessIcon } from '../../images/success-icon.svg';
import { ReactComponent as QuestionIcon } from '../../images/question.svg';
import { ReactComponent as QuestionNIcon } from '../../images/question-normal.svg';
import styles from './style.module.scss';
import CopyBox from './CopyBox';
import Loading from '@web-site/components/Loading';
import { goMySitePage } from '../utils';

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const { Step } = Steps;

interface DomainInfo {
  bsn: string; // 备案码
  ip: string; // 专属国内域名
  domain: string; // 域名
  icpCode: string; // ICP备案号
  recordNo: string; // 网安备案号
  spCode: string; // 服务商编码
  spName: string; // 服务商名称
  status: number; // -1:审核不通过;0:进行中;1:审核通过;2:待审核;3:取消;
}

interface Providers {
  code: string;
  name: string;
}

interface PageQueryString {
  domain: string; // 默认域名
  siteName: string;
}

interface DomainRecordProps {
  qs: PageQueryString; // url 参数
}

export default function DomainRecord(props: DomainRecordProps) {
  const { domain, siteName } = props.qs;

  const [current, setCurrent] = useState(0);
  const successStepRef = useRef(0); // steps 已完成的步数
  const [domainInfo, setDomainInfo] = useState<DomainInfo>();
  const [proList, setProList] = useState<Providers[]>([]);
  const [recordNo, setRecordNo] = useState(''); // 网安备案号
  const [icpCode, setIcpCode] = useState(''); // icp备案号
  const [loading, setLoading] = useState(false);
  const [spCode, setSpCode] = useState('');
  const [spName, setSpName] = useState('');
  const [bsn, setBsn] = useState('');
  const [ip, setIp] = useState('');
  const [stepOneLoading, setStepOneLoading] = useState(false);
  const [stepThreeLoading, setStepThreeLoading] = useState(false);
  const [stepThreeError, setStepThreeError] = useState(false);
  const [icpCodeError, setIcpCodeError] = useState('');
  const [recordNoError, setRecordNoError] = useState('');
  const openHelpCenter = useOpenHelpCenter();

  const clearError = () => {
    setIcpCodeError('');
    setRecordNoError('');
  };

  const onStepsChange = (index: number) => {
    if (index <= successStepRef.current) {
      setCurrent(index);
      clearError();
    }
  };

  /**
   * 获取已添加域名列表
   * @param setStep 是否需要刷新 Steps
   */
  const getDomainList = async () => {
    try {
      const data = (await siteApi.getRecordInfo({ domain })) ?? {};
      setDomainInfo(data);
      setSpCode(data.spCode);
      setBsn(data.bsn);
      setIp(data.ip);
      setRecordNo(data.recordNo);
      setIcpCode(data.icpCode);
      setSpName(data.spName);
      if (data.status === 1) {
        trackApi.track('webbuild_domain_recordsucc');
        successStepRef.current = 3;
      } else if (data.status === -1 || data.status === 2) {
        successStepRef.current = 2;
        setStepThreeLoading(data.status === 2);
        setStepThreeError(data.status === -1);
      } else if (data.status === 0) {
        successStepRef.current = 1;
      } else {
        successStepRef.current = 0;
      }
      setCurrent(successStepRef.current);
    } catch {}
  };

  const getProvidersList = async () => {
    try {
      const res = await siteApi.listServiceProviders();
      setProList(res);
      setSpCode(res[0]?.code ?? '');
    } catch {}
  };

  useEffect(() => {
    // 第一次获取数据需要 loading
    const fetchData = async () => {
      setLoading(true);
      try {
        await getDomainList();
        await getProvidersList();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    trackApi.track('webbuild_domain_record');
  }, []);

  const goHelpCenter = () => {
    openHelpCenter('/d/1668185465201700866.html');
  };

  const handleSpCodeChange = (val: any) => {
    setSpCode(val);
  };

  const goStepTwo = async () => {
    setStepOneLoading(true);
    try {
      const res = await siteApi.pickResource({ domain, spCode });
      if (res.code == 60001004) {
        Toast.error('同类域名只能一个在备案流程中');
        return;
      } else if (res.success) {
        const { bsn, ip } = res.data ?? {};
        setBsn(bsn);
        setIp(ip);
        successStepRef.current = 1;
        setCurrent(1);
        clearError();
      } else {
        Toast.error(res.message);
      }
    } finally {
      setStepOneLoading(false);
    }
  };

  const submitData = async () => {
    let withError = false;
    if (!recordNo) {
      setRecordNoError('请输入网安备案号');
      withError = true;
    }
    if (!icpCode) {
      setIcpCodeError('请输入工信部备案号');
      withError = true;
    }
    if (withError) return;
    setStepThreeLoading(true);
    setStepThreeError(false);
    try {
      await siteApi.submitInfo({ domain, recordNo, icpCode });
    } finally {
      // successStepRef.current = 3;
      // setCurrent(3);
    }
  };

  const goStepThree = () => {
    successStepRef.current = 2;
    setCurrent(2);
    clearError();
  };

  const cancelRecord = () => {
    SiriusModal.confirm({
      icon: null,
      title: '确定要停止备案流程吗？',
      content: '',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        siteApi.cancelDomain({ domain });
        successStepRef.current = 0;
        setCurrent(0);
        clearError();
        setStepThreeError(false);
      },
    });
  };

  const handleIcpCodeChange = (e: any) => {
    setIcpCodeError('');
    setIcpCode(e.target.value);
  };

  const handleRecordNoChange = (e: any) => {
    setRecordNoError('');
    setRecordNo(e.target.value);
  };

  return (
    <div className={styles.container}>
      <div className={styles.domainRecordHeader}>
        <Breadcrumb>
          <Breadcrumb.Item onClick={goMySitePage}>{getIn18Text('WODEZHANDIAN')}</Breadcrumb.Item>
          <Breadcrumb.Item>域名备案</Breadcrumb.Item>
        </Breadcrumb>
        <div className={styles.headerRight}>
          <QuestionIcon />
          <span>域名备案常见问题</span>
          <div onClick={goHelpCenter}>点击了解</div>
        </div>
      </div>

      <div className={styles.main}>
        {loading ? (
          <Loading />
        ) : (
          <div className={styles.content}>
            <Steps size="small" className={styles.steps} current={current} onChange={onStepsChange}>
              <Step title="选择备案服务商" icon={current > 0 ? <StepFinishIcon /> : null} />
              <Step title="域名配置" icon={current > 1 ? <StepFinishIcon /> : null} />
              <Step title="审核备案码" icon={current > 2 ? <StepFinishIcon /> : null} />
              <Step title="备案成功" />
            </Steps>
            {current === 0 && (
              <div className={styles.stepOne}>
                <div className={styles.row}>
                  <div className={styles.label}>默认域名</div>
                  <p>{domain}</p>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>服务商</div>
                  <Select
                    value={spCode}
                    style={{ width: '160px' }}
                    onChange={handleSpCodeChange}
                    options={proList.map(i => ({ label: i.name, value: i.code }))}
                    placeholder="请选择服务商"
                  />
                </div>
                {successStepRef.current === 0 && (
                  <div className={styles.row}>
                    <div className={styles.label}></div>
                    {stepOneLoading ? (
                      <button className={styles.submitBtnDisabled}>提交中...</button>
                    ) : (
                      <button className={styles.submitBtn} onClick={goStepTwo}>
                        {getIn18Text('XIAYIBU')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {current === 1 && (
              <div className={styles.stepTwo}>
                <div className={styles.label}>您的专属备案码</div>
                <CopyBox text={bsn} />
                <div className={styles.label} style={{ marginTop: '20px' }}>
                  在您的DNS配置中为下面的主机记录添加一个IP记录
                </div>
                <CopyBox text={ip} />
                <div className={styles.questionContainer}>
                  <div className={styles.questionInfo}>请在60天内完成备案</div>
                  <div className={styles.question} onClick={goHelpCenter}>
                    <QuestionNIcon />
                    了解备案流程
                  </div>
                </div>
                {successStepRef.current === 1 && (
                  <div className={styles.btnGroup}>
                    <button className={styles.submitBtn} onClick={goStepThree}>
                      {getIn18Text('XIAYIBU')}
                    </button>
                    <button className={styles.normalBtn} onClick={cancelRecord}>
                      停止备案
                    </button>
                  </div>
                )}
              </div>
            )}
            {current === 2 && (
              <>
                {stepThreeError && <div className={styles.stepThreeError}>备案号错误或网址不匹配，请填写正确信息后提交审核</div>}
                <div className={styles.stepThree}>
                  <div className={styles.row}>
                    <div className={styles.label}>工信部备案</div>
                    <div className={styles.inputContainer}>
                      <Input
                        disabled={stepThreeLoading || successStepRef.current >= 3}
                        value={icpCode}
                        style={{ width: '320px' }}
                        onChange={handleIcpCodeChange}
                        className={icpCodeError ? styles.inputError : ''}
                        placeholder="请输入工信部备案号"
                      />
                      <div className={styles.formItemInfo}>例如：京ICP证030223号</div>
                      {icpCodeError && <div className={styles.formItemError}>{icpCodeError}</div>}
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.label}>网安备案</div>
                    <div className={styles.inputContainer}>
                      <Input
                        disabled={stepThreeLoading || successStepRef.current >= 3}
                        value={recordNo}
                        style={{ width: '320px' }}
                        onChange={handleRecordNoChange}
                        className={recordNoError ? styles.inputError : ''}
                        placeholder="请输入网安备案号"
                      />
                      <div className={styles.formItemInfo}>例如：京公网安备11000002000111号</div>
                      {recordNoError && <div className={styles.formItemError}>{recordNoError}</div>}
                    </div>
                  </div>
                  {successStepRef.current === 2 && (
                    <>
                      {stepThreeLoading ? (
                        <>
                          <div style={{ display: 'flex' }}>
                            <div className={styles.label}></div>
                            <div>
                              <button className={styles.submitBtnDisabled}>审核中</button>
                              <div className={styles.infoText}>将在1-2个工作日内审核完成</div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className={styles.row}>
                          <div className={styles.label}></div>
                          <div className={styles.btnGroup}>
                            <button className={styles.submitBtn} onClick={submitData}>
                              提交审核
                            </button>
                            <button className={styles.normalBtn} onClick={cancelRecord}>
                              停止备案
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
            {current === 3 && (
              <div className={styles.bindSiteSuccess}>
                <SuccessIcon />
                <div className={styles.title}>审核通过</div>
                <div className={styles.subTitle}>{domain} 已经备案</div>
                <p>
                  <span>绑定站点：</span>
                  {siteName}
                </p>
                <p>
                  <span>服务商：</span>
                  {spName}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
