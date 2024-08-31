import { DataNode } from 'antd/lib/tree';
import { MailBoxModel } from 'api';
import { iconMap } from '../util';
import { FLOLDER } from '@web-mail/common/constant';

/**
 * 文件夹枚举
 */
// export enum FLOLDER {
//   // 收件箱
//   DEFAULT = 1,
//   // 发件箱
//   SENT = 3,
//   // 红旗邮件
//   REDFLAG = -1,
//   // 草稿箱
//   DRAFT = 2,
//   // 未审核 1
//   WAITINGISSUE = 17,
//   // 已审核 1
//   READYISSUE = 19,
//   // 订阅邮件
//   SUBSCRIPTION = 18,
//   // 广告
//   ADVITISE = 7,
//   // 垃圾邮件
//   SPAM = 5,
//   // 病毒
//   VIRUS = 6,
//   // 已删除
//   DELETED = 4,
//   // 其他
//   OTHERS = -2,
//   // 任务邮件
//   TASK = -9,
//   // 待办邮件
//   DEFER = -3,
//   // 标签 非后台约定，制作前端tag区分
//   TAG = -199
//   // >= 100 则为用户自定义文件夹 1
// }

/**
 * 文件夹id转数字
 * 因为数字类型的folderid传入tree中会存在问题，需要转换使用
 */
export const folderId2String = (list: any) => {
  if (Array.isArray(list)) {
    return list.map(id => id && id.toString());
  }
  return list.toString();
};

/**
 * 文件夹string Id 转数字
 * 因为数字类型的folderid传入tree中会存在问题，需要转换使用
 */
export const folderId2Number = (list: any) => {
  let res = list;
  if (Array.isArray(list)) {
    res = list.map(id => {
      try {
        return window?.parseInt(id);
      } catch (e) {
        console.warn('folderId2Number error', e);
      }
      return id;
    });
  } else {
    try {
      res = window?.parseInt(list);
    } catch (e) {
      console.warn('folderId2Number error', e);
    }
  }
  return res;
};

/**
 * 老的文件夹移动逻辑
 * todo: 待新逻辑稳定后删除
 */

// export const getForbidMoveFolderIdList = (mailFolderId: number, isSearching: number, selectedFolderId): number[] => {
//   let array = [-1, 2, 4, 5, 17, 19];
//   if (isSearching || selectedFolderId === -1 || selectedFolderId === -199) {
//     return [-1, 1, 2, 3, 4, 5, 6, 7, 17, 19];
//   }
//   if (mailFolderId === 1) {
//     array.splice(3, 1); // 收件箱可以移动至垃圾邮件
//   }
//   if (mailFolderId === 1 || mailFolderId === 3) {
//     array = array.concat([1, 3]);
//   } else if (mailFolderId === 5) {
//     array = array.concat([3]);
//   } else if (mailFolderId === 4) {
//     array.splice(1, 1);
//   } else {
//     array.splice(3, 1);
//   }
//   return array;
// };

/**
 * 获取禁止移入邮件的文件夹id
 * 用于支持文件夹的邮件拖拽功能
 * warn：由于可移动的文件夹无法穷举，只能返回可穷举的不可移动文件夹id
 */

/**
 *  灵犀办公App/桌面端中，邮件可移动范围整体说明：
    收件箱：可以移动到自定义文件夹、垃圾邮件文件夹
    发件箱：只能移动到自定义文件夹
    草稿箱：不能移动
    红旗邮件：在列表中不能批量移动，可以单封移动，可移动范围以邮件实际所在的文件夹规则为准。
    垃圾邮件：收件箱、自定义文件夹
    已删除：收件箱、发件箱、草稿箱、自定义文件夹
    待审核文件夹：不能移动。
    已审核文件夹：不能移动。
    自定义文件夹：收件箱、发件箱、垃圾邮件、自定义文件夹
    APP额外说明：因为红旗邮件其实不是个真实文件夹，所以红旗邮件列表中，多选邮件后不给【移动】按钮，红旗邮件详情页中可移动范围以邮件实际所在的文件夹规则为准。
    可移动范围，去除当前自身文件夹
 */

// todo: 文件夹的移动范围，应该通过函数挨个计算，这样才能解决id列表表达能力不够的问题
export const getForbidMoveFolderIdList = (mailFolderId: number, isSearching: boolean, selectedFolderId: number, isLocalImport?: boolean): number[] => {
  const allForbidList = [
    FLOLDER.REDFLAG,
    FLOLDER.DEFAULT,
    FLOLDER.DRAFT,
    FLOLDER.SENT,
    FLOLDER.DELETED,
    FLOLDER.SPAM,
    FLOLDER.ADVITISE,
    FLOLDER.VIRUS,
    FLOLDER.WAITINGISSUE,
    FLOLDER.READYISSUE,
    FLOLDER.TASK,
    FLOLDER.DEFER,
    FLOLDER.UNREAD,
    FLOLDER.DEFER,
    FLOLDER.TASK,
    FLOLDER.STAR,
  ];
  // 屏蔽星标联系人
  if (folderIdIsContact(mailFolderId)) {
    return allForbidList;
  }
  // 搜索，红旗，标签等虚拟文件夹下，只能移动到自定义文件夹-多选导致
  if (isSearching || selectedFolderId < 0) {
    return allForbidList;
  }
  let filterList: FLOLDER[] = [];
  if (isLocalImport) {
    filterList = [FLOLDER.DEFAULT, FLOLDER.SENT];
  } else if (mailFolderId === FLOLDER.DEFAULT) {
    // 收件箱可以移动至垃圾邮件或广告邮件
    filterList = [FLOLDER.SPAM, FLOLDER.ADVITISE];
  } else if ([FLOLDER.SPAM, FLOLDER.ADVITISE].includes(mailFolderId)) {
    // 垃圾邮件或广告邮件可以移动至收件箱
    filterList = [FLOLDER.DEFAULT];
  } else if (mailFolderId === FLOLDER.DELETED) {
    filterList = [FLOLDER.DEFAULT, FLOLDER.SENT, FLOLDER.DRAFT];
  } else if (!allForbidList.includes(mailFolderId)) {
    filterList = [FLOLDER.DEFAULT, FLOLDER.SENT, FLOLDER.SPAM, FLOLDER.ADVITISE];
  }
  return [...new Set([...allForbidList.filter(id => !filterList.includes(id)), mailFolderId])];
};

/**
 * 文件夹列表转换为”可移动弹窗“中的tree
 * 屏蔽掉置顶id中的节点
 */

export const folderList2CanMoveTree = (data: MailBoxModel, forbidIds: number[], className: string) => {
  const isShow = data.entry.mailBoxId > 0;
  const treeNode: DataNode = {
    className: className || '',
    key: folderId2String(data.entry.mailBoxId),
    title: data.entry.mailBoxName,
    isLeaf: !data.children?.length,
    icon: iconMap.get(data.entry?.mailBoxId),
    selectable: true,
    style: { display: isShow ? 'flex' : 'none' },
  };
  if (!treeNode.isLeaf && data.children && data.children.length > 0) {
    treeNode.children = data.children.map(node => folderList2CanMoveTree(node, forbidIds, className));
  }
  return treeNode;
};

/**
 * 根据文件夹id判断文件夹是否是虚拟文件夹
 */
export const folderIdIsVrFolder = (folderId: number | string) => {
  if (typeof folderId == 'number') {
    return folderId < 0;
  } else if (typeof folderId === 'string' && !folderIdIsContact(folderId)) {
    const id = parseInt(folderId + '');
    return id < 0;
  }
  return false;
};

/**
 * 根据文件夹id判断是否是实体文件夹
 */
export const folderIdIsRealFolder = (folderId: number | string) => {
  if (typeof folderId == 'number') {
    return folderId >= 0;
  } else if (typeof folderId === 'string' && !folderIdIsContact(folderId)) {
    const id = parseInt(folderId + '');
    return id > 0;
  }
  return false;
};

// 判断folderId是否是自定义文件夹
export const isCustomFolder = (folderId: number | string) => {
  if (typeof folderId == 'number') {
    return folderId >= 100;
  } else if (typeof folderId === 'string' && !folderIdIsContact(folderId)) {
    const id = parseInt(folderId + '');
    return id >= 100;
  }
  return false;
};

/**
 * 判断folderId是否是系统文件夹
 */
export const isSystemFolder = (folderId?: number | string) => {
  if (typeof folderId == 'number') {
    return folderId < 100;
  } else if (typeof folderId === 'string' && !folderIdIsContact(folderId)) {
    const id = parseInt(folderId + '');
    return id < 100;
  }
  return false;
};

/**
 * 文件夹id是否是联系人虚拟文件夹id
 */
export const folderIdIsContact = (id?: number | string) => {
  if (typeof id == 'number') {
    return false;
  } else if (typeof id === 'string' && id?.includes('##')) {
    return true;
  }
  return false;
};

/**
 * 文件夹id是否是联系人组
 * 联系人组也是属于联系人虚拟文件夹
 * 只不过是有更精细的业务判断
 */
export const folderIdIsContactGroup = (id?: number | string) => {
  if (id && folderIdIsContact(id) && id.toString().startsWith('org')) {
    return !0;
  }
  return false;
};

/**
 * 文件夹的id是否属于正常邮件文件夹
 */
export const isMailFolderId = (id: number | string): boolean => {
  if (typeof id == 'number') {
    return true;
  } else if (typeof id === 'string' && id?.includes('##')) {
    return false;
  }
  return true;
};

/**
 * 判断文件夹是否需要展示自己的未读数
 */

export const folderDisabledShowUnreadId = [FLOLDER.REDFLAG, FLOLDER.DELETED, FLOLDER.SPAM, FLOLDER.SENT];

export const folderCanShowUnread = (fid: number | string): boolean => {
  return folderDisabledShowUnreadId.includes(fid);
};
