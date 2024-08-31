import React, { useState, useRef, useEffect } from 'react';
import { apiHolder as api, apis, MailTemplateApi, TemplateByIdDetail } from 'api';
import styles from './preview.module.scss';
import { mailTemplatePreviewWrapper } from '@web-mail/components/ReadMail/util';
import { mailStrDecode } from './util';
import { getIn18Text } from 'api';
interface PopconfirmProps {
  templateId?: string;
  defaultTemplateData?: TemplateByIdDetail;
}
const templateApi = api.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
/** 模板预览 */
const Preview = (props: PopconfirmProps) => {
  const { templateId, defaultTemplateData } = props;
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [templateData, setTemplateData] = useState<TemplateByIdDetail>({} as TemplateByIdDetail);
  const doGetMailTemplateDetail = () => {
    templateApi.doGetMailTemplateDetail({ templateId: templateId as string }).then(res => {
      res.data && setTemplateData(res.data);
    });
  };
  useEffect(() => {
    if (defaultTemplateData) {
      // 直接使用defaultTemplateData
      setTemplateData(defaultTemplateData);
    } else if (templateId) {
      // 获取模板详情
      doGetMailTemplateDetail();
    }
  }, [templateId, defaultTemplateData]);
  useEffect(() => {
    if (frameRef.current) {
      // 加载正文
      frameRef.current.setAttribute('style', 'padding:10px');
      const doc = frameRef.current.contentDocument;
      doc?.open();
      doc?.write(mailTemplatePreviewWrapper(templateData?.content || ''));
      doc?.close();
    }
  }, [templateData]);
  const handleLoad = () => {
    if (frameRef.current?.contentDocument) {
      const doc = frameRef.current.contentDocument;
      const bodyElements = doc.getElementsByTagName('body');
      const realCont = bodyElements?.length ? bodyElements[0] : null;
      // 计算content的最大高度
      let contentHeight = realCont?.scrollHeight || 0;
      // + 20 不能删除，因为iframe有padding 10px，需要body的高+20 才是iframe 的高度
      frameRef.current.style.height = contentHeight ? contentHeight + 20 + 'px' : 'auto';
    }
  };
  const MailTag = (mailTagProps: { mail: string }) => {
    const { mail } = mailTagProps;
    const { contactEmail, contactName } = mailStrDecode(mail);
    return <p className={styles.contactsMail}>{contactName || contactEmail}</p>;
  };
  return (
    <div className={styles.mailTemplatePreviewBox}>
      <p className={styles.contacts}>
        <span className={styles.contactsTitle}>{getIn18Text('SHOUJIANREN\uFF1A')}</span>
        {templateData?.to?.map(_ => (
          <MailTag mail={_} />
        ))}
      </p>
      <p className={styles.contacts} hidden={templateData.cc?.length <= 0}>
        <span className={styles.contactsTitle}>{getIn18Text('CHAO&#12')}</span>
        {templateData?.cc?.map(_ => (
          <MailTag mail={_} />
        ))}
      </p>
      <p className={styles.contacts} hidden={templateData.bcc?.length <= 0}>
        <span className={styles.contactsTitle}>{getIn18Text('MI&#12')}</span>
        {templateData?.bcc?.map(_ => (
          <MailTag mail={_} />
        ))}
      </p>
      <p className={styles.contacts}>
        <span className={styles.contactsTitle}>{getIn18Text('ZHU&#12')}</span>
        <span className={styles.mailTitle}>{templateData?.subject}</span>
      </p>
      <p className={styles.content}>
        <iframe title={getIn18Text('YULAN')} ref={frameRef} width="100%" height="100%" src="about:blank" frameBorder="0" onLoad={handleLoad} />
      </p>
    </div>
  );
};
export default Preview;
