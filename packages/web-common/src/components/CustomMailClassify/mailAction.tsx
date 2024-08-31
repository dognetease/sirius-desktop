import React, { useEffect, useState, ReactElement, useCallback, useMemo, useRef } from 'react';
import { Select, TreeSelect, Tag, Input, Form, FormInstance, Empty, Tooltip, Modal, Divider } from 'antd';
import {
  apiHolder as api,
  apis,
  AccountApi,
  MailTag,
  MailClassifyRuleBehavior,
  MailBoxModel,
  EntityMailBox,
  ContactApi,
  emailPattern,
  reDefinedColorListNew,
  reDefinedColorList,
} from 'api';
import { useActions, useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import _remove from 'lodash/remove';
// import CircleSubIcon from '@web-common/components/UI/Icons/svgs/CircleSub';
// import CirclePlusIcon from '@web-common/components/UI/Icons/svgs/CirclePlus';
import { ContactItem } from '@web-common/utils/contact_util';
import ContactScheduleModal from '@web-common/components/UI/SiriusContact/scheduleModal';
import CircleSubIcon from '@ant-design/icons/MinusCircleFilled';
import CirclePlusIcon from '@ant-design/icons/PlusCircleFilled';
import TriangleDownIcon from '@web-common/components/UI/Icons/svgs/TriangleDown';
import ArrowLeftIcon from '@web-common/components/UI/Icons/svgs/disk/ArrowLeft';
import { AddTagIcon, MailTagIcon, TagCheckedIconInMenu } from '@web-mail/components/MailTagList/Icon';
import { DataNode } from 'antd/lib/tree';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { folderIdIsContact, folderNameValidate, getNoRepeatFolderNameByMumber, iconMap, operCheck, getTreeStatesByAccount } from '@web-mail/util';
import classNames from 'classnames';
import MobileBindModal from '@web-account/Login/modal/bindMobile';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { TagModal } from '@web-mail/components/MailTagList/MailTag';
import styles from './mailAction.module.scss';
import useGetFolderTree from './useGetFolderTree';
import { getIn18Text } from 'api';

const { Option } = Select;
const { TextArea } = Input;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
enum mailActionEnum {
  move = 'move',
  forward = 'forward',
  tags = 'tags',
  top = 'top',
  read = 'read',
  flags = 'flags',
  reply = 'reply',
  reject = 'reject',
  validation = 'validation',
}
enum mailActionValue {
  move = getIn18Text('YIDONGYOUJIANZHI'),
  tags = getIn18Text('TIANJIABIAOQIAN'),
  top = getIn18Text('SHEWEIZHIDINGYOU'),
  flags = getIn18Text('TIANJIAHONGQI'),
  read = getIn18Text('BIAOWEIYIDU'),
  reply = getIn18Text('ZIDONGHUIFU'),
  reject = getIn18Text('JUSHOU'),
}
const ADD_FOLDER_ID = -999;
interface AutoReplyProps {
  replyMsg?: string;
  onChange: (text: string) => void;
}
const tag = '[MailTagsTree]';
const AutoReply: React.FC<AutoReplyProps> = ({ replyMsg, onChange }) => {
  useEffect(
    () => () => {
      // setSelectedMenuKey(undefined);
      onChange('');
    },
    []
  );
  const onContentChange = useCallback(e => {
    console.log(tag, 'onContentChange', e);
    onChange(e.target?.value);
  }, []);
  return (
    <Form.Item
      name="action_reply"
      rules={[
        {
          validator: (_, value) => {
            if (!value || value?.trim() === '') {
              return Promise.reject(new Error(getIn18Text('QINGSHURUNEIRONG')));
            }
            return Promise.resolve();
          },
        },
      ]}
    >
      <TextArea
        className={styles.txtReply}
        placeholder={getIn18Text('QINGSHURUNEIRONG')}
        autoFocus
        onChange={onContentChange}
        value={replyMsg}
        maxLength={2000}
        autoSize={{ minRows: 1, maxRows: 10 }}
      />
    </Form.Item>
  );
};
interface mailFolderDropdownProps {
  treeList: MailBoxModel[];
  selectedKey: number | undefined;
  onSelect: (selectedKey: number | undefined) => void;
  onAddFolder: (node: EntityMailBox) => void;
}
const MailFolderDropdown: React.FC<mailFolderDropdownProps> = props => {
  const { selectedKey, treeList, onSelect, onAddFolder } = props;
  // 加入新建文件夹项
  const treeListPlus = useMemo(() => {
    return treeList.concat([
      {
        childrenCount: 0,
        entry: {
          mailBoxName: getIn18Text('XINJIANWENJIANJIA'),
          mailBoxId: ADD_FOLDER_ID,
        } as EntityMailBox,
      },
    ]);
  }, [treeList]);
  const [selectedMenuKey, setSelectedMenuKey] = useState<number | undefined>(selectedKey);
  const ref = useRef<HTMLDivElement>(null);
  const onSelectMenuFid = useCallback(
    key => {
      setSelectedMenuKey(key);
      ref.current?.blur();
    },
    [setSelectedMenuKey]
  );
  const renderTreeNodeTitle = (node: EntityMailBox) => {
    const isAddFolder = node.mailBoxId === ADD_FOLDER_ID;
    const isCustomFolder = node.mailBoxId >= 100;
    const eventBind = {
      onClick: (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        onAddFolder(node);
      },
    };
    return (
      <div className={styles.dropdownNodeWrap} {...(isAddFolder ? eventBind : {})}>
        <div className={styles.dropdownNodeName}>
          {isAddFolder ? <ReadListIcons.AddFolderSvg /> : <ReadListIcons.FolderSvg />}
          <span className={classNames(styles.dropdownNodeText, isAddFolder ? styles.dropdownNodeTextBlue : '')}>{node.mailBoxName}</span>
        </div>
        {isCustomFolder && (
          <div className={styles.operWrap}>
            <Tooltip title={getIn18Text('XINJIANZIWENJIAN')} trigger={['hover']}>
              <div
                className={styles.dropdownTreeAdd}
                onClick={e => {
                  e.stopPropagation();
                  onAddFolder(node);
                }}
              >
                <AddTagIcon />
              </div>
            </Tooltip>
          </div>
        )}
      </div>
    );
  };
  const data2tree = (list: MailBoxModel[]) => {
    const array = [-1, -9, 17, 19];
    return _remove(list.slice(), item => array.indexOf(item.entry.mailBoxId) < 0 && !folderIdIsContact(item.entry.mailBoxId) && item.entry.mailBoxId > 0).map(data => {
      const treeNode: DataNode = {
        key: data.entry.mailBoxId,
        // @ts-ignore treeData需要有value
        value: data.entry.mailBoxId,
        label: renderTreeNodeTitle(data.entry),
        isLeaf: !data.children?.length,
        icon: iconMap.get(data.entry?.mailBoxId),
        selectable: data.entry.mailBoxId !== ADD_FOLDER_ID,
        // value: data.entry.mailBoxId + '',
      };
      if (!treeNode.isLeaf && data.children && data.children.length > 0) {
        treeNode.children = data2tree(data.children);
      }
      return treeNode;
    });
  };
  const list = useMemo(() => data2tree(treeListPlus), [treeList]);
  // 邮箱文件夹列表
  // const [treeList, setFolderList] = useState<DataNode[]>(list);
  useEffect(
    () => () => {
      setSelectedMenuKey(undefined);
      onSelect(undefined);
    },
    []
  );
  const tagRender = (props: any) => {
    const { label } = props;
    return (
      <div className={styles.mailFolderLabel}>
        <span className={styles.mailFolderTxt}>{label}</span>
      </div>
    );
  };
  return (
    <Form.Item name="action_choose_folder" initialValue={selectedMenuKey} rules={[{ required: true, message: getIn18Text('QINGXUANZEWENJIAN') }]}>
      <TreeSelect
        ref={ref}
        getPopupContainer={node => node.parentElement}
        suffixIcon={<TriangleDownIcon />}
        showSearch={false}
        style={{ width: '100%' }}
        tagRender={tagRender}
        // @ts-ignore declear 声明未更新导致报错
        mode="tags"
        maxTagCount={1}
        placeholder={getIn18Text('XUANZEWENJIANJIA')}
        treeData={list}
        onSelect={onSelectMenuFid}
      />
    </Form.Item>
  );
};
interface MailTagsTreeProps {
  selectedKeys: string[];
  tagList: Map<
    string,
    {
      color: string | undefined;
      fontColor: string;
      originColor?: string;
      class: string;
    }
  >;
  onSelect: (tags: string[]) => void;
  onAddTag: () => void;
}
const MailTagsTree: React.FC<MailTagsTreeProps> = props => {
  const { selectedKeys, onSelect, onAddTag, tagList } = props;
  const onChange = useCallback(e => {
    console.log(tag, 'onChange', e);
    onSelect(e);
  }, []);
  useEffect(
    () =>
      // 销毁时消除状态
      () => {
        onSelect([]);
      },
    []
  );
  const tagRender = (props: any) => {
    const { value, onClose } = props;
    return (
      <Tag
        color={tagList.get(value)?.color}
        key={value}
        className={styles.selectTag}
        closeIcon={
          <div
            className={styles.tagExtra}
            onClick={() => {
              onClose && onClose();
            }}
            style={{ backgroundColor: tagList.get(value)?.color }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.25 7.75L5 5M5 5L2.25 2.25M5 5L7.75 7.75M5 5L7.75 2.25" stroke="white" strokeLinejoin="round" />
            </svg>
          </div>
        }
        closable
        onClose={onClose}
        style={{ color: tagList.get(value)?.fontColor, marginRight: 3 }}
      >
        {value}
      </Tag>
    );
  };
  const addItem = useCallback(
    e => {
      e.preventDefault();
      onAddTag();
    },
    [onAddTag]
  );
  return (
    <Form.Item
      name="action_tags"
      rules={[
        { required: true, message: getIn18Text('QINGXUANZEBIAOQIAN') },
        {
          validator: (_, value) => {
            if (value instanceof Array && value.length > 10) {
              return Promise.reject(new Error(getIn18Text('ZUIDUOXUANZE1')));
            }
            return Promise.resolve();
          },
        },
      ]}
      initialValue={selectedKeys}
    >
      <Select
        suffixIcon={<TriangleDownIcon />}
        mode="multiple"
        className={styles.tagSelectTree}
        filterOption={false}
        tagRender={tagRender}
        onChange={onChange}
        notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={getIn18Text('ZANWUBIAOQIAN')} />}
        placeholder={getIn18Text('QINGXUANZEBIAOQIAN')}
        defaultValue={selectedKeys}
        getPopupContainer={node => node.parentElement}
        // style={{ width: '100%' }}
        dropdownMatchSelectWidth={false}
        dropdownStyle={{ minWidth: 200 }}
        menuItemSelectedIcon={<TagCheckedIconInMenu />}
        listHeight={166}
        dropdownRender={menu => (
          <>
            <div className={styles.tagDropdownLabel}>
              <span>{getIn18Text('XUANZEBIAOQIAN')}</span>
            </div>
            {menu}
            <Divider style={{ margin: '4px 5px' }} />
            <div className={styles.tagCreate} onClick={addItem}>
              <span className={styles.tagCreateIcon}>
                <AddTagIcon />
              </span>
              <span className={styles.tagOptionSpan}>{getIn18Text('TIANJIABIAOQIAN')}</span>
            </div>
          </>
        )}
      >
        {Array.from(tagList).map(([key, item]) => (
          <Option value={key} key={key}>
            <div className={styles.tagOption}>
              <MailTagIcon className="tag-icon" strokeColor={item.originColor} checked={selectedKeys.includes(key)} />
              <span className={styles.tagOptionSpan}>{key}</span>
            </div>
          </Option>
        ))}
      </Select>
    </Form.Item>
  );
};

const ForwardMail: React.FC<any> = props => {
  const { selectedKey } = props;
  const [selectedKeys, setSelectedKeys] = useState<ContactItem[]>([]);
  useEffect(() => {
    if (selectedKey) {
      contactApi
        .doGetContactByItem({
          type: 'EMAIL',
          value: [selectedKey],
          filterType: 'enterprise',
          _account: accountApi.getCurrentAccount().email,
        })
        .then(res => {
          let selectedKeys = res.map(itm => ({
            name: itm?.contact?.contactName,
            email: itm?.contact?.accountName,
          })) as ContactItem[];
          if (!selectedKeys.length) {
            selectedKeys = [
              {
                name: selectedKey,
                email: selectedKey,
              },
            ] as ContactItem[];
          }
          setSelectedKeys(selectedKeys);
        });
    }
  }, [selectedKey]);
  return (
    <div className={styles.forwardNodeWrap}>
      <span className={styles.forwardDescGray}>转发到邮箱</span>
      <Form.Item
        name="action_forward"
        rules={[
          { required: true, message: getIn18Text('QINGSHURUNEIRONG') },
          {
            validator: (_, value) => {
              if (!Array.isArray(value)) {
                return Promise.resolve();
              }
              const trimValueList = value.filter((item: ContactItem) => item?.email?.trim());
              const character1 = trimValueList?.find((item: ContactItem) => item?.email?.indexOf('\\') > -1) ? '\\' : '';
              const character2 = trimValueList?.find((item: ContactItem) => item?.email?.indexOf('"') > -1) ? '"' : '';
              if (character1 && character2) {
                return Promise.reject(new Error(`不支持保存特殊字符${character1}和${character2}，请修改`));
              }
              if (character1 || character2) {
                return Promise.reject(new Error(`不支持保存特殊字符${character1 || character2}，请修改`));
              }
              if (trimValueList?.length > 1) {
                return Promise.reject(new Error(getIn18Text('NEIRONGBUDECHAO1')));
              }
              if (trimValueList && trimValueList[0]?.email && !emailPattern.test(trimValueList[0]?.email)) {
                return Promise.reject(new Error(getIn18Text('YOUXIANGGESHICUO1')));
              }
              return Promise.resolve();
            },
          },
        ]}
        initialValue={selectedKeys}
      >
        <ContactScheduleModal
          includeSelf
          hideAvatar
          unSelect
          multiRow
          allowClear
          repeatToast
          ceiling={30}
          defaultSelectList={selectedKeys}
          placeholder={getIn18Text('KESHURUYOUXIANG')}
          style={{ minHeight: 32 }}
          characterLimit={50}
        />
      </Form.Item>
    </div>
  );
};

const ForwardValidation: React.FC<any> = props => {
  // 定时器
  let timer: number | undefined;
  // 验证码倒计时
  const [codeLoadingCount, setCodeLoadingCount] = useState<number>(0);
  const [value, setValue] = useState<string>('');
  // 获取验证码
  const getCode = async () => {
    if (codeLoadingCount !== 0) {
      return;
    }
    let count = 60;
    setCodeLoadingCount(count);
    const res = await accountApi.doSendVerificationCode();
    if (res.success) {
      if (res?.count <= 0) {
        SiriusMessage.error({ content: '验证码获取失败，已达到上限，请稍后再试' });
        setCodeLoadingCount(0);
        return;
      }
      timer = setInterval(() => {
        if (count > 0) {
          count -= 1;
          setCodeLoadingCount(count);
        } else {
          clearInterval(timer);
          setCodeLoadingCount(0);
        }
      }, 1000);
    } else {
      SiriusMessage.error({ content: res.error });
      setCodeLoadingCount(0);
    }
  };
  useEffect(
    () => () => {
      setValue('');
      setCodeLoadingCount(0);
      clearInterval(timer);
    },
    []
  );
  return (
    <Form.Item name="action_forward_validation" rules={[{ required: true, message: getIn18Text('QINGSHURUYANZHENG') }]}>
      <div className={styles.validationNodeWrap}>
        <span className={styles.forwardDescGray}>{getIn18Text('YANZHENGMA')}</span>
        <Input
          value={value}
          onChange={e => setValue(e.target.value.replace(/[^0-9]+/g, ''))}
          className={styles.forwardInput}
          placeholder={getIn18Text('QINGSHURUDUANXIN')}
          maxLength={6}
        />
        {codeLoadingCount ? (
          <span className={styles.forwardDescGray}>
            {codeLoadingCount}
            s后可重新获取
          </span>
        ) : (
          <span className={styles.forwardDescOperate} onClick={() => getCode()}>
            免费获取验证码
          </span>
        )}
      </div>
    </Form.Item>
  );
};
interface CreateMailFolderModalProps {
  node: EntityMailBox;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  createSuccess: (mailBoxId?: number) => void;
}
export const CreateMailFolderModal: React.FC<CreateMailFolderModalProps> = ({ node, visible, setVisible, createSuccess }) => {
  const [folderName, setFolderName] = useState<string>(getIn18Text('WEIMINGMINGWENJIAN'));
  const dispatch = useAppDispatch();
  const inputRef = React.useRef<any>(null);
  const [confirmLoading, setConfirmLoading] = React.useState(false);
  useEffect(() => {
    if (visible) {
      // @ts-ignore EntityMailBox 加了一个folderName
      setFolderName(node.folderName);
      // 默认选中
      setTimeout(() => {
        inputRef.current?.focus({
          cursor: 'all',
        });
      }, 200);
    }
  }, [visible]);
  const handleOk = useCallback(() => {
    if (!folderNameValidate(folderName)) {
      return;
    }
    setConfirmLoading(true);
    dispatch(
      Thunks.createUserFolder([
        {
          parent: node.mailBoxId,
          name: folderName,
        },
      ])
    ).then(res => {
      setConfirmLoading(false);
      if (res.meta.requestStatus === 'fulfilled') {
        SiriusMessage.success({ content: getIn18Text('TIANJIACHENGGONG') });
        createSuccess(
          (
            res.payload as unknown as {
              res: Array<number>;
            }
          )?.res[0]
        );
        setVisible(false);
        setFolderName('');
      }
    });
  }, [node, folderName]);
  const handleCancel = () => {
    console.log('Clicked cancel button');
    setVisible(false);
  };
  return (
    <Modal
      wrapClassName={styles.mailAction}
      closable={false}
      className={styles.newFolderModal}
      okText={getIn18Text('QUEDING')}
      cancelText={getIn18Text('QUXIAO')}
      mask={false}
      maskClosable={false}
      title={
        <div className={styles.newFolderTitle} onClick={handleCancel}>
          <span className={styles.backIcon}>
            <ArrowLeftIcon />
          </span>
          <span className={styles.title}>{node.mailBoxId == ADD_FOLDER_ID ? getIn18Text('XINJIANWENJIANJIA') : getIn18Text('XINJIANZIWENJIAN')}</span>
        </div>
      }
      centered
      style={{ height: 213, width: 400 }}
      visible={visible}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      onCancel={handleCancel}
    >
      <div className={styles.newFolderDesc} hidden={node.mailBoxId == ADD_FOLDER_ID}>
        {getIn18Text('ZAI')}
        <span className={styles.parentFolderSpan}>
          <ReadListIcons.FolderSvg />
          {node.mailBoxName.length > 20 ? `${node.mailBoxName.substring(0, 20)}...` : node.mailBoxName}
        </span>
        {getIn18Text('ZHONGXINJIANZIWEN')}
      </div>
      <div className={styles.newFolderInput}>
        <Input
          ref={inputRef}
          autoFocus
          maxLength={40}
          placeholder={getIn18Text('QINGSHURUWENJIAN')}
          value={folderName}
          onChange={e => {
            setFolderName(e.target.value);
          }}
        />
      </div>
    </Modal>
  );
};
interface mailActionProps {
  onActionSelect?: (actions: any) => void;
  // 编辑执行时传入进行回显
  actions?: MailClassifyRuleBehavior[];
  form: FormInstance<any>;
  onSubModalVisible?: (visible: boolean) => void;
}
/**
 * 执行规则
 * @returns
 */
export const MailAction: React.FC<mailActionProps> = props => {
  const { onActionSelect = () => {}, onSubModalVisible = () => {}, actions = [], form } = props;
  // 已经选择执行规则
  const [selectedAction, setSelectedAction] = useState<mailActionEnum[]>([mailActionEnum.move]);
  const actionOps = [mailActionEnum.move, mailActionEnum.tags, mailActionEnum.top, mailActionEnum.flags, mailActionEnum.read, mailActionEnum.reply];
  // const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
  // const mailTagList = useAppSelector(state => state.mailReducer.mailTagList);
  const mailTreeStateMap = useAppSelector(state => state.mailReducer.mailTreeStateMap);

  const mailTagList = useMemo(() => {
    const folderState = getTreeStatesByAccount(mailTreeStateMap || '');
    if (folderState && folderState?.mailTagList) {
      return folderState?.mailTagList;
    }
    return [];
  }, [mailTreeStateMap]);

  const [actionsVisible, setActionsVisible] = useState<boolean>(true);
  const [mailMoveFolderVal, setMailMoveFoldernVal] = useState<number | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedForward, setSelectedForward] = useState<string>('');
  const [replyMsg, setReplyMsg] = useState<string>('');
  const [mailTagMap, setMailTagMap] = useState<Map<string, any>>(new Map());
  const treeList = useGetFolderTree();
  const [newfolerModalVisible, setNewfolerVisible] = useState<boolean>(false);
  const [nodeFolder, setNodeFolder] = useState<EntityMailBox>({ pid: -2, mailBoxId: -2, mailBoxName: '' } as EntityMailBox);
  const [addTagModalVisible, setAddTagVisible] = useState<boolean>(false);
  // 绑定信息，包括转发权限和绑定账号
  const [accountInfo, setAccountInfo] = useState<Record<string, any>>({});
  // 控制绑定手机号弹窗
  const { setVisibleMobileBindModal } = useActions(LoginActions);
  const setNewfolerModalVisible = (visible: boolean) => {
    onSubModalVisible(visible);
    setNewfolerVisible(visible);
  };
  const setAddTagModalVisible = (visible: boolean) => {
    onSubModalVisible(visible);
    setAddTagVisible(visible);
  };
  // const refreshFolder = () => {
  //   MailApi.doListMailBox()
  //     .then(res => {
  //       setFolderList(res);
  //     })
  //     .catch(err => {
  //       console.log('mailAction.tsx refreshFolder error', err);
  //     });
  // };
  // const MailFolderDropdownMemo = useMemo(() => {
  //   return MailFolderDropdown;
  // }, []);
  // const MailTagsTreeMemo = useMemo(() => {
  //   return MailTagsTree;
  // }, []);
  const tag = '[MailAction]';
  useEffect(
    () =>
      // refreshFolder();
      () => {
        // resetActionFieldVal(mailActionEnum.move);
        [mailActionEnum.reject, mailActionEnum.move, mailActionEnum.reply, mailActionEnum.tags, mailActionEnum.forward].forEach(resetActionFieldVal);
      },
    []
  );
  useEffect(() => {
    // actions = mockRes.actions
    if (actions.length > 0) {
      const backfillSelect: mailActionEnum[] = [];
      actions.forEach((action: any) => {
        switch (action.type as unknown as mailActionEnum) {
          case mailActionEnum.tags:
            backfillSelect.unshift(mailActionEnum.tags);
            setSelectedTags(action.value);
            form.setFieldsValue({ action_tags: action.value });
            break;
          case mailActionEnum.reply:
            backfillSelect.unshift(mailActionEnum.reply);
            // setReplyMsg(action.content);
            form.setFieldsValue({ action_reply: action.content });
            break;
          case mailActionEnum.flags:
            if (action.disabled) {
              break;
            }
            if (action.value.read) {
              backfillSelect.unshift(mailActionEnum.read);
            }
            if (action.value.top) {
              backfillSelect.unshift(mailActionEnum.top);
            }
            if (action.value.label0) {
              backfillSelect.unshift(mailActionEnum.flags);
            }
            break;
          case mailActionEnum.move:
            if (action.disabled) {
              break;
            }
            backfillSelect.unshift(mailActionEnum.move);
            setMailMoveFoldernVal(Number(action.target));
            form.setFieldsValue({ action_choose_folder: Number(action.target) });
            break;
          case mailActionEnum.reject:
            // backfillSelect.push(mailActionEnum.reject);
            form.setFieldsValue({ action_type: 'reject' });
            setActionsVisible(false);
            break;
          case mailActionEnum.forward:
            backfillSelect.unshift(mailActionEnum.forward);
            setSelectedForward(action.target);
            form.setFieldsValue({
              action_type: 'forward',
              action_forward: [
                {
                  name: action.target,
                  email: action.target,
                },
              ],
            });
            break;
          default:
            break;
        }
      });
      setSelectedAction([...backfillSelect]);
    }
  }, [actions]);
  const getAccountBindAndForwardInfo = async () => {
    const res = await accountApi.doGetAccountBindAndForwardInfo();
    res?.bindInfo && setAccountInfo(res);
  };
  useEffect(() => {
    getAccountBindAndForwardInfo();
  }, []);
  // 邮件移动至下拉变化
  const onFolderDropdownChange = useCallback(selectedKey => {
    console.log(tag, getIn18Text('YOUJIANYIDONGZHI'), selectedKey);
    setMailMoveFoldernVal(selectedKey);
    // form.setFieldsValue({ action_choose_folder: selectedKey ? Number(selectedKey) : selectedKey });
  }, []);
  const onTagSelect = useCallback((tags: string[]) => {
    console.log(tag, getIn18Text('BIAOQIANBIANHUA'), tags);
    setSelectedTags(tags);
    // form.setFieldsValue({ action_tags: tags });
  }, []);
  const onMailFolderAdd = useCallback(
    (node: EntityMailBox) => {
      console.log(tag, 'onMailFolderAdd', node);
      if (!operCheck(treeList, node)) {
        return;
      }
      const folderNode = {
        ...node,
        folderName: getNoRepeatFolderNameByMumber(treeList, node.mailBoxId, getIn18Text('WEIMINGMINGWENJIAN'), node.mailBoxId),
      };
      setNodeFolder(folderNode);
      setNewfolerModalVisible(true);
    },
    [treeList]
  );
  // 当某一个‘执行’下拉选择变化
  const onActionChange = useCallback((actionName: string) => {
    switch (actionName) {
      case 'normal':
        setActionsVisible(true);
        setSelectedAction([mailActionEnum.move]);
        break;
      case 'forward':
        setActionsVisible(true);
        setSelectedAction([mailActionEnum.forward]);
        break;
      case 'reject':
        onActionSelect([{ type: 'reject' }]);
        setActionsVisible(false);
        // form.setFieldsValue({ actionTypes: 'reject' });
        break;
      default:
        break;
    }
  }, []);
  // 当某个普通规则下拉列表值发生变化
  const onNormalActionChange = useCallback(
    (actionName: mailActionEnum, index: number) => {
      setSelectedAction(state => {
        const list = [...state];
        resetActionFieldVal(list[index]);
        list.splice(index, 1, actionName);
        onActionSelect(list);
        return list;
      });
    },
    [onActionSelect]
  );
  // 当自动回复内容变更
  const onReplyChange = useCallback((content: string) => {
    console.log(tag, getIn18Text('BIAOQIANBIANHUA'), content);
    // form.setFieldsValue({ action_reply: content });
    setReplyMsg(content);
  }, []);
  // bc
  const onMailFolderCreated = useCallback(
    (mailFolderBoxId?: number) => {
      console.log('onMailFolderCreated', mailFolderBoxId);
      if (mailFolderBoxId) {
        form.setFieldsValue({ action_choose_folder: mailFolderBoxId });
        onActionSelect(selectedAction);
        // refreshFolder();
      }
    },
    [onActionSelect]
  );
  const resetActionFieldVal = (actionName: mailActionEnum) => {
    switch (actionName) {
      case mailActionEnum.move:
        form.setFieldsValue({ action_choose_folder: undefined });
        break;
      case mailActionEnum.reply:
        form.setFieldsValue({ action_reply: '' });
        break;
      case mailActionEnum.tags:
        form.setFieldsValue({ action_tags: [] });
        break;
      case mailActionEnum.reject:
        form.setFieldsValue({ action_type: 'normal' });
        break;
      case mailActionEnum.forward:
        form.setFieldsValue({ action_forward: '' });
        break;
    }
  };
  const options = useMemo(() => {
    mailTagList.forEach((item: MailTag) => {
      if (!mailTagMap.has(item[0])) {
        const strokeColor = reDefinedColorListNew.find(innerItem => innerItem.nums.includes(item[1]?.color));
        const originTag = reDefinedColorList.find(innerItem => innerItem.nums.includes(item[1]?.color));
        const colorClassName = strokeColor?.className || 'color1';
        const originColor = originTag?.color || '#6BA9FF';
        const tagFontColor = strokeColor?.fontColor || '#fff';
        mailTagMap.set(item[0], { color: strokeColor?.color, originColor, fontColor: tagFontColor, class: colorClassName });
      }
    });
    setMailTagMap(mailTagMap);
    return mailTagMap;
  }, [mailTagList?.length]);
  /**
   * 当操作增加或删除规则（点击’加减’操作符号）
   * param actionName 不为空则是删除，为空则是新增
   */
  const onOperationChange = useCallback(
    (index: number, actionName?: mailActionEnum) => {
      // 删除
      if (actionName && selectedAction.includes(actionName)) {
        if (selectedAction.length > 1) {
          resetActionFieldVal(actionName);
          setSelectedAction(state => {
            const list = [...state].filter(item => item !== actionName);
            onActionSelect(list);
            return list;
          });
        }
      } else {
        // 新增
        const newAction = actionOps.find(item => !selectedAction.includes(item));
        if (newAction) {
          setSelectedAction(state => {
            const list = [...state];
            if (list.length - 1 === index) {
              list.push(newAction);
            } else {
              list.splice(index + 1, 0, newAction);
            }
            onActionSelect(list);
            return list;
          });
        }
      }
    },
    [selectedAction, setSelectedAction, onActionSelect]
  );
  // 标签回填
  const onTagAdded = useCallback(
    tagName => {
      // tagList redux更新后回填
      setTimeout(() => {
        setSelectedTags(tags => {
          const _tags = [...tags, tagName];
          form.setFieldsValue({ action_tags: _tags });
          return _tags;
        });
      }, 500);
    },
    [form, setSelectedTags]
  );
  const generateActionSlot = (actionName: mailActionEnum) => {
    let rcSlot: ReactElement = <></>;
    switch (actionName) {
      case mailActionEnum.move:
        rcSlot = <MailFolderDropdown treeList={treeList} onSelect={onFolderDropdownChange} onAddFolder={onMailFolderAdd} selectedKey={mailMoveFolderVal} />;
        break;
      case mailActionEnum.reply:
        rcSlot = <AutoReply onChange={onReplyChange} replyMsg={replyMsg} />;
        break;
      case mailActionEnum.tags:
        rcSlot = <MailTagsTree selectedKeys={selectedTags} tagList={options} onAddTag={() => setAddTagModalVisible(true)} onSelect={onTagSelect} />;
        break;
      case mailActionEnum.forward:
        rcSlot = <ForwardMail selectedKey={selectedForward} />;
        break;
      case mailActionEnum.validation:
        rcSlot = <ForwardValidation />;
    }
    return rcSlot;
  };
  // 绑定手机号成功的回调
  const mobileBindSuccess = () => {
    setVisibleMobileBindModal(false);
    getAccountBindAndForwardInfo();
  };
  const mailActionRef = useRef<HTMLDivElement>(null);
  return (
    <div className={styles.mailAction} ref={mailActionRef}>
      <div className={styles.actionDesc}>
        <span className={styles.actionLabel}>{getIn18Text('ZEZHIXING')}</span>
        <Form.Item name="action_type" initialValue="normal">
          <Select getPopupContainer={node => node.parentElement} suffixIcon={<TriangleDownIcon />} defaultValue="normal" style={{ width: 128 }} onChange={onActionChange}>
            <Option value="normal">{getIn18Text('PUTONGGUIZE')}</Option>
            <Option value="forward" disabled={accountInfo?.forwardInfo?.fwd !== 1}>
              {/* tooltip箭头隐藏样式被全局覆盖了 */}
              <Tooltip
                title={accountInfo?.forwardInfo?.fwd !== 1 ? '暂无权限，请联系公司管理员' : ''}
                placement="right"
                getPopupContainer={() => mailActionRef.current as HTMLDivElement}
              >
                转发到其他邮箱
              </Tooltip>
            </Option>
            <Option value="reject">{getIn18Text('JUSHOU')}</Option>
          </Select>
        </Form.Item>
      </div>
      {actionsVisible ? (
        <div className={styles.actionListDiv}>
          {selectedAction.map((item: mailActionEnum, index, list) => {
            if (item === mailActionEnum.forward) {
              // 不需要手机验证
              if (accountInfo?.forwardInfo?.fwdmauth !== 1) {
                return (
                  <div className={styles.actionItemBinded}>
                    <div className={styles.itemSlot}>{generateActionSlot(item)}</div>
                  </div>
                );
              }
              // 未绑定手机号且开启了手机验证
              if (!accountInfo?.bindInfo?.mobile) {
                return (
                  <div className={styles.actionItemBind}>
                    <p className={styles.actionItemBindTitle}>绑定手机号</p>
                    <p className={styles.actionItemBindDesc}>为了避免自动转发可能造成的重要信息泄漏，需先关联手机号，并进行短信验证</p>
                    <p className={styles.actionItemBindBtn} onClick={() => setVisibleMobileBindModal(true)}>
                      立即绑定
                    </p>
                  </div>
                );
              }
              // 绑定了手机号且开启了手机验证
              return (
                <div className={classNames(styles.actionItemBinded, styles.actionItemBindedTip)}>
                  <div className={styles.itemSlot}>{generateActionSlot(item)}</div>
                  <div className={styles.forwardMobileWrap}>
                    <span className={styles.forwardDescGray}>绑定手机号</span>
                    <div>
                      <span className={styles.forwardDescMobile}>{accountInfo?.bindInfo?.mobile?.slice(-11).replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
                      <span className={styles.forwardDescOperate} onClick={() => setVisibleMobileBindModal(true)}>
                        {getIn18Text('XIUGAI')}
                      </span>
                      <span className={styles.forwardDescGrayLight}>为避免重要信息泄漏，需进行手机短信验证</span>
                    </div>
                  </div>
                  <div className={styles.itemSlot}>{generateActionSlot(mailActionEnum.validation)}</div>
                </div>
              );
            }
            return (
              <Form.Item name={'action_type_' + item} initialValue={item} className={styles.actionFormItem}>
                <div className={styles.actionItem}>
                  <Select
                    getPopupContainer={node => node.parentElement}
                    suffixIcon={<TriangleDownIcon />}
                    defaultValue={item}
                    key={item + index}
                    className={styles.itemSelect}
                    onChange={value => onNormalActionChange(value, index)}
                  >
                    {actionOps.map((action: mailActionEnum) => (
                      <Option disabled={action !== item && selectedAction.includes(action)} value={action}>
                        {mailActionValue[action]}
                      </Option>
                    ))}
                  </Select>
                  <div className={styles.itemSlot}>{generateActionSlot(item)}</div>
                  <div
                    className={styles.itemOperationBtn}
                    onClick={() => {
                      onOperationChange(index, item);
                    }}
                  >
                    <CircleSubIcon style={{ color: 'rgb(163, 164, 169)', opacity: list.length === 1 ? 0.5 : 1 }} />
                  </div>
                  <div
                    className={styles.itemOperationBtn}
                    onClick={() => {
                      onOperationChange(index);
                    }}
                  >
                    <CirclePlusIcon style={{ color: 'rgb(56, 110, 231)', opacity: list.length === actionOps.length ? 0.5 : 1 }} />
                  </div>
                </div>
              </Form.Item>
            );
          })}
        </div>
      ) : null}
      <MobileBindModal isBind={!accountInfo?.bindInfo?.mobile} isUpdate={!!accountInfo?.bindInfo?.mobile} onSuccess={() => mobileBindSuccess()} />
      <CreateMailFolderModal createSuccess={onMailFolderCreated} node={nodeFolder} setVisible={setNewfolerModalVisible} visible={newfolerModalVisible} />
      {/* 添加弹窗 */}
      {addTagModalVisible && (
        <TagModal
          type="add"
          data={[]}
          container={document.body}
          markWhenAdd={false}
          mask={false}
          maskClosable={false}
          onTagAdded={onTagAdded}
          afterClose={() => {
            setAddTagModalVisible(false);
          }}
        />
      )}
    </div>
  );
};
