import React from 'react';
import { Button, Divider, Form, message, Radio, Tag } from 'antd';
import Cascader, { SizeType } from '@web-common/components/UI/Cascader';
import type { RadioChangeEvent } from 'antd';
import './index.scss';

export const CascaderComponent = () => {
  const { SHOW_CHILD } = Cascader;
  const [form] = Form.useForm();
  const addressOptions = [
    {
      label: '福建',
      value: 'fj',
      children: [
        {
          label: '福州',
          value: 'fuzhou',
          children: [
            {
              label: '马尾',
              value: 'mawei',
            },
          ],
        },
        {
          label: '泉州',
          value: 'quanzhou',
        },
        {
          label: '建州',
          value: 'jianzhou',
        },
        {
          label: '漳州',
          value: 'zhanzhou',
          disabled: true,
        },
      ],
    },
    {
      label: '浙江',
      value: 'zj',
      children: [
        {
          label: '杭州',
          value: 'hangzhou',
          children: [
            {
              label: '余杭',
              value: 'yuhang',
            },
          ],
        },
      ],
    },
    {
      label: '北京',
      value: 'bj',
      children: [
        {
          label: '朝阳区',
          value: 'chaoyang',
        },
        {
          label: '海淀区',
          value: 'haidian',
        },
      ],
    },
    {
      label: '这是一个最长字符是一个长字符这是一个最长字符是一个长字符这是一个最长字符是一个长字符',
      value: 'cjf',
    },
  ];

  for (let i = 0; i < 100; i++) {
    addressOptions.push({
      label: '北京' + i,
      value: 'bj' + i,
      children: [
        {
          label: '朝阳区',
          value: 'chaoyang',
        },
        {
          label: '海淀区',
          value: 'haidian',
        },
      ],
    });
  }

  addressOptions.push({
    label: '北京11111',
    value: 'bj1111',
    children: [
      {
        label: '朝阳区',
        value: 'chaoyang',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
    ],
  });

  const handleClick = () => {
    form
      .validateFields()
      .then(() => {
        console.log('sky', form.getFieldValue('sky'));
      })
      .catch(() => {
        message.info({
          content: '请填写完整数据～',
        });
      });
  };
  const [size, setSize] = React.useState<SizeType>();

  const handleSizeChange = (e: RadioChangeEvent) => {
    setSize(e.target.value);
  };

  const Configable = () => (
    <span>
      &nbsp;&nbsp;<Tag color="geekblue">可配置</Tag>
    </span>
  );
  const heightNum = React.useCallback(
    (number: string) => (
      <span>
        &nbsp;&nbsp;<Tag color="red">{number}</Tag>
      </span>
    ),
    []
  );
  return (
    <div className="cascader-wrap">
      <Divider orientation="left">不同大小</Divider>
      <Cascader size={size} allowClear defaultValue={['bj', 'chaoyang']} placeholder="请选择" style={{ width: 300 }} options={addressOptions} />
      &nbsp;&nbsp;
      <Cascader
        size={size}
        allowClear
        multiple
        defaultValue={[
          ['bj', 'chaoyang'],
          ['zj', 'hangzhou', 'yuhang'],
        ]}
        placeholder="请选择"
        style={{ width: 300 }}
        options={addressOptions}
      />
      <br />
      <br />
      <Radio.Group value={size} onChange={handleSizeChange}>
        <Radio.Button value="mini">mini {heightNum('高24px')}</Radio.Button>
        <Radio.Button value="small">small {heightNum('高28px')}</Radio.Button>
        <Radio.Button value="default">default {heightNum('高32px')}</Radio.Button>
        <Radio.Button value="large">large {heightNum('高36px')}</Radio.Button>
      </Radio.Group>
      <Divider orientation="left">单选</Divider>
      <Cascader placeholder="请选择" style={{ width: 300 }} options={addressOptions} />
      <Divider orientation="left">多选</Divider>
      <Cascader
        multiple
        maxTagCount="responsive"
        placeholder="请选择"
        style={{ width: 300 }}
        onBlur={() => {
          console.log('Cascader multiple onBlur event');
        }}
        options={addressOptions}
      />
      <Divider orientation="left">
        只显示子节点
        <Configable />
      </Divider>
      <Cascader multiple showCheckedStrategy={SHOW_CHILD} placeholder="请选择" style={{ width: 300 }} options={addressOptions} />
      <br />
      <br />
      <Button type="text">
        多余省略
        <Configable />
      </Button>
      <Cascader multiple maxTagCount={3} showCheckedStrategy={SHOW_CHILD} placeholder="请选择" style={{ width: 248 }} options={addressOptions} />
      <br />
      <Divider orientation="left">【beta】loading 状态</Divider>
      <Cascader fetching showSearch placeholder="请选择" style={{ width: 300 }} options={addressOptions} />
      <br />
      <br />
      <Button type="link" target="_blank" href="https://github.com/ant-design/ant-design/issues/5547">
        Cascader 服务端搜索：antd 暂不支持服务端搜索，因此 loading 态的是否存在还需商榷
      </Button>
      <Divider orientation="left">禁用</Divider>
      <Cascader disabled placeholder="请选择" style={{ width: 300 }} options={addressOptions} />
      <Divider orientation="left">表单中的表现</Divider>
      <div style={{ textAlign: 'initial' }}>
        <Form
          form={form}
          initialValues={{
            add_single: [['bj', 'chaoyang']],
            add_multiple: [
              ['bj', 'chaoyang'],
              ['zj', 'hangzhou', 'yuhang'],
            ],
            max_length: [['cjf']],
          }}
        >
          <Form.Item name="max_length" label="地址[最长字符]">
            <Cascader multiple placeholder="请选择" style={{ width: 300 }} options={addressOptions} />
          </Form.Item>
          <Form.Item name="add_single_search" label="地址[单选搜索]">
            <Cascader placeholder="请选择" showSearch style={{ width: 300 }} options={addressOptions} />
          </Form.Item>
          <Form.Item name="add_multiple_search" label="地址[多选搜索]">
            <Cascader placeholder="请选择" multiple showSearch style={{ width: 300 }} options={addressOptions} />
          </Form.Item>
          <Form.Item name="add_single" label="地址[单选默认值]">
            <Cascader placeholder="请选择" style={{ width: 300 }} options={addressOptions} />
          </Form.Item>
          <Form.Item name="add_multiple" label="地址[多选默认值]" rules={[{ required: true, message: '数据不能为空' }]}>
            <Cascader placeholder="请选择" multiple style={{ width: 300 }} options={addressOptions} />
          </Form.Item>
          <Form.Item name="water" label="地址[清除]" rules={[{ required: true, message: '地址不能为空' }]}>
            <Cascader placeholder="请选择" allowClear style={{ width: 300 }} options={addressOptions} />
          </Form.Item>
          <Button onClick={handleClick}> 提交 </Button>
        </Form>
      </div>
    </div>
  );
};
