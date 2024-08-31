/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import { message, Collapse, Button, Popover, Image } from 'antd';
import * as SiriusIcons from '@sirius/icons';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import style from './icon.module.scss';

const { Panel } = Collapse;
const URL = 'https://lingxi.office.163.com/doc/#id=19000005966408&from=PERSONAL&parentResourceId=19000002201088&spaceId=506182799&ref=536758021';

const Icon = () => {
  const [visible, setVisible] = React.useState(false);

  const handleCopyIcon = (text: string, result: any) => {
    if (result) {
      message.success(text);
    } else {
      message.warning('fail~');
    }
  };
  return (
    <div style={{ padding: '15px' }}>
      <h2>图标</h2>
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
              <Button type="link" target="_blank" href={URL}>
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
    </div>
  );
};

export default Icon;
