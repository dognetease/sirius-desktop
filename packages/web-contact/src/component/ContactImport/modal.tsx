import React, { useState, useCallback } from 'react';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import { ImportContent } from './import';
import { ExportContent } from './export';
import { AddPersonalOrg } from './addPersonalOrg';
import { ImportStatus } from './importStatus';
import { getContactErrorTxt } from '../../util';
import { ContactCommonRes } from 'api';
import { getIn18Text } from 'api';

interface Props {
  onClose?(success?: boolean): void;
  type?: 'import' | 'export';
}

export const ContactImportModal = (props: Props) => {
  const { onClose, type = 'import' } = props;
  // 是否展示导入内容
  const [visibleContent, setVisibleContent] = useState<boolean>(true);
  // 是否展示添加分组内容
  const [visibleAddPersonalOrg, setVisibleAddPersonalOrg] = useState<boolean>(false);
  // 是否展示导入导出状态内容
  const [visibleContentStatus, setVisibleContentStatus] = useState<boolean>(false);
  // 导入导出状态
  const [importStatusType, setImportStatusType] = useState<'success' | 'error' | 'progress'>('progress');
  // 导入导出提示消息
  const [importStatusMsg, setImportStatusMsg] = useState<string>();

  const [selectedPersonalOrg, setSelectedPersonalOrg] = useState<string>();
  // 是否需要中止导出下载
  const [exportAbort, setExportAbort] = useState<boolean>(false);

  const handleRespMessage = useCallback((params: ContactCommonRes<number | string>) => {
    const { code, message, success, data } = params;
    let msg = '';
    if (success) {
      msg = data !== undefined ? getIn18Text('GONG') + getIn18Text('XINZENG') + data + getIn18Text('GELIANXIREN') : '';
    } else {
      msg = getContactErrorTxt(code) || message;
    }
    setImportStatusMsg(msg);
  }, []);
  return (
    <SiriusHtmlModal isGlobal visible closable={false} width={visibleContentStatus ? 400 : 480}>
      {type === 'import' ? (
        <>
          <ImportContent
            hidden={!visibleContent}
            onClose={onClose}
            selectedPersonalOrg={selectedPersonalOrg}
            onUploading={() => {
              setVisibleContent(false);
              setVisibleContentStatus(true);
              setImportStatusType('progress');
            }}
            onUploaded={res => {
              setVisibleContent(false);
              setVisibleContentStatus(true);
              handleRespMessage(res);
              setImportStatusType(res.success ? 'success' : 'error');
            }}
            onAddPersonalOrg={() => {
              setVisibleContent(false);
              setVisibleAddPersonalOrg(true);
            }}
          />
          <AddPersonalOrg
            hidden={!visibleAddPersonalOrg}
            onClose={() => {
              setVisibleContent(true);
              setVisibleAddPersonalOrg(false);
            }}
            onOk={data => {
              setVisibleContent(true);
              setVisibleAddPersonalOrg(false);
              setSelectedPersonalOrg(data.id);
            }}
          />
        </>
      ) : (
        <ExportContent
          hidden={!visibleContent}
          onClose={onClose}
          exportAbort={exportAbort}
          onExporting={() => {
            setVisibleContent(false);
            setVisibleContentStatus(true);
            setImportStatusType('progress');
          }}
          onDownloaded={res => {
            setExportAbort(false);
            setVisibleContent(false);
            setVisibleContentStatus(true);
            setImportStatusType(res.success ? 'success' : 'error');
            handleRespMessage(res);
          }}
        />
      )}
      <ImportStatus
        onClose={success => {
          if (type === 'export') {
            setExportAbort(true);
          }
          onClose && onClose(success);
        }}
        hidden={!visibleContentStatus}
        type={type}
        status={importStatusType}
        message={importStatusMsg}
      />
    </SiriusHtmlModal>
  );
};
