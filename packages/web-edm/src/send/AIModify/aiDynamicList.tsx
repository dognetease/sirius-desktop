import React, { useState, useEffect } from 'react';
import { getIn18Text } from 'api';
import IconCard from '@web-common/components/UI/IconCard/index';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import toast from '@web-common/components/UI/Message/SiriusMessage';
// import Divider from '@web-common/components/UI/Divider';
import Divider from '@lingxi-common-component/sirius-ui/Divider';
import Translate, { TranslateParams } from '../../components/translate/index';
import cloneDeep from 'lodash/cloneDeep';
import { apiHolder, apis, EdmSendBoxApi, GPTDayLeft, AIModifyInfo, GptAiContentRefreshReq } from 'api';
import { Drawer, Switch, Spin } from 'antd';
import './aiDynamicList.scss';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface AiDynamicListProps {
  /** AI改写方案抽屉是否打开 */
  aiDynamicListOpen: boolean;
  /** 设置 aiDynamicListOpen 值 */
  setAiDynamicListOpen: (value: boolean) => void;
  /** Ai改写方案初始数据 */
  aiDynamicInfo: AIModifyInfo;
  /** 点击确定回调 */
  submitClick: (submitResult: AIModifyInfo) => void;
}

const LoadingComp = (props: { loading: string }) => {
  const { loading } = props;
  return !!loading ? (
    <div className="page-loading">
      <Spin tip={loading} indicator={<IconCard type="tongyong_jiazai" />} />
    </div>
  ) : null;
};

const AiDynamicList: React.FC<AiDynamicListProps> = props => {
  const { aiDynamicInfo, aiDynamicListOpen, setAiDynamicListOpen, submitClick } = props;
  const [useAi, setUseAi] = useState<boolean>(false);
  const [originalSentence, setOriginalSentence] = useState<string>('');
  const [aiSentenceList, setAiSentenceList] = useState<{ aiSentence: string; unSelected?: boolean }[]>([]);
  const [loading, setLoading] = useState<string>(''); // loading 文案
  const [isTranslation, setTranslation] = useState<boolean>(false); // 是否打开译文
  const [translations, setTranslations] = useState<string[]>([]); // 译文

  useEffect(() => {
    if (aiDynamicInfo) {
      setUseAi(!!aiDynamicInfo.use);
      setOriginalSentence(aiDynamicInfo.originalSentence || '');
      setAiSentenceList(cloneDeep(aiDynamicInfo.aiSentenceList) || []);
    }
  }, []);

  useEffect(() => {
    if (!aiDynamicListOpen) {
      setTranslation(false);
      setTranslations([]);
      setLoading('');
    }
  }, [aiDynamicListOpen]);

  const drawerClose = () => {
    setAiDynamicListOpen(false);
  };
  // 开启AI改写开关
  const useAiChange = (checked: boolean) => {
    setUseAi(checked);
  };
  // 选择版本
  const checkAiItme = (index: number, unSelected: boolean) => {
    const temp = cloneDeep(aiSentenceList);
    if (temp[index]) {
      temp[index].unSelected = unSelected;
    }
    setAiSentenceList(temp);
  };
  // 确定按钮点击
  const aiDynamicChange = () => {
    const submitResult = {
      ...aiDynamicInfo,
      use: useAi,
      originalSentence: originalSentence,
      aiSentenceList: aiSentenceList,
    };
    submitClick && submitClick(submitResult);
    setAiDynamicListOpen(false);
  };
  // 获取AI改写剩余次数
  const resetDayLeft = async () => {
    const { aiContentDayLeft } = (await edmApi.getGPTQuota()) as GPTDayLeft;
    return aiContentDayLeft;
  };
  /**
   * 调用重新生成文本接口
   * @param taskId 改写任务id
   * @param sentenceIndex aiSentenceList index
   */
  const refreshServer = async (sentenceIndex: number, taskId?: string) => {
    try {
      const req: GptAiContentRefreshReq = {
        size: 1,
        contentList: [{ content: aiSentenceList[sentenceIndex].aiSentence }],
        type: 4,
        first: !taskId,
        taskId: taskId,
      };
      const res = await edmApi.getGPTAiContentRefresh(req);
      if (res.finishState === 0) {
        // 处理中
        await wait(3000);
        refreshServer(sentenceIndex, res.taskId);
      } else if (res.finishState === 1 && res.aiContentInfos && res.aiContentInfos[0]) {
        // 处理完成
        const temp = cloneDeep(aiSentenceList);
        if (temp[sentenceIndex]) {
          temp[sentenceIndex].aiSentence = res.aiContentInfos[0].aiContentList[0].aiContent;
        }
        setAiSentenceList(temp);
        toast.success({ content: getIn18Text('GAIXIEWENANCHENGGONG') });
        setLoading('');
      } else {
        // 处理失败
        toast.error({ content: getIn18Text('GAIXIEWENANSHIBAI') });
        setLoading('');
      }
    } catch (e) {
      toast.error({ content: getIn18Text('GAIXIEWENANSHIBAI') });
      setLoading('');
    }
  };
  // 换一换按钮点击
  const refreshClick = async (e: any, index: number) => {
    e.stopPropagation();
    setLoading(`正在改写版本${index + 1}文案...`);
    // 查看AI改写剩余次数
    try {
      const aiContentDayLeft = await resetDayLeft();
      if (!aiContentDayLeft || aiContentDayLeft <= 0) {
        toast.error({ content: getIn18Text('JINRISHENGYUAICI') });
        setLoading('');
        return;
      }
    } catch (e) {
      toast.error({ content: getIn18Text('GAIXIEWENANSHIBAI') });
      setLoading('');
      return;
    }
    // 调用ai改写接口
    refreshServer(index);
  };
  // 点击翻译回调
  const onTranslate = (res: TranslateParams) => {
    setTranslation(res.isTranslation);
    if (res.serviceRes && res.serviceRes.success) {
      // 翻译成功，调用接口，并成功返回
      const resTranslation = res.serviceRes.data.translations.map(i => {
        const doc = new DOMParser().parseFromString(i, 'text/html');
        return doc.documentElement.innerText;
      });
      setTranslations(resTranslation);
    }
  };

  return (
    <Drawer
      className="ai-write-res-drawer"
      headerStyle={{ display: 'none' }}
      maskStyle={{ background: '#ffffff00' }}
      keyboard={false}
      width={468}
      onClose={drawerClose}
      visible={aiDynamicListOpen}
    >
      <p className="drawer-header">
        <span>{getIn18Text('AIGAIXIEFANGAN')}</span>
      </p>
      <div className="drawer-details">
        <div className="drawer-details-original-content">
          <div className="drawer-details-list-item oncheck-disabled">
            <p className="drawer-details-list-item-title">
              <span></span>原内容
            </p>
            <p className="drawer-details-list-item-content">{originalSentence}</p>
            <p className="drawer-details-list-item-radio">
              <IconCard fill="#B7C3FF" type="tongyong_chenggong_mian" />
            </p>
          </div>
        </div>
        <div className="drawer-details-title">
          <p className="title">
            AI改写方案
            <Switch className="drawer-details-title-switch" checked={useAi} onChange={useAiChange} />
          </p>
          <Translate
            isTranslation={isTranslation}
            contents={aiSentenceList.map(i => i.aiSentence)}
            setLoading={setLoading}
            onTranslate={onTranslate}
            sourceType="multiVersions"
          />
        </div>
        {useAi && (
          <div className="drawer-details-list">
            {aiSentenceList.map((i, index) => (
              <div
                className={!i.unSelected ? 'drawer-details-list-item oncheck' : 'drawer-details-list-item'}
                key={index}
                onClick={() => checkAiItme(index, !i.unSelected)}
              >
                <p className="drawer-details-list-item-title">
                  <span></span>
                  {getIn18Text('BANBEN')}
                  {index + 1}
                </p>
                <p className="drawer-details-list-item-content">{i.aiSentence}</p>
                {isTranslation && (
                  <div className="drawer-details-list-item-translate-content">
                    <Divider />
                    <p className="translation">
                      <span>{getIn18Text('FANYI')}</span>
                      {translations[index] || ''}
                    </p>
                    <p className="youdao-label">
                      <span>{getIn18Text('YIv16')}</span>翻译结果来自有道词典
                    </p>
                  </div>
                )}
                <p className="drawer-details-list-item-right-top">
                  <span className="refresh" onClick={e => refreshClick(e, index)}>
                    <IconCard stroke="#4C6AFF" type="tongyong_shuaxin" />
                    换一换
                  </span>
                  {i.unSelected ? <span className="radio"></span> : <IconCard fill="#4C6AFF" type="tongyong_chenggong_mian" />}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="drawer-footer">
        <Button btnType="minorGray" onClick={() => setAiDynamicListOpen(false)}>
          取消
        </Button>
        <Button btnType="primary" onClick={aiDynamicChange}>
          确定
        </Button>
      </div>
      <LoadingComp loading={loading} />
    </Drawer>
  );
};

export default AiDynamicList;
