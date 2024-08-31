import React, { useEffect, useState } from 'react';
import { apiHolder, DataStoreApi } from 'api';
import { ModalProps } from 'antd/lib/modal/Modal';
import { Modal, Spin } from 'antd';
import ModalImg from './modalImg';
import './format.scss';
import BackSVG from '@web-common/components/UI/Icons/svgs/Back';
import { getIn18Text } from 'api';
interface Props {
  visible: boolean;
  groupId?: string;
  mfId?: string;
  onCancel?: () => void;
  onCompleted?: (any) => void;
  onBack?: () => void;
}
let GdEditorSdk;
// 稿定编辑器的sdk不支持SSR，防止报错
if (typeof window !== 'undefined') {
  // import('@gaoding/editor-sdk').then((module) => {
  //     GdEditorSdk = module.GdEditorSdk;
  // });
}
const MailFormatEdit: React.FC<Props> = props => {
  const { onCancel, visible, onCompleted, groupId, mfId, onBack } = props;
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (GdEditorSdk) {
      setLoading(true);
      const gdEditorSDK = new GdEditorSdk({
        container: '.iframe-wrap',
        appId: 'wang_yi_ling_xi_ban_gong_poster_editor',
        autoClose: true,
        buttonText: getIn18Text('WANCHENG'),
        onCompleted(file) {
          const { files } = file;
          onCancel && onCancel();
          onCompleted && onCompleted(files);
        },
        onTempletLoaded(editor) {
          setLoading(false);
        },
        onClose() {},
      });
      const ext: any = groupId
        ? {
            thirdCateId: groupId || '',
            id: mfId || '',
          }
        : {
            mode: 'create',
          };
      gdEditorSDK.open({
        ext,
      });
      return () => {
        gdEditorSDK?.close();
      };
    }
  }, []);
  return (
    <Modal
      className="mailformat-modal"
      width="80%"
      title={
        <div className="mailformat-modal-title-wrap">
          <span onClick={onBack} className="mailformat-icon-back">
            <BackSVG />
          </span>
          <span>{getIn18Text('BIANJIYOUJIANMO')}</span>
        </div>
      }
      footer={null}
      maskClosable={false}
      keyboard={false}
      centered
      visible={visible}
      onCancel={onCancel}
    >
      <Spin spinning={loading}>
        <div
          className="iframe-wrap"
          style={{
            width: '100%',
            height: '80vh',
            minHeight: '500px',
            maxHeight: '900px',
          }}
        />
      </Spin>
    </Modal>
  );
};
export default MailFormatEdit;
