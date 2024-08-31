import React from 'react';
import classnames from 'classnames/bind';
import lodashGet from 'lodash/get';
import { CustomTagVars } from '../../common/convertServerMsgV2';
import style from './chatItemGraphic.module.scss';
import { PopoverUser } from '../../common/usercard/userCard';
import { useYunxinAccount } from '../../common/hooks/useYunxinAccount';

const realStyle = classnames.bind(style);

export const CustomTagMention: React.FC<{
  id: string;
  textContent: string;
}> = props => {
  const { id, textContent } = props;

  const user = useYunxinAccount(id);
  if (id === 'all') {
    return (
      <span className={realStyle('mention')}>
        {textContent}
        &nbsp;
      </span>
    );
  }
  return (
    <PopoverUser user={user}>
      <span className={realStyle('mention')}>
        {textContent}
        &nbsp;
      </span>
    </PopoverUser>
  );
};

export const CustomTagComponent: React.FC<{
  data: CustomTagVars;
}> = props => {
  const { data } = props;

  if (lodashGet(data, 'attrs.action', '') === 'at') {
    return <CustomTagMention textContent={data.textContent} id={data.attrs.id} />;
    // return <span className={realStyle('mention')}>{data.textContent}</span>;
  }
  return <p>{data.textContent}</p>;
};
