import React, { useState, useEffect, useCallback, useContext } from 'react';
import styles from './smartSend.module.scss';
import { Switch } from 'antd';
import { DOMAIN_MATCH_REGEX } from '../../utils/utils';
import { apiHolder, apis, EdmSendBoxApi, EdmSendConcatInfo, ExpectSendDate, RequestExpectSendDate } from 'api';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import { ReactComponent as TongyongJiantouShang1 } from '@web-common/images/newIcon/tongyong_jiantou_shang1.svg';
import TongyongJiantouXia from '@web-common/images/newIcon/tongyong_jiantou_xia';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
// import Divider from '@web-common/components/UI/Divider';
import Divider from '@lingxi-common-component/sirius-ui/Divider';
// import SiriusRadio from '@web-common/components/UI/Radio/siriusRadio';
import SiriusRadio from '@lingxi-common-component/sirius-ui/Radio';
import { edmDataTracker } from '../../tracker/tracker';
import { ReactComponent as SmartSendEmail } from '@/images/icons/edm/yingxiao/smart-send-email.svg';
import { ReactComponent as RightArrow } from '@/images/icons/edm/yingxiao/right-arrow.svg';
import { ReactComponent as ExplanationIcon } from '@/images/icons/edm/yingxiao/explanation-gray16px.svg';
import { getIn18Text } from 'api';
import { ValidatorContext } from '../validator/validator-context';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const FIXED20 = '20';
const FIXED50 = '50';
const CUSTOMIZE = 'customize';
const UNLIMITED = 'unlimited';

export interface Props {
  initAstrictCount?: number;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  receivers: EdmSendConcatInfo[];
  openStatusChange?: (isOpen: boolean) => void;
  astrictCountChange?: (count: number) => void;
}

export const SmartSend = (props: Props) => {
  const { initAstrictCount, defaultOpen = true, forceOpen = false, receivers, openStatusChange, astrictCountChange } = props;
  // 初始回显选中
  let initSelect = initAstrictCount ? ([+FIXED20, +FIXED50].includes(initAstrictCount) ? String(initAstrictCount) : CUSTOMIZE) : UNLIMITED;
  const [isOpen, setIsOpen] = useState(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  // 选择自定义的相关数据
  // 用户实际操作选择的限制值，因为用户选择后可以不点击确定直接关闭按钮
  const [uiAstrictCount, setUiAstrictCount] = useState<number>(initAstrictCount || 50);
  // 用户之前已选择的限制值
  const [astrictCount, setAstrictCount] = useState<number>(initAstrictCount || 50);
  // radio的相关数据
  // UI上用户选择的radio，因为用户选择后可以不点击确定直接关闭按钮
  const [radioSelect, setRadioSelect] = useState<string>(initSelect);
  // 实际用户选择的radio
  const [actualSelect, setActualSelect] = useState<string>(initSelect);
  // 预估时间
  const [expectTime, setExpectTime] = useState<string>('');
  const openHelpCenter = useOpenHelpCenter();

  const validatorProvider = useContext(ValidatorContext);
  useEffect(() => {
    validatorProvider?.dispatch({
      type: 'smartSend:action',
      payload: [
        () => {
          setIsOpen(true);
          openStatusChange && openStatusChange(true);
        },
      ],
    });
  }, []);

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  // 收件人变化重新计算完成发送时间
  useEffect(() => {
    updateAstrictTime();
  }, [receivers.length]);

  // 接口获取更新完成发送时间
  const updateAstrictTime = useCallback(() => {
    if (!isOpen) {
      return;
    }
    if (!receivers?.length) {
      setExpectTime('');
      return;
    }
    // 整理域名及数量
    const domainObj: { [key: string]: number } = {};
    const domainStats: ExpectSendDate[] = [];
    for (let item of receivers) {
      const domain = item.contactEmail?.match(DOMAIN_MATCH_REGEX) || [];
      if (domain.length <= 0) {
        continue;
      }
      const lastCount = domainObj[domain[0]] || 0;
      domainObj[domain[0]] = lastCount + 1;
    }
    for (let key in domainObj) {
      domainStats.push({
        domain: key,
        count: domainObj[key],
      });
    }
    const params: RequestExpectSendDate = { domainStats };
    // 固定数字或自定义
    if (radioSelect === CUSTOMIZE) {
      params.sendDomainLimit = uiAstrictCount;
    } else if (radioSelect !== UNLIMITED) {
      params.sendDomainLimit = +radioSelect;
    }
    edmApi
      .getExpectSendDate(params)
      .then(result => {
        result?.sendDate && setExpectTime(result.sendDate);
      })
      .catch(() => {});
  }, [isOpen, receivers, uiAstrictCount, radioSelect]);

  // 更新每天发送数量
  const updateAstrictCount = e => {
    const value = e.target.value || '';
    if (value === '' || (value > 0 && value <= 9999)) {
      setUiAstrictCount(+e.target.value);
    }
  };

  // 控制器更新每天发送数量
  const controlAstrictCount = (type: string) => {
    let lastCount = uiAstrictCount;
    lastCount = type === 'add' ? uiAstrictCount + 1 : lastCount;
    lastCount = type === 'subtract' ? uiAstrictCount - 1 : lastCount;
    if (lastCount > 0 && lastCount <= 9999) {
      setUiAstrictCount(lastCount);
    }
  };

  // 非确认情况下弹窗关闭后将ui数据与用户实际数据统一
  const handelCancel = useCallback(() => {
    setModalVisible(false);
    setUiAstrictCount(astrictCount);
    setRadioSelect(actualSelect);
  }, [astrictCount, actualSelect]);

  // 确认情况下将ui数据与用户实际数据统一，并进行完成发送时间确认
  const handleConfirm = useCallback(() => {
    setAstrictCount(uiAstrictCount);
    setActualSelect(radioSelect);
    updateAstrictTime();
    setModalVisible(false);
    // 固定数字或自定义
    let propAstrictCount = 0;
    // 固定数字或自定义
    if (radioSelect === CUSTOMIZE) {
      propAstrictCount = uiAstrictCount;
    } else if (radioSelect !== UNLIMITED) {
      propAstrictCount = +radioSelect;
    }
    astrictCountChange && astrictCountChange(propAstrictCount);
  }, [uiAstrictCount, radioSelect]);

  return (
    <div className={styles.doubleTrackWrapper}>
      <div style={{ position: 'relative' }}>
        <div className={styles.infoWrapper}>
          <div className={styles.container}>
            <div className={styles.icon}>
              <SmartSendEmail />
            </div>

            <div className={styles.content}>
              <div className={styles.title}>
                <div>
                  <span>{getIn18Text('ANQUANFASONG')}</span>
                  <span className={styles.tag}>{getIn18Text('TISHENGSONGDALV')}</span>
                </div>
                <div className={styles.switch}>
                  {/* {forceOpen ? (
                    <div className={styles.forceOpen}>已开启</div>
                  ) : (
                    <Switch
                      size="small"
                      checked={isOpen}
                      onChange={checked => {
                        setIsOpen(checked);
                        openStatusChange && openStatusChange(checked);
                      }}
                    />
                  )} */}
                  <Switch
                    size="small"
                    checked={isOpen}
                    onChange={checked => {
                      setIsOpen(checked);
                      openStatusChange && openStatusChange(checked);
                    }}
                  />
                </div>
              </div>
              {/* {!forceOpen && (
                <div className={styles.info}>
                  {getIn18Text('GENJUSHOUJIANRENHETONG')}
                  <span className={styles.percent}>
                    15<span className={styles.percentMark}>%</span>
                  </span>
                  送达率。
                  <span
                    className={styles.infoMore}
                    onClick={() => {
                      edmDataTracker.taskIntellectTrack('safetySend');
                      window.open('https://waimao.163.com/helpCenter/d/1648154101927727106.html');
                    }}
                  >
                    {getIn18Text('KUAISULEJIE')}
                    <RightArrow />
                  </span>
                </div>
              )} */}
              <div className={styles.info}>
                {getIn18Text('GENJUSHOUJIANRENHETONG')}
                <span className={styles.percent}>
                  15<span className={styles.percentMark}>%</span>
                </span>
                送达率。
                <span
                  className={styles.infoMore}
                  onClick={() => {
                    edmDataTracker.taskIntellectTrack('safetySend');
                    openHelpCenter('/d/1648154101927727106.html');
                    // window.open('https://waimao.163.com/helpCenter/d/1648154101927727106.html');
                  }}
                >
                  {getIn18Text('KUAISULEJIE')}
                  <RightArrow />
                </span>
              </div>
              {/* {forceOpen && <div className={styles.info}>根据收件人信息和发件地址，进行拟人化延迟发送，以提升送达率</div>} */}

              {isOpen && (
                <div className={styles.info}>
                  <Divider margin={12} />
                  <div className={styles.astrict}>
                    <span>
                      {actualSelect === UNLIMITED ? (
                        <>{getIn18Text('CIRENWUTONGYUMINGSHOU')}</>
                      ) : (
                        <>
                          此任务同域名收件人每天发送数量上限<span className={styles.astrictCount}>{actualSelect === CUSTOMIZE ? astrictCount : actualSelect}</span>封
                        </>
                      )}
                      ，
                      <span className={styles.astrictUpdate} onClick={() => setModalVisible(true)}>
                        {getIn18Text('QUXIUGAI')}
                      </span>
                    </span>
                    {expectTime ? (
                      <span>
                        {getIn18Text('YUJIZAI')}
                        {expectTime}完成发送
                        <Tooltip title={getIn18Text('DANRENWUFASONGSHIJIAN')}>
                          <ExplanationIcon style={{ marginLeft: '5px', cursor: 'pointer', marginBottom: '-3px' }} />
                        </Tooltip>
                      </span>
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Modal
        wrapClassName={styles.astrictModal}
        title={getIn18Text('XIUGAICIRENWUTONGYU')}
        width={480}
        onOk={handleConfirm}
        onCancel={handelCancel}
        visible={modalVisible}
        okText={getIn18Text('QUEREN')}
        okButtonProps={{ disabled: radioSelect === CUSTOMIZE && !uiAstrictCount }}
      >
        <SiriusRadio.Group onChange={e => setRadioSelect(e.target.value)} value={radioSelect}>
          <SiriusRadio value={FIXED20}>{FIXED20}</SiriusRadio>
          <SiriusRadio value={FIXED50}>{FIXED50}</SiriusRadio>
          <SiriusRadio value={UNLIMITED}>{getIn18Text('WUXIANZHI')}</SiriusRadio>
          <SiriusRadio value={CUSTOMIZE}>
            <span className={styles.astrictCustomize}>
              {radioSelect === CUSTOMIZE ? (
                <div className={styles.astrictInputNumber}>
                  <Input autoFocus className={styles.astrictInput} onChange={updateAstrictCount} value={uiAstrictCount === 0 ? '' : uiAstrictCount + ''} />
                  <div className={styles.astrictCount}>
                    <span className={styles.astrictCountItem} onClick={() => controlAstrictCount('add')}>
                      <TongyongJiantouShang1 />
                    </span>
                    <span className={styles.astrictCountItem} onClick={() => controlAstrictCount('subtract')}>
                      <TongyongJiantouXia />
                    </span>
                  </div>
                </div>
              ) : (
                '自定义'
              )}
            </span>
          </SiriusRadio>
        </SiriusRadio.Group>
      </Modal>
    </div>
  );
};
