import React from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { getTransText } from '@/components/util/translate';
import style from './AwardRulesModal.module.scss';

interface AwardRulesModalProps {
  visible: boolean;
  taskCount: number;
  onCancel: () => void;
}

const AwardRulesModal: React.FC<AwardRulesModalProps> = props => {
  const { visible, taskCount, onCancel } = props;

  const rules = [
    `${getTransText('XINSHOURENWUHUODONGGUIZE-1-1')}${taskCount}${getTransText('XINSHOURENWUHUODONGGUIZE-1-2')}`,
    getTransText('XINSHOURENWUHUODONGGUIZE-2'),
    getTransText('XINSHOURENWUHUODONGGUIZE-3'),
    getTransText('XINSHOURENWUHUODONGGUIZE-4'),
    getTransText('XINSHOURENWUHUODONGGUIZE-5'),
  ];

  return (
    <Modal title={getTransText('HUODONGGUIZE')} footer={null} visible={visible} onCancel={onCancel}>
      {rules.map((item, index) => {
        return (
          <div className={style.ruleItem} key={index}>
            {index + 1}. {item}
          </div>
        );
      })}
    </Modal>
  );
};

export default AwardRulesModal;
