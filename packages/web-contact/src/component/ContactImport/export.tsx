import React, { useState, useEffect, useCallback } from 'react';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
import { contactApi, fileApi } from '../../_mock_';
import styles from './modal.module.scss';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { Radio, RadioChangeEvent } from 'antd';

import { ContactCommonRes, LoaderResult, PersonalExportParams } from 'api';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import contactTracker from '../../tracker';
import { getIn18Text } from 'api';

interface ContactImportProps {
  // 是否隐藏
  hidden?: boolean;
  // 点击关闭
  onClose?(): void;
  // 请求导出接口中
  onExporting?(): void;
  // 导出接口中、返回结果
  onExported?(): void;
  // 下载文件成功
  onDownloaded?(res: ContactCommonRes<string>): void;
  // 是否需要中止导出接口
  exportAbort?: boolean;
}
interface selectOption {
  label: string;
  value: string;
}

const defaultPersonalOrgList = [
  {
    label: getIn18Text('SUOYOULIANXIREN'),
    value: 'all',
  },
];

const extData = [
  {
    label: 'CSV',
    value: 'csv',
  },
  {
    label: 'vCard',
    value: 'vCard',
  },
];

export const ExportContent = (props: ContactImportProps) => {
  const { hidden, onClose, onExporting, onDownloaded, onExported, exportAbort } = props;
  // 选中的组
  const [selectedPersonalOrg, setSelectedPersonalOrg] = useState<string>('all');

  // 组的所有列表
  const [personalOrgList, setPersonalOrgList] = useState<selectOption[]>(defaultPersonalOrgList);

  // 重复导入选项
  const [exportExt, setExportExt] = useState<string>('csv');

  // 初次进入获取联系人分组列表
  useEffect(() => {
    contactApi.doGetPersonalOrg({}).then(({ success, message, data }) => {
      if (success && data) {
        setPersonalOrgList([...defaultPersonalOrgList, ...data.map(item => ({ label: item.orgName, value: item.id }))]);
      } else {
        console.error('[contact_import] doGetPersonalOrg error', message);
      }
    });
  }, []);

  // 处理导出返回的结果
  const handleExportRes = useCreateCallbackForEvent(async res => {
    if (exportAbort) {
      return;
    }
    if (res.success && res.data) {
      const ext = exportExt === 'csv' ? 'csv' : 'vcf';
      const fileName = getIn18Text('exportFileName') + `.${ext}`;
      const data = (await fileApi.saveDownload({ fileUrl: res.data + `&download=${fileName}`, fileName })) as LoaderResult;
      if (data.succ) {
        onDownloaded &&
          onDownloaded({
            success: true,
            data: data.path,
          });
      } else {
        onDownloaded &&
          onDownloaded({
            success: false,
            message: data.errMsg,
          });
      }
    } else {
      onDownloaded &&
        onDownloaded({
          success: false,
          message: res.message,
          code: res.code,
        });
    }
  });

  // 点击确认
  const onSubmit = useCallback(async () => {
    const fileType = exportExt === 'csv' ? 1 : 2;
    onExporting && onExporting();
    const params: PersonalExportParams = {
      fileType,
    };
    if (selectedPersonalOrg !== 'all') {
      params.groupId = selectedPersonalOrg;
    }
    contactTracker.tracker_contact_export_click();
    const res = await contactApi.doExportPersonalContact(params);
    onExported && onExported();
    handleExportRes(res);
  }, [exportExt, selectedPersonalOrg, exportAbort]);

  return (
    <div className={styles.importWrap} hidden={hidden}>
      <div className={styles.titleWrap}>
        <div className={styles.title}>{getIn18Text('exportContact')}</div>
      </div>
      <div className={styles.contentWrap}>
        <div className={styles.row}>
          <div className={styles.label}>{getIn18Text('importTogroup')}</div>
          <div className={styles.value}>
            <EnhanceSelect className={styles.selectWrap} value={selectedPersonalOrg} onSelect={value => setSelectedPersonalOrg(value)} options={personalOrgList} />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.label}>{getIn18Text('exportFileExt')}</div>
          <div className={`ant-allow-dark ${styles.value}`}>
            <Radio.Group
              onChange={(e: RadioChangeEvent) => {
                setExportExt(e.target.value);
              }}
              value={exportExt}
            >
              {extData.map(item => {
                return (
                  <Radio value={item.value} key={item.value}>
                    {item.label}
                  </Radio>
                );
              })}
            </Radio.Group>
          </div>
        </div>
      </div>
      <div className={styles.footerWrap}>
        <Button className={styles.cancel} btnType="default" onClick={() => onClose && onClose()}>
          {getIn18Text('QUXIAO')}
        </Button>
        <Button btnType="primary" onClick={onSubmit}>
          {getIn18Text('QUEDING')}
        </Button>
      </div>
    </div>
  );
};
