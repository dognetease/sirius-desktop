import React from 'react';
import classnames from 'classnames';
import { Steps } from 'antd';
import { StepsProps } from 'antd/lib/steps';
// import { StepsProps } from './types';
import './siriusSteps.scss';

export interface SiriusStepsProps extends React.FC<StepsProps> {
  Step: typeof Steps.Step;
}
export const prefixCls = 'sirius-steps';

const SiriusSteps: SiriusStepsProps = props => {
  const { className } = props;
  const stepsClassName = classnames(prefixCls, className);
  return <Steps className={stepsClassName} {...props} />;
};

SiriusSteps.Step = Steps.Step;

export default SiriusSteps;
