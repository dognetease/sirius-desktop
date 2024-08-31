import React, { ReactNode, useRef, useEffect, useState } from 'react';
import { message } from 'antd';
import { MailEntryModel, apiHolder, apis, NetStorageApi, NSDirContent } from 'api';
import { currentMailSize as getCurrentMailSize } from '@web-common/state/getter';
import './index.scss';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { AttachmentActions, MailActions } from '@web-common/state/reducer';
import { preUploadAttachment } from '../../util';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';

const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;

const HOCUploadAttachmentWithFiles: React.FC = (Component: ReactNode) =>
  React.forwardRef((props, ref) => {
    const currentMail = useAppSelector(state => state.mailReducer.currentMail);
    const currentMailId = useAppSelector(state => state.mailReducer.currentMail.cid);
    const attachments = useAppSelector(state => state.attachmentReducer.attachments);
    const currentMailSize = getCurrentMailSize(currentMail as MailEntryModel, attachments);
    const refCurrentMail = useRef(currentMail);
    const { doAddAttachment } = useActions(AttachmentActions);
    const { doModifySubject } = useActions(MailActions);
    const currentMailIdRef = useRef(currentMailId);
    const currentMailSizeRef = useRef(currentMailSize);
    // 当前空间信息
    const [cloudAttInfo, setCloudAttInfo] = useState<NSDirContent>();
    // 获取当前版本信息
    const {
      productVersionInfo: { productVersionId },
    } = useGetProductAuth();
    useEffect(() => {
      currentMailIdRef.current = currentMailId;
    }, [currentMailId]);

    useEffect(() => {
      refCurrentMail.current = currentMail;
    }, [currentMail]);

    useEffect(() => {
      // 获取当前空间信息
      diskApi.doGetNSFolderInfo({ type: 'cloudAtt' }).then(res => {
        setCloudAttInfo(res);
      });
    }, []);

    useEffect(() => {
      currentMailSizeRef.current = currentMailSize;
    }, [currentMailSize]);

    // 上传附件时 若主题为空 修改主题为附件名称
    const modifyTitle = (fileName: string) => {
      if (!refCurrentMail.current.entry?.title) {
        const name = fileName.split('.');
        name.length > 1 && name.pop();
        doModifySubject(name.join('.'));
      }
    };

    // 上传附件
    const uploadAttachmentAction = useCreateCallbackForEvent((fileList: File[], usingCloud: boolean) => {
      if (!currentMailIdRef.current) return;
      // 预处理附件（大小 格式校验）
      let preTrtAtts = preUploadAttachment({
        fileList,
        currentMailId: currentMailIdRef.current,
        currentMailSize: currentMailSizeRef.current,
        _account: currentMail?.initSenderStr || '',
        cloudAttInfo: cloudAttInfo,
        flag: { usingCloud },
      });
      // 存在有问题的文件
      if (!preTrtAtts || preTrtAtts.length !== fileList.length) {
        message.error('附件上传失败，请检查附件是否符合要求');
        return;
      }
      // 过滤空文件
      preTrtAtts = preTrtAtts.filter(file => file?.fileSize !== 0);
      // 全都是空的
      if (!preTrtAtts.length) {
        message.error('附件大小异常');
        return;
      }
      // 修改标题为第一个附件的名称
      modifyTitle(preTrtAtts[0]?.fileName);
      doAddAttachment(preTrtAtts);
      // 滚动到附件可视区域
      setTimeout(() => document?.getElementById('attachmentArea')?.scrollIntoView());
    });

    return <Component uploadAttachmentWithFiles={uploadAttachmentAction} {...props} ref={ref} />;
  });

export default HOCUploadAttachmentWithFiles;
