import React, { useEffect, useState } from 'react';
import { getIn18Text } from 'api';
import { Popover, Tooltip } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder as api, apis, MailTemplateApi } from 'api';
import { useAppSelector, useActions, MailTemplateActions } from '@web-common/state/createStore';
import WriteContent from '@web-mail-write/WritePage';
import { verifyEmail } from '@web-mail-write/util';
// import { setCurrentAccount } from '@web-mail/util';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import DeleteConfirm from './delete_confirm';
import Preview from './preview';
import { formatTemplateDetail, formatSaveTemplateReq } from './util';
import { ReactComponent as DeleteIcon } from '@/images/icons/modal_close_temp.svg';
import './addmodal.scss';

const templateApi = api.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
// const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
interface context {
  isMailTemplate: boolean;
}
export const WriteContext = React.createContext({} as context);
interface Props {
  templateCategory?: string; // 业务划分，LX: 灵犀业务； EDM: 外贸业务
  maskStyle?: object;
  operateMail?: string; // 当前操作的账号
}
/** 新建邮件模板Modal */
export const TemplateAddModal = (props: Props) => {
  const { templateCategory = 'LX', maskStyle = {}, operateMail = '' } = props;
  const showAddTemplatePop = useAppSelector(state => state.mailTemplateReducer.showAddTemplatePop); // 是否展示”新增模板“弹窗
  const currentMail = useAppSelector(state => state.mailTemplateReducer.mailTemplateContent);
  const mailTemplateName = useAppSelector(state => state.mailTemplateReducer.mailTemplateName);
  const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender);
  const showWriteContact = useAppSelector(state => state.mailTemplateReducer.mailTemplateContent.status?.showContact); // 是否展示联系人栏
  const isModified = useAppSelector(state => state.mailTemplateReducer.isModified); // 模板编辑器正文内容是否被改变过
  const addTemplatePopSource = useAppSelector(state => state.mailTemplateReducer.showAddTemplatePopSource); // ”新增模板“弹窗打开的入口
  const isClosePreviewModal = useAppSelector(state => state.mailTemplateReducer.isClosePreviewModal); // 关闭预览弹窗
  const { changeShowAddTemplatePop, doMailTemplateInit, doClosePreviewModal } = useActions(MailTemplateActions);
  const [showConfirm, setShowConfirm] = useState<boolean>(false); // 是否展示关闭时候的二次确认弹窗
  const [btnDisable, setBtnDisable] = useState<boolean>(true); // 预览、保存 按钮显隐
  const [saveBtnTxt, setSaveBtnTxt] = useState<string>(getIn18Text('BAOCUNMOBAN'));
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  useEffect(() => {
    if (showAddTemplatePop) {
      if (JSON.stringify(currentMail) === '{}') {
        doMailTemplateInit();
      }
    }
  }, [showAddTemplatePop]);
  useEffect(() => {
    if (templateCategory === 'LX-WAIMAO') {
      // 外贸逻辑 名称和主题必填 其他非必填
      if (mailTemplateName && currentMail.entry.title) {
        setBtnDisable(false);
      } else {
        setBtnDisable(true);
      }
      return;
    }
    if (mailTemplateName && (isModified || (currentMail && currentMail.receiver && currentMail.receiver.length > 0) || currentMail.entry.title)) {
      setBtnDisable(false);
    } else {
      setBtnDisable(true);
    }
  }, [isModified, mailTemplateName, currentMail]);
  useEffect(() => {
    if (isClosePreviewModal) {
      setShowPreviewModal(false);
      doClosePreviewModal(false);
    }
  });
  // 保存模板
  const doSaveMailTemplate = () => {
    if (btnDisable) {
      return;
    }
    const { receiver } = currentMail;
    const receiverError = receiver?.filter(item => !verifyEmail(item?.contactItem?.contactItemVal?.trim() || ''));
    if (receiverError?.length) {
      const msg = receiverError.length === 1 ? getIn18Text('YOUXIANGDEZHICUO') : getIn18Text('CUNZAICUOWUDE');
      // @ts-ignore
      message.error({
        content: msg,
      });
      return;
    }
    setSaveBtnTxt(getIn18Text('BAOCUNZHONG..'));
    const params = formatSaveTemplateReq(currentMail, mailTemplateName, templateCategory);
    // setCurrentAccount(operateMail);
    // curAccount && accountApi.setCurrentAccount({ email: curAccount.mailEmail });
    const _account = curAccount ? curAccount.mailEmail : operateMail;
    templateApi.doSaveMailTemplate(params, _account).then(res => {
      if (res.success) {
        message.success({
          content: addTemplatePopSource === 'list' ? getIn18Text('BAOCUNCHENGGONG') : getIn18Text('BAOCUNCHENGGONG\uFF0C'),
        });
        changeShowAddTemplatePop({ isShow: false });
        doMailTemplateInit();
      } else {
        message.error({
          content: res.message || getIn18Text('BAOCUNCUOWU\uFF0C'),
        });
      }
      setSaveBtnTxt(getIn18Text('BAOCUNMOBAN'));
    });
  };
  const handleDeleteConfirm = () => {
    setShowConfirm(false);
    changeShowAddTemplatePop({ isShow: false });
    doMailTemplateInit();
  };
  const tempDiff = () => {
    if (isModified) {
      return Promise.resolve(true);
    }
    if (!currentMail.id) {
      if (currentMail.entry.title || mailTemplateName) {
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    }
    // 联系人是否变更
    const receiverChange = (originData: any) => {
      if (currentMail.receiver.length !== originData.to.length + originData.cc.length + originData.bcc.length) {
        return true;
      }
      for (let i = 0; i < currentMail.receiver.length; i++) {
        const onReceiverValue = currentMail.receiver[i].contactItem.contactItemVal;
        const onReceiverType = currentMail.receiver[i].mailMemberType;
        if (originData[onReceiverType].indexOf(onReceiverValue) === -1) {
          return true;
        }
      }
      return false;
    };
    // setCurrentAccount(operateMail);
    // curAccount && accountApi.setCurrentAccount({ email: curAccount.mailEmail });
    const _account = curAccount ? curAccount.mailEmail : operateMail;
    return templateApi.doGetMailTemplateDetail({ templateId: currentMail.id }, _account).then(async res => {
      if (res.success && res.data) {
        // currentMail.receiver.length
        if (mailTemplateName !== res.data.templateName || currentMail.entry.title !== res.data.subject || receiverChange(res.data)) {
          return true;
        }
        return false;
      }
      return true;
    });
  };
  // 关闭弹窗
  const closeModal = async () => {
    const isChange = await tempDiff();
    if (isChange) {
      // 二次确认弹窗
      setShowConfirm(true);
    } else {
      // 直接关闭新增模板弹窗
      handleDeleteConfirm();
    }
  };
  return (
    // eslint-disable-next-line max-len
    <Modal
      closeIcon={<DeleteIcon className="dark-invert" />}
      visible={showAddTemplatePop}
      maskStyle={maskStyle}
      footer={null}
      title={currentMail.id ? getIn18Text('BIANJIGERENMO') : getIn18Text('XINJIANGERENMO')}
      width={showWriteContact ? '962px' : '742px'}
      className="mail-template-add-modal"
      onCancel={closeModal}
      destroyOnClose
      maskClosable={false}
    >
      <div className="write">
        <WriteContext.Provider value={{ isMailTemplate: true }}>
          <WriteContent cond="addTemplate" />
        </WriteContext.Provider>
      </div>
      <div className="add-footer-btn">
        <button type="button" onClick={closeModal}>
          {getIn18Text('QUXIAO')}
        </button>
        {/* eslint-disable-next-line max-len */}
        <Popover
          visible={showPreviewModal}
          onVisibleChange={visible => {
            setShowPreviewModal(visible);
          }}
          placement="topRight"
          content={btnDisable ? '' : <Preview defaultTemplateData={formatTemplateDetail(currentMail)} />}
          trigger="click"
        >
          <button type="button" className={btnDisable ? 'btn-disable' : ''}>
            {getIn18Text('YULAN')}
          </button>
        </Popover>
        <Tooltip title={btnDisable ? '请添加模板名称' : ''}>
          <button type="button" className={btnDisable ? 'btn-disable primary' : 'primary'} onClick={doSaveMailTemplate}>
            {saveBtnTxt}
          </button>
        </Tooltip>
      </div>
      <DeleteConfirm showConfirm={showConfirm} setShowConfirm={setShowConfirm} handleConfirm={handleDeleteConfirm} />
    </Modal>
  );
};
