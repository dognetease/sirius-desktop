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
// 下拉选择列表每一项高度
const LIST_ITEM_HEIGHT = 32;
// 下拉选择列表整体高度
const LIST_HEIGHT = LIST_ITEM_HEIGHT * 10;
// 收件人最大限制
const RECEIVER_LIMIT = 500;
const mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const performanceApi = api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;

// 打点名称集合
const mapTrack = new Map([
  ['bcc', 'pcMail_inputBCC_writeMailPage'],
  ['cc', 'pcMail_inputCC_writeMailPage'],
  ['to', 'pcMail_inputAddressee_writeMailPage'],
]);

export interface SelectorProps {
  multiLine?: boolean; // 是否支持多行
  suffixDiv?: boolean; // 输入框后有其他元素，防止重叠
  ref?: any;
  type?: MemberType; // 当前联想框的类型，来自于哪里（密送，抄送，发件）
  autoFocus?: boolean; // 是否需要自动选中
  items?: MailBoxEntryContactInfoModel[]; // 初始化元素 (进入组件时默认展示在联想框中的数据)
  keyword: string; // 输入的搜索文字
  setKeyword: Dispatch<SetStateAction<string>>; // 联想框输入完成后，需要把结果传给父组件（我也不知道为什么这样设计）
}

// 提供给外部调用组件的方法，属性
export type SelectorRefProps = {
  focus: () => void; //聚焦
  blur: () => void; // 失焦
  wrapperHeight: number; //联想框的高度
};
// 写信下拉联想组件（收件，抄送，密送）
const Selector: React.ForwardRefRenderFunction<SelectorRefProps, SelectorProps> = (props, ref) => {
  const { multiLine = true, type = '', autoFocus = false, items = [], keyword, setKeyword } = props;
  // 是否是写信邮件模版
  const { isMailTemplate } = useContext(WriteContext);
  // 写信模板或者写信组件的的redux 联系人action（不应该放在联系人的redux中，应该放在别的地方，写信的redux）
  const onContactActions = isMailTemplate ? TempContactActions : ContactActions;
  // doSelectTags: 设置不同类型下的选中email， doAddItemToSelector: 给不同type的selector添加联系人数据， doFocusSelector: 设置当前聚焦的type的selector
  const { doSelectTags, doAddItemToSelector, doFocusSelector } = useActions(onContactActions);
  // 邮件模板的redux或者邮箱的redux
  const onActions = isMailTemplate ? MailTemplateActions : MailActions;
  // 给邮件模版添加联系人，或者更改联系人数据
  const { doModifyReceiver } = useActions(onActions);
  // 多账号下的当前选择的发件人
  const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender);
  // 多个写信页签下当前的写信id
  const currentTabId = useAppSelector(state => state.mailTabReducer.currentTab.id);
  // 当前需要操作（滑选，点击，拖动）的emails（ui上带有蓝色底色）
  const selectedEmails = useAppSelector(state => (isMailTemplate ? state.tempContactReducer.selectedTags.emails : state.contactReducer.selectedTags.emails));
  // 保存不同类型下的在redux中存储的即将要插入的emailspackages/web-mail-write/src/components/Selector/selector.tsx
  const selector = useAppSelector(state => (isMailTemplate ? state.tempContactReducer.selector : state.contactReducer.selector));
  // 聚焦状态
  const [focus, setFocus] = useState<boolean>(false);
  // 输入文字光标的位置
  const [inputOrder, setInputOrder] = useState(0);
  // 失去焦点的样式
  const [blurStyle, setBlurStyle] = useState<CSSProperties>({});
  // 当前组件存在的email对应的email详情值映射
  const [selectedItems, setSelectedItems] = useState<Map<string, ContactItem>>(new Map());
  // 拖动胶囊时的一个透明遮罩层
  const [showMask, setShowMask] = useState(false);
  // 透明遮罩层的实际节点ref
  const maskRef = useRef<any>(null);
  // 下拉选择框的实际节点ref
  const selectRef = useRef<RefSelectProps | null>(null);
  // 不同类型的联想框是否正在添加联系人
  const refAdding = useRef<Record<string, boolean>>({});
  // 下拉联想框的外部容器节点ref
  const refSelectWrapper = useRef<HTMLDivElement>(null);
  // 搜索的实际值，为了防止搜索返回的数据，数据返回的顺序逆序，后请求的先返回
  const keywordRef = useRef<string>('');
  // 搜索返回的联系人数据（包括企业组织，个人分组，群组，包括外贸客户数据）
  const [searchContactList, setSearchContactList] = useState<{
    data: SearchContactMemoryRes[];
    edm: CustomerSearchContactMemoryRes;
  }>();
  // 下拉框展示的数据
  const [options, setOptions] = useState<OptionLabel[]>([]); // 搜索选项
  // 点击胶囊联系人卡片的位置
  const [contactPos, setContactPos] = useState<ContactPosType>({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  });
  // 最后一个item位置 用来算拖拽是不是应该放在最后
  const [lastItemPos, setLastItemPos] = useState([0, 0]);
  // 胶囊卡片的contact详情
  const [contactCardInfo, setContactCardInfo] = useState<ContactItem>();
  // 是否展示联系人卡片
  const [contactCardVisible, setContactCardVisible] = useState(false);

  // ----------------------- 计算方法  start -----------------------------------

  // 计算搜索返回的值
  const computedSearchData = useCallback(
    (
      keyword: string,
      searchRes: {
        data: SearchContactMemoryRes[];
        edm: CustomerSearchContactMemoryRes;
      }
    ) => {
      // 办公搜索联系人处理 搜索选项
      const { data: lxData, edm: edmData } = searchRes;
      let personalContacts: ContactItem[] = [];
      let enterpriseContacts: ContactItem[] = [];
      let otherContacts: ContactItem[] = [];
      let teams: OrgSearch[] = [];
      let personalOrgs: OrgSearch[] = [];
      lxData?.forEach(normalData => {
        // 一般数据处理
        const { contactList: allContactList, teamList, personalOrgList } = normalData;
        const allContactItemMap: Record<string, ContactItem> = {};
        // 如果邮箱地址完全一致，下拉显示保留一个邮箱地址即可，优先级和2一致；
        (allContactList || []).forEach(item => {
          let contactItem = transContactSearch2ContactItem(item);
          const { type, email } = contactItem;
          const contactKey = getContactModelKey(contactItem);
          if (!selectedItems.has(contactKey)) {
            if (allContactItemMap[email]) {
              contactItem = getValidEmail(allContactItemMap[email], contactItem);
            }
            if (type === 'enterprise') {
              enterpriseContacts.push(contactItem);
            } else if (type === 'personal') {
              personalContacts.push(contactItem);
            } else {
              otherContacts.push(contactItem);
            }
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

      // console.log(
      //   'selector datas',
      //   searchContactList,
      //   enterpriseContacts,
      //   myCustomerContacts,
      //   myClueContacts,
      //   personalContacts,
      //   otherContacts,
      //   teams,
      //   myCustomerOrgs,
      //   myClueOrgs
      // );

      // 企业通讯录 > 我的客户联系人 > 我的线索联系人 > 个人通讯录 > 陌生人
      // 联系人去重
      const allContactSet = new Set();
      const duplicateRemContacts: ContactItem[] = [...enterpriseContacts, ...myCustomerContacts, ...myClueContacts, ...personalContacts, ...otherContacts].reduce(
        (total: ContactItem[], cur: ContactItem) => {
          const { email: emailAddr } = cur;
          // 已存在
          if (allContactSet.has(emailAddr)) {
            return [...total];
          }
          allContactSet.add(emailAddr);
          return [...total, cur];
        },
        []
      );
      allContactSet.clear();

      // 联系人 > 群组 > 我的客户 > 我的线索
      const newOptions = [
        ...duplicateRemContacts.map(item => buildOptionLabel(item, keyword)),
        ...personalOrgs.map(item => buildTeamOptionLabel(transOrgSearch2OrgItem(item), keyword)),
        ...teams.map(item => buildTeamOptionLabel(transOrgSearch2OrgItem(item), keyword)),
        ...myCustomerOrgs.map(item => buildTeamOptionLabel(item, keyword)),
        ...myClueOrgs.map(item => buildTeamOptionLabel(item, keyword)),
      ];
      return newOptions;
    },
    []
  );

  // 内部选中联系人时请求api数据
  const modifyReceiver = useCallback(async (params: { receiver: ContactItem[]; receiverType: MemberType; operation?: 'delete' | 'paste' }) => {
    const { receiver: list, receiverType, operation } = params;
    const receiver = await doGetMailContactModelByContactItem(list, receiverType);
    doModifyReceiver({
      receiver,
      receiverType,
      operation,
    });
  }, []);

  // 矩形是否有相交的地方
  const hasIntersection = useCallback((rect1: any, rect2: any): boolean => {
    const maxX: number = Math.max(rect1.x + rect1.width, rect2.x + rect2.width);
    const maxY: number = Math.max(rect1.y + rect1.height, rect2.y + rect2.height);
    const minX: number = Math.min(rect1.x, rect2.x);
    const minY: number = Math.min(rect1.y, rect2.y);
    if (maxX - minX <= rect1.width + rect2.width && maxY - minY <= rect1.height + rect2.height) {
      return true;
    }
    return false;
  }, []);

  // 重新更新胶囊信息
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

  // 计算联想输入框的光标位置
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

  // ----------------------- 计算方法  end -----------------------------------

  // ---------------------- 联系人卡片扩展的方法 start ---------------------------

  // 点击展示联系人卡片
  const clickShowContactCard = useCallback((contactPos: ContactPosType, contactInfo: ContactItem) => {
    setContactPos(contactPos);
    setContactCardVisible(true);
    setContactCardInfo(contactInfo);
  }, []);

  // 路径变化后关闭当前展示的卡片
  const hiddenCardHandler = useCallback(() => {
    if (!window.location.pathname.includes('writeMail') && !window.location.hash.startsWith('#mailbox')) {
      setContactCardVisible(false);
    }
  }, []);

  // 监听路径变化后处理业务
  useEffect(() => {
    if (inWindow()) {
      window.addEventListener('popstate', hiddenCardHandler);
      window.addEventListener('hashchange', hiddenCardHandler);
      return () => {
        window.removeEventListener('popstate', hiddenCardHandler);
        window.removeEventListener('hashchange', hiddenCardHandler);
      };
    }
    return () => {};
  }, []);

  // 切换顶栏tab或者更改选中联系人
  useEffect(() => {
    setContactCardVisible(false);
  }, [currentTabId, items.length]);

  // ---------------------- 联系人卡片扩展的方法 end ---------------------------

  // ----------------------- 胶囊扩展方法 start ----------------------------
  // 胶囊当前组件内拖拽
  const dropForSort = useCallback(
    (e: React.DragEvent) => {
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
    },
    [type, lastItemPos, selectedEmails, selectedItems]
  );

  // 当发生组件发生鼠标滑动时
  const handleDragSelectMouseMove = useCallback((ev: any) => {
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
  }, []);

  // 从新设置遮罩层的数值
  const resetMaskValue = useCallback(() => {
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
  }, []);

  // 设置滑选时选中的emails
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

  // 滑选结束
  const handleDragSelectMouseUp = () => {
    if (refSelectWrapper.current && maskRef.current) {
      setDragSelectEmails();
      resetMaskValue();
      refSelectWrapper.current.removeEventListener('mousemove', handleDragSelectMouseMove);
      refSelectWrapper.current.removeEventListener('mouseup', handleDragSelectMouseUp);
    }
  };

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

  // 绑定在原生的事件拿到state的值
  const handleDragSelectMouseUpWrap = useCreateCallbackForEvent(hanldeDragSelectMouseDown);

  // 给联想框绑定鼠标滑选事件
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

  // ----------------------- 胶囊扩展方法 end ----------------------------
  // ---------------------- 下拉联想框的方法 start ------------------------
  // 选中下拉框的某项需要重制搜索值
  const selectItem = useCallback(() => {
    setKeyword('');
  }, []);

  // 渲染胶囊
  const tagRender = useCallback(
    (props: CustomTagProps) => (
      <ContactTag
        {...(props as IContactTagProps)}
        items={items}
        type={type}
        setLastItemPos={setLastItemPos}
        focus={focus}
        refSelect={selectRef}
        setInputOrder={setInputOrder}
        clickShowContactCard={clickShowContactCard}
        setContactCardVisible={setContactCardVisible}
      />
    ),
    [items, type, focus, clickShowContactCard, setContactCardVisible]
  );

  // 下拉联想框触发了搜索值变化
  const changeKeyword = useCallback((value: string) => {
    keywordRef.current = value;
    setKeyword(value);
  }, []);

  // 搜索时防抖
  const debouncedSearch = useCallback(
    debounce(async (value: string) => {
      const showDisable = false;
      performanceApi.time({
        statKey: 'write_mail_search_contact',
        statSubKey: value,
      });
      console.time('[optimize]writeMail-searchContactAllSpan:' + value);
      const curAccountId = curAccount?.mailEmail;
      const data = await getSearchAllContactInWriteMail({ query: value, showDisable, curAccountId });
      if (keywordRef.current !== value) {
        return;
      }
      performanceApi.timeEnd({
        statKey: 'write_mail_search_contact',
        statSubKey: value,
      });
      if (data) {
        const searchOptions = computedSearchData(value, data);
        setOptions(searchOptions);
      }
      console.timeEnd('[optimize]writeMail-searchContactAllSpan:' + value);
    }, 200),
    [curAccount]
  );

  // 搜索值发生变化时
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

  // 下拉框的胶囊删除
  const handleDelete = (items: OptionLabel[]) => {
    const itemList: ContactItem[] = initLabelItems(items);
    modifyReceiver({ receiver: itemList, receiverType: type });
  };

  // 当选择了下拉框的某条数据
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
    },
    [inputOrder, selectedItems, modifyReceiver, setInputOrder]
  );

  /**
   * 处理粘贴导入一组邮件字符串
   */
  const handlePasteImportMails = useCallback(
    async (clipboardData: string) => {
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
    },
    [type, selectedItems, setInputOrder]
  );

  /**
   *  拦截全选时，触发失焦事件
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const { which, metaKey, ctrlKey } = e;
    const holdingCtrl = metaKey || ctrlKey;
    //  全选时需要blur输入框，多选tags无法进行搜索文本操作，要先focus
    if (holdingCtrl && which === KeyCode.A) {
      setTimeout(() => selectRef?.current?.blur(), 100);
    }
  }, []);

  // 聚焦
  const onFocus = useCallback(() => {
    setFocus(true);
    // doFocusSelector(type);
    if (selector.focused !== type) {
      doFocusSelector(type);
    }
    setBlurStyle({ height: 'auto', overflow: 'auto' });
    // setTimeout(() => selectRef?.current?.focus(), 100);
  }, []);

  // 失焦
  const onBlur = useCallback(() => {
    setFocus(false);
  }, []);

  // ---------------------- 下拉联想框的方法 end ------------------

  // useEffect(() => {
  //   console.log('contactCardVisible', contactCardVisible);
  // }, [contactCardVisible]);

  // if (inWindow()) {
  //   if (!window.location.pathname.includes('writeMail') && !window.location.hash.startsWith('#mailbox') && contactCardVisible) {
  //     setContactCardVisible(false);
  //   }
  // }

  // ------------------ 下拉联想框的属性 start -------------------

  // 是否展示多行
  const maxTagCount = useMemo(() => (focus && multiLine ? undefined : 'responsive'), [focus, multiLine]);

  // 下拉联想的右键菜单项
  const contextMenu = useMemo(
    () => (
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
    ),
    [handlePasteImportMails]
  );

  // 联想框的胶囊展示需要用到的数据，数据来源选中的emails
  const selectValue: OptionLabel[] = useMemo(() => {
    const list: OptionLabel[] = [];
    selectedItems.forEach(item => {
      list.push(buildOptionLabel(item));
    });
    return list;
  }, [selectedItems]);

  // ------------------ 下拉联想框的属性 END -------------------
  // ------------------------- 废弃 --------------------------
  /**
   * 好像废弃了
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

  // 好像废弃了
  const dragoverListener = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // e.dataTransfer.dropEffect='link'
  }, []);

  // ？？好像是废弃了的方法
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

  //选中的emails发生变化（外部，内部），构建一个内部的数据结构
  useEffect(() => {
    const selectedItemsMap = new Map<string, ContactItem>();
    items?.forEach(item => {
      const contactItem = transMailContactModel2ContactItem(item);
      const contactKey = getContactItemKey(contactItem);
      selectedItemsMap.set(contactKey, contactItem);
    });
    setSelectedItems(selectedItemsMap);
  }, [items]);

  // 当外部需要自动聚焦时，且传入的items,没有数据时，聚焦下拉联想组件
  useEffect(() => {
    if (autoFocus && items?.length === 0) {
      setTimeout(() => selectRef?.current?.focus(), 100);
    }
  }, [autoFocus, items?.length]);

  useEffect(() => {
    if (selector.focused === getIn18Text('ZHENGWEN')) {
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

  // 通过通讯录填入收件人
  const addItem = useCallback(
    async (list: ContactItem[]) => {
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
        setTimeout(() => selectRef?.current?.focus(), 50);
      }
    },
    [selectedItems, type]
  );

  // 给外部提供的方法，属性
  useImperativeHandle(ref, () => ({
    focus: () => selectRef?.current?.focus(),
    blur: () => selectRef?.current?.blur(),
    get wrapperHeight() {
      return refSelectWrapper?.current?.children[0]?.clientHeight || 44;
    },
  }));

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
            onKeyDown={handleKeyDown}
            maxTagPlaceholder={() => `共${selectedItems.size}人`}
            open={Boolean(keyword && options.length)}
            optionFilterProp="search"
            maxTagCount={maxTagCount}
            // {...maxTagCountProps}
            onFocus={onFocus}
            onBlur={onBlur}
            options={options}
            filterOption={true}
            labelInValue
            ref={selectRef}
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
