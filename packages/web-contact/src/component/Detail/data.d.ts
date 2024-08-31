import { ContactModel } from 'api';
import React from 'React';
import { UIContactModel } from '../../data';

export interface ContactDetailProps {
  /**
   * 来自于那个模块的调用
   */
  from?: 'contact' | 'other';

  contactId?: string;

  email?: string;
  /**
   * 联系人信息
   */
  contact?: UIContactModel & ContactModel;
  /**
   * 是否显示部门 默认false
   */
  branch?: boolean;
  /**
   * 是否显示分割线 默认true
   */
  dividerLine?: boolean;
  /**
   * 点击邮箱是否直接调用写信 默认ture
   */
  directSend?: boolean;
  /**
   * 是否显示联系人姓名toolip
   */
  toolipShow?: boolean;
  /**
   * container样式类
   */
  containerClassName?: string;
  /**
   * container样式对象
   */
  containerStyle?: React.CSSProperties;

  smallerAvatarSize?: boolean;

  onNavigate?(): void;
  // 是否显示查看日程
  visibleSchedule?: boolean;
  /**
   * 点击邮箱等方法是否通知父组件 默认false
   */
  onNotifyParent?(): void;
  /**
   * 联系人操作成功后通知
   */
  onOperateSuccess?(): void;

  // 是否展示关闭按钮
  showClose?: boolean;

  //分账号
  _account?: string;

  /**
   * 邮箱默认名称
   */
  originName?: string;
  /**
   * 是否选中的是星标联系人节点
   */
  isSelectedPersoanlMark?: boolean;
  /**
   * 是否是邮件列表
   */
  isMailList?: boolean;
  /**
   * 是否是我管理可删除的邮件列表
   */
  isDeleteManageMailList?: boolean;
  /**
   * 是否是我管理可编辑的邮件列表
   */
  isEditManageMailList?: boolean;
}

export interface ContactDetailInfoProps {
  contact: UIContactModel & ContactModel;
  branch?: boolean;
  directSend?: boolean;
  emailList: string[];
  phoneList: string[];
  // 多账号，是否为主账号
  isMainAccount?: boolean;
  // 是否显示查看日程
  visibleSchedule?: boolean;
  /**
   * 点击邮箱等方法是否通知父组件 默认false
   */
  onNotifyParent?(): void;
  _account?: string;
}

export interface RenderItemsProps {
  items: string[];
  label: string;
  showPoint?: boolean;
  enableSend?: boolean;
  enableVisit?: boolean;
  showCopy?: boolean;
  toSchedule?: boolean; // 点击查看日程
  toNumber?: boolean; // 点击查看成员
  visibleMailRelated?: boolean; //展示往来邮件
}
