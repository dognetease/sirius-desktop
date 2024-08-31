import { ExternalShareLinkValidPeriod, ResponseExternalShareList } from 'api';
import React from 'react';
import { IconMapKey } from '@web-common/components/UI/IconCard';
import { ExternalShareLinkDetail } from '@/components/Layout/Disk/utils';

export interface Props {
  visible: boolean;
  externalShareList?: ResponseExternalShareList;
  listLoading?: boolean;
  listLoadError?: boolean;
  loadListData?: () => void;
  visitTime: ExternalShareLinkValidPeriod;
  contentWidth?: number;
}
export interface TableOperateProps {
  item: ExternalShareLinkDetail;
  handleExternalShareLink: (status, shareIdentity: string) => void;
  setRowHover: (id: string) => void;
}

export interface TableSummaryProps {
  totalShareUrlCounts: number;
  totalVisitCounts: number;
  totalDownloadCounts: number;
  className: any;
}
