import React, { FC, useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { ExcavateCompanyItem, getIn18Text } from 'api';
import { Alert } from 'antd';
import classnames from 'classnames';
// import { Checkbox } from '@web-common/components/UI/Checkbox';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import style from './index.module.scss';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { renderDataTagList } from '@/components/Layout/utils';

interface ZnCompanySelectProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (checkedId: string) => void;
  companyName: string;
  companyList: ExcavateCompanyItem[];
}

export const ZnCompanySelect: FC<ZnCompanySelectProps> = props => {
  const { visible, companyName, companyList, onClose, onConfirm } = props;
  const [checkedId, setCheckedId] = useState<string>(companyList[0]?.id);
  const renderStatus = useCallback((record: ExcavateCompanyItem) => {
    const { businessStatus, recommendLabel } = record;
    return (
      <>
        {renderDataTagList([
          {
            content: businessStatus,
            style: 'green',
          },
          {
            content: recommendLabel,
            style: 'blue',
          },
        ])}
      </>
    );
  }, []);
  const handleConfirm = useCallback(() => {
    onConfirm(checkedId);
  }, [checkedId, onConfirm]);

  const onCheck = useCallback(
    (newId: string) => () => {
      setCheckedId(newId);
    },
    []
  );
  useEffect(() => {
    setCheckedId(companyList[0]?.id);
  }, [companyList]);
  if (companyList.length === 0) return null;
  return (
    <Drawer visible={visible} onClose={onClose} getContainer={document.body}>
      <div className={style.headerTitle}>{getIn18Text('LURUXIANSUO')}</div>
      <div className={style.itemCompanyListBox}>
        <Alert message={`“${companyName}”所对应的国内企业信息，可能对应${companyList.length}家公司，请选择匹配的公司并录入`} type="info" />
        {companyList.map(item => (
          <div key={item.id} className={classnames(style.itemBox, { [style.checked]: checkedId === item.id })} onClick={onCheck(item.id)}>
            {item.chineseName && <div className={style.itemLogo}>{item.chineseName?.slice(0, 4)}</div>}
            {!!item.countryRegion && <div className={style.countryRegion}>{item.countryRegion}</div>}
            <div className={style.infoBoxleft}>
              <div className={style.flexBox}>
                <div>
                  {item.chineseName || '-'}
                  {renderStatus(item)}
                </div>
                <div className={style.infoText}>{}</div>
              </div>
              <div className={style.infoBox}>
                <div className={style.infoText}>
                  <div className={style.infoTextTop}>
                    <span>{`法定代表人：${item.legalPerson || '-'}`}</span>
                    <span>{`注册资本：${item.registeredCapital || '-'}`}</span>
                  </div>
                  <span>{`成立时间：${item.registerDate || '-'}`}</span>
                  <span style={{ marginLeft: '8px' }}>{Number(item.status || 0) === 1 ? `${item.contactCount || 0}个联系人` : ''}</span>
                </div>
                <Checkbox checked={checkedId === item.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={style.buttonGroup}>
        <Button onClick={onClose} btnType="minorGray">
          {getIn18Text('QUXIAO')}
        </Button>
        <Button onClick={handleConfirm} style={{ marginLeft: '12px' }} btnType="primary">
          {getIn18Text('QUEDING')}
        </Button>
      </div>
    </Drawer>
  );
};

export const showZnCompanySelect = (props: Omit<ZnCompanySelectProps, 'visible' | 'onClose'>) => {
  const { companyName, companyList, onConfirm } = props;
  const container = document.createElement('div');
  document.body.appendChild(container);

  const closeHandler = () => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  };
  const confirmHandler = (checkedId: string) => {
    closeHandler();
    onConfirm(checkedId);
  };
  ReactDOM.render(<ZnCompanySelect visible companyName={companyName} companyList={companyList} onClose={closeHandler} onConfirm={confirmHandler} />, container);
};
