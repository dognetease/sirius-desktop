import React, { useMemo } from 'react';
import { Props as docgenOutProps } from 'react-docgen-typescript';
import { Table } from 'antd';

export interface RenderTypeTableProps {
  compDesProps: docgenOutProps;
}

const columns = [
  {
    title: '属性',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '说明',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: '默认值',
    dataIndex: 'defaultValue',
    key: 'defaultValue',
    width: 75,
  },
  {
    title: '是否必传',
    dataIndex: 'required',
    key: 'required',
    width: 90,
  },
];

export const RenderTypeTable: React.FC<RenderTypeTableProps> = props => {
  const { compDesProps } = props;

  const compDesPropsArr = useMemo(() => {
    let res = [];
    if (compDesProps) {
      const props = Object.keys(compDesProps);
      for (let i = 0; i < props.length; i++) {
        res.push({
          ...compDesProps[props[i]],
          key: compDesProps[props[i]].name,
          type: compDesProps[props[i]].type.name === 'enum' ? compDesProps[props[i]].type.value.map((i: any) => i.value).join(' | ') : compDesProps[props[i]].type.name,
          defaultValue: compDesProps[props[i]].defaultValue ? compDesProps[props[i]].defaultValue.value.toString() : '_',
          required: compDesProps[props[i]].required ? '是' : '否',
        });
      }
    }
    return res;
  }, [compDesProps]);

  return (
    <div style={{ padding: '15px', marginBottom: '15px' }}>
      <p style={{ height: '34px', fontSize: '22px', lineHeight: '34px', fontWeight: 500 }}>API</p>
      <Table dataSource={compDesPropsArr} columns={columns} pagination={false} bordered />
    </div>
  );
};

export default RenderTypeTable;
