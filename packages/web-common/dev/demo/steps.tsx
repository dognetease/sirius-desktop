import React from 'react';
import { SiriusSteps } from '@web-common/components/UI/SiriusSteps';
import { Divider } from 'antd';
import Pic from './imgs/pic.svg';
import Pic2 from './imgs/pic2.svg';

const description = '这里是提示文字';

export const StepsComponent = () => {
  const { Step } = SiriusSteps;
  const [current, setCurrent] = React.useState(2);

  const onChange = (value: number) => {
    console.log('onChange:', current);
    setCurrent(value);
  };
  return (
    <>
      <h2>水平步骤条</h2>
      <Divider orientation="left">带序号的水平步骤条</Divider>
      <SiriusSteps current={current} onChange={onChange}>
        <Step title="已完成的步骤" />
        <Step title="进行中的步骤" />
        <Step title="未进行的步骤" />
        <Step title="未进行的步骤" />
      </SiriusSteps>
      <br />
      <SiriusSteps current={2}>
        <Step title="已完成的步骤" description={description} />
        <Step title="进行中的步骤" description={description} />
        <Step title="未进行的步骤" description={description} />
        <Step title="未进行的步骤" description={description} />
      </SiriusSteps>
      <Divider orientation="left">自定义图标的水平步骤条</Divider>
      <SiriusSteps current={2}>
        <Step title="已完成的步骤" />
        <Step title="进行中的步骤" />
        <Step title="未进行的步骤" />
        <Step title="未进行的步骤" />
      </SiriusSteps>
      <br />
      <SiriusSteps current={2}>
        <Step icon={<img src={Pic} />} title="已完成的步骤" description={description} />
        <Step icon={<img src={Pic} />} title="进行中的步骤" description={description} />
        <Step icon={<img src={Pic} />} title="未进行的步骤" description={description} />
        <Step title="未进行的步骤" description={description} />
      </SiriusSteps>
      <br />
      <h2>垂直步骤条</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <SiriusSteps current={1} direction="vertical">
          <Step title="已完成的步骤" />
          <Step title="进行中的步骤" />
          <Step title="未进行的步骤" />
          <Step title="未进行的步骤" />
        </SiriusSteps>

        <SiriusSteps direction="vertical" current={current} onChange={onChange}>
          <Step title="已完成的步骤" description={description} />
          <Step title="进行中的步骤" description={description} />
          <Step title="未进行的步骤" description={description} />
          <Step title="未进行的步骤" description={description} />
        </SiriusSteps>

        <SiriusSteps current={1} direction="vertical">
          <Step icon={<img src={Pic} />} title="已完成的步骤" />
          <Step icon={<img src={Pic} />} title="进行中的步骤" />
          <Step icon={<img src={Pic2} />} title="未进行的步骤" />
          <Step icon={<img src={Pic2} />} title="未进行的步骤" description={description} />
        </SiriusSteps>
        <SiriusSteps current={1} direction="vertical">
          <Step icon={<img src={Pic} />} title="已完成的步骤" description={description} />
          <Step icon={<img src={Pic} />} title="进行中的步骤" description={description} />
          <Step icon={<img src={Pic2} />} title="未进行的步骤" description={description} />
          <Step icon={<img src={Pic2} />} title="未进行的步骤" description={description} />
        </SiriusSteps>
      </div>

      <h2>组件状态</h2>
      <Divider orientation="left">正常流程包含3个状态：已完成、进行中、未进行</Divider>
      <SiriusSteps current={1}>
        <Step title="已完成的步骤" description={description} />
        <Step title="进行中的步骤" description={description} />
        <Step title="未进行的步骤" description={description} />
        <Step title="未进行的步骤" description={description} />
      </SiriusSteps>
      <br />
      <Divider orientation="left">当前流程还可能出现失败或告警状态</Divider>
      <SiriusSteps current={1}>
        <Step title="已完成的步骤" description={description} />
        <Step title="进行中的步骤" status="error" description={description} />
        <Step title="未进行的步骤" description={description} />
        <Step title="未进行的步骤" description={description} />
      </SiriusSteps>
    </>
  );
};
