import React, { useEffect, useState, useRef } from 'react';
import { apiHolder as api, SystemApi, util, FileAttachModel } from 'api';
import { Spin, Tooltip } from 'antd';
import classname from 'classnames';
import throttle from 'lodash/throttle';
import lodashGet from 'lodash/get';
import { THUMBNAIL_SIZE } from '@web-im/common/const';
import { ERROR_FALLBACK } from '@web-im/utils/const';
import PreviousIcon from '@web-common/components/UI/Icons/svgs/PreviousSvg';
import NextIcon from '@web-common/components/UI/Icons/svgs/NextSvg';
import ShrinkIcon from '@web-common/components/UI/Icons/svgs/Shrink';
import AmplificationIcon from '@web-common/components/UI/Icons/svgs/Amplification';
import DoDownloadIcon from '@web-common/components/UI/Icons/svgs/DoDownloadSvg';
import RotateLeft from '@web-common/components/UI/Icons/svgs/RotateLeft';
import OriginalIcon from '@web-common/components/UI/Icons/svgs/Original';

import style from './imgPreview.module.scss';
import useScale from '@web-common/hooks/useScale';
import { DataType, ImgPreviewContentProps } from './type';
import { randomString } from '@web-common/components/util/randomString';
import { convertRotateImg } from './convertRotateImg';
import ImgContextMenu from '../ContextMenu/ImgContextMenu';
import { getImageFormatFromUrl } from '@web-mail/components/ReadMail/util';
import { downloadFile } from '@web-common/components/util/file';
import { getIn18Text } from 'api';
const systemApi = api.api.getSystemApi() as SystemApi;
const eventApi = api.api.getEventApi();
const inElectron = systemApi.isElectron();
const fileApi = api.api.getFileApi();
const VIDEO_MENU = ['previous', 'next', '', 'download'];
const VIDEO_MUNU_HIDE = ['shrink', 'amplification', 'rotateLeft', 'original'];
const IMG_MENU = ['previous', 'next', '', 'download', 'shrink', 'amplification', '', 'rotateLeft', 'original'];
const ERROR_HIDE = ['download', 'shrink', 'amplification', 'rotateLeft', 'original'];
const PreviewContent: React.FC<ImgPreviewContentProps> = ({ data, startIndex, onCurUrlChange }) => {
  const [index, setIndex] = useState(-1);
  const [curUrl, setCurUrl] = useState('');
  const [operateDisabled, setOperateDisabled] = useState<string[]>([]);
  const [imgWidth, setImgWidth] = useState('auto');
  const [imgHeight, setImgHeight] = useState('auto');
  const [maxHeight, setMaxHeight] = useState('100%');
  const [maxWidth, setMaxWidth] = useState('100%');
  const [imgMarginTop, setImgMarginTop] = useState(0);
  const [imgMarginLeft, setImgMarginLeft] = useState(0);
  const [imgWrapStyle, setImgWrapStyle] = useState({ width: 0, height: 0 });
  const [spinning, setSpinning] = useState(true);
  const [loadOriginal, setLoadOriginal] = useState(false);
  const imgRef = useRef<any>(null);
  const videoRef = useRef<any>(null);
  const imgWrapRef = useRef<any>(null);
  const [rotate, setRotate] = useState(0); // eslint-disable-line
  const { deltaY } = useScale();
  useEffect(() => {
    if (typeof startIndex === 'number') {
      setIndex(startIndex);
    }
  }, [startIndex]);
  useEffect(() => {
    onCurUrlChange && onCurUrlChange(curUrl);
    return () => {};
  }, [curUrl]);
  const amplificationAction = (unit: number = 0) => {
    if (!imgRef?.current) {
      return;
    }
    const preWidth = imgRef.current.width;
    const autUnit = unit || preWidth * 0.1;
    const halfUnit = autUnit / 2;
    const preHeight = imgRef.current.height;
    const imgCurWidth = preWidth + autUnit;
    const imgCurHeight = preHeight * (imgCurWidth / preWidth);
    const gapHeightHalf = (imgCurHeight - preHeight) / 2;
    setImgWidth(`${imgCurWidth}px`);
    setMaxWidth(`${imgCurWidth}px`);
    setMaxHeight(`${imgCurHeight}px`);
    setImgHeight(`${imgCurHeight}px`);
    setImgMarginTop(pre => {
      const res = pre - gapHeightHalf;
      if (res < 0) {
        return 0;
      }
      return res;
    });
    setImgMarginLeft(pre => {
      const res = pre - halfUnit;
      if (res < 0) return 0;
      return res;
    });
    const { width, height } = imgWrapStyle;
    const widthGap = imgCurWidth - width;
    const heightGap = imgCurHeight - height;
    if (widthGap > 0) {
      imgWrapRef.current.scrollLeft += halfUnit;
    }
    if (heightGap > 0) {
      imgWrapRef.current.scrollTop += gapHeightHalf;
    }
  };
  const shrinkAction = (unit: number = 0) => {
    if (!imgRef?.current) {
      return;
    }
    const preWidth = imgRef.current.width;
    const autUnit = unit || preWidth * 0.1;
    const halfUnit = autUnit / 2;
    const preHeight = imgRef.current.height;
    const imgCurWidth = preWidth - autUnit;
    const imgCurHeight = preHeight * (imgCurWidth / preWidth);
    const { width, height } = imgWrapStyle;
    const widthGap = imgCurWidth - width;
    const heightGap = imgCurHeight - height;
    const gapHeightHalf = (preHeight - imgCurHeight) / 2;
    if (imgCurWidth < width / 20) return;
    setImgWidth(`${imgCurWidth}px`);
    setMaxWidth(`${imgCurWidth}px`);
    if (widthGap > 0) {
      imgWrapRef.current.scrollLeft -= halfUnit;
    } else {
      imgWrapRef.current.scrollLeft = 0;
      setImgMarginLeft(pre => {
        const res = pre + halfUnit;
        return res;
      });
    }
    setImgHeight(`${imgCurHeight}px`);
    setMaxHeight(`${imgCurHeight}px`);
    if (heightGap > 0) {
      imgWrapRef.current.scrollTop -= gapHeightHalf;
    } else {
      imgWrapRef.current.scrollTop = 0;
      setImgMarginTop(pre => {
        const res = pre + gapHeightHalf;
        return res;
      });
    }
  };
  useEffect(() => {
    if (deltaY < 0) {
      amplificationAction(20);
    }
    if (deltaY > 0) {
      shrinkAction(20);
    }
  }, [deltaY]);
  // spinning过程中显示操作项并置灰，spinning完成恢复原状态
  useEffect(() => {
    let preOperateDisabled: string[] = [];
    if (loadOriginal) {
      preOperateDisabled = operateDisabled;
      setOperateDisabled(IMG_MENU);
    }
    return () => {
      if (preOperateDisabled.length > 0) {
        setOperateDisabled(preOperateDisabled);
      }
    };
  }, [loadOriginal]);
  const onLoadSource = () => {
    let currentDom = videoRef.current || imgRef.current;
    if (!currentDom) {
      return;
    }
    // 窗口resize会导致state数据清空，包括index、curUrl等，这里根据url重新获取
    let curIndex = data.findIndex(item => item.previewUrl === currentDom.src || item.downloadUrl === currentDom.src);
    curIndex = index > -1 ? index : curIndex;
    if (data[curIndex]?.type === 'video') {
      setSpinning(false);
      return;
    }
    const currentWrap = imgWrapRef.current;
    if (!currentWrap) {
      return;
    }
    // 容器（预览区域当前size）
    const imgWrapWidth = currentWrap.clientWidth;
    const imgWrapHeight = currentWrap.clientHeight;
    if (currentDom?.src === ERROR_FALLBACK) {
      setImgWidth('120px');
      setImgHeight('90px');
      setImgMarginTop((imgWrapHeight - 90) / 2);
      setImgMarginLeft((imgWrapWidth - 120) / 2);
      setOperateDisabled(pre => pre.filter(i => !ERROR_HIDE.includes(i)).concat(ERROR_HIDE));
      setSpinning(false);
      return;
    }
    const trueSize = lodashGet(data, `[${curIndex}].presetSize`, [])[0];
    // 如果有匹配路径对应size，使用该size，这里根据容器宽高比算一下size的最大宽高
    if (trueSize && rotate === 0) {
      const newSize = { ...trueSize };
      // 算出图片相对于窗口是偏高还是偏宽
      const proportion = newSize.width / newSize.height / (imgWrapWidth / imgWrapHeight);
      if (proportion > 1 && newSize.width >= imgWrapWidth) {
        // 偏宽，以宽度为优先基准
        newSize.width = imgWrapWidth;
        newSize.height = imgWrapWidth * (trueSize.height / trueSize.width);
      } else if (proportion < 1 && newSize.height >= imgWrapHeight) {
        // 偏高，以高度为优先基准
        newSize.height = imgWrapHeight;
        newSize.width = imgWrapHeight * (trueSize.width / trueSize.height);
      } else if (proportion === 1) {
        // 比例相等，取相对较小值
        newSize.height = Math.min(imgWrapHeight, trueSize.height);
        newSize.width = Math.min(imgWrapWidth, trueSize.width);
      }
      currentDom = newSize;
    }
    const imgCurWidth = currentDom.width;
    const imgCurHeight = currentDom.height;
    setImgWrapStyle({ width: imgWrapWidth, height: imgWrapHeight });
    setImgWidth(`${imgCurWidth}px`);
    setMaxWidth(`${imgCurWidth}px`);
    setMaxHeight(`${imgCurHeight}px`);
    setImgHeight(`${imgCurHeight}px`);
    setImgMarginTop((imgWrapHeight - imgCurHeight) / 2);
    setImgMarginLeft((imgWrapWidth - imgCurWidth) / 2);
    setSpinning(false);
    setLoadOriginal(false);
  };
  useEffect(() => {
    if (index === -1) {
      setSpinning(false);
      return;
    }
    const operateDisabledTemp: string[] = [];
    if (index === 0) {
      operateDisabledTemp.push('previous');
    }
    if (index === data.length - 1) {
      operateDisabledTemp.push('next');
    }
    // 切换判断视频还是图片，视频需要指定src，动态切换curUrl不会更新
    if (data[index]?.type === 'video') {
      videoRef.current.src = data[index]?.previewUrl;
      operateDisabledTemp.push(...VIDEO_MUNU_HIDE);
    } else {
      const curSize = lodashGet(data, `[${index}].size`, 0);
      setRotate(0);
      setSpinning(true);
      setImgWidth('auto');
      setMaxHeight('100%');
      setMaxWidth('100%');
      setImgHeight('auto');
      setImgMarginTop(0);
      setImgMarginLeft(0);
      // 3M以上图片优先显示本地图片 查看原图时本地下载，后续预览如果本地已经有下载好的图片就直接预览原图
      if (curSize > THUMBNAIL_SIZE) {
        if (inElectron) {
          const params: FileAttachModel = {
            fileUrl: data[index].downloadUrl,
            fileName: data[index].name || '',
            fileSize: data[index].size || -1,
            fileSourceType: 2,
            dirPath: `${window.electronLib.env.userDataPath}/preview`,
          };
          (async () => {
            // TODO 是否需要_account?
            const fileInfo = await fileApi.getFileInfo(params);
            const fileLocalPath = lodashGet(fileInfo, '[0].filePath', '');
            if (fileLocalPath) {
              // mac路径/User/...  windows路径C:/...
              const realPath = fileLocalPath.indexOf('/') === 0 ? fileLocalPath : `/${fileLocalPath}`;
              // 更新curUrl
              setCurUrl(`cache://file${realPath}`);
              operateDisabledTemp.push('original');
            } else {
              // 兜底使用预览图地址
              setCurUrl(data[index]?.previewUrl as string);
            }
          })();
        } else {
          setCurUrl(data[index]?.previewUrl);
        }
      } else {
        setCurUrl(data[index]?.previewUrl);
        // 3M以下图片查看原图置灰
        operateDisabledTemp.push('original');
      }
    }
    setOperateDisabled(pre =>
      pre.filter(i => !['previous', 'next', 'download', 'shrink', 'amplification', 'rotateLeft', 'original'].includes(i)).concat(operateDisabledTemp)
    );
    // 邮件预览相同图片每次打开的name都不一样，这里只取previewUrl
  }, [index, JSON.stringify(data.map(item => item.previewUrl))]);
  // 图片加载出错
  const handlerError = () => {
    // 如果本地图片加载失败，使用原图网络地址，否则只能展示裂图
    if (!curUrl || curUrl.match(/^cache:/)) {
      setCurUrl(data[index]?.previewUrl as string);
      if (curUrl?.match(/^cache:/)) {
        setOperateDisabled((pre: string[]) => pre.filter((i: string) => i !== 'original'));
      }
      return;
    }
    setCurUrl(ERROR_FALLBACK);
  };
  const throttleReportWindowSize = throttle(onLoadSource, 200);
  useEffect(() => {
    window.addEventListener('resize', throttleReportWindowSize);
    return () => {
      window.removeEventListener('resize', throttleReportWindowSize);
    };
  }, [data, index]);
  useEffect(() => {
    const eid1 = eventApi.registerSysEventObserver('electronClose', {
      func: () => {
        setSpinning(false);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('electronClose', eid1);
    };
  }, []);
  const createImgName = () => {
    const name = randomString();
    return `lingxi-${name}.png`;
  };
  const download = async (item: DataType) => {
    if (!inElectron) {
      const imgBlob = await getImageFormatFromUrl(item?.downloadUrl!, item.name || '', 'blob');
      downloadFile(imgBlob, item.name || '');
      return;
    }
    let fileName = item?.name || createImgName();
    if (item?.name && item?.name.indexOf('.') === -1) {
      fileName = `${item.name}.${item.ext || 'png'}`;
    }
    const params = {
      fileName,
      fileUrl: item?.downloadUrl,
      fileSize: item?.size || -1,
      fileSourceType: item?.fileSourceType || 3,
    };
    fileApi.saveDownload(params);
  };
  const keydownAction = (e: KeyboardEvent) => {
    if (e.keyCode === 39 && !operateDisabled.includes('next')) {
      setIndex(i => i + 1);
    }
    if (e.keyCode === 37 && !operateDisabled.includes('previous')) {
      setIndex(i => i - 1);
    }
    if (e.keyCode === 27) {
      videoRef?.current?.pause();
    }
    const commandKey = util.isMac() ? e.metaKey : e.ctrlKey;
    if (e.keyCode === 83 && commandKey && !e.shiftKey && !e.altKey) {
      download(data[index]);
    }
  };
  useEffect(() => {
    document.body.addEventListener('keydown', keydownAction);
    return () => {
      document.body.removeEventListener('keydown', keydownAction);
    };
  }, [operateDisabled]);
  const onEnded = () => {
    videoRef.current.currentTime = 0;
  };
  const viewOriginal = async item => {
    if (curUrl !== item.downloadUrl && !curUrl.match(/file:/i)) {
      setSpinning(true);
      setLoadOriginal(true);
      setCurUrl(item.downloadUrl);
      setOperateDisabled((pre: string[]) => pre.concat(['original']));
      // 查看原图时本地下载，后续预览如果本地已经有下载好的图片就直接预览原图
      if (inElectron) {
        const params: FileAttachModel = {
          fileUrl: item.downloadUrl,
          fileName: item.name,
          fileSize: item.size,
          fileSourceType: 2,
          dirPath: `${window.electronLib.env.userDataPath}/preview`,
        };
        fileApi.download(params);
      }
    }
  };
  const closeModal = () => {};
  const shrink = () => {
    shrinkAction();
  };
  const amplification = () => {
    amplificationAction();
  };
  const rotateLeft = () => {
    const preUrl = data[index]?.previewUrl;
    setRotate(pre => {
      const rotateCur = (pre - 90 + 360) % 360;
      setSpinning(true);
      setImgWidth('auto');
      setMaxHeight('100%');
      setMaxWidth('100%');
      setImgHeight('auto');
      setImgMarginTop(0);
      setImgMarginLeft(0);
      if (/^https:\/\/cowork-storage-public-cdn.lx.netease.com/.test(preUrl)) {
        // 邮件里的部分图片以 https://cowork-storage-public-cdn.lx.netease.com 开头，没有允许跨域。但是有参数可以旋转 剪辑 等操作
        // 用 URL对象来处理新增的searchParams并输出结果，避免手动拼接字符串带来的错误
        // 例如原url已经有searchParams的情况下（https://a.b.com?foo=bar）直接拼接上带?的searchParams (?bar=foo)会导致前面的（foo=bar）丢失
        const imgUrl = new URL(preUrl);
        imgUrl.searchParams.append('imageView', '');
        imgUrl.searchParams.append('rotate', `${rotateCur}`);
        setCurUrl(imgUrl.toString());
      } else {
        // 图片允许跨域
        convertRotateImg(preUrl, rotateCur).then(url => {
          setCurUrl(url);
        });
      }
      return (pre - 90) % 360;
    });
  };
  const operateClick = type => {
    if (operateDisabled.includes(type)) return;
    switch (type) {
      case 'previous':
        setIndex(i => i - 1);
        break;
      case 'next':
        setIndex(i => i + 1);
        break;
      case 'download':
        download(data[index]);
        break;
      case 'shrink':
        shrink();
        break;
      case 'amplification':
        amplification();
        break;
      case 'rotateLeft':
        rotateLeft();
        break;
      case 'close':
        closeModal();
        break;
      case 'original':
        viewOriginal(data[index]);
        break;
      default:
        break;
    }
  };
  const operate = () => {
    const curItem = data[index];
    const typesList = curItem?.type === 'video' ? VIDEO_MENU : IMG_MENU;
    const iconMap = {
      previous: {
        desc: getIn18Text('SHANGYIZHANG'),
        icon: 'previous',
        comp: PreviousIcon,
      },
      next: {
        desc: getIn18Text('XIAYIZHANG'),
        icon: 'next',
        comp: NextIcon,
      },
      shrink: {
        desc: getIn18Text('SUOXIAO\uFF08') + util.getCommonTxt() + ' -）',
        icon: 'shrink',
        comp: ShrinkIcon,
      },
      amplification: {
        desc: getIn18Text('FANGDA\uFF08') + util.getCommonTxt() + ' +）',
        icon: 'amplification',
        comp: AmplificationIcon,
      },
      download: {
        desc: getIn18Text('XIAZAI\uFF08') + util.getCommonTxt() + ' S）',
        icon: 'doDownload',
        comp: DoDownloadIcon,
      },
      rotateLeft: {
        desc: getIn18Text('XUANZHUAN'),
        icon: 'rotateLeft',
        comp: RotateLeft,
      },
      original: {
        desc: getIn18Text('CHAKANYUANTU'),
        icon: 'original',
        hidden: curItem?.nonOriginal,
        comp: OriginalIcon,
      },
    };
    return typesList.map((type, i) => {
      let res = <div className={`${style.line}`} />;

      if (type) {
        //@ts-ignore
        const IconComp = iconMap[type].comp;
        const disableType = operateDisabled.includes(type);
        res = (
          <Tooltip placement="bottom" title={iconMap[type].desc}>
            <IconComp
              hidden={iconMap[type].hidden}
              width="24"
              height="24"
              style={{
                opacity: disableType ? '0.3' : '',
              }}
            ></IconComp>
          </Tooltip>
        );
      }
      //@ts-ignore
      if (iconMap[type]?.hidden) {
        return null;
      }
      return (
        <div
          key={type + i}
          className={`${style.operateItem} ${!type ? style.operateItemNosty : ''}`}
          onClick={() => {
            operateClick(type);
          }}
        >
          {res}
        </div>
      );
    });
  };
  if (typeof startIndex !== 'number') return null;
  const isMac = inElectron && window.electronLib.env.isMac;
  return (
    <div className={`${style.preview}`}>
      <div className={`${style.header} ${isMac ? style.macHeader : ''}`}>
        <div className={`${style.operate}`}>{operate()}</div>
      </div>
      {data[index]?.type === 'video' ? (
        <div className={`${style.contentWrap} ${style.contentVideoWrap}`}>
          <video ref={videoRef} className={`${style.contentVideo}`} autoPlay controls={!spinning} onCanPlay={onLoadSource} onEnded={onEnded} controlsList="nodownload">
            <source src={curUrl} />
            <p>{getIn18Text('NINDEHUANJINGZAN')}</p>
          </video>
        </div>
      ) : (
        <div ref={imgWrapRef} className={`${style.contentWrap}`}>
          <ImgContextMenu src={data[index]?.downloadUrl}>
            <img
              alt=""
              onLoad={onLoadSource}
              onError={handlerError}
              ref={imgRef}
              className={`${style.imgContent}`}
              src={curUrl}
              style={{
                marginTop: imgMarginTop,
                marginLeft: imgMarginLeft,
                width: imgWidth,
                height: imgHeight,
                maxHeight,
                maxWidth,
              }}
            />
          </ImgContextMenu>
        </div>
      )}
      {spinning && (
        <div className={`${classname(style.spin)} img-preview-spin`}>
          <Spin indicator={<i className={`${style.spinIcon} spin-icon`} />} />
        </div>
      )}
    </div>
  );
};
export default PreviewContent;
