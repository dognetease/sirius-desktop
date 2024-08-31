import React, { useMemo } from 'react';
import style from './index.module.scss';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import { Checkbox } from 'antd';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import { getIn18Text } from 'api';

interface Props {}

const EncryptMail: React.FC<Props> = (props: Props) => {
  const dispatch = useAppDispatch();
  const { currentMail } = useAppSelector(state => state.mailReducer);

  const showPw = useMemo(() => {
    return !!currentMail.savePassword;
  }, [currentMail]);
  const encpwd = useMemo(() => {
    return currentMail?.entry?.encpwd || '';
  }, [currentMail]);

  const savePwChange = e => {
    const { checked } = e.target;
    dispatch(mailActions.doChangeMailSavePassword(checked));
  };

  const changeEncpwd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    dispatch(mailActions.doChangeMailEncpwd(value));
  };

  return (
    <div className={style.encryptMail}>
      <p className={style.setPassword}>{getIn18Text('SHEZHICHAKANMIM（SJRXYMMCNCKYJ）')}</p>
      <div className={`ant-allow-dark ${style.cont}`}>
        <Input
          className={style.enterPw}
          placeholder={getIn18Text('QINGSHURU6WEISZ、ZM、QFDXX')}
          maxLength={6}
          allowClear
          value={encpwd}
          onChange={e => changeEncpwd(e)}
        />
        <Checkbox checked={showPw} className={style.savePwCheckbox} onChange={e => savePwChange(e)}>
          {getIn18Text('ZAI【FAJIANXIANG】ZBCMM')}
        </Checkbox>
      </div>
    </div>
  );
};

export default EncryptMail;
