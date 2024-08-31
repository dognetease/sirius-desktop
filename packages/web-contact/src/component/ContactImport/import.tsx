import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import { contactApi, fileApi } from '../../_mock_';
import styles from './modal.module.scss';
// import Divider from '@web-common/components/UI/Divider';
import Divider from '@lingxi-common-component/sirius-ui/Divider';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';

import IconCard from '@web-common/components/UI/IconCard';
import { ContactCommonRes, PersonalImportParams } from 'api';

import contactTracker from '../../tracker';
import { getIn18Text } from 'api';

interface ContactImportProps {
  // 是否隐藏
  hidden?: boolean;
  // 点击关闭
  onClose?(): void;
  // 当上传中
  onUploading?(): void;
  // 当上传完成
  onUploaded?(result: ContactCommonRes<number>): void;
  // 当点击新增分组
  onAddPersonalOrg(): void;
  // 选中的
  selectedPersonalOrg?: string;
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

export const ImportContent = (props: ContactImportProps) => {
  const { hidden, onClose, onUploading, onUploaded, onAddPersonalOrg, selectedPersonalOrg: _selectedPersonalOrg } = props;
  // 上传的文件名称
  const [fileName, setFileName] = useState<string>('');

  // 上传文件过大错误
  const [showError, setShowError] = useState<boolean>(false);

  // 选中的组
  const [selectedPersonalOrg, setSelectedPersonalOrg] = useState<string>('all');

  // 组的所有列表
  const [personalOrgList, setPersonalOrgList] = useState<selectOption[]>(defaultPersonalOrgList);

  // 重复导入选项
  const [repeatType, setRepeatType] = useState<0 | 1 | 2>(0);

  // 上传文件输入框节点
  const uploadFileRef = useRef<HTMLInputElement>(null);

  const [visibleSelectPersonalOrg, setVisibleSelectPersonalOrg] = useState<boolean>(false);

  // 上传容器
  const importRef = useRef<HTMLDivElement>(null);

  // 首次进入获取分组列表
  useEffect(() => {
    contactApi.doGetPersonalOrg({}).then(({ success, message, data }) => {
      if (success && data) {
        setPersonalOrgList([...defaultPersonalOrgList, ...data.map(item => ({ label: item.orgName, value: item.id }))]);
      } else {
        console.error('[contact_import] doGetPersonalOrg error', message);
      }
    });
    _selectedPersonalOrg && setSelectedPersonalOrg(_selectedPersonalOrg);
  }, [_selectedPersonalOrg]);

  // 当文件发生改变
  const onFileChange = useCallback(() => {
    const files = uploadFileRef.current?.files;
    if (!files?.length) {
      return;
    }
    const uploadFile = files[0];
    setFileName(uploadFile.name);
    if (uploadFile && uploadFile?.size > 3 * 1024 * 1024) {
      setShowError(true);
    } else {
      setShowError(false);
    }
  }, []);

  // 点击确认
  const onSubmit = useCallback(async () => {
    const files = uploadFileRef.current?.files;
    if (!files?.length) {
      message.error(getIn18Text('importFilePlaceholder'));
      return;
    }
    const file = files[0];
    const fileSize = file.size;
    const fileType = file?.name.endsWith('.csv') ? 1 : 2;
    onUploading && onUploading();
    const params: PersonalImportParams = {
      file,
      fileSize,
      fileType,
      type: repeatType,
    };
    if (selectedPersonalOrg !== 'all') {
      params.groupId = selectedPersonalOrg;
    }
    contactTracker.tracker_contact_import_save_click();
    const [res] = await Promise.all([
      contactApi.doImportPersonalContact(params),
      new Promise(res => {
        setTimeout(() => {
          res(true);
        }, 1500);
      }),
    ]);
    onUploaded && onUploaded(res);
  }, [selectedPersonalOrg, repeatType]);

  //点击下载模板
  const handleDownloadTemp = useCallback(async () => {
    try {
      const res = await contactApi.doExportPersonalContactTemplate();
      if (res.success && res.data) {
        const fileName = getIn18Text('importContactTemp') + `.csv`;
        fileApi.saveDownload({ fileUrl: res.data + `&download=${fileName}`, fileName, fileType: 'csv' });
      } else {
        message.error(res.message);
      }
    } catch (e) {
      message.error((e as Error).message);
    }
  }, []);

  const container = () => importRef?.current || document.body;

  const repeatData = useMemo(
    () => [
      {
        label: getIn18Text('noImport'),
        value: 0,
      },
      {
        label: getIn18Text('overwrite'),
        value: 1,
      },
      {
        label: getIn18Text('duplicateImport'),
        value: 2,
        suffix: (
          <Tooltip title={getIn18Text('importReplyTip')} trigger={['hover']} zIndex={100}>
            <IconCard type="tongyong_cuowutishi_xian" style={{ marginLeft: 4 }}></IconCard>
          </Tooltip>
        ),
      },
    ],
    []
  );

  return (
    <div className={styles.importWrap} hidden={hidden} ref={importRef}>
      <div className={styles.titleWrap}>
        <div className={styles.titleLine}>
          <div className={styles.title}>{getIn18Text('importContacts')}</div>
          <IconCard onClick={() => onClose && onClose()} className={styles.close} width={20} height={20} type="tongyong_guanbi_xian" />
        </div>
        <div className={styles.subTitle}>{getIn18Text('importTitleTip')}</div>
      </div>
      <div className={styles.contentWrap}>
        <div className={styles.row}>
          <div className={styles.label}>{getIn18Text('importSelectInputPlaceholder')}</div>
          <div
            className={`ant-allow-dark ${styles.value}`}
            onClick={() => {
              uploadFileRef.current?.click();
            }}
          >
            <Input
              className={classnames(styles.uploadInput, showError && styles.errorInput)}
              type="text"
              placeholder={getIn18Text('selectFile')}
              readOnly
              suffix={fileName ? getIn18Text('ZHONGXINXUANZE') : ''}
              value={fileName}
            />
            <input type="file" hidden accept=".csv,.vcf" ref={uploadFileRef} onChange={onFileChange} />
          </div>
        </div>
        {showError && (
          <div className={classnames(styles.row, styles.fileError)}>
            <div className={styles.label}></div>
            <div className={classnames(styles.value, styles.fileErrorWrap)}>
              <span>{getIn18Text('importFileLargeError')}</span>
            </div>
          </div>
        )}
        <div className={classnames(styles.row, styles.downloadRow)}>
          <div className={styles.label}></div>
          <div className={classnames(styles.value, styles.downloadWrap)}>
            <span>{getIn18Text('supportsExtTip')}</span>
            <span className={styles.downloadTxt} onClick={handleDownloadTemp}>
              {getIn18Text('downloadTemplate')}
            </span>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.label}>{getIn18Text('importTogroup')}</div>
          <div className={styles.value}>
            <EnhanceSelect
              className={styles.selectWrap}
              value={selectedPersonalOrg}
              open={visibleSelectPersonalOrg}
              onDropdownVisibleChange={visible => {
                setVisibleSelectPersonalOrg(visible);
              }}
              onSelect={value => setSelectedPersonalOrg(value)}
              dropdownRender={menu => (
                <>
                  {menu}
                  <div className={styles.selectRenderWrap}>
                    <div className={styles.dividerWrap}>
                      <Divider margin={4} />
                    </div>
                    <div
                      className={styles.addItemWrap}
                      onClick={() => {
                        setVisibleSelectPersonalOrg(false);
                        onAddPersonalOrg && onAddPersonalOrg();
                      }}
                    >
                      <span>{getIn18Text('XINJIANGERENFEN')}</span>
                      <IconCard className={styles.addIcon} width={16} height={16} type="add" />
                    </div>
                  </div>
                </>
              )}
              options={personalOrgList}
            />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.label}>{getIn18Text('importDuplicateLabel')}</div>
          <div className={styles.value}>
            <EnhanceSelect
              getPopupContainer={container}
              optionLabelProp="label"
              className={styles.selectWrap}
              value={repeatType}
              onSelect={value => setRepeatType(value)}
            >
              {repeatData.map(item => {
                return (
                  <InSingleOption value={item.value} key={item.value} label={item.label}>
                    <div className={styles.selectOptionWrap}>
                      {item.label}
                      {item.suffix}
                    </div>
                  </InSingleOption>
                );
              })}
            </EnhanceSelect>
          </div>
        </div>
      </div>
      <div className={styles.footerWrap}>
        <Button btnType="minorLine" className={styles.cancel} onClick={() => onClose && onClose()}>
          {getIn18Text('QUXIAO')}
        </Button>
        <Button className={styles.sureBtn} btnType="primary" onClick={onSubmit} disabled={!fileName}>
          {getIn18Text('QUEDING')}
        </Button>
      </div>
    </div>
  );
};
