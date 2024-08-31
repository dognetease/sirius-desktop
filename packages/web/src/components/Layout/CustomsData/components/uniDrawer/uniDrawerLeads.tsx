/* eslint-disable camelcase */
import { SiriusExternalLeadsView, SiriusExternalLeadsDetail } from '@lxunit/app-l2c-crm';
import { ContactAddReq } from 'api';
import React, { useMemo } from 'react';
import { DataSource, source2CreateType, source2TrackerModule } from './uniDrawer';

export interface UniDrawerLeadsViewProps {
  leadsId: number;
  visible: boolean;
  isOpenSea?: boolean; // 是否是公海线索，不传会根据id拿到的详情数据做判断
  onClose?: (shouleUpdate?: boolean) => void;
  source?: keyof typeof DataSource; // 同 uniDrawer，用于区分打点
}

/**
 * @deprecated
 * 相关引用已移除，1010版本合并分支后删除
 * @param prop
 * @returns
 */
export const UniDrawerLeadsView = (prop: UniDrawerLeadsViewProps) => {
  const { visible, leadsId, isOpenSea, onClose, source } = prop;

  if (!visible) {
    return null;
  }

  return <SiriusExternalLeadsView isOpenSea={isOpenSea} leadsId={leadsId} show={visible} onClose={onClose} fromPageWay={source ? DataSource[source] : undefined} />;
};

export interface CustomerLeadRelationProps {
  recommend_id?: number;
  country_id?: string;
  company_name_id?: string;
  create_source?: CreateSourceDto;
}

export interface CreateSourceDto {
  /** 营销任务Key 跳转使用 */
  edm_key: string;
  /** 营销任务名称 */
  edm_name: string;
}
export interface UniDrawerLeadsDetailProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (params?: LeadsVO) => void;
  contactList: Partial<ContactAddReq>[]; // 和客户联系人的数据结构是一致的，只是客户是放在了一个 customerData 里，线索拆分成了 detailData 和 contactList。编辑线索不需要传，数据走接口
  source?: keyof typeof DataSource; // 同 uniDrawer，用于区分打点和新建来源
  leadsId?: number; // 区分新建or编辑,不传则为新建
  detailData?: Partial<LeadsVO>; // 线索数据
  relationParams?: CustomerLeadRelationProps; // 主站数据透传
}

/**
 * @deprecated
 * 相关引用已移除，1010版本合并分支后删除
 * @param prop
 * @returns
 */
export const UniDrawerLeadsDetail = (prop: UniDrawerLeadsDetailProps) => {
  const { visible, onClose, onSuccess, contactList, source, leadsId, detailData, relationParams } = prop;

  if (!visible) {
    return null;
  }

  const detail = useMemo(
    () =>
      leadsId
        ? undefined
        : {
            ...detailData,
            create_type: source2CreateType[source as keyof typeof source2CreateType] ?? 1,
          },
    [leadsId, detailData]
  );

  console.log('UniDrawerLeadsDetail', leadsId, detail, relationParams);

  return (
    <SiriusExternalLeadsDetail
      leadsId={leadsId}
      open={visible}
      onClose={onClose}
      onSuccess={onSuccess}
      detail={detail}
      contactList={contactList}
      relationParams={relationParams}
      // fromPageWay={source} // 打点预留
    />
  );
};

/* eslint-disable camelcase */
interface CustomizedFieldValue {
  field_id: string;
  value: string;
}

interface ContactExtInfo {
  key: string;
  value: string;
}

interface CustomerContactInfo {
  /** 联系方式内容，比如 l@ling.com, +5076-87088708 */
  contact_content: string;
  /** 联系方式类型， EMAIL 邮箱， TEL 电话，WHATSAPP  */
  contact_type: string;
  /** 邮箱是否有效 */
  valid: boolean;
  /** 邮箱有效性code，-1：未检测； 0：地址不存在；1：有效地址；2：长期不活跃；3：域名服务器错误 */
  verify_status: number;
}
interface ManagerDto {
  /** 负责人邮箱 */
  email: string;
  /** 头像链接 */
  iconUrl: string;
  /** 负责人id */
  id: string;
  /** 最后沟通时间 */
  lastMailTime: number;
  /** 负责人姓名 */
  manager_name: string;
  /** 负责人姓名+邮箱, 格式: 张三(zhangsan@lx.net.com) */
  name: string;
}
interface LabelVO {
  /** 标签创建人信息 */
  create_account: ManagerDto;
  /** 标签创建人id */
  create_account_id: string;
  /** 标签颜色，RGB */
  label_color: string;
  /** 标签下企业数量 */
  label_company_count: number;
  /** 标签下联系人数量 */
  label_contact_count: number;
  /** 标签创建时间 */
  label_create_time: string;
  /** 标签id */
  label_id: number;
  /** 标签名称 */
  label_name: string;
  /** 标签备注 */
  label_remark: string;
  /** 标签类型，0-客户个人标签，1-联系人标签 */
  label_type: number;
}
interface SocialPlatformVO {
  name: string;
  number: string;
  /** 0:其他; 1:Skype; 2:Facebook; 3:Linkedin; 4:Youtube; 5,Twitter; 6: Instagram; 7:Zalo; 8: Viber; 9: Wechat; 10:QQ; 11:旺旺; 12:钉钉,13 whatsapp */
  type: string;
}
interface BusinessContactVO {
  /** 地址 */
  address: Array<string>;
  /** 地区 */
  area: Array<string>;
  /** 附件 json数组字符串 */
  attachment: string;
  /** 生日 */
  birthday: string;
  /** 是否是黑名单 */
  blacklist: boolean;
  /** 市 */
  city: string;
  /** 联系人头像 */
  contact_icon: string;
  /** 联系人ID */
  contact_id: string;
  /** 联系方式 */
  contact_infos: Array<CustomerContactInfo>;
  /** 联系人姓名 */
  contact_name: string;
  /** 洲 */
  continent: string;
  /** 国家 */
  country: string;
  /** 创建时间 */
  create_time: string;
  /** 是否为主要决策人 */
  decision_maker: boolean;
  /** 部门 */
  department: string;
  /** 联系人邮箱 */
  email: string;
  /** 附加信息 */
  ext_infos: Array<ContactExtInfo>;
  /** 性别 0: 未知， 1 男， 2 女 */
  gender: string;
  /** 主页 */
  home_page: string;
  /** 职位 */
  job: string;
  /** 标签列表，废弃字段，不用关注 */
  label_list: Array<LabelVO>;
  /** 是否为主联系人 */
  main_contact: boolean;
  /** 省 */
  province: string;
  /** 是否被退订 */
  rejected: boolean;
  /** 备注 */
  remark: string;
  /** 社交平台 */
  social_platform: Array<SocialPlatformVO>;
  /** 联系人数据来源 */
  source_name: string;
  /** 电话 */
  telephone: string;
  /** 邮箱是否有效 */
  valid: boolean;
  /** 邮箱有效性状态，-1：未检测； 0：地址不存在；1：有效地址；2：长期不活跃；3：域名服务器错误 */
  verify_status: number;
  /** whats_app */
  whats_app: string;
}
export interface LeadsVO {
  /** 地址 */
  address: string;
  /** 国家地区 */
  area: Array<string>;
  /** 市 */
  city: string;
  /** 公司logo */
  company_logo: string;
  /** 公司名称 */
  company_name: string;
  /** 洲 */
  continent: string;
  /** 国家 */
  country: string;
  /** 创建人姓名 */
  create_by: string;
  /** 创建人id */
  create_by_id: string;
  /** 创建时间 */
  create_time: string;
  /** 创建方式 */
  create_type: number;
  /** 自定义字段 */
  customized_field_value: Array<CustomizedFieldValue>;
  enter_time: string;
  /** 传真 */
  fax: string;
  /** 导入批次 */
  import_batch: string;
  /** 无效原因备注 */
  invalid_reason: string;
  /** 无效原因状态 */
  invalid_status: number;
  /** 线索ID */
  leads_id: number;
  /** 线索名称 */
  leads_name: string;
  /** 线索编号 */
  leads_number: string;
  /** 线索资料完善度 */
  leads_score: string;
  /** 主联系人 */
  main_contact: BusinessContactVO;
  /** 主营行业 */
  main_industry: number;
  /** 负责人列表 */
  manager_list: Array<ManagerDto>;
  /** 下次跟进时间 */
  next_follow_at: string;
  /** 需求产品类型 */
  product_require_level: number;
  /** 省 */
  province: string;
  /** 最近跟进时间 */
  recent_follow_at: string;
  /** 最近跟进人姓名 */
  recent_follow_by: string;
  /** 最近跟进人id */
  recent_follow_by_id: string;
  /** 转客户后的客户是否被删除 */
  relation_company_deleted: boolean;
  /** 转客户后的id, 转客户后会有这个值 */
  relation_company_id: number;
  /** 转客户后的客户名称，转客户后会有这个值 */
  relation_company_name: string;
  /** 线索备注 */
  remark: string;
  /** 需求商品描述 */
  require_product: string;
  /** 销售方式 */
  sales_type: number;
  /** 规模 */
  scale: number;
  /** 社交平台 */
  social_media: Array<SocialPlatformVO>;
  /** 线索来源 */
  source: number;
  /** 星级 */
  star_level: number;
  /** 线索状态 */
  status: number;
  /** 座机电话 */
  telephone: string;
  /** 是否未读 */
  unread: boolean;
  /** 更新人姓名 */
  update_by: string;
  /** 更新人id */
  update_by_id: string;
  /** 更新时间 */
  update_time: string;
  /** 公司官网 */
  website: string;
}
