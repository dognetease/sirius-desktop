import React from 'react';
import style from './preview.module.scss';
import { getIn18Text } from 'api';
import SiriusModal from '@web-common/components/UI/SiriusModal';

export interface IPreviewContentProps {
  content: string[] | string;
  onCancel: () => any;
}
export const PreviewContent = (props: IPreviewContentProps) => {
  const { content, onCancel } = props;
  let resContent: string[] = [];
  if (typeof content === 'string') {
    resContent = [content, content];
  } else {
    resContent = content;
  }
  const hasContent = resContent && resContent.length > 0 && (resContent[0] || resContent[1]);
  if (!hasContent) {
    return null;
  }
  if (!resContent[1]) {
    resContent[1] = resContent[0];
  }
  return (
    <SiriusModal
      title={getIn18Text('YULAN')}
      visible={!!hasContent}
      footer={null}
      onCancel={onCancel}
      centered
      wrapClassName={style.modalWrap}
      bodyStyle={{ paddingTop: '0px' }}
      width={898}
    >
      <div className={style.previewContainer}>
        <div className={style.scroller}>
          <div className={style.previewWrap}>
            <div className={style.previewPc}>
              <iframe
                title={getIn18Text('YULAN')}
                sandbox="allow-scripts allow-same-origin allow-downloads"
                data-alloy-tabstop="true"
                tabIndex={-1}
                srcDoc={resContent[0]}
              />
            </div>
            <div className={style.previewMobile}>
              <iframe
                title={getIn18Text('YULAN')}
                sandbox="allow-scripts allow-same-origin allow-downloads"
                data-alloy-tabstop="true"
                tabIndex={-1}
                srcDoc={resContent[1]}
              />
            </div>
          </div>
        </div>
      </div>
    </SiriusModal>
  );
};
