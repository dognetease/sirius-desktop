import React, { CSSProperties, useMemo } from 'react';
import ColumnCustomer from '@web-mail/components/CustomerMail/ColumnCustomer';
import ColumnCustomerMailList from '@web-mail/components/CustomerMail/ColumnCustomerMailList';
import { SliceIdParams } from '@web-mail/types';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import ColumnMailBoxContainer from '@web-mail/components/ReadMailPageContainer/ColumnMailBoxContainer';
import MailColumnEntryContainer from '@web-mail/components/ReadMailPageContainer/MailColumnEntryContainer';

const inEdm = process.env.BUILD_ISEDM;

interface Props {
  isLeftRight: boolean;
  style?: CSSProperties;
  openInNewWindow?: boolean;
  height: string;
  defaultWidth: number;
  isMainTab?: boolean;
  showMailColumn: boolean;
  defaultListWidth: number;
  setMailListResizeProcessing?: (val: boolean) => void;
  folderMaxWidth?: number;
  listMaxWidth?: number;
}

const CustomerMailContainer: React.FC<SliceIdParams<Props>> = ({
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

  // 客户列表
  const columnMailBox = useMemo(() => {
    return (
      <ColumnMailBoxContainer
        setMailListResizeProcessing={setMailListResizeProcessing}
        isLeftRight={isLeftRight}
        height={height}
        isMainTab={isMainTab || false}
        maxWidth={folderMaxWidth}
        defaultWidth={defaultWidth}
        SideContentLayout
      >
        <ColumnCustomer />
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
        <ColumnCustomerMailList isLeftRight={isLeftRight} />
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

export default CustomerMailContainer;
