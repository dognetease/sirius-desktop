import React from 'react';
import './index.scss';
import { api, apis, ContactAndOrgApi, ContactModel, EntityContact, util } from 'api';
import AvatarTag from './avatarTag';

interface simpleContact {
  id?: string;
  avatar?: string;
  contactName: string;
  color?: string;
  email?: string;
}
export type AvatarContact =
  | ContactModel
  | {
      contact: simpleContact;
    };
interface AvatarProp {
  item: AvatarContact;
  style?: React.CSSProperties;
  size?: number;
  innerStyle?: React.CSSProperties;
}

const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const Avatar: React.FC<AvatarProp> = prop => {
  const {
    item: { contact: propContact },
    size,
    style,
    innerStyle,
  } = prop;
  const contact = propContact as simpleContact & EntityContact;
  const avatarUrl = contact.avatar;
  const name = contact.contactName;
  const email = contact.email || contactApi.doGetModelDisplayEmail(prop.item as ContactModel);
  const contactId = contact.id;
  return <AvatarTag size={size} contactId={contactId} propEmail={email} user={{ name, avatar: avatarUrl }} style={style} innerStyle={innerStyle} />;
};
export default Avatar;
