import React, { FC } from 'react';
import ReactDOM from 'react-dom';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { getIn18Text } from 'api';
import CheckCircleFilled from '@ant-design/icons/CheckCircleFilled';

interface FilterResultModalProps {
  onConfirm: () => void;
}

const FilterResultModal: FC<FilterResultModalProps> = ({ onConfirm }) => (
  <SiriusModal visible footer={null} closable={false} width={476} bodyStyle={{ textAlign: 'center' }}>
    <div>
      <div style={{ margin: '14px 0px', color: '#262A33', fontSize: '16px', fontWeight: '500' }}>
        <CheckCircleFilled style={{ color: '#5FC375', marginRight: 6 }} />
        {getIn18Text('GUOLVWANCHENG')}
      </div>
      <div style={{ color: '#7D8085', marginBottom: '20px' }}>
        {' '}
        {getIn18Text('YIGUOLV')}
        <span style={{ color: 'rgba(247, 79, 79, 1)' }}>0</span>
        {getIn18Text('GEWUXIAODEZHI')}
      </div>
      <div style={{ display: 'flex', justifyContent: 'end' }}>
        <Button btnType="primary" onClick={() => onConfirm()}>
          {getIn18Text('QUEDING')}
        </Button>
      </div>
    </div>
  </SiriusModal>
);

export const showFilterResultModal = (props: FilterResultModalProps) => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const confirmHandler = () => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
    props.onConfirm();
  };
  ReactDOM.render(<FilterResultModal onConfirm={confirmHandler} />, container);
};
