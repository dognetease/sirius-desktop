import { getIn18Text } from 'api';
import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop, convertToPixelCrop } from 'react-image-crop';
import { Tooltip } from 'antd';
import { ReactComponent as CropWarningIcon } from '@web-sns-marketing/images/crop-warning.svg';
import { ReactComponent as TipIcon } from '@web-sns-marketing/images/tip.svg';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './ImageCropper.module.scss';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  visible: boolean;
  file: File | null;
  onFinish: (file: File) => void;
  onCancel: () => void;
}

const ASPECTS = [
  { name: '16:9', value: 16 / 9 },
  { name: '1:1', value: 1 },
  { name: '4:3', value: 4 / 3 },
  { name: '1.91:1', value: 1.91 },
  { name: '9:16', value: 9 / 16 },
];

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 100,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const ImageCropper: React.FC<ImageCropperProps> = props => {
  const { visible, file, onFinish, onCancel } = props;
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [aspect, setAspect] = useState<number | undefined>(ASPECTS[0].value);

  useEffect(() => {
    if (visible) {
      if (file) {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = event => {
          if (event.target && event.target.result) {
            const blob = new Blob([event.target.result], { type: file.type });
            const blobURL = window.URL.createObjectURL(blob);

            setImgSrc(blobURL);
            setCrop(undefined);
            setAspect(ASPECTS[0].value);
          }
        };
      }
    } else {
      setImgSrc('');
      setCrop(undefined);
      setAspect(ASPECTS[0].value);
    }
  }, [visible, file]);

  const handleAspectChange = (nextAspect: number) => {
    setAspect(nextAspect);

    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const nextCrop = centerAspectCrop(width, height, nextAspect);

      setCrop(nextCrop);
    }
  };

  const handleCrop = () => {
    if (imgRef.current && crop) {
      const { width, height } = imgRef.current;
      const pixelCrop: PixelCrop = convertToPixelCrop(crop, width, height);
      const canvas = document.createElement('canvas');
      const image = imgRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const pixelRatio = window.devicePixelRatio;

        canvas.width = Math.floor(pixelCrop.width * scaleX * pixelRatio);
        canvas.height = Math.floor(pixelCrop.height * scaleY * pixelRatio);

        ctx.scale(pixelRatio, pixelRatio);
        ctx.imageSmoothingQuality = 'high';

        const cropX = pixelCrop.x * scaleX;
        const cropY = pixelCrop.y * scaleY;

        const centerX = image.naturalWidth / 2;
        const centerY = image.naturalHeight / 2;

        ctx.save();
        ctx.translate(-cropX, -cropY);
        ctx.translate(centerX, centerY);
        ctx.translate(-centerX, -centerY);
        ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, image.naturalWidth, image.naturalHeight);

        ctx.restore();

        const { name, type } = props.file!;

        canvas.toBlob(
          blob => {
            if (blob) {
              const file = new File([blob], name, { type });

              onFinish(file);
            }
          },
          type,
          0.8
        );
      }
    }
  };

  return (
    <Modal
      className={style.imageCropper}
      visible={visible}
      title={getIn18Text('SHANGCHUANTUPIANYULAN')}
      width={700}
      keyboard={false}
      maskClosable={false}
      okButtonProps={{ disabled: !crop || !crop.width || !crop.height }}
      onCancel={onCancel}
      onOk={handleCrop}
    >
      <div className={style.tip}>
        <CropWarningIcon className={style.icon} />
        <div className={style.text}>{getIn18Text('WEIBAOZHENGTUPIANZAIGE')}</div>
      </div>
      <div className={style.content}>
        <div className={style.preview}>
          <div className={style.cropWrapper}>
            {!!imgSrc && (
              <ReactCrop className={style.cropper} crop={crop} aspect={aspect} onChange={(_, percentCrop) => setCrop(percentCrop)}>
                <img className={style.img} ref={imgRef} src={imgSrc} onLoad={() => handleAspectChange(ASPECTS[0].value)} />
              </ReactCrop>
            )}
          </div>
        </div>
        <div className={style.config}>
          <div className={style.title}>
            <div className={style.text}>{getIn18Text('TUPIANCAIQIEBILI')}</div>
            <Tooltip overlayClassName={style.cropTooltip} title={getIn18Text('YIANZHAO Fac')}>
              <TipIcon className={style.icon} />
            </Tooltip>
          </div>
          <div className={style.aspects}>
            {ASPECTS.map(item => {
              const active = item.value === aspect;

              return (
                <div
                  className={classnames(style.item, {
                    [style.active]: active,
                  })}
                  key={item.value}
                  onClick={() => {
                    if (!active) {
                      handleAspectChange(item.value);
                    }
                  }}
                >
                  <div className={style.block} style={{ width: 60, height: 60 / item.value }} />
                  <div className={style.name}>{item.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ImageCropper;
