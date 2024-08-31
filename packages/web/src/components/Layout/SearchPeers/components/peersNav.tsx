import React, { useMemo, useState } from 'react';
import { Breadcrumb, Checkbox, Skeleton } from 'antd';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import { getIn18Text } from 'api';
import style from '../index.module.scss';

interface Prop {
  setInitLayout: () => void;
}

const PeersNav: React.FC<Prop> = ({ setInitLayout }) => {
  return (
    <Breadcrumb className={style.bread} separator={<SeparatorSvg />}>
      <Breadcrumb.Item>
        <a
          href="javascript:void(0)"
          onClick={e => {
            e.preventDefault();
            setInitLayout();
          }}
        >
          <span>货代同行</span>
        </a>
      </Breadcrumb.Item>
      <Breadcrumb.Item>
        <span>企业列表</span>
      </Breadcrumb.Item>
    </Breadcrumb>
  );
};

export default PeersNav;
