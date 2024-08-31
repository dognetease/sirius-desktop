import React, { useState } from 'react';
import { Button } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apis, apiHolder as api, MailApi, MailEntryModel, DataTrackerApi, MailDraftApi } from 'api';
import './index.scss';
import WarnIcon from '@web-common/components/UI/Icons/svgs/WarnSvg';
import { ModalCloseSmall } from '@web-common/components/UI/Icons/icons';
import AttachmentBlockModal from './AttachmentBlockModal';
import { useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import { AppActions } from '@web-common/state/reducer';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import { getIn18Text } from 'api';
interface Props {
  isModalVisible: boolean;
  setIsModalVisible: (val: boolean) => void;
  onNotSave: () => void;
  onSave: (failCids?: number[]) => void;
  currentMailId?: number;
  needSaveMails: MailEntryModel[];
  closeWriteNum?: number; // 关闭写信数目
  maskStyle?: object;
}

const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const mailDraftApi = api.api.requireLogicalApi(apis.mailDraftApiImpl) as MailDraftApi;

const NeedTempDialog: React.FC<Props> = (props: Props) => {
  const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
  const { isModalVisible, setIsModalVisible, needSaveMails, onSave, onNotSave, closeWriteNum, maskStyle = {} } = props;
  const [attachmentShow, setAttachmentShow] = useState(false);
  const attachments = useAppSelector(state => state.attachmentReducer.attachments);
  const scheduleDate = useAppSelector(state => state.mailReducer.currentMail.scheduleDate); //定时发信时间
  const dispatch = useAppDispatch();
  const signEditModal = useNiceModal('signEditOnWrite');
  const selectSignModal = useNiceModal('selectSignOnWrite');

  // 确认保存草稿
  const comfirmSaveTemp = () => {
    const sucMails: MailEntryModel[] = [];
    const failMails: any[] = [];
    Promise.allSettled(needSaveMails.map(mail => mailApi.doSaveTemp({ content: mail, saveDraft: true }))).then(results => {
      results.forEach(result => {
        const { status, value } = result;
        // 成功保存
        if (status === 'fulfilled') {
          sucMails.push(value);
        }
        // 保存失败
        else {
          failMails.push(value);
        }
        // 清除本地草稿
        const sucCids = sucMails.map(item => item.cid);
        mailDraftApi.deleteDraftMailByCid(sucCids as number[]);
      });
      // 全部保存成功
      if (failMails.length === 0) {
        // @ts-ignore
        message.success({
          content: getIn18Text('BAOCUNCAOGAOXIANG'),
        });
        onSave();
        return;
      }
      // 部分/全部保存失败
      // 传入了关闭写信数目
      if (closeWriteNum) {
        if (closeWriteNum === 1) {
          // @ts-ignore
          message.fail({
            content: `草稿保存失败，页签无法关闭`,
          });
        } else {
          // @ts-ignore
          message.fail({
            content: `${failMails.length}封邮件保存失败，对应页签无法关闭`,
          });
        }
      } else {
        // 未传入
        // @ts-ignore
        message.fail({
          content: `草稿保存失败，页签无法关闭`,
        });
      }
      onSave(failMails.map(item => item.cid));
    });
    setAttachmentShow(false);
  };
  const saveTemp = () => {
    track(getIn18Text('BAOCUN'));
    setIsModalVisible(false);
    // eslint-disable-next-line max-len
    const someAttachmentUploading = needSaveMails.some(mail =>
      attachments.some(attachment => attachment.mailId === mail.cid && attachment.status && attachment.status !== 'success' && attachment.type !== 'download')
    );
    if (someAttachmentUploading) {
      setAttachmentShow(true);
      return;
    }
    comfirmSaveTemp();
    closeModel();
  };
  const notSave = () => {
    track(getIn18Text('BUBAOCUN'));
    setIsModalVisible(false);
    onNotSave();
    closeModel();
  };
  const closeModel = () => {
    // 写信页的签名、模板、云附件的弹窗默认关闭
    dispatch(AppActions.changeShowTemplateList({ isShow: false }));
    dispatch(AppActions.changeShowAddTemplatePop({ isShow: false }));
    selectSignModal.hide();
    signEditModal.hide(true);
    dispatch(AppActions.doToggleDiskModal(false));
  };
  const track = options => {
    trackApi.track('pcMail_click_options_saveDraftPage', { options });
  };
  return (
    <>
      <Modal
        wrapClassName="modal-dialog"
        maskStyle={maskStyle}
        getContainer={() => document.body}
        onCancel={() => {
          setIsModalVisible(false);
        }}
        visible={isModalVisible}
        footer={null}
        closeIcon={<ModalCloseSmall />}
      >
        <div className="modal-content">
          <div className="modal-icon">
            <WarnIcon />
          </div>
          <div className="modal-text">
            <div className="title">
              {needSaveMails.length > 1
                ? `${getIn18Text('ZHENGZAIXIEXINZHONG')}
                ${needSaveMails.length}
                ${getIn18Text('FENGBAOCUN')}`
                : `${getIn18Text('ZHENGZAIXIEXIN')}`}
            </div>
            <div className="desc">{scheduleDate ? getIn18Text('BAOCUNWEICAOGAO') : getIn18Text('BUBAOCUNJIANGDIU')}</div>
            <div className="btns confirm-btns">
              <div>
                <Button className="cancel" onClick={() => notSave()}>
                  {getIn18Text('BUBAOCUN')}
                </Button>
                <Button className="save-draft" type="primary" onClick={() => saveTemp()}>
                  {getIn18Text('BAOCUN')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      <AttachmentBlockModal
        visible={attachmentShow}
        closeModal={() => {
          setAttachmentShow(false);
        }}
        confirm={() => {
          comfirmSaveTemp();
        }}
      />
    </>
  );
};
export default NeedTempDialog;
