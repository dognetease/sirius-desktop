import React, { useEffect, useState, useRef, useImperativeHandle } from 'react';
import ErrorIcon from '@/images/icons/edm/edm-blue-error.svg';
import RightArrow from '@/images/icons/edm/yingxiao/edm-right-arrow-black.svg';
import YellowArrow from '@/images/icons/edm/edm-ai-modify-yellow-arrow.svg';
import cloneDeep from 'lodash/cloneDeep';
import RecordIcon from '@/images/icons/edm/edm-common-record.svg';
import { apiHolder, apis, EdmSendBoxApi, AIModifyInfo, AIModifyParam, AIResults } from 'api';
import AiDynamicList from './aiDynamicList';
import { AllResultModal } from './allResult';
import { getContentWithoutSignOnly } from '../../../send/utils/getMailContentText';
import style from './AIModify.module.scss';
import { buildMailContentWithPlaceholder } from '../../../send/AIModify/utils';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';

export interface Props {
  contactSize?: number;
  aiResult?: AIResults;
  reGeneral?: () => void;
  componentId?: string;
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export const AIContent = React.forwardRef((props: Props, ref) => {
  const { aiResult, contactSize, reGeneral, componentId } = props;

  const [innerAiResult, setInnerAiResult] = useState<AIResults>();

  const [allResultVisiable, setAllResultVisiable] = useState(false);

  const [currentSentence, setCurrentSentence] = useState<AIModifyInfo>();

  const [aiDynamicListOpen, setAiDynamicListOpen] = useState<boolean>(false); // AI改写方案抽屉是否打开

  useImperativeHandle(ref, () => ({
    async getAIModifyResult() {
      const resp = await edmApi.emailContentUpload({
        emailContent: buildMailContentWithPlaceholder(innerAiResult),
        emailContentId: '',
      });

      let aiDynamicInfos = new Array<AIModifyInfo>();
      innerAiResult?.modify.forEach(item => {
        if (item.use && item.use === true) {
          const temp: AIModifyInfo = {
            originalSentence: item.originalSentence,
            placeholder: item.placeholder,
            aiSentenceList: item.aiSentenceList
              ?.filter(item => {
                return !item.unSelected;
              })
              .map(item => {
                return { aiSentence: item.aiSentence };
              }),
          };
          aiDynamicInfos.push(temp);
        }
      });
      const param: AIModifyParam = {
        emailContentId: resp.emailContentId,
        aiDynamicInfos: aiDynamicInfos,
      };
      return param;
    },
  }));

  useEffect(() => {
    setInnerAiResult(cloneDeep(aiResult));
  }, [aiResult]);

  useEffect(() => {
    if (!innerAiResult) {
      return;
    }
    innerAiResult.modify.forEach(item => {
      if (!item.id) {
        return;
      }
      const temp = document.querySelector(`#${componentId} ${item.id}`) as HTMLElement;

      if (temp) {
        const tagId = componentId + 'multi-version-tag-id' + (item.id || '');
        let prevNode = document.getElementById(tagId) as HTMLDivElement;
        if (prevNode) {
          prevNode.remove();
        }

        const finalNode = document.createElement('div');
        finalNode.id = tagId;

        const node = document.createElement('div');
        const usedCount = item.use
          ? item.aiSentenceList?.filter(item => {
              return !item.unSelected;
            }).length || 0
          : 0;

        if (usedCount > 0) {
          const imgNode = document.createElement('img') as HTMLImageElement;
          imgNode.src = RecordIcon;
          imgNode.className = style.image;
          node.appendChild(imgNode);

          const labeLNode = document.createElement('div');
          labeLNode.className = style.label;
          labeLNode.innerText = usedCount.toString() || '';
          node.appendChild(labeLNode);
        } else {
          const labeLNode = document.createElement('div');
          labeLNode.className = style.label;
          labeLNode.innerText = getTransText('YUANWEN');
          node.appendChild(labeLNode);
        }
        node.className = style.versionTag;

        const arrowNode = document.createElement('img') as HTMLImageElement;
        arrowNode.src = YellowArrow;
        arrowNode.className = style.arrow;

        finalNode.appendChild(node);
        finalNode.appendChild(arrowNode);
        finalNode.className = style.versionTagRoot;

        const rect = temp.getClientRects()[0] || temp.getBoundingClientRect();
        let left = rect.width * 0.5 - 20;
        if (left < 0) {
          left = 20;
        }
        left = Math.min(left, 400); // 容器宽度 550, 限定不要到边缘
        finalNode.style.left = left + 'px';

        temp.className = style.aiReplaceStyle;
        temp.appendChild(finalNode);

        const handleOnClick = () => {
          setCurrentSentence(item);
          setAiDynamicListOpen(true);
        };

        node.onclick = () => {
          handleOnClick();
        };
        temp.onclick = () => {
          handleOnClick();
        };
      }
    });
  }, [innerAiResult]);

  const replaceModifyResult = (result: AIModifyInfo) => {
    let info = new Array<AIModifyInfo>();
    innerAiResult?.modify.forEach(item => {
      if (item.id === result.id) {
        info.push(result);
      } else {
        info.push(item);
      }
    });
    if (innerAiResult) {
      let newAiResult: AIResults = {
        ...innerAiResult,
        modify: info,
      };
      setInnerAiResult(newAiResult);
    }
  };

  const ContentComp = () => {
    return (
      <div className={style.innerHTML}>
        {NotifyComp()}
        <div dangerouslySetInnerHTML={{ __html: getContentWithoutSignOnly(innerAiResult?.mailContent) }} />
        <div style={{ height: '0.5px', width: '100%', background: '#EBEDF2' }}></div>
      </div>
    );
  };

  const NotifyComp = () => {
    const useCount = innerAiResult?.modify.filter(item => {
      return item.use;
    });

    return (
      <div className={style.notifyRoot}>
        <div style={{ height: '0.5px', width: '100%', background: '#F2F7FE' }}></div>
        <div className={style.notify}>
          <img className={style.icon} src={ErrorIcon} />
          <div className={style.notifyContent}>
            <span className={style.title}>
              {getTransText('AIYIGAIXIE')}
              {useCount?.length}
              {getTransText('GEYUJU')}
            </span>
          </div>
          <div
            onClick={() => {
              reGeneral && reGeneral();
            }}
            className={style.reGeneral}
          >
            {getTransText('CHONGXINSHENGCHENG')}
          </div>
        </div>
      </div>
    );
  };

  const calcEmailCount = () => {
    let basic = 1;
    const modifySuggests = innerAiResult?.modify;
    modifySuggests?.forEach(item => {
      if (!item.use) {
        return;
      }
      let selectedSentence = 0;
      item.aiSentenceList?.forEach(aiItem => {
        if (!aiItem.unSelected) {
          selectedSentence++;
        }
      });
      basic = basic * (selectedSentence + 1);
    });
    const contactCount = contactSize || 1;
    return Math.min(basic, contactCount);
  };

  const SummaryComp = () => {
    const emailCount = calcEmailCount();
    // const contactCount = contactSize || 1
    // const averageSend = Math.ceil(contactCount / emailCount)

    return (
      <div className={style.summary}>
        <div style={{ display: 'flex' }}>
          {getIn18Text('GONGSHENGCHENG')}
          <span className={style.num}>{emailCount}</span>
          {getIn18Text('FENGNEIRONG')}
        </div>
        <div onClick={() => setAllResultVisiable(true)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '4px' }}>
          <span className={style.title}>{getTransText('CHAKANSUOYOUNEIRONG')}</span>
          <img className={style.icon} src={RightArrow} />
        </div>
      </div>
    );
  };

  const AllResultModalComp = () => {
    return (
      allResultVisiable && (
        <AllResultModal
          mailContent={cloneDeep(innerAiResult?.mailContent) || ''}
          contactSize={calcEmailCount()}
          mailContentWithPlaceholder={buildMailContentWithPlaceholder(innerAiResult)}
          aiResult={innerAiResult}
          onClose={() => setAllResultVisiable(false)}
          visiable={allResultVisiable}
        />
      )
    );
  };

  return (
    <div className={style.contentArea}>
      {ContentComp()}
      {/* <Tooltip style={{left:'120px', border:'0px'}} destroyTooltipOnHide={false} visible={showTooltips} ref={tooltipRef} overlayClassName={style.tooltipOverlay} title={'4方案'} /> */}
      {SummaryComp()}
      {AllResultModalComp()}
      <AiDynamicList
        aiDynamicInfo={cloneDeep(currentSentence)!}
        aiDynamicListOpen={aiDynamicListOpen}
        setAiDynamicListOpen={setAiDynamicListOpen}
        submitClick={item => {
          replaceModifyResult(item);
          setCurrentSentence(undefined);
        }}
      />
    </div>
  );
});
