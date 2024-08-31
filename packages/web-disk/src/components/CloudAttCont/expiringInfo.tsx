import React, { useState, useEffect, useMemo, useImperativeHandle } from 'react';
import ProductVersion from '@/components/Electron/ProductVersion';
import styles from './expiringInfo.module.scss';
import { ReactComponent as IconClose } from '@/images/icons/mail/icon-close1.svg';
import IconCard from '@web-common/components/UI/IconCard';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import { apiHolder as api, apis, NetStorageApi, ProductAuthApi } from 'api';
import UpgradeMeansModal from '@web-mail/components/UpgradeMeansModal';
import SuccessModal from '@web-mail/components/UpgradeMeansModal/successModal';
import { handleBackEnd } from '@web-mail/util';
import { getIn18Text } from 'api';

const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const productAuthApi = api.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
interface Props {
  checkExpiringAttsAction: () => void;
}

const ExpiringInfo = React.forwardRef(({ checkExpiringAttsAction }: Props, ref) => {
  const [expiringCount, setExpiringCount] = useState<number>(0);
  // 关闭按钮
  const [infoVis, setInfoVis] = useState<boolean>(true);
  const [productVisible, setProductVisible] = useState<boolean>(false);
  const [upGradeVisible, setUpGradeVisible] = useState(false); // 升级留咨弹窗
  const [successVisible, setSuccessVisible] = useState(false); // 留咨成功
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  const showInfo = useMemo(() => {
    // 非尊享版 + 存在过期文件 + UI上可见
    return productVersionId != 'sirius' && expiringCount > 0 && !!infoVis;
  }, [expiringCount, infoVis, productVersionId]);

  const fetchExpiringFileCount = async () => {
    try {
      const res = await diskApi.getExpiringFileCount();
      if (typeof res === 'number') {
        setExpiringCount(res);
      }
    } catch (err) {
      setInfoVis(false);
      console.log('获取一天内快过期云附件数量失败', err);
    }
  };

  const handleClose = () => setInfoVis(false);

  const checkExpiringAtts = () => {
    checkExpiringAttsAction();
  };

  const checkVersionDiff = () => {
    setProductVisible(true);
  };

  const cancelDiff = () => {
    setProductVisible(false);
  };

  const reFetchExpiringFileCount = () => {
    if (!infoVis) return;
    fetchExpiringFileCount();
  };

  const onUpgradeModel = async () => {
    // const isOverTime = await productAuthApi.isOverTimeByPubClue();
    // isOverTime ? setUpGradeVisible(true) : setSuccessVisible(true);
    // setProductVisible(false);
    // setProductVisible(false);

    // 点击立即升级，跳转管理后台版本服务页
    handleBackEnd('/valueAdd/versionService', 'lingxioffice');
  };

  useEffect(() => {
    fetchExpiringFileCount();
  }, []);

  useImperativeHandle(ref, () => ({
    reFetchExpiringFileCount,
  }));

  return showInfo ? (
    <>
      <div className={styles.expiringInfo}>
        <div className={styles.closeBtn} onClick={handleClose}>
          <IconClose />
        </div>
        <div className={styles.intro}>
          <IconCard type="warnYellow" class={styles.warn} />
          <span className={styles.text}>
            {getIn18Text('NIYOU')} {expiringCount}
            {getIn18Text('YITIANNEIGUOQI')}
          </span>
        </div>
        <div className={styles.funs}>
          <span className={styles.checkExpiringAtts} onClick={checkExpiringAtts}>
            {getIn18Text('CHAKANJIJIANGGUOQIYUNFUJIAN')}
          </span>
          <span className={styles.checkVersionDiff} onClick={checkVersionDiff}>
            {getIn18Text('CHAKANBANBENCHAYI')}
          </span>
        </div>
      </div>
      {/* 版本差异 + 升级 + 成功提示 */}
      <>
        <ProductVersion productVisible={productVisible} cancelMed={() => cancelDiff()} onUpgradeModel={onUpgradeModel} />
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
      </>
    </>
  ) : (
    <></>
  );
});

export default ExpiringInfo;
