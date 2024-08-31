import { ResponseSignature, WriteLetterPropType } from '../..';
import { Api } from '../_base/api';

export interface SignDetail {
  divContent: string; // div内容, 可能有特殊字符
  htmlContent: string; // 全部html内容
  isFromApp: boolean; // 是否为定制的模板签名
  signId: number; // 签名id
  signInfoDTO: SignInfo; // 签名详细内容
  _account: string; // 所属账号（多账号兼容）
}

export interface SignInfo {
  addr: string; // 联系地址
  companyName: string; // 公司名
  emailAddr: string; // email地址
  defaultItem: {
    control: boolean; // 总开关
    compose: boolean; // 写信场景下默认签名
    forward: boolean; // 转发场景下默认签名
    reply: boolean; // 回复场景下默认签名
  };
  isSetDefault: boolean; // 是否设置默认
  name: string; // 姓名
  phoneNo: string; // 联系号码
  position: string; // 职位
  profilePhoto: string; // 头像
  showAppVipTag: boolean; // 是否展示由灵犀端定制
  signId: number; // 个人签名唯一id
  signTemplateId: number; // 当前使用的签名模板id
  signTemplateUrl: string; // 当前使用的签名模板url
  userAddItem: string[]; // 自定义签名字段
}

export interface SignTemplate {
  id: number;
  picUrl: string; // 图片url地址
}

export interface SignTemplateAndProfile {
  profile: string;
  templatePics: SignTemplate[];
}

export interface SignListReq {
  sid?: string;
  isFirstGet?: boolean;
  needHtmlContent?: boolean;
}

export interface AddSignReq extends Partial<SignInfo> {
  name: string;
  profilePhoto?: string; // 传了就少调一个借口 来源于SignTemplateAndProfile
}

export interface AddCustomizeSignReq {
  isDefault: boolean;
  rtxContent: string;
}

export interface UpdateSignReq extends Partial<SignInfo> {
  name: string;
  profilePhoto: string;
  signId: number;
}

export interface UpdateCustomizeSignReq {
  isDefault: boolean;
  rtxContent: string;
  signId: number;
}

export interface SetDefaultReq {
  signId: number;
  _account?: string;
  defaultItem: {
    control: boolean;
    compose: boolean;
    reply: boolean;
    forward: boolean;
  };
}

export interface SignPreviewReq {
  needHtmlContent: boolean;
  signInfo: AddSignReq;
}

export interface SignPreviewRes {
  divHtml: string; // 图片div
  html: string; // 图片html
}

export interface SignCommonRes<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AddSignRes {
  signId: number;
}

export interface UploadSignAvatarRes {
  picUrl?: string;
}

export interface MailSignatureApi extends Api {
  /**
   * 获取签名列表
   */
  doGetSignList(params: SignListReq, _account?: string): Promise<SignCommonRes<SignDetail[]>>;

  /**
   * 获取签名详情
   */
  doGetSignDetail(id: number): Promise<SignCommonRes<SignDetail>>;

  /**
   * 获取签名预览
   */
  doGetSignPreview(params: SignPreviewReq, _account?: string): Promise<SignCommonRes<SignPreviewRes>>;

  /**
   * 新增签名
   */
  doAddSign(params: AddSignReq & AddCustomizeSignReq, _account?: string): Promise<SignCommonRes<AddSignRes>>;

  /**
   * 编辑签名
   */
  doUpdateSign(params: UpdateSignReq & UpdateCustomizeSignReq, _account?: string): Promise<SignCommonRes<SignDetail>>;

  /**
   * 设置是否默认签名
   */
  doSetDefaultSign(params: SetDefaultReq, _account?: string): Promise<SignCommonRes>;

  /**
   * 删除签名
   */
  doDeleteSign(signId: number, _account?: string): Promise<SignCommonRes>;

  /**
   * 上传前面头像
   */
  doUploadSignAvatar(picFile: File): Promise<SignCommonRes<UploadSignAvatarRes>>;

  /**
   * 获取签名模版列表
   */
  doGetSignTemplate(): Promise<SignCommonRes<SignTemplate[]>>;

  /**
   * 获取该用户所有签名模板和缺省头像url
   */
  doGetSignTemplateAndProfile(avatarDisplayName?: string, _account?: string): Promise<SignCommonRes<SignTemplateAndProfile>>;

  /**
   * 获取默认签名
   */
  doGetDefaultSign(noCache?: boolean, writeType?: WriteLetterPropType, _account?: string): Promise<ResponseSignature>;
}
