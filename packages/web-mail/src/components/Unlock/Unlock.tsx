import React, { useState, useEffect, useMemo } from 'react';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import { Button } from 'antd';
import { getIn18Text, apiHolder, apis, MailApi, MailEntryModel } from 'api';
import styles from './unlock.module.scss';

const systemApi = apiHolder.api.getSystemApi();
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;

const IntroUrl = `https://help.mail.163.com/faqDetail.do?code=d7a5dc8471cd0c0e8b4b8f4f8e49998b374173cfe9171305fa1ce630d7f67ac29830ec81fe715b2b`;
interface Props {
  content: MailEntryModel;
  unlockMail?: (unlockCont: MailEntryModel) => void;
}

// 加密邮件解密
const Unlock: React.FC<Props> = ({ content, unlockMail }) => {
  const [encryptPassword, setEncryptPassword] = useState<string>('');
  const [remark, setRemark] = useState<{ show: boolean; text: string }>({ show: false, text: '' });
  const [decrypting, setDecrypting] = useState<boolean>(false);

  const isDecrypted = useMemo(() => {
    return content.isDecrypted;
  }, [content]);
  // 发件箱 且 存在密码 展示密码
  const showEncpwd = useMemo(() => {
    return content?.entry?.folder === 3 && content?.entry?.encpwd;
  }, [content]);

  // 查看说明
  const checkRemark = () => {
    systemApi.openNewWindow(IntroUrl);
  };

  const changePw = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setEncryptPassword(value);
  };

  // 解密邮件
  const doDecryptMail = async () => {
    const { id } = content;
    try {
      setDecrypting(true);
      const decryptRes = await mailApi.doGetDecryptedContent(id, encryptPassword);
      setDecrypting(false);
      const { passed, errMsg, data } = decryptRes;
      if (!passed) {
        setRemark({ show: true, text: errMsg || getIn18Text('JIEMISHIBAI') });
        return;
      }
      setRemark({ show: false, text: '' });
      // 替换
      unlockMail && data && unlockMail(data);
    } catch (error) {
      setDecrypting(false);
      console.log('解密邮件失败', error);
      setRemark({ show: true, text: getIn18Text('JIEMISHIBAI') });
    }
  };

  // 确认密码
  const confirmPw = () => {
    setRemark({ show: false, text: '' });
    // 6位数字、字母组成校验
    if (!/^[a-zA-Z0-9]{6}$/.test(encryptPassword)) {
      setRemark({ show: true, text: getIn18Text('MIMACUOWU，QCXSR') });
      return;
    }
    doDecryptMail();
  };

  useEffect(() => {
    setDecrypting(false);
    setEncryptPassword('');
    setRemark({ show: false, text: '' });
  }, [content?.id]);

  return (
    <>
      {!isDecrypted ? (
        <div className={styles.locked}>
          <div className={styles.lockedTitle}>
            <span className={styles.encryptedMailText}>{getIn18Text('JIAMIYOUJIAN')}</span>
            {getIn18Text('ZHESHIYIFENGJIAMYJ，SRFJRTGDMM，JKYDWZYJ')}
          </div>
          <div className={styles.lockedCont}>
            <div className={styles.enterArea}>
              <span>{getIn18Text('SHURUMIMA')}：</span>
              <Input className={styles.pwInput} placeholder={getIn18Text('QINGSHURU6WEIMM')} maxLength={6} value={encryptPassword} onChange={changePw} />
              <Button className={styles.confPw} type="primary" onClick={confirmPw} loading={decrypting}>
                {getIn18Text('QUEDING')}
              </Button>
            </div>
            {!!showEncpwd && (
              <div className={styles.pwIs}>
                {getIn18Text('JIAMIYOUJIANMIMW')}：{content?.entry?.encpwd}
              </div>
            )}
            {!!remark.show && <p className={styles.pwRemark}>{remark.text || ''}</p>}
            <p className={styles.intro} style={{ marginTop: '12px' }}>
              1、{getIn18Text('NINKETONGGUODIANH、DXHZQTFSXFJRSQMM。')}
            </p>
            <p className={styles.intro}>
              2、
              <span className={styles.introBlue} onClick={checkRemark}>
                {getIn18Text('CHAKANWANGYIYOUXJMYJSYSM')}
              </span>
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.unlocked}>
          {!!showEncpwd && `${getIn18Text('JIAMIYOUJIANMIMW')}：${content?.entry?.encpwd}`} {getIn18Text('YOUJIANYIJIESUO，YXSNJSHDYXNR')}：
        </div>
      )}
    </>
  );
};

export default Unlock;
