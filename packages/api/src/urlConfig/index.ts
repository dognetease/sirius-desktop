import Contact, { ContactUrlKeys } from './contact';
import EdmContact, { EdmContactUrlKeys } from './edm_contact';
import Account, { AccountUrlKeys } from './account';
import Login, { LoginUrlKeys } from './login';
import Register, { RegisterUrlKeys } from './register';
import Disk, { DiskUrlKeys } from './disk';
import IM, { IMUrlKeys } from './im';
import Catalog, { CatalogUrlKeys } from './catalog';
import MeetingRoom, { MeetingRoomUrlKeys } from './meeting_room';
import GlobalUrl, { GlobalUrlKeys } from './global';
import Mail, { MailUrlKeys } from './mail';
import MailIM, { MailIMUrlKeys } from './mail_im';
import MailPraise, { MailPraiseUrlKeys } from './mail_praise';
import MailSign, { MailSignUrlKeys } from './mail_sign';
import MailSmart, { MailSmartUrlKeys } from './mail_smart';
import MailTask, { MailTaskUrlKeys } from './mail_task';
import SalesPitch, { SalesPitchUrlKeys } from './sales_pitch';
import MailTemplate, { MailTemplateUrlKeys } from './mail_template';
import MailProduct, { MailProductUrlKeys } from './mail_product';
import CorpMail, { CorpMailUrlKeys } from './corp_mail';
import CorpContact, { CorpContactUrlKeys } from './corp_contact';
import CorpLogin, { CorpLoginUrlKeys } from './corp_login';
import FeedbackLog, { FeedbackLogUrlKeys } from './feedback_log';
import Advert from './advert';
import EdmUrl, { EdmUrlKeys } from '@/urlConfig/edm';
import { AdvertUrlKeys } from './advert';
import FFMSUrl, { FFMSUrlKeys } from './ffms';

export type URLMap =
  | GlobalUrlKeys
  | ContactUrlKeys
  | EdmContactUrlKeys
  | AccountUrlKeys
  | LoginUrlKeys
  | RegisterUrlKeys
  | DiskUrlKeys
  | IMUrlKeys
  | CatalogUrlKeys
  | MeetingRoomUrlKeys
  | MailUrlKeys
  | MailIMUrlKeys
  | MailPraiseUrlKeys
  | MailSmartUrlKeys
  | MailSignUrlKeys
  | MailTaskUrlKeys
  | MailTemplateUrlKeys
  | MailProductUrlKeys
  | CorpMailUrlKeys
  | CorpLoginUrlKeys
  | CorpContactUrlKeys
  | EdmUrlKeys
  | FeedbackLogUrlKeys
  | SalesPitchUrlKeys
  | AdvertUrlKeys
  | AdvertUrlKeys
  | FFMSUrlKeys;

/**
 * 外部接口定义
 */
export const urlMap = new Map<URLMap, string>([
  ...GlobalUrl,
  ...Contact,
  ...EdmContact,
  ...Account,
  ...Catalog,
  ...MeetingRoom,
  ...IM,
  ...Login,
  ...Register,
  ...Disk,
  ...Mail,
  ...MailIM,
  ...MailPraise,
  ...MailTask,
  ...MailSmart,
  ...MailTemplate,
  ...MailProduct,
  ...MailSign,
  ...CorpMail,
  ...CorpContact,
  ...CorpLogin,
  ...FeedbackLog,
  ...EdmUrl,
  ...Advert,
  ...SalesPitch,
  ...FFMSUrl,
]);
