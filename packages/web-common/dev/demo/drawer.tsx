import React, { useState } from 'react';
import { Space } from 'antd';
// import { Drawer as SiriusDrawer, DrawerProps as SiriusDrawerProps } from 'antd';
import SiriusDrawer, { SiriusDrawerProps } from '@web-common/components/UI/SiriusDrawer';
import { Form, Divider, Radio, Button, message, Descriptions, Tooltip } from 'antd';
import type { RadioChangeEvent } from 'antd';
import style from './drawer.module.scss';

export const DrawerComponent = () => {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<SiriusDrawerProps['size']>('default');
  const [placement, setPlacement] = useState<SiriusDrawerProps['placement']>('right');

  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  const [open4, setOpen4] = useState(false);
  const [mask, setMask] = useState(false);
  const [header, setHeader] = useState(false);
  const [footer, setFooter] = useState(false);

  /**
   * @description drawer1
   * @param
   */
  const showDefaultDrawer = () => {
    setSize('default');
    setOpen(true);
  };

  const showLargeDrawer = () => {
    setSize('large');
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
    setOpen2(false);
    setOpen3(false);
    setOpen4(false);
  };

  /**
   * @description drawer2
   * @param
   */
  const onChangePlacement = (e: RadioChangeEvent) => {
    setPlacement(e.target.value);
  };

  const onChangeMask = (e: RadioChangeEvent) => {
    setMask(e.target.value);
  };

  const showDrawer = () => {
    setOpen2(true);
  };

  const onClose2 = () => {
    setOpen2(false);
  };

  return (
    <>
      <Divider orientation="left"> 大小</Divider>
      <Space>
        <Button type="primary" onClick={showDefaultDrawer}>
          Open Default Size (504px)
        </Button>
        <Button type="primary" onClick={showLargeDrawer}>
          Open Large Size (888px)
        </Button>
      </Space>
      <SiriusDrawer
        title={`${size} Drawer`}
        size={size}
        onClose={onClose}
        visible={open}
        extra={
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={onClose}>
              OK
            </Button>
          </Space>
        }
      >
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </SiriusDrawer>

      <Divider orientation="left"> 方位 </Divider>
      <Space>
        <Radio.Group value={placement} onChange={onChangePlacement}>
          <Radio value="top">top</Radio>
          <Radio value="right">right</Radio>
          <Radio value="bottom">bottom</Radio>
          <Radio value="left">left</Radio>
        </Radio.Group>
        <Button type="primary" onClick={showDrawer}>
          Open
        </Button>
      </Space>
      <SiriusDrawer
        title="placement Drawer"
        placement={placement}
        closable={false}
        // size={size}
        onClose={onClose2}
        visible={open2}
        key={placement}
      >
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </SiriusDrawer>

      <Divider orientation="left"> 有无遮罩</Divider>
      <Space>
        <Radio.Group value={mask} onChange={onChangeMask}>
          <Radio value={true}>yes</Radio>
          <Radio value={false}>no</Radio>
        </Radio.Group>

        <Button
          type="primary"
          onClick={() => {
            setOpen3(true);
          }}
        >
          Open
        </Button>
      </Space>
      <SiriusDrawer title="Mask Drawer" placement={placement} className={'test'} closable={true} mask={mask} size={size} onClose={onClose} visible={open3} key={'3'}>
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </SiriusDrawer>

      <Divider orientation="left"> header footer</Divider>
      <Space>
        <Button
          type="primary"
          onClick={() => {
            setHeader(false);
            setFooter(false);
            setOpen4(true);
          }}
        >
          Open with none
        </Button>
        <Button
          type="primary"
          onClick={() => {
            setHeader(true);
            setFooter(false);
            setOpen4(true);
          }}
        >
          Open with header
        </Button>
        <Button
          type="primary"
          onClick={() => {
            setHeader(false);
            setFooter(true);
            setOpen4(true);
          }}
        >
          Open with footer
        </Button>
        <Button
          type="primary"
          onClick={() => {
            setHeader(true);
            setFooter(true);
            setOpen4(true);
          }}
        >
          Open with both
        </Button>
      </Space>
      <SiriusDrawer
        title={header && <>header Drawer</>}
        footer={
          footer && (
            <div className={style.footer}>
              <Button className={style.footerBtn} type="primary" onClick={() => {}}>
                取消
              </Button>
              <Button className={style.footerBtn} type="primary" onClick={() => {}}>
                同意
              </Button>
            </div>
          )
        }
        placement={placement}
        closable={header}
        mask={true}
        size={size}
        onClose={onClose}
        visible={open4}
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
      </SiriusDrawer>
    </>
  );
};
