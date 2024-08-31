import React, { useState } from 'react';
import style from './emailguess.module.scss';
import { ReactComponent as TranslateSuccess } from '@/images/translate_success.svg';
import { ReactComponent as TranslateError } from '@/images/translate_error2.svg';
import { Divider, Empty } from 'antd';
import { ImageEmptyNormal } from '../search/EmptyResult/EmptyImge';
import { ReactComponent as TriangleDownIcon } from '@/images/icons/triangle-down.svg';
import { ReactComponent as TriangleDownDisableIcon } from '@/images/icons/triangle-down-disable.svg';
import classNames from 'classnames';

interface EmailGuessResultProps extends React.HTMLAttributes<HTMLDivElement> {
  validEmail: string[];
  notValidEmail: string[];
  validEmptyDesc: string;
}

const EmailGuessResult: React.FC<EmailGuessResultProps> = ({ validEmail, notValidEmail, validEmptyDesc, ...rest }) => {
  const [showValid, setShowValid] = useState<boolean>(true);
  const [showNotValid, setShowNotValid] = useState<boolean>(false);
  return (
    <div {...rest}>
      <p
        onClick={() => {
          setShowValid(!showValid);
        }}
        className={style.tip}
      >
        <span
          className={classNames(style.tipIcon, {
            [style.tipIconNotShow]: !showValid,
          })}
        >
          {validEmail.length === 0 ? <TriangleDownDisableIcon /> : <TriangleDownIcon />}
        </span>
        <span>有效邮箱（{validEmail.length}）</span>
      </p>
      {showValid && (
        <div>
          {validEmail.map(el => (
            <div className={style.guessEmailItem} key={el}>
              <span title={el} className={style.guessEmailText}>
                {el}
              </span>
              <span className={style.guessEmailTag}>
                <TranslateSuccess />
              </span>
            </div>
          ))}
          {validEmail.length === 0 && <Empty description={validEmptyDesc} className={classNames(style.empty, style.emptyResult)} image={<ImageEmptyNormal />} />}
        </div>
      )}
      <Divider />
      <p
        onClick={() => {
          setShowNotValid(!showNotValid);
        }}
        className={style.tip}
      >
        <span
          className={classNames(style.tipIcon, {
            [style.tipIconNotShow]: !showNotValid,
          })}
        >
          {notValidEmail.length === 0 ? <TriangleDownDisableIcon /> : <TriangleDownIcon />}
        </span>
        <span>无效邮箱（{notValidEmail.length}）</span>
      </p>
      {showNotValid && (
        <div>
          {notValidEmail.map(el => (
            <div className={style.guessEmailItem} key={el}>
              <span title={el} className={style.guessEmailText}>
                {el}
              </span>
              <span className={style.guessEmailTag}>
                <TranslateError />
              </span>
            </div>
          ))}
          {notValidEmail.length === 0 && <Empty description={'没有无效邮箱'} className={classNames(style.empty, style.emptyResult)} image={<ImageEmptyNormal />} />}
        </div>
      )}
    </div>
  );
};

export default EmailGuessResult;
