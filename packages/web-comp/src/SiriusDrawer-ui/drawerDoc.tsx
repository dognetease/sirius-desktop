import React, { useState } from 'react';
import { Button } from 'antd';
import Drawer from './index';
import Divider from '../Divider/index';
import CompDoc from '../CompDoc/index';
import SiriusButton from '../Button/index';
import 'antd/es/button/style/index.css';

const ButtonDoc: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  const [open4, setOpen4] = useState(false);
  const [open5, setOpen5] = useState(false);
  const [open6, setOpen6] = useState(false);
  const onClose = () => {
    setOpen(false);
    setOpen2(false);
    setOpen3(false);
    setOpen4(false);
    setOpen5(false);
    setOpen6(false);
  };
  const describe = `## Drawer 抽屉
    当前组件是基于antd 的 Drawer 组件包装生成的，所以支持 antd Drawer 组件所有API。`;

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Link href="https://3x.ant.design/components/drawer-cn/">antd Drawer 文档</CompDoc.Link>
        <CompDoc.Use
          npmPath="import Drawer, { SiriusDrawerProps as DrawerProps } from '@lingxi-common-component/sirius-ui/SiriusDrawer';"
          path="import SiriusDrawer from '@web-common/components/UI/SiriusDrawer';"
        />
        <CompDoc.RenderCode describe="#### 基础抽屉">
          <Button type="primary" onClick={() => setOpen(true)}>
            Open Default
          </Button>
          <Drawer title="这是 Drawer title" onClose={onClose} visible={open}>
            <p>Some contents...</p>
            <p>Some contents...</p>
            <p>Some contents...</p>
          </Drawer>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### size 大小，支持 default：504px、large：888px，默认为 default">
          <Button type="primary" onClick={() => setOpen2(true)}>
            Open size Default
          </Button>
          <Drawer title="这是 Drawer title" onClose={onClose} visible={open2}>
            <p>Some contents...</p>
            <p>Some contents...</p>
            <p>Some contents...</p>
          </Drawer>
          <Divider />
          <Button type="primary" onClick={() => setOpen3(true)}>
            Open size large
          </Button>
          <Drawer size="large" title="这是 Drawer title" onClose={onClose} visible={open3}>
            <p>Some contents...</p>
            <p>Some contents...</p>
            <p>Some contents...</p>
          </Drawer>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### placement 抽屉的方向, 支持 'top' | 'right' | 'bottom' | 'left'，默认为 right">
          <Button type="primary" onClick={() => setOpen4(true)}>
            Open placement left
          </Button>
          <Drawer title="placement Drawer" placement="left" onClose={onClose} visible={open4}>
            <p>Some contents...</p>
            <p>Some contents...</p>
            <p>Some contents...</p>
          </Drawer>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### mask 是否展示遮罩，默认为 true">
          <Button type="primary" onClick={() => setOpen5(true)}>
            open mask false
          </Button>
          <Drawer title="Mask false Drawer" closable={true} mask={false} onClose={onClose} visible={open5}>
            <p>Some contents...</p>
            <p>Some contents...</p>
            <p>Some contents...</p>
          </Drawer>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### footer 抽屉的页脚">
          <Button type="primary" onClick={() => setOpen6(true)}>
            open footer
          </Button>
          <Drawer
            title="自定义 footer"
            footer={
              <div style={{ display: 'flex', justifyContent: 'right' }}>
                <SiriusButton style={{ marginLeft: '20px' }} btnType="primary" onClick={() => {}}>
                  取消
                </SiriusButton>
                <SiriusButton btnType="primary" onClick={() => {}}>
                  同意
                </SiriusButton>
              </div>
            }
            onClose={onClose}
            visible={open6}
          >
            <p
              style={{
                height: '1200px',
              }}
            >
              Some contents...
            </p>
            <p>Some contents...</p>
            <p>Some contents...</p>
          </Drawer>
        </CompDoc.RenderCode>
      </CompDoc>
    </>
  );
};

export default ButtonDoc;
