/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-empty */
import classnames from 'classnames';
import React, { useContext, useEffect, useImperativeHandle, useState } from 'react';
import { Dropdown } from 'antd';
import moment from 'moment';
import { apiHolder, apis, CustomerApi, FollowsType, FollowAttachment, FollowGroupModel, IFollowModel, ResponseFollowList } from 'api';
import ArrowRight from '@web-common/components/UI/Icons/svgs/disk/ArrowRight';

import IconCard from '@web-common/components/UI/IconCard';
import { getTrail } from '@web-disk/utils';
import { EllipsisText } from '../ellipsisText/ellipsisText';
import { previewNosFile } from './upload';
import { FollowEditor } from './followEditor';

import style from './follows.module.scss';
import { currencyMap } from '../../utils/utils';
import Select from '../UI/Select/customerSelect';
import { getIn18Text } from 'api';

const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

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
  [FollowType.OpportunityStageChange]: '',
};

const selectMap = [
  {
    value: 2,
    label: getIn18Text('SHOUJIAN'),
  },
  {
    value: 1,
    label: getIn18Text('FAJIAN'),
  },
  {
    value: 0,
    label: getIn18Text('GENJINJILU'),
  },
  {
    value: 3,
    label: getIn18Text('RICHENG'),
  },
];

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
  options?: { autoOpen?: boolean };
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

export const FollowContext = React.createContext({
  visible: false,
  id: '',
  type: 'customer' as FollowsType,
});

export const FollowList = ({ data, followTypeChange }: { data?: FollowGroupModel[]; followTypeChange: (type: number[]) => void }) => {
  const [openedKey, setOpenKey] = useState('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const toggleOpen = (key: string) => {
    setOpenKey(openedKey === key ? '' : key);
  };

  if (!data) {
    return null;
  }

  return (
    <>
      <div className={style.momentSummary}>
        <span>
          {' '}
          {getIn18Text('GONG')}
          {data.length}
          {getIn18Text('TIAO')}
        </span>
        <Select
          placeholder={getIn18Text('QINGXUANZELEIXING')}
          showArrow={true}
          mode="multiple"
          allowClear={true}
          maxTagCount={'responsive'}
          onDropdownVisibleChange={open => {
            setIsOpen(open);
          }}
          style={{ width: 108, marginRight: '8px', verticalAlign: 'top' }}
          onChange={e => followTypeChange(e as number[])}
          getPopupContainer={() => document?.body}
        >
          {selectMap.map((el, elIndex) => {
            return (
              <Select.Option key={elIndex} value={el.value}>
                {el.label}
              </Select.Option>
            );
          })}
        </Select>
      </div>
      <div className={style.momentList}>
        {data.map(item => (
          <FollowGroup key={item.tag} groupName={item.tag} data={item.follow_info_list} opened={item.tag === openedKey} toggleOpen={toggleOpen} />
        ))}
      </div>
    </>
  );
};
const FollowGroup = ({ groupName, opened, toggleOpen, data }: FollowGroupProps) => {
  const { type, id: sourceId } = useContext(FollowContext);
  return (
    <div key={groupName} className={classnames([style.momentGroup, { [style.opened]: opened }])}>
      <div className={style.groupItem} onClick={() => toggleOpen(groupName)}>
        <span>{groupName}</span>
        <span className={style.secondColor}>（{data.length}）</span>
        <span role="img" className={style.openIcon}>
          <ArrowRight />
        </span>
      </div>
      {opened && (
        <div className={style.timeline}>
          <div className={style.dashedLine}>
            {data.map((item, index) => (
              <FollowItem followItem={item} key={index} onPreview={id => previewNosFile(id, type, sourceId)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
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
        {typeMap[followItem.type]}
        <span className={classnames([style.fr, style.secondColor])}>{moment(followItem.follow_at).format('MM-DD HH:mm')}</span>
      </div>
      <div className={style.momentItemContent}>
        {contents.map(c => (
          <div>{c}</div>
        ))}
      </div>
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
          <Dropdown overlay={<RemainOverlay attachments={remainAttachments} />} placement="bottomRight">
            <div className={style.moreAttachment}>+{remainAttachments.length}</div>
          </Dropdown>
        )}
      </div>
    </div>
  );
};
const RemainOverlay = (
  {
    attachments,
  }: {
    attachments: FollowAttachment[];
  },
  onPreview: (id: number) => void
) => (
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
export const parseFollow = (follow: IFollowModel, followSourceType: FollowsType) => {
  switch (follow.type) {
    case FollowType.SendMail: {
      return `我向${follow.contactName}发送：${follow.content}`;
    }
    case FollowType.RecieveMail: {
      return `${follow.contactName}向我发送：${follow.content}`;
    }
    case FollowType.Schedule: {
      const ret = [`${follow.follow_by || ''}新建日程：${follow.content}`];
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
        `${follow.follow_by || ''}新建商机：${extra?.opportunityNumber} ${extra?.opportunityName}`,
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
      return [
        `${follow.follow_by || ''}把商机：${extra?.opportunityNumber} ${extra?.opportunityName}`,
        `的销售阶段从 ${extra?.oldStageName || '-'} 变更为 ${extra?.stageName}`,
      ];
    }
    default: {
      const ret = [`${follow.follow_by || ''}新建跟进记录: ${follow.content}`];
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
export const Follows = React.forwardRef((props: FollowsProps, ref) => {
  const { id, visible, onSave, options, type, disabled, readonly, disabledText } = props;
  const [list, setList] = useState<ResponseFollowList>();
  const [followType, setFollowType] = useState<number[]>([]);
  const fetchData = (id: string, type: FollowsType) => {
    customerApi
      .getFollowList({
        id,
        type,
        follow_type_list: followType,
      })
      .then(data => {
        setList(data);
      });
  };
  useEffect(() => {
    if (visible && id) {
      fetchData(id, type);
    }
  }, [id, visible, type, followType]);
  const followTypeChange = (type: number[]) => {
    setFollowType(type);
  };
  useImperativeHandle(ref, () => ({
    refresh() {
      fetchData(id, type);
    },
  }));
  return (
    <FollowContext.Provider value={{ visible, id, type }}>
      <div className={style.momentWrap}>
        {
          // eslint-disable-next-line no-nested-ternary
          disabled ? (
            <div className={style.disabledText}>{disabledText}</div>
          ) : !readonly ? (
            <FollowEditor
              onSave={() => {
                fetchData(id, type);
                onSave && onSave();
              }}
              options={options}
            />
          ) : null
        }
        <FollowList key={id} data={list?.follow_list} followTypeChange={followTypeChange} />
      </div>
    </FollowContext.Provider>
  );
});
Follows.defaultProps = {
  disabledText: getIn18Text('YIZHUANWEIKEHU\uFF0CKEDAOKEHUXIANGQINGYETIANXIEGENJIN\u3002'),
};
