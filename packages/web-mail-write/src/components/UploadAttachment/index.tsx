/*
 * @Author: your name
 * @Date: 2021-11-17 15:13:56
 * @LastEditTime: 2021-12-23 11:23:48
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@/components/Layout/Write/components/UploadAttachment/index.ts
 */
import React, { useRef, useImperativeHandle, useEffect } from 'react';
import { SystemApi, apiHolder as api, apis, DataTrackerApi } from 'api';
import './index.scss';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import HOCUploadAttachmentWithFiles from './HOCUploadAttachmentWithFiles';
import { doAddCloudAttachment, doAddNormalAttachment } from '@web-common/state/reducer/diskAttReducer';
import { getIn18Text } from 'api';
const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
interface extendFile extends File {
  filePath?: string;
}
interface Props {
  // clickUploadAttach: uploadAttachmentType;
  // setClickAttachment: React.Dispatch<React.SetStateAction<uploadAttachmentType>>;
  uploadAttachmentWithFiles: (fileList: File[], usingCloud: boolean) => void;
}
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const UploadAttachment: React.ForwardRefExoticComponent<Props & React.RefAttributes<unknown>> = React.forwardRef((props: Props, ref) => {
  const { uploadAttachmentWithFiles } = props;
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail.cid);
  const extraOperate = useAppSelector(state => state.mailReducer.currentMail.extraOperate);
  const applyGenerateHide = useAppSelector(state => state.mailReducer.applyGenerateHide);
  const uploadRef = useRef(null);
  const dispatch = useAppDispatch();

  // const clickUpload = () => {
  //     // (uploadRef.current as any).click();
  //     trackApi.track('pcMail_click_addAttachment_writeMailPage');
  // };

  const validateSize = (fileList: File[], cloud = false) => {
    uploadAttachmentWithFiles(fileList, cloud);
  };
  useImperativeHandle(ref, () => ({
    upload: validateSize,
  }));
  useEffect(() => {
    if (extraOperate === 'questionApply') {
      applyGenerateHide && applyGenerateHide();
      if (inElectron) {
        window.electronLib?.fsManage
          ?.logsToArrayBuf()
          .then(res => {
            const { success, data, name, path } = res;
            if (success && data && data.byteLength > 0) {
              const logs = new File([data], name || '');
              (logs as extendFile).filePath = path;
              validateSize([logs]);
            }
          })
          .catch(err => {
            console.log(getIn18Text('DABAOSHANGCHUANSHI'), err);
          });
      }
    }
    if (extraOperate?.includes('addCloudAtt') && currentMailId) {
      const payloadStr = extraOperate.split('payload:')[1];
      const payloadItem = JSON.parse(payloadStr);
      if (typeof payloadItem === 'object') {
        setTimeout(() => {
          dispatch(doAddCloudAttachment({ fileDetail: payloadItem, mailId: currentMailId }));
        }, 1500);
      }
    }
    if (extraOperate?.includes('addNormalAtt') && currentMailId) {
      const payloadStr = extraOperate.split('payload:')[1];
      const payloadItem = JSON.parse(payloadStr);

      // 数组类型，批量操作
      if (Array.isArray(payloadItem)) {
        setTimeout(() => {
          dispatch(doAddNormalAttachment({ fileDetail: payloadItem, mailId: currentMailId }));
        }, 1500);
        return;
      }
      // 对象类型，单个操作
      if (typeof payloadItem === 'object') {
        setTimeout(() => {
          dispatch(doAddNormalAttachment({ fileDetail: payloadItem, mailId: currentMailId }));
        }, 1500);
      }
    }
  }, [currentMailId]);
  return <></>;
});
export default HOCUploadAttachmentWithFiles(UploadAttachment);
