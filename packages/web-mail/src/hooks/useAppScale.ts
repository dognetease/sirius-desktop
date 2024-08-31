import { useEffect, useState, useMemo, useRef } from 'react';
import { apiHolder as api } from 'api';
import { getValidStoreWidth } from '@web-common/utils/utils';
import useWindowSize from '@web-common/hooks/windowResize';
import useState2RM from './useState2ReduxMock';
import { useAppSelector } from '@web-common/state/createStore';

const storeApi = api.api.getDataStoreApi();
const STORE_MAIL_FOLDER_WIDTH = 'STORE_MAIL_FOLDER_WIDTH';
const STORE_MAIL_LIST_WIDTH = 'STORE_MAIL_LIST_WIDTH';

// 邮件列表的默认宽度
export const DEFAULT_LIST_WIDTH = 310;
// 邮件列表的最小宽度
export const DEFAULT_LIST_MIN_WIDTH = 260;
// 邮件文件夹列表默认宽度
export const DEFAULT_FOLDER_WIDTH = 220;
// 邮件文件夹列表最小宽度
export const DEFAULT_FOLDER_MIN_WIDTH = 200;
// 客户详情侧边栏宽度
export const DEFAULT_CUSTOMER_WIDTH = 340;
// 读信页最小宽度
export const DEFAULT_READ_MAIL_MIN_WIDTH = 432;

export const folderWidthStorePut = (width: string) => {
  storeApi.putSync(STORE_MAIL_FOLDER_WIDTH, width, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' });
};

export const mailListWidthStorePut = (width: string) => {
  storeApi.putSync(STORE_MAIL_LIST_WIDTH, width, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' });
};

const useAppScale = () => {
  // 手动拖拽宽度过程中 true: 正在拖拽  false: 拖拽结束
  const mailListResizeProcessing = useAppSelector(state => state.mailReducer.mailListResizeProcessing);
  // 外贸通，邮件详情，客户详情侧边栏
  const currentTabType = useAppSelector(state => state.mailTabReducer.showMailSidebar);
  // 分栏通栏
  const [configMailLayout] = useState2RM('configMailLayout', 'doUpdateConfigMailLayout');
  const isLeftRight = useMemo(() => configMailLayout === '1', [configMailLayout]);
  // 文件夹栏宽度
  const [folderListWidth, setFolderListWidth] = useState<number>(220);
  // 邮件列表栏宽度
  const [mailListWidth, setMailListWidth] = useState<number>(310);
  // 应用宽度
  const [appWidth, setAppWidth] = useState<number>(0);
  // 记录文件夹栏用户手动拖动宽度
  const [folderListSettingWidth, setFolderListSettingWidth] = useState<number>(220);
  // 记录邮件列表栏用户手动拖动宽度
  const [mailListSettingWidth, setMailListSettingWidth] = useState<number>(310);
  // 邮件列表可以拖到的最大宽度
  const [mailListMaxConstraints, setMailListMaxConstraints] = useState<number>(500);
  // 邮件文件夹可以拖到的最大宽度
  const [folderListMaxConstraints, setfolderListMaxConstraints] = useState<number>(500);
  // 缩放前应用宽度
  const prevAppWidth = useRef(appWidth);
  // 监听窗口缩放
  const offset = useWindowSize(false);

  // 监听用户 React-Resizable 手动拖拽
  useEffect(() => {
    if (mailListResizeProcessing) {
      return;
    }
    // 拖拽结束
    setRecordWidth();
  }, [mailListResizeProcessing, isLeftRight]);

  // 监听客户侧边栏打开
  useEffect(() => {
    if (currentTabType) {
      return;
    }
    // 侧边栏关闭
    setRecordWidth();
  }, [isLeftRight, currentTabType]);

  // 监听三栏宽度以及是否打开客户详情侧边栏，设置可以拖拽的最大宽度
  useEffect(() => {
    if (appWidth <= 0 || !appWidth) {
      return;
    }
    // 控制最大宽度
    const readMailMinWidth = currentTabType ? DEFAULT_CUSTOMER_WIDTH + DEFAULT_READ_MAIL_MIN_WIDTH : DEFAULT_READ_MAIL_MIN_WIDTH;
    // readMailMinWidth + 5 增加5像素的冗余
    const maxWidth = appWidth - (readMailMinWidth + 5) - folderListWidth - mailListWidth - 68;
    if (maxWidth > 0) {
      setMailListMaxConstraints(mailListWidth + maxWidth > 500 ? 500 : mailListWidth + maxWidth);
      setfolderListMaxConstraints(folderListWidth + maxWidth > 500 ? 500 : folderListWidth + maxWidth);
    } else {
      const maxFolder = folderListWidth > DEFAULT_FOLDER_MIN_WIDTH ? DEFAULT_FOLDER_MIN_WIDTH - folderListWidth : 0;
      const maxMail = mailListWidth > DEFAULT_LIST_MIN_WIDTH ? DEFAULT_LIST_MIN_WIDTH - mailListWidth : 0;
      const { folderWidth, mailWidth } = lessenColumnWidthss(maxWidth, maxFolder, maxMail);
      setMailListMaxConstraints(mailWidth);
      setfolderListMaxConstraints(folderWidth);
    }
  }, [currentTabType, appWidth, folderListWidth, mailListWidth]);

  // 邮件夹列表，邮件列表的宽度设置为记录值
  const setRecordWidth = () => {
    const storeFolderWidth = getValidStoreWidth(storeApi.getSync(STORE_MAIL_FOLDER_WIDTH, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' }));
    if (storeFolderWidth > 0) {
      setFolderListSettingWidth(storeFolderWidth);
      setFolderListWidth(storeFolderWidth);
    } else {
      setFolderListSettingWidth(DEFAULT_FOLDER_WIDTH);
      setFolderListWidth(DEFAULT_FOLDER_WIDTH);
    }
    const storeListWidth = getValidStoreWidth(storeApi.getSync(STORE_MAIL_LIST_WIDTH, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' }));
    if (storeListWidth > 0 && isLeftRight) {
      setMailListSettingWidth(storeListWidth);
      setMailListWidth(storeListWidth);
    } else {
      setMailListSettingWidth(storeListWidth);
      setMailListWidth(DEFAULT_LIST_WIDTH);
    }
  };

  /**
   * 放大
   * 计算三栏下，文件夹列表，邮件列表的宽度
   * @param changeWidth 总体增加，缩小的宽度
   * @param maxFolder 文件夹列表可以变化的宽度
   * @param maxMail 邮件列表可以变化的宽度
   */
  const magnifyColumnWidth = (changeWidth: number, maxFolder: number, maxMail: number) => {
    let folderChangeWidth = 0;
    let mailChangeWidth = 0;
    if (Math.abs(maxFolder) - Math.abs(changeWidth) > 0) {
      folderChangeWidth = changeWidth;
      mailChangeWidth = 0;
    } else {
      folderChangeWidth = maxFolder;
      mailChangeWidth = Math.abs(maxMail + maxFolder) - Math.abs(changeWidth) > 0 ? changeWidth - maxFolder : maxMail;
    }
    const folderWidth = folderListWidth + folderChangeWidth;
    const mailWidth = mailListWidth + mailChangeWidth;
    setFolderListWidth(folderWidth);
    setMailListWidth(mailWidth);
    return {
      folderWidth,
      mailWidth,
    };
  };

  /**
   * 缩小
   * 计算三栏下，文件夹列表，邮件列表的宽度
   * @param changeWidth 总体增加，缩小的宽度
   * @param maxFolder 文件夹列表可以变化的宽度
   * @param maxMail 邮件列表可以变化的宽度
   */
  const lessenColumnWidthss = (changeWidth: number, maxFolder: number, maxMail: number) => {
    let folderChangeWidth = 0;
    let mailChangeWidth = 0;
    const readMailMinWidth = currentTabType ? DEFAULT_CUSTOMER_WIDTH + DEFAULT_READ_MAIL_MIN_WIDTH : DEFAULT_READ_MAIL_MIN_WIDTH;
    // readMailMinWidth + 5 增加5像素的冗余
    const maxWidth = appWidth - (readMailMinWidth + 5) - folderListWidth - mailListWidth - 68;
    if (maxWidth > 0) {
      return {
        folderWidth: folderListWidth,
        mailWidth: mailListWidth,
      };
    }
    if (Math.abs(maxMail) - Math.abs(changeWidth) > 0) {
      folderChangeWidth = 0;
      mailChangeWidth = changeWidth;
    } else {
      mailChangeWidth = maxMail;
      folderChangeWidth = Math.abs(maxMail + maxFolder) - Math.abs(changeWidth) > 0 ? changeWidth - maxMail : maxFolder;
    }
    const folderWidth = folderListWidth + folderChangeWidth;
    const mailWidth = mailListWidth + mailChangeWidth;
    setFolderListWidth(folderWidth);
    setMailListWidth(mailWidth);
    return {
      folderWidth,
      mailWidth,
    };
  };

  // 监听窗口缩放，调整三栏宽度
  useEffect(() => {
    if (offset?.width) {
      const changeWidth = offset?.width - prevAppWidth.current;
      let maxFolder;
      let maxMail;
      if (changeWidth > 0) {
        // 放大
        maxFolder = folderListWidth < folderListSettingWidth ? folderListSettingWidth - folderListWidth : 0;
        maxMail = mailListWidth < mailListSettingWidth ? mailListSettingWidth - mailListWidth : 0;
        magnifyColumnWidth(changeWidth, maxFolder, maxMail);
      } else {
        // 缩小
        maxFolder = folderListWidth > DEFAULT_FOLDER_MIN_WIDTH ? DEFAULT_FOLDER_MIN_WIDTH - folderListWidth : 0;
        maxMail = mailListWidth > DEFAULT_LIST_MIN_WIDTH ? DEFAULT_LIST_MIN_WIDTH - mailListWidth : 0;
        lessenColumnWidthss(changeWidth, maxFolder, maxMail);
      }
      setAppWidth(offset.width);
      prevAppWidth.current = offset.width;
    }
  }, [offset?.width]);

  return {
    folderListWidth,
    mailListWidth,
    mailListMaxConstraints,
    folderListMaxConstraints,
    appWidth,
  };
};

export default useAppScale;
