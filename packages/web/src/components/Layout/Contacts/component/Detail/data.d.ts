import { ContactModel } from 'api';
import React from 'React';
import { UIContactModel } from '@/components/Layout/Contacts/data';

export interface ContactDetailProps {
  /**
   * 来自于那个模块的调用
   */
  from?: 'contact' | 'other';
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
  /**
   * 额外操作的扩展菜单，包含删除/编辑 只在通讯录模块的个人联系人有效
   */
  extraOpMenu?: React.ReactElement;
  smallerAvatarSize?: boolean;

  onNavigate?(): void;
  // 是否显示查看日程
  visibleSchedule?: boolean;
  customDetailInfo?: ReactNode;
  /**
   * 点击邮箱等方法是否通知父组件 默认false
   */
  onNotifyParent?(): void;
}

export interface ContactDetailInfoProps {
  contact: UIContactModel & ContactModel;
  branch?: boolean;
  directSend?: boolean;
  emailList: string[];
  phoneList: string[];
  // 是否显示查看日程
  visibleSchedule?: boolean;
  /**
   * 点击邮箱等方法是否通知父组件 默认false
   */
  onNotifyParent?(): void;
  customItems?: React.ReactNode;
}

export interface RenderItemsProps {
  items: string[];
  label: string;
  showPoint?: boolean;
  enableSend?: boolean;
  showCopy?: boolean;
  toSchedule?: boolean; // 点击查看日程
  toNumber?: boolean; // 点击查看成员
  visibleMailRelated?: boolean; //展示往来邮件
}
