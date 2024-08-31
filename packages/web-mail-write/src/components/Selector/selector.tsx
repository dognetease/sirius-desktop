/* eslint-disable max-statements */
/* eslint-disable no-undef */
import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, CSSProperties, SetStateAction, Dispatch, useContext, useMemo } from 'react';
import {
  api,
  apis,
  DataTrackerApi,
  MailApi,
  MailBoxEntryContactInfoModel,
  MemberType,
  ContactModel,
  inWindow,
  CustomerSearchContactMemoryRes,
  SearchContactMemoryRes,
  ContactAndOrgApi,
  OrgSearch,
  PerformanceApi,
} from 'api';
import classnames from 'classnames';
import debounce from 'lodash/debounce';
import KeyCode from 'rc-util/lib/KeyCode';
import { Dropdown, Menu } from 'antd';
import Select, { RefSelectProps } from '../RcSelect/contact-select';
import ContactTag, { IContactTagProps } from './contact-tag';
import {
  buildContactItem,
  buildContactModel,
  ContactItem,
  getSearchAllContactInWriteMail,
  getValidEmail,
  OrgItem,
  transMailContactModel2ContactItem,
} from '@web-common/utils/contact_util';
import { getContactItemKey, getCustomerContactByCustomerIds, transCustomerSearchData } from '@web-common/components/util/contact';
import { showDialog } from '@web-common/utils/utils';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import './selector.scss';
import { ContactActions, TempContactActions, useActions, useAppSelector, MailTemplateActions, MailActions } from '@web-common/state/createStore';
import { CustomTagProps } from '../RcSelect/src/interface/generator';
import { WriteContext } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';
import styles from './selector.module.scss';
import { buildOptionLabel, buildTeamOptionLabel, extractEmailsFromText, getContactModelKey, OptionLabel } from './helper';
import LxPopover from '@web-common/components/UI/LxPopover/LxPopover';
import ContactDetail from '@web-contact/component/Detail/detail';
import { ContactPosType } from './type';
import { transContactSearch2ContactItem, transOrgSearch2OrgItem, transContactModel2ContactItem } from '@web-common/components/util/contact';
import { doGetMailContactModelByContactItem } from '@web-common/state/selector/contact';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { paste, isSupportPaste } from '@web-common/components/UI/ContextMenu/util';
import { getIn18Text } from 'api';
const tokenSeparators = [',', ';', '、', '，', '；', '\n'];
const LIST_ITEM_HEIGHT = 32;
const LIST_HEIGHT = LIST_ITEM_HEIGHT * 10;
const RECEIVER_LIMIT = 500;
const mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const performanceApi = api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;

const mapTrack = new Map([
  ['bcc', 'pcMail_inputBCC_writeMailPage'],
  ['cc', 'pcMail_inputCC_writeMailPage'],
  ['to', 'pcMail_inputAddressee_writeMailPage'],
]);
export interface SelectorProps {
  multiLine?: boolean;
  suffixDiv?: boolean; // 输入框后有其他元素，防止重叠
  ref?: any;
  type?: MemberType;
  autoFocus?: boolean;
  items?: MailBoxEntryContactInfoModel[]; // 初始化元素
  keyword: string;
  tabIndex?: number;
  setKeyword: Dispatch<SetStateAction<string>>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export type SelectorRefProps = {
  focus: () => void;
  blur: () => void;
  wrapperHeight: number;
};
const Selector: React.ForwardRefRenderFunction<SelectorRefProps, SelectorProps> = (props, ref) => {
  const { multiLine = true, type = '', autoFocus = false, items = [], keyword, setKeyword, tabIndex, onKeyDown } = props;
  const { isMailTemplate } = useContext(WriteContext);
  const [focus, setFocus] = useState<boolean>(false);
  const [inputOrder, setInputOrder] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Map<string, ContactItem>>(new Map());
  const [searchContactList, setSearchContactList] = useState<{
    data: SearchContactMemoryRes[];
    edm: CustomerSearchContactMemoryRes;
  }>();
  const [blurStyle, setBlurStyle] = useState<CSSProperties>({});
  const [showMask, setShowMask] = useState(false);
  const maskRef = useRef<any>(null);
  const onContactActions = isMailTemplate ? TempContactActions : ContactActions;
  const { doSelectTags, doAddItemToSelector, doFocusSelector } = useActions(onContactActions);
  const onActions = isMailTemplate ? MailTemplateActions : MailActions;
  const { doModifyReceiver } = useActions(onActions);
  const refSelect = useRef<RefSelectProps | null>(null);
  const refAdding = useRef<Record<string, boolean>>({});
  const refSelectWrapper = useRef<HTMLDivElement>(null);
  const keywordRef = useRef<string>('');
  const [options, setOptions] = useState<OptionLabel[]>([]); // 搜索选项
  const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender);
  const currentTabId = useAppSelector(state => state.mailTabReducer.currentTab.id);
  const selectedEmails = useAppSelector(state => (isMailTemplate ? state.tempContactReducer.selectedTags.emails : state.contactReducer.selectedTags.emails));
  const selector = useAppSelector(state => (isMailTemplate ? state.tempContactReducer.selector : state.contactReducer.selector));
  // const currentContacts = useAppSelector(state => (isMailTemplate ? state.mailTemplateReducer?.mailTemplateContent?.receiver?.filter(_ => _.mailMemberType === type) : state.mailReducer.currentMail?.receiver?.filter(_ => _.mailMemberType === type))) || [];
  // 胶囊卡片的位置
  const [contactPos, setContactPos] = useState<ContactPosType>({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  });
  // 最后一个item位置 用来算拖拽是不是应该放在最后
  const [lastItemPos, setLastItemPos] = useState([0, 0]);
  // 胶囊卡片的contact
  const [contactCardInfo, setContactCardInfo] = useState<ContactItem>();
  const [contactCardVisible, setContactCardVisible] = useState(false);
  const clickShowContactCard = (contactPos: ContactPosType, contactInfo: ContactItem) => {
    setContactPos(contactPos);
    setContactCardVisible(true);
    setContactCardInfo(contactInfo);
  };

  useEffect(() => {
    console.log('contactCardVisible', contactCardVisible);
  }, [contactCardVisible]);

  if (inWindow()) {
    if (!window.location.pathname.includes('writeMail') && !window.location.hash.startsWith('#mailbox') && contactCardVisible) {
      setContactCardVisible(false);
    }
  }

  useEffect(() => {
    // 切换顶栏tab
    setContactCardVisible(false);
  }, [currentTabId, items.length]);

  const selectItem = useCallback(() => {
    setKeyword('');
  }, []);

  useEffect(() => {
    if (!searchContactList) return;
    // 办公搜索联系人处理 搜索选项
    const { data: lxData, edm: edmData } = searchContactList;

    let frequentContacts: ContactItem[] = [];

    let personalContacts: ContactItem[] = [];
    let enterpriseContacts: ContactItem[] = [];
    let otherContacts: ContactItem[] = [];
    let teams: OrgSearch[] = [];
    let personalOrgs: OrgSearch[] = [];
    lxData?.forEach(normalData => {
      // 一般数据处理
      const { frequentContactList, contactList: allContactList, teamList, personalOrgList } = normalData;

      // 联系人排序
      (frequentContactList || []).forEach(item => {
        let contactItem = transContactSearch2ContactItem(item);
        frequentContacts.push(contactItem);
      });

      // const allContactItemMap: Record<string, ContactItem> = {};
      // 如果邮箱地址完全一致，下拉显示保留一个邮箱地址即可，优先级和2一致；
      (allContactList || []).forEach(item => {
        let contactItem = transContactSearch2ContactItem(item);
        const { type } = contactItem;
        /**
         * 1.30版本郭超添加:contactKey的生成规则是id+email 所以每一条数据的contactKey都是唯一的。注释的业务逻辑已经失效
         * 业务北京：1.27之前同一个email只会展示一条搜索项。1.27版本之后废弃 所有的contactItem都需要展示
         */
        // const { type, email } = contactItem;
        // const contactKey = getContactModelKey(contactItem);
        // if (!selectedItems.has(contactKey)) {
        //   if (allContactItemMap[email]) {
        //     contactItem = getValidEmail(allContactItemMap[email], contactItem);
        //   }
        //   if (type === 'enterprise') {
        //     enterpriseContacts.push(contactItem);
        //   } else if (type === 'personal') {
        //     personalContacts.push(contactItem);
        //   } else {
        //     otherContacts.push(contactItem);
        //   }
        // }
        if (type === 'enterprise') {
          enterpriseContacts.push(contactItem);
        } else if (type === 'personal') {
          personalContacts.push(contactItem);
        } else {
          otherContacts.push(contactItem);
        }
      });
      teams = [...teams, ...(teamList || [])];
      personalOrgs.push(...personalOrgList);
    });

    // 外贸搜索联系人处理
    let myCustomerContacts: ContactItem[] = [];
    let myClueContacts: ContactItem[] = [];
    let myCustomerOrgs: OrgItem[] = [];
    let myClueOrgs: OrgItem[] = [];
    if (edmData) {
      const orderEdmData = transCustomerSearchData(edmData);
      myCustomerContacts = orderEdmData['myCustomerContact'] as ContactItem[];
      myCustomerOrgs = orderEdmData['myCustomer'] as OrgItem[];
      // myClueContacts = orderEdmData['myClueContact'] as ContactItem[];
      // myClueOrgs = orderEdmData['myClue'] as OrgItem[];
    }

    // 最近联系人 > 企业通讯录 > 我的客户联系人 > 我的线索联系人 > 个人通讯录 > 陌生人
    // 联系人去重
    const allContactSet = new Set();
    const duplicateRemContacts: ContactItem[] = [
      ...frequentContacts,
      ...enterpriseContacts,
      ...myCustomerContacts,
      ...myClueContacts,
      ...personalContacts,
      ...otherContacts,
    ].reduce((total: ContactItem[], cur: ContactItem) => {
      const { email: emailAddr, type } = cur;
      /**
       * @description:1.26版本个人通讯录不在保留去重逻辑，展示所有数据
       */
      if (allContactSet.has(emailAddr) && type !== 'personal') {
        // if (allContactSet.has(emailAddr)) {
        return [...total];
      }
      allContactSet.add(emailAddr);
      return [...total, cur];
    }, []);
    allContactSet.clear();

    // 联系人 > 群组 > 我的客户 > 我的线索
    const newOptions = [
      // 1.26 因为要展示重复email数据。所以要用id+email作为唯一key
      ...duplicateRemContacts.map(item => buildOptionLabel(item, keyword, true)),
      ...personalOrgs.map(item => buildTeamOptionLabel(transOrgSearch2OrgItem(item), keyword)),
      ...teams.map(item => buildTeamOptionLabel(transOrgSearch2OrgItem(item), keyword)),
      ...myCustomerOrgs.map(item => buildTeamOptionLabel(item, keyword)),
      ...myClueOrgs.map(item => buildTeamOptionLabel(item, keyword)),
    ];
    setOptions(newOptions);
  }, [searchContactList]);

  const modifyReceiver = useCallback(
    async (params: { receiver: ContactItem[]; receiverType: MemberType; operation?: 'delete' | 'paste' }) => {
      const { receiver: list, receiverType, operation } = params;
      const receiver = await doGetMailContactModelByContactItem(list, receiverType, curAccount?.id);
      doModifyReceiver({
        receiver,
        receiverType,
        operation,
      });
    },
    [curAccount?.id]
  );

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      // debounce((value: string, setSearchContactList: (val: { data: SearchContactMemoryRes[]; edm: CustomerSearchContactMemoryRes }) => void) => {
      keywordRef.current = value;
      const showDisable = false;
      performanceApi.time({
        statKey: 'write_mail_search_contact',
        statSubKey: value,
      });
      const curAccountId = curAccount?.mailEmail;
      getSearchAllContactInWriteMail({ query: value, showDisable, curAccountId, flattenMuliptleEmails: true }).then(data => {
        if (keywordRef.current !== value) {
          return;
        }
        performanceApi.timeEnd({
          statKey: 'write_mail_search_contact',
          statSubKey: value,
        });

        data && setSearchContactList(data);
        console.warn('[optimize]writeMail-searchContactAllSpan:' + value, data);
      });
    }, 200),
    [curAccount]
  );

  const tagRender = useCallback(
    (props: CustomTagProps) => (
      <ContactTag
        {...(props as IContactTagProps)}
        items={items}
        type={type}
        setLastItemPos={setLastItemPos}
        focus={focus}
        refSelect={refSelect}
        setInputOrder={setInputOrder}
        clickShowContactCard={clickShowContactCard}
        setContactCardVisible={setContactCardVisible}
      />
    ),
    [items, type, focus, clickShowContactCard, setContactCardVisible]
  );
  /**
   * 监听拖拽的drop 事件
   * 从dataTransfer获取 选中的联系人和来源
   */
  const dropListener = useCallback(
    (e: React.DragEvent) => {
      const fromType = e.dataTransfer.getData('type') as MemberType;
      if (fromType === type) {
        return;
      }

      const data: ContactItem[] = JSON.parse(e.dataTransfer.getData('label'));
      const receiver = data.map((item: ContactItem) => {
        item.mailMemberType = type;
        return item;
      });
      modifyReceiver({
        receiver,
        receiverType: type,
        operation: 'paste',
      });

      modifyReceiver({
        receiver,
        receiverType: fromType,
        operation: 'delete',
      });

      // doSelectTags({ emails: [], type: '' });
      // 跨行拖拽后的选中
      const emails = data?.map(d => d.email) || [];
      doSelectTags({ emails, type });
      const parent = document.querySelector('#drag-active-tags');
      if (parent) {
        parent.innerHTML = '';
      }
    },
    [onContactActions]
  );

  const dragoverListener = (e: React.DragEvent) => {
    e.preventDefault();
    // e.dataTransfer.dropEffect='link'
  };

  const hasIntersection = (rect1: any, rect2: any): boolean => {
    const maxX: number = Math.max(rect1.x + rect1.width, rect2.x + rect2.width);
    const maxY: number = Math.max(rect1.y + rect1.height, rect2.y + rect2.height);
    const minX: number = Math.min(rect1.x, rect2.x);
    const minY: number = Math.min(rect1.y, rect2.y);
    if (maxX - minX <= rect1.width + rect2.width && maxY - minY <= rect1.height + rect2.height) {
      return true;
    }
    return false;
  };

  const handleDragSelectMouseMove = (ev: any) => {
    if (refSelectWrapper.current && maskRef.current) {
      const { x, y } = refSelectWrapper.current.getBoundingClientRect();
      const maskWidth = `${Math.abs(ev.clientX - maskRef.current.startX)}px`;
      const maskHeight = `${Math.abs(ev.clientY - maskRef.current.startY)}px`;
      const maskLeft = `${Math.min(maskRef.current.startX, ev.clientX) - x}px`;
      const maskTop = `${Math.min(maskRef.current.startY, ev.clientY) - y}px`;

      maskRef.current.style.width = maskWidth;
      maskRef.current.style.height = maskHeight;
      maskRef.current.style.left = maskLeft;
      maskRef.current.style.top = maskTop;
    }
  };

  const resetMaskValue = () => {
    if (maskRef.current) {
      setShowMask(false);
      maskRef.current.startX = 0;
      maskRef.current.startY = 0;
      maskRef.current.endX = 0;
      maskRef.current.endY = 0;
      maskRef.current.style.width = 0;
      maskRef.current.style.height = 0;
      maskRef.current.style.left = 0;
      maskRef.current.style.top = 0;
    }
  };

  const setDragSelectEmails = () => {
    if (refSelectWrapper.current && maskRef.current) {
      const rect1 = maskRef.current.getBoundingClientRect();
      const rect2Groups = Array.from(refSelectWrapper.current.querySelectorAll('.contact-tag'));
      let selected = rect2Groups
        .filter(item => {
          const rect2 = item.getBoundingClientRect();
          return hasIntersection(rect1, rect2);
        })
        .map(item => item.getAttribute('data')) as string[];
      if (selected?.length) {
        const list = [...selectedItems.keys()];
        let startIndex = list.length;
        let endIndex = 0;
        selected.forEach(email => {
          const index = list.indexOf(email);
          if (index !== -1) {
            if (index < startIndex) {
              startIndex = index;
            }
            if (endIndex < index) {
              endIndex = index;
            }
          }
        });
        selected = list.slice(startIndex, endIndex + 1);
      }
      doSelectTags({ emails: selected, type });
    }
  };

  const handleDragSelectMouseUp = () => {
    if (refSelectWrapper.current && maskRef.current) {
      setDragSelectEmails();
      resetMaskValue();
      refSelectWrapper.current.removeEventListener('mousemove', handleDragSelectMouseMove);
      refSelectWrapper.current.removeEventListener('mouseup', handleDragSelectMouseUp);
    }
  };
  // const handleDragSelectMouseUp = () => {
  //   if (refSelectWrapper.current && maskRef.current) {
  //     const rect1 = maskRef.current.getBoundingClientRect();
  //     const rect2Groups = Array.from(refSelectWrapper.current.querySelectorAll('.contact-tag'));
  //     const selected = rect2Groups
  //       .filter(item => {
  //         const rect2 = item.getBoundingClientRect();
  //         return hasIntersection(rect1, rect2);
  //       })
  //       .map(item => item.getAttribute('data')) as string[];
  //     doSelectTags({ emails: selected, type });
  //     resetMaskValue();

  //     refSelectWrapper.current.removeEventListener('mousemove', handleDragSelectMouseMove);
  //     refSelectWrapper.current.removeEventListener('mouseup', handleDragSelectMouseUp);
  //   }
  // };

  // 选中Tag 不触发滑选
  const hanldeDragSelectMouseDown = (ev: any) => {
    if (ev.currentTarget !== ev.target) return;
    if (refSelectWrapper.current && maskRef.current) {
      maskRef.current.startX = ev.clientX;
      maskRef.current.startY = ev.clientY;
      doSelectTags({ emails: [], type });
      setShowMask(true);
      refSelectWrapper.current.addEventListener('mousemove', handleDragSelectMouseMove);
      refSelectWrapper.current.addEventListener('mouseup', handleDragSelectMouseUp);
    }
  };

  const handleDragSelectMouseUpWrap = useCreateCallbackForEvent(hanldeDragSelectMouseDown);

  useEffect(() => {
    if (refSelectWrapper.current) {
      const box = refSelectWrapper.current.querySelector('.ant-select-selector');
      box?.addEventListener('mousedown', handleDragSelectMouseUpWrap);
    }

    return () => {
      if (refSelectWrapper.current) {
        const box = refSelectWrapper.current.querySelector('.ant-select-selector');
        box?.removeEventListener('mousedown', handleDragSelectMouseUpWrap);
      }
    };
  }, []);

  useEffect(() => {
    // if (!selectedEmails.length) {
    //   return;
    // }
    const dropArea = document.querySelector(`.${styles.selectorWrapper}.${type}`);
    dropArea?.addEventListener('drop', dropListener as unknown as EventListener);
    dropArea?.addEventListener('dragover', dragoverListener as unknown as EventListener);
    // eslint-disable-next-line consistent-return
    return () => {
      dropArea?.removeEventListener('drop', dropListener as unknown as EventListener);
      dropArea?.removeEventListener('dragover', dragoverListener as unknown as EventListener);
    };
  }, [dropListener, selectedEmails.length, type]);

  useEffect(() => {
    const list = items || [];
    const selectedItemsMap = new Map<string, ContactItem>();
    items?.forEach(item => {
      const contactItem = transMailContactModel2ContactItem(item);
      const contactKey = getContactItemKey(contactItem);
      selectedItemsMap.set(contactKey, contactItem);
    });
    setSelectedItems(selectedItemsMap);
    if (autoFocus && list.length === 0) {
      setTimeout(() => refSelect?.current?.focus(), 100);
    }
  }, [autoFocus, items]);

  useEffect(() => {
    if (!/^\s+$/.test(keyword) && keyword !== '') {
      debouncedSearch(keyword);
    } else {
      setOptions([]);
    }
    return () => {
      debouncedSearch.cancel();
    };
  }, [keyword]);

  // 通过通讯录填入收件人
  const addItem = async (list: ContactItem[]) => {
    if (list?.length) {
      // const mailContactList = MailContactUnique(items.concat(list), type);
      let { list: unqiueList, newInputOrder } = inputOrderUnique([...selectedItems.values()], list);
      if (unqiueList.length > RECEIVER_LIMIT) {
        showDialog({
          title: `联系人总数最多为${RECEIVER_LIMIT}人，已为您截断${unqiueList.length - RECEIVER_LIMIT}位多余联系人`,
        });
        unqiueList = unqiueList.slice(0, RECEIVER_LIMIT);
      }
      const eventName = mapTrack.get(type);
      trackApi.track(eventName!, { source: getIn18Text('CONGTONGXUNLUTIAN') });
      // 通过通讯录填入收件人不会触发handleChange，手动发送MODIFY_RECEIVER
      await modifyReceiver({
        receiver: unqiueList,
        receiverType: type,
      });
      setInputOrder(newInputOrder);
      setTimeout(() => refSelect?.current?.focus(), 50);
    }
  };

  useEffect(() => {
    if (selector.focused === '正文') {
      setBlurStyle({ height: 40, overflow: 'hidden' });
    }
    if (selector.focused === type) {
      setBlurStyle({ height: 'auto', overflow: 'auto' });
    }
    if (!selector || !selector.add || refAdding.current[selector.focused || 'to']) {
      return;
    }
    const { pendingItem, add, focused } = selector;
    const focusedSel = focused || 'to';
    refAdding.current[focusedSel] = true;
    if (add && pendingItem && focusedSel === type) {
      const list: ContactModel[] = Array.isArray(pendingItem) ? pendingItem : [pendingItem];
      const contactItemList = list.map(item => {
        const contactItem = transContactModel2ContactItem(item);
        return { ...contactItem, mailMemberType: type };
      });
      // 添加完毕将pendingItem置空
      addItem(contactItemList).then(() => {
        doAddItemToSelector({
          add: false,
          pendingItem: [],
        });
        refAdding.current[focusedSel] = false;
      });
    }
  }, [selector]);

  const changeKeyword = useCallback((value: string) => {
    keywordRef.current = value;
    setKeyword(value);
  }, []);

  const initLabelItems = useCallback(
    (list: OptionLabel[]): ContactItem[] => {
      const res: ContactItem[] = [];
      list.forEach(item => {
        if (!!item?.value?.trim()) {
          if (item.label?.props?.item) {
            res.push(item.label?.props?.item as ContactItem);
          } else {
            const contactItem = buildContactItem({ item: item.value.trim(), email: item.value.trim(), type });
            res.push(contactItem);
          }
        }
      });
      return res;
    },
    [type]
  );

  const inputOrderUnique = useCallback(
    (list: ContactItem[], newList: ContactItem[]): { list: ContactItem[]; newInputOrder: number } => {
      // 根据邮箱地址去重 要求所有新增加的item 不管是不是重复都要在光标处显示
      // 将原items 重复的设置为null，再在光标处插入，再将null删除
      const itemMap: Record<string, ContactItem> = {};
      list.forEach(item => {
        const key = getContactItemKey(item);
        itemMap[key] = item;
      });
      const needInsertList: ContactItem[] = [];
      newList.forEach(item => {
        const key = getContactItemKey(item);
        const pre = itemMap[key];
        if (pre) {
          itemMap[key] = getValidEmail(pre, item);
        } else {
          needInsertList.push(item);
        }
      });
      // inputOrder 从大到小 胶囊最后为 0
      // 光标前面胶囊的数量
      const index = list.length - inputOrder;
      list.splice(index, 0, ...needInsertList);
      // 光标签名应该有的数量(胶囊)
      // const newInputOrder = index + needInsertList.length;
      return {
        list,
        // 总长度 减去 光标前面胶囊数量 就是光标位置了
        newInputOrder: inputOrder,
      };
    },
    [inputOrder]
  );

  const handleDelete = (items: OptionLabel[]) => {
    const itemList: ContactItem[] = initLabelItems(items);
    modifyReceiver({ receiver: itemList, receiverType: type });
  };

  const handleChange = useCallback(
    async (items: OptionLabel[]) => {
      // const lastItem = items[items.length - 1];
      const lastItem = items.pop();
      if (lastItem === undefined) {
        // items 为空
        modifyReceiver({ receiver: [], receiverType: type });
        return;
      }
      let changeItem = lastItem?.label?.props?.item;
      const itemValue = lastItem?.value?.trim();
      if (!changeItem && itemValue) {
        changeItem = buildContactItem({ item: itemValue, email: itemValue, type });
      }
      let curSelectedContactItem: ContactItem[] = [];
      if (changeItem?.orgType) {
        const orgItem = changeItem as OrgItem;
        const useEdm = orgItem.orgType === 'customer' || orgItem.orgType === 'clue';
        const contactList = useEdm
          ? await getCustomerContactByCustomerIds([orgItem.id])
          : await contactApi.doGetContactByOrgId({ orgId: [orgItem.id], showDisable: true });
        curSelectedContactItem = contactList.map(item => transContactModel2ContactItem(item));
      } else {
        const currentItem = changeItem as ContactItem;
        curSelectedContactItem = [currentItem];
      }
      let { list: uniqueList, newInputOrder } = inputOrderUnique([...selectedItems.values()], curSelectedContactItem);
      if (uniqueList.length > RECEIVER_LIMIT) {
        showDialog({
          title: `联系人总数最多为${RECEIVER_LIMIT}人，已为您截断${uniqueList.length - RECEIVER_LIMIT}位多余联系人`,
        });

        uniqueList = uniqueList.slice(0, RECEIVER_LIMIT);
      }
      if (selectedItems.size < items.length) {
        // 添加 删除都会触发change
        const eventName = mapTrack.get(type);
        trackApi.track(eventName!, { source: getIn18Text('SHOUDONGSHURU') });
      }
      await modifyReceiver({ receiver: uniqueList, receiverType: type });
      setInputOrder(newInputOrder);
      setOptions([]);
    },
    [inputOrder, selectedItems, modifyReceiver, setInputOrder]
  );

  const onFocus = useCallback(() => {
    setFocus(true);
    // doFocusSelector(type);
    if (selector.focused !== type) {
      doFocusSelector(type);
    }
    setBlurStyle({ height: 'auto', overflow: 'auto' });
    // setTimeout(() => refSelect?.current?.focus(), 100);
  }, []);

  const onBlur = useCallback(() => {
    setFocus(false);
  }, []);

  useImperativeHandle(ref, () => ({
    focus: () => {
      refSelect?.current?.focus();
    },
    blur: () => {
      refSelect?.current?.blur();
    },
    get wrapperHeight() {
      // @待测试郭超
      // return refSelectWrapper?.current?.children[0]?.clientHeight || 44;
      return 44;
    },
  }));

  const selectProps = focus && multiLine ? {} : { maxTagCount: 'responsive' as const };
  /**
   * 处理从收件人、抄送、密送复制过来的联系对象
   */
  // const handlePasteContacts = (clipboardData: string) => {
  //     const result: MailBoxEntryContactInfoModel[] = JSON.parse(clipboardData);
  //     if (Array.isArray(result) && result?.length > 0) {
  //         appActions.doModifyReceiver({
  //             receiver: result.map(item => {
  //                 item.mailMemberType = type;
  //                 return item;
  //             }),
  //             receiverType: type,
  //             operation: 'paste',
  //         });
  //     } else {
  //         changeKeyword(clipboardData);
  //     }
  // };
  /**
   * 处理粘贴导入一组邮件字符串
   */
  const handlePasteImportMails = async (clipboardData: string) => {
    const extractEmails = extractEmailsFromText(clipboardData);
    if (extractEmails?.length === 0) {
      changeKeyword(clipboardData);
      return;
    }
    const result = await mailApi.getContractItemByEmail(
      extractEmails.map(item => item.mail),
      'to'
    );
    const contactItemList = result.map(transMailContactModel2ContactItem);
    const { list: uniqueList, newInputOrder } = inputOrderUnique([...selectedItems.values()], contactItemList);
    // const result = await contactApi.doGetContactByEmails(extractEmails, type);
    // 光标在 currentContacts 中的索引
    // filteredCurrentContacts 是去重后的 currentContacts
    // 根据光标后剩余数量，算出光标在 filteredCurrentContacts 的索引
    await modifyReceiver({
      receiver: uniqueList,
      receiverType: type,
      //operation: 'paste'
    });
    setInputOrder(newInputOrder);
  };
  /**
   *  拦截剪贴板 粘贴事件
   *  粘贴文本有两种种情况：
   *  1.普通字符串
   *  2.可以支持导入的一组邮件字符串 'aa@bb.com,cc@ss.com；XXX<aa@bb.com>'
   */
  const handleInterceptPasteEvent = async (e: React.KeyboardEvent<HTMLDivElement>) => {
    const { which, metaKey, ctrlKey } = e;
    onKeyDown && onKeyDown(e);
    const holdingCtrl = metaKey || ctrlKey;
    //  全选时需要blur输入框，多选tags无法进行搜索文本操作，要先focus
    if (holdingCtrl && which === KeyCode.A) {
      setTimeout(() => refSelect?.current?.blur(), 100);
    }
  };
  const contextMenu = (
    <Menu>
      <Menu.Item
        onClick={async () => {
          if (!(await isSupportPaste())) {
            SiriusModal.error({
              content: '您的浏览器版本过低，请使用键盘快捷键（Ctrl+V）。或升级到新版chrome浏览器使用',
              okText: getIn18Text('ZHIDAOLE'),
              hideCancel: true,
            });
            return;
          }
          const clipboardData = await paste();
          clipboardData && handlePasteImportMails(clipboardData);
        }}
      >
        {getIn18Text('ZHANTIE')}
      </Menu.Item>
    </Menu>
  );
  const selectValue: OptionLabel[] = useMemo(() => {
    const list: OptionLabel[] = [];
    selectedItems.forEach(item => {
      list.push(buildOptionLabel(item));
    });
    return list;
  }, [selectedItems]);
  const dropForSort = (e: React.DragEvent) => {
    const fromType = e?.dataTransfer?.getData('type');
    if (fromType !== type) return;
    // 最后一个item位置
    const [lastTop, lastRight] = lastItemPos;
    const dropX = e.clientX;
    const dropY = e.clientY;
    // 如果drop 的位置在最后一个item的右侧 下侧 则判定drop在最后
    // 将拖拽的内容放到最后
    if (lastTop && lastRight && dropX > lastRight && dropY > lastTop) {
      const draggingData = e?.dataTransfer?.getData('label');
      const _draggingData = JSON.parse(draggingData);
      const first_draggingData: ContactItem = _draggingData[0];
      const deleted: ContactItem[] = [];

      if (selectedEmails?.includes(first_draggingData?.email)) {
        // 拖拽的是选中状态的胶囊
        selectedItems.forEach(item => {
          if (!selectedEmails?.includes(item.email)) {
            deleted.push(item);
          }
        });
      } else {
        // 拖动一个非选中状态的胶囊
        selectedItems.forEach(item => {
          if (item.email !== first_draggingData.email) {
            deleted.push(item);
          }
        });
      }
      deleted.push(..._draggingData);
      modifyReceiver({ receiverType: fromType, receiver: deleted });
    }
  };
  return (
    <>
      <div ref={refSelectWrapper} style={{ width: '100%', ...blurStyle, position: 'relative' }} onDrop={dropForSort}>
        <Dropdown overlay={contextMenu} trigger={['contextMenu']}>
          <Select
            dropdownClassName={styles.selectorDropdown}
            className={classnames(styles.selectorWrapper, {
              [type]: true,
            })}
            listHeight={LIST_HEIGHT}
            virtual
            // mode="mul"
            mode="tags"
            size="large"
            style={{ width: '100%', paddingBottom: 4 }}
            notFoundContent={null}
            bordered={false}
            searchValue={keyword}
            value={selectValue}
            inputOrderExternal={inputOrder}
            onChange={handleChange}
            onDelete={handleDelete}
            onSelect={selectItem}
            onSearch={changeKeyword}
            onPaste={(e: React.ClipboardEvent) => {
              const { clipboardData } = e;
              const value = clipboardData.getData('text');
              handlePasteImportMails(value);
              e.preventDefault();
            }}
            onInputOrderChange={setInputOrder}
            tokenSeparators={tokenSeparators}
            tagRender={tagRender}
            onKeyDown={handleInterceptPasteEvent}
            maxTagPlaceholder={() => `共${selectedItems.size}人`}
            // open={true}
            open={Boolean(keyword && options.length)}
            tabIndex={tabIndex}
            optionFilterProp="search"
            {...selectProps}
            onFocus={onFocus}
            onBlur={onBlur}
            options={options}
            filterOption={true}
            labelInValue
            ref={refSelect}
          />
        </Dropdown>
        <div
          className="drag-mask"
          ref={maskRef}
          style={{
            zIndex: 999,
            // background: '#409eff',
            background: 'transparent',
            position: 'absolute',
            // opacity: 0.4,
            opacity: 0,
            display: showMask ? 'block' : 'none',
          }}
        />
      </div>
      <LxPopover top={contactPos.top} left={contactPos.left} right={contactPos.right} bottom={contactPos.bottom} visible={contactCardVisible} offset={[5, 40]}>
        {contactCardInfo && (
          <ContactDetail
            showClose
            email={contactCardInfo.email}
            contactId={contactCardInfo.email ? undefined : contactCardInfo.id}
            contact={buildContactModel(contactCardInfo)}
            dividerLine={false}
            onNotifyParent={() => {
              setContactCardVisible(false);
            }}
            branch
            toolipShow
          />
        )}
      </LxPopover>
    </>
  );
};
export default React.forwardRef(Selector);
