import React, { useState, useRef, useEffect, SetStateAction } from 'react';
import Measure from 'react-measure';
import { useAppDispatch } from '@web-common/state/createStore';
import Reply from '../Reply';
import { MailEmoticonInfoModel } from 'api';
interface Props {
  mid: string;
  content: any;
  nofix?: boolean;
  emoticonInfo: MailEmoticonInfoModel | undefined;
  handleEmoticon(data: MailEmoticonInfoModel, mid: string): void;
}

// todo: 由于原有结构写的有问题，在独立读信页上高度有略微超出 line:37
const ReplyWrap: React.FC<Props> = ({ mid, content, nofix, emoticonInfo, handleEmoticon }) => {
  const [width, setWidth] = useState<number>();
  return (
    <Measure
      bounds
      onResize={contentRect => {
        setWidth(contentRect.bounds?.width);
      }}
    >
      {({ measureRef }) => (
        <div ref={measureRef} style={{ flex: '0 0 auto', ...(nofix ? { height: '64px' } : undefined) }}>
          {content?.entry?.folder === 2 ? (
            ''
          ) : (
            <div className={nofix ? 'u-read-reply' : 'u-read-fixed'} style={{ width: nofix ? '100%' : width }}>
              <Reply mid={mid} mailContent={content} emoticonInfo={emoticonInfo} handleEmoticon={handleEmoticon} />
            </div>
          )}
        </div>
      )}
    </Measure>
  );
};

export default ReplyWrap;
