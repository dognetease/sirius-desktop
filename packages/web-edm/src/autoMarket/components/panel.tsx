import React from 'react';
import classnames from 'classnames';
import DeleteIcon from '@/images/icons/edm/autoMarket/delete.svg';
import SuccessIcon from '@/images/icons/edm/autoMarket/success.svg';
import style from './panel.module.scss';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';

export interface PanelOption {
  icon: React.ReactSVGElement;
  name: string;
  value: string;
  infos: (string | React.ReactElement)[];
  active: boolean;
  hasQuote?: boolean;
  hasAIContent?: boolean;
}

export interface PanelProps {
  className?: string;
  name: string;
  desc: string;
  options: PanelOption[];
  value?: string;
  deletable?: boolean;
  onDelete?: () => void;
  onChange?: (value: string) => void;
  onOptionClick?: (value: string) => void;
  hasEndIcon?: boolean;
}

const Panel: React.FC<PanelProps> = props => {
  const { className, name, desc, options, value, deletable, onDelete, onChange, onOptionClick, hasEndIcon } = props;

  return (
    <div className={classnames(style.panel, className)}>
      <div className={style.header}>
        <span className={style.name}>{name}</span>
        {deletable && <img className={style.delete} src={DeleteIcon} onClick={onDelete} />}
      </div>
      <div className={style.desc}>{desc}</div>
      <div className={style.options}>
        {options.map(option => {
          const hasInfos = !!option?.infos?.length;

          return (
            <div
              className={classnames(style.option, {
                [style.optionActive]: option.active,
                [style.optionHasInfos]: hasInfos,
              })}
              key={option.value}
              onClick={() => {
                if (option.value !== value && onChange) {
                  onChange(option.value);
                }
                if (onOptionClick) {
                  onOptionClick(option.value);
                }
              }}
            >
              <div className={style.optionIcon} style={{ backgroundImage: `url(${option.icon})` }} />
              <div className={style.optionContent}>
                <div className={style.optionName}>
                  {option.name}
                  <div>
                    {option.hasQuote ? <span className={style.optionGreen}>{getTransText('QuoteFromoOiginal')}</span> : null}
                    {option.hasAIContent ? <span className={classnames(style.optionGreen, style.optionAiTag)}>{getTransText('MultipleVersionsEmail')}</span> : null}
                  </div>
                </div>
                {hasInfos && (
                  <div className={style.optionInfos}>
                    {option.infos.map((info, index) => (
                      <div className={style.optionInfo} key={index}>
                        {info}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {hasInfos && <div className={style.optionFinished} style={{ backgroundImage: `url(${SuccessIcon})` }} />}
            </div>
          );
        })}
      </div>
      {hasEndIcon && (
        <div className={style.endWrap}>
          <div className={style.endLine}></div>
          <div className={style.endBox}>{getIn18Text('JIESHU')}</div>
        </div>
      )}
    </div>
  );
};

export default Panel;
