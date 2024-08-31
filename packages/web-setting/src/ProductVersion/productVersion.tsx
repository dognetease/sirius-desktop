import React, { useState, useEffect, useCallback } from 'react';
import './productVersion.scss';
import { ProductAuthorityFeature, apis, apiHolder, ProductAuthApi } from 'api';
import { navigate } from 'gatsby';
import { comIsShowByAuth } from '@web-common/utils/utils';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import UpgradeMeansModal from '@web-mail/components/UpgradeMeansModal/index';
import SuccessModal from '@web-mail/components/UpgradeMeansModal/successModal';
import { Collapse, Button } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import DownArrowIcon from '@/images/icons/arrow-down-1.svg';
import UpArrowIcon from '@/images/icons/arrow-up-1.svg';
import FalseProductIcon from '@/images/icons/product_icon_false.svg';
import TrueProductIcon from '@/images/icons/product_icon_true.svg';
import { handleBackEnd } from '@web-mail/util';
import { getIn18Text } from 'api';

const { Panel } = Collapse;

const productAuthApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;

interface Props {
  isVisible?: boolean;
}
interface numberObj {
  [proppName: string]: any;
}
const openObj: numberObj = {};

const Product: React.FC<Props> = props => {
  const { isVisible = false } = props;
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  const [height, setHeight] = useState<number>(0);
  const [originData, setOriginData] = useState<Array<Record<string, any>>>([]);
  const [upGradeVisible, setUpGradeVisible] = useState(false); // 升级留咨弹窗
  const [successVisible, setSuccessVisible] = useState(false); // 留咨成功
  const [openPanel, setOpenPanel] = useState(openObj);

  const onUpgradeModel = async () => {
    // const isOverTime = await productAuthApi.isOverTimeByPubClue();
    // isOverTime ? setUpGradeVisible(true) : setSuccessVisible(true);

    // 点击立即升级，跳转管理后台版本服务页
    handleBackEnd('/valueAdd/versionService', 'lingxioffice');
  };
  useEffect(() => {
    productAuthApi
      .doGetProductTags()
      .then(res => {
        setOriginData(res.tags);
      })
      .catch(err => {
        message.error('获取版本信息失败');
      });
  }, []);

  useEffect(() => {
    originData.forEach((item, i) => {
      openObj[i] = false;
    });
    setOpenPanel(openObj);
  }, [originData]);

  // useEffect(() => {
  //   if (productVisible) {
  //     for (const i in openObj) {
  //       openObj[i] = false;
  //     }
  //     setOpenPanel(openObj);
  //   }
  // }, [productVisible]);
  const setDirectIcon = (direct: string, fun?: string) => {
    if (direct == null) {
      return <span></span>;
    }
    switch (direct) {
      case '0':
        return <img className="content-span-big" src={FalseProductIcon} alt="arrow-right" />;
      case '1':
        return <img className="content-span-big" src={TrueProductIcon} alt="arrow-right" />;
      default:
        const strArr = direct.split('-');
        if (strArr.length === 1) {
          return <span style={{ marginLeft: '4px' }}>{direct}</span>;
        } else {
          return (
            <>
              <span className="content-span-inline" style={{ marginTop: '4px' }}>
                {strArr[0]}
              </span>
              <span className="content-span-inline" style={{ marginLeft: '-9px' }}>
                {strArr[1]}
              </span>
            </>
          );
        }
    }
  };
  const renderTitle = (item, i) => (
    <div className="content">
      <span className="content-span content-span-func content-span-flex">
        {item.pFunc}
        {openPanel[i] ? (
          <img className="content-span-icon" src={UpArrowIcon} alt="arrow-right" />
        ) : (
          <img className="content-span-icon" src={DownArrowIcon} alt="arrow-right" />
        )}
      </span>
      {!openPanel[i] && (
        <>
          <span className="content-span">{setDirectIcon(item.pFree)}</span>
          <span className="content-span">{setDirectIcon(item.pPay)}</span>
          <span className="content-span">{setDirectIcon(item.pLingxi)}</span>
        </>
      )}
    </div>
  );
  const changeCollapse = (index, arr) => {
    if (arr.length == 0) {
      setOpenPanel({ ...openPanel, [index]: false });
    } else {
      setOpenPanel({ ...openPanel, [index]: true });
    }
  };
  return (
    <div className="product-version-setting" hidden={!isVisible}>
      <div className="config-title">
        <div className="config-title-name">{getIn18Text('FUWUTAOCAN')}</div>
        <div onClick={() => navigate(-1)} className="config-title-icon" />
      </div>
      {productVersionId !== 'sirius' && <div className="product-update">{getIn18Text('LIANXININDEZHUAN')}</div>}
      <div className="product-warp" style={{ paddingBottom: productVersionId === 'sirius' ? '24px' : '0px' }}>
        <div className="content title">
          <span className="content-span content-span-flex">{getIn18Text('GONGNENG')}</span>

          <span className="content-span">
            {getIn18Text('MIANFEIBAN')}
            {productVersionId === 'free' && <span className="content-span-tag">{getIn18Text('DANGQIANBANBEN')}</span>}
          </span>
          <span className="content-span">
            {getIn18Text('QIJIANBAN')}
            {productVersionId === 'ultimate' && <span className="content-span-tag">{getIn18Text('DANGQIANBANBEN')}</span>}
          </span>
          <span className="content-span">
            {getIn18Text('ZUNXIANGBAN')}
            {productVersionId === 'sirius' && <span className="content-span-tag">{getIn18Text('DANGQIANBANBEN')}</span>}
          </span>
        </div>
        <div className="version-warp-content">
          {originData.map((json, i) => (
            <Collapse className="content-collapse" onChange={changeCollapse.bind(this, i)}>
              <Panel showArrow={false} header={renderTitle(json, i)} key={i} className="site-collapse-custom-panel">
                {json.children.map((item, j) => (
                  <>
                    <div className={`content ${j % 2 == 0 ? 'content-row' : null}`} key={j}>
                      <span className="content-span content-span-font content-span-flex">
                        {/* {item.func} */}
                        <span>
                          {item.func}
                          {item.titleInfo && <span style={{ color: 'rgba(168, 170, 173, 1)', paddingLeft: '4px' }}>({item.titleInfo})</span>}
                        </span>
                      </span>
                      <span className="content-span content-span-font">{setDirectIcon(item.free, item.func)}</span>
                      <span className="content-span content-span-font">{setDirectIcon(item.pay, item.func)}</span>
                      <span className="content-span content-span-font">{setDirectIcon(item.lingxi, item.func)}</span>
                    </div>
                  </>
                ))}
              </Panel>
            </Collapse>
          ))}
        </div>
        {productVersionId !== 'sirius' ? (
          <div className="product-footer">
            {/* <Button onClick={cancelMed}>{getIn18Text('ZHIDAOLE')}</Button> */}
            {comIsShowByAuth(
              ProductAuthorityFeature.ADMIN_SITE_ENTRANCE_SHOW,
              <Button type="primary" style={{ marginLeft: '12px' }} onClick={onUpgradeModel}>
                {getIn18Text('TAOCANSHENGJI')}
              </Button>
            )}
          </div>
        ) : null}
      </div>
      <UpgradeMeansModal
        visible={upGradeVisible}
        onClose={showSuccess => {
          showSuccess && setSuccessVisible(true);
          setUpGradeVisible(false);
        }}
      />
      <SuccessModal
        visible={successVisible}
        onClose={() => {
          setSuccessVisible(false);
        }}
      />
    </div>
  );
};
export default Product;
