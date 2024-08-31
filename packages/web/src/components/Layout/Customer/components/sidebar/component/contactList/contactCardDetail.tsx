import React from 'react';
import classnames from 'classnames';
import { api, apis, ContactDetail, MailApi, getIn18Text } from 'api';
import { message, Tooltip } from 'antd';
import CopyToClipboard from 'react-copy-to-clipboard';
import { ReactComponent as TongyongNanIcon } from '@/images/icons/tongyong_nan.svg';
import { ReactComponent as TongyongNvIcon } from '@/images/icons/tongyong_nv.svg';
import { ReactComponent as ShengriIcon } from '@/images/icons/shengri.svg';
import style from './contactCardDetail.module.scss';
import { PrivilegeCheckForMailPlus } from '@/components/UI/PrivilegeEnhance';
import Tag from '@web-common/components/UI/Tag';
import EllipsisTooltip from '../../../ellipsisTooltip/ellipsisTooltip';
import { TongyongFuzhi, TongyongShuru, TongyongYouxiang4 } from '@sirius/icons';

// 根据key获取展示的内容
export const getContentByKey = (key: keyof ContactDetail, data: ContactDetail): string[] => {
  const result = [];
  const { email, contact_infos, telephone, whats_app, address, area, social_platform, ext_infos } = data;
  if (key === 'email') {
    !!email && result.push(email);
    if (contact_infos && contact_infos.length) {
      contact_infos.forEach(i => {
        if (i.contact_type === 'EMAIL' && !!i.contact_content) {
          result.push(i.contact_content);
        }
      });
    }
  } else if (key === 'telephones') {
    !!telephone && result.push(telephone);
    if (contact_infos && contact_infos.length) {
      contact_infos.forEach(i => {
        if (i.contact_type === 'TEL' && !!i.contact_content) {
          result.push(i.contact_content);
        }
      });
    }
  } else if (key === 'whats_app') {
    !!whats_app && result.push(whats_app);
    if (contact_infos && contact_infos.length) {
      contact_infos.forEach(i => {
        if (i.contact_type === 'WHATSAPP' && !!i.contact_content) {
          result.push(i.contact_content);
        }
      });
    }
  } else if (['job', 'remark', 'department'].includes(key)) {
    !!data[key] && result.push(data[key]);
  } else if (key === 'address') {
    if (address && address.length) {
      address[0] && result.push(address[0]);
    }
  } else if (key === 'area') {
    if (area && area.length && area.some(i => !!i)) {
      result.push(area.filter(Boolean).join('·'));
    }
  } else if (key === 'social_platform') {
    if (social_platform && social_platform.length) {
      social_platform.forEach(s => {
        const { name, number } = s;
        if (!!name && !!number) {
          result.push(`${name}: ${number}`);
        }
      });
    }
  } else if (key === 'ext_infos') {
    if (ext_infos && ext_infos.length) {
      ext_infos.forEach(s => {
        const { key, value } = s;
        if (!!key && !!value) {
          result.push(`${key}: ${value}`);
        }
      });
    }
  }
  return result as string[];
};

interface ContactCardProps {
  className?: string;
  data: ContactDetail;
  onWriteMail?: (email: string) => void;
  onEdit?: (contactId: string) => void;
  readonly?: boolean;
}
const mailApi = api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
function handleWriteMail(emailAddress: string) {
  mailApi.doWriteMailToContact([emailAddress]);
}
const ContactCardDetail: React.FC<ContactCardProps> = props => {
  const { className, data, onWriteMail = handleWriteMail, onEdit, readonly } = props;

  // 渲染头数据
  const renderHeader = () => {
    const { main_contact, gender, birthday } = data;
    return (
      <div className={style.contactHeader}>
        <div className={style.title}>
          {/* 名字 || 邮箱 || 未知 */}
          <EllipsisTooltip>{data.contact_name || data.email || getIn18Text('WEIZHI')}</EllipsisTooltip>
          {!readonly && (
            <PrivilegeCheckForMailPlus accessLabel="OP" resourceLabel="CONTACT">
              <Tooltip title={getIn18Text('BIANJILIANXIREN')}>
                <span className={style.icon} onClick={() => onEdit && onEdit(data.contact_id)}>
                  <TongyongShuru fontSize={16} />
                </span>
              </Tooltip>
            </PrivilegeCheckForMailPlus>
          )}
        </div>
        {/* 主联系人，性别，生日三者有一才展示 */}
        {(main_contact || gender === '1' || gender === '2' || (!!birthday && moment.isMoment(moment(+birthday)))) && (
          <div className={classnames(style.tagList, 'btn-row')}>
            {/* 主联系人 */}
            {main_contact && (
              <Tag type="label-1-1" hideBorder={true}>
                {getIn18Text('ZHULIANXIREN')}
              </Tag>
            )}
            {/* 性别 */}
            {gender === '1' && (
              <Tag type="label-2-1" hideBorder={true}>
                <TongyongNanIcon style={{ marginRight: 4 }} />
                {getIn18Text('NAN')}
              </Tag>
            )}
            {gender === '2' && (
              <Tag type="label-3-1" hideBorder={true}>
                <TongyongNvIcon style={{ marginRight: 4 }} />
                {getIn18Text('NV')}
              </Tag>
            )}
            {/* 生日 */}
            {!!birthday && moment.isMoment(moment(+birthday)) && (
              <Tag type="label-4-1" hideBorder={true}>
                <ShengriIcon style={{ marginRight: 4 }} />
                {moment(+birthday).format('YYYY/M/D')}
              </Tag>
            )}
          </div>
        )}
      </div>
    );
  };

  // 点击发信
  const handleClickItem = (email: string) => {
    onWriteMail && onWriteMail(email);
  };

  // 渲染icon图标
  const renderIcon = (key: keyof ContactDetail, content: string) => {
    if (['email', 'telephones', 'whats_app'].includes(key)) {
      if (key === 'email') {
        // 写信
        return (
          <Tooltip title={getIn18Text('FAYOUJIAN')}>
            <span className={style.icon} onClick={() => handleClickItem(content)}>
              <TongyongYouxiang4 fontSize={16} />
            </span>
          </Tooltip>
        );
      } else {
        // 复制
        return (
          <CopyToClipboard
            onCopy={(_, result) => {
              if (result) {
                message.success({
                  content: getIn18Text('FUZHICHENGGONG'),
                });
              } else {
                message.error({
                  content: getIn18Text('FUZHISHIBAI'),
                });
              }
            }}
            text={content}
          >
            <Tooltip title={getIn18Text('FUZHI')}>
              <span className={style.icon}>
                <TongyongFuzhi style={{ fontSize: 16 }} />
              </span>
            </Tooltip>
          </CopyToClipboard>
        );
      }
    } else {
      return null;
    }
  };

  // 渲染行数据
  const renderRow = (key: keyof ContactDetail) => {
    const titleObj = {
      email: getIn18Text('YOUXIANG'),
      telephones: getIn18Text('DIANHUA'),
      whats_app: 'WhatApps',
      job: getIn18Text('ZHIWEI'),
      department: getIn18Text('BUMEN'),
      area: getIn18Text('GUOJIADEQU'),
      address: getIn18Text('GONGSIDIZHI'),
      remark: getIn18Text('BEIZHU'),
      social_platform: getIn18Text('SHEJIAOPINGTAI'),
      ext_infos: getIn18Text('FUJIAXINXI'),
    };
    const title = titleObj[key] || '';
    const contentArr = getContentByKey(key, data);
    // 是否是超链接
    const isLink = key === 'email';
    return contentArr && contentArr.length ? (
      <div className={style.contactRow}>
        {contentArr.map((item, idx) => {
          return (
            <div className={style.contactLine}>
              {/* 第一行有标题 */}
              <div className={style.contactLineTitle}>{idx === 0 ? title + ':' : ''}</div>
              <div className={style.contactLineContent}>
                <EllipsisTooltip className={style.ellipsis}>
                  <span
                    className={isLink ? style.contentLink : ''}
                    onClick={() => {
                      isLink && handleClickItem(item);
                    }}
                  >
                    {item}
                  </span>
                </EllipsisTooltip>
                {renderIcon(key, item)}
              </div>
            </div>
          );
        })}
      </div>
    ) : null;
  };

  return (
    <div className={classnames([style.contactCard, className])}>
      <div className={style.simple}>
        <div className={style.content}>
          {/* 姓名 */}
          {renderHeader()}
          {/* 邮箱 */}
          {renderRow('email')}
          {/* 电话 */}
          {renderRow('telephones')}
          {/* Whatapp */}
          {renderRow('whats_app')}
          {/* 职位 */}
          {renderRow('job')}
          {/* 部门 */}
          {renderRow('department')}
          {/* 国家地区 */}
          {renderRow('area')}
          {/* 公司地址 */}
          {renderRow('address')}
          {/* 备注 */}
          {renderRow('remark')}
          {/* 社交平台 */}
          {renderRow('social_platform')}
          {/* 附加信息 */}
          {renderRow('ext_infos')}
        </div>
      </div>
    </div>
  );
};
export default ContactCardDetail;
