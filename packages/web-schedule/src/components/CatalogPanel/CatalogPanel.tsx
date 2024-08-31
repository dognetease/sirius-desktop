import React from 'react';
import classnames from 'classnames';
import Icon from '@ant-design/icons/lib/components/Icon';
import styles from './catalogpanel.module.scss';
import { ReactComponent as AddSvg } from '@/images/icons/calendarDetail/calendar_add_gray.svg';

interface CalogPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  header: React.ReactNode;
  icon?: React.ReactNode;
}

const CatalogPanel: React.FC<CalogPanelProps> = ({ header, children, className, icon = null, ...props }) => (
  <>
    <div className={classnames(className, styles.header)} {...props}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'keep-all', whiteSpace: 'nowrap' }}>{header}</span>
      <i className={styles.icon}>{icon}</i>
    </div>
    <div>{children}</div>
  </>
);

export const CatalogPanelAddIcon = (props: any) => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <Icon component={AddSvg} style={{ fontSize: 16 }} {...props} />
);

export default CatalogPanel;
