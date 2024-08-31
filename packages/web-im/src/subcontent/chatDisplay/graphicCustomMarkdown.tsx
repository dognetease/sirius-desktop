import React, { useEffect, useState } from 'react';
import lodashGet from 'lodash/get';
import { apiHolder } from 'api';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames/bind';
import { splitMarkdown, CustomTagVars } from '../../common/convertServerMsgV2';
import { CustomTagComponent } from './graphicCustomTagComponent';
import style from './chatItemGraphic.module.scss';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
const systemApi = apiHolder.api.getSystemApi();
const md = require('markdown-it')({
  html: true,
  breaks: true,
});
md.renderer.rules.strong_open = function () {
  return `<strong class="${systemApi.isMac ? realStyle('customBold') : realStyle('customBoldInWin')}">`;
};
md.renderer.rules.strong_close = function () {
  return '</strong>';
};
export const ChatItemMarkdown: React.FC<{
  content: string;
  customclassname?: string;
}> = props => {
  const { content, customclassname = '' } = props;
  const [contentUnits, setContentUnits] = useState<(CustomTagVars | string)[]>([]);
  useEffect(() => {
    const _content = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    setContentUnits(splitMarkdown(_content));
  }, [content]);
  const onclick = (e: Event) => {
    if (lodashGet(e, 'target.tagName', '').toLowerCase() !== 'a') {
      return;
    }
    const href = e.target!.getAttribute('href') as string;
    e.preventDefault();
    e.stopPropagation();
    if (!/^http/i.test(href)) {
      message.info(getIn18Text('WUXIAOURL'));
      return;
    }
    systemApi.handleJumpUrl(`${new Date().getTime()}`, href);
  };
  return (
    <div className={realStyle('markdownText', customclassname)}>
      {contentUnits.map(item =>
        typeof item === 'string' ? (
          <p
            onClick={onclick}
            dangerouslySetInnerHTML={{
              __html: md.render(item) as string,
            }}
          />
        ) : (
          <CustomTagComponent data={item} />
        )
      )}
    </div>
  );
};
