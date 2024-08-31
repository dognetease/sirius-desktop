import IconCard, { IconMapKey } from '@web-common/components/UI/IconCard';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder, DataTransApi, AccountApi, AccountAttachmentParam, apis, FileApi, LoaderResult, FsSaveRes, MailFileAttachModel } from 'api';
import account from 'api/src/api/data/tables/account';
import React from 'react';
import styles from './eventcontent.module.scss';
import { getIn18Text } from 'api';

// 中英文

const systemApi = apiHolder.api.getSystemApi();
const httpApi = apiHolder.api.getDataTransApi() as DataTransApi;
const fileApi = apiHolder.api.getFileApi() as FileApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const inElectron = systemApi.isElectron();
interface Props {
  attachmentList: AccountAttachmentParam[];
}

const EventAttachment: React.FC<Props> = props => {
  const { attachmentList } = props;

  // 点击下载
  const actionDownload = async (file: AccountAttachmentParam) => {
    if (!file || !file.name) {
      return;
    }
    const url = systemApi.getUrl('scheduleDownloadFile');
    const param = {
      uid: systemApi.getCurrentUser()?.id,
    } as any;
    param.accountAttachmentId = file.accountAttachmentId;
    param.accountAttachmentAccountId = file.accountAttachmentAccountId || file.belonger?.accountId;
    const fileUrl = httpApi.buildUrl(url, param);
    const downloadInfo = {
      fileName: file?.name,
      fileType: file?.type,
      type: file?.type,
      fileUrl,
      id: file.attachmentId || file.accountAttachmentId,
    } as MailFileAttachModel;
    const saveConf = {
      noStoreData: false,
      recordPerf: false,
      choosePath: true,
    };
    let res;
    // 客户端
    if (inElectron) {
      // downloadFile({ repeatDownload: true }, true).catch();
      // accountApi.setCurrentAccount({ email: '' });
      res = (await fileApi.saveDownload(downloadInfo, saveConf)) as LoaderResult | FsSaveRes;
      if (!(res as LoaderResult)?.succ && !(res as FsSaveRes)?.success) {
        // 没有 path 说明直接在选择保存路径时点击了取消，就不用提示了
        if (res.path) {
          const errMsg = (res as LoaderResult)?.errMsg === 'download-net-error: cancelled' ? getIn18Text('YIQUXIAO') : getIn18Text('WENJIANBUCUNZAI');
          SiriusMessage.warn({ content: errMsg }).then();
        }
        return;
      }
    } else {
      // web端
      window.open(fileUrl);
    }
  };

  // 渲染单个附件
  const renderAttachmentItem = (f: AccountAttachmentParam) => {
    let type = 'other' as IconMapKey;
    if (f.name?.includes('.')) {
      type = (f.name?.substring(f.name?.lastIndexOf('.') + 1) as IconMapKey) || 'other';
    }
    return (
      <div
        onClick={e => {
          e.stopPropagation();
          actionDownload(f);
        }}
        className={styles.attachmentItem}
        key={f.attachmentId || f.accountAttachmentId}
      >
        <div className={styles.attachmentLogo}>
          <IconCard style={{ width: '20px', height: '20px' }} type={type} />
        </div>
        <span className={styles.attachmentName} title={f.name || getIn18Text('WEIMINGMING')}>
          {f.name || getIn18Text('WEIMINGMING')}
        </span>
      </div>
    );
  };

  return <>{attachmentList.map(attach => renderAttachmentItem(attach))}</>;
};

export default EventAttachment;
