import React, { useMemo } from 'react';
import Divider from '../Divider';
import Button from '../Button';
import { message } from 'antd';
import 'highlight.js/styles/atom-one-dark.css';
import Highlight from 'react-highlight';
import beautify from 'js-beautify';
import ReactMarkdown from 'react-markdown';
import { copyToClipboard } from './util';
import './index.scss';
export interface UseProps {
  path: string;
  npmPath?: string;
}

export const Use: React.FC<UseProps> = props => {
  const { path, npmPath } = props;
  const describe = '#### 引入组件';
  const beautifyPath = useMemo(() => {
    if (path) {
      return beautify.html(path, {
        indent_size: 2,
        max_preserve_newlines: 170,
      });
    }
    return '';
  }, [path]);
  const beautifyNpmPath = useMemo(() => {
    if (npmPath) {
      return beautify.html('//或者 \n ' + npmPath, {
        indent_size: 2,
        max_preserve_newlines: 170,
      });
    }
    return '';
  }, [npmPath]);

  npmPath;

  const copyCode = (path: string) => {
    try {
      copyToClipboard(path);
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
      <div className="render-code-code">
        <Button className="render-code-code-copy" onClick={() => copyCode(path)} btnType="primary">
          复制代码
        </Button>
        <Highlight>{beautifyPath}</Highlight>
      </div>
      {beautifyNpmPath && (
        <div className="render-code-code">
          <Button className="render-code-code-copy" onClick={() => copyCode(npmPath || '')} btnType="primary">
            复制代码
          </Button>
          <Highlight>{beautifyNpmPath}</Highlight>
        </div>
      )}
    </div>
  );
};
export default Use;
