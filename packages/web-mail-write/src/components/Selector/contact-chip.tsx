import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { Tooltip } from 'antd';
import { apiHolder as api, MailBoxEntryContactInfoModel, ContactModel, MemberType, getIn18Text } from 'api';
import classnames from 'classnames';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { ContactActions, MailActions, MailTemplateActions, TempContactActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { WriteContext } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';
import IconCard from '@web-common/components/UI/IconCard';
import { verifyEmail } from '../../util';
import { ContactPosType } from './type';
import styles from './selector.module.scss';
import { useContactModel } from '@web-common/hooks/useContactModel';
import { ContactItem, emailRoleToText, transMailContactModel2ContactItem } from '@web-common/utils/contact_util';
import { doGetMailContactModelByContactItem } from '@web-common/state/selector/contact';
import { transContactModel2ContactItem } from '@web-common/components/util/contact';

export interface IContactChipProps {
  value: string;
  item: MailBoxEntryContactInfoModel | ContactItem;
  type: MemberType;
  items: MailBoxEntryContactInfoModel[];
  focus: boolean;
  setInputOrder: (value: number) => void;
  setLastItemPos: React.Dispatch<[number, number]>;
  refSelect: React.RefObject<any>;
  onDoubleClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  setContactCardVisible: React.Dispatch<boolean>;
  clickShowContactCard: (contactPos: ContactPosType, contactInfo: ContactItem) => void;
}

const ContactChip: React.FC<IContactChipProps> = props => {
  const { value, item, items, type, onDoubleClick, setInputOrder, refSelect, focus, setContactCardVisible, clickShowContactCard, setLastItemPos } = props;
  const { isMailTemplate } = useContext(WriteContext);
  const contactItem = useMemo(() => ('email' in item ? item : transMailContactModel2ContactItem(item as MailBoxEntryContactInfoModel)), [item]);
  const email = contactItem.email || value;
  const contactModel = useContactModel({ email, contactId: contactItem.id, useCompositeQuery: contactItem?.type === 'personal' });
  const { type: selectType, emails } = useAppSelector(state => (isMailTemplate ? state.tempContactReducer.selectedTags : state.contactReducer.selectedTags));
  const selectedMails = useAppSelector(state => (isMailTemplate ? state.tempContactReducer.selectedTags.emails : state.contactReducer.selectedTags.emails));
  // eslint-disable-next-line max-len
  const currentContacts =
    useAppSelector(state =>
      isMailTemplate
        ? state.mailTemplateReducer?.mailTemplateContent?.receiver?.filter(_ => _.mailMemberType === type)
        : state.mailReducer.currentMail?.receiver?.filter(_ => _.mailMemberType === type)
    ) || [];
  const onContactActions = isMailTemplate ? TempContactActions : ContactActions;
  const { doSelectTags } = useActions(onContactActions);

  const onActions = isMailTemplate ? MailTemplateActions : MailActions;
  const { doModifyReceiver } = useActions(onActions);

  const isChosen = emails.includes(email) && type === selectType;

  const truncateValue = email?.length > 20 ? `${email.slice(0, 18)}...` : email;
  const correctEmail = verifyEmail(email?.trim());

  const contactItemList: ContactItem[] = useMemo(() => currentContacts.map(transMailContactModel2ContactItem), [currentContacts]);
  const draggedData: ContactItem[] = useMemo(() => contactItemList.filter(contactItem => selectedMails.includes(contactItem.email)), [contactItemList]);

  const tagRef = useRef<any>(null);
  const searchElRef = useRef<any>(null);

  const dragStart = useCallback(
    (e: React.DragEvent) => {
      let targetIsSelected = false;
      // 拖拽时关闭联系人卡片
      setContactCardVisible(false);
      const target = e.currentTarget;
      const targetMail = target?.getAttribute('data-email');
      const targetType = target?.getAttribute('data-type');
      targetIsSelected = draggedData.some(item => item.email === targetMail && targetType === type);
      const parent = document.querySelector('#drag-active-tags');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
      }
      // 如果有选中项 但是拖拽的可能不是选中项
      if (targetIsSelected) {
        const nodes = document.querySelectorAll('.ant-select-selector div[data-selected="true"]');
        nodes.forEach((node, index) => {
          if (index > 3) return;
          if (index === 3) {
            parent && parent.append('...');
            return;
          }
          const clonedNode = node.cloneNode(true);
          (clonedNode as HTMLDivElement).style.marginRight = '10px';
          parent && parent.appendChild(clonedNode);
        });
        e.dataTransfer?.setData('label', JSON.stringify(draggedData));
      } else {
        // 直接拖拽某一个
        const nodes = document.querySelectorAll('.ant-select-selector');
        Array.from(nodes)?.forEach(tag => {
          tag.classList.add('single-draging-outer');
        });
        // 为自己本身添加类
        target.classList.add('single-draging');
        const clonedNode = target?.cloneNode(true);
        parent && parent.appendChild(clonedNode);
        e.dataTransfer?.setData('label', JSON.stringify([item]));
      }
      if (parent) {
        e.dataTransfer?.setDragImage(parent, 10, 10);
      }
      e.dataTransfer?.setData('text/plain', 'need'); // 必须要这个 不然通栏模式和web端无法拖动  原因未知
      e.dataTransfer?.setData('type', type);
    },
    [draggedData, type, setContactCardVisible]
  );

  useEffect(() => {
    if (!focus && searchElRef.current) {
      searchElRef.current.classList.remove('focused');
    }
  }, [focus]);

  useEffect(() => {
    const index = items?.findIndex(elem => transMailContactModel2ContactItem(elem)?.email === contactItem.email);
    if (items && index === items.length - 1) {
      const elRect = tagRef?.current?.getBoundingClientRect();
      elRect && setLastItemPos([elRect.top, elRect.right]);
    }
  }, [contactItem, items]);

  const dragEnd = useCallback(() => {
    const parent = document.querySelector('#drag-active-tags');
    const nodes = document.querySelectorAll('.contact-tag-drop-item');
    Array.from(nodes)?.forEach(tag => {
      if (tag?.classList?.contains(styles.capDropEffect)) {
        tag?.classList?.remove(styles.capDropEffect);
      }
      if (tag?.classList.contains('single-draging')) {
        tag?.classList?.remove('single-draging');
      }
    });
    const outerDom = document.querySelectorAll('.ant-select-selector.single-draging-outer');
    Array.from(outerDom)?.forEach(tag => {
      tag?.classList?.remove('single-draging-outer');
    });
    if (parent) parent.innerHTML = '';
  }, []);

  /**
   *
   * @param e 收件人行内拖拽排序
   * @returns
   */
  const handleSort = async (e: any) => {
    try {
      // const fromType = e?.dataTransfer?.getData('type');
      // if (fromType !== type) return;
      const draggingData = e?.dataTransfer?.getData('label');
      const _draggingData = JSON.parse(draggingData);
      const targetEle = e.target;
      const first_draggingData: ContactItem = _draggingData[0];
      // const last_draggingData = _draggingData.at(-1);
      /**
       * 1.移除选中item
       * 2.插入dropArea前面的位置
       */
      const targetIndex = contactItemList?.findIndex(c => c.email === email);
      const first_draggingData_index = contactItemList?.findIndex(c => c.email === first_draggingData.email);
      // const last_draggingData_index = currentContacts?.findIndex(c => c?.contactItem?.contactItemVal === last_draggingData?.contactItem?.contactItemVal);
      let deleted: ContactItem[] = [];

      if (selectedMails?.includes(first_draggingData.email)) {
        // 拖拽的是选中状态的胶囊
        deleted = contactItemList?.filter(c => !selectedMails?.includes(c.email));
      } else {
        // 拖动一个非选中状态的胶囊
        deleted = contactItemList?.filter(c => c.email !== first_draggingData.email);
      }

      let indexGap = 1;
      if (targetIndex <= first_draggingData_index) {
        // 拖拽对象 目标位置 的后方
        indexGap = _draggingData.length;
        deleted?.splice(targetIndex, 0, ..._draggingData);
      } else {
        deleted?.splice(targetIndex - _draggingData.length, 0, ..._draggingData);
        indexGap = 0;
      }

      // console.log('dropListener', {
      //   item, selectedMails, fromType, draggedData: _draggingData, currentContacts, deleted, targetIndex, email
      // });
      const receiver = await doGetMailContactModelByContactItem(deleted, type);
      doModifyReceiver({ receiverType: type, receiver });
      // setTimeout(() => {
      //   document.body.style.cursor = 'auto';
      //   refSelect.current.focus()}, 100);
      // setInputOrder(1);
      // input光标调整到所选元素的最后，并且聚焦
      setInputOrder(deleted.length - targetIndex - indexGap);

      setTimeout(() => {
        // drop 里面出发的聚焦不能正常使用 光标闪烁，自己写个假光标放上
        let parent = targetEle;
        while (parent && !parent.classList.contains('ant-select-selector') && parent.tagName !== 'BODY') {
          parent = parent.parentElement;
        }
        if (!parent) return;
        let searchEl = parent.querySelectorAll('.ant-select-selection-search');
        if (searchEl && searchEl[0]) {
          searchElRef.current = searchEl[0];
          searchEl[0].classList.add('focused');
        }
        // 设置选中
        const selectedEmails = _draggingData?.map(d => d.email) || [];
        doSelectTags({ emails: selectedEmails, type });
        // refSelect.current.focus()
      }, 0);
    } catch (error) {
      console.log('dropListenerError', error);
    }
  };

  /**
   * 处理单选、多选、shitft多选、反选
   * 拦截双击编辑tag事件
   * 拦截鼠标右键触发contextMenu事件
   * @param e
   * @returns
   */
  const handleSelectTags = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { metaKey, button, detail, shiftKey, ctrlKey, altKey } = e;
    if (button !== 0) return;
    if (detail === 2) {
      e.preventDefault();
      e.stopPropagation();
      onDoubleClick && onDoubleClick(e);
      return;
    }
    const email = contactModel?.contact.accountName || contactItem.email;
    const isSelectingSameLine = selectType === type;

    if (emails.includes(email)) {
      doSelectTags({
        emails: isSelectingSameLine ? emails.filter(selected => selected !== email) : [email],
        type,
      });
      return;
    }

    if (metaKey || ctrlKey || altKey) {
      doSelectTags({
        emails: isSelectingSameLine ? [...emails, email] : [email],
        type,
      });
      // shift 多选操作
    } else if (shiftKey) {
      if (selectedMails.length === 0) {
        doSelectTags({
          emails: [email],
          type,
        });
        return;
      }
      let selectedEmails: string[] = [];
      const currrentEmails = contactItemList.map(info => info.email);
      const selectIndex = currrentEmails.findIndex(mail => mail === email);

      const selectedEmailsIndex = currrentEmails.map((mail, index) => (selectedMails.includes(mail) ? index : undefined)).filter(mail => mail !== undefined) as number[];

      const maxIndex = Math.max.apply(null, selectedEmailsIndex);
      const minIndex = Math.min.apply(null, selectedEmailsIndex);

      /** 要选的tag在已选tag的左边 */
      if (selectIndex < minIndex) {
        selectedEmails = currrentEmails.filter((mail, index) => index >= selectIndex && index <= maxIndex);
      }

      /** 要选的item在已选tag的右边 */
      if (selectIndex > maxIndex) {
        selectedEmails = currrentEmails.filter((_, index) => index >= minIndex && index <= selectIndex);
      }

      doSelectTags({
        emails: selectedEmails,
        type,
      });
    } else {
      doSelectTags({
        emails: [email],
        type,
      });
    }
  };

  useEffect(() => {
    tagRef?.current?.addEventListener('dragstart', dragStart as unknown as EventListener);
    tagRef?.current?.addEventListener('dragend', dragEnd as unknown as EventListener);

    return () => {
      tagRef?.current?.removeEventListener('dragstart', dragStart as unknown as EventListener);
      tagRef?.current?.removeEventListener('dragend', dragEnd);
    };
  }, [dragStart, dragEnd]);

  const showContactCard = (e: React.MouseEvent) => {
    const clientRects = tagRef.current?.getBoundingClientRect() as DOMRect;
    const { clientWidth } = document.body;
    const { clientHeight } = document.body;
    const pos = {
      top: clientRects.top,
      left: clientRects.left,
      bottom: clientHeight - clientRects.bottom,
      right: clientWidth - clientRects.right,
    };
    clickShowContactCard(pos, contactItem);
    e.stopPropagation();
  };

  let children;
  // 错误邮箱地址
  if (!correctEmail) {
    children = (
      <div
        className={classnames(styles.capsuleTag, {
          [styles.capsuleTagWrong]: true,
          'tag-chosen': isChosen,
          'contact-tag': true,
        })}
      >
        <span className={classnames([styles.charAvatar, styles.charAvatarWrong])}>!</span>
        <span className={classnames([styles.label, styles.labelWrong])}>{truncateValue}</span>
      </div>
    );
  } else if (!item) {
    // 前人代码不知道什么时候业务场景会走到这 遇到请写上注释
    children = (
      <div
        className={classnames(styles.capsuleTag, {
          'tag-chosen': isChosen,
          'contact-tag': true,
        })}
      >
        <AvatarTag
          style={{ display: 'inline-block' }}
          size={20}
          showAvatarFirst={false}
          user={{
            name: value,
            color: '#ffaa00',
          }}
        />
        <span className={styles.label}>{truncateValue}</span>
      </div>
    );
  } else {
    let realContactItem = contactItem;
    if (contactModel) {
      realContactItem = transContactModel2ContactItem(contactModel);
    }
    const { name, avatar, email: accountName, customerRole, id: realContactId } = realContactItem;
    let truncateName = name || accountName;
    const orgAvatar = <AvatarTag size={20} contactId={realContactId} propEmail={accountName} user={{ name, avatar, email: accountName }} />;
    let edmAvatar = orgAvatar; // 外贸
    const roleText = emailRoleToText(customerRole);
    truncateName = `${roleText ? roleText + ' ' : ''}` + truncateName;
    // 是否是客户
    const isCustomer = ['myCustomer', 'colleagueCustomer', 'colleagueCustomerNoAuth', 'openSeaCustomer'].some(i => i === customerRole);
    // 是否是线索
    const isClue = ['myClue', 'colleagueClue', 'colleagueClueNoAuth', 'openSeaClue'].some(i => i === customerRole);
    if (isClue) {
      edmAvatar = <IconCard type="hintClient" />; // 外贸线索
    } else if (isCustomer) {
      edmAvatar = <IconCard type="crmClient" />; // 外贸客户
    }
    truncateName = truncateName?.length > 20 ? `${truncateName.slice(0, 18)}...` : truncateName;
    // 被选中状态
    const selected = correctEmail && selectedMails.length > 0 && selectedMails.includes(email);
    // let arrowRightColor = customerType === 'customer' ? '#626E85' : '#626E85';
    let arrowRightColor = '#6F7485';
    if (selected) arrowRightColor = '#FFFFFF';
    children = (
      // @ts-ignore
      <div
        data={email}
        className={classnames(styles.capsuleTag, {
          'tag-chosen': isChosen,
          'contact-tag': true,
          [styles.clientBackgroundColor]: isCustomer,
          [styles.hintBackgroundColor]: isClue,
        })}
      >
        {process.env.BUILD_ISEDM ? edmAvatar : orgAvatar}
        <span className={classnames(styles.label)}>{truncateName}</span>
        {
          <span className={classnames(styles.crmCardControl)} onMouseDown={showContactCard} onMouseUp={e => e.stopPropagation()}>
            <IconCard className="dark-invert" type="arrowRight" stroke={arrowRightColor} />
          </span>
        }
      </div>
    );
  }

  const chip = (
    <div
      data-selected={!!(correctEmail && selectedMails.length > 0 && selectedMails.includes(email))}
      draggable="true"
      className="contact-tag-drop-item"
      data-email={email}
      data-type={type}
      ref={tagRef}
      // 处理拖动时不透明背景
      style={{
        background: 'transparent',
        transform: 'translate(0,0)',
        zIndex: 9999,
        border: '2px solid trasparent',
        paddingLeft: 4,
      }}
      onMouseUp={handleSelectTags}
      onMouseDown={e => e.stopPropagation()}
      onDrop={handleSort}
    >
      {children}
    </div>
  );

  const handleDragOver = useCallback(() => {
    if (!tagRef.current.classList.contains(styles.capDropEffect)) {
      tagRef.current.classList.add(styles.capDropEffect);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    if (tagRef.current.classList.contains(styles.capDropEffect)) {
      tagRef.current.classList.remove(styles.capDropEffect);
    }
  }, []);

  useEffect(() => {
    if (tagRef.current) {
      tagRef.current.addEventListener('dragover', handleDragOver);
      tagRef.current.addEventListener('dragleave', handleDragLeave);
    }
    return () => {
      if (tagRef.current) {
        tagRef.current.addEventListener('dragover', handleDragOver);
        tagRef.current.removeEventListener('dragleave', handleDragLeave);
      }
    };
  }, [selectedMails]);

  return (
    <>
      {/* 阻止tooltip消失动画 */}
      {selectedMails.includes(email) ? (
        chip
      ) : (
        <Tooltip
          // 多选时不显示tip 否则拖动时会挡住
          title={correctEmail ? email : `${email}（邮箱格式错误,请双击修改）`}
          destroyTooltipOnHide
          // destroyTooltipOnHide={{ keepParent: false, }}
          placement="bottomLeft"
          overlayClassName="selector-tag-tooltip"
        >
          {chip}
        </Tooltip>
      )}
    </>
  );
};

export default ContactChip;
