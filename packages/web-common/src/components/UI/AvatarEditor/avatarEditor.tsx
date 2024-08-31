import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore
import RAvatarEditor from 'react-avatar-editor';
import { Button, Slider } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder, apis, ContactApi, NIMApi } from 'api';
import styles from './avatarEditor.module.scss';
import Toast from '../Message/SiriusMessage';
import { useAppDispatch } from '@web-common/state/createStore';
import { useContactModel } from '@web-common/hooks/useContactModel';
import { getIn18Text } from 'api';
import { doUpdateLxContactMap } from '@web-common/state/reducer/contactReducer';
import lodashGet from 'lodash/get';
import { getCharAvatar } from '@web-contact/util';
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const systemApi = apiHolder.api.getSystemApi();
const contactApi: ContactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi;
export interface AvatarEditorProps {
  avatar: File | string;
  hideAvatarEditor: Function;
  teamId?: string;
  contactId?: string;
  contactEmail?: string;
  onConfirm?: (avatarFile: any) => void;
  showResetEntry?: boolean;
  onImageError?: () => void;
}
const AvatarEditor: React.FC<AvatarEditorProps> = ({ avatar, hideAvatarEditor, contactId, contactEmail, teamId, showResetEntry = false, onConfirm, onImageError }) => {
  const dispatch = useAppDispatch();
  const contactModel = useContactModel({ email: contactEmail, contactId });
  const [scale, setScale] = useState<number>(1);
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [curImage, setCurImage] = useState<File | string>(avatar);
  const [loading, setLoading] = useState<boolean>(false);
  const avatarEditorRef = useRef<RAvatarEditor>(null);
  const picInputRef = useRef<HTMLInputElement>(null);
  const [defaultAvatarStyle] = useState({ background: contactApi.getColor(contactEmail || lodashGet(systemApi.getCurrentUser(), 'id', '')) });
  const [defaultName] = useState(getCharAvatar(contactModel?.contact?.contactName || lodashGet(systemApi.getCurrentUser(), 'nickName', '')));
  const changePic = () => {
    picInputRef.current?.click();
  };

  // 删除图片恢复默认头像
  const deletePic = async () => {
    setCurImage('');
  };

  const confirmDeletePic = async () => {
    try {
      const res = await contactApi.deleteAvatarIcon();
      if (!res.data?.success) {
        Toast.error({ content: res.message || '重置头像失败' });
        setLoading(false);
        return;
      }
      const selfId = systemApi.getCurrentUser()?.contact?.contact?.id || '';
      if (!selfId) {
        Toast.error({ content: '获取用户信息失败' });
        setLoading(false);
        return;
      }

      // 数据库层面修改
      await contactApi.doUpdateContactById({ id: selfId!, avatar: '' });

      // if (contactModel) {
      //   contactModel.contact.avatar = '';
      //   dispatch(ContactActions.doUpdateContactMap([contactModel]));
      // }
      setLoading(false);

      // 修改成功
      hideAvatarEditor();
    } catch (ex) {
      Toast.error({ content: '重置头像失败' });
    }
  };

  const picInputChange = () => {
    const files = picInputRef?.current?.files;
    if (files && files[0]) {
      const maxSize = 15 * 1024 * 1024;
      if (files[0].size > maxSize) {
        // @ts-ignore
        message.warn({
          content: getIn18Text('TUPIANDAXIAOBU'),
        });
        return;
      }
      setCurImage(files[0]);
    }
  };
  const cancel = () => {
    hideAvatarEditor();
  };
  const confirm = () => {
    if (curImage === '') {
      return confirmDeletePic();
    }
    const editotCanvas: HTMLCanvasElement = avatarEditorRef?.current?.getImageScaledToCanvas();
    const mimeType = 'image/png';
    setLoading(true);
    editotCanvas.toBlob(async blob => {
      if (!blob) {
        setLoading(false);
        return;
      }
      const fileName = getIn18Text('TOUXIANG.pn');
      // 传入确认方法
      if (onConfirm) {
        onConfirm(new File([blob], fileName));
        setLoading(false);
        return;
      }
      // 3个参数都没有
      if (!contactId && !teamId && !contactEmail) {
        console.log('缺乏用户或群组参数');
        setLoading(false);
        return;
      }

      // 更新群头像
      // 垃圾写法...暂保留
      if (teamId) {
        const file = await nimApi.excute('previewFile', {
          type: 'image',
          blob,
        });
        nimApi.excute('updateTeam', {
          teamId,
          avatar: file.url,
        });
        setLoading(false);
        hideAvatarEditor();
        return;
      }

      // 更新用户头像
      if (contactId || contactEmail) {
        // 更新个人头像
        const hPic = new File([blob], fileName, { type: mimeType });
        // 远端更新
        contactApi
          .uploadIcon({ file: hPic, fileName })
          .then(async res => {
            if (!res.success || !res.data) {
              Toast.error({ content: res.message || getIn18Text('SHANGCHUANTOUXIANGSHI') });
              setLoading(false);
              return;
            }
            const newUrl = res.data.mediumUrl;
            try {
              let _contactId = contactId;
              // 通过contactEmail获取contactId
              if (!contactId) {
                const contactRes = await contactApi.doGetContactByEmailFilter({ emails: [contactEmail!] });
                if (contactRes) {
                  _contactId = contactRes[contactEmail!]?.contact?.id;
                }
              }
              if (!_contactId) {
                console.log('获取用户信息失败');
                Toast.error({ content: '获取用户信息失败' });
                setLoading(false);
                return;
              }
              // 数据库层面修改
              const modDBRes = await contactApi.doUpdateContactById({ id: _contactId!, avatar: newUrl });
              setLoading(false);
              // 未修改成功
              if (!modDBRes) {
                console.log('数据库同步失败');
                // 换而使用通知更新
                if (contactModel) {
                  contactModel.contact.avatar = newUrl;
                  // 只更新联系人详情
                  doUpdateLxContactMap([contactModel]);
                  hideAvatarEditor();
                } else {
                  Toast.error({ content: '数据库同步失败' });
                }
                return;
              }
              // 修改成功
              hideAvatarEditor();
            } catch (err) {
              console.log(getIn18Text('SHANGCHUANTOUXIANGSHI'), err);
              Toast.error({ content: getIn18Text('SHANGCHUANTOUXIANGSHI') });
              setLoading(false);
            }
          })
          .catch(err => {
            console.log(getIn18Text('SHANGCHUANTOUXIANGSHI'), err);
            Toast.error({ content: getIn18Text('SHANGCHUANTOUXIANGSHI') });
            setLoading(false);
          });
      }
    }, mimeType);
  };
  const onSliderChange = (value: number) => {
    setSliderValue(value);
    setScale(1 + value / 100);
  };
  const changeSliderValue = (action: 'sub' | 'add') => {
    let val = sliderValue;
    if (action === 'add' && val < 100) {
      val += 10;
    }
    if (action === 'sub' && val > 0) {
      val -= 10;
    }
    setScale(1 + val / 100);
    setSliderValue(val);
  };
  useEffect(() => {
    setCurImage(avatar);
  }, [avatar]);
  return (
    <>
      <div className={styles.bg} onClick={cancel} />
      <div className={styles.avatarEditorPopUp}>
        {typeof curImage === 'string' && curImage.length == 0 ? (
          <div className={styles.defaultAvatarBg} style={defaultAvatarStyle}>
            {defaultName}
          </div>
        ) : (
          <RAvatarEditor
            ref={avatarEditorRef}
            crossOrigin="anonymous"
            image={curImage}
            width={476}
            height={476}
            border={0}
            borderRadius={500}
            color={[0, 0, 0, 0.7]}
            scale={scale}
            rotate={0}
            onLoadFailure={onImageError}
          />
        )}

        {typeof curImage === 'string' && curImage.length == 0 ? null : (
          <div className={styles.slider}>
            <div
              className={styles.sliderAction}
              onClick={() => {
                changeSliderValue('sub');
              }}
            />
            <div className={styles.sliderArea}>
              <Slider defaultValue={0} value={sliderValue} tooltipVisible={false} onChange={onSliderChange} />
            </div>
            <div
              className={styles.sliderAction}
              onClick={() => {
                changeSliderValue('add');
              }}
            />
          </div>
        )}

        <div className={styles.bottom}>
          <div className={styles.leftArea}>
            <Button type="link" className={styles.changePic} onClick={changePic} disabled={loading}>
              {getIn18Text('GENGHUANTUPIAN')}
            </Button>
            {showResetEntry ? (
              <Button type="link" className={styles.deletePic} onClick={deletePic} disabled={loading}>
                删除图片恢复默认
              </Button>
            ) : null}
          </div>

          <div className={styles.rightArea}>
            <Button className={styles.cancel} onClick={cancel}>
              {getIn18Text('QUXIAO')}
            </Button>
            <Button type="primary" className={styles.confirm} onClick={confirm} loading={loading} disabled={loading}>
              {getIn18Text('QUEDING')}
            </Button>
          </div>
          <input
            ref={picInputRef}
            type="file"
            accept="image/gif, image/jpeg, image/jpg, image/png"
            className={styles.picInput}
            onClick={e => {
              const input = e.target as HTMLInputElement;
              input.value = '';
            }}
            onChange={picInputChange}
          />
        </div>
      </div>
    </>
  );
};
export default AvatarEditor;
