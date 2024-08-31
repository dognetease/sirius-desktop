import React, { useEffect, useState } from 'react';
import { getIn18Text } from 'api';
import { apiHolder, DataStoreApi } from 'api';
import { ModalProps } from 'antd/lib/modal/Modal';
import { Modal, Button, Divider } from 'antd';
import './format.scss';
interface Props {
  showMfEdit: (url?: string) => void;
  url: string;
  id: string;
}
const ModalImg: React.FC<Props> = props => {
  const { showMfEdit, url, id } = props;
  const [active, setActive] = useState(false);
  const handleMouseEnter = () => {
    setActive(true);
  };
  const handleMouseLeave = () => {
    setActive(false);
  };
  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className={`mf-img-wrap  ${active ? 'active' : ''}`}>
      {/* <img className="mf-img" src={url} alt="" /> */}
      <div className="mf-bg-img" style={{ backgroundImage: `url(${url})` }} />
      <div className="mf-img-oper-wrap">
        <div className="img-oper">
          <Button
            type="primary"
            onClick={() => {
              showMfEdit(id);
            }}
          >
            {getIn18Text('SHIYONG')}
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ModalImg;
