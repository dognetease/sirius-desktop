import React, { useEffect, useState, useContext } from 'react';
import { Checkbox, Form, Select, Input } from 'antd';
import classnames from 'classnames';
import { apiHolder as api, apis, DataTrackerApi, MailApi, MedalInfo, ContactModel, ContactAndOrgApi } from 'api';
import { MailActions, useActions, useAppSelector, TempContactActions, ContactActions } from '@web-common/state/createStore';
import { MemberChooserModal } from '@web-im/components/MemberChooser/memberChooser';
import { WriteContext } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';
import IconCard from '@web-common/components/UI/IconCard';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { PraiseMailType } from '@web-common/state/state';
import MedalChooser from './MedalChooser';
import ContactChip from './ContactChip';
import styles from '../mailInfo.module.scss';
import { getIn18Text } from 'api';
interface Props {
  deletePraiseMail: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}
const { TextArea } = Input;
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const PraiseMailSetting: React.FC<Props> = ({ deletePraiseMail }) => {
  const mailActions = useActions(MailActions);
  const praiseMail = useAppSelector(state => state.mailReducer.currentMail.praiseMail);
  const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender);
  const [addToReceiver, setAddToReceiver] = useState(true);
  const [addMemberVisible, setAddMemberVisible] = useState(false);
  const [medalChooserVisible, setMedalChooserVisible] = useState(false);
  const [chosenMedal, setChosenMedal] = useState<number>(); // medal id
  const [selectedItems, setSelectedItems] = useState<ContactModel[]>([]);
  const [form] = Form.useForm<PraiseMailType>();
  const { isMailTemplate } = useContext(WriteContext);
  const onContactActions = isMailTemplate ? TempContactActions : ContactActions;
  const { doAddItemToSelector, doFocusSelector } = useActions(onContactActions);
  const asyncRecordPraiseMailData = () => {
    setTimeout(() => {
      console.log('form.getFieldsValue(true)', form.getFieldsValue(true));
      mailActions.doPraiseMailChange(form.getFieldsValue(true));
    }, 0);
  };
  const formChange = () => {
    asyncRecordPraiseMailData();
  };
  const onCheckChange = e => {
    const checked = e.target.checked;
    setAddToReceiver(checked);
    trackApi.track(`pcMail_click_writeMail_addPraiseLetterPage_${checked ? 'select' : 'cancel'}AutoAdd`);
    if (checked) {
      doFocusSelector('to');
      doAddItemToSelector({
        add: true,
        pendingItem: selectedItems,
      });
    }
  };
  const addMedal = () => {
    trackApi.track('pcMail_click_writeMail_addPraiseLetterPage_selectMedal');
    setMedalChooserVisible(true);
  };
  const closeMedalChooser = () => {
    setMedalChooserVisible(false);
  };
  const chooseMedal = (medalId: number) => {
    setChosenMedal(medalId);
    closeMedalChooser();
  };
  const closeMemberChooser = () => {
    setAddMemberVisible(false);
  };
  const openMemberChooser = async () => {
    trackApi.track('pcMail_click_writeMail_addPraiseLetter_addMember');
    setAddMemberVisible(true);
  };
  const changeWinners = (winners: ContactModel[]) => {
    setSelectedItems(winners);
    form.setFieldsValue({
      winners,
    });
    asyncRecordPraiseMailData();
  };
  const addMembers = (newMembers: ContactModel[]) => {
    let formatWinners = (items: ContactModel[]) => {
      let map = new Map<string, ContactModel>();
      for (let item of items) {
        if (!map.has(item.contact.id)) {
          map.set(item.contact.id, item);
        }
      }
      return [...map.values()];
    };
    const winners = formatWinners(selectedItems.concat(newMembers));
    if (winners.length <= 500) {
      if (addToReceiver) {
        doFocusSelector('to');
        doAddItemToSelector({
          add: true,
          pendingItem: newMembers,
        });
      }
      changeWinners(winners);
      closeMemberChooser();
    } else {
      Message.warn({
        content: getIn18Text('BIAOYANGDUIXIANGZUI'),
      });
    }
  };
  const tagRender = (tagProps: any) => {
    const { value, onClose } = tagProps;
    const item = selectedItems.find(cur => contactApi.findContactInfoVal(cur.contactInfo) === value);
    if (!item) {
      return <div />;
    }
    const onTagClose = () => {
      onClose();
      changeWinners(selectedItems.filter(cur => contactApi.findContactInfoVal(cur.contactInfo) !== value));
    };
    return <ContactChip value={item.contact.accountName} onClose={onTagClose} item={item} />;
  };
  useEffect(() => {
    form.setFieldsValue({
      medalId: chosenMedal,
    });
    asyncRecordPraiseMailData();
  }, [chosenMedal]);
  useEffect(() => {
    if (praiseMail) {
      setChosenMedal(praiseMail.medalId);
      setSelectedItems(praiseMail.winners || []);
      form.setFieldsValue(praiseMail);
    }
  }, [praiseMail]);
  // const allMedals = mailApi.doGetPraiseMedals();
  const [allMedals, setMedals] = useState<any[]>([]);
  useEffect(() => {
    mailApi.doGetPraiseMedals().then(setMedals);
  }, []);
  const curMedal: MedalInfo = allMedals.find(item => item.id === chosenMedal);
  console.log('form.getFieldsValue(true)', curMedal);
  return (
    <div className={styles.praiseMailForm}>
      <Form<PraiseMailType> form={form} onValuesChange={formChange}>
        <div className={classnames([styles.infoItem])}>
          <span className={styles.infoLabel}>{getIn18Text('BIAOYANGDUIXIANG')}</span>
          <span className={styles.colonLabel}>:</span>
          <div className={classnames([styles.btnBox, styles.closeBtn])}>
            <span className={classnames([styles.labelBtn, styles.labelCloseBtn])} onClick={deletePraiseMail}>
              <IconCard className="dark-invert" type="close" />
            </span>
          </div>
          <div className={classnames(styles.memberBox)}>
            <div className={classnames('ant-allow-dark', styles.memberList)}>
              <Select
                mode="tags"
                open={false}
                bordered={false}
                value={selectedItems?.map(item => contactApi.findContactInfoVal(item.contactInfo, 'EMAIL')) || []}
                tagRender={tagRender}
              />
              <div className={classnames(styles.addMemberBtn)} onClick={openMemberChooser}>
                {getIn18Text('QIYECHENGYUAN')}
              </div>
            </div>
            <div className={classnames('ant-allow-dark', styles.checkBox)}>
              <Checkbox onChange={onCheckChange} checked={addToReceiver}>
                {getIn18Text('JIANGBIAOYANGDUIXIANG')}
              </Checkbox>
            </div>
          </div>
        </div>
        <div className={classnames([styles.infoItem])}>
          <span className={styles.infoLabel}>{getIn18Text('BANFAXUNZHANG')}</span>
          <span className={styles.colonLabel}>:</span>
          <div className={classnames(styles.conferenceTime)}>
            {curMedal ? (
              <div className={classnames(styles.medalWrapper)} onClick={addMedal}>
                <div className={classnames(styles.medalMask)}>
                  <div className={classnames(styles.changeIcon)} />
                </div>
                <img className={classnames(styles.medalImg)} alt={curMedal.name} src={curMedal.imageUrl} />
              </div>
            ) : (
              <div className={classnames(styles.addMedalBtn)} onClick={addMedal} />
            )}
          </div>
        </div>
        <div className={classnames([styles.infoItem, styles.infoItemWithoutLine])}>
          <span className={styles.infoLabel}>{getIn18Text('BANJIANGCI')}</span>
          <span className={styles.colonLabel}>:</span>
          <div className={classnames('ant-allow-dark', styles.conferenceTime)}>
            <div className={styles.inputWrapper}>
              {/* 颁奖词 */}
              <Form.Item label="" shouldUpdate>
                {({ getFieldValue }) => {
                  const presentationWords = getFieldValue('presentationWords');
                  return (
                    <Form.Item noStyle name="presentationWords">
                      <TextArea placeholder={getIn18Text('SHURU300')} value={presentationWords} showCount maxLength={300} autoSize={{ minRows: 1, maxRows: 3 }} />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </div>
          </div>
        </div>
        <div className={classnames([styles.infoItem, styles.infoItemWithoutLine])}>
          <span className={styles.infoLabel}>{getIn18Text('BANJIANGREN')}</span>
          <span className={styles.colonLabel}>:</span>
          <div className={classnames('ant-allow-dark', styles.conferenceTime)}>
            <div className={styles.inputWrapper}>
              {/* 颁奖词 */}
              <Form.Item label="" shouldUpdate>
                {({ getFieldValue }) => {
                  const presenter = getFieldValue('presenter');
                  return (
                    <Form.Item noStyle name="presenter">
                      <Input placeholder={getIn18Text('SHURUBANJIANGREN')} maxLength={20} style={{ width: '100%' }} value={presenter} />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </div>
          </div>
        </div>
      </Form>
      <MemberChooserModal
        visible={addMemberVisible}
        type="EMAIL"
        title={getIn18Text('TIANJIABIAOYANGDUI')}
        chosenMembers={selectedItems}
        account={curAccount?.mailEmail}
        onOk={addMembers}
        onCancel={closeMemberChooser}
      />
      <MedalChooser visible={medalChooserVisible} chosenMedal={curMedal} chooseMedal={chooseMedal} onCancel={closeMedalChooser} />
    </div>
  );
};
export default PraiseMailSetting;
