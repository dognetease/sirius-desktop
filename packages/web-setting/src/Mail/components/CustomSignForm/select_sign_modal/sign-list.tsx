import React, { useEffect, useRef } from 'react';
import { SignDetail, WriteLetterPropType } from 'api';
import { Radio, Button } from 'antd';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { MailConfigActions } from '@web-common/state/reducer';
import siriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import styles from './sign-list.module.scss';
import SignListItem from '../sign_list_item/index';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import { ModalIdList } from '@web-common/state/reducer/niceModalReducer';
import { getIn18Text } from 'api';

interface SignListProps {
  /** 签名列表 */
  signList: SignDetail[];
  /** 保存回调 */
  onSave?: (content: string) => void;
  writeType?: WriteLetterPropType;
  signEditId: ModalIdList;
  signSelectId: ModalIdList;
}
/** 签名列表组件 */
export const SignList = (props: SignListProps) => {
  const { signList, onSave, writeType = 'common', signEditId, signSelectId } = props;
  const selectSign = useAppSelector(state => state.mailConfigReducer.selectSign);
  const { doSetSelectSign } = useActions(MailConfigActions);
  const radioGroupRef = useRef<HTMLDivElement>(null);
  const editModal = useNiceModal(signEditId);
  const selectModal = useNiceModal(signSelectId);
  useEffect(() => {
    // const _defaultSign = signList.find(sign => sign.signInfoDTO.isSetDefault)?.signId || -1;
    let _defaultSign;
    if (['replyWithAttach', 'replyAllWithAttach', 'reply', 'replyAll'].includes(writeType)) {
      _defaultSign = signList.find(sign => sign.signInfoDTO.defaultItem.reply)?.signId;
    }
    if (['forward'].includes(writeType || '')) {
      _defaultSign = signList.find(sign => sign.signInfoDTO.defaultItem.forward)?.signId;
    }
    if (['common'].includes(writeType || '')) {
      _defaultSign = signList.find(sign => sign.signInfoDTO.defaultItem.compose)?.signId;
    }
    doSetSelectSign(_defaultSign || -1);
  }, []);
  const renderList = () => (
    <>
      <Radio className={styles.configListRadioItem} value={-1} key={-1}>
        <span className={styles.configListNoneSign}>{getIn18Text('BUSHIYONGRENHE')}</span>
      </Radio>
      {signList?.map(item => (
        <Radio key={item.signInfoDTO.signId} className={styles.configListRadioItem} value={item.signInfoDTO.signId}>
          <div className={styles.configListSignItem}>
            <SignListItem signEditId={signEditId} key={item.signId} signDetail={item} width="600px" />
          </div>
        </Radio>
      ))}
    </>
  );
  const selectSignRadioChange = (e: any) => {
    doSetSelectSign(e.target.value);
  };
  const addSignClick = () => {
    if (signList && signList?.length >= 30) {
      siriusMessage.warn({
        content: getIn18Text('ZUIDUOKETIANJIA'),
      });
      return;
    }
    editModal.show({ _account: signList[0]?._account || '' });
  };
  const selectClick = () => {
    const useNoSign = selectSign === -1;
    if (useNoSign) {
      onSave && onSave(' ');
    } else {
      const content = signList.find(item => item.signId === selectSign)?.divContent || '';
      onSave && onSave(content);
    }
    selectModal.hide();
  };
  return (
    <div className={styles.configList}>
      <Radio.Group className={styles.configListRadio} ref={radioGroupRef} onChange={selectSignRadioChange} value={selectSign}>
        {renderList()}
      </Radio.Group>
      <div className={styles.actionBtns}>
        <Button type="link" style={{ border: 'none', background: 'transparent', paddingLeft: 0 }} onClick={addSignClick}>
          {getIn18Text('TIANJIAQIANMING')}
        </Button>
        <div>
          <Button onClick={() => selectModal.hide()}>{getIn18Text('QUXIAO')}</Button>
          <Button type="primary" style={{ marginLeft: 12 }} onClick={selectClick}>
            {getIn18Text('WANCHENG')}
          </Button>
        </div>
      </div>
    </div>
  );
};
