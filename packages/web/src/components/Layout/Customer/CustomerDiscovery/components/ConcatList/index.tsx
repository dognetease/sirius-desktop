import React from 'react';
import { Row, Col } from 'antd';
import { apiHolder, apis, MailApi } from 'api';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { ReactComponent as MailIcon } from '@/images/icons/regularcustomer/mail.svg';
import style from './style.module.scss';
import { getIn18Text } from 'api';
interface Props {
  data: Array<{
    name: string;
    email: string;
  }>;
}
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
export const ConcatList: React.FC<Props> = props => {
  const { data = [] } = props;
  const sendEmail = (contacts: string[]) => {
    mailApi.doWriteMailToContact(contacts);
  };
  return (
    <div>
      <div className={style.title}>
        {getIn18Text('LIANXIREN')}
        <span className={style.tip}>
          {getIn18Text('GONGZHAODAO')}
          {data.length}
          {getIn18Text('GELIANXIREN')}
        </span>
      </div>
      <div className={style.list}>
        <Row gutter={12}>
          {data.map(concat => (
            <Col span={8}>
              <div className={style.listItem}>
                <AvatarTag
                  innerStyle={{ border: 'none' }}
                  size={32}
                  user={{
                    name: concat.name,
                    avatar: '',
                    email: concat.email,
                  }}
                />
                <div className={style.detail}>
                  <div className={style.name} title={concat.name}>
                    {concat.name}
                  </div>
                  <div className={style.email} title={concat.email}>
                    {concat.email}
                  </div>
                  <div className={style.icon} onClick={() => sendEmail([concat.email])}>
                    <MailIcon />
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};
