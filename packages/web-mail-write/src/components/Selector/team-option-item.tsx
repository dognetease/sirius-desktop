import React from 'react';
import { highlightText } from '../../util';
import styles from './selector.module.scss';
import { TeamAvatar } from '@web-im/common/imUserAvatar';
// import styleTitle from '@web-common/components/UI/SiriusContact/listItem/index.module.scss';
// import classnames from 'classnames';
import IconCard from '@web-common/components/UI/IconCard';
import { OrgItem } from '@web-common/utils/contact_util';
import { getIn18Text } from 'api';
import { CustomerLabelByRole } from '@web-mail/components/ReadMail/component/CustomerLabel';

export interface OptionItemProps {
  item: OrgItem;
  search?: string;
}

const OptionItem: React.FC<OptionItemProps> = props => {
  const { item, search } = props;

  const htmlName = highlightText(item.orgName, search, styles.hitText);

  const isCustomer = item.type === 2002;
  const isTeam = item.type === 2000;

  const isPersonalGroup = item.type === 2001;
  let titleLabelRole;
  if ([2002, 2003].includes(item.type)) {
    titleLabelRole = item.customerRole;
  }

  const teamId = isTeam ? item.id.substr(item.id.indexOf('_') + 1, item.id.length) : '';
  return (
    <div className={styles.optionItem} key={item.id}>
      <div className={styles.optionAvatarWrap}>
        {isTeam ? (
          <TeamAvatar style={{ width: '20px', height: '20px' }} teamId={teamId} />
        ) : isPersonalGroup ? (
          <TeamAvatar style={{ width: '20px', height: '20px' }} teamId={'5117576620'} />
        ) : (
          <IconCard type={isCustomer ? 'crmClient' : 'hintClient'} />
        )}
      </div>
      <span
        className={styles.optionContactName}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: htmlName + (item.memberNum !== undefined ? `（${item.memberNum}${getIn18Text('REN')}）` : ''),
        }}
      />
      {/* {titleLabel && (
        <span
          className={classnames(styleTitle.titleLabel, {
            [styleTitle.isMy]: isCustomer,
          })}
        >
          {titleLabel}
        </span>
      )} */}
      {titleLabelRole && <CustomerLabelByRole role={titleLabelRole} style={{ marginLeft: 8 }} />}
    </div>
  );
};

export default OptionItem;
