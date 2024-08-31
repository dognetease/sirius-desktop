import React from 'react';
import Modal from '@web-common/components/UI/SiriusModal';
import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusTable from '@web-common/components/UI/Table';
import { Input } from '@web-common/components/UI/Input';
import { TongyongShuomingMian } from '@sirius/icons';
import { Divider, Button, Radio, Form } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { getIn18Text } from 'api';

const TextArea = Input.TextArea;
export const ModalComponent = () => {
  const [visible, setVisible] = React.useState(false);
  const [heightVisible, setHeightVisible] = React.useState(false);
  const [border, setBorder] = React.useState({
    bothNull: true,
    headerBottomLine: true,
    footerTopLine: true,
  });
  const [tbVisible, setTbVisible] = React.useState(false);
  const [noVisible, setNoVisible] = React.useState(false);
  const tips = (type: string, checkContent: boolean = false, content: null | boolean = true, closable: boolean = false) => {
    Modal[type]({
      title: '解析三个有效地址，其中1个已重复，1个错误地址，1个历史退订地址',
      content: <div>若有未校验出的邮箱地址，请重新检查格式</div>,
      okText: '确定',
      cancelText: '取消',
      closable: closable,
      isGlobal: true,
      onOk: () => {},
    });
  };

  const onChange = (e: RadioChangeEvent) => {
    const val = e.target.value;
    switch (val) {
      case 'bothNull':
        setBorder(pre => ({
          ...pre,
          bothNull: false,
        }));
        break;
      case 'footerTopLine':
        setBorder({
          bothNull: true,
          headerBottomLine: false,
          footerTopLine: true,
        });
        break;
      case 'headerBottomLine':
        setBorder({
          bothNull: true,
          headerBottomLine: true,
          footerTopLine: false,
        });
        break;
      case 'both':
        setBorder({
          bothNull: true,
          headerBottomLine: true,
          footerTopLine: true,
        });
        break;
      default:
        break;
    }
  };
  const dataSource = [
    {
      key: '1',
      name: '胡彦斌',
      age: 32,
      address: '西湖区湖底公园1号',
    },
    {
      key: '2',
      name: '胡彦祖',
      age: 42,
      address: '西湖区湖底公园1号',
    },
  ];

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: '住址',
      dataIndex: 'address',
      key: 'address',
    },
  ];
  return (
    <>
      <Modal
        title="标题"
        visible={visible}
        onCancel={() => {
          setVisible(false);
        }}
        onOk={() => {
          setVisible(false);
        }}
        headerBottomLine={border.bothNull && border.headerBottomLine}
        footerTopLine={border.bothNull && border.footerTopLine}
        isGlobal
      >
        <p>这是一个弹窗</p>
      </Modal>
      <Modal
        width={1000}
        title="最大高度 600px"
        visible={heightVisible}
        onCancel={() => {
          setHeightVisible(false);
        }}
        onOk={() => {
          setHeightVisible(false);
        }}
        headerBottomLine={border.bothNull && border.headerBottomLine}
        footerTopLine={border.bothNull && border.footerTopLine}
        isGlobal
      >
        <Form layout="vertical">
          <Form.Item label="任务名称">
            <Input />
          </Form.Item>
          <Form.Item label="姓名" style={{ margin: 0 }}>
            <TextArea rows={16} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        visible={tbVisible}
        title={'标题'}
        onCancel={() => setTbVisible(false)}
        onOk={() => setTbVisible(false)}
        bodyStyle={{ paddingBottom: 18 }}
        footer={null}
        width={1000}
        isGlobal
      >
        <div>
          <SiriusTable columns={columns} dataSource={dataSource} pagination={false} />
          <SiriusPagination
            style={{ display: 'flex', justifyContent: 'end', marginTop: 36 }}
            showTotal={total => `${getIn18Text('GONG')}${total}${getIn18Text('TIAO')}`}
            showQuickJumper
            defaultCurrent={2}
            total={200}
            onChange={() => {}}
          />
        </div>
      </Modal>
      <Modal
        visible={noVisible}
        title={'通知条'}
        onCancel={() => setNoVisible(false)}
        onOk={() => setNoVisible(false)}
        footer={null}
        bodyStyle={{ position: 'relative', paddingBottom: 18 }}
        width={1000}
        isGlobal
      >
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 20,
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 46,
              background: '#FFF8ED',
            }}
          >
            <TongyongShuomingMian style={{ color: '#FFB54C', fontSize: 16, marginRight: 8 }} />
            <span style={{ color: '#545A6E' }}>账号失效（账号绑定时间超过3个月、管理员手动解绑）需重新绑定，否则会影响使用</span>
          </div>
          <div style={{ marginTop: 46 }}>
            <SiriusTable columns={columns} dataSource={dataSource} pagination={false} />
            <SiriusPagination
              style={{ display: 'flex', justifyContent: 'end', marginTop: 32 }}
              showTotal={total => `${getIn18Text('GONG')}${total}${getIn18Text('TIAO')}`}
              showQuickJumper
              defaultCurrent={2}
              total={200}
              onChange={() => {}}
            />
          </div>
        </>
      </Modal>

      <Divider orientation="left">基础使用</Divider>
      <Button onClick={() => setVisible(!visible)}>基础使用</Button>
      <Divider type="vertical">可配置标题下边框和底部上边框：</Divider>
      <Radio.Group onChange={onChange} defaultValue="both" buttonStyle="solid">
        <Radio.Button value="both">都展示</Radio.Button>
        <Radio.Button value="bothNull">都不展示</Radio.Button>
        <Radio.Button value="headerBottomLine">展示标题下边框</Radio.Button>
        <Radio.Button value="footerTopLine">展示底部上边框</Radio.Button>
      </Radio.Group>
      <Divider orientation="left">通知</Divider>
      <Button style={{ marginRight: 10 }} onClick={() => tips('success', false, null)}>
        成功提示
      </Button>
      <Button style={{ marginRight: 10 }} onClick={() => tips('warning')}>
        警告提示
      </Button>
      <Button style={{ marginRight: 10 }} onClick={() => tips('confirm')}>
        确认提示
      </Button>
      <Button style={{ marginRight: 10 }} onClick={() => tips('error')}>
        错误提示
      </Button>
      <Button style={{ marginRight: 10 }} onClick={() => tips('info', false, true, true)}>
        信息提示(带关闭)
      </Button>
      <Divider orientation="left">宽度不超过 1000px，高度不超过 600px</Divider>
      <Button style={{ marginBottom: 20 }} onClick={() => setHeightVisible(!heightVisible)}>
        超高滚动
      </Button>
      <p>有 footer 情况下:内容总高度=实际高度436x+20(上下内边距)*2=476px</p>
      <p>无 footer 情况下:内容总高度=实际高度524px+20(上内边距)=544px</p>
      <Divider orientation="left">表格</Divider>
      <Button onClick={() => setTbVisible(!tbVisible)}>表格</Button>
      <Divider orientation="left">通知条</Divider>
      <Button onClick={() => setNoVisible(!noVisible)}>通知条 + 表格</Button>
    </>
  );
};
