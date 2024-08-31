import { inWindow, MailBoxModel } from 'api';
import { FLOLDER, FOLDER_TREE_MAX_COUNT, FOLDER_TREE_MAX_DEEP } from '../../common/constant';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { treeDFS, getTreeNodeById, reduxMessage, folderIdIsContact } from '../../util';
import { mailListStateTabSelected } from 'types';
import { getIn18Text } from 'api';

/**
 * 文件夹id是否需要按照top邮件排序
 * // -1 红旗，4 已删除 5 垃圾邮件 -199 标签搜索
 */
// TODO Tony:红旗邮件文件夹和虚拟列表接口不支持top flag， 从这里过滤掉
export const folderCanSortByTop = (fid: number, isCorpMail: boolean = false) =>
  !isCorpMail
    ? fid && !folderIdIsContact(fid) && fid != FLOLDER.DELETED && fid != FLOLDER.SPAM && fid > 0
    : fid && fid !== FLOLDER.SPAM && fid !== FLOLDER.TASK && fid !== FLOLDER.UNREAD;

// 非排序字段可添加邮件置顶参数
export const orderCanSortByTop = (mailListStateTab: mailListStateTabSelected) => {
  return mailListStateTab === 'ALL' || !mailListStateTab.startsWith('ORDER_BY_');
};
/**
 * 文件夹移动-校验文件夹中是否包含重名子文件夹
 * @nodeList 目标文件夹的子文件夹列表
 */
export const validateFolderHasRepeatName = (nodeList: MailBoxModel[]): boolean => {
  let isRepeat: boolean = false;
  try {
    if (nodeList && nodeList.length) {
      const nameList = nodeList.map(item => item.entry.mailBoxName.toLowerCase().trim());
      isRepeat = nameList.length !== [...new Set(nameList)].length && nodeList.length > 0;
    }
  } catch {
    return isRepeat;
  }
  return isRepeat;
};

/**
 * 文件夹移动-检验目标文件夹是否与当前文件夹重名
 * @nodeList 目标文件夹的子文件夹列表
 *
 */
export const checkRepeatFromFolderList = (nodeList: MailBoxModel[], node: MailBoxModel): boolean => {
  try {
    if (nodeList && nodeList.length) {
      return nodeList.some(item => {
        const name = item?.entry?.mailBoxName;
        const aimName = node?.entry?.mailBoxName;
        if (name != null && aimName != null) {
          return name.toLowerCase().trim() === aimName.toLowerCase().trim();
        }
        return false;
      });
    }
  } catch {
    return false;
  }
  return false;
};

/**
 * 文件夹移动-校验文件夹是否重名
 * @nodeList 目标文件夹的子文件夹列表
 * @node 当前操作的文件夹
 */
export const validateFolderNameIsRepeat = (nodeList: MailBoxModel[], node: MailBoxModel): boolean => {
  let isRepeat: boolean = false;
  try {
    if (nodeList && nodeList.length) {
      isRepeat = nodeList.find(item => item.entry.mailBoxName.toLowerCase().trim() === node.entry.mailBoxName.toLowerCase().trim()) != null;
    }
  } catch {
    return isRepeat;
  }
  return isRepeat;
};
/**
 * 文件夹移动-校验是否超出最大数量限制
 * @param tree 文件夹树
 * @returns 是否超出
 */
export const validateFolderCountOverMax = (tree: MailBoxModel | MailBoxModel[]): boolean => {
  let sum = 0;
  treeDFS(tree, () => {
    sum += 1;
  });
  return sum > FOLDER_TREE_MAX_COUNT;
};
/**
 * 文件夹移动-检验是否超出最大深度
 * @param node
 * @returns
 */
export const validateFolderDeepOverMax = (node: MailBoxModel): boolean => node && node.entry._deep != null && node.entry._deep > FOLDER_TREE_MAX_DEEP;
/**
 * 文件夹移动,新建，更新的合法性校验-文件夹tree中已经包含了操作后的节点
 * @tree 整个文件夹树
 * @returns
 */
export const validateFolderOperIncludeNode = (tree: MailBoxModel | MailBoxModel[]): boolean => {
  // 检测深度
  let isOverMaxDeep = false;
  treeDFS(tree, (node: MailBoxModel) => {
    if (!isOverMaxDeep && validateFolderDeepOverMax(node)) {
      isOverMaxDeep = true;
    }
  });
  if (isOverMaxDeep) {
    Message.warn({
      content: `移动失败,最多可新建${FOLDER_TREE_MAX_DEEP}级子文件夹`,
    });
    return false;
  }
  // 检测最大数量
  if (validateFolderCountOverMax(tree)) {
    Message.warn({
      content: getIn18Text('YIDONGSHIBAI\uFF0C13'),
    });
    return false;
  }
  // 检测重名
  let isRepeatName = false;
  treeDFS(tree, (node: MailBoxModel) => {
    const childList: MailBoxModel[] = node.children || [];
    if (childList && childList.length && !isRepeatName) {
      if (validateFolderHasRepeatName(childList)) {
        isRepeatName = true;
      }
    }
  });
  // 因为没有根节点，最外层的节点需要自己检测
  if (!isRepeatName && Array.isArray(tree)) {
    if (validateFolderHasRepeatName(tree)) {
      isRepeatName = true;
    }
  }
  if (isRepeatName) {
    Message.warn({
      content: getIn18Text('YIDONGSHIBAI\uFF0C14'),
    });
    return false;
  }
  return true;
};
export const validateFolderListIncludeName = (tree: MailBoxModel[], name: string): boolean =>
  !!tree.find(node => node.entry.mailBoxName.trim().toLowerCase() === name.trim().toLowerCase());
/**
 * 文件夹移动的合法性校验-针对当前操作节点
 * @param ParentNode 当期操作节点的父节点,传入list则为最高层级
 */
export const validateFolderOperForNode = (
  tree: MailBoxModel | MailBoxModel[],
  curNode: MailBoxModel,
  dragNode: MailBoxModel,
  dropToGap: boolean,
  dropPosition: number
): boolean => {
  // 参数检测
  if (!tree || !curNode || !dragNode) {
    return false;
  }

  const nodePid = curNode?.entry?.pid || 0;
  const nodeId = curNode?.entry?.mailBoxId;
  const dragNodePid = dragNode?.entry?.pid || 0;
  const dragId = dragNode?.entry?.mailBoxId;
  const dragName = dragNode?.entry?.mailBoxName;
  // 是否是跨层级拖拽
  const isCross = nodePid !== dragNodePid;
  let systemFolderList = getSystemTopFolder(tree);
  let isRepeatName = false;
  let isOverDeep = false;
  let systemFolderPosiError = false;
  let systemFolderInsertError = false;
  // 过滤出系统文件夹
  // tree.forEach(node => {
  //   const pid = node?.entry?.pid || 0;
  //   if(pid == 0){
  //     systemFolderList.push(pid);
  //   }
  // });
  // 不能插入到收件箱前面
  // if (dropPosition && dropPosition < 0 && nodeId === FLOLDER.DEFAULT) {
  //   Message.error({
  //     content: '不能插入到收件箱上方'
  //   });
  //   return false;
  // }

  // 收件箱不能移动
  // if (dragId == FLOLDER.DEFAULT) {
  //   Message.warn({
  //     content: getIn18Text("SHOUJIANXIANGBUNENG")
  //   });
  //   return false;
  // }
  // 如果是排序
  if (dropToGap) {
    if (nodePid === 0) {
      // todo： 要验证的目标并不在树里
      if (isCross && checkRepeatFromFolderList(systemFolderList, dragNode)) {
        isRepeatName = true;
      }
    } else {
      const parentNode = getTreeNodeById(tree, nodePid);
      if (isCross && validateFolderListIncludeName(parentNode?.children, dragName)) {
        isRepeatName = true;
      }
    }
  } else {
    // 如果是插入
    if (nodeId === 0) {
      if (checkRepeatFromFolderList(systemFolderList, dragNode)) {
        isRepeatName = true;
      }
    } else {
      // 如果是系统文件夹，不允许插入到自定义文件夹下
      if (dragId < 100) {
        systemFolderPosiError = true;
      }
      // 任何文件夹不允许插入到虚拟文件夹下
      if (nodeId < 0) {
        systemFolderInsertError = true;
      }
      if (nodeId != dragNodePid && validateFolderListIncludeName(curNode?.children, dragName)) {
        isRepeatName = true;
      }
      if (curNode.entry._deep - 1 >= FOLDER_TREE_MAX_DEEP) {
        isOverDeep = true;
      }
    }
  }
  if (systemFolderPosiError) {
    Message.error({
      content: getIn18Text('XITONGWENJIANJIA'),
    });
    return false;
  }
  if (systemFolderInsertError) {
    Message.error({
      content: getIn18Text('BUNENGCHARUDAO'),
    });
    return false;
  }
  if (isRepeatName) {
    Message.error({
      content: getIn18Text('YIDONGSHIBAI\uFF0C14'),
    });
    return false;
  }
  if (isOverDeep) {
    Message.error({
      content: `移动失败,最多可新建${FOLDER_TREE_MAX_DEEP}级子文件夹`,
    });
    return false;
  }
  return true;
};
/**
 * 从文件夹树种获取 一级文件夹列表，排除更多文件夹，包含更多文件夹下的一级节点
 */
export const getSystemTopFolder = (tree: MailBoxModel[]): MailBoxModel[] => {
  const systemFolderList: MailBoxModel[] = [];
  tree.forEach(node => {
    const pid = node?.entry?.pid || 0;
    if (pid == 0) {
      systemFolderList.push(node);
    }
  });
  return systemFolderList;
};

/**
 * 文件夹移动-校验文件夹中是否包含重名子文件夹 - 待验证的节点不在节点树种
 * @nodeList 目标文件夹的子文件夹列表
 */
export const validateFolderHasRepeatNamePrue = (nodeList: MailBoxModel[], aimNode: MailBoxModel): boolean => {
  let isRepeat: boolean = false;
  try {
    if (nodeList && nodeList.length) {
      const nameList = nodeList.map(item => item.entry.mailBoxName.toLowerCase().trim());
      isRepeat = nameList.includes(aimNode.entry.mailBoxName);
    }
  } catch {
    return isRepeat;
  }
  return isRepeat;
};

/**
 * 过滤掉非主账号不需要展示的文件夹
 */
export const filterNotMainFolder = (list: MailBoxModel[]) => {
  if (list && Array.isArray(list)) {
    return list.filter(
      (item: MailBoxModel) =>
        item.entry.mailBoxId != FLOLDER.TASK &&
        item.entry.mailBoxId != FLOLDER.WAITINGISSUE &&
        item.entry.mailBoxId != FLOLDER.READYISSUE &&
        item.entry.mailBoxId != FLOLDER.DEFER &&
        item.entry.mailBoxId != FLOLDER.UNREAD &&
        item.entry.mailBoxId != FLOLDER.STAR
    );
  }
  return list;
};
