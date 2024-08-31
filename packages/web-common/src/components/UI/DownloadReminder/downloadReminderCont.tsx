import React from 'react';
import { Tooltip } from 'antd';
import IconCard, { IconMapKey } from '@web-common/components/UI/IconCard/index';
import style from './downloadReminderCont.module.scss';
import { formatFileSize } from '@web-common/utils/file';
import { getSuffix } from '@web-common/components/util/file';
import { apiHolder as api, FileApi, DownloadReminderInfo, getIn18Text, MailFileAttachModel, SystemApi } from 'api';

const fileApi = api.api.getFileApi() as FileApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
const isMac = inElectron ? window.electronLib.env.isMac : api.env.isMac;

interface DownloadcReminderProp {
  reminders: DownloadReminderInfo[];
  clearAll: () => void;
  mouseEnterAction: () => void;
  mouseLeaveAction: () => void;
}

const downloadReminderCont: React.FC<DownloadcReminderProp> = props => {
  const { reminders, clearAll, mouseEnterAction, mouseLeaveAction } = props;

  const close = () => clearAll();

  // 打开文件
  // 点击 文件直接打开 文件夹则解压
  const opeFile = async (e: React.MouseEvent, item: DownloadReminderInfo) => {
    e.stopPropagation();
    item.filePath && fileApi.openFileFromDownload(item.filePath);
  };

  // 打开所在文件夹
  // 点击打开文件所在文件夹
  const openDir = (e: React.MouseEvent, item: DownloadReminderInfo) => {
    e.stopPropagation();
    item.filePath && fileApi.openDirFromDownload(item.filePath);
  };

  const mouseEnter = () => {
    console.log('mouseEnterAction');
    mouseEnterAction();
  };

  const mouseLeave = () => {
    console.log('mouseLeaveAction');
    mouseLeaveAction();
  };

  const getSize = (fileSize: number) => {
    if (!fileSize) return getIn18Text('WEIZHIDAXIAO');
    return fileSize > 0 ? formatFileSize(fileSize, 1024) : getIn18Text('WEIZHIDAXIAO');
  };

  return (
    <div id="downloadReminder" className={style.downloadReminder + ' sirius-scroll'} onMouseEnter={mouseEnter} onMouseLeave={mouseLeave}>
      {/* window的边框 */}
      {!isMac && (
        <>
          <span className={style.bor1} />
          <span className={style.bor2} />
          <span className={style.bor3} />
          <span className={style.bor4} />
        </>
      )}
      <div className={style.downloadReminderHead}>
        <span className={style.headTitle}>文件下载完成</span>
        <IconCard className={style.close + ' sirius-no-drag'} type="close" onClick={close} />
      </div>
      <div className={style.fileReminders + ' sirius-no-drag'}>
        {reminders.map((item: DownloadReminderInfo) => {
          const { fileName, realFileName } = item;
          const name = realFileName || fileName || getIn18Text('WEIZHI');
          const frontName = name.slice(0, -8);
          const endName = name.slice(-8);
          const fileType = getSuffix(item as MailFileAttachModel);
          return (
            <div className={style.fileReminder} onClick={e => opeFile(e, item)}>
              <div className={style.infoIcon}>
                <IconCard type={(fileType || 'other') as IconMapKey} />
              </div>
              <div className={style.fileInfo}>
                <p className={style.fileName} title={name}>
                  <span className={style.frontName}>{frontName}</span>
                  <span className={style.endName}>{endName}</span>
                </p>
                <p className={style.fileSize}>{getSize(item?.fileSize)}</p>
              </div>
              <div className={style.opts}>
                <Tooltip title="打开本地目录" placement="top">
                  <div className={style.openDir} onClick={e => openDir(e, item)}>
                    <IconCard type="iconFolder" />
                  </div>
                </Tooltip>
                <Tooltip title="打开本地文件" placement="topRight">
                  <div className={style.openFile} onClick={e => opeFile(e, item)}>
                    <IconCard type="file" />
                  </div>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default downloadReminderCont;
