import React, { useState, useEffect } from 'react';
import { apiHolder as api, apis, DataTrackerApi, MailApi, getIn18Text } from 'api';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import './MailContentHeader.scss';
import FadeInOut from '@web-mail/common/components/transitions/FadeInOut';
import { debounceMailListRequest } from '@web-mail/util';
import IconSuccess from '@/components/UI/Icons/svgs/Success';
const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
// 前后取消，防止错误的数据覆盖
const getMailHeaders = debounceMailListRequest(mailApi.getMailHeaders.bind(mailApi)) as unknown as typeof mailApi.getMailHeaders;

interface Props {
  mid: string;
  visiable?: boolean;
  onVisiableChange?: (showMailHead: boolean) => void;
  account?: string;
}

const MailContentHeader: React.FC<Props> = ({ mid, account, visiable, onVisiableChange }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // 请求信头
  const fetchMailHead = () => {
    if (mid) {
      getMailHeaders(mid, account).then((res: string) => {
        setLoading(false);
        setContent(res);
      });
    }
  };

  useEffect(() => {
    if (visiable) {
      // 请求content内容
      setLoading(true);
      fetchMailHead();
    } else {
      setContent('');
      setLoading(false);
    }
  }, [visiable]);

  const handleClose = () => {
    onVisiableChange && onVisiableChange(false);
  };

  return (
    <FadeInOut visiable={visiable} unmountOnHide={true}>
      <div className="mail-content-header-wrap">
        <div className="mch-head">
          <div className="mch-icon">
            {' '}
            <IconSuccess />
          </div>
          <div className="mch-title">{getIn18Text('YIXIANSHIYOUJIANXT')}</div>
          <div className="mch-oper-wrap">
            <div className="mch-close" onClick={handleClose}>
              {getIn18Text('CLOSE_AUTOLAUNCH')}
            </div>
          </div>
        </div>
        {loading ? (
          <div className="mch-content  mch-content-loading">
            <LoadingOutlined />
          </div>
        ) : (
          <pre className="mch-content">{content}</pre>
        )}
      </div>
    </FadeInOut>
  );
};

export default MailContentHeader;
