import React from 'react';
import { Spin } from 'antd';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import siriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as DeleteIcon } from '@/images/icons/modal_close_temp.svg';
import { useAppSelector, useActions, MailConfigActions } from '@web-common/state/createStore';
import NiceModal, { createNiceModal, useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import SignListItem from '../sign_list_item/index';
import './index.scss';
import { ModalIdList } from '@web-common/state/reducer/niceModalReducer';
import { getIn18Text } from 'api';

const noResultImg = 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/05/05/cda66a67046846198e6afd2da5226295.png';
interface SignListModalProps {
  mainAccount: boolean;
  signEditId: ModalIdList;
}

/** 设置页签名列表弹窗 */
const SignList = (props: SignListModalProps) => {
  const { mainAccount, signEditId } = props;
  const { signList, signListOther, signListLoading, currentMail } = useAppSelector(state => state.mailConfigReducer);
  const actualSignList = mainAccount ? signList : signListOther;
  const { doSetCurrentMail, doSetNickname, doChangeContent } = useActions(MailConfigActions);
  const modal = useNiceModal('signList');
  const signEditModal = useNiceModal(signEditId);

  const modalClose = () => {
    // doSetCurrentMail('');
    // doSetNickname('');
    modal.hide();
  };

  const addSign = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (actualSignList && actualSignList?.length >= 30) {
      siriusMessage.warn({
        content: getIn18Text('ZUIDUOKETIANJIA'),
      });
      return;
    }
    signEditModal.show({ _account: currentMail });
    doChangeContent('');
  };

  return (
    <NiceModal
      id="signList"
      title={getIn18Text('YOUJIANQIANMING')}
      closeIcon={<DeleteIcon className="dark-invert" />}
      width="640px"
      className="sign-list-modal"
      onCancel={modalClose}
      footer={
        <p onClick={addSign}>
          <i>
            <PlusOutlined twoToneColor="#4C6AFF" />
          </i>
          新建签名
        </p>
      }
    >
      <Spin spinning={signListLoading}>
        {actualSignList.length === 0 ? (
          <div className="no-result-box">
            <div className="no-result">
              <img className="no-result-img" src={noResultImg} />
              <div className="no-result-content">
                <div className="no-result-content-info">{getIn18Text('ZANWUQIANMING')}</div>
                <a style={{ color: '#4C6AFF' }} onClick={addSign}>
                  {getIn18Text('QUXINJIANQIANMING')}
                </a>
              </div>
            </div>
          </div>
        ) : (
          <>
            {actualSignList.map(item => (
              <div className="sign-modal-list-item" key={item?.signId}>
                <SignListItem signEditId={signEditId} signDetail={item} />
              </div>
            ))}
          </>
        )}
      </Spin>
    </NiceModal>
  );
};

const SignListModal = createNiceModal('signList', SignList);
export default SignListModal;
