// todo: 已迁移
import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Modal, Progress, Button } from 'antd';
import { MailEntryModel } from 'api';
import { ModalCloseSmall } from '@web-common/components/UI/Icons/icons';

interface PrintProps {
  content: MailEntryModel;
  // eslint-disable-next-line react/no-unused-prop-types
  ref: React.Ref<HTMLElement>;
}

// eslint-disable-next-line max-len
const PrintPage: React.FC<PrintProps> = React.forwardRef((props: PrintProps, ref: React.Ref<HTMLElement>) => {
  const { content } = props;
  const [printProgress, setPrintProgress] = useState<number>(0); // 进度条百分比
  const [showPrintProgress, setShowPrintProgress] = useState<boolean>(false); // 是否展示进度条弹窗
  const [isClosePrint, setClosePrint] = useState<boolean>(false); // 是否要终止打印
  const [progressTimer, setProgressTimer] = useState<NodeJS.Timer | null>(null); // 进度条动画定时器

  const receiver = content?.receiver || []; // 接口返回的收件人、抄送人

  const printRef = useRef<HTMLDivElement>(null);

  // 发送、抄送
  const formatReceiver = type => {
    const onReceiver = receiver.filter(item => item.mailMemberType === type);

    return onReceiver.length > 0 ? (
      <p className="detail">
        <span className="detail-key">
          {/* eslint-disable-next-line no-nested-ternary */}
          {type === 'to' ? '收件人' : type === 'cc' ? <>抄&emsp;送</> : '密&emsp;送'}：
        </span>
        <span className="detail-val">
          {onReceiver.map((item, index) => {
            const { contactName, accountName } = item?.contact?.contact || {};
            if (contactName || accountName) {
              return `${index > 0 ? '、' : ''}${contactName} ${accountName}`;
            }
            return '';
          })}
        </span>
      </p>
    ) : (
      ''
    );
  };

  // 收集需要打印的内容之前Callback
  const onBeforeGetContent = () => {
    setPrintProgress(20);
    setProgressTimer(
      // 进度条动画
      setInterval(() => {
        setPrintProgress(data => (data === 80 ? 80 : data + 5));
      }, 1000)
    );
    setShowPrintProgress(true);
  };

  // 打印前Callback
  const onBeforePrint = () => {
    clearInterval(progressTimer as NodeJS.Timer);
    setProgressTimer(null);
    setPrintProgress(100);
    setTimeout(() => {
      // 增加延迟动画效果，防止弹窗一闪而过
      setShowPrintProgress(false);
    }, 200);
    if (isClosePrint) {
      setClosePrint(false);
      return Promise.reject();
    }
    return Promise.resolve();
  };

  // 取消打印
  const closePrint = () => {
    setClosePrint(true);
    setShowPrintProgress(false);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onBeforePrint,
    onBeforeGetContent,
  });

  return (
    <>
      {/* 打印按钮 */}
      <span onClick={handlePrint} ref={ref} style={{ display: 'none' }}>
        打印邮件
      </span>

      {/* 生成打印内容进度条弹窗 */}
      <Modal footer={null} closable={false} visible={showPrintProgress} width="400px" closeIcon={<ModalCloseSmall />}>
        <p style={{ marginBottom: '16px' }}>正在生成要打印的内容...</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Progress percent={printProgress} showInfo={false} status="active" style={{ width: '240px' }} />
          <Button style={{ width: '80px', height: '32px' }} onClick={closePrint}>
            取消
          </Button>
        </div>
      </Modal>

      {/* 打印页面 */}
      <div className="printPageBox" style={{ display: 'none' }}>
        <div ref={printRef} className="print">
          <p className="title">{content?.entry.title}</p>
          <p className="detail">
            <span className="detail-key">发件人：</span>
            <span className="detail-val">
              {content?.sender?.contact?.contact?.contactName}
              &nbsp;
              {content?.sender?.contact?.contact?.accountName}
            </span>
          </p>
          {formatReceiver('to')}
          {formatReceiver('cc')}
          <p className="detail">
            <span className="detail-key">时&emsp;间：</span>
            <span className="detail-val">{content?.entry?.sendTime}</span>
          </p>
          {/* eslint-disable-next-line react/no-danger */}
          <div className="content" dangerouslySetInnerHTML={{ __html: content?.entry?.content?.content }} />
        </div>
      </div>
    </>
  );
});

export default PrintPage;
