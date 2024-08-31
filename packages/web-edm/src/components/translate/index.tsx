import React, { useRef } from 'react';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder, apis, EdmSendBoxApi, GPTAiContentTranslateRes, MailApiType } from 'api';
import { edmDataTracker } from '../../tracker/tracker';
import style from './index.module.scss';
import { getIn18Text } from 'api';

let gptApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApiType;
if (process.env.BUILD_ISEDM) {
  gptApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
}

export interface TranslateParams {
  isTranslation: boolean; // true：翻译开关在”译“ false: 开关在”文“
  serviceRes?: GPTAiContentTranslateRes; // 翻译成功后接口res || 翻译失败报错的信息 || 切换到原文为undefined || 翻译loading为undefined
}

interface TranslateProps {
  language?: string;
  isTranslation: boolean; // 打开译文
  contents: string[]; // 翻译原文
  setLoading: (value: string) => void; // 翻译中的loading态
  onTranslate: (res: TranslateParams) => void; // 翻译后的回调
  needServerRes?: boolean; // 是否需要调用服务端接口返回新数据，有些场景第一次翻译后，再切换到译文，不需要重新翻译，只需要切换开关
  sourceType: string; // 使用场景，用于埋点
}

const Translate: React.FC<TranslateProps> = props => {
  const { isTranslation, contents, setLoading, onTranslate, needServerRes = true, language = 'auto', sourceType } = props;
  const translateToken = useRef<number>(0);

  const translateClick = (checked: boolean) => {
    if (!isTranslation && checked) {
      // 译文
      if (contents.length === 0) {
        toast.error({ content: getIn18Text('FANYINEIRONGBU') });
      } else {
        edmDataTracker.track('waimao_mail_aiTranslate', { type: sourceType }); // 埋点
        const token = new Date().getTime();
        translateToken.current = token;
        getTranslateRes(token);
      }
    }
    if (isTranslation && !checked) {
      // 原文
      onTranslate({ isTranslation: false });
      translateToken.current = 0;
      setLoading('');
    }
  };
  const getTranslateRes = async (token: number) => {
    onTranslate({ isTranslation: true });
    if (!needServerRes) {
      return;
    }
    setLoading(getIn18Text('ZHENGZAIFANYI...'));
    // 调用翻译接口
    try {
      const htmlList = contents.map(i => {
        if (i.indexOf('<body>') !== -1) {
          return i;
        }
        const doc = new DOMParser().parseFromString(i, 'text/html');
        return doc.documentElement.outerHTML;
      });
      const req = {
        htmlList: htmlList,
        from: language,
        to: 'zh-CHS',
      };
      const res = await gptApi.doTranslateGPTAiContent(req, token);
      if (translateToken.current === token) {
        // 用户主动切换到原文，翻译成功后不返回res
        if (res.success) {
          // 成功
          toast.success({ content: getIn18Text('FANYICHENGGONG') });
          onTranslate({ isTranslation: true, serviceRes: res });
        } else {
          onTranslate({ isTranslation: false, serviceRes: res });
          toast.error({ content: `翻译失败，${res.message}` });
        }
      }
    } catch (e) {
      onTranslate({ isTranslation: false });
      toast.error({ content: getIn18Text('FANYISHIBAI') });
    }
    setLoading('');
  };

  return (
    <p className={style.translateBox}>
      <span className={!isTranslation ? style.checked : ''} onClick={() => translateClick(false)}>
        {getIn18Text('WEN')}
      </span>
      <span className={isTranslation ? style.checked : ''} onClick={() => translateClick(true)}>
        {getIn18Text('YIv16')}
      </span>
    </p>
  );
};

export default Translate;
