import React from 'react';
import { NoviceTaskTeamStatsRes, NoviceTaskTeamMemberStat, NoviceTaskStatus } from 'api';
import { ColumnsType } from 'antd/lib/table';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Table from '@web-common/components/UI/VirtualTable/VirtualTable';
import { ReactComponent as StatsNoticeIcon } from '@/images/icons/edm/taskCenter/stats-notice-icon.svg';
import { ReactComponent as CompleteIcon } from '@/images/icons/edm/taskCenter/novice-task-complete-icon.svg';
import { ReactComponent as IncompleteIcon } from '@/images/icons/edm/taskCenter/novice-task-incomplete-icon.svg';
import { getTransText } from '@/components/util/translate';
import style from './TeamStatsModal.module.scss';

interface TeamStatsModalProps {
  visible: boolean;
  loading: boolean;
  submitting: boolean;
  tasks: { taskId: string; taskName: string }[];
  stats: NoviceTaskTeamStatsRes;
  onOk: () => void;
  onCancel: () => void;
}

const TeamStatsModal: React.FC<TeamStatsModalProps> = props => {
  const { visible, loading, submitting, tasks, stats, onOk, onCancel } = props;

  const finishedCount = +stats.finishedCount;
  const totalCount = +stats.totalCount;
  const title = `${getTransText('TUANDUIRENWUWANCHENGLV')} ${finishedCount}/${totalCount}`;
  const isFinished = !!finishedCount && !!totalCount && finishedCount >= totalCount;

  const columns: ColumnsType<NoviceTaskTeamMemberStat> = [
    {
      className: style.columnMaxWidth,
      dataIndex: 'accountName',
      title: getTransText('YUANGONG'),
      fixed: 'left',
      width: 150,
      ellipsis: true,
    },
    ...tasks.map(task => ({
      dataIndex: `taskId-${task.taskId}`,
      title: task.taskName,
      width: 150,
      ellipsis: true,
      render: (_: any, memberStat: NoviceTaskTeamMemberStat) => {
        const memberTask = memberStat.taskInfo.find(item => item.taskId === task.taskId);
        const memberFinished = memberTask?.taskStatus === NoviceTaskStatus.COMPLETE;

        return memberFinished ? <CompleteIcon /> : <IncompleteIcon />;
      },
    })),
    {
      dataIndex: 'stat',
      title: getTransText('RENWUWANCHENGQINGKUANG'),
      fixed: 'right',
      width: 150,
      ellipsis: true,
      render: (_, memberStat) => `${memberStat.finishedCount}/${memberStat.totalCount}`,
    },
  ];

  return (
    <Modal
      className={style.teamStatsModal}
      width={664}
      title={title}
      visible={visible}
      okText={getTransText('TIJIAOQIYEXINXI')}
      okButtonProps={{
        disabled: !isFinished,
        loading: submitting,
      }}
      cancelButtonProps={{ style: { display: 'none' } }}
      onOk={() => isFinished && onOk()}
      onCancel={onCancel}
    >
      {isFinished && (
        <div className={style.notice}>
          <StatsNoticeIcon />
          <div className={style.description}>
            {getTransText('GONGXININWANCHENGSUOYOURENWUDIANJI')}
            500
            {getTransText('YUAN')}
            {getTransText('YOUHUIQUAN')}
          </div>
        </div>
      )}
      <Table
        className={style.stats}
        rowKey="accountId"
        loading={loading}
        columns={columns}
        dataSource={stats.teamTaskInfo || []}
        pagination={false}
        scroll={{ x: 'max-content', y: 400 }}
        rowHeight={46}
        autoSwitchRenderMode
        enableVirtualRenderCount={50}
      />
    </Modal>
  );
};

export default TeamStatsModal;
