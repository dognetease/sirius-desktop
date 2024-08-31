import React, { useState, useEffect } from 'react';
import IconCard from '@web-common/components/UI/IconCard/index';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import cloneDeep from 'lodash/cloneDeep';
import { AIModifyInfo } from 'api';
import { Drawer, Switch } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import './aiDynamicList.scss';

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

// const aiRes = {
//   id: '11122',
//   use: true,
//   originalSentence: 'and given that our customers used to use similar product/technology, a chat may be beneficial.',
//   aiSentenceList: [
//     {
//       aiSentence:
//         'and given that our customers used to use similar product/technology, a chat may be beneficial.and given that our customers used to use similar product/technology, a chat may be beneficial.',
//       unSelected: true
//     },
//     { aiSentence: 'and given that our customers used to use similar product/technology, a chat may be beneficial.', unSelected: false },
//     { aiSentence: 'and given that our customers used to use similar product.', unSelected: true },
//     {
//       aiSentence:
//         'and given that our customers used to use similar product/technology, a chat may be beneficial.technology, a chat may be beneficial',
//       unSelected: false
//     }
//   ],
//   placeholder: ''
// };

const AiDynamicList: React.FC<AiDynamicListProps> = props => {
  const { aiDynamicInfo, aiDynamicListOpen, setAiDynamicListOpen, submitClick } = props;
  const [useAi, setUseAi] = useState<boolean>(false);
  const [originalSentence, setOriginalSentence] = useState<string>('');
  const [aiSentenceList, setAiSentenceList] = useState<{ aiSentence: string; unSelected?: boolean }[]>([]);

  useEffect(() => {
    if (aiDynamicInfo) {
      setUseAi(!!aiDynamicInfo.use);
      setOriginalSentence(aiDynamicInfo.originalSentence || '');
      setAiSentenceList(cloneDeep(aiDynamicInfo.aiSentenceList) || []);
    }
  }, [aiDynamicInfo]);

  const drawerClose = () => {
    setAiDynamicListOpen(false);
  };
  const useAiChange = (checked: boolean) => {
    setUseAi(checked);
  };
  const checkAiItme = (index: number, unSelected: boolean) => {
    const temp = cloneDeep(aiSentenceList);
    temp[index]?.unSelected = unSelected;
    setAiSentenceList(temp);
  };
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

  return (
    <Modal
      className="ai-write-res-drawer"
      // headerStyle={{ display: 'none' }}
      // maskStyle={{ background: '#ffffff00' }}
      keyboard={false}
      width={480}
      onCancel={drawerClose}
      visible={aiDynamicListOpen}
      footer={''}
      maskClosable={false}
      title="AI改写方案"
    >
      {/* <p className="drawer-header">
        <span>AI改写方案</span>
        <div onClick={drawerClose}>
          <IconCard type="tongyong_guanbi_xian" />
        </div>
      </p> */}
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
        <p className="drawer-details-title">
          AI改写方案
          <Switch className="drawer-details-title-switch" checked={useAi} onChange={useAiChange} />
        </p>
        {useAi && (
          <div className="drawer-details-list">
            {aiSentenceList.map((i, index) => (
              <div
                className={!i.unSelected ? 'drawer-details-list-item oncheck' : 'drawer-details-list-item'}
                key={index}
                onClick={() => checkAiItme(index, !i.unSelected)}
              >
                <p className="drawer-details-list-item-title">
                  <span></span>版本{index + 1}
                </p>
                <p className="drawer-details-list-item-content">{i.aiSentence}</p>
                <p className="drawer-details-list-item-radio">{!i.unSelected && <IconCard fill="#4C6AFF" type="tongyong_chenggong_mian" />}</p>
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
    </Modal>
  );
};

export default AiDynamicList;
