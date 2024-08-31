import React, { ReactNode } from 'react';
import { PaginationComponent } from './demo/pagination';
import { TableComponent } from './demo/table';
import { DrawerComponent } from './demo/drawer';
import { ModalComponent } from './demo/modal';
// import Icons from './demo/icons';
import Icons from '@web-setting/comp_preview/icons';
// import Total from '@web-setting/comp_preview/index';
import { SelectComponent } from '@web-setting/comp_preview/select/index';
import { InputComponent } from '@web-setting/comp_preview/input/index';
import { CascaderComponent } from '@web-setting/comp_preview/Cascader/index';
import * as SiriusIcons from '@sirius/icons';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Collapse, Button, Popover, Image } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import style from './app.module.scss';
import { CheckboxComponent } from './demo/checkbox';
import { RadioComponent } from './demo/radio';
import { SwitchComponent } from './demo/switch';
import { TabComponent } from './demo/tab';
import { ShadowComponent } from './demo/shadow';
import { StepsComponent } from './demo/steps';

const { Panel } = Collapse;
const URL = 'https://lingxi.office.163.com/doc/#id=19000005966408&from=PERSONAL&parentResourceId=19000002201088&spaceId=506182799&ref=536758021';
let map: Record<string, ReactNode> = {
  preview: (
    <>
      <h1
        style={{
          marginTop: '80px',
        }}
      >
        Shadow
      </h1>
      <ShadowComponent />
      <h1
        style={{
          marginTop: '80px',
        }}
      >
        Steps
      </h1>
      <StepsComponent />
      <h1
        style={{
          marginTop: '80px',
        }}
      >
        Tab
      </h1>
      <TabComponent />
      <h1
        style={{
          marginTop: '80px',
        }}
      >
        Switch
      </h1>
      <SwitchComponent />
      <h1
        style={{
          marginTop: '80px',
        }}
      >
        Radio
      </h1>
      <RadioComponent />
      <h1
        style={{
          marginTop: '80px',
        }}
      >
        Checkbox
      </h1>
      <CheckboxComponent />
      <h1
        style={{
          marginTop: '80px',
        }}
      >
        Modal
      </h1>
      <ModalComponent />
      <h1
        style={{
          marginTop: '80px',
        }}
      >
        Drawer
      </h1>
      <DrawerComponent />
      <h1
        style={{
          marginTop: '80px',
        }}
      >
        Cascader
      </h1>
      <CascaderComponent />
      <h1
        style={{
          marginTop: '80px',
        }}
      >
        Pagination
      </h1>
      <PaginationComponent />
      <h1
        style={{
          marginTop: '80px',
        }}
      >
        Table
      </h1>
      <TableComponent />
      <h1
        style={{
          marginTop: '80px',
        }}
      >
        Select
      </h1>
      <SelectComponent />
      <h1
        style={{
          marginTop: '80px',
        }}
      >
        Input
      </h1>
      <InputComponent />
      {/* <Total /> */}
      {/* <Icons /> */}
    </>
  ),
};

let renderContent = type => {
  return map[type || 'pagination'];
};

let App = () => {
  let hash = window.location.hash || 'preview';
  const [visible, setVisible] = React.useState(false);

  const handleCopyIcon = (text, result) => {
    if (result) {
      message.success(text);
    } else {
      message.warning('fail~');
    }
  };
  return (
    <div style={{ display: 'flex', padding: 30, height: '100vh', justifyContent: 'left', padding: '0 0 0 10vw' }}>
      <div style={{ width: '80vw' }}>
        <h1
          style={{
            marginTop: '80px',
            display: 'inline-block',
          }}
        >
          图标
        </h1>
        <div className={style.tips}>
          <Popover
            visible={visible}
            trigger="click"
            onVisibleChange={setVisible}
            content={
              <>
                <div style={{ marginBottom: 10 }}>第一步：在设计稿文件中选中图标</div>
                <div style={{ marginBottom: 10 }}>第二步：找到图标名称</div>
                <Image width={300} src="https://blog-1253646934.cos.ap-beijing.myqcloud.com/icon-demo.png" />
                <div style={{ marginTop: 10 }}>第三步：在文档中搜索拼音</div>
              </>
            }
            placement="bottom"
          >
            点击查看使用示例
          </Popover>
        </div>
        <Collapse defaultActiveKey={['0']}>
          <Panel
            header={
              <span>
                {' '}
                共 {Object.keys(SiriusIcons)?.length - 1 || 0} 个
                <Button type="link" href={URL}>
                  用法详细文档
                </Button>
              </span>
            }
            key="1"
          >
            <ul className={style.wrap}>
              {Object.keys(SiriusIcons)
                .filter(iconKey => iconKey !== 'IconsInfo')
                .map((key, index) => {
                  const Icon = SiriusIcons[key];
                  return (
                    <CopyToClipboard key={index} text={`<${key} />`} onCopy={handleCopyIcon}>
                      <li>
                        <div className={style.iconInner}>
                          <Icon />
                          <span>{key}</span>
                        </div>
                      </li>
                    </CopyToClipboard>
                  );
                })}
            </ul>
          </Panel>
        </Collapse>
        {renderContent(hash)}
      </div>
    </div>
  );
};

export default App;
