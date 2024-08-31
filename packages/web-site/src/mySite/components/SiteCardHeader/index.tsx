import React, { useState, useMemo, useRef } from 'react';
import { Dropdown, Menu, message, Tooltip, Divider, Popover } from 'antd';
import { ReactComponent as TongyongCuowuTishiMainChengse } from '../../../images/TongyongCuowuTishiMainChengse.svg';
import { ReactComponent as ChengGong } from '../../../images/ChengGong.svg';
import { navigate } from '@reach/router';
import dayjs from 'dayjs';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { STATUS_LABEL, STATUS_ENUM, DROPDOWN_OPTIONS } from '@web-site/mySite/constants';
import { apis, api, apiHolder, DataTrackerApi, SiteApi, getIn18Text } from 'api';
import { ReactComponent as CaretDownOutlined } from '../../../images/down-arrow.svg';
import { ReactComponent as Copy } from '../../../images/copy.svg';
import StatusTag from '../StatusTag';
import styles from './index.module.scss';
import { useOpenHelpCenter } from '@web-common/utils/utils';
import { CustomDomain } from '@web-site/mySite';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';

interface SiteCardHeaderProps {
  title: string;
  siteId: string;
  siteName: string;
  host: string;
  indexUrl: string;
  pageId: string;
  status: keyof typeof STATUS_LABEL;
  editDay: string;
  siteBindDomainList?: CustomDomain[];
  isIndex: boolean;
  haveSite: boolean;
  isCustomSite: boolean;
  outerKey?: string;
  icon?: string;
  isAddCert: boolean;
  isAddSeoConfig: boolean;
  isBindDomain: boolean;
  onChooseTemplate: (status: string, siteId: string) => void;
  deleteSite: (siteId: string) => void;
  offlineSite: (siteId: string) => void;
  addProduct: () => void;
  openRename: (siteId: string, siteName: string, icon?: string) => void;
  openBindAnalysis: (siteId: string) => void;
  productServiceDTO?: Record<string, string>;
  openServiceModal: (productServiceDTO?: Record<string, string>) => void;
  onFreeConsule: () => void;
  openHttpsModal: (domainInfo: CustomDomain, siteId: string, domainList: CustomDomain[]) => void;
}

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

const copy = (text: string) => {
  if (!text) {
    return;
  }
  let input = document.createElement('input');
  input.style.position = 'fixed';
  input.style.top = '-99px';
  document.body.appendChild(input);
  input.value = text;
  input.select();
  document.execCommand('copy');
  input.remove();
  message.success('复制成功');
};

enum SiteOptimizItemTypes {
  bindDomain = '0',
  addCert = '1',
  addSeoConfig = '2',
}
const SiteConfigOptimizationPanel: React.FC<{
  handleItemClick: (type: SiteOptimizItemTypes) => void;
  isAddCert: boolean;
  isAddSeoConfig: boolean;
  isBindDomain: boolean;
}> = props => {
  const { isAddCert, isAddSeoConfig, isBindDomain } = props;
  const options = useMemo(() => {
    const list = [];
    if (!isBindDomain) {
      list.push({
        title: '修改自定义域名',
        subTitle: '保证网站独特性质，提升品牌形象',
        btnText: '去配置',
        key: SiteOptimizItemTypes.bindDomain,
      });
    }
    if (!isAddCert) {
      list.push({
        title: '证书配置',
        subTitle: '保证网站的信息和数据安全',
        btnText: '去配置',
        key: SiteOptimizItemTypes.addCert,
      });
    }
    if (!isAddSeoConfig) {
      list.push({
        title: 'SEO优化',
        subTitle: '保证搜索引擎对网站的收录，客户可搜索到网站',
        btnText: '去优化',
        key: SiteOptimizItemTypes.addSeoConfig,
      });
    }
    return list;
  }, [isAddCert, isAddSeoConfig, isBindDomain]);

  return (
    <div className={styles.siteConfigOptimizationPanel}>
      <div className={styles.header}>完成以下操作，提升网站专业性</div>
      <div className={styles.container}>
        {options.map(item => (
          <div className={styles.item}>
            <div className={styles.left}>
              <div className={styles.title}>
                <ChengGong />
                {item.title}
              </div>
              <div className={styles.subTitle}>{item.subTitle}</div>
            </div>
            <div className={styles.right}>
              <Button size="small" onClick={() => props.handleItemClick(item.key)}>
                {item.btnText}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SiteCardHeader: React.FC<SiteCardHeaderProps> = props => {
  let {
    siteId,
    siteName,
    host,
    title,
    status,
    editDay,
    isIndex,
    haveSite,
    indexUrl,
    siteBindDomainList,
    pageId,
    isCustomSite,
    outerKey,
    icon,
    isAddCert,
    isAddSeoConfig,
    isBindDomain,
    deleteSite,
    offlineSite,
    openRename,
    addProduct,
    onChooseTemplate,
    openBindAnalysis,
    productServiceDTO,
    openServiceModal,
    onFreeConsule,
    openHttpsModal,
  } = props;

  const popupContainer = useRef<HTMLDivElement>(null);
  const openHelpCenter = useOpenHelpCenter();

  const isOnline = useMemo(() => {
    return status === STATUS_ENUM.ONLINE;
  }, [status]);

  const domainList = siteBindDomainList?.filter(d => d.domainStatus > 3); // 已生效的域名
  const customDomain = domainList?.[0];
  indexUrl = customDomain ? customDomain.customIndexUrl : indexUrl;
  // 如果不存在已生效的域名，并且存在检测完成的域名，提示 “域名已生成，继续配置 >”
  const isChecking = !customDomain && siteBindDomainList?.some(d => d.domainStatus == 3);

  const goDomainBind = () => {
    navigate(`#site?page=domain&siteId=${siteId}&host=${host}&siteName=${encodeURIComponent(siteName)}`);
  };

  const [showSelectModal, setShowSelectModal] = useState(false);
  const [domainSelectOptions, setDomainSelectOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedDomain, setSelectedDomain] = useState('');

  const closeSelectModal = () => {
    setShowSelectModal(false);
  };

  const goDomainReord = (domain: string) => {
    navigate(`#site?page=recordDomain&domain=${domain}&siteName=${encodeURIComponent(siteName)}`);
  };

  const handleSeoConfig = () => {
    if (customDomain && isAddCert) {
      navigate(`#site?page=seo&siteId=${siteId}&pageId=${pageId}`);
    } else {
      SiriusModal.confirm({
        title: '未绑定域名及配置证书的站点无法配置SEO',
        content: '请先修改站点域名，再配置站点证书，然后再进行SEO配置。',
        okText: !isBindDomain ? '修改域名' : !isAddCert ? '配置证书' : '',
        cancelText: getIn18Text('SITE_ZHIDAOLE'),
        onOk: !isBindDomain
          ? goDomainBind
          : !isAddCert
          ? () => {
              openHttpsModal(customDomain!, siteId, domainList ?? []);
            }
          : () => {},
        className: styles.confirm,
      });
    }
  };

  const handleHttpsConfig = () => {
    if (customDomain) {
      openHttpsModal(customDomain!, siteId, domainList);
    } else {
      SiriusModal.confirm({
        title: '修改域名生效后才能配置HTTPS',
        content: '请先修改站点域名，然后再进行证书配置。',
        okText: getIn18Text('SITE_QUXIUGAI'),
        cancelText: getIn18Text('QUXIAO'),
        onOk: goDomainBind,
        className: styles.confirm,
      });
    }
  };

  /**
   * 切换操作
   * @param value
   * @param siteId
   * @param siteName
   */
  const handleSelectOperate = (value: string, siteId: string, siteName: string, host: string): void => {
    switch (value) {
      case 'delete':
        SiriusModal.confirm({
          title: '确定要删除吗？',
          content: '站点删除后，下属的页面和数据将无法查看。',
          okText: '确定',
          cancelText: '取消',
          onOk: () => deleteSite(siteId),
          className: styles.confirm,
        });
        trackApi.track('site_delete_winshow');
        break;
      case 'rename':
        openRename(siteId, siteName, icon);
        break;
      case 'bindDomain':
        {
          // if (customDomain?.domain) {
          //   siteApi.getRecordInfo({ domain: customDomain?.domain }).then(
          //     res => {
          //       if (isNaN(res?.status) || res.status === 3 || res.status === 1) {
          //         goDomainBind();
          //       } else {
          //         SiriusModal.confirm({
          //           title: '备案中不允许修改域名',
          //           content: '',
          //           okButtonProps: { style: { display: 'none' } },
          //           cancelText: '知道了',
          //         });
          //       }
          //     },
          //     () => {
          //       goDomainBind();
          //     }
          //   );
          // } else {
          //   goDomainBind();
          // }
          goDomainBind();
        }
        break;
      case 'recordDomain':
        if (customDomain) {
          if (domainList.length > 1) {
            setDomainSelectOptions(domainList.map(d => ({ value: d.domain, label: d.domain })));
            setSelectedDomain(domainList[0].domain);
            setShowSelectModal(true);
          } else {
            goDomainReord(customDomain.domain);
          }
        } else {
          SiriusModal.confirm({
            title: '修改域名生效后才能域名备案',
            content: '该站点还未修改为自定义域名，暂无法备案',
            okText: '修改为自定义域名',
            cancelText: getIn18Text('SITE_ZHIDAOLE'),
            onOk: goDomainBind,
            className: styles.confirm,
          });
        }
        break;
      case 'optimizeSeo':
        {
          handleSeoConfig();
        }
        break;
      case 'configHttps': {
        handleHttpsConfig();
        trackApi.track('site_certificate_click');
        break;
      }
      case 'bindAnalysis':
        {
          openBindAnalysis(siteId);
        }
        break;
      case 'viewService': {
        trackApi.track('site_service_click');
        openServiceModal(productServiceDTO);
        break;
      }
      case 'offline': {
        SiriusModal.confirm({
          title: getIn18Text('SITE_XIAXIAN_TITLE'),
          content: getIn18Text('SITE_XIAXIAN_CONTENT'),
          okText: '确定',
          cancelText: '取消',
          okType: 'primary',
          okButtonProps: {
            style: {
              background: '#FE5B4C',
            },
            danger: true,
          },
          onOk: () => offlineSite(siteId),
          className: styles.confirm,
        });
        break;
      }
      default:
        break;
    }
  };

  /**
   * 操作下拉配置
   * @param siteId
   * @param siteName
   * @param host
   * @param status
   * @returns
   */
  const getDropdownMenu = (siteId: string, siteName: string, host: string, status: STATUS_ENUM, isCustomSite = false) => {
    const isOnline = status === STATUS_ENUM.ONLINE;
    return (
      <Menu className={styles.optMenu} onClick={value => handleSelectOperate(value.key, siteId, siteName, host)}>
        {DROPDOWN_OPTIONS.map(item => {
          if (['bindDomain', 'optimizeSeo', 'bindAnalysis', 'configHttps', 'recordDomain'].includes(item.key)) {
            return !isCustomSite && isOnline ? (
              <Menu.Item key={item.key}>
                <span>{item.label}</span>
              </Menu.Item>
            ) : null;
          } else if (item.key === 'offline') {
            return !isCustomSite && isOnline ? (
              <React.Fragment key={item.key}>
                <Divider />
                <Menu.Item key={item.key}>
                  <span>{item.label}</span>
                </Menu.Item>
              </React.Fragment>
            ) : null;
          } else if (item.key === 'viewService' && !productServiceDTO) {
            return null;
          } else if (item.key === 'delete' && productServiceDTO && isOnline) {
            return null;
          } else {
            return (
              <Menu.Item key={item.key}>
                <span>{item.label}</span>
              </Menu.Item>
            );
          }
        })}
      </Menu>
    );
  };

  // 打开sdk文档
  const goHelpCenter = () => {
    // window.open('https://waimao.163.com/knowledgeCenter#/d/1648880634472517633.html');
    openHelpCenter('/d/1648880634472517633.html');
  };

  const getPeriodString = (serviceInfo?: Record<string, string>) => {
    if (!serviceInfo?.beginTime) {
      return '';
    }
    return `${getIn18Text('SITE_YOUXIAOQI')}: ${dayjs(serviceInfo.beginTime).format('YYYY.M.D')}-${dayjs(serviceInfo.expTime).format('YYYY.M.D')}`;
  };

  const waitOptimizeCountNumber = useMemo(() => {
    return [isAddCert, isAddSeoConfig, isBindDomain].filter(item => item === false).length;
  }, [isAddCert, isAddSeoConfig, isBindDomain]);

  const handleSiteOptimizeItemClick = (type: SiteOptimizItemTypes) => {
    if (type === SiteOptimizItemTypes.bindDomain) {
      goDomainBind();
    }
    if (type === SiteOptimizItemTypes.addCert) {
      handleHttpsConfig();
    }
    if (type === SiteOptimizItemTypes.addSeoConfig) {
      handleSeoConfig();
    }
  };

  return (
    <div className={styles.siteCardHeader}>
      <div className={styles.nav}>
        <div className={styles.navLeft}>
          <span style={{ marginRight: '8px', overflow: 'hidden' }}>
            <EllipsisTooltip>{title}</EllipsisTooltip>
          </span>
          {!isCustomSite && STATUS_LABEL[status] && <StatusTag status={status} />}
          {isCustomSite && <span className={styles.customSiteTag}>{getIn18Text('GUANLIANZHANDIAN')}</span>}
        </div>

        <div className={styles.navRight}>
          {isCustomSite && (
            <Tooltip placement="bottom" title={outerKey}>
              <span className={styles.outerSiteId}>
                {getIn18Text('FUZHIZHANDIANID')} <Copy onClick={() => copy(outerKey ?? '')} />
              </span>
            </Tooltip>
          )}
          {!isCustomSite && editDay && <span className={styles.editDay}>{editDay}</span>}

          {!isCustomSite && isIndex && (
            <div
              onClick={() => {
                onChooseTemplate(status, siteId);
                if (status !== STATUS_ENUM.ONLINE) {
                  trackApi.track('mysite_fitup_null', { result: 'edit' });
                } else {
                  trackApi.track('mysite_fitup');
                }
              }}
              className={styles.editBtn}
            >
              {getIn18Text('ZHUANGXIU')}
            </div>
          )}

          {isCustomSite && (
            <div onClick={goHelpCenter} className={styles.editBtnBig}>
              查看对接文档
            </div>
          )}

          {isIndex && haveSite && productServiceDTO && (productServiceDTO.exp || dayjs(productServiceDTO.systemTime).diff(productServiceDTO.expTime, 'month') >= -3) ? (
            <div
              onClick={() => {
                onFreeConsule();
                trackApi.track('site_renew');
              }}
              className={styles.optBtn}
            >
              续费
            </div>
          ) : null}

          {isIndex && haveSite && (
            <Dropdown placement="bottomRight" overlay={getDropdownMenu(siteId, siteName, host, status, isCustomSite)}>
              <div className={styles.optBtn}>
                {getIn18Text('CAOZUO')} <CaretDownOutlined />
              </div>
            </Dropdown>
          )}

          {isCustomSite || isIndex || (
            <div onClick={addProduct} className={styles.addProduct}>
              {getIn18Text('TIANJIASHANGPIN')}
            </div>
          )}
        </div>
      </div>

      {indexUrl && (
        <div className={styles.indexUrl} ref={popupContainer}>
          <div className={styles.leftContainer}>
            <a
              style={{ flexGrow: 1, flexShrink: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 160 }}
              href={isCustomSite && !/^https?:\/\//.test(indexUrl) ? `https://${indexUrl}` : indexUrl}
              target="_blank"
            >
              {indexUrl}
            </a>
            {domainList && domainList.length > 1 ? (
              <a style={{ color: '#4C6AFF', flexGrow: 0, flexShrink: 0 }} onClick={goDomainBind}>
                共{domainList.length}个域名 &gt;
              </a>
            ) : isChecking ? (
              <a style={{ color: '#4C6AFF', flexGrow: 0, flexShrink: 0 }} onClick={goDomainBind}>
                域名已生成，继续配置 &gt;
              </a>
            ) : null}
            {waitOptimizeCountNumber === 0 || !isOnline || isCustomSite ? null : (
              <>
                <span className={styles.splitLine}></span>
                <Popover
                  title={null}
                  overlayClassName={styles.siteCardHeaderPopover}
                  getPopupContainer={() => popupContainer.current || document.body}
                  content={
                    <SiteConfigOptimizationPanel
                      isAddCert={isAddCert}
                      isAddSeoConfig={isAddSeoConfig}
                      isBindDomain={isBindDomain}
                      handleItemClick={handleSiteOptimizeItemClick}
                    />
                  }
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 3, cursor: 'pointer', width: 135 }}>
                    <TongyongCuowuTishiMainChengse />
                    <span className={styles.youhuaTip}>您有{waitOptimizeCountNumber}项待优化</span>
                  </span>
                </Popover>
              </>
            )}
          </div>
          <span className={styles.servicePeriod}>{getPeriodString(productServiceDTO)}</span>
        </div>
      )}

      <Modal
        zIndex={800}
        visible={showSelectModal}
        getContainer={false}
        width={480}
        className={styles.selectModal}
        title="选择域名"
        footer={null}
        maskClosable={false}
        destroyOnClose={true}
        onCancel={closeSelectModal}
      >
        <EnhanceSelect value={selectedDomain} style={{ width: '100%' }} onChange={setSelectedDomain} options={domainSelectOptions} placeholder="请选择一个站点名称" />
        <div className={styles.btnGroup}>
          <Button btnType="minorLine" onClick={closeSelectModal}>
            取消
          </Button>
          <Button btnType="primary" type="button" onClick={() => goDomainReord(selectedDomain)}>
            确定
          </Button>
        </div>
      </Modal>
    </div>
  );
};
