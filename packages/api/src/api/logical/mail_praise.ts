import { Api } from '../_base/api';

export interface Pendant {
  pendantImageUrl: string;
}

export interface PraisePersonInfo {
  name: string;
  email: string;
  accountId: string;
}

export interface MedalInfo {
  id: number;
  name: string;
  status: number; // 当前人是否有这个勋章，0是没有，1是有
  description: string;
  imageUrl: string; // 奖章亮色
  grayImageUrl: string; // 奖章暗色
  pendantImageUrl: string; // 奖章挂件
  gifImageUrl: string;
}

export interface Medals {
  medals: MedalInfo[];
}

export interface PraiseInfo {
  id: string;
  medal: MedalInfo; // 奖章属性
  presenter: string; // 颁奖人
  presentationWords: string; // 颁奖词
  operator: PraisePersonInfo; // 操作人
  winners: PraisePersonInfo[]; // 表扬对象
}

export interface PraiseLetter {
  id: string;
  presenter: string; // 颁奖人
  presentationWords: string; // 颁奖词
  operator: PraisePersonInfo; // 操作人
  timestamp: Date;
}
export interface PersonMedalDetailInfo extends MedalInfo {
  count: number;
  praiseLetters: PraiseLetter[]; // 表扬内容信息
  asPendant: boolean; // 是否已经设置成为了头像挂饰 只能查询自己
}
export interface ResponsePersonMedalDetail {
  medals: PersonMedalDetailInfo[];
}

export interface CommonRes<T = any> {
  success: boolean;
  message?: string;
  code?: number;
  data?: T;
}

export interface MailPraiseApi extends Api {
  /**
   * 设置头像挂件 勋章id
   * @param id
   */
  setMedalPendant(id: number): Promise<CommonRes<Pendant>>;

  /**
   * 取消头像挂件 勋章id
   * @param id
   */
  cancelMedalPendant(id: number): Promise<CommonRes>;

  /**
   * 获取勋章列表
   */
  getMedals(): Promise<CommonRes<Medals>>;

  /**
   * 获取个人所有勋章详情 accountId 个人的qiyeAccountId
   * @param accountId
   */
  getPersonMedalDetail(accountId: string): Promise<CommonRes<ResponsePersonMedalDetail>>;

  // 设置当前用户挂件id
  setCurrentUserPendantId(id: number): void;
}
