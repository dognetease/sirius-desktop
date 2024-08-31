import React from 'react';
import classnames from 'classnames/bind';
import lodashGet from 'lodash/get';
import { apiHolder } from 'api';
import { ContentRawApiV2, switchPlaceholder2Var, sortModuleByOrder } from '../../common/convertServerMsgV2';
import style from './chatItemGraphic.module.scss';
import { ChatItemMarkdown } from './graphicCustomMarkdown';
import { MarkdownImg } from './graphicCustomImg';
import { Frames } from './graphicCustomButtons';

const systemApi = apiHolder.api.getSystemApi();
const realStyle = classnames.bind(style);

export const ChatItemGraphic: React.FC<{
  data: ContentRawApiV2;
  idClient: string;
  comments: boolean;
}> = props => {
  const { data, idClient, comments = false } = props;
  const bgColor = lodashGet(data, 'header.bg_color', null);
  return (
    <div className={`extheme ${realStyle('graphicMsgWrapper', comments ? 'graphicMsgWrapperBorder' : '')}`}>
      <div
        className={realStyle('header', systemApi.isMac ? 'inMac' : 'inWin')}
        style={{
          backgroundColor: bgColor || '#fff',
        }}
      >
        <ChatItemMarkdown content={data.header.content} />
      </div>
      <div className={realStyle('main', bgColor ? '' : 'mainNoBg')}>
        {sortModuleByOrder(data.modules).map(item => {
          if (item.module_type === 'TEXT') {
            return <ChatItemMarkdown content={switchPlaceholder2Var(item.content, item.action_url)} />;
          }
          if (item.module_type === 'FOOTER') {
            return <ChatItemMarkdown content={item.content} customclassname={realStyle('footerNote')} />;
          }
          if (item.module_type === 'HR') {
            return <div className={realStyle('markdownHr')} />;
          }
          if (item.module_type === 'IMG') {
            return <MarkdownImg data={item} />;
          }
          if (item.module_type === 'BUTTON') {
            return <Frames data={item} order={item.order} idClient={idClient} />;
          }
          return null;
        })}
      </div>
    </div>
  );
};
