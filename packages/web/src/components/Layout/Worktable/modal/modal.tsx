import React, { useCallback } from 'react';
import { Modal } from 'antd';
import modalStyle from './modal.module.scss';
import classNames from 'classnames';
import { CompanyFilter, MemberFilter, TimeFilter } from './filters';
import { Filters } from '@web-common/state/reducer/worktableReducer';
import { getIn18Text } from 'api';
export interface WorktableModalProps {
  subText: string;
  visible: boolean;
  filterVisbile?: {
    company?: boolean;
    account?: boolean;
    resourceLabel?: string;
  };
  onClose?: () => void;
  onRefresh?: () => void;
  filterValues: Filters;
  onFilterChange?: (changes: any) => void;
}
export const WorktableModal: React.FC<WorktableModalProps> = props => {
  const { subText, visible, children, filterVisbile, filterValues } = props;
  const handleFilterChange = useCallback(
    (changes: any) => {
      props.onFilterChange && props.onFilterChange(changes);
    },
    [props.onFilterChange]
  );
  return (
    <Modal
      closable={false}
      footer={null}
      width={704}
      title={getIn18Text('YULAN/GUOLV')}
      visible={visible}
      className={modalStyle.worktableModal}
      getContainer={() => document.getElementById('worktable-page-root')!}
    >
      <div className={modalStyle.header}>
        <div className={modalStyle.modalTitle}>{getIn18Text('YULAN/GUOLV')}</div>
        <p className={modalStyle.subText}>{subText}</p>
        <div className={modalStyle.headerActions}>
          <a className={classNames([modalStyle.actionBtn, modalStyle.closeIcon])} onClick={props.onClose} />
          <a className={classNames([modalStyle.actionBtn, modalStyle.uRefresh])} onClick={props.onRefresh} />
        </div>
      </div>
      <div className={modalStyle.content}>
        <div className={modalStyle.filterSidebar}>
          <TimeFilter start={filterValues.start_date} end={filterValues.end_date} onChange={handleFilterChange} />
          {filterVisbile?.company && <CompanyFilter star={filterValues.star_level} level={filterValues.company_level} onChange={handleFilterChange} />}
          {filterVisbile?.account && <MemberFilter memberIds={filterValues.account_id_list} onChange={handleFilterChange} resourceLabel={filterVisbile.resourceLabel} />}
        </div>
        <div className={modalStyle.body}>{children}</div>
      </div>
    </Modal>
  );
};
