import React from 'react';
import classnames from 'classnames';
import styles from './style.module.scss';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import EmptyIcon from '../../../images/empty.png';
import { Steps } from 'antd';
import { ReactComponent as StepDone } from '../../../images/stepDone.svg';
import { ReactComponent as StepInProgress } from '../../../images/stepInprogress.svg';
import { apis, apiHolder, DataTrackerApi, getIn18Text } from 'api';
import { STATUS_ENUM, Theme } from '../../constants';
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const { Step } = Steps;

interface PageInfoParams {
  theme: Theme;
  step?: number;
  status: STATUS_ENUM;
  isAddProduct: boolean;
  onFurnish: () => void;
  indexHaveImgStepClass: string;
  onChooseTemplate?: () => void;
}

const THEME_TYPE = {
  // 官网
  index: 'INDEX',
  detail: 'PRODUCT_DETAIL',
};

export const PageInfo = ({ theme, step, status, isAddProduct, onFurnish, onChooseTemplate, indexHaveImgStepClass }: PageInfoParams) => {
  const isIndex = theme === THEME_TYPE['index'];

  return (
    <div className={classnames({ [styles.info]: true, [styles.infoIndex]: isIndex, [indexHaveImgStepClass]: Boolean(indexHaveImgStepClass) })}>
      {isIndex ? (
        <Steps className={styles.steps} direction="horizontal" labelPlacement="vertical" current={step}>
          <Step
            className={styles.step}
            title={<span className={styles.stepTitle}>{getIn18Text('XUANZEMOBAN')}</span>}
            subTitle={<span className={styles.subTitle}>{step && step > 0 ? '已完成' : '未选择'}</span>}
            description={
              <div
                onClick={() => {
                  onChooseTemplate?.();
                  trackApi.track('mysite_fitup_null', { result: 'choose' });
                }}
                className={styles.stepBtn}
              >
                {getIn18Text('QUXUANZE')}
              </div>
            }
            icon={step && step > 0 ? <StepDone /> : <StepInProgress />}
          />
          <Step
            className={styles.step}
            title={<span className={styles.stepTitle}>{getIn18Text('BIANJIXINXI')}</span>}
            subTitle={<span className={styles.subTitle}>{step && step > 1 ? getIn18Text('BIANJIZHONG') : '未编辑'}</span>}
            description={
              <div
                onClick={() => {
                  onFurnish();
                  trackApi.track('mysite_fitup_null', { result: 'gotoedit' });
                }}
                className={`${styles.stepBtn} ${status === 'INIT' || status === 'OFFLINE' ? 'disable' : ''}`}
              >
                {getIn18Text('QUBIANJI')}
              </div>
            }
            icon={step && step > 1 ? <StepDone /> : <StepInProgress />}
          />
          <Step
            className={styles.step}
            title={<span className={styles.stepTitle}>{getIn18Text('TIANJIASHANGPIN')}</span>}
            subTitle={<span className={styles.subTitle}>{isAddProduct ? '已添加' : getIn18Text('WEITIANJIA')}</span>}
            description={
              <div
                onClick={() => {
                  onFurnish();
                }}
                className={`${styles.stepBtn} ${status === 'INIT' || status === 'OFFLINE' ? 'disable' : ''}`}
              >
                {getIn18Text('QUTIANJIA')}
              </div>
            }
            icon={isAddProduct ? <StepDone /> : <StepInProgress />}
          />
          <Step
            className={styles.step}
            title={<span className={styles.stepTitle}>{getIn18Text('FABUSHANGXIAN')}</span>}
            subTitle={<span className={styles.subTitle}>{step && step > 2 ? 'null' : getIn18Text('WEIFABU')}</span>}
            description={
              <div
                onClick={() => {
                  onFurnish();
                  trackApi.track('mysite_fitup_null', { result: 'publish' });
                }}
                className={`${styles.stepBtn} ${status === 'INIT' || status === 'OFFLINE' ? 'disable' : ''}`}
              >
                {getIn18Text('QUFABU')}
              </div>
            }
            icon={step && step > 2 ? <StepDone /> : <StepInProgress />}
          />
          <Step
            className={styles.step}
            title={<span className={styles.stepTitle}>{getIn18Text('XIUGAIYUMING')}</span>}
            subTitle={<span className={styles.subTitle}>{getIn18Text('WEIXIUGAI')}</span>}
            description={
              <div
                onClick={() => {
                  Toast.warn('请发布上线后在操作中修改域名');
                }}
                className={`${styles.stepBtn} ${status === 'INIT' || status === 'OFFLINE' ? 'disable' : ''}`}
              >
                {getIn18Text('SITE_QUXIUGAI')}
              </div>
            }
            icon={<StepInProgress />}
          />
        </Steps>
      ) : (
        <div className={styles.productEmpty}>
          <img src={EmptyIcon} />
          在商品中心添加商品后将自动生成商品详情页
        </div>
      )}
    </div>
  );
};
