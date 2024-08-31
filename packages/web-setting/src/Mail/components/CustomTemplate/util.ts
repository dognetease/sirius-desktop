import { apiHolder as api, apis, MailApi, TemplateByIdDetail, Thumbnail, SaveTemplateReq, MailBoxEntryContactInfoModel } from 'api';
import { ViewMail } from '@web-common/state/state';

const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;

/**
 * 模板联系人是 name + email 的拼接，需要解析
 * @param mail "lujiajian" <lujiajian@office.163.com>
 * @returns {contactEmail: 'lujiajian@office.163.com', contactName: 'lujiajian'}
 */
export function mailStrDecode(mail: string): { contactEmail: string; contactName: string } {
  mail = mail.replace(/(^\s*)|(\s*$)/g, '');
  const contact = mail.split(' ');
  const contactEmail = contact[contact.length - 1].replace(/<|>/g, '');
  let contactName = '';
  if (contact.length > 1) {
    contactName = contact[0].replace(/"/g, '');
  }
  return {
    contactEmail,
    contactName,
  };
}

/**
 * mailStrDecode 的批处理
 * @param mail
 * @returns
 */
export function mailStrListDecode(mail: string[]) {
  const res: string[] = [];
  mail.forEach(_ => _ && res.push(mailStrDecode(_).contactEmail));
  return res;
}

/**
 * 将ViewMail格式化为模板接口所需联系人格式
 * @param currentMailTemplate
 * @returns { bcc: string[];cc: string[];to: string[];}
 */
export function formatReceiver(currentMailTemplate: ViewMail) {
  const bcc: string[] = [];
  const cc: string[] = [];
  const to: string[] = [];
  currentMailTemplate?.receiver?.map(_ => {
    const pushVal = `"${_.contact?.contact?.contactName}" <${_.contactItem?.contactItemVal}>`;
    if (_.mailMemberType === 'to') {
      to.push(pushVal);
    } else if (_.mailMemberType === 'cc') {
      cc.push(pushVal);
    } else if (_.mailMemberType === 'bcc') {
      bcc.push(pushVal);
    }
    return _;
  });
  return {
    bcc,
    cc,
    to,
  };
}

/**
 * 将ViewMail格式化为预览模板页面所需的格式
 */
export function formatTemplateDetail(currentMailTemplate: ViewMail): TemplateByIdDetail {
  return {
    templateId: currentMailTemplate?.id,
    templateName: '',
    thumbnail: {} as Thumbnail,
    content: currentMailTemplate?.entry?.content?.content,
    subject: currentMailTemplate?.entry?.title,
    ...formatReceiver(currentMailTemplate),
  };
}

/**
 * 将ViewMail格式化为保存模板接口所需的格式
 * @param currentMailTemplate ViewMail
 * @param mailTemplateName 模板名称
 * @param templateCategory 业务划分，LX: 灵犀业务； EDM: 外贸业务
 * @returns
 */
export function formatSaveTemplateReq(currentMailTemplate: ViewMail, mailTemplateName: string, templateCategory: string): SaveTemplateReq {
  return {
    templateId: currentMailTemplate?.id,
    templateName: mailTemplateName,
    templateCategory,
    content: currentMailTemplate?.entry?.content?.content,
    subject: currentMailTemplate?.entry?.title,
    ...formatReceiver(currentMailTemplate),
  };
}

/**
 * 初始化邮件
 */
export function getTemplatesDefaultData(): ViewMail {
  const originData = mailApi.doBuildEmptyMailEntryModel({
    contact: [],
    mailType: 'common',
    writeType: 'common',
  });
  originData.id = '';
  return {
    ...originData,
    status: {
      cc: false,
      bcc: false,
      showContact: false,
      keyword: '',
      init: false,
      conferenceShow: false,
      conferenceSetting: true,
    },
    focusTitle: false,
  };
}

/**
 * 模板使用、模板再次编辑，需要将模板详情数据格式TemplateByIdDetail转化为ViewMail格式
 */
export async function formatViewMail(templateData: TemplateByIdDetail): Promise<ViewMail> {
  // 初始化ViewMail
  const MailEntryModel = mailApi.doBuildEmptyMailEntryModel({
    title: templateData.subject,
    mailType: 'common',
    writeType: 'common',
  });

  const mailContentModel: ViewMail = {
    ...MailEntryModel,
    status: {
      cc: false,
      bcc: false,
      showContact: false,
      keyword: '',
      init: false,
      conferenceShow: false,
      conferenceSetting: true,
    },
    focusTitle: false,
  };
  mailContentModel.entry.content.content = templateData.content;
  mailContentModel.id = templateData.templateId;

  // 通过邮箱地址获取 MailBoxEntryContactInfoModel[]
  const contractItemByEmail =
    templateData.to && templateData.to.length > 0 ? mailApi.getContractItemByEmail(mailStrListDecode(templateData.to), 'to') : Promise.resolve([]);

  const ccContactItemByEmail =
    templateData.cc && templateData.cc.length > 0 ? mailApi.getContractItemByEmail(mailStrListDecode(templateData.cc), 'cc') : Promise.resolve([]);
  const bccContactItemByEmail =
    templateData.bcc && templateData.bcc.length > 0 ? mailApi.getContractItemByEmail(mailStrListDecode(templateData.bcc), 'bcc') : Promise.resolve([]);
  return Promise.all([contractItemByEmail, ccContactItemByEmail, bccContactItemByEmail]).then(
    (r: [MailBoxEntryContactInfoModel[], MailBoxEntryContactInfoModel[], MailBoxEntryContactInfoModel[]]) => {
      const res = r[0].concat(r[1], r[2]) as MailBoxEntryContactInfoModel[];
      res.forEach(it => {
        if (it && it.contactItem.contactItemVal && it.contactItem.contactItemVal.length > 0) {
          mailContentModel.receiver.push(it);
        }
      });
      return mailContentModel;
    }
  );
}
