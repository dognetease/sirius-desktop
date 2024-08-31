import React, { useState, useEffect } from 'react';
import { apis, apiHolder as api, DataTrackerApi, ProductTagEnum, ProductAuthApi, inWindow } from 'api';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { MailStatus, MailItemStatus, handleBackEnd } from '../../util';
import StatusModal from '../StatusModal';
import './index.scss';
import ProductAuthTag from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
import UpgradeMeansModal from '../UpgradeMeansModal/index';
import SuccessModal from '../UpgradeMeansModal/successModal';
import ProductVersion from '@/components/Electron/ProductVersion';
import { getIn18Text } from 'api';
const productAuthApi = api.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
interface Props {
  mid: string;
  fid: number;
  dataList: MailStatus;
  refreshData?(): void;
  content: any;
  tid?: string;
}
const Sticky: React.FC<Props> = ({ mid, fid, tid, content, dataList, refreshData }) => {
  const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
  const [visible, setVisible] = useState(false);
  const [readListData, setReadListData] = useState<MailStatus>();
  const [sendText, setSendText] = useState<string>('');
  // 升级弹窗
  const [upGradeVisible, setUpGradeVisible] = useState(false);
  // 留咨询成功
  const [successVisible, setSuccessVisible] = useState(false);
  const [productVisible, setProductVisible] = useState(false);
  const showStatusList = () => {
    if (dataList.data?.length) {
      setVisible(true);
      if (!readListData?.isrcl) {
        trackApi.track('pcMail_click_mailReadingState_readMailPage');
      }
    }
  };
  const onUpgradeModel = async () => {
    // const isOverTime = await productAuthApi.isOverTimeByPubClue();
    // isOverTime ? setUpGradeVisible(true) : setSuccessVisible(true);
    // setVisible(false);
    // setProductVisible(false);

    // 点击立即升级，跳转管理后台版本服务页
    handleBackEnd('/valueAdd/versionService', 'lingxioffice');
  };
  const onProductModal = () => {
    setProductVisible(true);
    setVisible(false);
  };

  const wordSeparator = inWindow() && window.systemLang === 'en' ? ' ' : '';

  useEffect(() => {
    const sucList: MailItemStatus[] = [];
    const failList: MailItemStatus[] = [];
    const readList: MailItemStatus[] = [];
    const unreadList: MailItemStatus[] = [];
    const unkownList: MailItemStatus[] = [];
    if (dataList) {
      setReadListData(dataList);
      if (dataList.data?.length) {
        dataList.data.map(item => {
          if (item.status == 'suc') {
            sucList.push(item);
          } else if (item.status == 'fail' || item?.rclResult === 9) {
            failList.push(item);
          } else if (item.status == 'read') {
            readList.push(item);
          } else if (item.status == 'unread') {
            unreadList.push(item);
          } else {
            unkownList.push(item);
          }
        });
        if (dataList.isrcl) {
          setSendText(
            `${getIn18Text('CHEHUICHENGGONG')}${wordSeparator}${sucList.length}${wordSeparator}${getIn18Text('REN')}${wordSeparator}${getIn18Text(
              'CHEHUISHIBAI'
            )}${wordSeparator}${failList.length}${wordSeparator}${getIn18Text('REN')}`
          );
        } else {
          // 未知当做未读处理
          setSendText(
            `${getIn18Text('YIDU')}${wordSeparator}${readList.length}${wordSeparator}${getIn18Text('REN')}，
                      ${getIn18Text('WEIDU')}${wordSeparator}${unreadList.length}${wordSeparator}${getIn18Text('REN')}，
                      ${getIn18Text('WEIZHI')}${wordSeparator}${unkownList.length}${wordSeparator}${getIn18Text('REN')}`
          );
          // setSendText(`已读${readList.length}人，未读${unreadList.length + unkownList.length}人`);
        }
      } else if (content.entry.rclStatus) {
        setSendText(getIn18Text('WUFACHAKANCHE'));
      } else if (content.entry.readStatus) {
        setSendText(getIn18Text('WUFACHAKANYUE'));
      } else {
        setSendText(getIn18Text('WUFACHAKANYOU'));
      }
    }
  }, [dataList]);
  return (
    <div
      onClick={e => {
        e.stopPropagation();
      }}
    >
      <div className="m-sticky">
        <ProductAuthTag
          tagName={ProductTagEnum.READ_STATUS_TRACK}
          tipText={getIn18Text('XIANSHITIYAN')}
          flowTipStyle={{ top: '-7px', left: 'calc(100% - 60px)', borderRadius: '0px 8px 0px 8px' }}
          className="m-sticky-product"
        >
          <div className="u-sticky">
            <div
              className="u-sticky-content"
              onClick={() => {
                showStatusList();
              }}
              hidden={!sendText}
              data-test-id="read-status-tip-panel"
            >
              <span className="u-sticky-title" hidden={!sendText}>
                {readListData?.isrcl ? getIn18Text('CHEHUIJIEGUO') : getIn18Text('YUEDUZHUANGTAI')}
              </span>
              <span className="u-sticky-list">{sendText}</span>
              <span className="u-sticky-icon dark-svg-invert" hidden={!dataList.data?.length}>
                <ReadListIcons.TriangleSvg />
              </span>
            </div>
          </div>
        </ProductAuthTag>
      </div>
      {visible ? (
        <StatusModal
          readListData={readListData}
          onClose={() => setVisible(false)}
          visible={visible}
          refreshData={refreshData}
          onUpgradeModel={onUpgradeModel}
          onProductModal={onProductModal}
          tid={tid}
          account={content._account}
        />
      ) : null}

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
      <ProductVersion
        productVisible={productVisible}
        onUpgradeModel={onUpgradeModel}
        cancelMed={() => {
          setProductVisible(false);
        }}
      />
    </div>
  );
};
export default Sticky;
