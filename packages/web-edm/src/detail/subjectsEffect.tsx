import React from 'react';
import style from './subjectsEffect.module.scss';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import type { ColumnsType } from 'antd/es/table';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';

export interface Props {
  data: any[];
}
// data字段的Key:
// subjectType: 1二次营销
// subject: '邮件主题1',
// sendCount: 1,
// arriveCount: 1,
// readCount: 1,
// replyCount: 1,
// arriveRatio: '100%',
// readRatio: '100%',
// replyRatio: '100%',

const columns: ColumnsType = [
  {
    title: '主题内容',
    dataIndex: 'subject',
    key: 'subject',
    render: (text, record) => {
      return +record?.subjectType === 1 ? (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: 8 }}>{text}</span>
          <Tag type="label-2-1" hideBorder={true}>
            多轮营销
          </Tag>
        </span>
      ) : (
        <span>{text}</span>
      );
    },
  },
  { title: '发送人数', dataIndex: 'sendCount', key: 'sendCount' },
  { title: '送达人数（送达率）', dataIndex: 'arriveStr', key: 'arriveStr' },
  { title: '打开人数（打开率）', dataIndex: 'readStr', key: 'readStr' },
  { title: '回复人数（回复率）', dataIndex: 'replyStr', key: 'replyStr' },
];

// 数据转换一下，不写自定义函数了
const transData = (data: any[]) => {
  if (!data.length) {
    return [];
  } else {
    return data.map(d => {
      return {
        ...d,
        arriveStr: `${Number(d.arriveCount)}（${d.arriveRatio}）`,
        replyStr: `${Number(d.replyCount)}（${d.replyRatio}）`,
        readStr: `${Number(d.readCount)}（${d.readRatio}）`,
      };
    });
  }
};

// 主题效果对比
export const SubjectsEffect = (props: Props) => {
  const { data = [] } = props;
  // 长度大于一才展示，否则认为只有一个主题，不展示
  const tableData = transData(data);

  return tableData.length > 1 ? (
    <div className={style.headerBg} style={{ marginTop: 12 }}>
      <div className={style.header} style={{ marginBottom: 18 }}>
        主题效果对比
      </div>
      <SiriusTable pagination={false} columns={columns} dataSource={tableData} />
    </div>
  ) : null;
};
