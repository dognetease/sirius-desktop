import React, { FC, useMemo } from 'react';
import { getIn18Text, apiHolder, SystemApi } from 'api';
import { SignDetail } from 'api';
import { ReactComponent as ArrowDown } from '@/images/icons/triangle-down.svg';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import { Modal, Checkbox, Spin } from 'antd';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { deleteSignAsync, useSignAsync } from '@web-common/state/reducer/mailConfigReducer';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import { ModalIdList } from '@web-common/state/reducer/niceModalReducer';
import styles from './index.module.scss';
import './checkbox.scss';
const { confirm } = Modal;

const defaultOptions = [
  { label: getIn18Text('YINGYONGXIEXIN'), value: 'compose' },
  { label: getIn18Text('YINGYONGHUIFU'), value: 'reply' },
  { label: getIn18Text('YINGYONGZHUANFA'), value: 'forward' },
];

export const loadIframe = (e: React.SyntheticEvent) => {
  const target = e.target as HTMLIFrameElement;
  const height = target.contentDocument?.body.clientHeight || 0;
  height && (target.height = String(height + 20));
  target.contentDocument?.getElementById('lingxi-signature-block')?.setAttribute('target', '_blank');
};

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
let lang = systemApi.getSystemLang();

const ICheckbox: FC<{ options: any; onChange: any; value: any }> = props => {
  const { options, onChange, value } = props;
  const { signActionLoading, signListLoading, signListOtherLoading } = useAppSelector(state => state.mailConfigReducer);
  return (
    <Spin
      spinning={signActionLoading || signListLoading || signListOtherLoading}
      indicator={
        <div className={`${styles.loading} sign-list-item-loading`}>
          <i></i>
        </div>
      }
    >
      <Checkbox.Group value={value} options={options} onChange={onChange} className="icheckbox" />
    </Spin>
  );
};

interface SignItemProps {
  /**
   * 签名详情
   */
  signDetail: SignDetail;
  /**
   * 非列表，删除二次确认框，需要展示 mask
   */
  isSingle?: boolean;
  /**
   * 卡片宽度
   */
  width?: string;
  signEditId: ModalIdList;
}

const SignListItem: FC<SignItemProps> = props => {
  const {
    signDetail: { signInfoDTO, signId, divContent, _account },
    isSingle = false,
    width = '100%',
    signEditId,
  } = props;
  const modal = useNiceModal(signEditId);
  const dispatch = useAppDispatch();
  const setDefaultVal = useMemo(() => {
    const res = [];
    signInfoDTO.defaultItem.compose && res.push('compose');
    signInfoDTO.defaultItem.reply && res.push('reply');
    signInfoDTO.defaultItem.forward && res.push('forward');
    return res;
  }, [signInfoDTO]);

  const showConfirm = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    confirm({
      title: getIn18Text('QUEDINGYAOSHANCHU12'),
      icon: <ExclamationCircleOutlined />,
      content: '',
      okText: getIn18Text('QUEDING'),
      cancelText: getIn18Text('QUXIAO'),
      mask: true,
      centered: true,
      onOk() {
        signId && dispatch(deleteSignAsync({ id: signId, _account }));
      },
      maskStyle: {
        background: isSingle ? 'rgba(0,0,0,0.5)' : 'transparent',
      },
    });
  };

  const setBtnClick = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const defaultOptionChange = (value: any) => {
    const compose = value.includes('compose');
    const reply = value.includes('reply');
    const forward = value.includes('forward');
    const defaultItem = {
      control: compose || reply || forward,
      compose,
      reply,
      forward,
    };
    signId && dispatch(useSignAsync({ signId, defaultItem, _account }));
  };

  const onEdit = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    modal.show({ signItem: props.signDetail, _account: props.signDetail._account });
  };

  return (
    <div className={styles.mailSignItem} style={{ width }}>
      <div className={styles.mailSignItemOperation}>
        <p className={styles.operationTag}>
          <span className={styles.writeTag} hidden={!signInfoDTO.defaultItem.compose}>
            {getIn18Text('XIEXINMOREN')}
          </span>
          <span className={styles.replyTag} hidden={!signInfoDTO.defaultItem.reply}>
            {getIn18Text('HUIFUMOREN')}
          </span>
          <span className={styles.forwardTag} hidden={!signInfoDTO.defaultItem.forward}>
            {getIn18Text('ZHUANFAMOREN')}
          </span>
        </p>
        <p className={styles.operationBtn}>
          <span className={styles.delBtn} onClick={showConfirm}>
            {getIn18Text('SHANCHU')}
          </span>
          <span className={styles.editBtn} onClick={onEdit}>
            {getIn18Text('BIANJI')}
          </span>
          <span className={styles.setBtn} onClick={setBtnClick}>
            {getIn18Text('SHEWEIMOREN')}
            <i>
              <ArrowDown />
            </i>
            <div className={styles.setModal} style={{ width: lang === 'en' ? '210px' : '147' }}>
              <ICheckbox value={setDefaultVal} options={defaultOptions} onChange={defaultOptionChange} />
            </div>
          </span>
        </p>
      </div>
      <div className={`extheme ${styles.mailSignItemContent}`}>
        <iframe width="100%" className={styles.docIframe} srcDoc={divContent} onLoad={loadIframe} />
      </div>
    </div>
  );
};

export default SignListItem;
