import React, { CSSProperties } from 'react';
import debounce from 'lodash.debounce';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import ErrorBoundary from '@web-common/hooks/ErrorBoundary';
import { apiHolder as api } from 'api';
// import { DEFAULT_LIST_MIN_WIDTH } from '@web-mail/common/constant';
const STORE_MAIL_LIST_HEIGHT = 'STORE_MAIL_LIST_HEIGHT';
import { mailListWidthStorePut, DEFAULT_LIST_MIN_WIDTH } from '@web-mail/hooks/useAppScale';

const storeApi = api.api.getDataStoreApi();

interface Props {
  height: string;
  showMailColumn: boolean;
  isLeftRight: boolean;
  isUpDown: boolean;
  openInNewWindow?: boolean;
  defaultListWidth: number;
  upDownProps?: Object;
  maxWidth?: number;
  setMailListResizeProcessing?: (val: boolean) => void;
  SideContentLayout: boolean; // o(╯□╰)o pageContentLayout 用这个属性来添加父级元素
}
const defaultObject = {};
// const STORE_MAIL_LIST_WIDTH = 'STORE_MAIL_LIST_WIDTH';

const MailColumnEntryContainer: React.FC<Props> = ({
  children,
  height,
  showMailColumn,
  isLeftRight,
  isUpDown,
  defaultListWidth,
  openInNewWindow,
  upDownProps = defaultObject,
  maxWidth,
  setMailListResizeProcessing,
}) => {
  if (openInNewWindow) {
    return <></>;
  }
  const resizeList = React.useCallback(
    debounce((_, data) => {
      const {
        size: { width },
      } = data;
      // 判断如果是分栏模式
      if (isLeftRight) {
        // 邮件列表宽度保存到storage
        // storeApi.putSync(STORE_MAIL_LIST_WIDTH, width, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' });
        mailListWidthStorePut(width);
      } else if (isUpDown) {
        storeApi.putSync(STORE_MAIL_LIST_HEIGHT, height, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' });
      }
    }, 150),
    [isLeftRight, isUpDown]
  );

  if ((isLeftRight || isUpDown) && showMailColumn) {
    return (
      <SideContentLayout
        borderRight
        minWidth={DEFAULT_LIST_MIN_WIDTH}
        maxWidth={maxWidth}
        defaultWidth={defaultListWidth}
        className="m-email-list"
        resizeClassName={isUpDown ? 'upDownResize' : ''}
        style={{ position: 'relative' }}
        onResize={resizeList}
        onResizeStop={() => {
          setMailListResizeProcessing && setMailListResizeProcessing(false);
        }}
        onResizeStart={() => {
          // todo: 防抖
          setMailListResizeProcessing && setMailListResizeProcessing(!0);
        }}
        {...upDownProps}
      >
        <ErrorBoundary name="MailColumnEntryContainer">{children}</ErrorBoundary>
      </SideContentLayout>
    );
  }
  const outerStyle: CSSProperties = {
    height,
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  };
  const innerStyle: CSSProperties = {
    position: 'absolute',
    inset: '0px',
    overflowX: 'overlay' as any,
    overflowY: 'hidden',
    width: '100%',
    height: '100%',
  };
  return (
    <div style={outerStyle} SideContentLayout hidden={!showMailColumn}>
      <div style={innerStyle}>
        <div style={{ minWidth: isLeftRight ? '764px' : '650px', flex: 1, position: 'relative', height: '100%' }}>
          <ErrorBoundary name="MailColumnEntryContainer-1">{children}</ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default MailColumnEntryContainer;
