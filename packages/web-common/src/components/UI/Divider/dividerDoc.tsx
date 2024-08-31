import React from 'react';
import Divider from './index';
import CompDoc from '../CompDoc/index';
import compDes from './compDes';

const DividerDoc: React.FC = () => {
  const describe = `## Divider 分割线
    分割线组件是基于 antd 的 Divider 组件开发的，支持 antd Divider 的所有 API https://3x.ant.design/components/divider-cn/
  `;

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Use
          npmPath="import Divider, { DividerProps } from '@lingxi-common-component/sirius-ui/Divider';"
          path="import Divider from '@web-common/components/UI/Divider';"
        />
        <CompDoc.RenderCode describe="#### 分割线基础用法，color 可以设置分割线颜色。">
          <Divider color="#EBEDF2" />
        </CompDoc.RenderCode>
        <CompDoc.RenderTypeTable compDesProps={compDes[0].props} />
      </CompDoc>
    </>
  );
};

export default DividerDoc;
