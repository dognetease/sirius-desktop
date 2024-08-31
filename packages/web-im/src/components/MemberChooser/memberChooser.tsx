import React, { useState, useEffect, useImperativeHandle, useCallback } from 'react';
import { ContactModel, ContactInfoType, apiHolder, apis, ContactAndOrgApi } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { TeamContactModel } from '../TeamSetting/teamSetting';
import { showDialog } from '@web-common/utils/utils';
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseSvg';
import Contact from '../Contact/contact';
import ContactIMModal from '@web-common/components/UI/SiriusContact/IMModal';
import styles from './memberChooser.module.scss';
import { transContactModel2ContactItem } from '@web-common/components/util/contact';
import { ContactItem } from '@web-common/utils/contact_util';
import lodashGet from 'lodash/get';
import { getIn18Text } from 'api';

const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

const MEMBER_LIMIT = 500;
export interface ChosenMemberItemProps {
  member: ContactModel; // 成员
  removeMember: (member: ContactModel) => boolean; // 移除该成员
}
export const ChosenMemberItem: React.FC<ChosenMemberItemProps> = props => {
  const { member, removeMember } = props;
  const {
    contact: { contactLabel, color, contactName },
  } = member;
  return (
    <div className={styles.chosenMemberItem}>
      <div className={styles.avatar} style={{ background: color }}>
        {contactName.slice(0, 1) || contactLabel}
      </div>
      <div className={styles.memberName}>{contactName}</div>
      <div className={styles.removeBtn} onClick={() => removeMember && removeMember(member)}>
        <CloseIcon />
      </div>
    </div>
  );
};
interface MemberChooserRefProps {
  getChosenMembers: () => ContactModel[];
}
export interface MemberChooserProps {
  disabledMembers?: ContactModel[]; // 不能选择/取消的成员
  setChosenMembers?: (members: ContactModel[]) => void; // 设置已选成员
  limit?: number; // 限制可选人数
  limitTitle?: string; // 超出限制人数后的弹窗提示title
  limitContent?: string; // 超出限制人数后的弹窗提示内容文案
  wrapStyle?: React.CSSProperties; // 包裹div样式
  ref?: React.Ref<MemberChooserRefProps>;
}
const MemberChooser: React.FC<MemberChooserProps> = React.forwardRef((props, ref) => {
  const {
    setChosenMembers,
    disabledMembers,
    wrapStyle,
    limit = MEMBER_LIMIT,
    limitTitle = getIn18Text('QUNZURENSHUCHAO'),
    limitContent = `群组人数上限为${limit}人`,
  } = props;
  const [members, setMembers] = useState<ContactModel[]>([]);
  useImperativeHandle(ref, () => ({
    getChosenMembers: () => members,
  }));
  const curLimit = limit - (disabledMembers?.length || 0);
  const chooseMember = (member: ContactModel): boolean => {
    let checked = false;
    const prevMembers = members.slice();
    const index = prevMembers.findIndex(value => value.contact.id === member.contact.id);
    let curMembers;
    if (index >= 0) {
      checked = false;
      prevMembers.splice(index, 1);
      curMembers = prevMembers;
    } else if (prevMembers.length >= curLimit) {
      checked = false;
      showDialog({ title: limitTitle, content: limitContent });
      curMembers = prevMembers;
    } else {
      checked = true;
      curMembers = [...prevMembers, member];
    }
    // 父组件提供setChosenMembers时传给父组件members
    if (setChosenMembers) {
      setChosenMembers(curMembers);
    }
    setMembers(curMembers);
    return checked;
  };
  return (
    <div className={styles.teamMemberBox} style={wrapStyle}>
      <div className={styles.searchMemberBox}>
        <Contact chooseMember={chooseMember} chosenMembers={members} disabledMembers={disabledMembers} />
      </div>
      <div className={styles.chosenMemberBox}>
        <div className={styles.chosenStatus}>
          {getIn18Text('YIXUAN\uFF1A')}
          {members.length}/{curLimit}
        </div>
        <div className={styles.memberList}>
          {members.map(member => (
            <ChosenMemberItem key={member.contact.id} member={member} removeMember={chooseMember} />
          ))}
        </div>
      </div>
    </div>
  );
});
interface MemberChooserModalProps {
  onOk: (members: TeamContactModel[]) => void;
  onCancel: () => void;
  visible: boolean;
  chosenMembers: Array<ContactModel | ContactItem | null>;
  type?: ContactInfoType;
  title?: string;
  account?: string;
}
export const MemberChooserModal: React.FC<MemberChooserModalProps> = props => {
  const { chosenMembers, account, onOk, onCancel, visible, type = 'yunxin', title = getIn18Text('TIANJIACHENGYUAN') } = props;
  const disableCheckList = chosenMembers.reduce((arr, item) => {
    if (item) {
      if ('contact' in item) {
        arr.push(transContactModel2ContactItem(item));
      } else {
        arr.push(item);
      }
    }
    return arr;
  }, [] as ContactItem[]);
  const [addMemberVisible, setAddMemberVisible] = useState<boolean>(false);
  const [chosenList, setChosenList] = useState<ContactItem[]>([]);
  useEffect(() => {
    setAddMemberVisible(visible);
  }, [visible]);

  const addMember = useCallback(async () => {
    const queryIds: Set<string> = new Set(
      chosenList.map(item => {
        return item.id!;
      })
    );

    if (!queryIds.size) {
      return;
    }

    let fetchModel = await contactApi.doGetContactById([...queryIds.values()]);

    const isMatchAll =
      fetchModel.filter(item => {
        return item.contactInfo.length >= 2;
      }).length >= queryIds.size;

    if (!isMatchAll) {
      fetchModel = await contactApi.doGetContactByQiyeAccountId({
        idList: [...queryIds.values()],
      });
    }

    onOk && onOk(fetchModel);
  }, [chosenList.length, lodashGet(chosenList, '[0].id', '')]);

  return (
    <Modal
      closeIcon={<CloseIcon className="dark-invert" />}
      className={styles.chooserWrap}
      title={title}
      width={600}
      wrapClassName="im-change-owner"
      visible={addMemberVisible}
      onCancel={onCancel}
      onOk={addMember}
      getContainer={() => document.body}
    >
      <ContactIMModal
        disableCheckList={disableCheckList}
        accountRootKey={account}
        useEdm={false}
        onChange={data => {
          setChosenList(data);
        }}
      />
    </Modal>
  );
};
export default MemberChooser;
