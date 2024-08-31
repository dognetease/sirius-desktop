import React, { useMemo } from 'react';
import { message } from 'antd';
import Button from '../Button';
import Divider from '../Divider';
import 'highlight.js/styles/atom-one-dark.css';
import Highlight from 'react-highlight';
import ReactMarkdown from 'react-markdown';
import beautify from 'js-beautify';
import jsxToString from './jsxToString';
import { copyToClipboard } from './util';
import './index.scss';
export interface RenderCodeProps {
  describe: string;
  children: React.ReactNode;
  customCode?: string;
  rowSpace?: boolean;
}

export const RenderCode: React.FC<RenderCodeProps> = props => {
  const { describe, children, rowSpace, customCode = '' } = props;
  const code = useMemo(() => {
    if (children) {
      return beautify.html(customCode + (!customCode ? jsxToString(<div>{children}</div>).slice(5, -6) : ''), {
        indent_size: 2,
        max_preserve_newlines: 170,
      });
    }
    return '';
  }, [children]);

  if (!children) {
    return <></>;
  }

  const copyCode = () => {
    try {
      copyToClipboard(code);
      message.success('复制代码成功');
    } catch (err) {
      message.error('复制代码失败, 浏览器可能不支持');
    }
  };

  return (
    <div className="render-code-box">
      <div className="render-code-describe">
        <ReactMarkdown>{describe}</ReactMarkdown>
      </div>
      <Divider />
      <div className={`${rowSpace ? 'row-space' : ''} render-code-comp`}>{children}</div>
      <Divider />
      <div className="render-code-code">
        <Button className="render-code-code-copy" onClick={copyCode} btnType="primary">
          复制代码
        </Button>
        <Highlight>{code}</Highlight>
      </div>
    </div>
  );
};
export default RenderCode;
