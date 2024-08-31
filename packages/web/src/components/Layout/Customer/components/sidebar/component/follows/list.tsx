/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-empty */
import classnames from 'classnames';
import React, { useContext, useState } from 'react';
import { Dropdown } from 'antd';
import moment from 'moment';
import { FollowsType, FollowAttachment, FollowGroupModel, IFollowModel } from 'api';
import IconCard from '@web-common/components/UI/IconCard';
import { getTrail } from '@web-disk/utils';
import { previewNosFile } from '../../../moments/upload';
import style from './follows.module.scss';
import { currencyMap } from '../../../../utils/utils';
import { EllipsisText } from '../../../ellipsisText/ellipsisText';
import { FollowContext } from '../../../moments/follows';
import { EmptyTips } from '../emptyTips';
import { getIn18Text } from 'api';
export enum FollowType {
  Follow = 0,
  SendMail = 1,
  RecieveMail = 2,
  Schedule = 3,
  NewOpportunity = 4,
  OpportunityStageChange = 5,
}
const typeMap: Record<number, string> = {
  [FollowType.SendMail]: getIn18Text('FAJIAN'),
  [FollowType.RecieveMail]: getIn18Text('SHOUJIAN'),
  [FollowType.Schedule]: getIn18Text('RICHENG'),
  [FollowType.Follow]: getIn18Text('GENJINJILU'),
  [FollowType.NewOpportunity]: getIn18Text('SHANGJI'),
  [FollowType.OpportunityStageChange]: getIn18Text('SHANGJI'),
};
interface FollowExtraModel {
  opportunityId: string;
  opportunityNumber: string;
  opportunityName: string;
  currency?: number;
  estimate?: string;
  stageName?: string;
  turnover?: string;
  dealAt?: number;
  oldStageName?: string;
}
export interface FollowsProps {
  id: string;
  type: FollowsType;
  options?: {
    autoOpen?: boolean;
  };
  visible: boolean;
  disabled?: boolean;
  readonly?: boolean;
  disabledText?: string;
  onSave?: () => void;
}
interface FollowGroupProps {
  groupName: string;
  data: IFollowModel[];
  opened: boolean;
  toggleOpen: (key: string) => void;
}
const parseFollow = (follow: IFollowModel, followSourceType: FollowsType) => {
  switch (follow.type) {
    case FollowType.SendMail: {
      return `我向${follow.contactName}发送：${follow.content}`;
    }
    case FollowType.RecieveMail: {
      return `${follow.contactName}向我发送：${follow.content}`;
    }
    case FollowType.Schedule: {
      const ret = [`新建日程：${follow.content}`];
      if (follow.extra && followSourceType === 'customer') {
        try {
          const extra: FollowExtraModel = JSON.parse(follow.extra);
          ret.push(`关联商机：${extra.opportunityNumber} ${extra?.opportunityName}`);
        } catch (e) {}
      }
      return ret;
    }
    case FollowType.NewOpportunity: {
      if (!follow.extra) return '';
      let extra: FollowExtraModel;
      try {
        extra = JSON.parse(follow.extra);
      } catch (e) {
        return '';
      }
      return [
        `新建商机：${extra?.opportunityNumber} ${extra?.opportunityName}`,
        extra?.estimate ? `预估商机金额：${extra.currency ? currencyMap[extra.currency] : ''} ${extra.estimate}` : '',
        `销售阶段：${extra?.stageName}`,
        extra?.turnover ? `成交金额：${extra.currency ? currencyMap[extra.currency] : ''} ${extra.turnover}` : '',
        extra?.dealAt ? `成交日期：${moment(extra.dealAt).format('YYYY-MM-DD HH:mm')}` : '',
      ].filter(i => !!i);
    }
    case FollowType.OpportunityStageChange: {
      if (!follow.extra) return '';
      let extra: FollowExtraModel;
      try {
        extra = JSON.parse(follow.extra);
      } catch (e) {
        return '';
      }
      return [`将商机：${extra?.opportunityNumber} ${extra?.opportunityName}`, `的销售阶段从 ${extra?.oldStageName || '-'} 变更为 ${extra?.stageName}`];
    }
    default: {
      const ret = [`新建跟进记录: ${follow.content}`];
      if (follow.extra && followSourceType === 'customer') {
        try {
          const extra: FollowExtraModel = JSON.parse(follow.extra);
          ret.push(`关联商机：${extra.opportunityNumber} ${extra?.opportunityName}`);
        } catch (e) {}
      }
      return ret;
    }
  }
};
const RemainOverlay = ({ attachments, onPreview }: { attachments: FollowAttachment[]; onPreview: (id: number) => void }) => (
  <div className={style.dropdownOverlay}>
    {attachments.map(a => {
      const fileType = getTrail(a.name);
      return (
        <div className={style.attachmentItem} onClick={() => onPreview(a.docId)} key={a.docId}>
          <span className={style.attachmentIcon}>
            <IconCard type={fileType as any} />
          </span>
          <div className={style.fileName}>{a.name}</div>
        </div>
      );
    })}
  </div>
);
const FollowItem = ({ followItem, onPreview }: { followItem: IFollowModel; onPreview: (id: number) => void }) => {
  const { type } = useContext(FollowContext);
  let attachmentList: FollowAttachment[] = [];
  try {
    if (followItem.attachment) {
      attachmentList = JSON.parse(followItem.attachment);
    }
    // eslint-disable-next-line no-empty
  } catch (e) {}
  const attachments = attachmentList.slice(0, 2);
  const remainAttachments = attachmentList.slice(2);
  const content = parseFollow(followItem, type);
  const contents = Array.isArray(content) ? content : [content];
  return (
    <div className={style.momentItem}>
      <i className={classnames([style.momentItemHead, `moment-item-${followItem.type}`])} />
      <div className={style.momentTitle}>
        <span className={style.followTime}>{typeMap[followItem.type]}</span>
        <span className={style.author}>
          <span style={{ marginRight: 8 }}>{followItem.follow_by}</span>
          <span>{moment(followItem.follow_at).format('MM-DD HH:mm')}</span>
        </span>
      </div>
      {/* <div className={style.momentType}>
        {typeMap[followItem.type]}
      </div> */}
      <div className={style.momentItemContent}>
        {contents.map(c => (
          <div>{c}</div>
        ))}
        {followItem.next_follow_at && (
          <div className={style.nextFollowTime}>
            {getIn18Text('XIACIGENJINSHIJIAN:')}
            {moment(followItem.next_follow_at).format('YYYY-MM-DD HH:mm')}
          </div>
        )}

        <div className={style.attachments}>
          {attachments.map(a => {
            const fileType = getTrail(a.name);
            return (
              <div className={style.attachmentItem} onClick={() => onPreview(a.docId)} key={a.docId}>
                <span className={style.attachmentIcon}>
                  <IconCard type={fileType as any} />
                </span>
                <EllipsisText text={a.name} footerLength={fileType.length} className={style.fileName} />
              </div>
            );
          })}
          {remainAttachments.length > 0 && (
            <Dropdown overlay={<RemainOverlay attachments={remainAttachments} onPreview={onPreview} />} placement="bottomRight">
              <div className={style.moreAttachment}>+{remainAttachments.length}</div>
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  );
};
const FollowGroup = ({ groupName, opened, toggleOpen, data }: FollowGroupProps) => {
  const { type, id: sourceId } = useContext(FollowContext);
  return (
    <div key={groupName} className={classnames([style.momentGroup, { [style.opened]: opened }])}>
      <div className={style.groupItem} onClick={() => toggleOpen(groupName)}>
        <span>{groupName}</span>
      </div>
      <div className={style.timeline}>
        <div className={style.dashedLine}>
          {data.map((item, index) => (
            <FollowItem
              followItem={item}
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              onPreview={id => previewNosFile(id, type, sourceId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
export const FollowList = ({ data }: { data?: FollowGroupModel[] }) => {
  const [openedKey, setOpenKey] = useState('');
  const toggleOpen = (key: string) => {
    setOpenKey(openedKey === key ? '' : key);
  };
  if (!data || !data.length) {
    return <EmptyTips text={getIn18Text('ZANWUDONGTAI')} />;
  }
  return (
    <div className={style.momentList}>
      {data.map(item => (
        <FollowGroup key={item.tag} groupName={item.tag} data={item.follow_info_list} opened={item.tag === openedKey} toggleOpen={toggleOpen} />
      ))}
    </div>
  );
};
