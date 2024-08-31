import React from 'react';
import debounce from 'lodash.debounce';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import ErrorBoundary from '@web-common/hooks/ErrorBoundary';
// import { apiHolder as api } from 'api';
import { folderWidthStorePut, DEFAULT_FOLDER_MIN_WIDTH } from '@web-mail/hooks/useAppScale';

// const storeApi = api.api.getDataStoreApi();

interface Props {
  height: string;
  defaultWidth: number;
  isLeftRight: boolean;
  isMainTab: boolean;
  openInNewWindow?: boolean;
  maxWidth?: number;
  setMailListResizeProcessing?: (val: boolean) => void;
  SideContentLayout: boolean; // o(╯□╰)o pageContentLayout 用这个属性来添加父级元素
}

// const STORE_MAIL_FOLDER_WIDTH = 'STORE_MAIL_FOLDER_WIDTH';

const ColumnMailBoxContainer: React.FC<Props> = ({ children, height, defaultWidth, isLeftRight, isMainTab, openInNewWindow, maxWidth, setMailListResizeProcessing }) => {
  if (openInNewWindow) {
    return <></>;
  }
  // 监听文件夹列宽度变化,同时更新邮件列表变化
  const resize = React.useCallback(
    debounce((_, data) => {
      // TODO 添加宽度存储到storage tempWidth
      const {
        size: { width },
      } = data;
      // storeApi.putSync(STORE_MAIL_FOLDER_WIDTH, width, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' });
      folderWidthStorePut(width);
    }, 200),
    [isLeftRight, isMainTab]
  );
  return (
    <SideContentLayout
      needBtn
      borderRight
      className="m-mailbox-container"
      style={{ position: 'relative' }}
      defaultheight={height}
      minWidth={DEFAULT_FOLDER_MIN_WIDTH}
      maxWidth={maxWidth}
      onResize={resize}
      onResizeStop={() => {
        setMailListResizeProcessing && setMailListResizeProcessing(false);
      }}
      onResizeStart={() => {
        // todo: 防抖
        setMailListResizeProcessing && setMailListResizeProcessing(!0);
      }}
      defaultWidth={defaultWidth}
    >
      <ErrorBoundary name="ColumnMailBoxContainer">{children}</ErrorBoundary>
    </SideContentLayout>
  );
};

export default ColumnMailBoxContainer;
