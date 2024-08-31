/* eslint-disable react/destructuring-assignment */
import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import style from './style.module.scss';
import EdmProductPic from '@/images/icons/edm/edm-product-pic.png';
import EdmProductTable from '@/images/icons/edm/edm-product-table.png';
import { getIn18Text } from 'api';

interface ModalProps {
  visible: boolean;
  onClose?: () => void;
  container?: string;
}

export const ProductSampleModal = (props: ModalProps) => {
  // 这个组件在营销和普通邮件的插入商品信息中共用， 所以需要区分一个modal的container
  const { container } = props;
  const tabs = [getIn18Text('TUWENSHILI'), getIn18Text('BIAOGESHILI')];
  const [currentTab, setCurrentTab] = useState(0);
  return (
    <SiriusHtmlModal
      title={getIn18Text('SHANGPINSHILI')}
      width={545}
      maskClosable={false}
      visible={props.visible}
      className={style.productSampleModal}
      onCancel={props.onClose}
      getContainer={container || '#edm-write-root'}
      zIndex={9999}
    >
      <div className={style.step}>
        {tabs.map((text, i) => (
          <div
            className={`${style.stepItem} ${currentTab === i ? style.stepActive : ''}`}
            key={i}
            onClick={() => {
              setCurrentTab(i);
            }}
          >
            <span className={style.stepName}>{text}</span>
          </div>
        ))}
      </div>
      {currentTab === 0 && (
        <>
          <div className={style.description}>
            {getIn18Text('SHANGPINYITUWENXINGSHI')}
            <br />
            {getIn18Text('XITONGTONGSHIHUIJILU')}
          </div>
          <img className={style.sampleImg} width={497} height={362} src={EdmProductPic} />
        </>
      )}
      {currentTab === 1 && (
        <>
          <div className={style.description}>
            {getIn18Text('SHANGPINYIBIAOGEXINGSHI')}
            <br />
            {getIn18Text('XITONGTONGSHIHUIJILU')}
          </div>
          <img className={style.sampleImg} width={497} height={362} src={EdmProductTable} />
        </>
      )}
      <Button
        className={style.backBtn}
        type="primary"
        onClick={() => {
          props.onClose && props.onClose();
        }}
      >
        {getIn18Text('ZHIDAOLE')}
      </Button>
    </SiriusHtmlModal>
  );
};
