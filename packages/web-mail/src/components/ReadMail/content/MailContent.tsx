/* eslint-disable global-require */
import React, { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { apis, apiHolder as api, MailApi as MailApiType, PersonMedalDetailInfo, ContactModel, DataTrackerApi, PerformanceApi, MailConfApi } from 'api';
import { useResizeDetector } from 'react-resize-detector';
import { usePopper } from 'react-popper';
import classNames from 'classnames';
import IcsCard from '../../IcsCard';
import TaskMailCard from '../../TaskMailCard/TaskMailCard';
import PraiseMedalItem from '../../PraiseMedal';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import readWrapper, { downloadImg, handleCopyImg, randomName, parseUrlParams } from '../util';
import { useActions, useAppSelector, ReadMailActions } from '@web-common/state/createStore';
import { copyText } from '@web-common/components/UI/ContextMenu/util';
import LxPopover from '@web-common/components/UI/LxPopover/LxPopover';
import ContactDetail from '@web-contact/component/Detail/detail';
import { SingleMailLoading } from '../component/Loadings';
import { urlHasJavascriptProtocol, getHKListFromTab2, getKeyString, isTextShortcut } from '../../../util';
import { throttle } from 'lodash';
import useCreateCallbackForEvent from '../../../hooks/useCreateCallbackForEvent';
import useDebounceForEvent from '../../../hooks/useDebounceForEvent';
import useGetTagHotkeys from '../hooks/useGetTagHotkeys';
import useStateRef from '@web-mail/hooks/useStateRef';
// import { useWhyDidYouUpdate } from 'ahooks';

interface Props {
  icsMail: boolean;
  content: any;
  // handleReply(): void;
  // mid: any;
  icsProps: {
    setIcsSuccess: React.Dispatch<React.SetStateAction<boolean>>;
    mid: string;
    senderEmail: string;
    attachmentsIds: number[];
  };
  // 是否是聚合邮件
  merge?: boolean;
  isrcl?: boolean;
  mailIdChangeRecord?: { current: mailIdChangeRecord | null };
  readOnly?: boolean;
  onIframeWidthChange?: (width: number) => void;
  onIframeInitMinWidth?: (width: number) => void;
  forceUpdate?: number;
}
interface Position {
  top: number;
  left: number;
  bottom: number;
  right: number;
}
// const nsSettingPrefix = 'notShowSpamTipsForMail-';
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApiType;
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
// const storeApi: DataStoreApi = api.api.getDataStoreApi();
const systemApi = api.api.getSystemApi();
const performance = api.api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;

const virtualReference = {
  getBoundingClientRect() {
    return {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0,
    };
  },
};
//
const MailContent: React.FC<Props> = React.forwardRef((props: Props, ref) => {
  const { icsMail, icsProps, content, merge, isrcl, mailIdChangeRecord, readOnly, onIframeWidthChange, onIframeInitMinWidth, forceUpdate } = props;
  // const [spam, setSpam] = useState(false);
  // const [neverShow, setNeverShow] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const { width = 500, ref: mailReaderWrap } = useResizeDetector();
  const [popperHidden, setPopperHidden] = useState<boolean>(true);
  const popperElement = useRef<any>(null);
  const { styles, attributes, update } = usePopper(virtualReference, popperElement.current, { placement: 'right-start' });
  const iframeSelectionTextRef = useRef<string | undefined>();
  // @联系人位置
  const [contactPos, setContactPos] = useState<Position>({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  });
  // 点击联系人出现卡片
  const [contactCardVisible, setContactCardVisible] = useState(false);
  const [contactClicked, setContactClicked] = useState<ContactModel>();
  const [clickEmail, setClickEmail] = useState<string>('');

  const reduxReplyExpandedId = useAppSelector(state => state.mailReducer.replyExpandedId);

  const replyExpandedId = useRef<boolean>(reduxReplyExpandedId);
  // 勋章hover popper
  const [medalHoverShow, setMedalHoverShow] = useState(false);
  const [medalData, setMedalMedalData] = useState<PersonMedalDetailInfo | null>(null);
  const [medalHoverPos, setMedalHoverPos] = useState({
    top: 0,
    left: 0,
  });
  // 表扬对象是否有自己
  const [praiseOwner, setPraiseOwner] = useState(false);

  const { updateTaskDetail } = useActions(ReadMailActions);

  // 是否处于淡入淡出中
  const [fadeIn, setFadeIn] = useState(true);

  const debounceSetFadeIn = useDebounceForEvent(setFadeIn, 150);

  // 标签快捷键
  const tagHotkeyMap = useGetTagHotkeys(content?._account);
  const tagHotkeyMapRef = useStateRef(tagHotkeyMap);

  /**
   * 判断邮件正文是否有内容
   */
  // const noneContent = useMemo(() => {
  //   if (content?.entry?.content?.content) {
  //     // 判断邮件是否有文本或者图片
  //     const container = document.createElement('div');
  //     const fragment = document.createDocumentFragment();
  //     container.innerHTML = content?.entry?.content?.content;
  //     fragment.appendChild(container);
  //     const status = (!fragment.textContent || /^\s+$/.test(fragment.textContent)) && !fragment.querySelector('img');
  //     return status;
  //   }
  //   // 为空可能是中间状态
  //   return false;
  // }, [content]);

  /**
   * @description: 计算读信iframe里面的DOM在整个浏览器的位置
   * @param {Element} el
   * @param {Element} iframe iframeDOM 非 iframe.crrrent
   * @return {Position}
   */
  const getBoundingClientRectFromIframe = useCallback((el: Element, iframe: Element): Position => {
    const elRect = el.getBoundingClientRect();
    const iframeRect = iframe.getBoundingClientRect();
    const { clientWidth } = document.body;
    const { clientHeight } = document.body;
    return {
      top: elRect.top + iframeRect.top,
      right: clientWidth - (elRect.right + iframeRect.left),
      bottom: clientHeight - (elRect.bottom + iframeRect.top),
      left: elRect.left + iframeRect.left,
    };
  }, []);

  // const onClickLink = useCallback(
  //   href => {
  //     if (href?.match(/^mailto:/)) {
  //       const url = href.trim().slice(7);
  //       let params: any;
  //       try {
  //         params = parseUrlParams(url);
  //       } catch (e) {
  //         params = {
  //           path: url.split('?')[0],
  //         };
  //       }
  //       // mailApi.doWriteMailToContact([mail]);
  //       setCurrentAccount(content?._account);
  //       mailApi.doWriteMailFromLink([params.path], params.subject, params.body);
  //       trackApi.track('pcMail_click_writeMailButton_topBar', { source: 'Inbox' });
  //       return;
  //     }
  //     // 拦截伪协议
  //     if (!urlHasJavascriptProtocol(href)) {
  //       window.open(href);
  //     }
  //   },
  //   [content?.account]
  // );

  // 根据读信页内容执行淡入淡出逻辑
  useEffect(() => {
    if (content?.entry?.content?.content == '' || content?.entry?.content?.content == null) {
      debounceSetFadeIn(false);
    } else {
      debounceSetFadeIn(true);
    }
  }, [content?.entry?.content?.content]);

  useEffect(() => {
    if (popperHidden) {
      iframeSelectionTextRef.current = '';
    }
  }, [popperHidden]);

  useEffect(() => {
    replyExpandedId.current = reduxReplyExpandedId;
  }, [reduxReplyExpandedId]);

  useEffect(() => {
    if (content && !content.taskId) {
      // 非任务邮件重置redux
      updateTaskDetail({});
    }
  }, [content?.id]);

  const onIframeContextMenu = useCallback(contextMenu => {
    // if (targetHref) {
    //   onClickLink(targetHref);
    // }
    // else {
    // 该逻辑似乎现在是空调用，无实际意义 - 2023.7.25
    // handleReply();
    // }
    // if (imgPreview) {
    //   if (!replyExpandedId.current) {
    //     ImgPreview.preview({
    //       data: [
    //         {
    //           previewUrl: imgPreview.src,
    //           downloadUrl: imgPreview.src,
    //           name: imgPreview.alt || randomName(),
    //         },
    //       ],
    //       startIndex: 0,
    //     });
    //   }
    // }
    if (contextMenu) {
      switch (contextMenu.type) {
        case 'copyImg':
          if (contextMenu.copyImgSrc) {
            handleCopyImg(undefined, contextMenu.copyImgSrc);
          }
          break;
        case 'downImg':
          if (contextMenu.downImgSrc) {
            downloadImg(contextMenu.downImgSrc, '', contextMenu.downImgFid, contextMenu.downImgOriginUrl);
          }
          break;
        case 'copyLink':
          if (contextMenu.copyLinkHref) {
            copyText(contextMenu.copyLinkHref.replace(/^mailto:/, ''));
          }
          break;
        case 'copySelection':
          copyText(contextMenu.copySelectionText);
          break;
        default:
          break;
      }
    }
    // antd或其他组件的一些tooltip outside click trigger事件监听是绑定在body的mousedown事件上
    // 因此初始化一个mousedown事件并触发，以模拟iframe被点击的情况
    const event = document.createEvent('MouseEvents');
    const event2 = document.createEvent('MouseEvents');
    event.initMouseEvent('mousedown', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    event2.initMouseEvent('mouseup', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    document.body.dispatchEvent(event);
    document.body.dispatchEvent(event2);
    mailReaderWrap.current.click();
  }, []);
  const onIframeContextMenuRef = useCreateCallbackForEvent(onIframeContextMenu);

  /**
   * @description: 正文iframe点击绑定的事件
   * @param {*} e
   * @return {*}
   */
  const clickContent = useCallback(
    e => {
      const { target } = e;
      const mobileDom = target.tagName.toLowerCase() === 'a' && target.className === 'divNeteaseSiriusATContact';
      const deskDom = target.tagName.toLowerCase() === 'span' && target.getAttribute('data-mce-contact');
      // 只读模式下，点击不展示联系人
      if ((mobileDom || deskDom) && !readOnly) {
        e.preventDefault();
        const pos = getBoundingClientRectFromIframe(target, frameRef.current);
        const offsetX = target.clientWidth + 5;
        pos.left += offsetX;
        let contactId = target.getAttribute('data-mce-contact-id');
        let contactType = target.getAttribute('data-mce-contact-type');
        if (!contactType) {
          contactId = target.getAttribute('mail-address');
          contactType = 'EMAIL';
        }
        const name = target.textContent.substr(1);
        const newContact = mailApi.buildRawContactItem({
          item: contactId,
          email: contactId,
          type: '',
          name: name || contactId,
        });
        setClickEmail(contactId);
        setContactClicked(newContact.contact);
        setContactCardVisible(true);
        setContactPos(pos);
        // 埋点
        const hubbleEventId = target.getAttribute('data-hubble-event-id');
        if (hubbleEventId) {
          trackApi.track(hubbleEventId);
        }
      }
    },
    [readOnly, getBoundingClientRectFromIframe]
  );

  // const contentText = useMemo(() => {
  //   return content?.entry?.content?.content;
  // }, [content, forceUpdate]);

  useEffect(() => {
    // 图片最大为 100%
    const stringStyle = `img{max-width:${width}px}`;
    if (frameRef.current?.contentDocument) {
      const doc = frameRef.current.contentDocument;
      const maxWidthStyleSheet = doc.querySelectorAll('style#imgMaxWidth')[0];
      if (maxWidthStyleSheet) {
        (maxWidthStyleSheet as HTMLStyleElement).innerText = stringStyle;
      } else {
        const ss = doc.createElement('style');
        ss.id = 'imgMaxWidth';
        ss.innerText = stringStyle;
        if (doc && doc.head) {
          if (doc.head.append) {
            doc.head.append(ss);
          } else if (doc.head.appendChild) {
            doc.head.appendChild(ss);
          }
        }
      }
    }
  }, [width]);

  useEffect(() => {
    update && update();
  }, [virtualReference.getBoundingClientRect]);

  const setHiddenCb = () => setPopperHidden(!0);

  useEffect(() => {
    window.addEventListener('click', setHiddenCb);
    return () => {
      window.removeEventListener('click', setHiddenCb);
    };
  }, []);

  React.useImperativeHandle(
    ref,
    () => ({
      getIframeRef: () => frameRef,
    }),
    [frameRef.current]
  );

  // 获取绝对定位块的最大高度
  // const getAbsoluteBlockMaxHeight = useCallback(() => {
  //   let maxHeight = 0;
  //   try {
  //     if (frameRef && frameRef.current) {
  //       let list = frameRef.current?.contentDocument.querySelectorAll('[style*=absolute]') || [];
  //       for (let i = 0; i < list.length; i++) {
  //         const element = list[i];
  //         let height = element.getBoundingClientRect().bottom;
  //         if (height > maxHeight) {
  //           maxHeight = height;
  //         }
  //       }
  //     }
  //   } catch (e) {
  //     console.error('[error readMail-absolute-maxHeight]', e);
  //   }
  //   return maxHeight;
  // }, []);

  // 重设尺寸
  const resetIframeSize = useCallback(
    (setMinWidth?: boolean): void => {
      if (frameRef.current?.contentDocument) {
        const doc = frameRef.current.contentDocument;
        const bodyElements = doc.getElementsByTagName('body');
        const realCont = bodyElements?.length ? bodyElements[0] : null;
        // 计算content的最大高度
        let contentHeight = realCont?.scrollHeight || 0;

        // const absoluteBlockMaxHeight = getAbsoluteBlockMaxHeight();
        // // 计算postion元素的位置
        // if (absoluteBlockMaxHeight > 0) {
        //   if (absoluteBlockMaxHeight > contentHeight) {
        //     contentHeight = absoluteBlockMaxHeight;
        //   }
        // }
        // 增加20的高度，contentHeight 并不一定准确，该临时处理，需要等到后续兼容规则建立之后去掉
        frameRef.current.style.height = contentHeight ? contentHeight + 'px' : 'auto';
        // 解决 SIRIUS-2904 信里面有很多个高度95%的table，总高度超过了100%，然后我们又会有srollheight赋值给外面的高度，这样就死循环了，直到浏览器能给的最大高度
        // if (contentHeight > 50000 && realCont) {
        //   realCont.style.height = 'fit-content';
        // }
        // 自动测量给定固定宽度，以实现左右滑动
        if (realCont) {
          if (setMinWidth) {
            frameRef.current.style.minWidth = `${realCont.scrollWidth}px`;
            onIframeInitMinWidth && onIframeInitMinWidth(realCont.scrollWidth);
          }
          onIframeWidthChange && onIframeWidthChange(realCont.scrollWidth);
        }
      }
    },
    [frameRef, onIframeWidthChange, onIframeInitMinWidth]
  );

  // 节流重设iframe尺寸
  const throttleResetIframeSize = useCallback(throttle(resetIframeSize, 800), [resetIframeSize]);

  const mailLoadOver = useCreateCallbackForEvent(() => {
    //  邮件正文加载打点上报哈勃
    try {
      performance.timeEnd({
        statKey: 'mail_readmail_switch',
        statSubKey: '',
        params: {
          mailId: content?.id,
          accountId: content?._account,
          threadId: mailIdChangeRecord?.current?.id == content?.id ? null : mailIdChangeRecord?.current?.id,
        },
      });
    } catch (e) {
      console.error(e);
    }
  });

  // const throttleResetIframeSizeForEvent = useCreateCallbackForEvent(throttleResetIframeSize);
  // useEffect(() => {
  //   if (window) {
  //     if (!window.readMail) window.readMail = {};
  //     window.readMail = {
  //       ...window.readMail,
  //       clickReadContent: onClickMailContentRef,
  //       throttleResetIframeSize,
  //       mailLoadOver,
  //     };
  //   }
  // }, [onClickMailContentRef, throttleResetIframeSize, mailLoadOver, forceUpdate, content?.id]);
  // 不能做任何依赖，必须这么写
  // 原因： 聚合模式下，没封邮件都有一个单独的iframe，就是这个组件
  // 然后点开上一个iframe，throttleResetIframeSize 是上一个
  // 再点开这个 throttleResetIframeSize 是这个
  // 再点开上一个 所以得依赖都没变，只有xxx(没查出来是啥)变了
  // onClickMailContentRef, throttleResetIframeSize, mailLoadOver, forceUpdate, content?.id 这些都不会变，因为同一个组件在不同地方的应用
  // 然后又只有一个window 再iframe里面通过parentwindow 拿到的throttleResetIframeSize 就不是上一个组件里的throttleResetIframeSize
  // 总结，多个throttleResetIframeSize 在window里面切换，需要准备切换
  // if (window) {
  //   if (!window.readMail) window.readMail = {};
  //   window.readMail = {
  //     ...window.readMail,
  //     clickReadContent: onClickMailContentRef,
  //     throttleResetIframeSize,
  //     mailLoadOver,
  //   };
  // }

  // 跟随iframe内容变化，自动调节iframe尺寸
  const autosizeIframe = useCallback(() => {
    // 首次 设置最小宽度
    throttleResetIframeSize(true);
  }, []);

  // 表扬信内容逻辑处理
  const handlePraise = useCallback(async () => {
    const praiseMedalEl = frameRef?.current?.contentWindow?.document?.body?.querySelector('.praise-medal') as HTMLDivElement;
    if (!praiseMedalEl) {
      setMedalMedalData(null);
      return;
    }
    const medalData = JSON.parse(praiseMedalEl.getAttribute('data-medal-source') || 'null');
    // 表扬对象是否有自己
    const hasOwner = praiseMedalEl.getAttribute('data-hasOwner');
    setPraiseOwner(hasOwner === 'true');
    setMedalMedalData(medalData);

    const praiseMedalOver = () => {
      // 固定在praise-medal右下角
      const targetEl = frameRef?.current?.contentWindow?.document?.body?.querySelector('.praise-medal') as HTMLDivElement;
      const pos = targetEl.getBoundingClientRect();
      const top = pos.top + targetEl.offsetHeight;
      const left = pos.left + targetEl.offsetWidth;
      setMedalHoverPos({ top, left });
      setMedalHoverShow(true);
    };
    const praiseMedalOut = () => {
      setMedalHoverShow(false);
    };
    praiseMedalEl.addEventListener('mouseover', praiseMedalOver);
    praiseMedalEl.addEventListener('mouseout', praiseMedalOut);
  }, [frameRef]);

  // 加载完iframe的内容
  const handleLoad = useCallback(() => {
    // 邮件正文加载事件消耗打点，只记录单封读信页，暂不记录聚合邮件
    try {
      if (mailIdChangeRecord && mailIdChangeRecord.current) {
        const { id, time } = mailIdChangeRecord.current || {};
        if (id === content.id) {
          const countTime = new Date().getTime() - time;
          performance.point({
            statKey: 'mail_ui_content_load_time',
            statSubKey: '',
            params: { mailid: id },
            value: countTime,
            valueType: 1,
          });
          // 清除起始记录
          mailIdChangeRecord.current = null;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 从列表点击到正文加载完成事件打点
    try {
      performance.timeEnd({
        statKey: `mail_listclick_content_load_time`,
        statSubKey: content.id + '',
      });
    } catch (e) {
      console.error(e);
    }

    // 加载完成后
    iframeSelectionTextRef.current = '';
    if (frameRef.current?.contentDocument) {
      const doc = frameRef.current.contentDocument;
      // 如果存在table，进行包装
      // 逻辑已过时，先去掉了
      // try {
      //   if (frameRef.current?.contentDocument?.getElementsByTagName('table')?.length > 0) {
      //     const tables = frameRef.current?.contentDocument?.getElementsByTagName('table');
      //     for (let i = 0; i < tables.length; i++) {
      //       const table = tables[i];
      //       const divElement = document.createElement('div');
      //       const tableParent = table.parentElement;
      //       if (tableParent) {
      //         divElement.setAttribute('style', 'width:100%;overflow:hidden;overflow-x:auto;');
      //         tableParent.replaceChild(divElement, table);
      //         divElement.appendChild(table);
      //       }
      //     }
      //   }
      // } catch (e) {
      //   console.warn('[mailcon table warp error]', e);
      // }
      // 需要设定宽高，在某些情况下，图片加载完成后，会在requestAnimationFrame之前先触发onLoad事件
      // 导致iframe的size不正确
      // 手动触发一次
      resetIframeSize(true);
      // 绑定点击事件
      const signatureContainer = frameRef?.current?.contentWindow?.document?.body?.querySelector('#lingxi-signature-v2-content');
      const signatureV2 = frameRef?.current?.contentWindow?.document?.body?.querySelector('#lingxi-signature-v2-block');
      const signature = frameRef?.current?.contentWindow?.document?.body?.querySelector('#lingxi-signature-block');
      // 查找邮件折叠引用
      const foldEleElement = frameRef?.current?.contentWindow?.document?.body?.querySelector('.foldEle');
      if (foldEleElement) {
        foldEleElement?.addEventListener('click', () => {
          throttleResetIframeSize(true);
        });
      }
      const openPreview = () => {
        throttleResetIframeSize(true);
        const previewUrl = signature?.getAttribute('data-href');

        previewUrl && systemApi.openNewWindow(previewUrl);
        // previewUrl && window.open(previewUrl, '_blank');
      };
      const openPreviewV2 = () => {
        const previewUrl = signatureV2?.getAttribute('href');

        previewUrl && systemApi.openNewWindow(previewUrl);
        // previewUrl && window.open(previewUrl, '_blank');
      };
      signature?.addEventListener('click', openPreview);
      signatureContainer?.addEventListener('click', openPreviewV2);
      handlePraise();
    }
  }, [mailIdChangeRecord, content?.id, resetIframeSize, handlePraise]);

  /**
   * 写入邮件正文
   */
  useLayoutEffect(() => {
    const contentText = content?.entry?.content?.content;
    if (frameRef.current && contentText) {
      // 清楚iframe上的样式-宽度等，因为内容变化后需要重新计算
      frameRef.current.setAttribute('style', '');
      // 加载正文
      const doc = frameRef.current.contentDocument;
      // 清楚正文内容并写入
      doc?.open();
      doc?.write(readWrapper(contentText));
      doc?.close();
      // 开启iframe自动尺寸调节
      autosizeIframe();

      frameRef.current?.contentDocument?.addEventListener?.('click', clickContent);
    }
    return () => {
      frameRef.current?.contentDocument?.removeEventListener?.('click', clickContent);
    };
  }, [content?.entry?.content?.content, forceUpdate]);

  // useEffect(() => {
  //   if (contentText) {
  //     const hideDiv = document.createElement('div');
  //     // <div id="hiddenDiv" style="position: absolute; left: -9999px;"></div>
  //     hideDiv.setAttribute('style', 'position: absolute; left: -9999px; width: 10px');
  //     // hideDiv.setAttribute('id', 'getReadMailMinWidth');
  //     document.body.appendChild(hideDiv);
  //     hideDiv.innerHTML = contentText;
  //     function getMinWidth() {
  //       const images = hideDiv.getElementsByTagName("img");
  //       let loadedCount = 0;
  //       for (let i = 0; i < images.length; i++) {
  //         if (images[i].complete) {
  //           loadedCount++;
  //         } else {
  //           images[i].onload = function() {
  //             loadedCount++;
  //             if (loadedCount === images.length) {
  //               const minWidth = hideDiv.scrollWidth;
  //               console.log('getReadMailMinWidth', minWidth);
  //             }
  //           }
  //         }
  //       }
  //       if (loadedCount === images.length) {
  //         const minWidth = hideDiv.scrollWidth;
  //         console.log('getReadMailMinWidth', minWidth);
  //       }
  //     }
  //     getMinWidth();
  //   }
  // }, [contentText])

  // 邮件正文-是否为空   考虑其他业务情况
  // const emptyMailContent = useMemo(() => noneContent && !icsMail, [noneContent, icsMail]);

  // 表扬信勋章pop hover
  const praiseMedalMouseLeave = useCallback(() => {
    setMedalHoverShow(false);
  }, []);

  const praiseMedalMouseEnter = useCallback(() => {
    setMedalHoverShow(true);
  }, []);

  const renderPraiseMedalHover = useCallback(() => {
    if (medalData) {
      const data = {
        medalData,
        styles: {
          medalWidth: 142,
          medalHeight: 142,
        },
        from: 'readMail',
        praiseOwner,
      };
      return (
        <div
          style={{
            ...medalHoverPos,
            position: 'absolute',
            width: 198,
            boxShadow: '0px 12px 32px rgba(38, 42, 51, 0.12)',
            background: '#FFFFFF',
            borderRadius: 8,
            visibility: medalHoverShow ? 'visible' : 'hidden',
          }}
          onMouseLeave={praiseMedalMouseLeave}
          onMouseEnter={praiseMedalMouseEnter}
        >
          <PraiseMedalItem {...data} />
        </div>
      );
    }
    return null;
  }, [medalData, praiseOwner, medalHoverPos, medalHoverShow, praiseMedalMouseLeave, praiseMedalMouseEnter]);

  /**
   * 图片处理
   */
  const handleIframeImgClick = useCallback(res => {
    const { allImages, startIndex } = res;
    if (allImages && allImages.length) {
      if (!replyExpandedId.current) {
        const data = allImages.map((item: { src: string; alt: string }) => {
          return {
            previewUrl: item.src,
            downloadUrl: item.src,
            name: item.alt || randomName(),
          };
        });
        ImgPreview.preview({
          data,
          startIndex,
        });
      }
    }
  }, []);

  /**
   * 超链接处理
   */
  const handleIframeLinkClick = useCreateCallbackForEvent(href => {
    if (href) {
      if (href?.match(/^mailto:/)) {
        const url = href.trim().slice(7);
        let params: any;
        try {
          params = parseUrlParams(url);
        } catch (e) {
          params = {
            path: url.split('?')[0],
          };
        }
        // mailApi.doWriteMailToContact([mail]);
        // setCurrentAccount(content?._account);
        mailApi.doWriteMailFromLink([params.path], params.subject, params.body, content?._account);
        trackApi.track('pcMail_click_writeMailButton_topBar', { source: 'Inbox' });
        return;
      }
      // 拦截伪协议
      if (!urlHasJavascriptProtocol(href)) {
        window.open(href);
      }
    }
  });

  /**
   * 读信页-content iframe中的业务消息处理
   */
  const messageHandlesMap: { [key: string]: (value: any) => void } = useMemo(() => {
    return {
      // 读信页-图片加载失败
      readMail_img_error: value => {
        const subAccount = content?._account;
        if (value) value._account = subAccount;
        trackApi.track('read_mail_img_error', value);
      },
      // 读信页-附件加载失败
      readMail_attachment_failed: value => {
        trackApi.track('mail_attachment_check_failed_when_read', value);
      },
      //
      readMail_ContextMenu: value => {
        onIframeContextMenuRef(value);
      },
      // 读信页-正文的img点击
      readMail_img_click: value => {
        handleIframeImgClick(value);
      },
      // 读信页-邮件正文中的超点击被点击
      readMail_link_click: value => {
        handleIframeLinkClick(value);
      },
      readMail_resizeSize: value => {
        throttleResetIframeSize();
      },
      readMail_mailLoadOver: value => {
        mailLoadOver();
      },
      readMail_keydown: value => {
        // 需要将顶部的方法调用
        // todo: 该方法需要拆解走
        window.readMail.keyEvent(value);
        // 讲捕获的事件模拟后重放
        try {
          const element: HTMLElement | null = document.querySelector('#mailboxhotkey');
          if (element) {
            var customEvent = new KeyboardEvent('keydown', value);

            // 如果是文本相关操作的系统快捷键，不转发
            if (isTextShortcut(customEvent)) {
              return false;
            }
            // 判断是否属属于本地的标签快捷键
            const strList = getHKListFromTab2(tagHotkeyMapRef.current);
            const keyStr = getKeyString(customEvent);
            const isLocalShortcut = strList.some(item => item.toLocaleLowerCase() === keyStr);

            if (isLocalShortcut) {
              element.focus();
              element.dispatchEvent(customEvent);
              // 模式触发完成会后，将焦点重新定位到iframe，保持操作的连贯性
              const iframeElement: HTMLElement | null = document.querySelector('#mail-content-iframe');
              if (iframeElement && iframeElement?.focus) {
                iframeElement.focus();
              }
            }
          }
        } catch (e) {
          console.error('[error] readMail_keydown', e);
        }
      },
      update_token: value => {
        mailConfApi.updateAccountTokens({ forceUpdate: true }).then(res => {
          if (Array.isArray(res) && frameRef.current && frameRef.current.contentWindow) {
            const subAccount = content?._account;
            const token = res.find(item => item.account === subAccount)?.token;
            const accountSid = systemApi.getCurrentUser(subAccount)?.sessionId;
            frameRef.current.contentWindow.postMessage({ name: 'updateImgToken', data: { token, sid: accountSid || '' } });
          }
        });
      },
    };
  }, []);

  // 处理iframe的postMessage消息
  const handleMessage = useCreateCallbackForEvent(event => {
    //  限制消息的来源,只处理当前iframe内的消息
    if (frameRef.current?.contentWindow === event?.source) {
      const { data } = event;
      const { name, value } = data || {};
      if (name && messageHandlesMap[name]) {
        messageHandlesMap[name](value);
      }
    }
  });

  // 监听页面的点击事件，并通知iframe
  const handlePageClick = useCreateCallbackForEvent(() => {
    if (frameRef.current && frameRef.current.contentWindow) {
      frameRef.current.contentWindow.postMessage('pageClick');
    }
  });

  /**
   * 监听iframe内的消息通知
   */
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    window.addEventListener('click', handlePageClick);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('click', handlePageClick);
    };
  }, []);

  const renderMainContent = useMemo(() => {
    return (
      <div
        ref={mailReaderWrap}
        className={classNames(['mail-content read-mail-content'], {
          'read-mail-content-merge': merge,
        })}
      >
        <iframe
          id="mail-content-iframe"
          data-test-id="mail-readmail-iframe"
          ref={frameRef}
          title={content?.id}
          width="100%"
          height="100%"
          src="about:blank"
          scrolling="no"
          frameBorder="0"
          onLoad={handleLoad}
        />
        <LxPopover
          top={contactPos.top}
          left={contactPos.left}
          right={contactPos.right}
          bottom={contactPos.bottom}
          visible={contactCardVisible}
          setVisible={setContactCardVisible}
        >
          {contactClicked && (
            <ContactDetail
              email={clickEmail}
              contact={contactClicked}
              contactId={contactClicked?.contact?.id as string}
              dividerLine={false}
              branch
              toolipShow
              _account={content?._account}
            />
          )}
        </LxPopover>
        {renderPraiseMedalHover()}
      </div>
    );
  }, [handleLoad, contactCardVisible, contactClicked, contactPos, clickEmail, renderPraiseMedalHover, popperHidden, styles, forceUpdate]);

  // ics附件卡片
  const IcsCardElement = useMemo(() => {
    return icsMail ? (
      <IcsCard senderEmail={icsProps.senderEmail} setIcsSuccess={icsProps.setIcsSuccess} mid={icsProps.mid} attachmentsIds={icsProps.attachmentsIds} />
    ) : (
      <></>
    );
  }, [icsMail, icsProps]);

  // todo: 需要拆解，不要直接操作iframe中的dom
  // 这段逻辑是为了解决-任务邮件被转发后，在其他人的邮箱会请求失败，失败后展示逻辑不对而做的兜底
  const showTaskOriginEmail = () => {
    if (frameRef && frameRef.current && frameRef.current.contentDocument) {
      const footerEl: HTMLDivElement = frameRef.current.contentDocument.querySelector('.qiyesu-task-footer')!;
      if (footerEl) {
        footerEl.style.display = 'none';
      }
      const taskEl: HTMLDivElement = frameRef.current.contentDocument.querySelector('.divNeteaseSiriusTask')!;
      if (taskEl) {
        taskEl.style.display = '';
      }
    }
  };

  const handleTaskMailCardError = () => {
    if (content.taskId) {
      if (frameRef && frameRef.current) {
        showTaskOriginEmail();
      } else {
        setTimeout(() => {
          showTaskOriginEmail();
        }, 30);
      }
    }
  };

  return (
    <>
      {IcsCardElement}
      {content?.taskId ? (
        <TaskMailCard mailId={content?.id} onError={handleTaskMailCardError} todoId={content?.taskId} isrcl={isrcl} account={content?._account} />
      ) : null}

      <div className={` fade-in-out ${fadeIn ? 'fade-in' : 'fade-out'}`}>{content ? renderMainContent : <SingleMailLoading />}</div>
    </>
  );
});

// MailContent.defaultProps = {
//   merge: false,
// };
export default MailContent;
