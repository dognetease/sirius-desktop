import React, { useState, useEffect, useMemo } from 'react';
import classnames from 'classnames/bind';
import lodashGet from 'lodash/get';
import { IMMessage } from 'api';
import style from './chatItemAlt.module.scss';
import { ContentRawApi, ContentEntityApi } from '../../common/convertServerMsg';
import { ItemAccount } from './itemAltType/ItemAccount';
import { ItemH5Link } from './itemAltType/ItemH5Link';
import { ItemLink } from './itemAltType/ItemLink';
import { ItemMail } from './itemAltType/ItemMail';
import { ItemUnit } from './itemAltType/ItemUnit';
import { AltFooter } from './chatItemAltFooter';

const realStyle = classnames.bind(style);

export interface ChatItemAltProps {
  data: ContentRawApi;
}
export const ChatItemAlt: React.FC<ChatItemAltProps> = props => {
  const { data, ...restProps } = props;
  const [entityList, setEntityList] = useState<ContentEntityApi[]>([]);
  useEffect(() => {
    let blockText = data.body.block.text;
    const entityRanges = [...data.body.block.entityRanges];
    const { entityMap } = data.body;
    let entityList: ContentEntityApi[] = [];
    while (entityRanges.length) {
      const entityRange = entityRanges.pop() as Record<'key' | 'length' | 'offset', number>;
      const { key, length, offset } = entityRange;
      const textEntity = blockText.slice(offset + length);
      entityList = [
        entityMap[key],
        {
          text: textEntity,
          type: 'TEXT',
        },
        ...entityList,
      ];
      blockText = blockText.slice(0, offset);
    }

    entityList = [
      {
        text: blockText,
        type: 'TEXT',
      } as ContentEntityApi,
      ...entityList,
    ].filter(item => item.text.length !== 0);
    console.log('[entityList]', entityList);
    setEntityList(entityList);
  }, []);

  return (
    <div className={realStyle('cardWrapper')}>
      <div className={realStyle('cardContent')}>
        <p className={realStyle('cardHeader')}>{data.header}</p>
        <p className={realStyle('cardBody')}>
          {entityList.map(item => {
            if (item.type === 'ACCOUNT') {
              return <ItemAccount id={item.param?.id || ''} />;
            }
            if (item.type === 'LINK') {
              return <ItemLink text={item.text} url={item.param.pc_url || ''} />;
            }
            if (item.type === 'UNIT') {
              return <ItemUnit id={item.param.id} />;
            }
            if (item.type === 'H5LINK') {
              return <ItemH5Link text={item.text} url={item.param.pc_url} />;
            }
            if (item.type === 'MAIL') {
              return <ItemMail text={item.text} id={item.param.id} />;
            }

            return (
              <span
                dangerouslySetInnerHTML={{
                  __html: lodashGet(item, 'text.length', 0) !== 0 ? item.text.replace(/\r|\n/g, '<br/>') : '',
                }}
              />
            );
          })}
        </p>
        {lodashGet(data, 'footer_action.elements.length', 0) !== 0 && (
          <>
            {/* 这种场景下footer要作为注释 */}
            <p className={realStyle('cardNote')}>{data.footer}</p>
            <AltFooter {...(restProps as { msg: IMMessage })} footerAction={data.footer_action} />
          </>
        )}
        {lodashGet(data, 'footer_action.elements.length', 0) === 0 && <p className={realStyle('cardFooter')}>{data.footer}</p>}
      </div>
    </div>
  );
};
