/**
 *  可编辑Tree
 *  包含Tree的基础定制化样式
 *  在ant Design 基础tree上扩展了新增，编辑，删除的API
 *
 */
import React, { useRef, useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { cloneDeep } from 'lodash';
import { Dropdown, Menu, Input } from 'antd';
/**
 *  自维护的定制化Tree
 */
import Tree from '../../common/library/Tree';
import { AntTreeNodeDropEvent } from '../../common/library/Tree/Tree';
import { EventDataNode, DataNode, TreeProps } from '../../common/library/Tree';
import { treeDFS, getChildTreeByRule } from '../../util';
import { stringMap } from '../../types';
import useThrottleForEvent from '../../hooks/useThrottleForEvent';
import useCreateCallbackForEvent from '../../hooks/useCreateCallbackForEvent';

import './tree.scss';
import { inWindow } from 'api';
/**
 * 过滤自定义的部分props，不需要传递给下层组件
 */
const forbidPropsKey = ['onOuterDrop', 'onRightClick', 'treeData', 'expandedKeys', 'onExpand', 'expandedKeys', 'draggable'];
const filterCustomProps = (props: EditTreeProps) => {
  const res = { ...props };
  forbidPropsKey.forEach(key => (res[key] = undefined));
  return res;
};

/**
 * 树的临时节点枚举
 */
enum TreeEditState {
  ADD = 'ADD',
  EDIT = 'EDIT',
  LOADING = 'LOADING',
  DEFAULT = 'DEFAULT',
}

/**
 * 内部节点接口
 */
export interface customeNode extends DataNode {
  key: string;
  _parentKey?: string;
  title: () => string | React.ReactElement;
  _isTemp?: boolean;
  _state?: TreeEditState;
  _name?: string;
}

/**
 * 默认的节点结构
 * todo: 该节点信息待待重构
 */
const defaultNodeModel: customeNode = {
  key: '',
  _parentKey: '',
  title: () => '',
  _isTemp: true,
  _state: TreeEditState.DEFAULT,
  _name: '',
  selectable: false,
  checkable: false,
};

interface EditTreeProps extends TreeProps {
  /**
   * 树的操作右键菜单
   */
  menu?: ((node?: any) => React.ReactElement) | React.ReactElement;
  /**
   * 是否可编辑
   */
  editAble?: boolean;
  /**
   * 节点名称是都可重复
   */
  nodeNameCanRepeat?: boolean;
  /**
   * 最大限制层级： 用于限制新增，移动
   */
  maxDeep?: number;
  /**
   * 是否禁用外部拖放
   */
  outerDropDisabled?: boolean;
  /**
   * 邮件菜单的配置
   */
  // todo: 文件夹的邮件菜单需要重新设计
  menuConfig?: any[];
  /**
   * 节点的的数据
   */
  treeData: DataNode[];
  /**
   * 节点是否可以拖拽
   */
  draggable: boolean | ((node: customeNode) => boolean);
  /**
   * 自定义基础tree组件
   */
  customBaseTree?: React.FC | React.Component;
  /**
   * 右键点击
   */
  onRightClick?: (paramg: { e: React.MouseEvent; node: EventDataNode }) => void;
  /**
   * 右键点击之前
   */
  beforeRightClick?: (paramg: { e: React.MouseEvent; node: EventDataNode }) => boolean;
  /**
   * 外部拖拽，ex：邮件拖拽到文件夹树
   */
  onOuterDrop?: (e: AntTreeNodeDropEvent) => void;
  /**
   * 内部拖拽 ex: 树的节点拖拽到节点
   */
  onDrop?: (e: AntTreeNodeDropEvent) => void;
  /**
   * 当有节点新增的时候
   */
  onAddNode?: (e: React.MouseEvent, node: customeNode, keyList: string[]) => Promise<any> | boolean;
  /**
   * 当有节点更新的时候
   */
  onUpdateNode?: (e: React.MouseEvent, node: customeNode) => Promise<any> | boolean;
  /**
   * 当节点删除的时候
   */
  onDeleteNode?: (node: DataNode) => Promise<any> | boolean;
  /**
   * 节点夹展开事件
   */
  onExpand?: (expandedKeys: string[], params: { expanded: boolean; node: customeNode }) => void;
  /**
   * 节点添加时候的校验
   */
  validateOnAdd?: (tree: DataNode[], node: customeNode) => boolean;
  /**
   * 节点更新时候的校验
   */
  validateOnUpdate?: (tree: DataNode[], node: customeNode) => boolean;
  /**
   * 获取当前节点的字符串类型title
   */
  getStrTitleOnUpdate?: (tree: DataNode[], node?: DataNode) => string;
  /**
   * 获取新建节点的默认名称
   */
  getStrTitleOnAdd?: (tree: DataNode[], node?: DataNode) => string;
}

/**
 * 对外暴露的方法-用于菜单混合
 */
export interface ExportRefProps {
  addNode: (nodeKey?: string) => void;
  appendNode: (nodeKey?: string) => void;
  updateNode: (nodeKey?: string) => void;
  deleteNode: (nodeKey: string) => void;
}
const defaultBeforeRightClick = () => true;

// 克隆tree ,只有部分基础类型和children是克隆的，需要十分谨慎的操作数据
const cloneTree = (data: customeNode | customeNode[] | DataNode | DataNode[], parentNode?: DataNode): customeNode | customeNode[] => {
  if (Array.isArray(data)) {
    return data.map(data => {
      if (data?.children) {
        return {
          ...data,
          children: cloneTree(data.children as customeNode[], data) as customeNode[],
          _parentKey: parentNode?.key,
        } as customeNode;
      } else {
        return {
          ...data,
          _parentKey: parentNode?.key,
        } as customeNode;
      }
    });
  } else {
    if (data?.children) {
      return {
        ...data,
        children: cloneTree(data.children as customeNode[], data) as customeNode[],
        _parentKey: parentNode?.key,
      } as customeNode;
    } else {
      return {
        ...data,
        _parentKey: parentNode?.key,
      } as customeNode;
    }
  }
};

const EditTree = forwardRef<ExportRefProps, EditTreeProps>((props, ref) => {
  const {
    editAble = false,
    draggable = false,
    onOuterDrop,
    onDrop,
    outerDropDisabled = false,
    children,
    treeData,
    onRightClick,
    beforeRightClick = defaultBeforeRightClick,
    onAddNode,
    onUpdateNode,
    onDeleteNode,
    onExpand,
    expandedKeys,
    validateOnAdd,
    validateOnUpdate,
    getStrTitleOnUpdate,
    getStrTitleOnAdd,
    menu,
    customBaseTree,
  } = props;
  // 组件内部缓存的TreeData
  const [localTreeData, setLocalTreeData] = useState<customeNode[]>([]);
  // 组件内部缓存的临时操作节点 NodeKey 到 Node 的映射
  // const [key2TempNodeMap, setKey2TempNodeMap] = useState<Map<string | number, DataNode | DataNode[]>>(new Map());
  // 组件内部缓存的NodeKey 到 Node 的映射
  const [key2NodeMap, setKey2NodeMap] = useState<{ [key: string]: customeNode }>({});
  // 右键菜单是否展示
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  // 当前选中的节点Key
  const activeNodeKey = useRef<string>('');
  // 树-展开的key
  const [localExpandedKeys, setLocalExpandKeys] = useState<string[]>([]);
  // 编辑输入框的ref
  const inputRef = useRef(null);
  // 依赖的基础tree
  const LogicTree = customBaseTree || Tree;
  // tree中是否存在临时节点
  const hasTempNode = useRef(false);
  // 临时节点-输入框的选中任务
  const hasTempNodeSelectdTask = useRef<boolean>(false);
  // 忽略创建的id
  const igTempId = useRef<string | null>();

  const tempRightParams = useRef();

  /**
   * 本地状态与props状态的综合
   */
  const logicOnExpand = onExpand || ((keys: string[]) => setLocalExpandKeys(keys));
  const logicExpandedKeys = expandedKeys || localExpandedKeys;
  /**
   * 是否可拖拽需要进行包装，因为临时节点不允许拖拽
   */
  const logicDraggable = useMemo(() => {
    if (typeof draggable === 'function') {
      return (node: customeNode) => {
        if (node?._isTemp) {
          return false;
        }
        return draggable(node);
      };
    } else {
      return draggable
        ? (node: customeNode) => {
            return !node?._isTemp;
          }
        : false;
    }
  }, [draggable]);

  /**
   * 处理Tree的Drop事件，所内部外部drop做分发
   */
  const handleTreeDrop = (e: AntTreeNodeDropEvent) => {
    /*
     * 区分外部drop与内部drop事件
     * 内部drop即树的节点拖拽到树的节点
     * 外部drop即外部信息拖拽到树的节点
     */
    if (e?.dragNode == null && e?.dragNodesKeys == null) {
      try {
        const { node } = e;
        const { nodeData } = node;
        if (!outerDropDisabled && onOuterDrop && !nodeData?.entry?._isTempNode) {
          onOuterDrop(e);
        }
      } catch (e) {
        console.error('[Error EditTree handleTreeDrop]', e);
      }
    } else {
      onDrop && onDrop(e);
    }
  };

  /**
   * 处理tree的右键，做代理处理
   */
  const handleTreeRightClick = (params: { e: React.MouseEvent; node: EventDataNode }) => {
    const { node } = params;
    if (node) {
      // 临时节点必须显示的===true才做拦截
      if (node._isTemp === true) {
        return false;
      }
      // 邮件弹窗联动
      activeNodeKey.current = node.key + '';
      // setActiveNodeKey(node.key);
      tempRightParams.current = params;
      // 代理调用外层props
      if (beforeRightClick && beforeRightClick(params)) {
        onRightClick && onRightClick(params);
      }
    }
  };

  /**
   * 节点新增
   */
  const addNode = (nodeKey?: string) => {
    if (hasTempNode.current && hasEditInputEl()) {
      return;
    }
    const key = nodeKey || activeNodeKey.current;
    const node = key2NodeMap[key];
    if (node) {
      // 展开从根节点到当操作的所有节点
      if (key) {
        // setTimeout(()=>{
        logicOnExpand([...new Set([...logicExpandedKeys, key])], {
          expanded: true,
          node,
        });
        // },300);
      }
      // 在目标节点添加特定节点
      setTimeout(() => {
        appendInputNode(node);
        setLocalTreeData([...localTreeData]);
      }, 10);
    } else {
      // 在一级节点的末尾添加临时节点
      setLocalTreeData([...localTreeData, getAddTempNode()]);
    }
    // 添加异步任务，等节点渲染之后，异步选中节点中input的内容
    hasTempNodeSelectdTask.current = true;
    hasTempNode.current = true;
  };
  // 创建用于外部ref调用的事件引用
  const addNodeForEvent = useCreateCallbackForEvent(addNode);

  /**
   * 新增兄弟节点
   */
  const appendNode = (nodeKey?: string) => {
    if (hasTempNode.current && hasEditInputEl()) {
      return;
    }
    const key = nodeKey || activeNodeKey;
    const node = key2NodeMap[key];
    if (node) {
      // 展开从根节点到当操作的所有节点
      // if (key) {
      //   logicOnExpand([...new Set([...logicExpandedKeys, key])]);
      // }
      // 在目标节点添加特定节点
      const res = insertInputNode(node);
      setLocalTreeData([...res]);
    } else {
      // 在一级节点的末尾添加临时节点
      setLocalTreeData([...localTreeData, getAddTempNode()]);
    }
    (hasTempNodeSelectdTask.current = true), (hasTempNode.current = true);
  };
  // 创建用于外部ref调用的事件引用
  const appendNodeForEvent = useCreateCallbackForEvent(appendNode);

  const hasEditInputEl = () => {
    if (inWindow()) {
      const isSafari = navigator.userAgent.toLowerCase().includes('safari/');
      if (!isSafari) {
        return true;
      }
      const inputEl = document.querySelector('.folder-tree-wrap .ant-tree-treenode .edit-tree-input .ant-input');
      if (inputEl) {
        return true;
      } else {
        return false;
      }
    }
    return true;
  };

  /**
   * 节点更新
   */
  const updateNode = (nodeKey?: string | number) => {
    if (hasTempNode.current && hasEditInputEl()) {
      return;
    }
    const key = nodeKey || activeNodeKey.current;
    const node = key2NodeMap[key];
    if (node) {
      const defaultNodeName = getStrTitleOnUpdate ? getStrTitleOnUpdate(localTreeData, node) : typeof node?.title === 'string' ? node.title : '';
      node._state = TreeEditState.EDIT;
      node._name = defaultNodeName;
      node._isTemp = true;
      editNode(node);
      setLocalTreeData([...localTreeData]);
      hasTempNode.current = true;
    }
  };
  // 创建用于外部ref调用的事件引用
  const updateNodeForEvent = useCreateCallbackForEvent(updateNode);
  /**
   * 节点删除
   */
  const deleteNode = (nodeKey?: string | number) => {
    const key = nodeKey || activeNodeKey.current;
    const node = key2NodeMap[key];
    if (node) {
      handleNodeDelete(node);
    }
  };
  // 创建用于外部ref调用的事件引用
  const deleteNodeForEvent = useCreateCallbackForEvent(deleteNode);

  /**
   * 取消新增节点
   */
  const handleCancelAddNode = (addNode: customeNode) => {
    // 根据key，将对应的节点从tree中删除，重新出发渲染
    if (addNode && addNode?.key) {
      // 去掉临时节点身份，这样可以在请求中进行判断拦截
      // addNode._isTemp = false;
      const parentNode = addNode?._parentKey ? key2NodeMap[addNode?._parentKey] : null;
      if (parentNode) {
        parentNode.children = parentNode.children?.filter(node => node?.key !== addNode.key);
        setLocalTreeData([...localTreeData]);
      } else {
        setLocalTreeData(localTreeData.filter(node => node?.key !== addNode.key));
      }
      hasTempNode.current = false;
    }
  };

  const cancelNodeAdded = useCreateCallbackForEvent(handleCancelAddNode);
  /**
   * 取消编辑节点
   */
  const handleCancelEditNode = (editNode: customeNode) => {
    // 将当前编辑节点，从临时节点变更为正常节点，重新出发渲染
    if (editNode) {
      editNode._isTemp = false;
      editNode._state = TreeEditState.DEFAULT;
      editNode.title = editNode._name;
      setLocalTreeData([...localTreeData]);
    }
  };

  /**
   * 获取一个新增节点
   */
  const getAddTempNode = (parentNode?: DataNode) => {
    const node = cloneDeep(defaultNodeModel);
    const defaultNodeName = getStrTitleOnAdd ? getStrTitleOnAdd(localTreeData, parentNode) : typeof node?.title === 'string' ? node.title : '';
    node.key = new Date().getTime() + '';
    node._state = TreeEditState.ADD;
    node._name = defaultNodeName;
    node._parentKey = parentNode?.key ? parentNode?.key + '' : '0';
    node.title = () => {
      return (
        <span
          className="edit-tree-title-wrap"
          onClick={e => {
            e.stopPropagation();
          }}
          style={{ display: 'flex' }}
        >
          {node._state == TreeEditState.LOADING && (
            <span className="edit-tree-loading-wrap">
              <LoadingOutlined />
            </span>
          )}
          <Input
            className="edit-tree-input"
            defaultValue={node._name}
            ref={inputRef}
            // autoFocus
            onPressEnter={e => {
              setTimeout(() => {
                debounceHandleNodeAdd(e, node);
              }, 700);
            }}
            onBlur={e => {
              setTimeout(() => {
                if (igTempId.current != node.key) {
                  debounceHandleNodeAdd(e, node);
                } else {
                  igTempId.current = null;
                }
              }, 700);
            }}
            disabled={node._state == TreeEditState.LOADING}
            maxLength={40}
            onChange={e => {
              node._name = e?.target?.value.trim();
            }}
            suffix={
              node._state != TreeEditState.LOADING && (
                <span
                  className="folder-input-cancel"
                  onClick={() => {
                    handleCancelAddNode(node);
                    igTempId.current = node.key;
                  }}
                >
                  取消
                </span>
              )
            }
          />
        </span>
      );
    };
    return node;
  };

  /**
   * 获取一个新增兄弟节点
   */
  const getAppendTempNode = (parentNode?: DataNode) => {
    const node = cloneDeep(defaultNodeModel);
    const defaultNodeName = getStrTitleOnAdd ? getStrTitleOnAdd(localTreeData, parentNode) : typeof node?.title === 'string' ? node.title : '';
    node.key = new Date().getTime() + '';
    node._state = TreeEditState.ADD;
    node._name = defaultNodeName;
    node._parentKey = parentNode?.key ? parentNode?.key + '' : '0';
    node.title = () => {
      return (
        <span
          className="edit-tree-title-wrap"
          onClick={e => {
            e.stopPropagation();
          }}
          style={{ display: 'flex' }}
        >
          {node._state == TreeEditState.LOADING && (
            <span className="edit-tree-loading-wrap">
              <LoadingOutlined />
            </span>
          )}
          <Input
            className="edit-tree-input"
            defaultValue={node._name}
            ref={inputRef}
            // autoFocus
            onPressEnter={e => {
              setTimeout(() => {
                if (igTempId.current != node.key) {
                  debounceHandleNodeAdd(e, node);
                }
              }, 700);
            }}
            onBlur={e => {
              setTimeout(() => {
                if (igTempId.current != node.key) {
                  debounceHandleNodeAdd(e, node);
                } else {
                  igTempId.current = null;
                }
              }, 700);
            }}
            disabled={node._state == TreeEditState.LOADING}
            maxLength={40}
            onChange={e => {
              node._name = e?.target?.value.trim();
            }}
            suffix={
              node._state != TreeEditState.LOADING && (
                <span
                  className="folder-input-cancel"
                  onClick={() => {
                    cancelNodeAdded(node);
                    igTempId.current = node.key;
                  }}
                >
                  取消
                </span>
              )
            }
          />
        </span>
      );
    };
    return node;
  };

  /**
   * 为某个节点添加 一个新增的编辑节点
   */
  const appendInputNode = (parentNode?: DataNode) => {
    if (parentNode) {
      const tempNode = getAddTempNode(parentNode);
      if (parentNode?.children) {
        parentNode.children?.unshift(tempNode);
      } else {
        parentNode.children = [tempNode];
      }
    }
  };

  /**
   * 在某个节点后面增加一个新的节点
   */
  const insertInputNode = (brotherNode?: customeNode) => {
    let res = [...localTreeData];
    if (brotherNode) {
      const commonParentNode = brotherNode?._parentKey && key2NodeMap[brotherNode?._parentKey];
      const tempNode = getAppendTempNode(commonParentNode);
      if (commonParentNode) {
        const children = commonParentNode.children || [];
        const index = children.findIndex(item => item.key === brotherNode?.key);
        if (index > -1) {
          res = [...children];
          res.splice(index + 1, 0, tempNode);
          commonParentNode.children = res;
        }
      } else {
        // 如果是一级节点
        const index = res?.findIndex(item => item.key == brotherNode?.key);
        if (index > -1) {
          res?.splice(index + 1, 0, tempNode);
          return [...res];
        }
      }
    }
    return [...localTreeData];
  };

  /**
   * 编辑时替换某个节点的title，渲染为编辑输入框
   */
  const editNode = (node: customeNode) => {
    if (node) {
      node.title = () => {
        return (
          <span
            className="edit-tree-title-wrap"
            onClick={e => {
              e.stopPropagation();
            }}
            style={{ display: 'flex' }}
          >
            {node._state == TreeEditState.LOADING && (
              <span className="edit-tree-loading-wrap">
                <LoadingOutlined />
              </span>
            )}
            <Input
              className="edit-tree-input"
              defaultValue={node._name}
              ref={inputRef}
              // autoFocus
              onPressEnter={e => {
                setTimeout(() => {
                  debounceHandleNodeUpdate(e, node);
                }, 700);
              }}
              onBlur={e => {
                setTimeout(() => {
                  debounceHandleNodeUpdate(e, node);
                }, 700);
              }}
              disabled={node._state == TreeEditState.LOADING}
              maxLength={40}
              onChange={e => {
                node._name = e?.target?.value.trim();
              }}
              suffix={
                node._state != TreeEditState.LOADING && (
                  <span
                    className="folder-input-cancel"
                    onClick={() => {
                      handleCancelEditNode(node);
                    }}
                  >
                    取消
                  </span>
                )
              }
            />
          </span>
        );
      };
    }
  };

  /**
   * 节点添加事件
   */
  const handleNodeAdd = (e: React.MouseEvent, node: customeNode) => {
    // 如果是非临时节点，则拦截后续逻辑
    if (!node?._isTemp) {
      return false;
    }
    // 如果验证不通过，则拦截
    // todo：现在没有异步验证，后续考虑支持异步验证
    if (validateOnAdd && !validateOnAdd(localTreeData, node)) {
      return false;
    }
    if (onAddNode) {
      // 获取新增节点在兄弟节点中的排列顺序
      const parentNode = node?._parentKey && key2NodeMap[node?._parentKey];
      let keyList = localTreeData?.map(item => item.key) || [];
      if (parentNode && parentNode?.children) {
        keyList = parentNode?.children?.map(item => item.key + '');
      }
      const res = onAddNode(e, node, keyList);
      if (res?.then != null) {
        // 如果返回promise
        node._state = TreeEditState.LOADING;
        setLocalTreeData([...localTreeData]);
        res
          .then(() => {
            // node._state = TreeEditState.DEFAULT;
            // setLocalTreeData([...localTreeData]);
          })
          .catch(() => {
            node._state = TreeEditState.ADD;
            setLocalTreeData([...localTreeData]);
          });
      } else {
        // 返回true，则进如loading状态，等待文件夹树的刷新，数据源的刷新会消除掉临时节点
        if (res !== false) {
          node._state = TreeEditState.LOADING;
          setLocalTreeData([...localTreeData]);
        }
      }
    }
  };
  // 创建引用-防抖事件
  const debounceHandleNodeAdd = useThrottleForEvent(handleNodeAdd, 500);

  /**
   * 节点编辑事件
   */
  const handleNodeUpdate = (e: React.MouseEvent, node: customeNode) => {
    // 如果是非临时节点，则拦截后续逻辑
    if (!node?._isTemp) {
      return false;
    }
    // 如果验证不通过，则拦截
    // todo：现在没有异步验证，后续考虑支持异步验证
    if (validateOnUpdate && !validateOnUpdate(localTreeData, node)) {
      return false;
    }
    if (onUpdateNode) {
      const res = onUpdateNode(e, node);
      if (res?.then != null) {
        // 如果返回promise
        node._state = TreeEditState.LOADING;
        setLocalTreeData([...localTreeData]);
        res
          .then(() => {
            /**
             *  todo：如果不刷新整棵树，而是只返回对应的节点信息，则执行替换，将原来的临时节点替换为接口返回的真实节点。
             *  现在没有该需求，所以只是刷新tree
             */
            // todo: 存在文件夹跳动的问题
            // node._state = TreeEditState.DEFAULT;
            // setLocalTreeData([...localTreeData]);
          })
          .catch(() => {
            //  todo: 触发一次同步，刷掉这些卡住的没用的中间数据
            node._state = TreeEditState.EDIT;
            setLocalTreeData([...localTreeData]);
          });
      } else {
        // 返回true，则进如loading状态，等待文件夹树的刷新，数据源的刷新会消除掉临时节点
        if (res !== false) {
          node._state = TreeEditState.LOADING;
          setLocalTreeData([...localTreeData]);
        }
      }
    }
  };
  // 创建引用-防抖事件
  const debounceHandleNodeUpdate = useThrottleForEvent(handleNodeUpdate, 500);

  /**
   * 节点删除事件
   */
  const handleNodeDelete = (node: customeNode) => {
    if (node && onDeleteNode) {
      const res = onDeleteNode(node);
      if (res?.then != null) {
        // 如果返回promise
        node._state = TreeEditState.LOADING;
        setLocalTreeData([...localTreeData]);
        res
          .then(() => {
            // node._state = TreeEditState.DEFAULT;
            // setLocalTreeData([...localTreeData]);
          })
          .catch(() => {
            //  todo: 触发一次同步，刷掉这些卡住的没用的中间数据
            node._state = TreeEditState.DEFAULT;
            setLocalTreeData([...localTreeData]);
          });
      } else {
        // 返回true，则进如loading状态，等待文件夹树的刷新，数据源的刷新会消除掉临时节点
        if (!!res) {
          node._state = TreeEditState.LOADING;
          setLocalTreeData([...localTreeData]);
        }
      }
    }
  };
  // 创建引用-防抖事件
  const debounceHandleNodeDelete = useThrottleForEvent(handleNodeDelete, 500);

  // 分时间尝试选中输入框中的文字
  const focusInput = useCallback(() => {
    // 多次尝试-提高成功率
    setTimeout(() => {
      inputRef.current?.focus({
        cursor: 'all',
      });
    }, 200);
    setTimeout(() => {
      inputRef.current?.focus({
        cursor: 'all',
      });
    }, 1000);
    setTimeout(() => {
      inputRef.current?.focus({
        cursor: 'all',
      });
    }, 1500);
  }, []);

  /**
   * 默认的可编辑树文件夹邮件菜单
   */
  const defaultMenuElement = useMemo(() => {
    return (
      <Menu mode="horizontal">
        <Menu.Item
          key="add"
          onClick={() => {
            addNode();
            setMenuVisible(false);
            focusInput();
          }}
        >
          新建
        </Menu.Item>
        <Menu.Item
          key="edit"
          onClick={() => {
            updateNode();
            setMenuVisible(false);
            focusInput();
          }}
        >
          编辑
        </Menu.Item>
        <Menu.Item
          key="delete"
          onClick={() => {
            deleteNode();
            setMenuVisible(false);
          }}
        >
          删除
        </Menu.Item>
      </Menu>
    );
  }, [addNode, updateNode, deleteNode]);

  /**
   * clone节点数，以完成节点的编辑
   */
  useEffect(() => {
    // 设置本地数据缓存
    const localData = cloneTree(treeData) as customeNode[];
    setLocalTreeData(localData);
    // 设置本地数据对照
    const map: stringMap = {};
    treeDFS(localData, (node: customeNode) => {
      if (node?.key) {
        map[node?.key + ''] = node;
      }
    });
    setKey2NodeMap(map);
    // 重置标记
    hasTempNode.current = false;
  }, [treeData]);

  /**
   * 向外暴露节点的编辑方法
   */
  useImperativeHandle(ref, () => ({
    addNode: addNodeForEvent,
    appendNode: appendNodeForEvent,
    updateNode: updateNodeForEvent,
    deleteNode: deleteNodeForEvent,
  }));

  /**
   * 处理节点的input新建后默认选中
   */
  useEffect(() => {
    // 输入框选中任务的监听处理
    if (hasTempNodeSelectdTask.current) {
      setTimeout(() => {
        inputRef.current?.focus && inputRef.current.focus({ cursor: 'all' });
      }, 300);
      hasTempNodeSelectdTask.current = false;
    }
  }, [localTreeData]);

  /**
   * 定制化的tree
   */
  const TreeElement = (
    <LogicTree
      blockNode
      {...filterCustomProps(props)}
      // 每次都重新生成logicExpandedKeys，以解决antdesign Tree的无法展开bug
      expandedKeys={[...logicExpandedKeys]}
      onExpand={logicOnExpand}
      treeData={localTreeData}
      onDrop={handleTreeDrop}
      onRightClick={handleTreeRightClick}
      draggable={logicDraggable}
    >
      {children}
    </LogicTree>
  );

  /**
   * 邮件菜单的
   */
  const logicMenu = useMemo(() => {
    let res = null;
    if (menu) {
      if (typeof menu == 'function') {
        res = menu(key2NodeMap[activeNodeKey.current]);
      } else {
        res = menu;
      }
    } else {
      res = defaultMenuElement;
    }
    // 解决菜单点击不关闭的问题
    return <div onClick={() => setMenuVisible(false)}>{res}</div>;
  }, [menu, key2NodeMap, activeNodeKey.current]);

  return (
    <div className="edti-tree-wrap">
      {editAble ? (
        <Dropdown
          overlayClassName="u-tree-dropmenu"
          overlayStyle={props.overlayStyle || {}}
          trigger={['contextMenu']}
          overlay={logicMenu}
          visible={menuVisible}
          onVisibleChange={visible => {
            if (!visible) {
              // setActiveNodeKey('');
              activeNodeKey.current = '';
            }
            if (visible) {
              if (beforeRightClick(tempRightParams.current)) {
                setMenuVisible(visible);
              }
            } else {
              setMenuVisible(visible);
            }
          }}
        >
          <div style={{ width: '100%', height: '100%' }}>{TreeElement}</div>
        </Dropdown>
      ) : (
        TreeElement
      )}
    </div>
  );
});

export default EditTree;
