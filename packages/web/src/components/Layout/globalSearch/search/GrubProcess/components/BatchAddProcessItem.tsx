import React, { FC, useMemo, useState } from 'react';
import { getIn18Text } from 'api';
import { Progress } from 'antd';
import classNames from 'classnames';
import { navigate } from 'gatsby';
import { navigateToLeadPage } from '@web-unitable-crm/api/helper';
import { ReactComponent as SuccessSvg } from '@/images/icons/globalsearch/icon-success.svg';
import { GrubbingComp, IGrubProcessItem } from '../GrubProcess';
import styles from '../index.module.scss';
import { GrubNameComp } from './NameComp';
import { GrubProcessCodeEnum, GrubProcessTypeEnum } from '../constants';

interface Props {
  item: IGrubProcessItem;
  defaultVisited?: boolean;
  onVisit?: (id: string) => void;
  progressPercent?: number;
}

const addressBookCodeList: string[] = [GrubProcessCodeEnum.customBatchAddBooks, GrubProcessCodeEnum.globalBatchAddBooks];

const aiHostingCodeList: string[] = [GrubProcessCodeEnum.customBatchAddEdm, GrubProcessCodeEnum.globalBatchAddEdm];

export const BatchAddProcessItem: FC<Props> = ({ item, defaultVisited = false, onVisit, progressPercent }) => {
  const { code, name, grubStatus, id, taskId } = item;
  const type = useMemo(() => {
    if (aiHostingCodeList.includes(code ?? '')) return GrubProcessTypeEnum.aiHosting;
    if (addressBookCodeList.includes(code ?? '')) return GrubProcessTypeEnum.addressBook;
    if (code === GrubProcessCodeEnum.companyFission) return GrubProcessTypeEnum.fission;
    return GrubProcessTypeEnum.leads;
  }, [code]);
  const [visited, setVisited] = useState<boolean>(defaultVisited);
  const onView = () => {
    setVisited(true);
    onVisit?.(id);
    if (type === GrubProcessTypeEnum.addressBook) {
      navigate('#edm?page=addressBookIndex');
    } else if (type === GrubProcessTypeEnum.aiHosting) {
      navigate('#edm?page=aiHosting');
    } else if (type === GrubProcessTypeEnum.fission) {
      const extra = item.fissionId ? `&fissionId=${item.fissionId}` : '';
      navigate(`#wmData?page=star${extra}`);
    } else {
      navigateToLeadPage();
    }
  };
  return (
    <div
      className={classNames(styles.grubItem, {
        [styles.grubItemGrubbing]: grubStatus === 'GRUBBING',
      })}
    >
      <div className={styles.grubItemTitle}>
        <GrubNameComp type={type} code={code} name={name} desc={`ID：${taskId}`} />
        <div className={styles.grubStatus}>
          {(grubStatus === 'GRUBBING' || grubStatus === 'OFFLINE_GRUBBING') && <GrubbingComp text="进行中" />}
          {/* 暂时只对裂变进行无数据状态处理 */}
          {(grubStatus === 'GRUBBED' || grubStatus === 'OFFLINE_GRUBBED') && !item.grubCount && type === GrubProcessTypeEnum.fission && (
            <span className={styles.grubText}>暂无数据</span>
          )}
          {/* 除开裂变类型 其余默认返回true  裂变类型只有满足条件才会为true */}
          {(grubStatus === 'GRUBBED' || grubStatus === 'OFFLINE_GRUBBED') &&
            (type === GrubProcessTypeEnum.fission ? typeof item.grubCount === 'number' && item.grubCount > 0 : true) && (
              <>
                <SuccessSvg />
                <span
                  onClick={onView}
                  style={{ paddingLeft: 8 }}
                  className={classNames(styles.grubLinkText, {
                    [styles.grubLinkTextVisited]: visited,
                  })}
                >
                  {`${getIn18Text('LIJICHAKAN')}${item.grubCount ? `（${item.grubCount}）` : ''}`}
                </span>
              </>
            )}
        </div>
      </div>
      {grubStatus === 'GRUBBING' && progressPercent != null && progressPercent !== 100 && (
        <Progress strokeColor="#4C6AFF" strokeLinecap="square" strokeWidth={8} type="line" percent={progressPercent} showInfo={false} className={styles.progress} />
      )}
    </div>
  );
};
