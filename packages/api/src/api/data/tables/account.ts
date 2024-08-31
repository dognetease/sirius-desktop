import { lf } from '@/api/data/lovefield';
import { SchemaDef } from '@/api/data/new_db';
import { User } from '@/api/_base/api';
import type { AccountTypes } from '@/api/logical/login';
import { SystemEventTypeNames } from '@/api/data/event';

export interface AccountTable extends User {
  /**
   * 用户的唯一标识
   */
  id: string;
  // 关联联系人id
  contactId?: string;
  // 是否失效
  expired?: boolean;
  // 密码
  pwd?: string;
  // 当前账号状态
  status?: number;
  // 是否开启手机号登录验证
  enabledMobileLogin?: boolean;
  /**
   * 手机号登录用来 重登的token
   */
  refreshToken?: string;
  /**
   * 手机号登录用来 重登的token过期时间
   */
  refreshTokenExpire?: number;

  isSharedAccount?: boolean;
}

export interface MailSendReceiveInfo {
  sendHost?: string;
  sendPort?: number;
  sendSsl?: 0 | 1;
  receiveProtocol?: 0 | 1;
  receiveHost?: string;
  receivePort?: number;
  receiveSsl?: 0 | 1;
  password?: string;
  agentEmail?: string;
  agentNickname?: string;
}

// qyEmail 绑定为企业账号的企业邮账号
// personalEmail 其他
// 主账号
export type SubAccountDBTypes = 'personalEmail' | 'qyEmail' | 'mainAccount';

export interface SubAccountTableModel extends AccountTable {
  rowId?: number;
  accountType: SubAccountDBTypes;
  emailType: AccountTypes;
  mainAccount: string;
  expired?: boolean;
  agentEmail?: string;
  mainSendReceiveInfo?: MailSendReceiveInfo;
}

export interface SubAccountServerModel extends MailSendReceiveInfo {
  accountType: SubAccountDBTypes;
  emailType: AccountTypes;
  mainAccount?: string;
  accountEmail?: string;
  accountName?: string;
  domain?: string;
  agentEmail?: string;
  agentNickname?: string;
  expired?: boolean;
}

export interface IServerPersonalSubAccount {
  current_email?: string;
  email?: string;
  password?: string;
  account_name?: string;
  domain?: string;
  agent_email?: string;
  agent_nickname?: string;
  receive_host?: string;
  receive_port?: number;
  receive_ssl?: 0 | 1;
  send_host?: string;
  send_port?: number;
  send_ssl?: 0 | 1;
}

export interface SubAccountQuery {
  mainAccountEmail?: string;
  subAccountEmail?: string;
  expired?: boolean;
}

export interface SubAccountWinCreateInfo {
  mainAccountEmail: string;
  subAccountEmail: string;
  agentEmail: string;
  eventName?: SystemEventTypeNames;
  param?: { [key: string]: string | number };
  eventData?: any;
  sessionName?: string;
}

export interface ICurrentAccountInfo {
  email: string;
}

export type AccountInfoTable = AliasMailAccountInfoTable | MobileAccountInfoTable;
export interface AccountInfoBase {
  id: string;
  // 服务端给的id
  originId: string;
  // 关联account表
  accountId: string;
  // 头像
  avatar?: string;
  // 类型
  type: 'mobile' | 'alias';
  // 更改时间
  updateTime?: number;
  nickName?: string;
}

export interface AliasMailAccountInfoTable extends AccountInfoBase {
  // 账号@前的
  accountName: string;
  // 账号@后的
  domain: string;
  // 是否是代理
  isProxy?: boolean;
  // 是否是代理
  isDefault?: boolean;
}

export interface MobileAccountInfoTable extends AccountInfoBase {
  mobile: string;
  status: number;
  // 是否开启手机号登录
  enabledMobileLogin?: boolean;
  lastLoginTime?: number;
}

export interface lastLoginTimeOrder {
  lastLoginTime?: number;
  [key: string]: any;
}

export interface DomainTable {
  id: string;
  orgId: string;
  domain: string;
  type?: number;
}

type tableName = 'account' | 'accountInfo' | 'domain' | 'subAccount';

const { STRING, NUMBER, BOOLEAN, OBJECT, OBJECT_ARRAY } = lf.Type;

const AccountColumns = [
  {
    name: 'id',
    type: STRING,
  },
  {
    name: 'originId',
    type: STRING,
  },
  {
    name: 'contactId',
    type: STRING,
  },
  {
    name: 'accountName',
    type: STRING,
  },
  {
    name: 'domain',
    type: STRING,
  },
  {
    name: 'nickName',
    type: STRING,
  },
  {
    name: 'avatar',
    type: STRING,
  },
  {
    name: 'company',
    type: STRING,
  },
  {
    name: 'pwd',
    type: STRING,
  },
  {
    name: 'status',
    type: NUMBER,
  },
  {
    name: 'expired',
    type: BOOLEAN,
  },
  {
    name: 'enabledMobileLogin',
    type: BOOLEAN,
  },
  {
    name: 'token',
    type: STRING,
  },
  {
    name: 'sessionId',
    type: STRING,
  },
  {
    name: 'cookies',
    type: OBJECT_ARRAY,
  },
];

const account: SchemaDef<tableName> = {
  name: 'account',
  global: true,
  using: 'dexie',
  version: 4,
  tables: [
    {
      name: 'subAccount',
      columns: [
        ...AccountColumns,
        {
          name: 'accountType',
          type: STRING,
        },
        {
          name: 'mainAccount',
          type: STRING,
        },
        {
          name: 'rowId',
          type: NUMBER,
        },
        {
          name: 'mainInfo',
          type: OBJECT,
        },
      ],
      primaryKey: {
        columns: [{ name: 'rowId', autoIncrement: true }],
      },
      index: [
        {
          name: 'mainAccount',
          columns: ['mainAccount'],
          unique: false,
          multi: false,
        },
        {
          name: 'accountType',
          columns: ['accountType'],
          unique: false,
          multi: false,
        },
        {
          name: 'id',
          columns: ['id'],
          unique: false,
          multi: false,
        },
        {
          columns: ['mainAccount', 'id'],
        },
      ],
    },
    {
      name: 'account',
      columns: AccountColumns,
      primaryKey: {
        columns: [{ name: 'id', autoIncrement: false }],
      },
      index: [
        {
          name: 'originAccountIdx',
          columns: ['originId'],
          unique: true,
          multi: false,
        },
      ],
    },
    {
      name: 'accountInfo',
      columns: [
        {
          name: 'id',
          type: STRING,
        },
        {
          name: 'originId',
          type: STRING,
        },
        {
          name: 'accountId',
          type: STRING,
        },
        {
          name: 'type',
          type: STRING,
        },
        {
          name: 'avatar',
          type: STRING,
        },
        {
          name: 'accountName',
          type: STRING,
        },
        {
          name: 'domain',
          type: STRING,
        },
        {
          name: 'isProxy',
          type: BOOLEAN,
        },
        {
          name: 'isDefault',
          type: BOOLEAN,
        },
        {
          name: 'mobile',
          type: STRING,
        },
        {
          name: 'mobileArea',
          type: STRING,
        },
        {
          name: 'updateTime',
          type: NUMBER,
        },
        {
          name: 'prop',
          type: OBJECT,
        },
      ],
      primaryKey: {
        columns: [{ name: 'id', autoIncrement: false }],
      },
      index: [
        {
          name: 'accountIdx',
          columns: ['accountId'],
          unique: false,
          multi: false,
        },
      ],
    },
    {
      name: 'domain',
      columns: [
        {
          name: 'id',
          type: STRING,
        },
        {
          name: 'orgId',
          type: STRING,
        },
        {
          name: 'domain',
          type: STRING,
        },
        {
          name: 'type',
          type: NUMBER,
        },
      ],
      primaryKey: {
        columns: [{ name: 'id', autoIncrement: false }],
      },
      index: [
        {
          name: 'orgIdIdx',
          columns: ['orgId'],
          unique: false,
          multi: false,
        },
        {
          name: 'domainIdx',
          columns: ['domain'],
          unique: false,
          multi: false,
        },
      ],
    },
  ],
};

export default account;
