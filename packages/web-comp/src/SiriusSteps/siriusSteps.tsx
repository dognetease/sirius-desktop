import React from 'react';
import classnames from 'classnames';
import { Steps } from 'antd';
import { StepsProps, StepProps } from 'antd/lib/steps';
import ConfigProvider from '../configProvider';
import './antd.scss';
import './siriusSteps.scss';

type AntdStepsProps = StepsProps & { children?: React.ReactNode };
export interface SiriusStepsProps extends React.FC<AntdStepsProps> {
  Step: typeof IStep;
}
export const prefixCls = 'sirius-steps-ui';

const SiriusSteps: SiriusStepsProps = props => {
  const { className } = props;
  const stepsClassName = classnames(prefixCls, className);
  return (
    <ConfigProvider>
      <Steps className={stepsClassName} {...props} />
    </ConfigProvider>
  );
};

const IStep = (props: StepProps) => {
  return (
    <ConfigProvider>
      <Steps.Step {...props} />
    </ConfigProvider>
  );
};

SiriusSteps.Step = IStep;

export default SiriusSteps;
