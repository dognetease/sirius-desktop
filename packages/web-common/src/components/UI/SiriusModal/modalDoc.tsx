import React, { useState } from 'react';
import { Button } from 'antd';
import Modal from './index';
import CompDoc from '../CompDoc/index';

const ButtonDoc: React.FC = () => {
  const describe = `## Modal 对话框
    当前组件是基于antd 的 Modal 组件包装生成的，所以支持 antd Modal 组件所有API。`;
  const [visible, setVisible] = useState(false);
  const [visible1, setVisible1] = useState(false);
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
  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Link href="https://3x.ant.design/components/modal-cn/">antd Modal 文档</CompDoc.Link>
        <CompDoc.Use
          npmPath="import Modal, { ModalFuncProps, ModalProps } from '@lingxi-common-component/sirius-ui/SiriusModal';"
          path="import Modal from '@web-common/components/UI/SiriusModal';"
        />
        <CompDoc.RenderCode describe="#### 基础使用">
          <Button onClick={() => setVisible(!visible)}>基础使用</Button>
          <Modal
            title="标题"
            visible={visible}
            onCancel={() => {
              setVisible(false);
            }}
            onOk={() => {
              setVisible(false);
            }}
          >
            <p>这是一个弹窗</p>
          </Modal>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### headerBottomLine 展示标题下边框，footerTopLine 展示底部上边框">
          <Button onClick={() => setVisible1(!visible)}>带边框线</Button>
          <Modal
            title="标题"
            visible={visible1}
            headerBottomLine
            footerTopLine
            onCancel={() => {
              setVisible1(false);
            }}
            onOk={() => {
              setVisible1(false);
            }}
          >
            <p>这是一个弹窗</p>
          </Modal>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`const tips = (type: string, checkContent: boolean = false, content: null | boolean = true, closable: boolean = false) => {
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
          </Button>`}
          describe="#### 通知"
        >
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
        </CompDoc.RenderCode>
      </CompDoc>
    </>
  );
};

export default ButtonDoc;
