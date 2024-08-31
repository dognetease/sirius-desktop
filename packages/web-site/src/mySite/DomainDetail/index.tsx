import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal, Radio, Steps } from 'antd';
import { navigate } from '@reach/router';
import { AddDomainCertReq, api, apis, SiteApi, SystemApi, apiHolder, DataTrackerApi, getIn18Text } from 'api';

import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { Input } from '@/components/Layout/Customer/components/commonForm/Components';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import Breadcrumb from '@web-site/components/Breadcrumb';
import { ReactComponent as TrumpetIcon } from '../../images/trumpet.svg';
import { ReactComponent as StepFinishIcon } from '../../images/step-finish.svg';
import { ReactComponent as SuccessIcon } from '../../images/success-icon.svg';
import styles from './style.module.scss';
import CopyBox from './CopyBox';

import { DOMAIN_STATUS } from '../constants';
import Loading from '@web-site/components/Loading';
import { goMySitePage, isValidDomain } from '../utils';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

const { Step } = Steps;

interface DomainInfo {
  domain: string; // 域名
  orgId: string; // 组织ID
  recorded: boolean; // 是否备案
  siteId: string; // 站点ID
  status: DOMAIN_STATUS; // 域名状态
  recordNo: string; // 网安备案号
  icpCode: string; // icp备案号
}

interface CheckInfo {
  cname: string; // cname域名
  domain: string; // 域名
  type: string; // dns记录类型
  value: string; // dns记录值
  isSuccess: boolean; // 检测状态
  txtHost: string; // TXT记录
  txtValue: string; // TXT记录值
}

interface PageQueryString {
  siteId: string;
  host: string; // 默认域名
  siteName: string;
  domain?: string; // 空表示添加，非空表示修改
}
interface DomainDetailProps {
  qs: PageQueryString; // url 参数
}

export default function DomainDetail(props: DomainDetailProps) {
  const { siteId, host, siteName } = props.qs;

  const isAdd = !props.qs.domain;
  const [current, setCurrent] = useState(0);
  const successStepRef = useRef(0); // steps 已完成的步数
  const [domainInfo, setDomainInfo] = useState<DomainInfo>();
  const [txtInfo, setTxtInfo] = useState<any>({});
  const [cnameList, setCnameList] = useState<CheckInfo[]>([]);
  const [editingDomain, setEditingDomain] = useState(isAdd); // 是否处于修改域名状态
  const [domain, setDomain] = useState(props.qs.domain || '');
  const domainRef = useRef(props.qs.domain || '');
  const [showDomainErrorTip, setShowDomainErrorTip] = useState(false); // 检测域名不合法时的提示
  // const [showRecordErrorTip, setShowRecordErrorTip] = useState(false); // 没有选择是否备案时的提示
  const [recorded, setRecorded] = useState<boolean>(); // 是否备案
  const [recordNo, setRecordNo] = useState(''); // 网安备案号
  const [icpCode, setIcpCode] = useState(''); // icp备案号

  // 刚进入页面getDomainDetail接口loading
  const [loading, setLoading] = useState(false);
  // 第一步 下一步按钮 loading
  const [bindLoading, setBindLoading] = useState(false);
  // 第二步 验证域名 loading
  const [checkLoading, setCheckLoading] = useState(false);
  // const certInfoRef = useRef();

  const openHelpCenter = useOpenHelpCenter();

  const onStepsChange = (index: number) => {
    if (index <= successStepRef.current) {
      setCurrent(index);
    }
  };

  /**
   * 获取域名详情
   * @param setStep 是否需要刷新 Steps
   */
  const getDomainDetail = async (setStep?: boolean) => {
    const data = await siteApi.getDomainDetail({ siteId, domain: domainRef.current });

    if (data) {
      setDomainInfo(data);
      // setEditingDomain(!data.domain);
      setDomain(data.domain || '');
      domainRef.current = data.domain || '';
      setRecorded(data.recorded);
      setRecordNo(data.recordNo);
      setIcpCode(data.icpCode);
      if (data.status >= 7) {
        successStepRef.current = 3;
      } else if (data.status >= 3) {
        successStepRef.current = 2;
      } else {
        successStepRef.current = 1;
      }
      setStep && setCurrent(successStepRef.current);
    } else {
      setDomainInfo(undefined);
    }
  };

  const getDomainCheckInfo = async () => {
    if (!domainRef.current) {
      return;
    }
    const data = await siteApi.getDomainCheckInfo({
      domain: domainRef.current,
      siteId,
      type: 'new',
    });
    if (data?.length < 1) {
      return Promise.reject();
    }

    const txtInfo = data.find((item: any) => item.domain == domainRef.current);

    const { prefix, suffix } = getPrefixAndSuffix(domainRef.current);
    setTxtInfo({
      ...txtInfo,
      txtHost: (txtInfo.txtHost || '') + (prefix ? '.' + prefix : ''),
      suffix,
    });

    setCnameList(data);
  };

  /**
   * 把域名前缀放到TXT记录主机记录的复制内容框
   * @param host
   */
  const getPrefixAndSuffix = (host: string) => {
    let domainList = host.split('.');
    let prefix = domainList.slice(0, -2).join('.');
    let suffix = domainList.slice(-2).join('.');
    const commonReg = /\w+\.(com|edu|gov|int|mil|net|org|biz|info|pro|name|museum|aero)\.\w+$/gi;

    /**
     * 如果域名后缀是通用顶级域名+国家地区域名格式，例如example.com.cn，就认为有两级顶级域名，主域名是example.com.cn，而不是com.cn
     *
     * examples
     * 域名        TXT主机记录复制框
     * example.com   txtHost
     * www.example.com  txtHost + '.www'
     * example.com.cn  txtHost
     * www.example.com.cn  txtHost + '.www'
     */
    if (commonReg.test(host)) {
      prefix = domainList.slice(0, -3).join('.');
      suffix = domainList.slice(-3).join('.');
    }

    return { prefix, suffix };
  };

  useEffect(() => {
    if (!siteId || !host) {
      // 页面 url 参数错误
      goMySitePage();
    }
    // 第一次获取数据需要 loading
    const fetchData = async () => {
      setLoading(true);
      try {
        await getDomainDetail(true);
        await getDomainCheckInfo(); // 不能用 Promise.all，因为 domain 参数是从 getDomainDetail 返回结果获取的
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (!isAdd) {
      fetchData();
    }
    trackApi.track('site_changedomain_uv');
  }, []);

  // 修改域名
  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    setDomain(val);
    domainRef.current = val;
    setShowDomainErrorTip(!isValidDomain(val));
  };

  // 确认输入
  // const confirmDomain = () => {
  //   if (isValidDomain(domain)) {
  //     setEditingDomain(false);
  //   }
  //   if (!domain.startsWith('www.')) {
  //     setDomain('www.' + domain);
  //     domainRef.current = 'www.' + domain;
  //   }
  // };

  // 点击「去备案」按钮，打开备案引导弹窗
  // const showRecordGuideModal = () => {
  //   Modal.info({
  //     title: '域名备案',
  //     content: (
  //       <div>
  //         <p>域名备案需要在您购买域名的后台进行操作</p>
  //         <p>
  //           <a href="https://beian.aliyun.com/?spm=a2cmq.17630022.J_3207526240.4.7ab879fep6e34m" target="_blank">
  //             阿里云域名备案流程说明
  //           </a>
  //         </p>
  //         <p>
  //           <a href="https://cloud.tencent.com/product/ba" target="_blank">
  //             腾讯云域名备案流程说明
  //           </a>
  //         </p>
  //       </div>
  //     ),
  //     okText: '确定',
  //     icon: null,
  //     className: styles.recordModal,
  //     width: 480,
  //     centered: true,
  //     maskStyle: {
  //       left: 0,
  //     },
  //   });
  // };

  // 下一步
  const handleNextStep = async () => {
    if (!isValidDomain(domain)) {
      setEditingDomain(true);
      setShowDomainErrorTip(true);
    } else {
      setBindLoading(true);
      try {
        // 工信部备案号和网安备案号是可选的，不校验格式
        const data = await siteApi.bindDomain({
          siteId,
          domain: domainRef.current,
          // recorded,
          // oldDomain: domainInfo?.domain || '',
          recordNo: recorded ? recordNo : '',
          icpCode: recorded ? icpCode : '',
        });
        if (data) {
          await getDomainCheckInfo();
          successStepRef.current = Math.max(1, successStepRef.current);
          // if (domain != oldDomain && oldDomain) {
          //   // 修改了域名，解绑修改前的域名
          //   await siteApi.unBindDomain({ siteId, domain: oldDomain });
          // }
          await getDomainDetail();
          setEditingDomain(false);
          setCurrent(1);
        }
        setBindLoading(false);
      } catch (e) {
        setBindLoading(false);
        if (e.code === 30001023) {
          Toast.error('暂不支持添加所购域名的子域名');
        } else if (e.code === 30001026) {
          Toast.error('域名已绑定站点');
        } else if (e.code === 20001014) {
          Toast.error('绑定失败，同类域名已被其他站点绑定');
        } else {
          Toast.error('提交失败，请稍后再试');
        }
      }
    }
  };

  // 验证域名
  const handleCheckDomain = async () => {
    setCheckLoading(true);
    try {
      const res = await siteApi.checkDomain({ domain });
      if (res.data?.isSuccess) {
        await getDomainCheckInfo();
        Toast.success('验证已通过');
        setCurrent(2);
      } else {
        Toast.error('验证失败，请按照步骤设置域名信息');
      }
    } finally {
      setCheckLoading(false);
    }
    await getDomainDetail();
  };

  const goHelpCenter = () => {
    const url = '/d/1600387493931257857.html';
    // systemApi.openNewWindow(url, false);
    openHelpCenter(url);
  };

  // const changeDomain = () => {
  //   SiriusModal.confirm({
  //     title: '确定要修改域名吗？',
  //     content: '修改域名需要重新配置域名信息，且将导致现有域名不可用！',
  //     okText: '确定',
  //     cancelText: '取消',
  //     onOk: () => {
  //       setEditingDomain(true);
  //     },
  //   });
  // };

  const goRecordDomain = () => {
    navigate(`#site?page=recordDomain&domain=${domain}&siteName=${encodeURIComponent(siteName)}`);
  };

  const goDomainBind = () => {
    navigate(`#site?page=domain&siteId=${siteId}&host=${host}&siteName=${encodeURIComponent(siteName)}`);
  };

  return (
    <div className={styles.container}>
      <Breadcrumb>
        <Breadcrumb.Item onClick={goMySitePage}>{getIn18Text('WODEZHANDIAN')}</Breadcrumb.Item>
        <Breadcrumb.Item onClick={goDomainBind}>绑定域名</Breadcrumb.Item>
        <Breadcrumb.Item>{isAdd ? '添加域名' : getIn18Text('XIUGAIYUMING')}</Breadcrumb.Item>
      </Breadcrumb>

      <div className={styles.main}>
        {loading ? (
          <Loading />
        ) : (
          <div className={styles.content}>
            <Steps size="small" className={styles.steps} current={current} onChange={onStepsChange}>
              <Step title={getIn18Text('XIUGAIYUMING')} icon={current > 0 ? <StepFinishIcon /> : null} />
              <Step title="域名检测" icon={current > 1 ? <StepFinishIcon /> : null} />
              <Step title="域名配置" icon={current > 2 ? <StepFinishIcon /> : null} />
              <Step title="配置成功" />
            </Steps>
            {current === 0 && (
              <div>
                <div className={styles.row}>
                  <div className={styles.label}>默认域名</div>
                  <div>{host}</div>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>
                    <span className={styles.required}>*</span>添加域名
                  </div>
                  <div>
                    {editingDomain ? (
                      <>
                        <Input style={{ width: '250px' }} placeholder="请输入域名（小写字母）" value={domain} onChange={handleDomainChange} />
                        {showDomainErrorTip && <div className={styles.errorTip}>请输入正确的域名（字母仅支持小写）</div>}
                      </>
                    ) : (
                      <span>{domain}</span>
                    )}
                    <div style={{ marginTop: '12px' }}>
                      <span className={styles.lightText}>请确保添加的域名，已经在域名服务商完成域名解析</span>
                      <a onClick={goHelpCenter}>查看教程</a>
                    </div>
                  </div>
                </div>
                {/* <div className={styles.row}>
                  <div className={styles.label}>
                    <span className={styles.required}>*</span>是否备案
                  </div>
                  <div>
                    <Radio.Group
                      value={recorded}
                      onChange={e => {
                        setShowRecordErrorTip(false);
                        setRecorded(e.target.value);
                      }}
                    >
                      <Radio value={true}>已备案</Radio>
                      <Radio value={false}>未备案</Radio>
                    </Radio.Group>
                    {showRecordErrorTip && <div className={styles.errorTip}>请填写备案情况</div>}

                    <div style={{ marginTop: '8px' }}>
                      <span className={styles.lightText}>未备案的网站在国外可以正常访问，国内无法打开</span>
                      <a onClick={showRecordGuideModal}>去备案</a>
                    </div>
                  </div>
                </div> */}
                {/* {recorded && (
                  <>
                    <div className={styles.row}>
                      <div className={styles.label}>工信部备案</div>
                      <Input style={{ width: '250px' }} placeholder="请输入工信部备案号" value={icpCode} onChange={e => setIcpCode(e.target.value)} maxLength={50} />
                    </div>
                    <div className={styles.row}>
                      <div className={styles.label}>网安备案</div>
                      <Input style={{ width: '250px' }} placeholder="请输入网安备案号" value={recordNo} onChange={e => setRecordNo(e.target.value)} maxLength={50} />
                    </div>
                  </>
                )} */}
                <div className={styles.row}>
                  <div className={styles.label}></div>
                  <Button type="primary" onClick={handleNextStep} loading={bindLoading} style={{ marginTop: '16px' }}>
                    {getIn18Text('XIAYIBU')}
                  </Button>
                </div>
              </div>
            )}
            {current === 1 && (
              <div className={styles.checkInfo}>
                <div className={styles.tip}>
                  <TrumpetIcon />
                  在DNS配置生效之前，请耐心等待，这个过程可能需要24小时
                </div>
                <div className={styles.lightText}>在验证您添加的域名之前，需要您完成以下步骤：</div>
                <div style={{ margin: '32px 0 12px' }}>1.在您的DNS配置中为下面的主机记录添加一个TXT记录</div>
                <div style={{ display: 'flex', alignContent: 'center' }}>
                  <CopyBox text={txtInfo.txtHost} />
                  <div className={styles.copySuffix}>.{txtInfo.suffix || domain}</div>
                </div>
                <div style={{ margin: '24px 0 12px' }}>2.使用下面的字符串作为TXT记录的值</div>
                <CopyBox text={txtInfo.txtValue} />
                <div style={{ marginTop: '32px' }}>
                  {(domainInfo?.status as number) >= DOMAIN_STATUS.CONFIG_READY ? (
                    <Button type="primary" onClick={() => setCurrent(2)}>
                      验证已通过
                    </Button>
                  ) : domainInfo?.status == 1 ? (
                    <Button type="primary" disabled>
                      正在生成加速域名...
                    </Button>
                  ) : (
                    <Button loading={checkLoading} type="primary" onClick={handleCheckDomain}>
                      验证域名
                    </Button>
                  )}
                </div>
              </div>
            )}
            {current === 2 && (
              <div>
                <div className={styles.lightText}>您的专属域名已经生成，在您的域名生效之前，需要您完成以下步骤</div>
                {cnameList.map(item => (
                  <div>
                    <div style={{ margin: '32px 0 12px' }}>在您的DNS配置中为下面的hostname添加您的域名：</div>
                    <CopyBox text={item.domain} />
                    <div style={{ margin: '24px 0 12px' }}>在您的DNS配置中为下面的主机记录添加一个{item.type}记录：</div>
                    <CopyBox text={item.value} />
                  </div>
                ))}
              </div>
            )}
            {current === 3 && (
              <div className={styles.bindSiteSuccess}>
                <SuccessIcon />
                <div>{domain} 已经配置成功！将在12小时内生效</div>
                <span>绑定站点：{siteName}</span>
                <button className={styles.submitBtn} onClick={goRecordDomain}>
                  去备案
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
