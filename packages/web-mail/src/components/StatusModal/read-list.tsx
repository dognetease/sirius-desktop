import React, { useState, useMemo } from 'react';
import { MailItemStatus } from '../../util';
import { getIn18Text, inWindow } from 'api';
import { IMailReadListItem } from 'api';
import classnames from 'classnames';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import type { ColumnsType } from 'antd/es/table';
import { Tooltip } from 'antd';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';

interface IProps {
  item: MailItemStatus;
  readList?: Array<IMailReadListItem>;
  isLoadingReadList?: boolean;
}

const wordSeparator = inWindow() && window.systemLang === 'en' ? ' ' : '';

const MailReadList: React.FC<IProps> = ({ item, readList = [], isLoadingReadList = false }) => {
  const [readListVisible, setReadListVisible] = useState<boolean>(false);
  let {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();

  const hasReadList = useMemo(() => {
    const isRead = item.status && item.status === 'read' ? true : false;
    //已读才展示列表
    if (item.result && item.result === 109 && isRead) {
      if (productVersionId === 'sirius') {
        return true;
      } else if (productVersionId == 'ultimate' && readList?.length) {
        const list = readList.filter(item => item.inner);
        return list && list.length > 0;
      }
    }
    return false;
  }, [item, productVersionId, readList]);

  const showReadList = useMemo(() => {
    if (productVersionId === 'sirius') {
      return readList;
    }
    if (productVersionId === 'ultimate') {
      return readList.filter(item => item.inner);
    }
    return [];
  }, [readList, productVersionId]);

  const tableColums: ColumnsType<IMailReadListItem> = readListVisible
    ? [
        {
          title: getIn18Text('LOCAL_TIME'),
          dataIndex: 'readTime',
          key: 'readTime',
          render: (text: string) => text || '--',
        },
        {
          title: getIn18Text('READ_CITY'),
          dataIndex: 'location',
          key: 'location',
          ellipsis: true,
          render(value) {
            return !!value ? (
              <Tooltip title={value}>
                <div className="u-item-readlist-item-location">{value}</div>
              </Tooltip>
            ) : (
              '--'
            );
          },
        },
        {
          title: getIn18Text('READER_LOCAL_TIME'),
          dataIndex: 'localReadTime',
          key: 'localReadTime',
          render: (text: string) => text || '--',
        },
        {
          title: getIn18Text('IP_ADDRESS'),
          dataIndex: 'clientIp',
          key: 'clientIp',
          render: (text: string) => text || '--',
        },
      ]
    : [];

  const handleStatusClicked = () => {
    if (!hasReadList) {
      return;
    }
    setReadListVisible(!readListVisible);
  };

  return (
    <>
      <div className="u-item-read-list-status-wrapper" onClick={handleStatusClicked}>
        <div
          className={classnames(['u-item-status', item.status == 'suc' || item?.rclResult === 9 ? 'u-suc' : ''])}
          style={{ color: item.color, userSelect: hasReadList ? 'none' : 'auto' }}
        >
          {item.status == 'suc'
            ? getIn18Text('CHEHUICHENGGONG') + wordSeparator
            : item.status == 'fail' || item?.rclResult === 9
            ? getIn18Text('CHEHUISHIBAI') + wordSeparator
            : item.text}
        </div>
        {hasReadList && (
          <div className={'u-item-read-down-icon' + (readListVisible ? ' u-item-read-down-icon-trans' : '')}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path
                d="M4.39043 6.51196L7.35012 2.81235C7.61203 2.48497 7.37894 2 6.95969 2L1.04031 2C0.621061 2 0.387974 2.48496 0.64988 2.81235L3.60957 6.51196C3.80973 6.76216 4.19027 6.76216 4.39043 6.51196Z"
                fill="#8D92A1"
              />
            </svg>
          </div>
        )}
      </div>
      {hasReadList && readListVisible && (
        <div className="u-item-readlist-table-wrapper">
          <SiriusTable bordered columns={tableColums} loading={isLoadingReadList} scroll={{ y: 164 }} dataSource={showReadList} pagination={false}></SiriusTable>
        </div>
      )}
    </>
  );
};

export default MailReadList;
