import React, { useState, useEffect } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import guide from '@web-common/images/version_guide.png';
import guideFree from '@web-common/images/version_guide_free.png';
import { useAppSelector } from '@web-common/state/createStore';
import { getIsFreeVersionUser } from '@web-common/state/reducer/privilegeReducer';
import styles from './versionGuide.module.scss';
import { Button, Divider } from 'antd';
import RightOutlined from '@ant-design/icons/RightOutlined';
import { apis, apiHolder, AccountApi, SystemApi, MailConfApi } from 'api';
import { getIn18Text } from 'api';

const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const mailConfigApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
interface IProps {
  quickStart: () => void;
  visible: boolean;
}

function VersionGuide(props: IProps) {
  const { visible, quickStart } = props;
  const isFreeVersionUser = useAppSelector(state => getIsFreeVersionUser(state.privilegeReducer));
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    accountApi.doGetAccountIsAdmin().then(isAdmin => setIsAdmin(isAdmin));
  }, []);

  const handleBackEnd = async () => {
    const redirectUrl =
      mailConfigApi.getWebMailHost(true) +
      '/admin/login.do?hl=zh_CN&uid=' +
      systemApi.getCurrentUser()?.id +
      '&app=admin&all_secure=1&target=product*tradelink&from=tradelink';
    const url: string | undefined = await mailConfigApi.getWebSettingUrlInLocal('', { url: redirectUrl });
    if (url && url.length > 0) {
      // 跳转浏览器
      systemApi.openNewWindow(url, false, undefined, undefined, true);
    } else {
      Toast.warn({
        content: getIn18Text('WUFADAKAIZHI'),
        duration: 3,
      });
    }
  };

  return (
    <Modal visible={visible} closable={true} bodyStyle={{ padding: 0 }} onCancel={quickStart} width={'auto'} footer={null}>
      {isFreeVersionUser ? (
        <div className={styles.wrapperFree}>
          <div className={styles.left}>
            <div className={styles.title}>欢迎来到网易外贸通</div>
            <Divider />
            <div>网易外贸通是专为外贸企业打造的一站式海外营销管理平台，助力企业多元营销、精准获客、高效协作，驱动外贸业务飞速发展。​</div>
            <ul>
              <li>营销获客更容易</li>
              <li>客户管理更高效</li>
              <li>企业管理更便捷</li>
            </ul>
            <div>您可以登录您的企业管理后台，配置企业人员、管理邮箱域名、购买付费服务等。</div>
            {isAdmin && (
              <Button className={styles.btnLink} type="link" onClick={handleBackEnd}>
                <span>访问管理后台</span>
                <RightOutlined />
              </Button>
            )}
            <Button
              className={styles.btn}
              type="primary"
              onClick={() => {
                quickStart();
              }}
            >
              <span>立即体验网易外贸通</span>
            </Button>
          </div>
          <div className={styles.right}>
            <img alt="版本升级" src={guideFree} />
          </div>
        </div>
      ) : (
        <div className={styles.wrapper}>
          <div className={styles.title}>网易外贸通网页版全新升级！</div>
          <ul>
            <li>场景分类更清晰</li>
            <li>业务流程更聚合</li>
            <li>操作体验更顺畅</li>
          </ul>
          <img alt="版本升级" src={guide} />
          <Button
            className={styles.btn}
            type="primary"
            onClick={() => {
              quickStart();
            }}
          >
            <span>立即体验</span>
          </Button>
        </div>
      )}
    </Modal>
  );
}

export default VersionGuide;
