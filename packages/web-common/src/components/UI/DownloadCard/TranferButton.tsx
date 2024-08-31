import React, { useState } from 'react';
import { Modal } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder as api, apis, NetStorageApi, SystemApi } from 'api';
import IconCard from '../IconCard';
import { getIn18Text } from 'api';
interface ITransferButton {
  downloadInfo: any;
  onChange?: any;
  cancelSave?: boolean; // 是否不可以提交，默认可以提交
}
const codeContMap = {
  10304: getIn18Text('GERENKONGJIANRONG'),
  10206: getIn18Text('BAOCUNSHIBAI\uFF0C'),
};
const TransferButton: React.FC<ITransferButton> = props => {
  const { children = getIn18Text('BAOCUNDAOGEREN1'), downloadInfo, onChange, cancelSave = false } = props;
  const [lockVisible, setLockModalVisible] = useState(false);
  const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
  const systemApi = api.api.getSystemApi() as SystemApi;
  // console.log('downloadInfodownloadInfo', downloadInfo);
  const handleError = (code, type?: string) => {
    if (code === 10403) {
      // setLockModalVisible(true);
      // onChange && onChange(true);
      message.error({
        icon: <IconCard type="info" stroke="white" style={{ width: 15, height: 15, marginRight: 8 }} />,
        content: getIn18Text('FUWUWEIKAITONG'),
        duration: 2,
      });
      return;
    }
    if (code) {
      message.error({
        icon: <IconCard type="info" stroke="white" style={{ width: 15, height: 15, marginRight: 8 }} />,
        content: codeContMap[code] || getIn18Text('CAOZUOSHIBAI\uFF0C'),
        duration: 2,
      });
    } else {
      // 兜底报错文案 云附件统一使用：文件不存在、已过期或已被删除
      const defContent = type === 'cloud' ? 'WENJIANBUCUNZAIYIGUOQI' : 'CAOZUOSHIBAI\uFF0C';
      message.error({
        icon: <IconCard type="info" stroke="white" style={{ width: 15, height: 15, marginRight: 8 }} />,
        content: getIn18Text(defContent),
        duration: 2,
      });
    }
  };
  // 云附件保存至个人空间
  const storePriSpaceAction = async identity => {
    const params = { identity };
    try {
      await diskApi.saveCloudAttachment(params);
      message.success({
        icon: <IconCard type="saved" stroke="white" style={{ width: 15, height: 15, marginRight: 8 }} />,
        content: getIn18Text('YIBAOCUN\uFF0CKE'),
        duration: 2,
      });
    } catch (e) {
      const { code } = e.data;
      handleError(code, 'cloud');
    }
  };

  const extractIdentity = (identityUrl: string) => {
    try {
      const urlObject = new URL(identityUrl);
      return urlObject.searchParams.get('identity');
    } catch (error) {
      return '';
    }
  };

  const actionSave = async () => {
    if (cancelSave) {
      return;
    }
    try {
      const isLocked = await diskApi.isLockEnabledUsingGET();
      // console.log('actionSaveactionSave', isLocked);
      if (isLocked) {
        setLockModalVisible(true);
        onChange && onChange(isLocked);
        return;
      }
      // 云附件
      if (downloadInfo?.cloudAttachment) {
        const identityUrl = downloadInfo?.fileUrl || downloadInfo?.fileOriginUrl;
        const identity = extractIdentity(identityUrl);
        storePriSpaceAction(identity);
        return;
      }
      await diskApi.saveMailAttachment({
        fileName: encodeURI(downloadInfo?.fileName),
        fileSize: downloadInfo?.fileSize,
        mid: downloadInfo?.downloadContentId || downloadInfo?.contentId,
        part: downloadInfo?.id,
        host: window?.location?.host,
      });
      message.success({
        icon: <IconCard type="saved" stroke="white" style={{ width: 15, height: 15, marginRight: 8 }} />,
        content: getIn18Text('HOUTAIBAOCUNZHONG'),
        duration: 4,
      });
    } catch (error: any) {
      let code: any;
      error && 'data' in error && ({ code } = error.data);
      handleError(code);
    }
  };
  return (
    <>
      <div onClick={actionSave}>{children}</div>
      <Modal
        visible={lockVisible}
        okText={getIn18Text('QIANWANGJIESUO')}
        cancelText={getIn18Text('ZHIDAOLE')}
        onCancel={() => setLockModalVisible(false)}
        closable={false}
        onOk={() => systemApi.openNewWindow('https://qiye.163.com', false)}
      >
        <h2>{getIn18Text('GERENKONGJIANYI')}</h2>
        <div>{getIn18Text('KEQIANWANGWANGYI')}</div>
      </Modal>
    </>
  );
};
export default TransferButton;
