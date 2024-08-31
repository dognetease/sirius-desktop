import React, { useEffect, useRef, useState, useContext } from 'react';
import classnames from 'classnames/bind';
import { apiHolder, IMMessage, File, SystemApi } from 'api';
import { Image } from 'antd';
import style from './chatItemImage.module.scss';
import { MessageFlagSending } from '../../common/icon/messageFlag';
import { ReactComponent as ImgErrorFallback } from '@/images/icons/im/imgFallback.svg';
import './chatItemImageForWindows.module.scss';
import { Context as MaxsizeContext, useMaxsize } from '../store/maxsizeProvider';
import ImagePreview from '@web-common/components/UI/ImagePreview';
import { useRequestImgList } from '../../common/hooks/useRequestImglist';
import { isGifOrBlobOrIco, getThumbnailBenchmark, getThumbnailImg } from '../../common/imgVideoHandle';
import { withImageContext } from '@web-common/components/UI/ContextMenu/ImgContextMenu';
import { ERROR_FALLBACK } from '../../utils/im_team_util';

// @ts-ignore
const realStyle = classnames.bind(style);

const ContextImage = withImageContext(Image);

interface CustomMsg {
  customFile?: File;
}

type ComputeArrItemApi = (w: number, h: number) => Record<'w' | 'h', number>;

export const generateComputeImg = (
  widthLimit = {
    max: 1000,
    min: 120,
  },
  heightlimit = {
    max: 300,
    min: 120,
  }
) => {
  const { max: widthMax, min: widthMin } = widthLimit;
  const { max: heightMax, min: heightMin } = heightlimit;
  if (widthMax < widthMin) {
    widthLimit.max = widthMin || 120;
  }
  if (heightMax < heightMin) {
    heightlimit.max = heightMin || 120;
  }
  const computeArr: Record<string, ComputeArrItemApi> = {
    /**
     * 两种情况
     * 12*100 => Math.max(14.4,120)*120
     * 100*12 =>
     */
    '[lt*lt]': function (w: number, h: number) {
      const wScale = widthLimit.min / w;
      const hScale = heightlimit.min / h;
      if (wScale > hScale) {
        return {
          w: Math.max(w * hScale, widthLimit.min),
          h: heightlimit.min,
        };
      }
      return {
        w: widthLimit.min,
        h: Math.max(h * wScale, heightlimit.min),
      };
    },
    /**
     * 两种情况:
     * 100*120=> 120*144
     * 100*300=> 120*300
     */
    '[lt*normal]': function (w, h) {
      const wScale = widthLimit.min / w;
      // 按照宽度进行放大 height取放大值和最大值之间的min
      return {
        w: widthLimit.min,
        h: Math.min(h * wScale, heightlimit.max),
      };
    },
    '[lt*gt]': function (w, h) {
      return {
        w: widthLimit.min,
        h: heightlimit.max,
      };
    },
    /**
     * 两种情况:
     * 200*100=> 240*120
     * 900*100=> Math.min(1080,1000)*120
     */
    '[normal*lt]': function (w, h) {
      const hScale = heightlimit.min / h;
      return {
        w: Math.min(w / hScale, widthLimit.max),
        h: heightlimit.min,
      };
    },
    '[normal*normal]': function (w, h) {
      return { w, h };
    },
    /**
     * 先尝试缩放高度。可能会出现
     * [lt*normal] 150*600=>75*300
     * [normal*normal] 400*600=>200*300
     */
    '[normal*gt]': function (w, h) {
      const hScale = h / heightlimit.max;
      return {
        w: w / hScale,
        h: heightlimit.max,
      };
    },

    '[gt*lt]': function (w, h) {
      const hScale = heightlimit.min / h;
      return {
        w: widthLimit.max,
        h: widthLimit.min,
      };
    },
    /**
     * 3600*300
     * 先尝试缩放宽度。如果高度被缩放过小会满足[normal*lt]规则
     */
    /**
     * 先尝试缩放宽度,可能会出现两种情况:
     * [nomral*lt] 2000*150=>1000*75
     * [normal*normal] 2000*400=>1000*200
     */
    '[gt*normal]': function (w, h) {
      const wScale = w / widthLimit.max;
      return {
        w: widthLimit.max,
        h: h / wScale,
      };
    },
    /**
     * 设置结束之后可能会出现3中情况
     * [normal*normal]
     * [lt*normal]
     * [normal*lt]
     */
    '[gt*gt]': function (w, h) {
      const wScale = w / widthLimit.max;
      const hScale = h / heightlimit.max;

      /**
       * 谁的缩放比例大缩放谁(4000*400)
       * 400*400=>normal*lt
       */
      if (wScale > hScale) {
        return {
          w: widthLimit.max,
          h: h / wScale,
        };
      }
      return {
        w: w / hScale,
        h: heightlimit.max,
      };
    },
  };

  const getType = (
    w: number,
    limit: {
      max: number;
      min: number;
    }
  ): 'gt' | 'lt' | 'normal' => {
    if (w > limit.max) {
      return 'gt';
    }
    if (w < limit.min) {
      return 'lt';
    }
    return 'normal';
  };

  const computer: ComputeArrItemApi = (w: number, h: number) => {
    let flag = false;

    while (!flag) {
      const wType = getType(w, widthLimit);
      const hType = getType(h, heightlimit);
      flag = `[${wType}*${hType}]` === '[normal*normal]';

      if (!flag) {
        const result = computeArr[`[${wType}*${hType}]`](w, h);
        w = result.w;
        h = result.h;
      }
    }
    return {
      w,
      h,
    };
  };

  return computer;
};

interface ImgPlaceholderApi {
  width: number;
  height: number;
  status?: 'ing' | 'failed';
}

export const ImgPlaceholder: React.FC<ImgPlaceholderApi> = props => {
  const { width, height, status = 'ing' } = props;
  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      className={realStyle('chatImgPlaceholder')}
    >
      {status === 'ing' && <MessageFlagSending />}
      {status === 'failed' && <ImgErrorFallback />}
    </div>
  );
};

// 上传中的图片
interface ChatTypeUploadingImgApi {
  msg: IMMessage;
  imgInfo: File;
}
// 图片上传
export const ChatTypeUploadingImg: React.FC<ChatTypeUploadingImgApi> = props => {
  const { msg, imgInfo } = props;
  // 上传progress todo
  return <ChatTypeImage imgInfo={imgInfo} />;
};

// 图片消息
interface ImageApi {
  imgInfo: File;
  backupSrc?: null | string;
  previewParams?: {
    sessionId: string;
    limit?: number;
    end: number;
    start: number;
  };
  testId?: string;
}
export const ChatTypeImage: React.FC<ImageApi> = props => {
  const { imgInfo, backupSrc = undefined, previewParams = {}, testId = '' } = props;
  const [imgUrl, setImgUrl] = useState<string>('');

  const generateNewImgUrl = async () => {
    if (isGifOrBlobOrIco(imgInfo)) {
      return setImgUrl(imgInfo?.url || '');
    }

    const baseMark = getThumbnailBenchmark(imgInfo?.size, imgInfo?.h, imgInfo?.w, 300);

    const newImgUrl = await getThumbnailImg(imgInfo?.url || '', {
      height: Math.min(300, baseMark || 0),
      width: Math.min(300, baseMark || 0),
    });

    // 如果是本地上传的图片先用本地图片展示
    if (backupSrc && backupSrc.length) {
      // @ts-ignore
      setImgUrl(backupSrc);
      await new Promise(resolve => {
        const tempImg = new window.Image();
        tempImg.src = newImgUrl;
        setImgLoadStatus('SUCCESS');
        tempImg.onload = resolve;
      });
      window.requestAnimationFrame(() => {
        URL.revokeObjectURL(backupSrc);
      });
    }
    setImgUrl(newImgUrl);
  };

  useEffect(() => {
    generateNewImgUrl();
    return () => {
      if (backupSrc && backupSrc.length) {
        URL.revokeObjectURL(backupSrc);
      }
    };
  }, []);

  // 图片加载状态
  const [imgLoadStatus, setImgLoadStatus] = useState<'INIT' | 'SUCCESS' | 'FAILED'>('INIT');
  const onLoad = async e => {
    setImgLoadStatus('SUCCESS');
  };

  const [retryCount, setRetryCount] = useState(0);
  const onError = async () => {
    // 如果已经重试过一次 就算了
    if (retryCount === 1) {
      return;
    }
    setRetryCount(1);
    // setImgLoadStatus('FAILED');
    // 如果图片已经经过缩略处理了 给一个三倍的衰减
    if (imgUrl.indexOf('thumbnail') !== -1) {
      const reg = /thumbnail=(?<width>\d+)[xyz](?<height>\d+)/;
      const { width, height } = imgUrl.match(reg)!.groups as Record<'width' | 'height', string>;
      const newImgUrl = await getThumbnailImg(imgInfo?.url || '', {
        width: Math.ceil(Number(width) / 3),
        height: Math.ceil(Number(height) / 3),
      });
      setImgUrl(newImgUrl);
    } else if (isGifOrBlobOrIco(imgInfo)) {
      setImgUrl(imgInfo?.url || '');
    } else {
      const newImgUrl = await getThumbnailImg(imgInfo?.url || '', {
        width: Math.ceil(imgInfo.w / 5),
        height: Math.ceil(imgInfo.h / 5),
      });
      setImgUrl(newImgUrl);
    }
    // 使用一个更加激进的缩略尺寸
  };
  const [imgSize, setImgSize] = useState<number[]>([0, 0]);
  const imgRef = useRef<HTMLDivElement>(null);
  // const { width: maxSizeWidth } = useContext(MaxsizeContext);
  const [maxSizeWidth] = useMaxsize(imgRef.current as Element);
  // 根据图片大小
  useEffect(() => {
    const computeFunc = generateComputeImg({ min: 120, max: Math.min(maxSizeWidth, 1000) }, { min: 120, max: 300 });

    const size = computeFunc(imgInfo?.w || 0, imgInfo?.h || 0);
    setImgSize([size.w, size.h]);
  }, [maxSizeWidth]);

  const imgPreviewMask = () => (
    <div className={realStyle('chatImgMask')}>
      <div className="ant-image-mask-info">{/* <EyeOutlined /> */}</div>
    </div>
  );

  const [previewVisible] = useState(false);

  const previewList = useRequestImgList();

  const requestImgList = async () => {
    const index = previewList.findIndex(item => item.url === imgInfo.url);

    if (index === -1) {
      const baseMark = isGifOrBlobOrIco(imgInfo) ? 0 : getThumbnailBenchmark(imgInfo?.size, imgInfo?.h, imgInfo?.w, 600);
      const newImgUrl = await getThumbnailImg(imgInfo?.url || '', {
        height: baseMark,
        width: baseMark,
      });
      ImagePreview.preview({
        data: [
          {
            previewUrl: baseMark ? newImgUrl : imgInfo?.url,
            downloadUrl: imgInfo?.url,
            type: 'image',
            name: imgInfo?.name,
            size: imgInfo?.size,
            ext: imgInfo?.ext,
            presetSize: [
              {
                url: imgInfo?.url,
                width: imgInfo?.w,
                height: imgInfo?.h,
              },
            ],
          },
        ],
        startIndex: 0,
      });
      return;
    }

    ImagePreview.preview({
      data: await Promise.all(
        previewList.map(async item => {
          const baseMark = item?.type === 'image' && !isGifOrBlobOrIco(item) ? getThumbnailBenchmark(item?.fileSize, item?.fileHeight, item?.fileWidth, 600) : 0;
          const newImgUrl = await getThumbnailImg(item?.url || '', {
            height: baseMark,
            width: baseMark,
          });
          return {
            previewUrl: baseMark ? newImgUrl : item?.url,
            downloadUrl: item?.url,
            type: item?.type,
            name: item?.fileName,
            size: item?.fileSize,
            ext: item?.ext,
            presetSize: [
              {
                url: item?.url,
                width: item?.fileWidth,
                height: item?.fileHeight,
              },
            ],
          };
        })
      ),
      startIndex: index,
    });
  };

  return (
    <div
      style={{
        height: `${imgSize[1]}px`,
        width: `${imgSize[0]}px`,
      }}
      ref={imgRef}
      data-test-id="im_session_content_single_msg_image"
      className={realStyle('msgImgWrapper', imgLoadStatus.toLowerCase())}
    >
      <ContextImage
        height={imgSize[1]}
        width={imgLoadStatus !== 'SUCCESS' ? imgSize[0] : 'auto'}
        src={imgUrl}
        ext={imgInfo?.ext}
        alt={imgInfo?.name}
        originSrc={imgInfo?.url}
        placeholder={<ImgPlaceholder width={imgSize[0]} height={imgSize[1]} status="ing" />}
        preview={{
          maskClassName: realStyle('chatImgPreviewWrapper'),
          src: imgInfo?.url || '',
          mask: imgPreviewMask(),
          visible: previewVisible,
          onVisibleChange() {
            if (imgInfo.url.indexOf('blob') !== -1) {
              return;
            }

            requestImgList();
          },
        }}
        fallback={ERROR_FALLBACK}
        className={realStyle(imgLoadStatus)}
        onError={onError}
        onLoad={onLoad}
      />
    </div>
  );
};
