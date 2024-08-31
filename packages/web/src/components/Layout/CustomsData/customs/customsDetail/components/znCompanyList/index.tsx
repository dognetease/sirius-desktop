import React, { CSSProperties, useContext, useEffect, useState } from 'react';
import { ExcavateCompanyItem, apis, apiHolder, EdmCustomsApi } from 'api';
import { Alert, Button } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import style from './index.module.scss';
import ZnCompanyDetail from '../znCompanyDetail';
import { renderDataTagList } from '@/components/Layout/utils';
import { ForwarderContext } from '../../../ForwarderSearch/context/forwarder';
import { isReachTheLimit } from '../../../utils';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
interface ZnCompanyListProps {
  originCompanyName: string;
  country: string;
  companyName: string;
  className?: string;
  onZnCompanyListChange?: (list: ExcavateCompanyItem[]) => void;
  style?: CSSProperties;
}

export default (props: ZnCompanyListProps) => {
  const { originCompanyName, country, companyName, className, onZnCompanyListChange, style: innerStyle } = props;
  const [companyListIndex, changeIndex] = useState<number>(0);
  const [visible, changeVisible] = useState<boolean>(false);
  const [viewMore, changeMore] = useState<boolean>(false);
  const [detailId, setZnID] = useState<string>('');
  const [companyList, setCompanyList] = useState<ExcavateCompanyItem[]>([]);
  const [_, dispatch] = useContext(ForwarderContext);
  useEffect(() => {
    getZnCompanyRelationList();
  }, [originCompanyName, country]);

  async function getZnCompanyRelationList() {
    if (originCompanyName && country) {
      const res = await edmCustomsApi.doGetExcavateCompanyList({ companyName: originCompanyName, country });
      setCompanyList(res);
      onZnCompanyListChange?.(res);
    }
  }

  const handleDetailOpen = async (item: ExcavateCompanyItem, index: number) => {
    if (Number(item?.status || 0) !== 1) {
      const res = await edmCustomsApi.doGetUserQuota();
      if (isReachTheLimit(res)) {
        message.warning({ content: '当前国内企业查询额度不足，无法深挖联系人' });
        return;
      }
    }
    setZnID(item?.id || '');
    changeIndex(index);
    changeVisible(true);
  };
  const renderStatus = (record: ExcavateCompanyItem) => {
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
  };

  const handleExcavated = (item: ExcavateCompanyItem) => {
    dispatch({
      type: 'CHANGE',
      payload: {
        chineseCompanyId: item.id,
        companyName: originCompanyName,
        country,
        chineseCompanyContactCount: item.contactCount,
      },
    });
  };

  if (companyList.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className={style.itemCompanyListBox} style={innerStyle}>
        <header>相似国内公司</header>
        <Alert message="已为您匹配到可能的企业，可继续深挖联系人" type="info" showIcon closable />
        {companyList.map((item, index) => {
          const btnText = Number(item?.status) === 1 ? `${item?.contactCount}个联系人` : '深挖联系人'; //status 0:未挖掘，1：已挖掘
          const btnType = Number(item?.status) === 1 ? true : false;
          return (
            <div key={index} className={style.itemBox} hidden={viewMore ? !viewMore : Boolean(index)}>
              {item?.chineseName && <div className={style.itemLogo}>{item?.chineseName?.slice(0, 4)}</div>}
              {!!item.countryRegion && <div className={style.countryRegion}>{item.countryRegion}</div>}
              <div className={style.infoBoxleft}>
                <div className={style.flexBox}>
                  <div>
                    {item?.chineseName || '-'} {renderStatus(item)}
                  </div>
                  <div className={style.infoText}>{}</div>
                </div>
                <div className={style.infoBox}>
                  <div className={style.infoText}>
                    <div className={style.infoTextTop}>
                      <span>法定代表人：{item?.legalPerson || '-'}</span>
                      <span>注册资本：{item?.registeredCapital || '-'}</span>
                    </div>
                    <span>成立时间：{item?.registerDate || '-'}</span>
                  </div>
                  <div>
                    <Button style={{ background: '#4c6aff', color: '#fff' }} type="primary" ghost={btnType} onClick={() => handleDetailOpen(item, index)}>
                      {btnText}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {companyList.length > 1 && (
          <div className={style.moreStyle} onClick={() => changeMore(true)} hidden={viewMore}>
            <span>查看更多相似企业</span>
          </div>
        )}
        {visible && (
          <ZnCompanyDetail
            onExcavated={handleExcavated}
            detailId={detailId}
            companyListIndex={companyListIndex}
            visible={visible}
            companyList={companyList}
            changeVisible={changeVisible}
            companyName={companyName}
            setZnID={setZnID}
            changeIndex={changeIndex}
            getZnCompanyRelationList={getZnCompanyRelationList}
          />
        )}
      </div>
    </div>
  );
};
