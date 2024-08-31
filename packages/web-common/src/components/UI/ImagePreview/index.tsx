/* eslint-disable react/jsx-props-no-spreading */
/*
 * @Author: your name
 * @Date: 2021-11-17 15:13:56
 * @LastEditTime: 2021-12-14 18:04:55
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@web-common/components/UI/ImagePreview/index.ts
 */
import React, { useEffect, useState } from 'react';
import ReactDOM, { unmountComponentAtNode } from 'react-dom';
import { apiHolder, SystemApi, inWindow } from 'api';
import ImgPreviewModal from './ImgPreviewModal';
import { ImgPreviewContentProps, ImgPreviewtype } from './type';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const isElectron = systemApi.isElectron();

const ImgPreview: ImgPreviewtype = props => {
  const { visible, onCancel, data, startIndex } = props;
  if (isElectron) {
    visible && electronPreview({ data, startIndex });
    onCancel && onCancel();
    return null;
  }
  const modalProps = props;
  return <ImgPreviewModal {...modalProps} />;
};

const electronPreview = (props: ImgPreviewContentProps) => {
  const flagUrl = props.data[props.startIndex || 0]?.previewUrl;
  systemApi.createWindowWithInitData('imgPreviewPage', { eventName: 'initPage', eventData: props, uniqueId: flagUrl });
};

const Content: React.FC<any> = ({ divTemp, wrap, props }) => {
  const [testshow, setTestshow] = useState(true);
  useEffect(() => {
    // 关闭后销毁 防止内存泄漏
    if (!testshow) {
      unmountComponentAtNode(divTemp);
      wrap.removeChild(divTemp);
    }
  }, [testshow]);
  return (
    <ImgPreviewModal
      visible={testshow}
      onCancel={() => {
        setTestshow(false);
      }}
      {...props}
    />
  );
};

/**
 * 加一个静态方法，方便函数式调用
 *
 * @return {*}
 */
const wrapFn = () => {
  if (!inWindow()) {
    return () => {
      throw new Error('window not exist');
    };
  }
  if (document === void 0) {
    return () => {
      throw new Error('document not exist');
    };
  }
  const wrap: HTMLElement = document.createElement('div');
  document.body && document.body.appendChild(wrap);

  return (props: ImgPreviewContentProps): void => {
    if (isElectron) {
      electronPreview(props);
      return;
    }

    const divTemp = document.createElement('div');
    wrap.appendChild(divTemp);
    ReactDOM.render(<Content divTemp={divTemp} wrap={wrap} props={props} />, divTemp);
  };
};

ImgPreview.preview = wrapFn();

export default ImgPreview;
