import React from 'react';
import Pagination from './index';
import CompDoc from '../CompDoc/index';
import compDes from './compDes';
// import './style.scss';

const PaginationDoc: React.FC = () => {
  const describe = `## Pagination分页
    当前组件是基于antd 的 Pagination 组件包装生成的，所以支持 antd Pagination 组件所有API。`;

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Link href="https://3x.ant.design/components/pagination-cn/">antd Pagination 文档</CompDoc.Link>
        <CompDoc.Use
          npmPath="import Pagination, { PaginationProps } from '@lingxi-common-component/sirius-ui/Pagination';"
          path="import Pagination from '@web-common/components/UI/Pagination';"
        />
        <CompDoc.RenderCode
          customCode="<Pagination showTotal={total => `共${total}条数据`} showSizeChanger={false} defaultCurrent={2} total={200} onChange={() => {}} />"
          describe="#### 基础使用"
        >
          <Pagination showTotal={total => `共${total}条数据`} showSizeChanger={false} defaultCurrent={2} total={200} onChange={() => {}} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode="<Pagination showTotal={total => `共${total}条数据`} showSizeChanger={true} defaultCurrent={2} total={200} onChange={() => {}} />"
          describe="#### 可选择每页展示条目"
        >
          <Pagination showTotal={total => `共${total}条数据`} showSizeChanger={true} defaultCurrent={2} total={200} onChange={() => {}} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode="<Pagination showTotal={total => `共${total}条数据`} showQuickJumper defaultCurrent={2} total={200} onChange={() => {}} />"
          describe="#### 可选择每页展示条目，可输入页"
        >
          <Pagination showTotal={total => `共${total}条数据`} showQuickJumper defaultCurrent={2} total={200} onChange={() => {}} />
        </CompDoc.RenderCode>
        <CompDoc.RenderTypeTable compDesProps={compDes[0].props} />
      </CompDoc>
    </>
  );
};

export default PaginationDoc;
