import { getIn18Text } from 'api';
import React, { useCallback, useMemo } from 'react';
import { SnsMarketingState } from 'api';
import { Descriptions } from 'antd';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
// import Tooltip from '@web-common/components/ui/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { AvatarList } from '../../marketingTask/list/avatarList';
import style from './style.module.scss';

interface Props {
  data: SnsMarketingState.TaskStateRes;
}

const tagTypeMap: Record<string, string> = {
  RUNNING: 'label-2-1',
  START: 'label-2-1',
  PAUSE: 'label-5-1',
  FINISH: 'label-4-1',
};

const TaskStatusMap: Record<string, string> = {
  DRAFT: getIn18Text('CAOGAO'),
  GENERATING: getIn18Text('TIEZISHENGCHENGZHONG'),
  FINISH_GENERATE: getIn18Text('TIEZISHENGCHENGWANCHENG'),
  START: getIn18Text('JINXINGZHONG'),
  RUNNING: getIn18Text('JINXINGZHONG'),
  PAUSE: getIn18Text('YIZANTING'),
  FINISH: getIn18Text('YIWANCHENG'),
};

export const BaseInfo: React.FC<Props> = props => {
  const { data } = props;
  const renderTag = useCallback(() => {
    const { status } = props.data;
    const tagType = tagTypeMap[status] || 'label-6-1';
    return (
      <Tag type={tagType as any} hideBorder width={status === 'GENERATING' || status === 'FINISH_GENERATE' ? undefined : 48}>
        {TaskStatusMap[status]}
      </Tag>
    );
  }, [props.data]);

  const goods = useMemo(() => {
    const { goods = [] } = props.data || {};
    if (!goods?.length) {
      return '--';
    }
    return goods.map(good => good.name).join(',');
  }, [props.data]);

  const parseDate = useCallback((t: number | string, format = 'YYYY-MM-DD') => {
    if (!t) {
      return '--';
    }
    return moment(t).format(format);
  }, []);

  return (
    <div className={style.wrapper}>
      <Descriptions title={getIn18Text('RENWUXIANGQING')}>
        <Descriptions.Item label={<span className={style.taskName}>{data.taskName}</span>}>
          <span className={style.tags}>{renderTag()}</span>
        </Descriptions.Item>
        <Descriptions.Item label={getIn18Text('FASONGZHANGHAO：')}>
          <AvatarList accounts={data.accounts || []}></AvatarList>
        </Descriptions.Item>
        <Descriptions.Item label={getIn18Text('CHUANGJIANREN：')}>{data.creatorName}</Descriptions.Item>
        <Descriptions.Item label={getIn18Text('SHOUCIFATIESHIJIAN：')}>{parseDate(data.firstSendPostTime)}</Descriptions.Item>
        <Descriptions.Item label={getIn18Text('FASONGZHOUQI：')}>
          {parseDate(data.startTime)} ~ {parseDate(data.endTime)}
        </Descriptions.Item>
        <Descriptions.Item label={getIn18Text('CHUANGJIANSHIJIAN：')}>{parseDate(data.createTime)}</Descriptions.Item>
        <Descriptions.Item label={getIn18Text('SUOXUANXINGYE：')}>{data.industry}</Descriptions.Item>
        <Descriptions.Item label={getIn18Text('SUOXUANSHANGPIN：')}>
          <div className={style.ellipise}>
            <Tooltip title={goods} placement="bottom" autoAdjustOverflow>
              {goods}
            </Tooltip>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label={getIn18Text('GONGSIJIESHAO：')}>
          <div className={style.ellipise}>
            <Tooltip title={data.companyProfile} autoAdjustOverflow placement="bottom">
              {data.companyProfile}
            </Tooltip>
          </div>
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
};
