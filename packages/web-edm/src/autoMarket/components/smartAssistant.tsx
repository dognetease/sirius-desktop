import React from 'react';
import { Switch, Tooltip } from 'antd';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { ReactComponent as TextIcon } from '@/images/icons/edm/autoMarket/textIcon.svg';
import style from './smartAssistant.module.scss';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';

interface SmartAssistantProps {
  isDiabled: boolean;
  classNames?: String;
  value?: String;
  onChange?: (checked: Boolean) => void;
}

const SmartAssistant: React.FC<SmartAssistantProps> = props => {
  const { onChange, value, isDiabled } = props;
  return (
    <div className={style.smartAssistantWrap}>
      <TextIcon />
      <div className={style.rightArea}>
        <div className={style.textWrap}>
          <div className={style.top}>
            <span className={style.title}>{getTransText('QuoteFromoOiginal')}</span>
            <span className={style.green}>{getIn18Text('TISHENGHUIFULV')}</span>
            <Tooltip overlayStyle={{ zIndex: 10000 }} title={getTransText('XINDONGZUODEYOUJIAN')}>
              <QuestionCircleOutlined />
            </Tooltip>
          </div>
          <div className={style.bottom}>{getTransText('ZAIYUANWENJICHUSHANGJINXINGLIANXUYINGXIAO')}</div>
        </div>
        <Switch size="small" disabled={isDiabled} checked={!!value} onChange={checked => onChange && onChange(checked)} />
      </div>
    </div>
  );
};
export { SmartAssistant };
