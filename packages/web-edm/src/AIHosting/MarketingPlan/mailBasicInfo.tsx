import React, { useState, useEffect, useImperativeHandle } from 'react';
import { MarketingPlans } from './plan';
import style from './mailBasicInfo.module.scss';
import { Checkbox, Tooltip } from 'antd';
import HostingResModal from '../HostingResModal';
import { GPTDayLeft, AIModifyParam, HostingMailInfo, HostingPlanModel, HostingInfo, HostingMailInfoModel, apiHolder, apis, EdmSendBoxApi, Plan } from 'api';
import cloneDeep from 'lodash/cloneDeep';
import { ReactComponent as ExplanationIcon } from '@/images/icons/edm/yingxiao/explanation-gray16px.svg';
import EditorModal from '../../components/edmMarketingEditorModal/index';
import { getContentWithoutAttachment } from '../../send/contentEditor';

// import traversalBr from '../utils/traversalBr';
import { combineMailinfoAndAiModify } from './utils';
import { BasicInput } from '../AiHostingEdit';
import { systemIdToStyle } from '../AiHostingPlans';
import { edmDataTracker } from '../../tracker/tracker';
import { getIn18Text } from 'api';
import { BasicInfoItem } from './BasicInfoItem';

const bodyId = 'mailbasic-scroll-body-id';

export interface Props {
  mailInfos?: HostingInfo;
  basicInput?: BasicInput;
  cycleMarketingOn?: boolean;
  handleEditorSave?: (info: HostingInfo) => void;
  operationType?: number;
  quota?: GPTDayLeft;
  maxWidth?: number;
  onCycleMarketingChanged: (isOn: boolean) => void;
}

export interface MailBasicInterface {
  refresh: (width: number) => void;
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
export const MailBasicInfo = React.forwardRef<MailBasicInterface, Props>((props, ref) => {
  const { onCycleMarketingChanged, handleEditorSave, operationType, basicInput, quota, maxWidth } = props;

  const [infos, setInfos] = useState<HostingInfo>();
  const [selectedMailInfo, setSelectedMailInfo] = useState<HostingMailInfo>();
  const [previewVisiable, setPreviewVisiable] = useState(false);
  const [containerWidth, setContainerWidth] = useState(props.maxWidth || 0);
  const [editorVisible, setEditorVisible] = useState(false);

  useEffect(() => {
    let info = cloneDeep(props.mailInfos);
    fetchMultiVerionContentIfNeeded(info);
  }, [props.mailInfos]);

  const getMailPlanByIndex = (index: number) => {
    let plans = infos?.planInfo?.mailInfos;
    if (!plans || plans.length === 0) {
      return undefined;
    }
    return plans[index];
  };

  const fetchMultiVerionContentIfNeeded = async (infos?: HostingInfo) => {
    if (!infos || infos.mailInfos?.length === 0) {
      return;
    }

    if ((infos?.mailInfos?.length || 0) === 0) {
      let mailInfos = infos?.planInfo?.mailInfos?.map((i, index) => {
        let info: HostingMailInfo = {
          roundIndex: index + 1,
          syncSendEmail: true,
        };
        if (i.expandMailInfos && i.expandMailInfos.length > 0) {
          info.expandHostingMailInfos = [
            {
              roundIndex: index + 1,
              syncSendEmail: true,
              mailType: 1,
            },
          ];
        }
        return info;
      });
      infos.mailInfos = mailInfos;
    }

    for (let item of infos.mailInfos || []) {
      let multiNosId = item.multipleContentInfo?.emailContentId;
      if (multiNosId && multiNosId.length > 0) {
        item.plan = await fetchMailContentByNosId(item, multiNosId);
      }
      if (item.expandHostingMailInfos && item.expandHostingMailInfos.length > 0) {
        item.expandHostingMailInfos[0].plan = await fetchMailContentByNosId(
          item.expandHostingMailInfos[0],
          item.expandHostingMailInfos[0].multipleContentInfo?.emailContentId
        );
      }
    }
    setInfos(infos);
  };

  const fetchMailContentByNosId = async (item?: HostingMailInfo, multiNosId?: string) => {
    if (!item || !multiNosId) {
      return undefined;
    }
    let multiMailTemplate = await edmApi.getEmailContent({ emailContentId: multiNosId });
    let plan = {
      title: getMailPlanByIndex((item.roundIndex || 1) - 1)?.emailName,
      round: item.roundIndex,
      mailInfo: { ...item?.contentEditInfo },
      aiOn: item.plan ? item.plan.aiOn : true,
      aiResult: {
        mailContent: multiMailTemplate.emailContent || '',
        modify:
          item.multipleContentInfo?.aiDynamicInfos?.map(innerItem => {
            innerItem.use = true;
            return innerItem;
          }) || [],
      },
      multiContentId: item.multipleContentInfo?.emailContentId,
    };
    return plan;
  };

  const basicInfoChanged = (modify?: Map<number, AIModifyParam>) => {
    let mailInfos = new Array<HostingMailInfo>();
    let tempInfos = cloneDeep(infos);
    if (tempInfos) {
      tempInfos?.mailInfos?.forEach(item => {
        let info = combineMailinfoAndAiModify(item, basicInput, selectedMailInfo?.mailType === 0 ? modify : undefined);
        info.roundIndex = item.roundIndex;
        info.mailType = 0;
        mailInfos.push(info);
        if (item.expandHostingMailInfos && item.expandHostingMailInfos.length > 0) {
          let temp = combineMailinfoAndAiModify(item.expandHostingMailInfos[0], basicInput, selectedMailInfo?.mailType === 1 ? modify : undefined);
          temp.mailType = 1;
          temp.roundIndex = item.roundIndex;
          info.expandHostingMailInfos = [temp];
        }
      });
      tempInfos.mailInfos = mailInfos;
    }

    // TODO: HostingInfo轮次信息
    let resp: HostingInfo = {
      ...tempInfos,
    };
    setInfos(resp);
    handleEditorSave && handleEditorSave(resp);
  };

  const insertMultiResultToDataIfNeeded = (plan?: Plan) => {
    if (!plan) {
      return;
    }
    if (selectedMailInfo) {
      selectedMailInfo.plan = plan;
    }
  };

  useEffect(() => {
    setContainerWidth(props.maxWidth || 0);
  }, [maxWidth]);

  const [refreshKey, setRefreshKey] = useState(false);
  const refresh = () => {
    setRefreshKey(!refreshKey);
  };

  const HeaderComp = () => {
    let planId = infos?.planInfo?.planId || '0';
    let cfg = systemIdToStyle[planId] || systemIdToStyle['-1'];
    return (
      <div className={style.header}>
        <div className={style.left}>
          <img src={cfg.src} style={{ width: '24px', height: '24px', marginRight: '8px' }} />
          <div className={style.title}>{basicInput?.name || ''}</div>
        </div>
        <div className={style.right}>
          <Checkbox
            checked={infos?.planInfo?.loopStatus === 1 ? true : false}
            onChange={e => {
              if (infos && infos.planInfo) {
                infos.planInfo.loopStatus = e.target.checked ? 1 : 0;
              }
              onCycleMarketingChanged && onCycleMarketingChanged(e.target.checked);
              refresh();
            }}
          >
            <span className={style.rightText}>{getIn18Text('KAIQIXUNHUANYINGXIAO')}</span>
            <Tooltip title={getIn18Text('KAIQIHOUSUOYOUZHUANGTAI')}>
              <ExplanationIcon style={{ marginBottom: '-4px' }} />
            </Tooltip>
          </Checkbox>
        </div>
      </div>
    );
  };

  useImperativeHandle(ref, () => ({
    refresh(width) {
      setContainerWidth(width);
    },
  }));

  const getTrackSource = () => {
    let trackName = '';
    if (operationType === 0) {
      trackName = 'create';
    }
    if (operationType === 1 || operationType === 3) {
      trackName = 'editStrategy';
    }
    if (operationType === 2) {
      trackName = 'addStrategy';
    }
    return trackName;
  };

  const GeneralBodyItem = (mailInfo: HostingMailInfo, planInfo?: Partial<HostingPlanModel>, index?: number, width?: number) => {
    return (
      <BasicInfoItem
        key={index}
        width={width}
        mailInfo={mailInfo}
        planInfo={planInfo}
        onPreview={info => {
          edmDataTracker.track('pc_marketing_edm_host_set', {
            editAction: 'check',
            type: 'edit',
            source: getTrackSource(),
          });
          setPreviewVisiable(true);
          setSelectedMailInfo(info);
        }}
        onEdit={info => {
          setSelectedMailInfo(info);
          setEditorVisible(true);
        }}
      />
    );
  };

  const EditorModalComp = () => {
    if (!selectedMailInfo) {
      return undefined;
    }

    let selectedItem = selectedMailInfo;
    if (selectedItem?.mailType === 1 && selectedItem?.expandHostingMailInfos && selectedItem?.expandHostingMailInfos.length > 0) {
      selectedItem = selectedItem.expandHostingMailInfos[0];
    }

    let emailContent = selectedItem?.contentEditInfo?.emailContent || '';
    emailContent = getContentWithoutAttachment(emailContent);
    return (
      <EditorModal
        destroyOnClose={false}
        visible={editorVisible}
        emailContent={emailContent}
        emailAttachment={selectedItem?.contentEditInfo?.emailAttachment || ''}
        emailSubject={selectedItem?.contentEditInfo?.subject}
        emailSenderEmail={selectedItem?.sendSettingInfo?.senderEmail}
        subjectVisible
        onCancel={() => {
          setEditorVisible(false);
        }}
        onSave={value => {
          if (selectedItem) {
            selectedItem.contentEditInfo = value;
          }
          basicInfoChanged(undefined);
          setEditorVisible(false);
        }}
        needModal
      />
    );
  };

  const getItemWidth = () => {
    const mailCount = 4; // infos?.mailInfos?.length || 0  这里按照4封信的间距来设置宽度
    let minWidth = 208;
    let aveWidth = minWidth;
    let gap = 16;
    let padding = 16;

    if (containerWidth > 0 && mailCount > 0) {
      aveWidth = (containerWidth - padding * 2 - (mailCount - 1) * gap) / mailCount;
    }
    aveWidth = Math.max(208, aveWidth);
    aveWidth = Math.min(aveWidth, 290);
    return aveWidth;
  };

  const BodyComp = () => {
    let aveWidth = getItemWidth();

    return (
      <div className={style.body} id={bodyId}>
        {infos?.mailInfos &&
          infos.mailInfos.length > 0 &&
          infos.mailInfos.map(item => {
            return GeneralBodyItem(item, infos.planInfo, (item.roundIndex || 1) - 1, aveWidth);
          })}
      </div>
    );
  };

  const PreviewModalComp = () => {
    return (
      <HostingResModal
        mailInfo={cloneDeep(selectedMailInfo)}
        oPlan={cloneDeep(infos?.planInfo)}
        onSave={originItem => {
          const item = cloneDeep(originItem);
          if (item?.oriPlan && (!item?.oriPlan?.aiResult || item.oriPlan.aiOn === false)) {
            item.oriPlan.aiOn = false;
          }
          if (selectedMailInfo) {
            selectedMailInfo.contentEditInfo = item?.oriPlan?.mailInfo;
          }
          insertMultiResultToDataIfNeeded(item?.oriPlan);
          basicInfoChanged(item?.modify);
          setPreviewVisiable(false);
        }}
        onClose={() => {
          setPreviewVisiable(false);
        }}
        visiable={previewVisiable}
      />
    );
  };

  return (
    <div className={style.basicInfo} style={containerWidth > 0 ? { width: containerWidth } : {}}>
      {HeaderComp()}
      {BodyComp()}
      {previewVisiable && PreviewModalComp()}
      {editorVisible && EditorModalComp()}
    </div>
  );
});
