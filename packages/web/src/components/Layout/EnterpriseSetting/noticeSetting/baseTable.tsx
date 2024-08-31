import React, { useEffect, useState } from 'react';
import { Table, Checkbox } from 'antd';
import style from './noticeSetting.module.scss';
import classnames from 'classnames';
import { ColumnsType } from 'antd/lib/table';
import { moduleConfigListItem as itemType, notifyItem as tableItem } from 'api';
import { getIn18Text } from 'api';
interface Props {
  classNames?: string;
  onChange: (module: string, scene: string, key: string, value: boolean) => void;
  onChangeAll: (module: string, key: string, value: boolean) => void;
  module: string;
  imEditable: boolean;
  emailEditable: boolean;
  data: itemType['notifyConfigs'];
}
const BaseTable = ({ module, data, onChange, onChangeAll, imEditable, emailEditable }: Props) => {
  const [im, setIm] = useState<boolean>(false);
  const [imIndeterminate, setImIndeterminate] = useState<boolean>(false);
  const [email, setEmail] = useState<boolean>(false);
  const [emailIndeterminate, setEmailIndeterminate] = useState<boolean>(false);
  const onChangeCurrentAll = (module: string, key: string, value: boolean) => {
    onChangeAll(module, key, value);
  };
  useEffect(() => {
    let imSome = data.some(item => item.im === true);
    let imEvery = data.every(item => item.im === true);
    setImIndeterminate(imSome && !imEvery);
    setIm(imEvery);
    let emailSome = data.some(item => item.email === true);
    let emailEvery = data.every(item => item.email === true);
    setEmailIndeterminate(emailSome && !emailEvery);
    setEmail(emailEvery);
  }, [data]);
  const columns: ColumnsType<tableItem> = [
    {
      width: 118,
      title: () => (
        <>
          <Checkbox disabled={!emailEditable} checked={email} indeterminate={emailIndeterminate} onChange={e => onChangeCurrentAll(module, 'email', e.target.checked)}>
            <span style={{ fontWeight: 500 }}>{getIn18Text('YOUJIANTONGZHI')}</span>
          </Checkbox>
        </>
      ),
      dataIndex: 'email',
      render: (text, record) => (
        <div>
          {
            <Checkbox disabled={!emailEditable} checked={text} onChange={e => onChange(module, record.scene, 'email', e.target.checked)}>
              {getIn18Text('QIYONG')}
            </Checkbox>
          }
        </div>
      ),
    },
    {
      width: 118,
      title: () => (
        <>
          <Checkbox disabled={!imEditable} checked={im} indeterminate={imIndeterminate} onChange={e => onChangeCurrentAll(module, 'im', e.target.checked)}>
            <span style={{ fontWeight: 500 }}>{getIn18Text('XIAOXITONGZHI')}</span>
          </Checkbox>
        </>
      ),
      dataIndex: 'im',
      render: (text, record) => (
        <div>
          {
            <Checkbox disabled={!imEditable} checked={text} onChange={e => onChange(module, record.scene, 'im', e.target.checked)}>
              {getIn18Text('QIYONG')}
            </Checkbox>
          }
        </div>
      ),
    },
    {
      title: () => <span style={{ fontWeight: 500, color: '#232D47' }}>{getIn18Text('TONGZHINEIRONG')}</span>,
      align: 'left',
      dataIndex: 'content',
      render: (text, record) => (
        <div>
          <p className={style.tableColumnTitle}>{record.title}</p>
          <p className={style.tableColumnContent}>{record.content}</p>
        </div>
      ),
    },
  ];
  return (
    <Table
      // bordered
      className={classnames('edm-table', 'edm-table-customs', style.fieldTable)}
      columns={columns}
      dataSource={data}
      pagination={false}
      rowKey="scene"
    />
  );
};
export default BaseTable;
