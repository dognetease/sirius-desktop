/**
 * todo: 屏蔽请求内容期间的再次调用
 */
import React, { useState, useRef, useEffect, useCallback, useImperativeHandle } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Modal, Progress, Button } from 'antd';
import { MailEntryModel, apiHolder as api, apis, MailApi as MailApiType, LoggerApi, DataStoreApi, HtmlApi } from 'api';
import { ModalCloseSmall } from '@web-common/components/UI/Icons/icons';
// import { setCurrentAccount } from '../../util';
const htmlApi = api.api.requireLogicalApi(apis.htmlApi) as unknown as HtmlApi;
import { getIn18Text } from 'api';
interface PrintProps {}
type PrintRef = {
  printMail: (id: string, accountId: string) => void;
};
const dataStoreApi = api.api.requireLogicalApi(apis.defaultDataStoreApiImpl) as DataStoreApi;
const SYSTEM_THEME = 'system_theme';
const getSystemTheme = () => {
  const val = dataStoreApi.getSync(SYSTEM_THEME, { noneUserRelated: true });
  if (val && val.suc && val.data) {
    if (val.data !== 'auto') {
      return val.data;
    }
  }
  return window && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
const getDecodeTitle = (title: string) => {
  try {
    if (title) {
      const regex = /<\/?b>/g; // 匹配 <b> 和 </b> 标签
      const decoded = htmlApi.decodeHtml(title.replace(regex, '')); // 去掉 <b> 和 </b> 标签并解码
      return decoded;
    }
    return getIn18Text('WUZHUTI');
  } catch (e) {
    console.error('[Error reg]', e);
    return getIn18Text('WUZHUTI');
  }
};

function addOrRemovePrintStyle(htmlStr: string, isAdd: boolean) {
  try {
    if (!htmlStr || !htmlStr.length) return htmlStr;
    const divEl = document.createElement('div');
    divEl.innerHTML = htmlStr;
    const styleEls = divEl.querySelectorAll('style');
    if (styleEls && styleEls.length) {
      for (let i = 0; i < styleEls.length; i++) {
        const currentStyle = styleEls[i];
        if (!isAdd) {
          if (currentStyle && currentStyle.media) {
            if (currentStyle.media === 'print') {
              currentStyle.media = '';
            } else if (currentStyle.media.includes(',print')) {
              currentStyle.media = currentStyle.media.replace(',print', '');
            }
          }
        } else {
          if (currentStyle.media) {
            if (!currentStyle.media.includes('print')) {
              currentStyle.media += ',print';
            }
          } else {
            currentStyle.media = 'print';
          }
        }
      }
    }
    return divEl.innerHTML;
  } catch (ex) {
    return htmlStr;
  }
}
const printStyle = (theme: string) =>
  `<style>${
    theme && theme !== 'dark' ? ':root {--fill-2: #f6f7fa;--white:white;}' : ':root{--fill-2: #232324; --white: #232324}'
  }body{margin:0;}.mail-preview{position:fixed;left:0;top:0;bottom:0;right:0;margin:0;padding:0}.mail-preview iframe{width:100%;height:100%;border:0;}.mail-content {display:none;} @media print {@page { margin: 54px; } .mail-content{display:block;} .mail-preview{display:none;}} .title{font-size:14px;color:#262a33;line-height:21px;margin-bottom:16px;font-weight:700;}.print .detail{line-height:14px;margin-bottom:6px;font-size:12px;display:flex;}.print .detail .detail-key{color:#7d8085;width:48px;}.print .detail .detail-val{color:#262a33;flex: 1 1;}.print .content{word-wrap: break-word;margin-top:14px;}.loading-tip{position:absolute;left:0;right:0;top:0;bottom:0;}.loading-header{position:absolute;top:0;left:0;height:44px;right:0;background-color:var(--white,white);}.loading-container{padding-top:56px;display:flex;flex-direction:column;align-items:center;overflow:hidden;background-color: var(--fill-2, #F6F7FA);height:100%;min-width:815px;}.loading-img{width:773px; height:100%;background-color:white;overflow:hidden;padding:15px;position:relative;}.loading-img svg{width:100%;height:100%;}.loading-animation{position:absolute;width:84px;opacity:0.8;left:0;bottom:-100px;top:-100px;transform: rotateZ(10deg);animation-name:leftToRight;animation-timing-function:linear;animation-iteration-count:infinite;animation-duration:2s;background-color:white;filter:blur(30px);}@keyframes leftToRight{from:{left:0px} to {left:1000px}}.lx-theme-dark .dark-invert{filter:invert(100) hue-rotate(180deg);}</style>`;
const previewFrame = `<div class="mail-preview"><div class="loading-tip"><div class="loading-header"></div><div class="loading-container"><div class="loading-img"><svg viewBox="0 0 752 652" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="752" height="20" rx="4" fill="#F6F7FA"/>
<rect x="92" y="40" width="659" height="16" rx="4" fill="#F6F7FA"/>
<rect x="92" y="72" width="660" height="16" rx="4" fill="#F6F7FA"/>
<rect x="92" y="104" width="659" height="16" rx="4" fill="#F6F7FA"/>
<rect x="92" y="136" width="659" height="16" rx="4" fill="#F6F7FA"/>
<rect y="40" width="80" height="16" rx="4" fill="#F6F7FA"/>
<rect y="72" width="80" height="16" rx="4" fill="#F6F7FA"/>
<rect y="136" width="80" height="16" rx="4" fill="#F6F7FA"/>
<rect y="192" width="752" height="16" rx="4" fill="#F6F7FA"/>
<rect y="288" width="752" height="16" rx="4" fill="#F6F7FA"/>
<rect y="384" width="752" height="16" rx="4" fill="#F6F7FA"/>
<rect y="480" width="752" height="16" rx="4" fill="#F6F7FA"/>
<rect y="576" width="752" height="16" rx="4" fill="#F6F7FA"/>
<rect y="224" width="752" height="16" rx="4" fill="#F6F7FA"/>
<rect y="320" width="752" height="16" rx="4" fill="#F6F7FA"/>
<rect y="416" width="752" height="16" rx="4" fill="#F6F7FA"/>
<rect y="512" width="752" height="16" rx="4" fill="#F6F7FA"/>
<rect y="608" width="752" height="16" rx="4" fill="#F6F7FA"/>
<rect y="256" width="582" height="16" rx="4" fill="#F6F7FA"/>
<rect y="352" width="582" height="16" rx="4" fill="#F6F7FA"/>
<rect y="448" width="582" height="16" rx="4" fill="#F6F7FA"/>
<rect y="544" width="582" height="16" rx="4" fill="#F6F7FA"/>
<rect y="640" width="582" height="16" rx="4" fill="#F6F7FA"/>
</svg><div class="loading-animation"></div></div></div>
</div></div>`;
const printScript = (title: string, lang: string, theme: string) => {
  return `<script>function hideLoading(){const loadingEl = document.querySelector(".loading-tip");loadingEl.style.display = "none";}
  function previewMailByPath(filePath) {
    const siriusFilePath = 'sirius://sirius.file/'+encodeURIComponent(filePath);
    const url = 'sirius://sirius.page/print-mail-preview.html?pdfPath='+ filePath + '&lang=${lang}&theme=${theme}&emailTitle=${encodeURIComponent(title)}';
    const iframeEl = document.createElement("iframe");
    iframeEl.src = url;
    iframeEl.onload = function () {
      hideLoading();
    };
    const mailPreviewEl = document.querySelector(".mail-preview");
    mailPreviewEl.appendChild(iframeEl);
  }
  window.addEventListener("load", function () {
    electronLib.appManage
      .printToPdf()
      .then((res) => {
        if (!res || !res.filePath) {
          alert("${getIn18Text('PREVIEW_SAVE_ERROR')}");
        }
        const filePath = res.filePath;
        previewMailByPath(filePath);
        if(filePath) {
          window.addEventListener("beforeunload", (ev)=>{
            URL.revokeObjectURL(location.href);
            electronLib.fsManage.remove(filePath);
          });
        }
      })
      .catch((err) => {
        alert("${getIn18Text('PREVIRE_FAILED_RETRY')}");
      });
  });
  </script>`;
};
const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApiType;
const loggerApi = api.api.requireLogicalApi(apis.loggerApiImpl) as LoggerApi;
const systemApi = api.api.getSystemApi();
let progressTimer: NodeJS.Timer | null = null; // 进度条动画定时器
// eslint-disable-next-line max-len
const MailPrint: React.FC<PrintProps> = React.forwardRef((props: PrintProps, ref: React.Ref<PrintRef>) => {
  // const { config, setConfig } = props;
  const [printProgress, setPrintProgress] = useState<number>(0); // 进度条百分比
  // const [showPrintProgress, setShowPrintProgress] = useState<boolean>(false); // 是否展示进度条弹窗
  const [isClosePrint, setClosePrint] = useState<boolean>(false); // 是否要终止打印
  // const [progressTimer, setProgressTimer] = useState<NodeJS.Timer | null>(null); // 进度条动画定时器
  const [content, setContent] = useState<MailEntryModel>();
  const [modalVisble, setModalVisible] = useState<boolean>(false); // 是否展示进度条弹窗
  const [runHandlePrint, setRunHandlePrint] = useState<boolean>(false); // 执行打印
  const contentLoading = useRef(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [isPreview, setIsPreview] = useState<boolean>(false);

  useEffect(() => {
    if (runHandlePrint) {
      setRunHandlePrint(false);
      if (printRef.current) {
        if (!process.env.BUILD_ISELECTRON || !isPreview) {
          handlePrint();
        } else {
          handllePrintPreview();
        }
      }
      setIsPreview(false);
    }
  }, [runHandlePrint]);

  const sysTheme = getSystemTheme();

  const handllePrintPreview = () => {
    if (!printRef.current || !content) return;
    const htmlContent = addOrRemovePrintStyle(printRef.current.innerHTML, false);
    const fullHtml = `<html ${sysTheme !== 'dark' ? '' : 'class="lx-theme-dark"'}><head><meta charset="UTF-8"/><title>${getIn18Text(
      'PRINT_EMAIL_PREVIEW'
    )}</title>${printStyle(sysTheme)}</head>${printScript(
      getDecodeTitle(content.entry.title || ''),
      window.systemLang,
      sysTheme
    )}<body>${previewFrame}<div class="mail-content print">${htmlContent}</div></body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html,charset=UTF-8' });
    const blobUrl = URL.createObjectURL(blob);
    systemApi
      .createWindow({
        type: 'customer',
        url: blobUrl,
      })
      .finally(() => {
        setModalVisible(false);
      });
  };

  // 发送、抄送
  const formatReceiver = useCallback(
    type => {
      const receiver = content?.receiver || []; // 接口返回的收件人、抄送人
      const onReceiver = receiver.filter(item => item.mailMemberType === type);
      return onReceiver.length > 0 ? (
        <p className="detail">
          <span className="detail-key">
            {/* eslint-disable-next-line no-nested-ternary */}
            {type === 'to' ? getIn18Text('SHOUJIANREN') : type === 'cc' ? <>{getIn18Text('CHAO&ems')}</> : getIn18Text('MI&ems')}：
          </span>
          <span className="detail-val">
            {onReceiver.map((item, index) => {
              const { contactName, accountName } = item?.contact?.contact || {};
              if (contactName || accountName) {
                return `${index > 0 ? '、' : ''}${contactName} ${accountName}`;
              }
            })}
          </span>
        </p>
      ) : (
        ''
      );
    },
    [content]
  );

  // 收集需要打印的内容之前Callback
  const onBeforeGetContent = () => {
    setPrintProgress(20);
    // setProgressTimer(
    // // 进度条动画
    // setInterval(() => {
    //     setPrintProgress(data => (data === 80 ? 80 : data + 5));
    // }, 1000));
    progressTimer = setInterval(() => {
      setPrintProgress(data => (data === 80 ? 80 : data + 5));
    }, 1000);
    // 获取内容中引用折叠部分，展开打印
    const bqs = document.querySelectorAll('.foldEle');
    bqs.forEach(element => {
      if (element.nextElementSibling) {
        const nextElementSibling = element.nextElementSibling as HTMLElement;
        if (!nextElementSibling || nextElementSibling.id !== 'isReplyContent') return;
        const { className } = nextElementSibling;
        if (className.includes('hid')) {
          element.style.display = 'none';
          nextElementSibling.className = className.replace('hid', '');
          nextElementSibling.style.display = 'block';
        }
      }
    });
    setModalVisible(true);
  };

  // 打印前Callback
  const onBeforePrint = () => {
    clearInterval(progressTimer as NodeJS.Timer);
    progressTimer = null;
    // setProgressTimer(null);
    setPrintProgress(100);
    setTimeout(() => {
      // 增加延迟动画效果，防止弹窗一闪而过
      setModalVisible(false);
    }, 200);
    if (isClosePrint) {
      setClosePrint(false);
      return Promise.reject();
    }
    return Promise.resolve();
  };

  const onPrintError = (errorLocation: 'onBeforeGetContent' | 'onBeforePrint' | 'print', error: Error) => {
    try {
      loggerApi.track('mail_print_error', { errorLocation: errorLocation, error: error });
    } catch (err) {
      console.log('mail_print_error', err);
    }
  };

  // 取消打印
  const closePrint = () => {
    setClosePrint(true);
    setModalVisible(false);
  };

  const handlePrint = useReactToPrint({
    documentTitle: content?.entry.title,
    content: () => printRef.current,
    onBeforePrint,
    onBeforeGetContent,
    onPrintError,
  });

  const getMailContent = useCallback(
    (id, accountId) => {
      return MailApi.doGetMailContent(id, false, false, 'default', { _account: accountId })
        .then((_content: MailEntryModel) => {
          try {
            loggerApi.track('mail_print', { content: _content });
          } catch (error) {
            console.log('mail_print', error);
          }
          if (_content?.entry?.content?.content) {
            const printHtmlStr = addOrRemovePrintStyle(_content.entry.content.content, true);
            _content.entry.content.content = printHtmlStr;
          }
          setContent(_content);
        })
        .catch((err: string) => {
          // todo:请求失败给出错误提示
        });
    },
    [setContent]
  );

  // 打印邮件
  const printMail = useCallback(
    (id: string, accountId: string, isPreview?: boolean) => {
      // 锁定，判断邮件是否正在请求中
      setIsPreview(!!isPreview);
      if (!contentLoading.current) {
        contentLoading.current = true;
        try {
          loggerApi.track('mail_print_click');
        } catch (error) {
          console.log('mail_print_click', error);
        }
        try {
          // setCurrentAccount(accountId);
          getMailContent(id, accountId)
            .then(() => {
              setModalVisible(true);
              setRunHandlePrint(true);
              // handlePrint();
            })
            .finally(() => {
              contentLoading.current = false;
            });
        } catch {
          contentLoading.current = false;
          setIsPreview(false);
        }
      }
    },
    [getMailContent, handlePrint]
  );

  // 向外暴露打印方法
  useImperativeHandle(
    ref,
    () => ({
      printMail: printMail,
    }),
    [printMail]
  );

  return (
    <>
      {/* 打印按钮 */}
      {/* <span onClick={handlePrint} ref={ref} style={{ display: 'none' }}>打印邮件</span> */}

      {/* 生成打印内容进度条弹窗 */}
      <Modal footer={null} closable={false} visible={modalVisble} width="400px" closeIcon={<ModalCloseSmall />}>
        <p style={{ marginBottom: '16px' }}>{getIn18Text('ZHENGZAISHENGCHENGYAO')}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Progress percent={printProgress} showInfo={false} status="active" style={{ width: '240px' }} />
          <Button style={{ width: '80px', height: '32px' }} onClick={closePrint}>
            {getIn18Text('QUXIAO')}
          </Button>
        </div>
      </Modal>

      {/* 打印页面 */}
      {content ? (
        <div className="printPageBox" style={{ display: 'none' }}>
          <div
            ref={printRef}
            className="print"
            style={{ fontSize: '14px', fontFamily: 'arial, verdana, sans-serif, Helvetica, Microsoft Yahei', lineHeight: 1.666, color: '#000' }}
          >
            <p className="title">{getDecodeTitle(content?.entry.title || '')}</p>
            <p className="detail">
              <span className="detail-key">{getIn18Text('FAJIANREN\uFF1A')}</span>
              <span className="detail-val">
                {content?.sender?.contact?.contact?.contactName}
                &nbsp;
                {content?.sender?.contact?.contact?.accountName}
              </span>
            </p>
            {formatReceiver('to')}
            {formatReceiver('cc')}
            <p className="detail">
              <span className="detail-key">{getIn18Text('SHI&ems')}</span>
              <span className="detail-val">{content?.entry?.sendTime}</span>
            </p>
            {/* eslint-disable-next-line react/no-danger */}
            <div className="content print-content-wrapper" dangerouslySetInnerHTML={{ __html: content?.entry?.content?.content }} />
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
});
export default MailPrint;
