import Translate from '@/components/Layout/CustomsData/components/Translate/translate';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { splitSearchHit } from '@web-contact/util';
import { Tooltip, Typography, Tag } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useRef, useState } from 'react';
import style from './tableitem.module.scss';
interface TableItemProps {
  // 显示的值
  text?: string | null;
  // 是否可以拷贝
  copy?: boolean;
  // 高亮的文案
  highLightText?: string | string[];
  // 是否需要翻译
  translate?: boolean;
  tooltip?: boolean;
  //
  noneText?: string;
  // 国家信息 中文
  tag?: string;
  //
  onSearchCompany?(): void;
  className?: boolean | undefined;
  maxWidth?: number;
  minWidth?: number;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  // tooltip文案
  toolTipText?: string;
  toolTipTextHeight?: string;
}

const Copy: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className: propClassName, ...props }) => {
  return (
    <Tooltip title="复制">
      <span className={classNames(style.copyIcon, propClassName)} {...props}></span>
    </Tooltip>
  );
};

export const ligthText = (text: string, matchText: string | string[], className?: boolean) => {
  const processTexts = ([] as string[]).concat(matchText);
  const [element, ...rest] = processTexts;
  if (element) {
    const result =
      splitSearchHit(element.toLocaleLowerCase(), text) || splitSearchHit(element.toLocaleLowerCase(), text) || splitSearchHit(element.toLocaleUpperCase(), text);
    if (result?.target) {
      const { head, target, tail } = result;
      return (
        <>
          <span>{ligthText(head, rest, className)}</span>
          <span
            className={classNames(style.lightText, {
              [style.textOpacity]: !!className,
            })}
          >
            {target}
          </span>
          <span>{ligthText(tail, rest, className)}</span>
        </>
      );
    } else if (rest.length > 0) {
      return (
        <>
          <span>{ligthText(text, rest, className)}</span>
        </>
      );
    }
  }
  return text;
};

const TableItem: React.FC<TableItemProps> = ({
  text: originText,
  highLightText,
  copy = false,
  translate = false,
  tooltip = false,
  noneText = '-',
  tag,
  onSearchCompany,
  className,
  maxWidth,
  minWidth,
  placement,
  toolTipText,
  toolTipTextHeight,
}) => {
  const text = originText ?? '';
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<boolean>(false);
  const timerRef = useRef<any>(null);
  const displayText = highLightText && text ? ligthText(text.slice(0, 100), highLightText, className) : text || noneText;
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    SiriusMessage.success('复制成功');
  };
  const showCopyIcon = copy && hovered && text;
  const showTranslateIcon = translate && hovered && text;
  const onMouseEnter = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setHovered(true);
  }, []);
  const onMouseLeave = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setHovered(false);
    }, 500);
  }, []);
  const renderText = () => (
    <div
      onClick={() => {
        onSearchCompany?.();
      }}
      className={classNames(style.text, {
        [style.textSearch]: !!onSearchCompany,
        [style.textColor]: !!className,
      })}
      style={{ maxWidth: maxWidth ?? 200, minWidth: minWidth ?? 60 }}
    >
      {!tooltip ? (
        displayText || '-'
      ) : (
        <Tooltip title={<span dangerouslySetInnerHTML={{ __html: toolTipTextHeight ? toolTipTextHeight : text }}></span>} placement={placement ? placement : 'left'}>
          {''}
          {displayText || '-'}
        </Tooltip>
      )}
      {renderTranslate()}
    </div>
  );
  const renderTranslate = () => {
    return (
      (showCopyIcon || showTranslateIcon) && (
        <div className={style.iconWrapper}>
          {showCopyIcon && (
            <Copy
              onClick={e => {
                e.stopPropagation();
                handleCopy();
              }}
              className={style.copy}
            />
          )}
          {showTranslateIcon && (
            <Translate
              getPopupContainer={() => {
                return wrapperRef.current || document.body;
              }}
              bodyContainer
              classnames={style.translate}
              title={toolTipText ? toolTipText : text}
            />
          )}
        </div>
      )
    );
  };
  return (
    <div ref={wrapperRef}>
      <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} className={style.wrapper}>
        {renderText()}
      </div>

      {tag ? <div className={style.country}>{tag}</div> : null}
    </div>
  );
};

export default TableItem;
