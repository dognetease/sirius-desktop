import React, { useEffect, useState, useRef, useImperativeHandle } from 'react';
import AiDynamicList from './aiDynamicList';
import style from './AIModify.module.scss';
import ErrorIcon from '@/images/icons/edm/edm-blue-error.svg';
import RightArrow from '@/images/icons/edm/yingxiao/edm-right-arrow-black.svg';
import YellowArrow from '@/images/icons/edm/edm-ai-modify-yellow-arrow.svg';
import cloneDeep from 'lodash/cloneDeep';
import classNames from 'classnames';
import RecordIcon from '@/images/icons/edm/edm-common-record.svg';

import { deleteNode } from '../../send/utils/getMailContentText';
import { AllResultModal } from './allResult';
import { AIModifyInfo, AIModifyParam, AIResults } from 'api';
import { apiHolder, apis, EdmSendBoxApi } from 'api';
import { buildMailContentWithPlaceholder } from './utils';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';
import { PreHeader } from '../../send/utils/mailClassnameConstant';
export interface Props {
  contactSize?: number;
  aiResult?: AIResults;
  reGeneral?: () => void;

  maxHeight?: number;
  allResultButtonClickFunc?: () => void;
  aiResultInfoChangedCallback?: (result: AIResults) => void;
  showTopSepLine?: boolean;
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export const AIContent = React.forwardRef((props: Props, ref) => {
  const { aiResult, contactSize, showTopSepLine = true, reGeneral, maxHeight = 0, allResultButtonClickFunc, aiResultInfoChangedCallback } = props;

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
      const temp = document.querySelector(item.id) as HTMLElement;

      if (temp) {
        const tagId = 'multi-version-tag-id' + (item.id || '');
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
          labeLNode.innerText = '原文';
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
        left = Math.min(left, 180); // 容器宽度 250, 限定不要到边缘
        finalNode.style.marginLeft = left + 'px';

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
      aiResultInfoChangedCallback && aiResultInfoChangedCallback(newAiResult);
    }
  };

  const removeSummary = (content?: string): string => {
    if (!content) {
      return '';
    }
    const node = document.createElement('div');
    node.innerHTML = content;

    deleteNode(node, `#${PreHeader}`);
    return node.outerHTML;
  };

  const ContentComp = () => {
    let tempContent = cloneDeep(buildMailContentWithPlaceholder(aiResult));
    if (tempContent) {
      aiResult?.modify.forEach(item => {
        if (item.aiSentenceList && item.aiSentenceList.length > 0 && item.placeholder && tempContent) {
          tempContent = tempContent.replace(item.placeholder, item.aiSentenceList[0].aiSentence);
        }
      });
    }
    return (
      <div className={style.innerHTML}>
        {NotifyComp()}
        <div style={{ display: 'flex' }}>
          <div className={classNames(innerAiResult?.modify && innerAiResult?.modify.length > 0 ? style.innerHTMLItem : null)}>
            <div>{getTransText('YUANWEN')}</div>
            <div
              className={classNames(
                style.mailContent
                // innerAiResult?.modify && innerAiResult?.modify.length > 0 ? style.reduceWidth : null,
              )}
              dangerouslySetInnerHTML={{ __html: removeSummary(cloneDeep(innerAiResult?.mailContent)) }}
            />
          </div>

          {innerAiResult?.modify && innerAiResult?.modify.length > 0 && (
            <>
              <div className={style.divider}></div>
              <div className={style.innerHTMLItem}>
                <div>{getTransText('GAIXIENEIRONGSHILI')}</div>
                <div className={classNames(style.mailContent, style.reduceWidth)} dangerouslySetInnerHTML={{ __html: removeSummary(cloneDeep(tempContent)) }} />
              </div>
            </>
          )}
        </div>

        {showTopSepLine && <div style={{ height: '0.5px', width: '100%', background: '#EBEDF2' }}></div>}
      </div>
    );
  };

  const NotifyComp = () => {
    const useCount = innerAiResult?.modify.filter(item => {
      return item.use;
    });

    return (
      <div className={style.notifyRoot}>
        {showTopSepLine && <div style={{ height: '0.5px', width: '100%', background: '#F2F7FE' }}></div>}
        <div className={style.notify}>
          <div>
            <img className={style.icon} src={ErrorIcon} />
            <span className={style.title}>
              {getIn18Text('YIDUI')}
              {useCount?.length}
              {getIn18Text('GEYUJUTIGONGLEA')}
            </span>
          </div>
          <div
            onClick={() => {
              reGeneral && reGeneral();
            }}
            className={style.reGeneral}
          >
            {getIn18Text('CHONGXINSHENGCHENG')}
          </div>
        </div>
      </div>
    );
  };

  const _hasContact = () => {
    return (contactSize && contactSize > 0) || false;
  };

  const calcEmailCount = (withContact: boolean) => {
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
    return withContact ? Math.min(basic, contactCount) : basic;
  };

  const SummaryComp = () => {
    const hasContact = _hasContact();
    const emailCount = calcEmailCount(hasContact);
    const contactCount = contactSize || 1;
    const averageSend = Math.ceil(contactCount / emailCount);

    return (
      <div className={style.summary}>
        {hasContact ? (
          <div style={{ display: 'flex' }}>
            {getIn18Text('GONGSHENGCHENG')}
            <span className={style.num}>{emailCount}</span>
            {getIn18Text('FENGNEIRONG，MEIFENGNEI')}
            <span className={style.num}>{averageSend}</span>
            {getIn18Text('REN')}
            <span className={style.subTitle}>{`（共${contactCount}人）`}</span>
          </div>
        ) : (
          <div style={{ display: 'flex' }}>
            {getIn18Text('GONGSHENGCHENG')}
            <span className={style.num}>{emailCount}</span>封内容
          </div>
        )}
        <div
          onClick={() => {
            if (allResultButtonClickFunc) {
              allResultButtonClickFunc();
            } else {
              setAllResultVisiable(true);
            }
          }}
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '4px' }}
        >
          <span className={style.title}>{getTransText('CHAKANSUOYOUNEIRONG')}</span>
          <img className={style.icon} src={RightArrow} />
        </div>
      </div>
    );
  };

  const AllResultModalComp = () => {
    return (
      innerAiResult &&
      allResultVisiable && (
        <AllResultModal
          contactSize={calcEmailCount(_hasContact())}
          aiResults={[innerAiResult]}
          onClose={() => setAllResultVisiable(false)}
          visiable={allResultVisiable}
        />
      )
    );
  };

  return (
    <div className={style.contentArea} style={maxHeight > 0 ? { maxHeight: maxHeight, minHeight: 0 } : {}}>
      {ContentComp()}
      {SummaryComp()}
      {AllResultModalComp()}
      {aiDynamicListOpen && (
        <AiDynamicList
          aiDynamicInfo={cloneDeep(currentSentence)!}
          aiDynamicListOpen={aiDynamicListOpen}
          setAiDynamicListOpen={setAiDynamicListOpen}
          submitClick={item => {
            replaceModifyResult(item);
            setCurrentSentence(undefined);
          }}
        />
      )}
    </div>
  );
});
