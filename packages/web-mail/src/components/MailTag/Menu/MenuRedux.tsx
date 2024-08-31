import React from 'react';
import { MailEntryModel } from 'api';
import Menu from './Menu';

interface Props {
  mailTagList?: any;
  mailList: MailEntryModel[];
  isMerge?: boolean; // 聚合邮件
  Close?: () => void;
  onChange?: () => void;
}

// 用不到这个组件了 mailTagList 在Menu组件可以拿到
const MenuRedux: React.FC<Props> = props => <Menu {...props} />;

export default MenuRedux;
