import { getIn18Text } from 'api';
import React, { useEffect, useMemo, useState } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { Button, Progress, Space, Table } from 'antd';
import { api, apis, VerifyWhatsappNumberResult, WhatsAppApi } from 'api';
import ProgressImg from '@/images/icons/whatsApp/filter-progress.png';
import { ReactComponent as AiSearchWaitting } from '@/images/icons/whatsApp/ai-search-waitting.svg';
import { ReactComponent as AiSearchSearching } from '@/images/icons/whatsApp/ai-search-searching.svg';
import { ReactComponent as AiSearchFinished } from '@/images/icons/whatsApp/ai-search-finished.svg';
import style from './index.module.scss';
import variables from '@web-common/styles/export.module.scss';
import { getTransText } from '@/components/util/translate';
const whatsAppApi = api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

interface VerifyNumbersModalProps {
  visible: boolean;
  numbers: string[];
  onCancel?: () => void;
  onOk?: (exceptionNumbers: string[], error?: boolean) => void;
  onVerifyError?: () => void;
}

interface StepControllProps {
  steps: string[];
  currentStep: number;
}

export const StepControll = (props: StepControllProps) => {
  const { steps, currentStep } = props;

  return (
    <div className={style.stepContainer}>
      {steps.map((step, index) => (
        <div className={style.step}>
          <div className={style.stepTitle}>{step}</div>
          <div className={style.dashed} />
          <div className={style.stepIcon}>
            {index === currentStep && <AiSearchSearching className={style.spining} />}
            {index < currentStep && <AiSearchFinished />}
            {index > currentStep && <AiSearchWaitting />}
          </div>
        </div>
      ))}
    </div>
  );
};

const steps = [getTransText('GUOLVHAOMAGESHISHIFOUZHENGQUE'), getTransText('GUOLVSHOUJIHAOSHIFOUZHUCEWhatsApp'), getTransText('ZHENGHEHAOMAGUOLVJIEGUO')];

export const VerifyNumbersModal = (props: VerifyNumbersModalProps) => {
  const { visible, numbers, onCancel, onOk, onVerifyError } = props;
  // const [percent, setPercent] = useState(30);
  const [currentStep, setCurrentStep] = useState(0);
  const [list, setList] = useState<VerifyWhatsappNumberResult[]>([]);

  const columns = [
    {
      key: 'number',
      dataIndex: 'number',
      title: getTransText('whatsappNumber'),
    },
    {
      key: 'filterDesc',
      dataIndex: 'filterDesc',
      title: getTransText('YICHANGYUANYIN'),
    },
  ];

  const doVerify = () => {
    new Promise(resolve => {
      setTimeout(resolve, 200);
    }).then(() => {
      setCurrentStep(prev => {
        if (prev < 1) {
          return 1;
        }
        return prev;
      });
    });
    whatsAppApi
      .verifyWhatsappNumber(numbers)
      .then(res => {
        const { whatsAppFilterResults } = res;
        const errorList = whatsAppFilterResults.filter(item => !item.exists);
        setCurrentStep(2);
        setTimeout(() => {
          if (errorList.length > 0) {
            setList(errorList);
            setCurrentStep(3);
          } else {
            onOk && onOk([]);
          }
        }, 300);
      })
      .catch(e => {
        console.warn(e);
        // Toast.warn({ content: '过滤失败' });
        // todo 过滤失败如何处理
        setCurrentStep(3);
        onVerifyError && onVerifyError();
      });
  };

  const percent = useMemo(() => {
    if (currentStep > 2) {
      return 100;
    }
    return currentStep * 33.33;
  }, [currentStep]);

  const showView = useMemo(() => {
    if (currentStep <= 2) {
      return 'filtering';
    }
    return 'list';
  }, [currentStep]);

  const handleOk = () => {
    onOk && onOk(list.map(item => item.number));
  };

  useEffect(() => {
    doVerify();
  }, []);

  return (
    <Modal visible={visible} onCancel={onCancel} footer={null}>
      <div className={style.body}>
        {showView === 'filtering' && (
          <div className={style.step1}>
            <div className={style.stepHeader}>
              <img src={ProgressImg} alt={getTransText('GUOLVZHONG')} />
              <h3 style={{ marginBottom: 12 }}>
                {getTransText('ZHENGZAIGUOLV')}
                <span>
                  {numbers.length}
                  {getIn18Text('GE')}
                </span>
                {getTransText('whatsappNumber')}...
              </h3>
              <div className={style.tips}>{getTransText('GUOLVXUYAOYIDINGSHIJIAN')}</div>
              <div style={{ padding: '0 49px', margin: '18px 0 26px' }}>
                <Progress className={style.progress} percent={percent} showInfo={false} strokeColor={`${variables.brand6}`} />
              </div>
            </div>
            <div className={style.progressDetail}>
              <StepControll steps={steps} currentStep={currentStep} />
            </div>
          </div>
        )}
        {showView === 'list' ? (
          <div className={style.step2}>
            <h3>
              {getTransText('GUOLVWANCHENG_YIZIDONGQINGCHU')}
              <span>{list.length}</span>
              {getTransText('YICHANGHAOMA')}
            </h3>
            <p className={style.tips}>{getTransText('WUXIAOHAOMAHUIBIAOWEIYICHANG')}</p>
            <h4>{getTransText('YICHANGHAOMALIEBIAO')}</h4>
            <Table size="small" className="edm-table" columns={columns} dataSource={list} pagination={false} scroll={{ y: 285 }} rowKey="number" />
            <div className={style.operations}>
              <Space align="end">
                {/* <Button onClick={() => handleExport()}>
                    导出无效号码
                  </Button> */}
                <Button type="primary" onClick={handleOk}>
                  {getIn18Text('QUEDING')}
                </Button>
              </Space>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
