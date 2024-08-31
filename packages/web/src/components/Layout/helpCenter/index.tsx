// 知识广场全部使用Web打开，所以文件不再有引用，注释掉 by 周昊 @ 2024.01.04
// import classnames from 'classnames';
// import React, { useEffect, useRef, useState } from 'react';
// import { isElectron } from 'api';
// import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import ImgPreview from '@web-common/components/UI/ImagePreview';
// import { getTransText } from '@/components/util/translate';
// import style from './index.module.scss';
//
// export const HelpCenter = () => {
//   const [videoParams, setVideoParams] = useState<{
//     videoParams: string;
//     videoPaddingTop: string;
//   }>();
//   const iframeRef = useRef<HTMLIFrameElement>(null);
//   useEffect(() => {
//     const handleMessage = (e: MessageEvent) => {
//       if (!e.origin.startsWith('https://waimao.163.com')) {
//         return;
//       }
//       const { data } = e;
//       const { type } = data;
//       switch (type) {
//         case 'showVideo': {
//           console.log(data.item);
//           // _this.videoId = data.item.videoParams;
//           setVideoParams(data.item);
//           break;
//         }
//         case 'zoomImage':
//           console.log(data.src);
//           ImgPreview.preview({
//             data: [
//               {
//                 previewUrl: data.src,
//               },
//             ],
//             startIndex: 0,
//           });
//           break;
//         default:
//           console.log(data);
//           break;
//       }
//     };
//     window.addEventListener('message', handleMessage);
//     if (isElectron()) {
//       iframeRef.current?.addEventListener('load', e => {
//         // console.log('iframeLoaded', e.target);
//         const { body } = iframeRef!.current!.contentWindow!.document;
//         // transform: scale(0.95); 会导致页面滚动异堂，改成使用zoom
//         (body.style as any).zoom = '95%';
//       });
//     }
//     return () => {
//       window.removeEventListener('message', handleMessage);
//     };
//   }, []);
//   return (
//     <div className={style.page}>
//       <div className={style.fakeHeader} />
//       <div className={classnames(style.noDragZone, 'sirius-no-drag')}>
//         <div className={style.frameWrapper}>
//           <iframe
//             ref={iframeRef}
//             src="https://waimao.163.com/helpCenter"
//             style={{ width: '100%', height: '100%' }}
//             title={getTransText('ZHISHIZHONGXIN')}
//             allowFullScreen
//           />
//         </div>
//       </div>
//       {videoParams && (
//         <Modal
//           visible
//           width="60%"
//           centered
//           wrapClassName={style.videoPlayerModal}
//           bodyStyle={{ paddingTop: videoParams?.videoPaddingTop }}
//           footer={null}
//           maskClosable
//           onCancel={() => setVideoParams(undefined)}
//         >
//           <iframe
//             title={getTransText('ZHISHIGUANGCHANG')}
//             src={`https://hcplayer.moyincloud.com/?${videoParams.videoParams}&autoPlay=true`}
//             frameBorder="0"
//             allowFullScreen
//             scrolling="no"
//             allow="autoplay; fullscreen"
//           />
//         </Modal>
//       )}
//     </div>
//   );
// };
