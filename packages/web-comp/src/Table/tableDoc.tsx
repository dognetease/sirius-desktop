import React from 'react';
import CompDoc from '../CompDoc/index';
import Table from './index';
import VirtualTable from '../VirtualTable/VirtualTable';

const locale = {
  // Options.jsx
  items_per_page: '条/页哈',
  jump_to: '前往',
  jump_to_confirm: '确定',
  page: '页',

  // Pagination.jsx
  prev_page: '上一页呀',
  next_page: '下一页呀',
  prev_5: '向前 5 页',
  next_5: '向后 5 页',
  prev_3: '向前 3 页',
  next_3: '向后 3 页',
  page_size: '页码',
};
const columns: any = [
  {
    title: 'Name',
    dataIndex: 'name',
    width: 150,
  },
  {
    title: 'Age',
    dataIndex: 'age',
    width: 150,
  },
  { title: 'Column 1', dataIndex: 'address', key: '1' },
  { title: 'Column 2', dataIndex: 'address', key: '2' },
  { title: 'Column 3', dataIndex: 'address', key: '3' },
  { title: 'Column 4', dataIndex: 'address', key: '4' },
  {
    title: 'Address',
    dataIndex: 'address',
    fixed: 'right',
  },
];

const columnsFixLeft: any = [
  {
    title: 'Name',
    dataIndex: 'name',
    width: 150,
    fixed: 'left',
  },
  {
    title: 'Age',
    dataIndex: 'age',
    width: 150,
  },
  { title: 'Column 1', dataIndex: 'address', key: '1' },
  { title: 'Column 2', dataIndex: 'address', key: '2' },
  { title: 'Column 3', dataIndex: 'address', key: '3' },
  { title: 'Column 4', dataIndex: 'address', key: '4' },
  {
    title: 'Address',
    dataIndex: 'address',
  },
];

const columnsFixRight: any = [
  {
    title: 'Name',
    dataIndex: 'name',
    width: 150,
  },
  {
    title: 'Age',
    dataIndex: 'age',
    width: 150,
  },
  { title: 'Column 1', dataIndex: 'address', key: '1' },
  { title: 'Column 2', dataIndex: 'address', key: '2' },
  { title: 'Column 3', dataIndex: 'address', key: '3' },
  { title: 'Column 4', dataIndex: 'address', key: '4' },
  {
    title: 'Address',
    dataIndex: 'address',
    fixed: 'right',
  },
];

const columnsAllResiable: any = [
  {
    title: 'Name',
    dataIndex: 'name',
    width: 150,
  },
  {
    title: 'Age',
    dataIndex: 'age',
    width: 150,
  },
  { title: 'Column 1', width: 150, dataIndex: 'address', key: '1' },
  { title: 'Column 2', width: 150, dataIndex: 'address', key: '2' },
  { title: 'Column 3', width: 150, dataIndex: 'address', key: '3' },
  { title: 'Column 4', width: 150, dataIndex: 'address', key: '4' },
];

const data: any[] = [];
for (let i = 0; i < 3; i++) {
  data.push({
    key: i,
    name: `Edward King ${i}`,
    age: 32,
    address: `London, Park Lane no. ${i}`,
  });
}

data.push({
  key: 5,
  name: `` || '-',
  age: 0,
  address: `London, Park Lane no. `,
});

const data2: any[] = [];

for (let i = 0; i < 100; i++) {
  data2.push({
    key: i,
    name: `Edward King ${i}`,
    age: 32,
    address: `London, Park Lane no. ${i}`,
  });
}

const data3: any[] = [];

for (let i = 0; i < 4; i++) {
  data3.push({
    key: i,
    name: <img className="pic" width={64} height={64} src="https://nos.netease.com/rms/6ccbca70e4b453c54562baf540e2e74d?download=POPO%E6%8E%A8%E9%80%81banner.png" />,
    age: 32,
    address: `London, Park Lane no. ${i}`,
  });
}

const createData = (counts: number) => {
  const data: any[] = [];
  for (let i = 0; i < counts; i++) {
    data.push({
      key: i,
      name: `Edward King ${i}`,
      age: 32,
      address: `London, Park Lane no. ${i}`,
    });
  }

  return data;
};

const PaginationDoc: React.FC = () => {
  const describe = `## Table 表格
    当前组件是基于antd 的 Table 组件包装生成的，所以支持 antd Table 组件所有API。`;

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Link href="https://3x.ant.design/components/table-cn/">antd Table 文档</CompDoc.Link>
        <CompDoc.Use
          npmPath="import Table, { SiriusTableProp as TableProps, TablePaginationConfig, TableColumnGroupType, TableColumnType, TableColumnProps, TableColumnsType } from '@lingxi-common-component/sirius-ui/Table';"
          path="import SiriusTable from '@web-common/components/UI/Table';"
        />
        <CompDoc.Use npmPath="npm中的表格暂不支持虚拟列表表格" path="import VirtualTable from '@web-common/components/UI/VirtualTable/VirtualTable'; // 虚拟列表表格" />
        <CompDoc.RenderCode describe="#### 基础使用">
          <Table pagination={false} columns={columns} dataSource={data} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 带分页器表格">
          <Table columns={columns} dataSource={data2} pagination={{}} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 带分页器表格自定义分页locale">
          <Table columns={columns} dataSource={data2} pagination={{ locale: locale }} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### resize表格， resizable设置为true">
          <Table resizable={true} pagination={false} columns={columns} dataSource={data3} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### resize表格 固定列">
          <Table resizable={true} pagination={false} columns={columnsFixLeft} dataSource={data} scroll={{ x: 1600 }} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### resize表格 全部列可设置">
          <Table resizable={true} pagination={false} columns={columnsAllResiable} dataSource={data} scroll={{ x: 'max-content' }} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 图片类型">
          <Table pagination={false} columns={columns} dataSource={data3} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 固定表头">
          <Table columns={columns} dataSource={data2} scroll={{ y: 300 }} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 固定列头">
          <Table
            pagination={{
              size: 'small',
              total: 200,
              pageSizeOptions: ['20', '50', '100'],
              showSizeChanger: true,
            }}
            columns={columnsFixLeft}
            dataSource={data}
            scroll={{ x: 1600 }}
          />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 固定列尾">
          <Table pagination={false} columns={columnsFixRight} dataSource={data} scroll={{ x: 1600 }} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 行hover态">
          <Table pagination={false} columns={columns} dataSource={data} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 零值">
          <Table pagination={false} columns={columns} dataSource={data} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 表格加载">
          <Table pagination={false} loading columns={columns} dataSource={data} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 暂无数据">
          <Table pagination={false} columns={columns} dataSource={[]} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 复选">
          <Table
            pagination={false}
            rowSelection={{
              type: 'checkbox',
            }}
            columns={columns}
            dataSource={data}
          />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 虚拟列表，关于VirtualTable更完整的使用场景，可以参考：'packages/web/src/components/Layout/Worktable/employeeRankCard/EmployeeRankCard.tsx'">
          <VirtualTable
            pagination={false}
            rowSelection={{
              type: 'checkbox',
            }}
            columns={columns}
            dataSource={createData(500)}
            autoSwitchRenderMode={true}
            enableVirtualRenderCount={50}
            scroll={{ y: 300 }}
          />
        </CompDoc.RenderCode>
      </CompDoc>
    </>
  );
};

export default PaginationDoc;
