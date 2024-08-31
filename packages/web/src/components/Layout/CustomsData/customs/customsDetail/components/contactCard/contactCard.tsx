import React, { useState, useRef, useEffect } from 'react';
import classnames from 'classnames';
import { ContactDetail, customsContactItem as contactsType } from 'api';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import EllipsisLabels from '@/components/Layout/Customer/components/ellipsisLabels/ellipsisLabels';
import InfoLayout from '@/components/Layout/Customer/components/infoLayout/infoLayout';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import useEventListener from '@web-common/hooks/useEventListener';
import style from './contactCard.module.scss';
import { ReactComponent as TwitterIcon } from '@/images/icons/customs/twitter.svg';
import { ReactComponent as LinkedInIcon } from '@/images/icons/customs/linkedin.svg';
import { Tooltip } from 'antd';
import defaultUserIcon from '@/images/icons/customerDetail/default-user.png';
import { getIn18Text } from 'api';
export type OptionType = 'mail' | 'edit' | 'delete';
export type OptionsType = OptionType[];
interface ContactCardProps {
  className?: string;
  data: contactsType;
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCarWidth] = useState<number>(32);
  useEffect(() => {
    let width = cardRef.current?.clientWidth;
    if (width && width <= 253) {
      setCarWidth(48);
    } else {
      setCarWidth(32);
    }
  }, []);
  const onBodyScroll = event => setScrollTop(event.target.scrollTop);
  useEventListener('scroll', onBodyScroll, bodyRef.current);
  return (
    <div ref={cardRef} className={classnames([style.contactCard, className])} style={{ width: `${cardWidth}%` }}>
      {mode === 'simple' && (
        <div className={style.simple}>
          <div className={style.icon}>
            <AvatarTag
              innerStyle={{ border: 'none' }}
              size={32}
              user={{
                name: data.contactName,
                avatar: !data.contactName && !data.email && defaultUserIcon,
                email: data.email || '123@163.com',
              }}
            />
            {/* {data.main_contact && <div className={style.mainContact} />} */}
          </div>
          <div className={style.content}>
            <div className={style.title}>
              <EllipsisTooltip className={classnames(style.name)}>{data.contactName}</EllipsisTooltip>
              {/* <div>
<span className={style.contacts}>
<Tooltip placement="topLeft" title={'账号'}>
<TwitterIcon />
</Tooltip>
</span>
<span className={style.contacts}>
<Tooltip placement="topLeft" title={'账号'}>
<LinkedInIcon />
</Tooltip>
</span>
</div> */}
              {/* <EllipsisLabels className={style.labels} list={data.label_list} /> */}
            </div>
            <div className={style.email}>
              <EllipsisTooltip className={style.emailAddress}>{data.email}</EllipsisTooltip>
            </div>
            <div className={style.email}>
              <EllipsisTooltip className={style.emailAddress}>{data?.telephones?.join(', ')}</EllipsisTooltip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
ContactCard.defaultProps = {
  mode: 'simple',
  options: ['mail', 'edit'],
  hiddenFields: [],
  completeHeight: 454,
};
export default ContactCard;
