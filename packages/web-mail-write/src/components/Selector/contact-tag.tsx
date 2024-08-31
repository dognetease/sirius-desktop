import React, { useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, Input, Menu, Tag, message } from 'antd';
import { apiHolder, apis, ContactApi, MailApi, MailBoxEntryContactInfoModel, MemberType } from 'api';
import { ContactActions, MailActions, MailTemplateActions, TempContactActions, useActions, useAppSelector } from '@web-common/state/createStore';
import ContactChip from './contact-chip';
import { CustomTagProps } from '../RcSelect/src/interface/generator';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { extractEmailsFromText, getCopiedContact, getCopiedContacts } from './helper';
import { ContactPosType } from './type';
import { WriteContext } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';
import { buildContactItem, ContactItem, transContactItem2MailContactModel, transMailContactModel2ContactItem } from '@web-common/utils/contact_util';
import { getContactItemKey } from '@web-common/components/util/contact';
import { doGetMailContactModelByContactItem } from '@web-common/state/selector/contact';
import { copyText, paste, isSupportPaste } from '@web-common/components/UI/ContextMenu/util';
import { getIn18Text } from 'api';

export type IContactTagProps = {
  type: MemberType;
  // 当前的输入框的 receivers
  items?: MailBoxEntryContactInfoModel[];
  setLastItemPos: React.Dispatch<[number, number]>;
  label: any;
  value: string;
  focus: boolean;
  refSelect: React.RefObject<any>;
  setContactCardVisible: React.Dispatch<boolean>;
  clickShowContactCard: (contactPos: ContactPosType, contactInfo: ContactItem) => void;
} & CustomTagProps;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;

const ContactTag: React.FC<IContactTagProps> = props => {
  const { value, label, onClose, type, items = [], setInputOrder, refSelect, focus, setContactCardVisible, clickShowContactCard, setLastItemPos } = props;
  const { isMailTemplate } = useContext(WriteContext);
  const item: ContactItem = label?.props?.item;
  const [inputValue, setInputValue] = useState<string>('');
  const [inputWidth, setInputWidth] = useState<number>(40);
  const [editing, setEditing] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const selectedEmails = useAppSelector(state => (isMailTemplate ? state.tempContactReducer.selectedTags.emails : state.contactReducer.selectedTags.emails));
  const receivers = useAppSelector(state => (isMailTemplate ? state.mailTemplateReducer?.mailTemplateContent?.receiver : state.mailReducer?.currentMail?.receiver));

  const onActions = isMailTemplate ? MailTemplateActions : MailActions;
  const { doModifyReceiver } = useActions(onActions);

  const onContactActions = isMailTemplate ? TempContactActions : ContactActions;
  const { doSelectTags } = useActions(onContactActions);

  const inContactBook = item.type !== 'external';
  const contactName = item.name || '';
  const accountEmail = item.email;
  const email = inContactBook ? `${contactName}<${accountEmail}>` : accountEmail;

  /** 动态获取编辑input宽度 */
  useLayoutEffect(() => {
    setInputWidth((measureRef?.current?.offsetWidth || 40) + 10);
  }, [inputValue]);

  const selectedItems = useMemo(() => {
    const list = items || [];
    const selectedItemsMap = new Map<string, ContactItem>();
    list.forEach(item => {
      const contactItem = transMailContactModel2ContactItem(item);
      const contactKey = getContactItemKey(contactItem);
      selectedItemsMap.set(contactKey, contactItem);
    });
    return selectedItemsMap;
  }, [items]);

  const isMultiSelect = selectedEmails.length > 0;

  /** 双击编辑tag */
  const onDblClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setInputValue(email);
    setTimeout(() => {
      (inputRef?.current as any)?.focus();
      setInputValue(email);
    }, 50);
  };

  /** 编辑 tag */
  const handleModifyTag = async () => {
    let _inputValue = inputValue?.split(/<|>/)?.filter(item => item.includes('@'))[0] || '';
    _inputValue = _inputValue.trim();
    if (_inputValue === accountEmail) {
      setEditing(false);
      return;
    }
    const reply = selectedItems.has(_inputValue);
    // const index = items?.findIndex(elem => equalModel(elem, item));
    /** 改名重复了或者名称为空直接删掉 */
    if (_inputValue === '' || reply) {
      selectedItems.delete(accountEmail);
    } else {
      const result = await mailApi.getContractItemByEmail([_inputValue], 'to');
      let curContactItem: ContactItem;
      if (result?.length) {
        curContactItem = result.map(transMailContactModel2ContactItem)[0];
      } else {
        curContactItem = buildContactItem({ email: _inputValue, name: _inputValue, type, item: _inputValue });
      }
      selectedItems.set(accountEmail, curContactItem);
    }
    const list = [...selectedItems.values()];
    const receiver = await doGetMailContactModelByContactItem(list, type);
    doModifyReceiver({
      receiver,
      receiverType: type,
    });
    setEditing(false);
  };

  const onMultiTagDel = () => {
    doModifyReceiver({ receiver: selectedEmails, receiverType: type, operation: 'delete' });
    doSelectTags({ emails: [], type });
  };

  const onTagCopy = async () => {
    if (!(await isSupportPaste())) {
      SiriusModal.error({
        content: '浏览器版本过低，不支持联系人的复制/剪切，请升级到新版chrome浏览器使用',
        okText: getIn18Text('ZHIDAOLE'),
        hideCancel: true,
      });
      return true;
    }
    const copiedContacts = getCopiedContacts(receivers, type, selectedEmails);
    const data = isMultiSelect ? copiedContacts : getCopiedContact(item);
    copyText(data);
  };

  const onTagDelete = isMultiSelect ? onMultiTagDel : (onClose as any);

  const onTagCut = async () => {
    if (await onTagCopy()) return;
    onTagDelete();
  };

  const onTagPaste = async () => {
    if (!(await isSupportPaste())) {
      SiriusModal.error({
        content: '您的浏览器版本过低，请使用键盘快捷键（Ctrl+V）。或升级到新版chrome浏览器使用',
        okText: getIn18Text('ZHIDAOLE'),
        hideCancel: true,
      });
      return;
    }
    const clipboardData = await paste(false);
    if (!clipboardData) return;
    const extractEmails = extractEmailsFromText(clipboardData);

    const result = await contactApi.doGetContactByEmails(extractEmails, type);
    // 粘贴数据
    const target = result.map(transMailContactModel2ContactItem);
    const contactItemList = receivers.filter(_ => _.mailMemberType === type).map(transMailContactModel2ContactItem) as ContactItem[];
    const index = contactItemList.findIndex(c => selectedEmails.includes(c.email));
    if (index !== -1) {
      contactItemList.splice(index, 1, ...target);
    }
    const receiver = await doGetMailContactModelByContactItem(contactItemList, type);
    // 去掉删除，直接全量覆盖
    // onTagDelete();
    doModifyReceiver({
      receiver,
      receiverType: type,
      // operation: 'paste'
    });
  };

  const onContextMenu = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    doSelectTags({
      emails: [accountEmail],
      type,
    });
  };

  const contextMenu = (
    <Menu>
      <Menu.Item onClick={onTagCopy}>{getIn18Text('FUZHI')}</Menu.Item>
      <Menu.Item onClick={onTagCut}>{getIn18Text('JIANQIE')}</Menu.Item>
      <Menu.Item onClick={onTagPaste}>{getIn18Text('ZHANTIE')}</Menu.Item>
    </Menu>
  );

  return (
    <div onContextMenu={onContextMenu}>
      <Dropdown overlay={contextMenu} trigger={['contextMenu']}>
        <Tag onClose={onClose} onClick={e => e.stopPropagation()}>
          <div hidden={!editing} style={{ width: inputWidth + 40 }}>
            <Input
              size="small"
              style={{ boxShadow: 'none', border: '1px solid transparent' }}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onBlur={handleModifyTag}
              // pressenter 会触发 onblur
              onPressEnter={() => inputRef?.current?.blur()}
              ref={inputRef as any}
              // 光标不能点击问题
              onMouseDown={e => e.stopPropagation()}
              // 全选拦截问题
              onKeyDown={e => e.stopPropagation()}
            />
            <span style={{ visibility: 'hidden' }} ref={measureRef} aria-hidden>
              {inputValue}
              &nbsp;
            </span>
          </div>

          {!editing && (
            <ContactChip
              onDoubleClick={onDblClick}
              type={type}
              value={value}
              item={item}
              items={items}
              setInputOrder={setInputOrder}
              setLastItemPos={setLastItemPos}
              focus={focus}
              setContactCardVisible={setContactCardVisible}
              clickShowContactCard={clickShowContactCard}
              refSelect={refSelect}
            />
          )}
        </Tag>
      </Dropdown>
    </div>
  );
};
export default ContactTag;
