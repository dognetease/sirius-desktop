/**
 *  文件夹树
 *  包含文件夹的新增，编辑，删除等基本功能及附带的命名，校验规则
 *  包含拖拽样式支持
 */
import React, { useRef, useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { cloneDeep } from 'lodash';
import { Dropdown, Menu } from 'antd';
import { MailBoxModel, EntityMailBox } from 'api';
import classnames from 'classnames';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import CaretDownOutlined from '@ant-design/icons/CaretDownOutlined';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import {
  iconMap,
  treeDFS,
  getTreeNodeById,
  folderNameValidate,
  isCustomFolder,
  folderId2String,
  folderId2Number,
  mailConfigStateIsMerge,
  folderAddOperCheck,
  validateFolderTreeCount,
  isMailFolderId,
  folderIdIsContact,
  folderCanShowUnread,
  folderIdIsContactGroup,
} from '../../util';
import { stringMap } from '../../types';
import { EventDataNode, DataNode } from '../../common/library/Tree';
import { FLOLDER } from '../../common/constant';
import { validateFolderHasRepeatNamePrue, getSystemTopFolder } from '../../state/customize';
import useCreateCallbackForEvent from '../../hooks/useCreateCallbackForEvent';
import useStateRef from '../../hooks/useStateRef';
import './tree.scss';
import EditTree, { ExportRefProps, customeNode } from './EditTree';
import { getIn18Text } from 'api';

/**
 * 空的MailBoxModel
 * todo: 其中某些属性已经没有必要了 mailBoxType - 这个类型去掉把
 */
const defaultMailBoxModel: MailBoxModel = {
  children: [],
  mailBoxId: 0,
  childrenCount: 0,
  _account: '',
  entry: {
    id: '',
    mailBoxName: '',
    mailBoxCurrentUnread: 0,
    mailBoxUnread: 0,
    mailBoxTotal: 0,
    mailBoxParent: 0,
    mailBoxId: 0,
    pid: 0,
    threadMailBoxCurrentUnread: 0,
    threadMailBoxTotal: 0,
    threadMailBoxUnread: 0,
    mailBoxType: 'customer',
    sort: 0,
    _deep: 1,
  },
};

interface FolderTreeProps {
  /**
   * 输入的文件夹数据
   */
  data: MailBoxModel[];
  /**
   * 选中的文件夹id
   */
  selectedKey: number;
  /**
   * 是否处于外部拖拽中
   */
  isOuterDrag?: boolean;
  /**
   * 文件夹的展开key
   */
  expandedKeys?: (string | number)[];
  /**
   * 拖拽摸模式
   */
  dragModel?: 'drag' | 'move';
  /**
   * 自定义文件夹name的渲染
   */
  folderNameRender?: (node: MailBoxModel) => React.ReactElement;
  /**
   * 未读数的自定义渲染
   */
  unReadRender?: (node: MailBoxModel, unRead: string | number) => React.ReactElement;
  /**
   * 操作按钮渲染
   */
  operBtnRender?: (node: MailBoxModel, defaultBtnElement: React.ReactElement) => React.ReactElement;
  // /**
  //  * 是否显示文件夹后的操作按钮
  //  */
  // disableOperBtn?: boolean;
  /**
   * 邮件与更多按钮显示的文件夹菜单
   */
  menu?: React.ReactElement | ((node: MailBoxModel) => React.ReactElement);
  /**
   * 是否可编辑
   */
  editAble?: boolean;
  /**
   * 节点添加时候的校验
   */
  validateOnAdd?: (tree: MailBoxModel[], node: MailBoxModel) => boolean;
  /**
   * 当有文件夹新增的时候的时候
   */
  onAddFolder?: (node: MailBoxModel, keyList: number[]) => Promise<any> | boolean;
  /**
   * 当有文件夹新增的时候的时候
   */
  onUpdateFolder?: (node: MailBoxModel) => Promise<any> | boolean;
  /**
   * 文件夹更新时候的校验
   */
  validateOnUpdate?: (tree: MailBoxModel[], node: MailBoxModel) => boolean;
  /**
   * 删除文件夹
   */
  onDeleteFolder?: (node: MailBoxModel) => Promise<any> | boolean;
  /**
   * 选中事件
   */
  onSelect?: (node: MailBoxModel) => void;
  /**
   * 文件夹的拖放事件
   */
  onDrop?: (param: { event: React.DragEvent; node: MailBoxModel; dragNode: MailBoxModel; dragNodesKeys: string[]; dropPosition: number; dropToGap: boolean }) => void;
  /**
   * 外部元素在文件夹上的拖放事件
   */
  onOuterDrop?: (param: { event: React.DragEvent; node: MailBoxModel }) => void;
  /**
   * 拖拽结束事件
   */
  onDragEnd?: (params: { event: React.DragEvent; node: MailBoxModel }) => void;
  /**
   * 拖拽开始事件
   */
  onDragStart?: (params: { event: React.DragEvent; node: MailBoxModel }) => void;
  /**
   * 文件夹展开事件
   */
  onExpand?: (expandedKeys: string[], params: { expanded: boolean; node: MailBoxModel }) => void;
  /**
   *
   */
  onRightClick?: (params: { event: React.MouseEvent; node: MailBoxModel }) => void;
  /**
   * 邮件拖拽的禁用判断方法
   */
  outerAllowDrop?: boolean | ((node: MailBoxModel) => boolean);
  /**
   * 外部主动设置是否处于聚合模式
   */
  isMerge?: boolean;
  /**
   * 点击TreeNode title的click
   */
  onNodeTitleClick?: (node: MailBoxModel) => void;
  /**
   * 节点是否可拖拽
   */
  draggable?: boolean | ((node: MailBoxModel) => boolean);
  /**
   * 节点是否可拖放
   */
  allowDrop?: boolean | ((dropNode: MailBoxModel, dragNode?: MailBoxModel | null) => boolean);
  /**
   * 文件夹树操作按钮是否显示
   */
  operBtnVisibility?: boolean | ((node: MailBoxModel, defaultRuleFn?: (node: MailBoxModel) => boolean) => boolean);
}

/**
 * 默认的新建文件夹验证规则
 */
const defaultValidateFolderChanged = (treeList: MailBoxModel[], node: MailBoxModel): boolean => {
  if (node && node.entry) {
    const { mailBoxName, pid = 0 } = node.entry;
    const parentNode = getTreeNodeById(treeList, pid);
    let brotherNodes: MailBoxModel[] = [];
    if (pid === 0) {
      brotherNodes = getSystemTopFolder(treeList);
    }
    if (pid !== 0 && parentNode) {
      brotherNodes = parentNode.children || [];
    }
    if (!folderNameValidate(mailBoxName)) {
      return false;
    }

    // 输入检测
    if (validateFolderHasRepeatNamePrue(brotherNodes, node)) {
      Message.warn({
        content: getIn18Text('YICUNZAITONGMING'),
        key: mailBoxName,
      });
      return false;
    }
  }
  return true;
};

/**
 * 对外暴露的方法-用于菜单混合
 */
export interface ExportFolderRefProps {
  addFolder: (number?: string) => void;
  appendFolder: (number?: string) => void;
  updateFolder: (number?: string) => void;
  deleteFolder: (number: string) => void;
}

const defaultOuterAllowDrop = () => true;

/**
 * 获取一个空的MailBoxModel
 */
const getEmptyMailBoxModel = (): MailBoxModel => cloneDeep(defaultMailBoxModel);

/**
 * 当前文件是否显示跟多的操作按钮
 */
const folderCanShowOperBtn = (node: MailBoxModel) => {
  const { mailBoxId } = node?.entry;
  // 非临时节点
  return mailBoxId != null;
};

/**
 * 按照邮件文件夹id返回文件夹图标
 */
const getMailFolderIcon = (id: number | string) => {
  if (isMailFolderId(id) && iconMap.get(id as number)) {
    return iconMap.get(id as number);
  }
  if (folderIdIsContact(id)) {
    if (folderIdIsContactGroup(id)) {
      // return iconMap.get(FLOLDER.STAR);
      return <ReadListIcons.StartGroupSvg />;
    }
    // 联系人文件夹与星标联系人虚拟文件夹的图标现阶段是一致的
    return iconMap.get(FLOLDER.STAR);
  }
  return <ReadListIcons.FolderSvg />;
};

/**
 * 文件夹可以拖拽的默认规则
 */
export const defaultFolderDragable = true;

/**
 * 文件夹树是否可以响应内部拖拽
 */
export const defalutFolderAllowDrop = (node: MailBoxModel) => {
  // 外部覆盖，看看把星标邮件的功能屏蔽融合进去。
  return node?.entry?.mailBoxId != FLOLDER.STAR;
};

/**
 * 默认是否显示文件夹操作按钮
 */
export const defaultOperBtnVisibility = (node: MailBoxModel) => {
  return folderCanShowOperBtn(node);
};

const FolderTree = forwardRef<ExportFolderRefProps, FolderTreeProps>((props, ref) => {
  const {
    data,
    selectedKey,

    expandedKeys,
    isOuterDrag = false,
    editAble = false,
    isMerge,
    menu,
    folderNameRender,
    unReadRender,
    operBtnRender,
    draggable = defaultFolderDragable,
    allowDrop = defalutFolderAllowDrop,
    operBtnVisibility = defaultOperBtnVisibility,

    onExpand,
    onRightClick,
    onDragStart,
    onDragEnd,
    onUpdateFolder,
    onDeleteFolder,
    onSelect,
    onNodeTitleClick,
    onAddFolder,
    onDrop,
    onOuterDrop,

    validateOnAdd = defaultValidateFolderChanged,
    validateOnUpdate = defaultValidateFolderChanged,

    outerAllowDrop = defaultOuterAllowDrop,
    dragModel,
  } = props;

  // 文件夹树-展开的key
  const [localExpandedKeys, setLocalExpandKeys] = useState<(number | string)[]>([]);
  // 可以接受邮件移动的文件夹IDMap
  // const [folderForbidMoveIdMap, setFolderForbidMoveIdMap] = useState(new Map());
  // 右键菜单是否展示
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  // 当前选中的节点Key
  const [menuActiveKey, setMenuActiveKey] = useState<number | string>(0);
  // 文件夹-更多菜单-是否显示
  const [folderDropDownVisiableId, setFolderDropDownVisiableId] = useState<number | null>();
  // 可编辑树的ref
  const editTreeRef = useRef<ExportRefProps | undefined>();
  // 文件夹树是否处于拖拽模式
  const [folderTreeIsDrag, setFolderTreeDrag] = useState(false);
  // 当前正在拖拽的文件夹
  const [draggingFolder, setDraggingFolder] = useState<MailBoxModel | undefined | null>();

  const unReadRenderRef = useStateRef(unReadRender);

  /**
   * 本地状态与props状态的综合
   * todo: 返回的文件夹id，类型不统一
   */
  // const logicOnExpand = useMemo(() => onExpand || setLocalExpandKeys, [onExpand, setLocalExpandKeys]);

  const logicExpandedKeys = useMemo(() => expandedKeys || localExpandedKeys, [expandedKeys, localExpandedKeys]);

  /**
   * 一次遍历计算出所需的内部状态
   * 1.组件内部缓存的NodeKey 到 Node 的映射
   * 2.节点可以拖放的id：bolean 的映射
   *
   */
  const [key2NodeMap, nodeAllowDropMap]: [{ [key: string]: MailBoxModel }, { [key: string]: boolean }] = useMemo(() => {
    const map: stringMap = {};
    const allowDropMap: stringMap = {};
    if (data) {
      // 设置本地数据对照
      const allowDropIsFn = typeof allowDrop === 'function';
      const allowDropIsBoolean = typeof allowDrop === 'boolean';
      treeDFS(data, (node: MailBoxModel) => {
        if (node?.entry?.mailBoxId) {
          map[node?.entry?.mailBoxId + ''] = node;
          // 计算是否可拖放
          if (allowDropIsFn) {
            allowDropMap[node?.entry?.mailBoxId + ''] = allowDrop(node, draggingFolder);
          } else if (allowDropIsBoolean) {
            return allowDrop;
          } else {
            allowDropMap[node?.entry?.mailBoxId + ''] = true;
          }
        }
      });
    }
    return [map, allowDropMap];
  }, [data, allowDrop, draggingFolder]);

  const key2NodeMapRef = useStateRef(key2NodeMap);

  /**
   * 文件夹移动是否禁止
   */
  // const forbidMoveFolder = useMemo(()=>{
  //   return !!forbidMoveFolderConfig?.disabled;
  // },[forbidMoveFolderConfig]);

  /**
   * 获取一个新的文件夹名称
   * node为即将新建的文件夹的父文件夹
   */
  const getNewFolderName = useCallback(
    (tree: DataNode[], node?: DataNode) => {
      const folderModel = node ? key2NodeMapRef?.current[node.key + ''] : null;
      let folderName = getIn18Text('WEIMINGMINGWENJIAN');
      const folderNameMap: stringMap = {};
      const mailBoxId = folderModel?.entry?.mailBoxId || 0;
      const curGroupFolderList = mailBoxId === 0 ? data : getTreeNodeById(data, mailBoxId)?.children;
      // 在当前节点下搜索，查找未命名文件夹，从1递增，直到找到一个未使用的数字
      let index = 0;
      curGroupFolderList?.forEach(item => {
        const { mailBoxName } = item.entry;
        if (mailBoxName && mailBoxName?.startsWith(folderName)) {
          folderNameMap[mailBoxName] = true;
        }
      });
      // 查找一个可用的文件夹名称
      while (true) {
        if (!folderNameMap[folderName + (index ? index.toString() : '')]) {
          folderName += index ? index.toString() : '';
          break;
        }
        index += 1;
      }
      return folderName;
    },
    [data]
  );

  /**
   * 获取编辑文件夹的名称
   * node为即将新建的文件夹的父文件夹
   */
  const getUpdateFolderName = useCallback(
    (tree: DataNode[], node?: DataNode) => {
      const folderModel = node ? key2NodeMapRef?.current[node.key + ''] : null;
      if (folderModel) {
        return folderModel?.entry?.mailBoxName || '';
      }
      return '';
    },
    [data]
  );

  /**
   * 右键菜单新建文件夹点击事件
   */
  const handleMenuAddFolder = useCallback(
    (avtiveKey?: number) => {
      const key = avtiveKey || menuActiveKey;
      const parentNode = key2NodeMapRef?.current[key + ''];
      if (folderAddOperCheck(data, parentNode)) {
        setMenuVisible(false);
        setMenuActiveKey(0);
        setTimeout(() => {
          editTreeRef?.current?.addNode(key + '');
        }, 0);
      }
    },
    [menuActiveKey]
  );

  // 创建用于外部ref调用的事件引用
  const addFolderForEvent = useCreateCallbackForEvent(handleMenuAddFolder);

  /**
   * 邮件菜单-创建平级兄弟文件夹
   */
  const handleMenuAppendFolder = useCallback(
    (avtiveKey?: number) => {
      const key = avtiveKey || menuActiveKey;
      // 校验文件夹最大数量
      if (validateFolderTreeCount(data)) {
        // setMenuVisible(false);
        // setMenuActiveKey(0);
        setTimeout(() => {
          editTreeRef?.current?.appendNode(key + '');
        }, 10);
      }
    },
    [menuActiveKey]
  );

  // 创建用于外部ref调用的事件引用
  const appendFolderForEvent = useCreateCallbackForEvent(handleMenuAppendFolder);
  /**
   * 右键菜单更新文件夹点击事件
   */
  const handleMenuUpdateFolder = useCallback(
    (avtiveKey?: number) => {
      const key = avtiveKey || menuActiveKey;
      const node = key2NodeMapRef?.current[key + ''];
      if (folderAddOperCheck(data, node)) {
        setMenuVisible(false);
        setMenuActiveKey(0);
        setTimeout(() => {
          editTreeRef?.current?.updateNode(key + '');
        }, 0);
      }
    },
    [menuActiveKey]
  );

  // 创建用于外部ref调用的事件引用
  const updateFolderForEvent = useCreateCallbackForEvent(handleMenuUpdateFolder);

  /**
   * 右键菜单更删除件夹点击事件
   */
  const handleMenuDeleteFolder = useCallback(
    (avtiveKey?: number) => {
      const key = avtiveKey || menuActiveKey;
      editTreeRef?.current?.deleteNode(key + '');
      setMenuVisible(false);
      setMenuActiveKey(0);
    },
    [menuActiveKey]
  );

  // 创建用于外部ref调用的事件引用
  const deleteFolderForEvent = useCreateCallbackForEvent(handleMenuDeleteFolder);

  /**
   * 默认的可编辑树文件夹邮件菜单
   */
  const defaultMenuElement = useMemo(
    () => (
      <Menu mode="horizontal">
        <Menu.Item key="add" onClick={handleMenuAddFolder}>
          新建
        </Menu.Item>
        <Menu.Item key="edit" onClick={handleMenuUpdateFolder}>
          编辑
        </Menu.Item>
        <Menu.Item key="delete" onClick={handleMenuDeleteFolder}>
          删除
        </Menu.Item>
      </Menu>
    ),
    [menuActiveKey]
  );

  /**
   * 处理tree的右键，做代理处理
   */
  const handleTreeRightClick = useCallback(
    (params: { e: React.MouseEvent; node: EventDataNode }) => {
      const { node } = params;
      if (node) {
        // antd 的tree对number类型的key支持有问题，所以需要转换为number
        const key = folderId2Number(node.key);
        setMenuActiveKey(key);
        // 代理调用外层props
        onRightClick && onRightClick(params);
        // 延迟触发弹窗
        setTimeout(() => {
          setMenuVisible(true);
        }, 0);
      }
    },
    [onRightClick]
  );

  /**
   * 邮件菜单的
   */
  const logicMenu = useMemo(() => {
    const lgMenu = menu || defaultMenuElement;
    if (typeof lgMenu === 'function') {
      // const menuActiveKey
      const node = key2NodeMap[menuActiveKey];
      if (node) {
        return (
          <div
            onClickCapture={() => {
              setMenuVisible(false);
              setMenuActiveKey(0);
              setFolderDropDownVisiableId(null);
            }}
          >
            {lgMenu(node)}
          </div>
        );
      }
      return <></>;
    }
    return lgMenu;
  }, [menu, menuActiveKey, key2NodeMap]);

  /**
   * 处理tree的Title点击事件
   */
  const handleTitleClick = useCallback(
    (key: number) => {
      if (onNodeTitleClick) {
        const node = key2NodeMapRef?.current[key + ''];
        onNodeTitleClick(node);
      }
    },
    [onNodeTitleClick]
  );
  const handleTitleClickRef = useCreateCallbackForEvent(handleTitleClick);

  /**
   * 融合过后的操按钮是否可见
   */
  const mergeOperBtnVisibility = useCallback(
    (node: MailBoxModel) => {
      if (typeof operBtnVisibility === 'function') {
        return editAble && operBtnVisibility(node, defaultOperBtnVisibility);
      }
      return editAble && !!operBtnVisibility;
    },
    [operBtnVisibility, editAble]
  );

  /**
   * 默认的文件夹操作按钮
   */
  const defaultFolderOperBtn = useCallback(
    (node: MailBoxModel) => {
      return (
        <Dropdown
          overlayClassName="u-tree-dropmenu"
          visible={folderDropDownVisiableId == node.mailBoxId}
          onVisibleChange={visible => {
            if (visible) {
              setMenuActiveKey(node.mailBoxId);
            } else {
              setMenuActiveKey(0);
            }
            setFolderDropDownVisiableId(visible ? node.mailBoxId : null);
          }}
          placement="bottomRight"
          overlay={logicMenu}
          trigger={['click']}
        >
          <div className="more">...</div>
        </Dropdown>
      );
    },
    [folderDropDownVisiableId]
  );

  /**
   * 融合过后的菜单操作按钮
   */
  const mergeFolderOperBtn = useCallback(
    (node: MailBoxModel) => {
      if (operBtnRender && typeof operBtnRender === 'function') {
        const res = operBtnRender(node, defaultFolderOperBtn(node));
        if (res) {
          return res;
        }
      }
      return defaultFolderOperBtn(node);
    },
    [operBtnRender, defaultFolderOperBtn]
  );

  /**
   * 渲染节点title
   */
  const renderTreeNodeTitle = useCallback(
    (folderNode: MailBoxModel, innerExpandedKeys: number[]) => {
      const node: EntityMailBox = folderNode?.entry;
      const showOperBtn = mergeOperBtnVisibility(folderNode);
      // todo: 是否属于聚合模式的条件发生了变化，不应该在当前组件中直接判断了，需要外部综合文件夹所属id进行判断
      const isThread = isMerge == null ? mailConfigStateIsMerge() : isMerge;
      // 计算当前文件夹的未读数
      let unRead;
      if (isThread) {
        if (innerExpandedKeys.includes(node.mailBoxId + '')) {
          if (node.mailBoxId == FLOLDER.DRAFT) {
            unRead = node.threadMailBoxTotal;
          } else if (folderCanShowUnread(node.mailBoxId)) {
            unRead = '';
          } else {
            unRead = node.threadMailBoxCurrentUnread ? node.threadMailBoxCurrentUnread : '';
          }
        } else {
          if (node.mailBoxId == FLOLDER.DRAFT) {
            unRead = node.mailBoxTotal + node.threadMailBoxUnread - node.threadMailBoxCurrentUnread;
          } else if (folderCanShowUnread(node.mailBoxId)) {
            unRead = node.threadMailBoxUnread - node.threadMailBoxCurrentUnread;
          } else {
            unRead = node.threadMailBoxUnread ? node.threadMailBoxUnread : '';
          }
        }
      } else {
        if (innerExpandedKeys.includes(node.mailBoxId + '')) {
          if (node.mailBoxId == FLOLDER.DRAFT) {
            unRead = node.mailBoxTotal;
          } else if (folderCanShowUnread(node.mailBoxId)) {
            unRead = '';
          } else {
            unRead = node.mailBoxCurrentUnread ? node.mailBoxCurrentUnread : '';
          }
        } else {
          if (node.mailBoxId == FLOLDER.DRAFT) {
            unRead = node.mailBoxTotal + node.mailBoxUnread - node.mailBoxCurrentUnread;
          } else if (folderCanShowUnread(node.mailBoxId)) {
            unRead = node.mailBoxUnread - node.mailBoxCurrentUnread;
          } else {
            unRead = node.mailBoxUnread ? node.mailBoxUnread : '';
          }
        }
      }

      const folderNameElement = folderNameRender ? folderNameRender(folderNode) : null;
      const unReadRenderElement = unReadRenderRef.current ? unReadRenderRef.current(folderNode, unRead) : null;
      // 文件夹的操作按钮
      const folderOperBtnElement = mergeFolderOperBtn(folderNode);

      // 返回渲染结果
      return (
        <div
          data-test-id={`mail-folder-${node.mailBoxName}`}
          className={`tree-content-warp ${showOperBtn ? 'showOper' : ''}`}
          onClick={() => handleTitleClickRef(node.mailBoxId)}
        >
          {folderNameElement || <span className="u-foldername">{node.mailBoxName}</span>}
          {unReadRenderElement ||
            (unRead != '' && unRead != null && unRead != 0 ? (
              <span className="u-unread" data-test-id="mail-folder-unread">
                {unRead}
              </span>
            ) : (
              ''
            ))}
          {showOperBtn ? (
            <span
              className="oper-wrap"
              onClick={e => {
                e.stopPropagation();
              }}
              onContextMenu={e => {
                e.stopPropagation();
              }}
            >
              {folderOperBtnElement}
            </span>
          ) : (
            ''
          )}
        </div>
      );
    },
    [mergeOperBtnVisibility, folderNameRender, logicMenu, mergeFolderOperBtn]
  );

  /**
   * 外部拖拽可拖放方法代理
   */
  const outerAllowDropProxy = useCallback(
    node => {
      if (typeof outerAllowDrop == 'function') {
        return outerAllowDrop(node);
      }
      return !!outerAllowDrop;
    },
    [outerAllowDrop]
  );

  // 渲染树的节点
  const renderTreeData = useCallback(
    (data: MailBoxModel[], keys: (string | number)[]): DataNode[] =>
      data.map(item => {
        // 处理拖拽的样式问题
        let couldDrop = nodeAllowDropMap[item.entry?.mailBoxId];
        const disabled = isOuterDrag ? !outerAllowDropProxy(item) : false;
        // const isSystemFolder = !isCustomFolder(item.entry.mailBoxId);
        const isMainFolder = item.entry.mailBoxId === FLOLDER.DEFAULT;
        return {
          title: () => renderTreeNodeTitle(item, keys),
          key: folderId2String(item.entry?.mailBoxId),
          icon: getMailFolderIcon(item.entry?.mailBoxId),
          className: classnames({
            disabled,
            'tree-node-btn-active-hover': folderDropDownVisiableId == item.entry?.mailBoxId,
            'tree-node-active-hover': menuActiveKey == item.entry?.mailBoxId,
            // 'system-folder': isSystemFolder,
            'main-folder': isMainFolder,
            'forbid-drop': folderTreeIsDrag && !couldDrop,
          }),
          disabled,
          nodeData: item,
          children: item.children && item.children.length ? renderTreeData(item.children as MailBoxModel[], keys) : [],
        };
      }),
    [outerAllowDropProxy, renderTreeNodeTitle, folderDropDownVisiableId, menuActiveKey, nodeAllowDropMap, isOuterDrag, folderTreeIsDrag]
  );

  /**
   * 向外暴露节点的编辑方法
   */
  useImperativeHandle(ref, () => ({
    addFolder: addFolderForEvent,
    appendFolder: appendFolderForEvent,
    updateFolder: updateFolderForEvent,
    deleteFolder: deleteFolderForEvent,
  }));

  // 用于对比优化的缓存
  // const fbmCache = useRef<any>(null);

  // 计算外部拖拽的文件夹禁用状态
  // useEffect(() => {
  //   // 简单的对比优化
  //   if (forbidMoveFolderConfig.folderIds?.length != folderForbidMoveIdMap.size || forbidMoveFolderConfig.disabled != fbmCache.current) {
  //     fbmCache.current = forbidMoveFolderConfig.disabled;
  //     const folderIdMap = new Map();
  //     const { folderIds } = forbidMoveFolderConfig;
  //     if (folderIds && folderIds.length) {
  //       folderIds.forEach(item => {
  //         folderIdMap.set(item, true);
  //       });
  //     }
  //     setFolderForbidMoveIdMap(folderIdMap);
  //   }
  // }, [forbidMoveFolderConfig]);

  /**
   * 文件夹的渲染结构
   */
  const treeRenderData = useMemo(() => renderTreeData(data, logicExpandedKeys), [data, renderTreeData, logicExpandedKeys]);

  /**
   * 将DataNode类型的数据转换为MailBoxModel；
   */
  const switchDataNode2MailBoxModel = useCallback(
    (node: customeNode): MailBoxModel => {
      const folder = getEmptyMailBoxModel();
      if (node.key) {
        folder.entry.mailBoxId = folderId2Number(node.key);
      }
      folder.entry.mailBoxName = node._name || '';
      folder.entry.pid = node._parentKey ? folderId2Number(node._parentKey) : 0;
      folder.entry.mailBoxParent = node._parentKey ? folderId2Number(node._parentKey) : 0;
      //  账号对整个文件夹是统一的，所以取第一个
      folder._account = data && data.length ? data[0]?._account : '';
      return folder;
    },
    [getEmptyMailBoxModel]
  );

  /**
   * 处理文件夹添加
   */
  const handleAddFolder = useCallback(
    (e: React.MouseEvent, renderNode: customeNode, keyList: string[]) => {
      if (renderNode) {
        if (onAddFolder) {
          const fidList = folderId2Number(keyList);
          return onAddFolder(switchDataNode2MailBoxModel(renderNode), fidList);
        }
      }
    },
    [onAddFolder, switchDataNode2MailBoxModel]
  );

  /**
   * 处理文件夹添加
   */
  const handleUpdateFolder = useCallback(
    (e: React.MouseEvent, renderNode: customeNode) => {
      if (renderNode) {
        const { key } = renderNode;
        const node = key2NodeMapRef?.current[key];
        if (node) {
          // 将DataNode 转换为 MailBoxModel；
          if (onUpdateFolder) {
            return onUpdateFolder(switchDataNode2MailBoxModel(renderNode));
          }
        }
      }
    },
    [onUpdateFolder, switchDataNode2MailBoxModel]
  );

  /**
   * 处理文件夹的删除
   */
  const handleDeleteFolder = useCallback(
    (renderNode: customeNode) => {
      if (renderNode) {
        const { key } = renderNode;
        const node = key2NodeMapRef?.current[key];
        if (node) {
          // 将DataNode 转换为 MailBoxModel；
          if (onDeleteFolder) {
            return onDeleteFolder(node);
          }
        }
      }
    },
    [onDeleteFolder]
  );

  /**
   * 添加文件夹的验证
   */
  const handleAddFolderValidate = useCallback(
    (tree: DataNode[], renderNode: customeNode) => {
      if (renderNode) {
        const key = renderNode?._parentKey;
        const node = key2NodeMapRef?.current[key];
        if (node && validateOnAdd) {
          return validateOnAdd(data, switchDataNode2MailBoxModel(renderNode));
        }
        return true;
      }
    },
    [data, validateOnAdd]
  );

  /**
   * 更新文件夹的验证
   */
  const handleUpdateFolderValidate = useCallback(
    (tree: DataNode[], renderNode: customeNode) => {
      if (renderNode) {
        const key = renderNode._parentKey;
        const node = key2NodeMapRef?.current[key];
        if (node && validateOnUpdate) {
          return validateOnUpdate(data, switchDataNode2MailBoxModel(renderNode));
        }
        return true;
      }
    },
    [data, validateOnUpdate]
  );

  /**
   * 文件夹的onSelect代理
   */
  const handleOnSelectProxy = useCallback(
    (selectedKeys: string[]) => {
      if (selectedKeys && selectedKeys.length) {
        const key = selectedKeys[0];
        console.log('[FolderTree] 选择文件夹 start:', key, Date.now());
        const node = key2NodeMapRef?.current[key];
        if (node && onSelect) {
          onSelect(node);
        }
      }
    },
    [onSelect]
  );

  /**
   * 文件夹的拖拽代理
   */
  const handleOnDragStart = useCallback(
    params => {
      // setTimeout(() => {
      setFolderTreeDrag(true);
      // }, 0);
      const { event, node } = params;
      const key = node?.key;
      const folderData = key2NodeMapRef?.current[key];
      setDraggingFolder(folderData);
      if (onDragStart) {
        onDragStart({
          event,
          node: folderData,
        });
      }
    },
    [onDragStart]
  );

  const handleOnDragEnd = useCallback(
    (params: { event: React.DragEvent; node: customeNode }) => {
      setFolderTreeDrag(false);
      setDraggingFolder(null);
      if (onDragEnd) {
        const { event, node } = params;
        // 阻止react对事件的复用
        event.persist();
        const key = node?.key;
        const folderData = key2NodeMapRef?.current[key];

        onDragEnd({
          event,
          node: folderData,
        });
      }
    },
    [onDragEnd]
  );

  /**
   * 处理文件夹的展开
   */
  const handleonExpand = useCallback((expandedKeys, { expanded, node }) => {
    // 对key进行转换
    if (onExpand) {
      const key = node?.key;
      const folderData = key2NodeMapRef?.current[key];
      onExpand(expandedKeys, { expanded, node: folderData });
    } else {
      setLocalExpandKeys(expandedKeys);
    }
  }, []);

  /**
   * 代理底层tree的dragAble属性
   * 将底层的treeNdata参数转换为folderData参数
   */
  const dragAbleProxy = useCallback(
    (node: DataNode) => {
      if (node) {
        const key = node?.key;
        const folderModel = key2NodeMapRef?.current[key];
        const draggableIsFn = typeof draggable === 'function';
        const draggableIsBoolean = typeof draggable === 'boolean';
        if (draggableIsFn && folderModel) {
          return draggable(folderModel);
        }
        if (draggableIsBoolean) {
          return draggable;
        }
        return false;
      }
    },
    [draggable]
  );

  /**
   * 代理底层tree的allowDrop属性
   */
  const allowDropPorxy = useCallback(
    ({ dropNode }) => {
      if (dropNode) {
        return nodeAllowDropMap[dropNode?.key];
      }
      return true;
    },
    [nodeAllowDropMap]
  );

  /**
   * tree的onDrop事件代理
   */
  const onDropPorxy = useCallback(
    ({ event, node, dragNode, dragNodesKeys, dropPosition, dropToGap }) => {
      if (onDrop) {
        const key = node?.key;
        const folderModel = key2NodeMapRef?.current[key];
        const dragKey = dragNode?.key;
        const dragFolderModel = key2NodeMapRef?.current[dragKey];
        onDrop({
          event,
          node: folderModel,
          dragNode: dragFolderModel,
          dragNodesKeys,
          dropPosition,
          dropToGap,
        });
      }
    },
    [onDrop]
  );

  /**
   * tree的外部drop事件代理
   */
  const onOuterDropProxy = useCallback(
    ({ event, node }) => {
      const { disabled, key } = node;
      // 屏蔽禁止的节点
      if (!disabled && onOuterDrop) {
        const folderModel = key2NodeMapRef?.current[key];
        onOuterDrop({
          event,
          node: folderModel,
        });
      }
    },
    [onOuterDrop]
  );

  const handleOnDragStartRef = useCreateCallbackForEvent(handleOnDragStart);
  const handleOnDragEndRef = useCreateCallbackForEvent(handleOnDragEnd);
  const dragAbleProxyRef = useCreateCallbackForEvent(dragAbleProxy);
  const handleonExpandProxyRef = useCreateCallbackForEvent(handleonExpand);
  const handleAllowDropProxyRef = useCreateCallbackForEvent(allowDropPorxy);
  const handleDropProxyRef = useCreateCallbackForEvent(onDropPorxy);
  const handleOuterDropProxyRef = useCreateCallbackForEvent(onOuterDropProxy);
  const handleOnSelectProxyRef = useCreateCallbackForEvent(handleOnSelectProxy);
  const handleAddFolderRef = useCreateCallbackForEvent(handleAddFolder);
  const handleDeleteFolderRef = useCreateCallbackForEvent(handleDeleteFolder);
  const handleAddFolderValidateRef = useCreateCallbackForEvent(handleAddFolderValidate);
  const handleUpdateFolderRef = useCreateCallbackForEvent(handleUpdateFolder);
  const handleTreeRightClickRef = useCreateCallbackForEvent(handleTreeRightClick);
  const handleUpdateFolderValidateRef = useCreateCallbackForEvent(handleUpdateFolderValidate);
  const getUpdateFolderNameRef = useCreateCallbackForEvent(getUpdateFolderName);
  const getNewFolderNameRef = useCreateCallbackForEvent(getNewFolderName);

  /**
   * 文件夹tree element
   */
  // todo: 对于传入的props需要进一步细分，防止渲染过多
  const FolderTreeElement = useMemo(
    () => (
      <EditTree
        ref={editTreeRef}
        showIcon
        blockNode
        switcherIcon={<CaretDownOutlined />}
        onExpand={handleonExpandProxyRef}
        selectedKeys={selectedKey ? [selectedKey + ''] : []}
        treeData={treeRenderData}
        expandedKeys={logicExpandedKeys}
        onSelect={handleOnSelectProxyRef}
        onRightClick={handleTreeRightClickRef}
        editAble={false}
        onAddNode={handleAddFolderRef}
        getStrTitleOnAdd={getNewFolderNameRef}
        validateOnAdd={handleAddFolderValidateRef}
        onUpdateNode={handleUpdateFolderRef}
        getStrTitleOnUpdate={getUpdateFolderNameRef}
        validateOnUpdate={handleUpdateFolderValidateRef}
        onDeleteNode={handleDeleteFolderRef}
        showLine={folderTreeIsDrag ? { showLeafIcon: false } : false}
        draggable={dragAbleProxyRef}
        onDragStart={handleOnDragStartRef}
        onDragEnd={handleOnDragEndRef}
        allowDrop={handleAllowDropProxyRef}
        onDrop={handleDropProxyRef}
        dragModel={dragModel}
        isOuterDrag={isOuterDrag}
        onOuterDrop={handleOuterDropProxyRef}
      />
    ),
    [
      treeRenderData,
      logicExpandedKeys,
      folderTreeIsDrag,
      editAble,
      selectedKey,
      isOuterDrag,
      // handleOnSelectProxy,
      // handleTreeRightClick,
      // handleUpdateFolderValidate,
      // getUpdateFolderName,
      // handleUpdateFolder,
      // getNewFolderName,
      // handleAddFolder,
      // handleAddFolderValidate,
      // handleDeleteFolder,
      dragModel,
    ]
  );

  return (
    <div className={`folder-tree-wrap  ${folderTreeIsDrag ? 'folder-tree-draging' : ''} ${isOuterDrag ? 'on-drag' : ''}`}>
      {editAble ? (
        <Dropdown
          overlayClassName="u-tree-dropmenu"
          overlayStyle={{ width: 'auto' }}
          trigger={['contextMenu']}
          overlay={logicMenu}
          visible={menuVisible}
          onVisibleChange={visible => {
            if (!visible) {
              setMenuActiveKey(0);
              setMenuVisible(visible);
            }
          }}
        >
          {
            // 不能删除包裹的div，Dropdown有些事件是代理在div，直接报错业务组件可能造成位置丢失
          }
          <div style={{ width: '100%', height: '100%' }}>{FolderTreeElement}</div>
        </Dropdown>
      ) : (
        FolderTreeElement
      )}
    </div>
  );
});

export default FolderTree;
