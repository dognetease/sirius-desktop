import React, { useState, useEffect } from 'react';
import style from './Sensitive.module.scss';

import { ReactComponent as CloseIcon } from '@/images/icons/edm/yingxiao/edm-editor-close.svg';
import { ReactComponent as OpenIcon } from '@/images/icons/edm/yingxiao/edm-editor-open.svg';
import { SensitiveWord, api, getIn18Text } from 'api';
import { Empty } from 'antd';
import { EmailContentAssistantComponent } from '@web-edm/send/EmailContentAssistant/assistant';
import { edmDataTracker } from '@web-edm/tracker/tracker';
import classnames from 'classnames';

const storeApi = api.getDataStoreApi();

const key = 'EDM_SENTIVETIP_CLOSE_NEW';

export enum Type {
  Assistant = 'Assistant',
  Sensitive = 'Sensitive',
}

export interface Props {
  insertContent?: (content?: string) => void;
  sensitiveWordsDetected?: SensitiveWord[];
  setSensitiveChecking: (b: boolean) => void;
  setEnableSensitiveMarks: (b: boolean) => void;
  onTypeChange?: (type: Type) => void;
  toolbarHeight: number;
}
export const SensitiveTip = (props: Props) => {
  const { sensitiveWordsDetected = [], insertContent, onTypeChange, setSensitiveChecking, setEnableSensitiveMarks, toolbarHeight = 80 } = props;
  const [close, setClose] = useState(false);
  const [type, setType] = useState<Type>(Type.Assistant);

  // 获取一次是否打开
  useEffect(() => {
    const { data } = storeApi.getSync(key);
    setClose(JSON.parse(data || 'false'));
  }, []);

  // 头
  const HeaderComp = () => {
    return (
      <div className={style.header} hidden={close}>
        <div
          className={classnames(style.item, {
            [style.itemSelected]: type === Type.Assistant,
          })}
          onClick={() => {
            setType(Type.Assistant);
            setEnableSensitiveMarks(false);
            onTypeChange && onTypeChange(Type.Assistant);
            edmDataTracker.track('pc_markting_edm_contentTab', {
              type: 'assistant',
            });
          }}
        >
          {getIn18Text('NEIRONGZHUSHOU')}
        </div>
        <div
          className={classnames(style.item, {
            [style.itemSelected]: type === Type.Sensitive,
          })}
          onClick={() => {
            setType(Type.Sensitive);
            setEnableSensitiveMarks(true);
            onTypeChange && onTypeChange(Type.Sensitive);
            edmDataTracker.track('pc_markting_edm_contentTab', {
              type: 'spam',
            });
          }}
        >
          {getIn18Text('MINGANCIJIANCHA')}
          {sensitiveWordsDetected.length > 0 && <div className={style.redDot}>{sensitiveWordsDetected.length}</div>}
        </div>
      </div>
    );
  };

  const AssisComp = () => {
    return (
      <div hidden={type !== Type.Assistant}>
        <EmailContentAssistantComponent insertContent={insertContent} />
      </div>
    );
  };
  // 敏感词渲染
  const SensitiveComp = () => {
    const length = sensitiveWordsDetected.length;
    return (
      <div hidden={type !== Type.Sensitive} className={style.sensitiveResult}>
        <div className={style.sensitiveResultTitle}>{getIn18Text('GONGFAXIANCHU', { count: length })}</div>
        {length > 0 && (
          <div className={style.sensitiveResultWarning}>{getIn18Text('KENENGSHEJIGUANGGAOXINXIDENG\uFF0CRONGYIBEIPANWEILAJIYOUJIAN\uFF0CJIANYIJINXINGTIHUAN')}</div>
        )}
        {Array.isArray(sensitiveWordsDetected) && !!sensitiveWordsDetected.length && (
          <div className={style.sensitiveResultContent}>
            <div className={style.sensitiveHeader}>
              <div className={style.sensitiveLabel}>{getIn18Text('ZHENGWEN')}：</div>
            </div>
            {/* 敏感词列表 */}
            <div className={style.sensitiveResultList}>
              {sensitiveWordsDetected.map((item, index) => (
                <div className={style.sensitiveResultItem}>
                  <div className={style.sensitiveResultItemTop}>
                    <div className={style.sensitiveResultItemTopIndex}>{index + 1}</div>
                    <span className={style.sensitiveResultItemTopWord}>{item.word}</span>
                  </div>
                  {item.suggestWords != null && item.suggestWords.length > 0 && (
                    <div className={style.sensitiveResultItemBottom}>
                      <div className={style.sensitiveResultLabel}>{getIn18Text('KETIHUANWEI')}：</div>
                      <div className={style.sensitiveResultLabel}>{item.suggestWords.join(', ')}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {length === 0 && (
          <div className={style.sensitiveResultEmpty}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={getIn18Text('ZANWEIFAXIANMINGANCI')} />
          </div>
        )}
      </div>
    );
  };
  // 点击按钮
  const onClickState = () => {
    //  是否需要敏感词检测
    setSensitiveChecking(!close);
    // 当前属于关闭状态且tab状态且敏感词的tab时打开检测
    setEnableSensitiveMarks(close && type === Type.Sensitive);
    //toggle close 状态
    setClose(!close);
    storeApi.putSync(key, JSON.stringify(!close));
  };
  // 渲染按钮
  const StateOpComp = () => {
    return (
      <div className={style.opIcon} onClick={onClickState}>
        {!close && <CloseIcon />}
        {close && <OpenIcon />}
      </div>
    );
  };

  return (
    <div className={style.root} style={{ width: close ? 0 : 220, height: `calc(100% - ${toolbarHeight}px)`, marginTop: toolbarHeight }}>
      {HeaderComp()}
      <div className={style.content}>
        {AssisComp()}
        {SensitiveComp()}
      </div>
      {StateOpComp()}
    </div>
  );
};
