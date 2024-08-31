import React from 'react';
import CompDoc from '../CompDoc/index';
import Tooltip from './index';
import Button from '../Button/index';

const TooltipDoc: React.FC = () => {
  const describe = `## Tooltip 文字提示
  当前组件是基于antd 的 Tooltip 组件包装生成的，所以支持 antd Tooltip 组件所有API。
  * color: 背景颜色 (不可用，背景色固定写死的)
  * defaultOpen: 默认是否显隐（不可用，项目的antd 的版本是 4.16.13，defaultOpen 是 4.23.0 后的属性）
  * autoAdjustOverflow 只能设置为 false，因为箭头没有使用 antd Tooltip 原生的箭头。
  `;

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Link href="https://3x.ant.design/components/tooltip-cn/">antd Tooltip 文档</CompDoc.Link>
        <CompDoc.Use
          npmPath="import Tooltip, { TooltipProps } from '@lingxi-common-component/sirius-ui/Tooltip';"
          path="import Tooltip from '@web-common/components/UI/Tooltip';"
        />
        <CompDoc.RenderCode describe="#### placement 默认为 top">
          <Tooltip title="文字气泡" trigger="click">
            <Button inline>Tooltip目标元素-top</Button>
          </Tooltip>
          <Tooltip title="文字气泡" trigger="click" placement="left">
            <Button inline>Tooltip目标元素-left</Button>
          </Tooltip>
          <Tooltip title="文字气泡" trigger="click" placement="right">
            <Button inline>Tooltip目标元素-right</Button>
          </Tooltip>
          <Tooltip title="文字气泡" trigger="click" placement="bottom">
            <Button inline>Tooltip目标元素-bottom</Button>
          </Tooltip>
        </CompDoc.RenderCode>
      </CompDoc>
    </>
  );
};

export default TooltipDoc;
