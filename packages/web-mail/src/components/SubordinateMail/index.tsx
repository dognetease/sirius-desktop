import React, { CSSProperties, useMemo } from 'react';
import ColumnSubordinate from '@web-mail/components/SubordinateMail/ColumnSubordinate';
import ColumnSubordinateMailList from '@web-mail/components/SubordinateMail/ColumnSubordinateMailList';
import { SliceIdParams } from '@web-mail/types';
import ColumnMailBoxContainer from '@web-mail/components/ReadMailPageContainer/ColumnMailBoxContainer';
import MailColumnEntryContainer from '@web-mail/components/ReadMailPageContainer/MailColumnEntryContainer';
import PageContentLayout from '@/layouts/Main/pageContentLayout';

const inEdm = process.env.BUILD_ISEDM;

interface Props {
  isLeftRight: boolean;
  style?: CSSProperties;
  openInNewWindow?: boolean;
  height: string;
  defaultWidth: number;
  isMainTab?: boolean;
  showMailColumn: boolean;
  setMailListResizeProcessing?: (val: boolean) => void;
  defaultListWidth: number;
  folderMaxWidth?: number;
  listMaxWidth?: number;
}

const SubordinateMailContainer: React.FC<SliceIdParams<Props>> = ({
  sliceId,
  isLeftRight,
  style,
  openInNewWindow,
  children,
  height,
  isMainTab,
  defaultWidth,
  showMailColumn,
  defaultListWidth,
  setMailListResizeProcessing,
  folderMaxWidth,
  listMaxWidth,
}) => {
  if (!inEdm) {
    return <></>;
  }

  // 下属列表
  const columnMailBox = useMemo(() => {
    return (
      <ColumnMailBoxContainer
        isLeftRight={isLeftRight}
        height={height}
        isMainTab={isMainTab || false}
        defaultWidth={defaultWidth}
        openInNewWindow={openInNewWindow}
        SideContentLayout
        setMailListResizeProcessing={setMailListResizeProcessing}
        maxWidth={folderMaxWidth}
      >
        <ColumnSubordinate sliceId={sliceId} />
      </ColumnMailBoxContainer>
    );
  }, [isLeftRight, isMainTab, defaultWidth, openInNewWindow]);

  // 邮件列表
  const mailColumnEntry = useMemo(() => {
    return (
      <MailColumnEntryContainer
        isUpDown={false}
        height={height}
        showMailColumn={showMailColumn}
        isLeftRight={isLeftRight}
        defaultListWidth={defaultListWidth}
        openInNewWindow={openInNewWindow}
        SideContentLayout
        setMailListResizeProcessing={setMailListResizeProcessing}
        maxWidth={listMaxWidth}
      >
        <ColumnSubordinateMailList sliceId={sliceId} isLeftRight={isLeftRight} />
      </MailColumnEntryContainer>
    );
  }, [isLeftRight, showMailColumn, defaultWidth, openInNewWindow, defaultListWidth]);

  return (
    <>
      <PageContentLayout style={style}>
        {columnMailBox}
        {mailColumnEntry}
        {children && children}
      </PageContentLayout>
    </>
  );
};

export default SubordinateMailContainer;
