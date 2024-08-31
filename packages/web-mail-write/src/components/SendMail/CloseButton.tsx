import React from 'react';
import style from './index.module.scss';
import { getIn18Text } from 'api';
interface Props {
  id: number;
  innerCloseTab: (id: string) => void;
}
const CloseButton: React.FC<Props> = (props: Props) => {
  const { id, innerCloseTab } = props;
  const closeCk = () => {
    innerCloseTab(String(id));
  };
  return (
    <div className={`${style.btn} ${style.closeBtn}`} onClick={closeCk}>
      {getIn18Text('GUANBI')}
    </div>
  );
};
export default CloseButton;
