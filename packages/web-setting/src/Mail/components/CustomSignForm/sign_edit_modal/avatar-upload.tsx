/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { useFormContext } from 'react-hook-form';
import { apiHolder as api, apis, MailSignatureApi, SystemApi } from 'api';
import AvatarIcon from '@/images/icons/mail/avatar.png';
import style from './style.module.scss';
import { FormSubmitData } from './const';
import { useAppSelector } from '@web-common/state/createStore';
import AvatarEditor from '@web-common/components/UI/AvatarEditor/avatarEditor';
import { transAvatarSize } from '@web-common/utils/contact_util';
import { getIn18Text } from 'api';
interface IAvatarUploadProps {
  /** 头像 url */
  avatarUrl?: string;
  currentAccount: string;
}
const getBigAvatar = (avatar: string) => {
  try {
    return transAvatarSize(avatar, 'big');
  } catch (error) {
    return avatar;
  }
};

const AvatarUpload = (props: IAvatarUploadProps) => {
  const { setValue } = useFormContext<FormSubmitData>();
  const { avatarUrl = '', currentAccount } = props;
  const [url, setUrl] = useState<string | undefined>(avatarUrl);
  const signatureApi = api.api.requireLogicalApi(apis.mailSignatureImplApi) as MailSignatureApi;
  const systemApi = api.api.getSystemApi() as SystemApi;
  const defaultAvatar = useAppSelector(state => state.mailConfigReducer.defaultAvatar);
  const userAvatar = systemApi.getCurrentUser(currentAccount)?.avatar || '';
  const [visible, setVisible] = useState<boolean>(false);
  const avatar = url || userAvatar || defaultAvatar || AvatarIcon;
  useEffect(() => {
    setValue('profilePhoto', userAvatar);
  }, []);
  const handleConfirm = async (data: any) => {
    try {
      const res = await signatureApi.doUploadSignAvatar(data);
      if (res.success) {
        setUrl(res.data?.picUrl || '');
        setValue('profilePhoto', res.data?.picUrl);
      }
    } catch (error) {
      message.error(getIn18Text('TOUXIANGSHANGCHUANSHI'));
    } finally {
      setVisible(false);
    }
  };
  return (
    <>
      {visible && avatar && <AvatarEditor avatar={getBigAvatar(avatar)} hideAvatarEditor={() => setVisible(false)} onConfirm={handleConfirm} />}
      <div style={{ textAlign: 'center', marginRight: 14, width: 80 }} onClick={() => setVisible(true)}>
        <img className={style.avatar} src={url || userAvatar || defaultAvatar || AvatarIcon} alt="avatar" />
        <div
          style={{
            fontSize: 12,
            color: 'rgba(38, 42, 51, 0.6)',
            cursor: 'pointer',
            marginTop: 3,
          }}
        >
          {getIn18Text('DIANJITOUXIANGBIAN')}
        </div>
      </div>
    </>
  );
};

export default AvatarUpload;
