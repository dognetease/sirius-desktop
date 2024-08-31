import React, { useState, useEffect } from 'react';
import { Checkbox, message } from 'antd';
import { navigate } from '@reach/router';
import style from './style.module.scss';
import styles from '../myDomain/style.module.scss';
import { api, apis, SiteApi, apiHolder, DataTrackerApi, getIn18Text } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Breadcrumb from '@web-site/components/Breadcrumb';
import { ReactComponent as QuestionIcon } from '../../images/question.svg';
import { ReactComponent as BtnSelectedIcon } from '../../images/btn-selected.svg';
// import { ReactComponent as BtnBuyIcon } from '../../images/btn-buy.svg';
import { ReactComponent as SuccessIcon } from '../../images/success-icon.svg';
import { ReactComponent as InfoIcon } from '../../images/info.svg';
import { useOpenHelpCenter } from '@web-common/utils/utils';
import Loading from '@web-site/components/Loading';

interface PageQueryString {
  domain: string;
}

interface PurchaseCertProps {
  qs: PageQueryString; // url 参数
}

interface CertFree {
  certProductType: number;
  certType: string;
  vendor: string;
  serviceTime: number;
}

interface CertServiceTimeItem {
  actualPrice: number;
  underlinePrice: number;
  serviceTime: number;
}

interface CertSslItem {
  certType: string;
  vendor: string;
  productCode: string;
  certServiceTimeList: CertServiceTimeItem[];
}

interface CertSsl {
  certProductType: number;
  certType: CertSslItem[];
}

interface CertTypeRes {
  isBuyFreeCert: boolean;
  certFree: CertFree;
  certSsl: CertSsl;
}

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export const PurchaseCert = (props: PurchaseCertProps) => {
  const { domain } = props.qs;
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [checked, setChecked] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [certType, setCertType] = useState('free');
  const [actualPrice, setActualPrice] = useState(0);
  const [underlinePrice, setUnderlinePrice] = useState(0);
  const [years, setYears] = useState(12);
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [certFree, setCertFree] = useState<CertFree>();
  const [certSsl, setCertSsl] = useState<CertSsl>();
  const [isBuyFreeCert, setIsBuyFreeCert] = useState<boolean>(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [brandCode, setBrandCode] = useState('');
  const openHelpCenter = useOpenHelpCenter();

  useEffect(() => {
    setPageLoading(true);
    siteApi
      .certType({ domain })
      .then((res: CertTypeRes) => {
        const { isBuyFreeCert, certFree, certSsl } = res;
        setCertFree(certFree);
        setCertSsl(certSsl);
        setIsBuyFreeCert(isBuyFreeCert);
        setCertType(!isBuyFreeCert ? 'buy' : 'free');
        setCategory(`${!isBuyFreeCert ? certSsl.certType[0]?.certType : certFree.certType}${getIn18Text('ZHENGSHU')}`);
        setBrand(!isBuyFreeCert ? certSsl.certType[0]?.vendor : certFree.vendor);
        setActualPrice(!isBuyFreeCert ? certSsl.certType[0]?.certServiceTimeList[0]?.actualPrice : 0);
        setUnderlinePrice(!isBuyFreeCert ? certSsl.certType[0]?.certServiceTimeList[0]?.underlinePrice : 0);
        setYears(certSsl.certType[0]?.certServiceTimeList[0]?.serviceTime ?? 12);
        setBrandCode(certSsl.certType[0]?.productCode ?? '');
        setPageLoading(false);
      })
      .catch(() => {
        goMyDomain();
        setPageLoading(false);
      });
  }, []);

  const goMyDomain = () => {
    navigate('#site?page=myDomain');
  };

  const buyCert = async () => {
    try {
      const res = await siteApi.purchaseCert({ domain });
      return res;
    } catch {
      message.error('购买证书失败');
      return false;
    }
  };

  const submit = () => {
    trackApi.track('certificate_submit');
    if (!checked) {
      showConfirmModal();
    } else {
      onOk();
    }
  };

  const goPurchasePay = (state: { domain: string; category: string; brand: string; actualPrice: number; underlinePrice: number; years: number; brandCode: string }) => {
    navigate('#site?page=domainPurchasePay&product=cert', { state });
  };

  const onOk = async () => {
    setChecked(true);
    hideConfirmModal();
    setSubmitLoading(true);
    if (certType === 'free') {
      const res = await buyCert();
      if (res) setSuccess(true);
      setSubmitLoading(false);
    } else {
      goPurchasePay({
        domain,
        category,
        brand,
        actualPrice,
        underlinePrice,
        brandCode,
        years,
      });
    }
  };

  const showConfirmModal = () => {
    setShowModal(true);
  };

  const hideConfirmModal = () => {
    setShowModal(false);
  };

  const onCheckedChange = (e: any) => {
    setChecked(e.target.checked);
  };

  const goHelpCenter = () => {
    // window.open('https://waimao.163.com/knowledgeCenter#/d/1649407615124459521.html');
    openHelpCenter('/d/1649407615124459521.html');
  };

  const changeCertType = (type: string) => {
    if (!isBuyFreeCert) return;
    setCertType(type);
    setCategory(`${type === 'buy' ? certSsl?.certType[0]?.certType : certFree?.certType}${getIn18Text('ZHENGSHU')}`);
    setBrand((type === 'buy' ? certSsl?.certType[0]?.vendor : certFree?.vendor) ?? '');
    setActualPrice(type === 'buy' ? certSsl?.certType[0]?.certServiceTimeList[0]?.actualPrice ?? 0 : 0);
    setUnderlinePrice(type === 'buy' ? certSsl?.certType[0]?.certServiceTimeList[0]?.underlinePrice ?? 0 : 0);
  };

  const changeYear = (i: CertServiceTimeItem) => {
    const { serviceTime, actualPrice, underlinePrice } = i;
    setYears(serviceTime);
    setActualPrice(actualPrice);
    setUnderlinePrice(underlinePrice);
  };

  return (
    <div className={style.purchaseCert}>
      {success ? (
        <div className={style.successContainer}>
          <div className={style.successContent}>
            <SuccessIcon />
            <div className={style.successTitle}>{getIn18Text('ZHIFUCHENGGONG')}!</div>
            <div className={style.successInfo}>{getIn18Text('ZHENGSHUXUYAOBUSHUHOUCAINENGSHENGXIAO')}</div>
            <div className={style.domain}>
              {getIn18Text('YUMING')}：{domain}
            </div>
            <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center' }}>
              <button
                className={style.cancelBtn}
                onClick={() => {
                  goMyDomain();
                  trackApi.track('cert_paysucc', { click: 'return' });
                }}
              >
                返回
              </button>
              <button
                className={style.submitBtn}
                onClick={() => {
                  navigate('#site?page=myCert');
                }}
              >
                {getIn18Text('QUBUSHU')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={style.purchaseCertHeader}>
            <Breadcrumb>
              <Breadcrumb.Item onClick={goMyDomain}>域名管理</Breadcrumb.Item>
              <Breadcrumb.Item>购买证书</Breadcrumb.Item>
            </Breadcrumb>
            <div className={style.headerRight}>
              <QuestionIcon />
              <span>域名管理常见问题</span>
              <div onClick={goHelpCenter}>点击了解</div>
            </div>
          </div>
          <div className={style.purchaseCertContent}>
            {pageLoading ? (
              <Loading />
            ) : (
              <div>
                <div className={style.formItem}>
                  <span>{getIn18Text('YUMING')}</span>
                  <div className={style.input}>{domain}</div>
                </div>
                <div className={style.formItem}>
                  <span>产品</span>
                  <div className={style.btnGroup}>
                    <div className={!isBuyFreeCert ? style.disabled : certType === 'free' ? style.selected : style.normal} onClick={() => changeCertType('free')}>
                      {getIn18Text('MIANFEIZHENGSHU')}
                      {certType === 'free' && isBuyFreeCert && <BtnSelectedIcon />}
                    </div>
                    <div className={certType === 'buy' ? style.selected : style.normal} onClick={() => changeCertType('buy')}>
                      {getIn18Text('SSLZHENGSHU')}
                      {certType === 'buy' && <BtnSelectedIcon />}
                    </div>
                  </div>
                </div>
                <div className={style.formItem}>
                  <span>{getIn18Text('ZHENGSHULEIXING')}</span>
                  <div className={style.btnGroup}>
                    <div className={style.text}>{category}</div>
                  </div>
                </div>
                <div className={style.formItem}>
                  <span>{getIn18Text('ZHENGSHUPINPAI')}</span>
                  <div className={style.btnGroup}>
                    <div className={style.text}>{brand}</div>
                  </div>
                </div>
                <div className={style.formItem} style={{ marginBottom: '8px' }}>
                  <span>{getIn18Text('FUWUSHICHANG')}</span>
                  <div className={style.btnGroup}>
                    {certType === 'free' ? (
                      <div className={style.selected}>
                        {certFree?.serviceTime ?? 3}
                        {getIn18Text('')}
                        <BtnSelectedIcon />
                      </div>
                    ) : (
                      <>
                        {(certSsl?.certType[0]?.certServiceTimeList ?? []).map(i => {
                          return (
                            <div key={i.serviceTime} className={years === i.serviceTime ? style.selected : style.normal} onClick={() => changeYear(i)}>
                              {i.serviceTime / 12}年{years === i.serviceTime && <BtnSelectedIcon />}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
                {certType === 'free' ? (
                  <div className={style.formInfo}>注：请在域名生效后再购买证书。在购买后，证书时长将基于建站服务期自动续期。</div>
                ) : (
                  <>
                    {years > 12 && (
                      <div className={style.formInfo}>
                        <span>说明：多年期证书包含多张一年期证书，系统会在证书临期时自动申请下一张证书。</span>
                        <span>多年期证书一次性收取多年费用，如后续不再使用证书不支持部分退款。</span>
                      </div>
                    )}
                  </>
                )}
                <div className={style.line}></div>
                <div className={style.agreement}>
                  <div className={style.agreementInfo}>
                    <Checkbox checked={checked} onChange={onCheckedChange} />
                    <span className={style.info}>{getIn18Text('WOYIYUEDUBINGTONGYI')}</span>
                    <a className={style.link} href="https://waimao.office.163.com/site/license.html" target="_blank">
                      《网易灵犀建站服务条款》
                    </a>
                  </div>
                  <div className={style.priceContainer}>
                    <span className={style.priceInfo}>应付款</span>
                    <span className={style.price}>¥</span>
                    {underlinePrice !== actualPrice && <span className={style.underlinePriceCount}>{underlinePrice}</span>}
                    <span className={style.priceCount}>{actualPrice}</span>
                  </div>
                </div>
                <div className={style.submitContainer}>
                  {submitLoading ? (
                    <button className={style.submitBtnDisabled}>提交中...</button>
                  ) : (
                    <button className={style.submitBtn} onClick={submit}>
                      {getIn18Text('TIJIAODINGDAN')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
      <Modal
        zIndex={800}
        visible={showModal}
        getContainer={false}
        width={400}
        className={styles.selectModal}
        title={
          <div className={styles.infoTitle}>
            <InfoIcon />
            确定提交吗？
          </div>
        }
        maskClosable={false}
        destroyOnClose={true}
        onCancel={hideConfirmModal}
        onOk={onOk}
      >
        <div className={styles.infoContent}>
          提交即代表同意
          <a className={style.link} href="https://waimao.office.163.com/site/license.html" target="_blank">
            《网易灵犀建站服务条款》
          </a>
        </div>
      </Modal>
    </div>
  );
};
