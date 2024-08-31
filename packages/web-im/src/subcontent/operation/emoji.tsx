import React, { useState, useEffect } from 'react';
import classnames from 'classnames/bind';
import { Popover, Tooltip } from 'antd';
import { apiHolder, NIMApi } from 'api';
import usePortal from 'react-useportal';
import debounce from 'lodash/debounce';
import style from './operation.module.scss';
import emojiStyle from './emoji.module.scss';
import { emojiList, expressionSourceMap, emojiSourceMap } from '../../common/emojiList';
import { useRecentEmoji, setRecentEmoji } from '../../common/hooks/useRecentEmoji';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
const emojiRealStyle = classnames.bind(emojiStyle);
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
interface EmojiContentApi {
  sendCustomMsg(params: any): Promise<any>;
  closePop(): void;
  sendEmojiMsg(name: string): any;
}
interface EmojiTooltipApi {
  name: string;
  setRecentUse(): void;
  sendEmojiMsg(): void;
}
const EmojiTooltip: React.FC<EmojiTooltipApi> = props => {
  const { name, setRecentUse, sendEmojiMsg } = props;
  const [visible, setVisible] = useState<boolean>(false);
  const fileName = emojiList.get(name) as string;
  const imgSrc = emojiSourceMap[fileName] || '';
  return (
    <Tooltip key={name} visible={visible} overlayClassName={emojiRealStyle('tooltipEmojiName')} title={name}>
      <span
        onClick={() => {
          setRecentUse();
          sendEmojiMsg();
        }}
        className={emojiRealStyle('expressionItem')}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        <img src={imgSrc} alt={name} />
      </span>
    </Tooltip>
  );
};
const LocalExpressionCategories = [
  {
    src: '',
    name: 'common',
    nick: getIn18Text('MORENBIAOQING'),
  },
  {
    src: '',
    name: 'custom-lt',
    nick: getIn18Text('LEITU'),
  },
  {
    src: '',
    name: 'custom-xxy',
    nick: getIn18Text('XIONGXIAOYI'),
  },
  {
    src: '',
    name: 'custom-ajmd',
    nick: getIn18Text('AJIMIDE'),
  },
];
const EmojiContent: React.FC<EmojiContentApi> = props => {
  const { sendCustomMsg, closePop, sendEmojiMsg } = props;
  const recentEmojiList = useRecentEmoji('RecentEmojiList');
  const [categoryNames] = useState(() => {
    return LocalExpressionCategories;
  });
  const [serverEmojiList] = useState(() => {
    return nimApi.imcache.getServerEmojis();
  });
  const [curCategory, setCurCategory] = useState<string>('common');
  const chooseCategory = name => {
    setCurCategory(name);
  };
  // 发送自定义消息
  const sendExpressionMsg = async (params: unknown) => {
    sendCustomMsg({
      content: JSON.stringify({
        type: 3,
        data: params,
      }),
    });
    closePop();
  };
  const setRecentUse = (key: string) => {
    setRecentEmoji(recentEmojiList, key, 12, 'RecentEmojiList');
  };
  return (
    <div className={emojiRealStyle('wrapper')}>
      <div className={emojiRealStyle('expressionContent')} data-test-id="im_session_emojis_wrapper">
        {curCategory === 'common' && recentEmojiList.length > 0 && (
          <>
            <p className={emojiRealStyle('expressionName')}>{getIn18Text('ZUIJINSHIYONG')}</p>
            <div className={emojiRealStyle('expressionList', 'expressionListRecent')}>
              {recentEmojiList.map(key => (
                <EmojiTooltip name={key} setRecentUse={() => setRecentUse(key)} sendEmojiMsg={() => sendEmojiMsg(key)} />
              ))}
            </div>
          </>
        )}
        <p className={emojiRealStyle('expressionName', 'expressionNameStick')}>
          {[
            ...serverEmojiList.map(item => {
              return {
                name: item.emojiTag,
                nick: item.name,
              };
            }),
            ...categoryNames,
          ].find(item => item.name === curCategory)?.nick || getIn18Text('MORENBIAOQING')}
        </p>
        <div className={emojiRealStyle('expressionList')} data-test-id="im_session_emojis_types_wrapper">
          {/* emoji表情 */}
          {curCategory === 'common' &&
            [...emojiList.keys()].map(key => <EmojiTooltip name={key} setRecentUse={() => setRecentUse(key)} sendEmojiMsg={() => sendEmojiMsg(key)} />)}
          {/* 自定义本地消息 */}
          {curCategory !== 'common' &&
            curCategory.indexOf('lxx') === -1 &&
            Object.keys(expressionSourceMap)
              .filter(item => item.indexOf(curCategory.replace('custom-', '')) !== -1)
              .map(key => {
                const imgSrc = expressionSourceMap[key];
                return (
                  <span
                    className={emojiRealStyle('customExpressionItem')}
                    key={key}
                    onClick={() => {
                      const [catalog, chartlet] = key.split('/');
                      sendExpressionMsg({ catalog, chartlet });
                    }}
                  >
                    <img src={imgSrc} alt={key} />
                  </span>
                );
              })}
          {/* 服务端表情 */}
          {curCategory.indexOf('lxx') !== -1 &&
            serverEmojiList
              .find(item => {
                return item.emojiTag === curCategory;
              })!
              .emojis.map(item => {
                return (
                  <span
                    className={emojiRealStyle('customExpressionItem')}
                    key={item.name}
                    data-gif-icon={item.icon}
                    onClick={() => {
                      sendExpressionMsg({ catalog: curCategory, chartlet: item.name, imageUrl: item.icon });
                    }}
                  >
                    <img className={emojiRealStyle('staticEmoji')} src={item.staticIcon} alt={item.name} />
                    <img className={emojiRealStyle('gifEmoji')} src={item.icon} alt={item.name} />
                  </span>
                );
              })}
        </div>
      </div>

      {/* Tab */}
      <div className={emojiRealStyle('categoryNames')} data-test-id="im_session_emojis_types_wrapper">
        {categoryNames.slice(0, 1).map(item => (
          <span
            className={emojiRealStyle('categoryName', item.name, {
              checked: curCategory === item.name,
            })}
            key={item.name}
            onClick={() => {
              chooseCategory(item.name);
            }}
          />
        ))}

        {/* {服务端表情} */}
        {serverEmojiList.map(item => {
          return (
            <span
              key={item.emojiTag}
              className={emojiRealStyle('categoryName', 'serverCategoryName', item.emojiTag, {
                checked: curCategory === item.emojiTag,
              })}
              style={{
                backgroundImage: `url(${curCategory === item.emojiTag ? item.selectIcon : item.unSelectIcon})`,
              }}
              onClick={() => {
                chooseCategory(item.emojiTag);
              }}
            ></span>
          );
        })}

        {categoryNames.slice(1).map(item => (
          <span
            className={emojiRealStyle('categoryName', item.name, {
              checked: curCategory === item.name,
            })}
            key={item.name}
            onClick={() => {
              chooseCategory(item.name);
            }}
          />
        ))}
      </div>
    </div>
  );
};
interface EmojiEntryApi {
  iconSelector: string;
  insertEmojiContent(name: string): void;
  [key: string]: any;
}
export const EmojiEntry: React.FC<EmojiEntryApi> = props => {
  const { iconSelector, insertEmojiContent } = props;
  const { Portal } = usePortal({
    bindTo: document && (document.querySelector(iconSelector) as HTMLElement),
  });
  const [visible, setVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const setVisibleCb = () => setVisible(false);
  useEffect(() => {
    nimApi.subCustomEvent('MESSAGE_SHORTCUTS_SEARCH', setVisibleCb, {});
    return () => {
      nimApi.offCustomEvent('MESSAGE_SHORTCUTS_SEARCH', setVisibleCb);
    };
  }, []);
  return (
    <Popover
      trigger={['click']}
      visible={visible}
      // 用usePortal绑定到其他元素导致popover打开时点击表情icon，触发[点击其他位置关闭]-[点击表情打开]，导致闪一下关闭又打开
      // 这里用debounce处理这个问题
      onVisibleChange={debounce(value => {
        setVisible(value);
      }, 0)}
      placement="topLeft"
      destroyTooltipOnHide
      zIndex={999}
      content={
        <EmojiContent
          {...props}
          closePop={() => {
            setVisible(false);
          }}
          sendEmojiMsg={name => {
            insertEmojiContent(name);
            setVisible(false);
          }}
        />
      }
    >
      <Portal>
        <Tooltip title={getIn18Text('BIAOQING')} visible={showTooltip}>
          <span
            data-test-id="im_session_send_emoji_btn"
            className={realStyle('operationIcon', 'iconExpression', visible ? 'iconSelected' : '')}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          />
        </Tooltip>
      </Portal>
      <div className={emojiRealStyle('iconRealEntry')}>
        <span />
      </div>
    </Popover>
  );
};
