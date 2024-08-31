import React from 'react';
import { Form, Divider, Button, message, Descriptions, Tooltip, Input as IInput } from 'antd';
// import { Input } from '@web-common/components/UI/Input';
import Input, { SizeType } from '@lingxi-common-component/sirius-ui/Input';
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import CopyOutlined from '@ant-design/icons/CopyOutlined';
// import { SizeType } from '@web-common/components/UI/Input/input';

export const InputComponent = () => {
  const [form] = Form.useForm();
  const [isDisabled, setDisabled] = React.useState(false);
  const [fixVisible, setVisible] = React.useState(false);
  const handleDisabledClick = () => setDisabled(!isDisabled);

  const cssStyle = { marginRight: 20, marginBottom: 10 };
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

  const list = [
    {
      label: '定高多行',
      component: <Input.TextArea disabled={isDisabled} rows={3} placeholder="定高 3 行文本" style={{ width: 300, resize: 'none' }} />,
    },
    {
      label: '可拖拉高度输入框',
      component: <Input.TextArea disabled={isDisabled} placeholder="可拖拉高度输入框" style={{ width: 300 }} />,
    },
    {
      label: '可拖拉高度输入框+字数限制',
      component: <Input.TextArea disabled={isDisabled} showCount placeholder="可拖拉高度输入框+字数限制" style={{ width: 300 }} maxLength={150} />,
    },
    {
      label: '字数限制',
      component: <Input.TextArea disabled={isDisabled} showCount placeholder="多行文本字数限制" style={{ width: 300, resize: 'none' }} maxLength={150} />,
    },
    {
      label: '可清空内容输入框',
      component: <Input.TextArea disabled={isDisabled} rows={3} placeholder="可清空内容输入框" maxLength={100} allowClear style={{ width: 300, resize: 'none' }} />,
    },
  ];

  const suffixList = [
    {
      label: '网站地址',
      component: <Input disabled={isDisabled} style={{ width: 300 }} placeholder="请输入网站地址" prefix={<UserOutlined className="site-form-item-icon" />} />,
    },
    {
      label: '我的姓名',
      component: (
        <Input
          disabled={isDisabled}
          style={{ width: 300 }}
          placeholder="请输入姓名"
          suffix={
            <Tooltip title="Extra information">
              <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
            </Tooltip>
          }
        />
      ),
    },
  ];
  const sizeList = ['mini', 'small', 'default', 'middle', 'large'];

  return (
    <>
      <Descriptions title="基础" column={3}>
        <Descriptions.Item labelStyle={{ width: 84 }} label="使用">
          <Input disabled={isDisabled} placeholder="请输入" style={{ width: 300 }} />
        </Descriptions.Item>
      </Descriptions>
      <Descriptions title="不同大小" column={3}>
        {sizeList.map((item, index) => {
          return (
            <Descriptions.Item labelStyle={{ width: 84 }} label={item} key={index}>
              <Input
                style={{ width: 300, ...cssStyle }}
                disabled={isDisabled}
                size={item as SizeType}
                allowClear
                openFix={false}
                prefix={fixVisible ? <span>https://</span> : null}
                suffix={fixVisible ? <CopyOutlined /> : null}
                placeholder="请输入"
              />
            </Descriptions.Item>
          );
        })}
      </Descriptions>
      {/* 暂不支持 */}
      {/* <Descriptions title="单行字数限制" column={3}>
        <Descriptions.Item labelStyle={{ width: 84 }} label="使用">
          <Input disabled={isDisabled} style={{ width: 300 }} placeholder="单行字数限制" showCount maxLength={20} />
        </Descriptions.Item>
      </Descriptions> */}
      <Button onClick={() => setVisible(!fixVisible)}>{fixVisible ? '取消' : '添加'}前后缀</Button>
      <br />
      <br />
      <Descriptions title="文本域" column={3}>
        {list.map((item, index) => {
          return (
            <Descriptions.Item labelStyle={{ width: 84 }} label={item.label} key={index}>
              {item.component}
            </Descriptions.Item>
          );
        })}
      </Descriptions>
      <Descriptions title="前缀和后缀" column={3}>
        {suffixList.map((item, index) => {
          return (
            <Descriptions.Item labelStyle={{ width: 84 }} label={item.label} key={index}>
              {item.component}
            </Descriptions.Item>
          );
        })}
      </Descriptions>
      {/* <Input
				disabled={isDisabled}
				// showCount
				placeholder="单行文本字数限制"
				style={{ width: 300, resize: 'none' }}
				maxLength={150}
			/>
		  */}
      <Button onClick={handleDisabledClick}> {isDisabled ? '不禁用' : '禁用'} </Button>
      <Divider orientation="left">表单中的表现</Divider>
      <Form form={form} initialValues={{ sky: 'sky' }}>
        <Form.Item name="sky" label="name" rules={[{ required: true, message: '数据不能为空' }]}>
          <Input disabled={isDisabled} style={{ width: 300 }} placeholder="天空" />
        </Form.Item>
        <Form.Item name="nice" label="nice" rules={[{ required: true, message: '数据不能为空' }]}>
          <Input disabled={isDisabled} style={{ width: 300 }} placeholder="奈斯" />
        </Form.Item>
        <Form.Item name="age" label="age" rules={[{ required: true, message: '数据不能为空' }]}>
          <Input disabled={isDisabled} style={{ width: 300 }} placeholder="请输入年龄" suffix={<CopyOutlined />} />
        </Form.Item>
        <Button onClick={handleClick}> 提交 </Button>
      </Form>
    </>
  );
};
