import { List, Tooltip } from 'antd';
import React, { useCallback, useMemo } from 'react';
import classnames from 'classnames';
import { splitSearchHit } from '@web-contact/util';
import { TeamAvatar } from '@web-im/common/imUserAvatar';
import styles from './index.module.scss';
import Checkbox from '../Checkbox';
import { OrgItem } from '@web-common/utils/contact_util';

import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { ReactComponent as OrgIcon } from '@/images/icons/contact/org_icon.svg';
import { util } from 'api';
import { getIn18Text } from 'api';

export interface OrgListItemProps {
  type: 'normal' | 'search';
  showAvatar?: boolean;
  showCheckbox?: boolean;
  showDelete?: boolean;
  checked?: boolean;
  disableCheck?: boolean;
  selected?: boolean;
  item: OrgItem;

  onSelect?(): void;

  onDelete?(c: OrgItem): void;

  searchText?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ListItem: React.FC<OrgListItemProps> = props => {
  const { type, showAvatar, item, onSelect, onDelete, searchText, checked, disableCheck, selected, showCheckbox, showDelete, className, style } = props;
  const renderHighLight = useCallback((text: string, searchText?: string) => {
    if (!searchText) {
      return text;
    }
    const result = splitSearchHit(searchText, text);
    if (!result) {
      return text;
    }
    return (
      <>
        {result.head}
        <b className={styles.hitText}>{result.target}</b>
        {result.tail}
      </>
    );
  }, []);
  const renderDelete = useCallback(() => {
    return (
      <div
        className={styles.itemDelete}
        onClick={() => {
          onDelete && onDelete(item);
        }}
      />
    );
  }, []);
  const isTeam = item.orgType === 'team';
  const title = renderHighLight(item.orgName, searchText);
  const titleTip = item.orgName;
  let Avatar = <AvatarTag size={32} user={{ name: item.id, color: util.getColor(item.id) }} avatarImg={<OrgIcon />} />;
  if (isTeam) {
    const { id, avatar } = item;
    const teamId = id.startsWith('team_') ? id.split('team_')[1] : id;
    const teamInfo = { teamId, avatar };
    Avatar = <TeamAvatar teamId={teamInfo!.teamId} teamInfo={teamInfo!} />;
  }
  const AvatarContent = useMemo(() => {
    return (
      <div className={styles.itemAvatarContainer}>
        {showCheckbox ? (
          <div className={styles.itemAvatarCheckbox}>
            <Checkbox checked={checked} disabled={disableCheck} />
          </div>
        ) : null}
        <div className={styles.itemAvatarWrap}>{Avatar}</div>
      </div>
    );
  }, [Avatar]);
  const subtitle = isTeam && item.memberNum ? item.memberNum + getIn18Text('REN') : '';
  return (
    <List.Item
      style={style}
      onClick={() => {
        onSelect && onSelect();
      }}
      className={classnames(styles.item, styles[type], className, {
        [styles.itemSelect]: selected,
        [styles.itemSelectDisable]: disableCheck,
      })}
    >
      <div
        className={classnames(styles.itemWrap, {
          [styles.itemWrapPaddingRight]: showDelete && type === 'normal',
        })}
      >
        <div className={styles.itemAvatar}>{showAvatar ? AvatarContent : null}</div>
        <div className={styles.itemContent}>
          <div className={styles.titleWrap}>
            <Tooltip title={titleTip} mouseEnterDelay={1}>
              <i className={styles.titleName}>{title}</i>
            </Tooltip>
          </div>
          {subtitle && (
            <div className={styles.descWrap}>
              <Tooltip title={subtitle} mouseEnterDelay={1}>
                <p className={styles.subtitle}>{subtitle}</p>
              </Tooltip>
            </div>
          )}
        </div>
        {showDelete && type === 'normal' ? renderDelete() : null}
      </div>
    </List.Item>
  );
};
export default ListItem;
