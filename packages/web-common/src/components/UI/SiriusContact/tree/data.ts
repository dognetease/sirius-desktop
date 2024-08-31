import { AccountTypes, api, ContactModel, ContactTreeType, ContactItem, EntityOrg } from 'api';
import { ContactTreeDataNode, ContactTreeLeaf, ContactTreeNode, ContactTreeOrgNodeType, ContactOrgItem } from '@web-common/components/util/contact';
import { StaticRootNodeKey } from '@web-common/utils/contact_util';
import { getIn18Text } from 'api';

// export type ContactTypeRootKey =  'enterpriseRoot' | 'personalRoot' | 'teamRoot' |'recentRoot' | 'customerRoot';
/**
 * 联系人树基础参数
 */
export interface ContactTreeBase {
  // 树的高度
  treeHeight: number;
  // 树的宽度
  treeWidth?: number;
  // 是否展开树
  treeExpand?: boolean;
  // 初始化数据
  treeInitData?: ContactTreeDataNode[];
  //使用contactId作为选中的key
  useContactId?: boolean;
  // 是否可以多选
  multiple?: boolean;
  // 是否需要checkbox
  showCheckbox?: boolean;
  // 是否展示头像
  showAvatar?: boolean;
  // 不可以选择的列表
  disableCheckList?: ContactItem[];
  // 默认选中的列表
  defaultSelectList?: ContactItem[];
  // 默认展开的节点id
  defaultExpandedKeys?: Array<StaticRootNodeKey>;

  expandedKeys?: Set<string>;

  // 选中联系人的回调函数
  onSelect?(data: ContactTreeDataNode): void;

  // 展开收起节点回掉
  onExpand?(type: ContactTreeOrgNodeType, isOpen: boolean): void;

  // TODO：选中组织的回调函数
  onOrgSelect?(org: EntityOrg): void;

  // 节点渲染
  renderTitle?: (data: ContactTreeLeaf) => React.ReactElement | undefined;

  // 叶子渲染
  renderNode?: (data: ContactTreeNode) => React.ReactElement | undefined;

  // 展开节点加载数据回调
  loadData?: (data: ContactTreeNode) => Promise<void> | undefined;

  onLoadMoreNode?: (data: ContactTreeNode) => Promise<void> | undefined;

  // 分页当前是否还能继续加载
  hasMore?: boolean;
  // 列表装饰
  cardGroupDecorate?: any[];
}

/**
 * 联系人树对外开放属性
 */
export interface ContactTreeProp {
  // 需要高亮的keys
  selectedKeys?: string[];
  // 初始化后是否出发默认选中高亮keys
  selectDefaultNodeOnInited?: boolean;
  // 当前账号
  accountRootKey?: string;
  // 是否展示edm数据
  useEdm?: boolean;
  // 是否展示多账号数据
  useMultiAccount?: boolean;
  // 需要展示树的类型
  type?: ContactTreeType[];
  // 树排序的方式
  order?: ContactTreeType[];
  // 是否展示添加部门按钮
  showAddOrgBtn?: boolean;
  // 是否展示添加群组按钮
  showAddTeamBtn?: boolean;
  // 是否展示添加分组按钮
  showAddPersonalBtn?: boolean;
  // 是否展示分割线
  showSeparator?: boolean;
  // 是否展示个人星标联系人
  showPersonalMark?: boolean;
  // 是否可以查看邮件列表成员
  showMailListEye?: boolean;
  // 根组织名称
  enterpriseRootName?: string;
  // 个人根名称
  personalRootName?: string;
  // 最近联系人根名称
  recentRootName?: string;
  // 群根名称
  teamRootName?: string;
  // 是否只加载im 需要的组织
  isIM?: boolean;
  // 不展示当前用户
  excludeSelf?: boolean;

  // 是否需要checkbox
  showCheckbox?: boolean;
  // 是否展示头像
  showAvatar?: boolean;

  // 是否展示联系人
  showContact?: boolean;

  // 是否展示部门人数
  showOrgMemberNum?: boolean;

  // 选中联系人的回调函数
  onContactSelect?(selectList: ContactOrgItem[], cur: ContactOrgItem[]): void;

  // 当节点星标
  onMarked?(marked: boolean, item: ContactTreeDataNode): void;

  // 展开收起节点回掉
  onExpand?(type: ContactTreeOrgNodeType, isOpen: boolean): void;
  // 点击组织
  onSelectNode?(node: ContactTreeDataNode, account: string): void;
  // 右键组织
  onContextMenu?(node: ContactTreeDataNode, account: string): void;
  // 渲染title尾部
  renderTitleSuffix?: (data: ContactTreeDataNode, _account: string) => React.ReactElement;
  // 渲染title（现在只支持渲染类型的根节点） // TODO,提供titleRender能力，把当前已经渲染的组件作为参数，暴露给调用组件使用
  titleRenderMap?: Partial<Record<StaticRootNodeKey, (title: React.ReactElement) => React.ReactElement>>;
  // 渲染根节点前的装饰
  contactTreeDecorateMap?: ContactTreeDecorateProp;
  // 当树加载完成
  onInited?(_account: string): void;
  // 不可以选择的列表
  disableCheckList?: ContactOrgItem[];
  // 默认选中的列表
  defaultSelectList?: ContactOrgItem[];

  // 默认展开的节点id
  defaultExpandedKeys?: Array<StaticRootNodeKey>;
  //使用contactId作为选中的key
  useContactId?: boolean;
  // 组织是否可以当作一个最小单位选中
  useOrgUnit?: boolean;
  // 是否可以多选
  multiple?: boolean;
  noRelateEnterprise?: boolean;
  // 节点下无数据是否展示空数据
  showNoDataPlaceholder?: boolean;
}

export type ContactTreeDecorateProp = Map<
  string,
  Map<
    string,
    {
      element: React.ReactElement;
      show?: boolean;
      height: number;
      distance?: number;
      name?: string;
    }
  >
>;

/**
 * 联系人账号对应属性
 */
export interface ContactTreeAccountProp extends ContactTreeProp {
  accountType?: AccountTypes;
  isSingleAccount?: boolean;
  isMainAccount?: boolean;
  rootTitle?: string;
  _account?: string;
  // 树的高度
  treeHeight: number;
  treeWidth?: number;
  activeAccountKey?: string;
}

export type treeTypeMap = {
  [props in ContactTreeType]?: ContactTreeDataNode[];
};

export type LoadKeysMap = Map<ContactTreeType | 'root' | 'personal_info', Set<string>>;

const sysApi = api.getSystemApi();

export const isCurrentUser = (item: ContactItem | ContactModel) => {
  const id = (item as ContactItem)?.id || (item as ContactModel)?.contact?.id;
  return id === sysApi.getCurrentUser()?.contact?.contact?.id;
};
const rootNameText = {
  enterprise: 'QIYETONGXUNLU',
  personal: 'GERENTONGXUNLU',
  recent: 'ZUIJINLIANXIREN',
  team: 'WODEQUNZU',
  customer: 'myCustomer',
  clue: 'myClue',
  orgBtn: 'XUANZEZUZHI',
  teamBtn: 'XUANZEQUNZU',
  personalOrgBtn: 'XUANZEFENZU',
  select: 'select',
  allPersonal: 'SUOYOULIANXIREN',
  markPersonalList: 'markContactAndOrg',
  noGroupPersonal: 'WEIFENZULIANXI',
  rencentSendMail: 'ZUIJINFAGUOXIN',
  memberList: 'CHAKANCHENGYUANXIN',
  notVisible: 'contact_tree_not_visible',
  contactAdmin: 'contact_tree_contact_admin',
  noContact: 'ZANWULIANXIREN',
};
type rootNameType = keyof typeof rootNameText;
export const transTreeName = (name: rootNameType) => {
  return getIn18Text(rootNameText[name]);
};
