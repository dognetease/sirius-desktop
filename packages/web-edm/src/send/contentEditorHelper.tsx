import React, { useEffect, useState, useContext } from 'react';
import style from './contentEditorHelper.module.scss';
import { EmailContentAssistantComponent } from './EmailContentAssistant/assistant';

import { ReactComponent as CloseIcon } from '@/images/icons/edm/yingxiao/edm-editor-close.svg';
import { ReactComponent as OpenIcon } from '@/images/icons/edm/yingxiao/edm-editor-open.svg';
import { edmDataTracker } from '../tracker/tracker';
import { ValidatorContext } from './validator/validator-context';

export enum Type {
  Assistant = 'Assistant',
  Sensitive = 'Sensitive',
}

export interface Props {
  insertContent?: (content?: string) => void;
  renderSensitiveResultComp: () => JSX.Element;
  onTypeChange?: (type: Type) => void;
  // sensitiveWords?: SensitiveWord[];
  sensitiveWordsLength?: number;
}
export const ContentEditorHelper = (props: Props) => {
  const { insertContent, renderSensitiveResultComp, onTypeChange, sensitiveWordsLength = 0 } = props;
  const [type, setType] = useState<Type>(Type.Assistant);
  const [close, setClose] = useState(false);
  const validatorProvider = useContext(ValidatorContext);

  useEffect(() => {
    // console.log('敏感词注册');
    validatorProvider?.dispatch({
      type: 'sensitive:failedActionState',
      payload: () => setType(Type.Sensitive),
    });
  }, [setType]);

  const HeaderComp = () => {
    return (
      <div className={style.header}>
        <div
          className={type === Type.Assistant ? style.itemSelected : style.item}
          onClick={() => {
            setType(Type.Assistant);
            onTypeChange && onTypeChange(Type.Assistant);
            edmDataTracker.track('pc_markting_edm_contentTab', {
              type: 'assistant',
            });
          }}
        >
          内容助手
        </div>
        <div
          className={type === Type.Sensitive ? style.itemSelected : style.item}
          style={{ position: 'relative' }}
          onClick={() => {
            setType(Type.Sensitive);
            onTypeChange && onTypeChange(Type.Sensitive);
            edmDataTracker.track('pc_markting_edm_contentTab', {
              type: 'spam',
            });
          }}
        >
          敏感词检查
          {sensitiveWordsLength > 0 && <div className={style.redDot}>{sensitiveWordsLength}</div>}
        </div>
      </div>
    );
  };
  const AssisComp = () => {
    return (
      <div style={{ display: type === Type.Assistant ? 'block' : 'none' }}>
        <EmailContentAssistantComponent insertContent={insertContent} />
      </div>
    );
  };
  const SensitiveComp = () => {
    return <div style={{ display: type === Type.Sensitive ? 'block' : 'none' }}>{renderSensitiveResultComp()}</div>;
  };

  const onClickState = () => {
    setClose(!close);
  };

  const StateOpComp = () => {
    return (
      <div className={style.opIcon} onClick={onClickState}>
        {!close && <CloseIcon />}
        {close && <OpenIcon />}
      </div>
    );
  };

  return (
    <div className={style.root}>
      <div className={style.content} style={{ display: close ? 'none' : 'block', minWidth: '220px', width: '220px' }}>
        {HeaderComp()}
        {AssisComp()}
        {SensitiveComp()}
      </div>
      {StateOpComp()}
    </div>
  );
};
