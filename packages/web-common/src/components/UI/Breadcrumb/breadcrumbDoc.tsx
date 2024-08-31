import React from 'react';
import CompDoc from '../CompDoc/index';
import Breadcrumb from './index';

const BreadcrumbDoc: React.FC = () => {
  const describe = `## Breadcrumb 面包屑
  当前组件是基于antd Breadcrumb 组件包装生成的，所以支持 antd Breadcrumb 组件所有API。
  `;
  const path = `import Breadcrumb from '@web-common/components/UI/Breadcrumb';`;
  const npmPath = "import Breadcrumb , { BreadcrumbProps, BreadcrumbItemProps } from '@lingxi-common-component/sirius-ui/Breadcrumb';";

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Use npmPath={npmPath} path={path} />
        <CompDoc.RenderCode
          customCode={`<Breadcrumb><Breadcrumb.Item>Home</Breadcrumb.Item><Breadcrumb.Item><a href="">Application Center</a></Breadcrumb.Item><Breadcrumb.Item><a href="">Application List</a></Breadcrumb.Item><Breadcrumb.Item>An Application</Breadcrumb.Item></Breadcrumb>`}
          describe="#### Breadcrumb 基础用法"
        >
          <Breadcrumb>
            <Breadcrumb.Item>Home</Breadcrumb.Item>
            <Breadcrumb.Item>
              <a href="">Application Center</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <a href="">Application List</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>An Application</Breadcrumb.Item>
          </Breadcrumb>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<Breadcrumb arrowSeparator><Breadcrumb.Item>Home(箭头分隔符)</Breadcrumb.Item><Breadcrumb.Item><a href="">Application Center</a></Breadcrumb.Item><Breadcrumb.Item><a href="">Application List</a></Breadcrumb.Item><Breadcrumb.Item>An Application</Breadcrumb.Item></Breadcrumb>`}
          describe="#### Breadcrumb arrowSeparator 为 true 使用箭头分割符"
        >
          <Breadcrumb arrowSeparator>
            <Breadcrumb.Item>Home(箭头分隔符)</Breadcrumb.Item>
            <Breadcrumb.Item>
              <a href="">Application Center</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <a href="">Application List</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>An Application</Breadcrumb.Item>
          </Breadcrumb>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<Breadcrumb separator=""><Breadcrumb.Item>Location</Breadcrumb.Item><Breadcrumb.Separator>:</Breadcrumb.Separator><Breadcrumb.Item href="">Application CenterApplication CenterApplication CenterApplication CenterApplication Center</Breadcrumb.Item><Breadcrumb.Separator /><Breadcrumb.Item href="">Application List</Breadcrumb.Item><Breadcrumb.Separator /><Breadcrumb.Item>An Application</Breadcrumb.Item></Breadcrumb>`}
          describe="#### Breadcrumb 使用案例，使用了自定义分隔符 : "
        >
          <Breadcrumb separator="">
            <Breadcrumb.Item>Location</Breadcrumb.Item>
            <Breadcrumb.Separator>:</Breadcrumb.Separator>
            <Breadcrumb.Item href="">Application CenterApplication CenterApplication CenterApplication CenterApplication Center</Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item href="">Application List</Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>An Application</Breadcrumb.Item>
          </Breadcrumb>
        </CompDoc.RenderCode>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Link href="https://3x.ant.design/components/breadcrumb-cn/">antd Breadcrumb 文档</CompDoc.Link>
      </CompDoc>
    </>
  );
};

export default BreadcrumbDoc;
