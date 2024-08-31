import React from 'react';
import SiriusPagination from '@web-common/components/UI/Pagination';
import { Form, Divider, Button, message, Descriptions, Tooltip } from 'antd';

export const PaginationComponent = () => {
  return (
    <>
      <Divider orientation="left"> 基础</Divider>
      <SiriusPagination showTotal={total => `共${total}条数据`} showSizeChanger={false} defaultCurrent={2} total={200} onChange={() => {}} />
      <Divider orientation="left"> 可选择每页展示条目</Divider>
      <SiriusPagination showTotal={total => `共${total}条数据`} showSizeChanger={true} defaultCurrent={2} total={200} onChange={() => {}} />
      <Divider orientation="left"> 可选择每页展示条目，可输入页</Divider>
      <SiriusPagination showTotal={total => `共${total}条数据`} showQuickJumper defaultCurrent={2} total={200} onChange={() => {}} />
    </>
  );
};
