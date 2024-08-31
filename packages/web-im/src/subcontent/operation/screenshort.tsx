import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Dropdown, Menu } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder } from 'api';
import { PasteFileContext } from '../store/pasteFile';
import { ReactComponent as TongyongZhankaiXia } from '@web-common/images/newIcon/tongyong_zhankai_xia.svg';
import lodashGet from 'lodash/get';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';

const systemApi = apiHolder.api.getSystemApi();

const ScreenShortSvg = () => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.75002 16.3749C5.99267 16.3749 7.00004 15.3675 7.00004 14.1249C7.00004 12.8823 5.99267 11.8749 4.75002 11.8749C3.50737 11.8749 2.5 12.8823 2.5 14.1249C2.5 15.3675 3.50737 16.3749 4.75002 16.3749Z"
        stroke="#3F465C"
        stroke-width="1.25"
        stroke-linejoin="round"
      />
      <path
        d="M15.25 16.3749C16.4927 16.3749 17.5 15.3675 17.5 14.1249C17.5 12.8823 16.4927 11.8749 15.25 11.8749C14.0074 11.8749 13 12.8823 13 14.1249C13 15.3675 14.0074 16.3749 15.25 16.3749Z"
        stroke="#3F465C"
        stroke-width="1.25"
        stroke-linejoin="round"
      />
      <path
        d="M16.8408 15.716C15.9622 16.5947 14.5375 16.5947 13.6588 15.716C13.073 15.1302 9.9998 11.2922 4 3.62488"
        stroke="#3F465C"
        stroke-width="1.25"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M3.15525 15.7161C4.03392 16.5948 5.45856 16.5948 6.33727 15.7161C6.92306 15.1303 9.99629 11.2923 15.9961 3.625"
        stroke="#3F465C"
        stroke-width="1.25"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

const base64ToFile = async ({ b64data = '', sliceSize = 1024 } = {}) => {
  const [mimeStr, dataStr] = b64data.split(',');
  const mimeReg = /:(.*?);/;
  const mime = lodashGet(mimeStr.match(mimeReg), '[1]', 'image/png');
  const byteCharacters = window.atob(dataStr);
  let byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    let slice = byteCharacters.slice(offset, offset + sliceSize);
    let byteNumbers = [];
    for (let i = 0; i < slice.length; i++) {
      byteNumbers.push(slice.charCodeAt(i));
    }
    // 8 位无符号整数值的类型化数组。内容将初始化为 0。
    // 如果无法分配请求数目的字节，则将引发异常。
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new File(byteArrays, '截屏.png', {
    type: mime,
  });
};

export const ScreenShort: React.FC<{ success?: (url: string) => void }> = props => {
  // const { success } = props
  const { onFileChange } = useContext(PasteFileContext);
  const [screenshortStyle] = useState<React.CSSProperties>({
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 5,
  });

  const [items] = useState([
    {
      key: '0',
      label: '截图',
    },
    {
      key: '1',
      label: '隐藏当前窗口截图',
    },
  ]);

  const triggerScreenCapture = useCallback(async (key: string = '0', needDelay = false) => {
    if (needDelay) {
      await new Promise(r => {
        setTimeout(r, 500);
      });
    }

    window.electronLib.ipcChannelManage.receiveIpcMain({
      channel: 'get-capture-screen-data',
      // once: true,
      async listener(rest: Record<'from' | 'url', string>) {
        console.log('get-capture-screen-data', rest);
        const from = rest.from;
        if (from !== 'im') {
          window.electronLib.ipcChannelManage.removeListener('get-capture-screen-data');
          return;
        }
        try {
          // success(rest.url)
          // 将base64图片转成一个blob对象
          const file = await base64ToFile({ b64data: rest.url });
          onFileChange([file]);

          // window.electronLib.ipcChannelManage.removeListener('get-capture-screen-data');
        } catch (ex) {
          console.error('screenshort.failed', ex);
          message.info('截屏失败请重试');
          // window.electronLib.ipcChannelManage.removeListener('get-capture-screen-data');
        } finally {
          window.electronLib.ipcChannelManage.removeListener('get-capture-screen-data');
        }
      },
    });
    systemApi.getScreenCapture({ from: 'im', hideCur: key as unknown as '0' | '1' });
  }, []);

  return (
    <Dropdown.Button
      trigger={['click']}
      overlay={
        <Menu>
          {items.map(({ key, label }) => {
            return (
              <Menu.Item
                onClick={() => {
                  triggerScreenCapture(key, true);
                }}
              >
                {label}
              </Menu.Item>
            );
          })}
        </Menu>
      }
      buttonsRender={([]) => {
        return [
          <Tooltip title="截图" key="leftButtonKey">
            <a
              onClick={() => {
                triggerScreenCapture();
              }}
              style={screenshortStyle}
            >
              <ScreenShortSvg />
            </a>
          </Tooltip>,
          <TongyongZhankaiXia key="rightButtonKey" />,
        ];
      }}
    ></Dropdown.Button>
  );
};
