import React, { useState, useRef } from 'react';
import classnames from 'classnames';
import { ContactDetail } from 'api';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import EllipsisLabels from '@/components/Layout/Customer/components/ellipsisLabels/ellipsisLabels';
import InfoLayout from '@/components/Layout/Customer/components/infoLayout/infoLayout';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import useEventListener from '@web-common/hooks/useEventListener';
import style from './contactCard.module.scss';
import defaultUserIcon from '@/images/icons/customerDetail/default-user.png';
import { Dropdown, Menu } from 'antd';
import moreIcon from '@/images/icons/edm/autoMarket/more.svg';
import { getIn18Text } from 'api';
export type OptionType = 'mail' | 'edit' | 'delete';
export type OptionsType = OptionType[];
interface ContactCardProps {
  className?: string;
  data: ContactDetail;
  mode?: 'simple' | 'complete';
  options?: OptionsType;
  hiddenFields?: string[];
  completeHeight?: number;
  onWriteMail?: (email: string) => void;
  onEdit?: (contactId: string) => void;
  onDelete?: (contactId: string) => void;
}
const genderMap = { 0: '-', 1: getIn18Text('NAN'), 2: getIn18Text('NV') };
const ContactCard: React.FC<ContactCardProps> = props => {
  const { className, data, mode, options, hiddenFields, completeHeight, onWriteMail, onEdit, onDelete } = props;
  const [scrollTop, setScrollTop] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const onBodyScroll = event => setScrollTop(event.target.scrollTop);
  useEventListener('scroll', onBodyScroll, bodyRef.current);
  const list = [
    {
      key: 'label_list',
      label: getIn18Text('LIANXIRENBIAOQIAN'),
      content: InfoLayout.renderLabels(data.label_list),
    },
    {
      key: 'telephones',
      label: getIn18Text('DIANHUA'),
      content: InfoLayout.renderList(data.telephones),
    },
    {
      key: 'whats_app',
      label: 'WhatsApp',
      content: data.whats_app,
    },
    {
      key: 'social_platform',
      label: getIn18Text('SHEJIAOPINGTAI'),
      content: InfoLayout.renderList(data.social_platform?.map(item => `${item.name}: ${item.number || '-'}`)),
    },
    {
      key: 'job',
      label: getIn18Text('ZHIWEI'),
      content: data.job,
    },
    {
      key: 'home_page',
      label: getIn18Text('GERENZHUYE'),
      content: data.home_page,
      canJump: true,
    },
    {
      key: 'gender',
      label: getIn18Text('XINGBIE'),
      content: genderMap[data.gender] || data.gender,
    },
    {
      key: 'birthday',
      label: getIn18Text('SHENGRI'),
      content: data.birthday,
    },
    {
      key: 'remark',
      label: getIn18Text('BEIZHU'),
      content: data.remark,
    },
    {
      key: 'pictures',
      label: getIn18Text('TUPIAN'),
      content: InfoLayout.renderImage(data.pictures),
    },
  ];
  return (
    <div className={classnames([style.contactCard, className])}>
      {mode === 'simple' && (
        <div className={style.simple}>
          <div className={style.icon}>
            <AvatarTag
              innerStyle={{ border: 'none' }}
              size={32}
              user={{
                name: data.contact_name,
                avatar: data.contact_icon || (!data.contact_name && defaultUserIcon),
                email: data.email || '123@163.com',
              }}
            />
            {data.main_contact && <div className={style.mainContact} />}
          </div>
          <div className={style.content}>
            <div className={style.title}>
              <EllipsisTooltip
                className={classnames(style.name, {
                  [style.nameMaxWidth]: Array.isArray(data.label_list) && data.label_list.length,
                })}
              >
                {data.contact_name}
              </EllipsisTooltip>
              {data?.label_list?.length ? <EllipsisLabels className={style.labels} list={data.label_list} /> : ''}
              {options?.includes('edit') && options?.includes('delete') && (
                <div className={style.handerBtn}>
                  <Dropdown
                    placement="bottomRight"
                    overlayStyle={{
                      width: 102,
                    }}
                    overlay={
                      <Menu className={style.menuMore}>
                        <Menu.Item key="edit" onClick={() => onEdit && onEdit(data.contact_id)}>
                          {getIn18Text('BIANJI')}
                        </Menu.Item>
                        <Menu.Item key="delete" onClick={() => onDelete && onDelete(data.contact_id)}>
                          {getIn18Text('SHANCHU')}
                        </Menu.Item>
                      </Menu>
                    }
                  >
                    <img className={style.btnMore} src={moreIcon} />
                  </Dropdown>
                </div>
              )}
            </div>
            <div className={style.email}>
              {/* 兼容线索没有邮箱问题 */}
              {data.email ? (
                <EllipsisTooltip className={style.emailAddress}>{data.email}</EllipsisTooltip>
              ) : (
                <EllipsisTooltip className={style.emailAddress}>{Array.isArray(data?.telephones) ? data?.telephones[0] : ''}</EllipsisTooltip>
              )}

              {options?.includes('mail') && data.email && <div className={style.emailTrigger} onClick={() => onWriteMail && onWriteMail(data.email)} />}
            </div>
          </div>
        </div>
      )}
      {mode === 'complete' && (
        <div className={style.complete} style={{ height: completeHeight }}>
          <div className={classnames([style.header], { [style.shadow]: scrollTop > 0 })}>
            <div className={style.icon}>
              <AvatarTag
                innerStyle={{ border: 'none' }}
                size={32}
                user={{
                  name: data.contact_name,
                  avatar: data.contact_icon,
                  email: data.email,
                }}
              />
              {data.main_contact && <div className={style.mainContact} />}
            </div>
            <div className={style.content}>
              <div className={style.title}>
                <EllipsisTooltip className={style.name}>{data.contact_name}</EllipsisTooltip>
                <>
                  {options?.includes('mail') && (
                    <div className={classnames(style.emailTrigger, style.optionItem)} onClick={() => onWriteMail && onWriteMail(data.email)} />
                  )}
                  {options?.includes('edit') && <div className={classnames(style.editTrigger, style.optionItem)} onClick={() => onEdit && onEdit(data.contact_id)} />}
                  {options?.includes('delete') && (
                    <div className={classnames(style.deleteTrigger, style.optionItem)} onClick={() => onDelete && onDelete(data.contact_id)} />
                  )}
                </>
              </div>
              <EllipsisTooltip className={style.emailAddress}>{data.email}</EllipsisTooltip>
            </div>
          </div>
          <div className={style.body} ref={bodyRef}>
            <InfoLayout list={list.filter(item => !hiddenFields?.includes(item.key))} itemWidth={376} itemMarginRight={36} itemMarginBottom={12} />
          </div>
        </div>
      )}
    </div>
  );
};
ContactCard.defaultProps = {
  data: {} as ContactDetail,
  mode: 'simple',
  options: ['mail', 'edit'],
  hiddenFields: [],
  completeHeight: 454,
};
export default ContactCard;
