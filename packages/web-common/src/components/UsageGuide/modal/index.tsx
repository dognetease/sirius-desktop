import React, { useCallback } from 'react';
import { apiHolder, IGlobalGuide, apis, DataTrackerApi } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { navigate } from '@reach/router';
import { TongyongGuanbiXian } from '@sirius/icons';
import { ReactComponent as VideoIcon } from '@web-common/images/icons/video.svg';
import VideoBox from '@web-common/components/UI/VideoBox';
import { isMatchUnitableCrmHash } from '@web-unitable-crm/api/helper';
import style from './style.module.scss';

interface Props {
  modalData: IGlobalGuide.Modal;
  onClose?: (tipType: IGlobalGuide.TipType, trigger?: 'manual' | 'auto') => void;
}

const systemApi = apiHolder.api.getSystemApi();
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
export const GuideModal = (props: Props) => {
  const { modalData, onClose } = props;

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose(modalData.tipType, modalData.trigget);
    }
  }, [modalData, onClose]);

  const handleOperation = useCallback(
    (button: IGlobalGuide.Button) => {
      handleClose();
      trackApi.track('waimao_best_user_guide', { opera_type: 'click_button', popup_type: modalData?.tipType });
      let url;
      if (systemApi.isElectron()) {
        url = button.btnDesktopUrl;
      } else {
        url = button.btnWebUrl;
      }

      if (isMatchUnitableCrmHash(url)) {
        // unitable
        window.location.href = `/${url}`;
        return;
      }

      url && navigate(url);
    },
    [handleClose]
  );

  const getHeader = useCallback(() => {
    if (modalData?.video && modalData?.video?.videoRenderType === IGlobalGuide.VideoType.COVER) {
      // 视频头部
      return (
        <div className={style.header}>
          <VideoBox
            onCardClick={handleClose}
            videoId={modalData.video.videoId}
            source={modalData.video.source}
            scene={modalData.video.scene}
            className={style.headerVideo}
            postUrl={modalData?.video?.coverUrl}
          />
        </div>
      );
    }

    if (modalData?.image?.imageUrl) {
      // 背景图
      return (
        <div className={style.header}>
          <img className={style.imgCover} src={modalData?.image?.imageUrl} alt="" />
        </div>
      );
    }

    return <></>;
  }, [modalData]);

  const getContent = useCallback(() => {
    return (
      <div className={style.content}>
        <div className={style.title}>{modalData?.title || ''}</div>
        {modalData?.content || ''}
        {modalData?.video && modalData?.video?.videoRenderType === IGlobalGuide.VideoType.SIMPLE && (
          <VideoBox
            videoId={modalData?.video?.videoId}
            source={modalData.video.source}
            scene={modalData.video.scene}
            postUrl={modalData?.video?.coverUrl}
            onCardClick={handleClose}
          >
            <div className={style.videoLink}>
              <VideoIcon />
              <span className={style.text}>{modalData?.video?.title}</span>
            </div>
          </VideoBox>
        )}
      </div>
    );
  }, [modalData]);

  const getOperate = useCallback(() => {
    if (!modalData?.btn?.length) {
      return <></>;
    }

    return (
      <div className={style.operate}>
        {modalData.btn.map(button => {
          if (button.btnWebUrl === 'OPEN_VIDEO' && modalData?.video?.videoId) {
            return (
              <VideoBox
                videoId={modalData?.video?.videoId}
                source={modalData.video.source}
                scene={modalData.video.scene}
                postUrl={modalData?.video?.coverUrl}
                onCardClick={handleClose}
              >
                <Button
                  className={style.button}
                  btnType={button.type || 'primary'}
                  onClick={() => {
                    trackApi.track('waimao_best_user_guide', { opera_type: 'click_button', popup_type: modalData?.tipType });
                  }}
                >
                  {button.title}
                </Button>
              </VideoBox>
            );
          }

          return (
            <Button className={style.button} btnType={button.type || 'primary'} onClick={() => handleOperation(button)}>
              {button.title}
            </Button>
          );
        })}
      </div>
    );
  }, [modalData]);

  if (!modalData) {
    return <></>;
  }

  return (
    <div className={style.wrapper}>
      <div
        className={style.close}
        onClick={() => {
          handleClose();
          trackApi.track('waimao_best_user_guide', { opera_type: 'close', popup_type: modalData?.tipType });
        }}
      >
        {/* <CloseIcon /> */}
        <TongyongGuanbiXian style={{ fontSize: 20, color: '#fff' }} />
      </div>
      {getHeader()}
      {getContent()}
      {getOperate()}
    </div>
  );
};
