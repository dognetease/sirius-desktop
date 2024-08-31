import React, { useState, useEffect, useMemo } from 'react';
import { Modal, ModalProps, Input, Form, Button } from 'antd';
import { apiHolder, DataStoreApi } from 'api';
import classnames from 'classnames';
import { ReactComponent as CloseIcon } from '@/images/icons/regularcustomer/close.svg';
import FacebookIcon from '@/images/icons/edm/editor/facebook.svg';
import FacebookIconActive from '@/images/icons/edm/editor/facebook_active.svg';
import WhatsappIcon from '@/images/icons/edm/editor/whatsapp.svg';
import WhatsappIconActive from '@/images/icons/edm/editor/whatsapp_active.svg';
import TwitterIcon from '@/images/icons/edm/editor/twitter.svg';
import TwitterIconActive from '@/images/icons/edm/editor/twitter_active.svg';
import InstagramIcon from '@/images/icons/edm/editor/instagram.svg';
import InstagramIconActive from '@/images/icons/edm/editor/instagram_active.svg';
import TelegramIcon from '@/images/icons/edm/editor/telegram.svg';
import TelegramIconActive from '@/images/icons/edm/editor/telegram_active.svg';
import WeChatIcon from '@/images/icons/edm/editor/wechat.svg';
import WeChatIconActive from '@/images/icons/edm/editor/wechat_active.svg';
import LinkedinIcon from '@/images/icons/edm/editor/linkedin.svg';
import LinkedinIconActive from '@/images/icons/edm/editor/linkedin_active.svg';
import TiktokIcon from '@/images/icons/edm/editor/tiktok.svg';
import TiktokIconActive from '@/images/icons/edm/editor/tiktok_active.svg';
import { ReactComponent as DeleteIcon } from '@/images/icons/edm/editor/delete-icon.svg';
import { ReactComponent as CloseIconModal } from '@/images/icons/edm/editor/close-icon.svg';

import style from './socialLinkModal.module.scss';
import { edmDataTracker } from '../../tracker/tracker';
import { getIn18Text } from 'api';
interface Option {
  type: string;
  imgUrl: string;
  placeholder: string;
}
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const SocialMediaInfo = 'SOCIAL_MEDIA_INFO_V2';
const SelectOptions = [
  {
    type: 'Facebook',
    Icon: FacebookIcon,
    ActiveIcon: FacebookIconActive,
    placeholder: '链接地址：例如https://www.facebook.com',
    imgUrl: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/12/23/6630f05ece804d419bf1af6948be8a7b.png',
    backgrounds: {
      normal: '#F6F7FA',
      hover: '#F2F7FE',
    },
  },
  {
    type: 'Whatsapp',
    Icon: WhatsappIcon,
    ActiveIcon: WhatsappIconActive,
    placeholder: getIn18Text('QINGSHURULIANJIEHUOSHOU'),
    imgUrl: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/12/23/23f68d7f8db9449088094ef8260f283e.png',
    backgrounds: {
      normal: '#F6F7FA',
      hover: '#E7FBF3',
    },
    rules: [
      { required: true, message: getIn18Text('QINGSHURULIANJIEDEZHIv16') },
      ({ getFieldValue }: any) => ({
        validator(_: any, value: string) {
          // if (/\D/.test(value)) {
          //   return Promise.reject(new Error('请输入数字'));
          // }
          if (!value) {
            return Promise.resolve();
          }
          if (
            /\D/.test(value) &&
            !/((http|ftp|https):\/\/)(([a-zA-Z0-9\._-]+\.[a-zA-Z]{2,6})|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,4})*(\/[a-zA-Z0-9\&%_\.\/-~-]*)?/.test(
              value
            )
          ) {
            return Promise.reject(getIn18Text('LIANJIEDEZHIGESHICUOWU'));
          }
          if (/^(\d)+$/.test(value) && value.length === 11 && value.startsWith('1')) {
            return Promise.reject(new Error('whatsapp的手机号需输入国际区号，国内手机号需加86'));
          }
          if (value.length > 0 && value.trim().length === 0) {
            return Promise.reject(new Error(getIn18Text('QINGSHURULIANJIEDEZHI')));
          }
          return Promise.resolve();
          // if (value) {
          //   return Promise.resolve();
          // }
          // return Promise.reject(new Error(getIn18Text('QINGSHURULIANJIEDEZHI'),));
        },
      }),
    ],
  },
  {
    type: 'Twitter',
    Icon: TwitterIcon,
    ActiveIcon: TwitterIconActive,
    placeholder: '链接地址：例如https://www.twitter.com',
    imgUrl: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/12/23/9fca81218a3e4f3f8af87dac98014bd3.png',
    backgrounds: {
      normal: '#F6F7FA',
      hover: '#F2F7FE',
    },
  },
  {
    type: 'Instagram',
    Icon: InstagramIcon,
    ActiveIcon: InstagramIconActive,
    placeholder: '链接地址：例如https://www.instergram.com',
    imgUrl: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/12/23/60d0d14aa73d452b96e448c07bdfdfac.png',
    backgrounds: {
      normal: '#F6F7FA',
      hover: '#F4EEFF',
    },
  },
  {
    type: 'Telegram',
    Icon: TelegramIcon,
    ActiveIcon: TelegramIconActive,
    placeholder: '链接地址：例如https://www.telegram.com',
    imgUrl: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/12/23/b4e4672476334a148c95b49a09ad9c32.png',
    backgrounds: {
      normal: '#F6F7FA',
      hover: '#F2F7FE',
    },
  },
  {
    type: 'WeChat',
    Icon: WeChatIcon,
    ActiveIcon: WeChatIconActive,
    placeholder: '链接地址：例如https://mp.weixin.qq.com，可输入微信公众号链接',
    imgUrl: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/12/23/1097a05807c64b5fa26f588303050007.png',
    backgrounds: {
      normal: '#F6F7FA',
      hover: '#E7FBF3',
    },
  },
  {
    type: 'Linkedin',
    Icon: LinkedinIcon,
    ActiveIcon: LinkedinIconActive,
    placeholder: '链接地址：例如https://www.linkedin.com',
    imgUrl: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/12/23/2b5e1aaadfb14648b7c16e9b28697592.png',
    backgrounds: {
      normal: '#F6F7FA',
      hover: '#F2F5FF',
    },
  },
  {
    type: 'TikTok',
    Icon: TiktokIcon,
    ActiveIcon: TiktokIconActive,
    placeholder: '链接地址：例如https://www.tiktop.com',
    imgUrl: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/12/23/0be0e7be78404808a213d87a6bcbb5ad.png',
    backgrounds: {
      normal: '#F6F7FA',
      hover: '#F2F5FF',
    },
  },
];
export const SocialLinkModal = (
  props: ModalProps & {
    onAdd: (
      args: Array<{
        type: string;
        link: string;
        imgUrl: string;
        text: string;
      }>
    ) => void;
  }
) => {
  const [currentLink, setCurrentLink] = useState<Option>(SelectOptions[0]);
  const [currentOption, setCurrentOption] = useState<typeof SelectOptions>([SelectOptions[0]]);
  const [inputValue, setInputValue] = useState('');
  const [form] = Form.useForm();
  async function addSocialLink(e: any) {
    await form?.validateFields();
    const currentData = currentOption.map(item => ({
      type: item.type,
      imgUrl: item.imgUrl,
      link: form.getFieldValue(`${item.type}link`)?.trim() || '',
      text: form.getFieldValue(`${item.type}text`)?.trim() || '',
    }));
    if (props.onAdd) {
      // props.onAdd(currentLink.type, form.getFieldValue('link'), currentLink.imgUrl, form.getFieldValue('text'));
      props.onAdd(currentData);
    }
    // 本地记录提交信息
    // const index = SelectOptions.findIndex(option => option.type === currentLink.type); // 记录选中的index
    // const text = form.getFieldValue('text'); // 记录填的text
    // const link = form.getFieldValue('link'); // 记录填的link
    const jsonStr = JSON.stringify(currentData);
    edmDataTracker.socialLinkSubmit(
      currentData.reduce((pre, cur) => {
        return pre + cur.text + '、';
      }, '')
    );
    dataStoreApi.putSync(SocialMediaInfo, jsonStr);

    cancelClick(e);
  }

  // 读取本地记录
  useEffect(() => {
    const result = dataStoreApi.getSync(SocialMediaInfo);
    if (result.suc && result.data != null) {
      try {
        const options: Array<{
          type: string;
          link: string;
          imgUrl: string;
          text: string;
        }> = JSON.parse(result.data);
        setCurrentOption(SelectOptions.filter(option => options.find(item => item.type === option.type) != null));
        let values: any = {};
        options.forEach(option => {
          values[`${option.type}link`] = option.link;
          values[`${option.type}text`] = option.text;
        });
        form.setFieldsValue(values);
      } catch (err) {}
    } else {
      if (form) {
        form.setFieldsValue({
          [`${SelectOptions[0].type}text`]: SelectOptions[0].type,
        });
      }
    }
  }, [props.visible]);
  const displayOptions = useMemo(() => {
    return currentOption.reverse();
  }, [currentOption]);

  function cancelClick(e: any) {
    setCurrentLink(SelectOptions[0]);
    if (form) {
      form?.resetFields();
    }
    if (props.onCancel) {
      props.onCancel(e);
    }
  }
  return (
    <Modal
      wrapClassName={style.mailEditorSocialLinkModal}
      title={''}
      centered
      width={592}
      closeIcon={<CloseIcon />}
      visible={props.visible}
      onOk={addSocialLink}
      onCancel={cancelClick}
      okButtonProps={{ disabled: !inputValue }}
      destroyOnClose
    >
      <div className={style.content}>
        <div className={style.header}>
          <div className={style.title}>{getIn18Text('CHARUSHEMEILIANJIE')}</div>
          <CloseIconModal className={style.close} onClick={cancelClick} />
        </div>
        <div className={style.iconList}>
          {SelectOptions.map(option => {
            const { Icon, ActiveIcon } = option;
            return (
              <div
                className={classnames([style.iconwrap, currentOption.find(item => item.type === option.type) != null ? style.active : ''])}
                onClick={() => {
                  // 修改默认文案
                  // form.setFieldsValue({
                  //   text: option.type,
                  // });
                  // setCurrentLink(option);
                  const index = currentOption.findIndex(item => item.type === option.type);
                  if (index < 0) {
                    const options = [...currentOption];
                    options.push(option);
                    setCurrentOption(options);
                    form.setFieldsValue({
                      [`${option.type}text`]: option.type,
                    });
                  } else if (currentOption.length > 1) {
                    setCurrentOption(currentOption.filter(item => item.type !== option.type));
                    form.setFieldsValue({
                      [`${option.type}link`]: '',
                      [`${option.type}text`]: '',
                    });
                  }
                }}
              >
                <div className={style.iconBox} style={{ backgroundColor: option.backgrounds.normal }}>
                  {/* <Icon className={style.icon} /> */}
                  <img src={Icon} className={style.icon} alt="" />
                </div>
                <div className={classnames(style.iconBox, style.iconBox1)} style={{ backgroundColor: option.backgrounds.hover }}>
                  {/* <ActiveIcon className={style.iconactive} /> */}
                  <img src={ActiveIcon} className={style.iconactive} alt="" />
                </div>
                <div className={style.linkInfo}>{option.type}</div>
              </div>
            );
          })}
        </div>
        <div className={style.inputList}>
          <Form form={form} colon={false}>
            {displayOptions.map((option, key) => {
              const { ActiveIcon } = option;
              return (
                <div className={style.input} key={option.type + key}>
                  <div className={style.inputHeader}>
                    <div className={style.inputLeft}>
                      {/* <ActiveIcon className={style.leftIco} /> */}
                      <img src={ActiveIcon} className={style.leftIcon} alt="" />
                      <div className={style.leftTitle}>{option.type}</div>
                    </div>
                    {currentOption.length > 1 && (
                      <div
                        className={style.inputRight}
                        onClick={() => {
                          setCurrentOption(currentOption.filter(item => item.type !== option.type));
                          form.setFieldsValue({
                            [`${option.type}link`]: '',
                            [`${option.type}text`]: '',
                          });
                        }}
                      >
                        <DeleteIcon className={style.rightIcon} />
                        <div className={style.rightTitle}>{getIn18Text('SHANCHU')}</div>
                      </div>
                    )}
                  </div>
                  <Form.Item name={option.type + 'text'} label={getIn18Text('WENZI')} className={style.inputForm}>
                    <Input
                      // onChange={({ target: { value } }) => setInputValue(value)}
                      placeholder={'请输入文字描述'}
                      className={style.inputBox}
                      // onPressEnter={addSocialLink}
                    />
                  </Form.Item>
                  <Form.Item
                    name={option.type + 'link'}
                    label={getIn18Text('LIANJIE')}
                    rules={
                      option.rules ?? [
                        { required: true, message: getIn18Text('QINGSHURULIANJIEDEZHI') },
                        ({ getFieldValue }: any) => ({
                          validator(_: any, value: string) {
                            if (!value) {
                              return Promise.resolve();
                            }
                            if (value.length > 0 && value.trim().length === 0) {
                              return Promise.reject(new Error(getIn18Text('QINGSHURULIANJIEDEZHI')));
                            }
                            // return Promise.resolve();
                            if (
                              /((http|ftp|https):\/\/)(([a-zA-Z0-9\._-]+\.[a-zA-Z]{2,6})|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,4})*(\/[a-zA-Z0-9\&%_\.\/-~-]*)?/.test(
                                value
                              )
                            ) {
                              return Promise.resolve();
                            }
                            return Promise.reject(getIn18Text('LIANJIEDEZHIGESHICUOWU'));
                          },
                        }),
                        // { type: 'url', message: getIn18Text('LIANJIEDEZHIGESHICUOWU') },
                      ]
                    }
                  >
                    <Input
                      onChange={({ target: { value } }) => setInputValue(value)}
                      placeholder={`${option.placeholder}`}
                      className={style.inputBox}
                      // onPressEnter={addSocialLink}
                    />
                  </Form.Item>
                </div>
              );
            })}
          </Form>
        </div>
        <div className={style.footer}>
          <Button
            onClick={cancelClick}
            style={{
              marginRight: 12,
            }}
          >
            {getIn18Text('setting_system_switch_cancel')}
          </Button>
          <Button type="primary" onClick={addSocialLink}>
            {getIn18Text('QUEDING')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
