import React, { useState } from 'react';
import { IMUser } from 'api';
import MD5 from 'md5';

interface ContentBlockApi {
  text: string;
  entityRanges: Record<'key' | 'length' | 'offset', number>[];
  inlineStyleRanges: any[];
  key: string;
}

interface ContentEntityApi {
  type: 'mention' | string;
  mutability: 'IMMUTABLE';
  data: Record<'mention', IMUser>;
}

export interface ContentRawApi {
  blocks: ContentBlockApi[];
  entityMap: ContentEntityApi[];
}
interface DrawMsgApi {
  setRawContent: React.Dispatch<ContentRawApi | null>;
  rawContent: ContentRawApi | null;
  convert2Raw(content: string, userlist: IMUser[]): any;
}

export const Context = React.createContext<DrawMsgApi>({} as DrawMsgApi);
export const Provider: React.FC<any> = props => {
  const [rawContent, setRawContent] = useState<null | ContentRawApi>(null);
  // 将数据转换成draftjs可以识别的rawContent数据
  const convert2Raw = (content: string, userlist: IMUser[]): ContentRawApi => {
    let contentStr = content || '';
    // 如果表情展示在末尾，需加一个空格光标才能够正确识别位置
    if (contentStr.match(new RegExp('\\[[^\\[\\]]+\\]$', 'g'))) {
      contentStr += ' ';
    }

    if (userlist.length === 0) {
      return {
        blocks: contentStr?.split(/[\n\r]/g).map(item => ({
          text: item,
          inlineStyleRanges: [],
          entityRanges: [],
          key: MD5(item).slice(0, 5),
        })),
        entityMap: [],
      };
    }

    const reg = new RegExp(userlist.map(item => `@${item.nick}`.replace(/\|/g, '\\|')).join('|'));
    const entityArr: ContentEntityApi[] = [];
    const blocks = contentStr
      ?.split(/[\n\r]/g)
      .map(item => ({
        text: item,
        inlineStyleRanges: [],
        key: MD5(item).slice(0, 5),
      }))
      .map(item => {
        const entityRanges: Record<'key' | 'length' | 'offset', number>[] = [];

        let str = item.text;
        let startIndex = 0;
        // 匹配当前数据中的所有的mention数据
        while (str.length && str.match(reg)) {
          const result = str.match(reg) as RegExpMatchArray;
          const index = result?.index as number;
          const matchedResult = result[0];

          const entityIndex = entityArr.map(item => `@${item.data.mention.nick}`).indexOf(matchedResult);

          // 如果entity数组中不包含当前数据(当前数据第一次被命中)
          if (entityIndex === -1) {
            entityArr.push({
              type: 'mention',
              mutability: 'IMMUTABLE',
              data: {
                mention: userlist.find(item => `@${item.nick}` === matchedResult) as IMUser,
              },
            });
          }
          entityRanges.push({
            key: entityIndex === -1 ? entityArr.length - 1 : entityIndex,
            offset: startIndex + (result?.index as number),
            length: result[0].length,
          });

          startIndex += matchedResult.length + index;
          str = str.slice(matchedResult.length + index);
        }
        return {
          ...item,
          entityRanges,
        };
      });
    return {
      entityMap: entityArr,
      blocks: blocks as ContentBlockApi[],
    };
  };
  return (
    <Context.Provider
      value={{
        rawContent,
        setRawContent,
        convert2Raw,
      }}
    >
      {props.children}
    </Context.Provider>
  );
};
