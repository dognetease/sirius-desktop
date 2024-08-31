import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Table } from 'antd';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
// import Cascader from '@web-common/components/UI/Cascader';
import Cascader from '@lingxi-common-component/sirius-ui/Cascader';
import style from './style.module.scss';
import { getColumns } from './column';
import { ReactComponent as BackSvg } from '@/images/icons/edm/back.svg';
import EdmEmptyProductPic from '@/images/icons/edm/edm-empty-product-pic.png';
import { ProductUpdateColumnModal } from '../productUpdateColumnModal/productUpdateColumnModal';
import { useAppSelector } from '@web-common/state/createStore';
import { CURRENCY_MAP, getTextContent } from '../editor/template';
import { getIn18Text } from 'api';

const Enum: any = {
  0: style.name,
  1: style.name,
  2: style.price,
  3: style.brand,
};

type SiteInfo = {
  siteId: string;
  siteName: string;
  bindDomains: string[];
};

interface ModalProps {
  fieldsMap: {};
  fields: any[];
  tableMap: any;
  selectedRowKeys: string[];
  visible: boolean;
  afterClose: () => void;
  onBack: () => void;
  onClose: () => void;
  onAdd: (tab: number, imgSize: number) => void;
  container?: string;
  siteList: SiteInfo[];
  selectSite: string[];
  setSelectSite: (value: string[]) => void;
  imgSize: number;
  setImgSize: (size: number) => void;
}

export const ProductPreviewModal = (props: ModalProps) => {
  // 这个组件在营销和普通邮件的插入商品信息中共用， 所以需要区分一个modal的container
  const { container, imgSize, setImgSize, selectSite, setSelectSite } = props;
  useEffect(() => {
    setTableList(props.selectedRowKeys.map(id => props.tableMap[id]));
  }, [props.selectedRowKeys]);

  const tabs = [getIn18Text('TUWENYANGSHI'), getIn18Text('BIAOGEYANGSHI')];
  const [showUpdateColumnModal, setShowUpdateColumnModal] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [tableList, setTableList] = useState<any>([]);
  // const [productListWidth, setProductListWidth] = useState<number>(0);
  const imgColumns = useAppSelector(state => state.mailProductReducer.imgColumns);
  const tableColumns = useAppSelector(state => state.mailProductReducer.tableColumns);

  const openUpdateColumn = () => {
    setShowUpdateColumnModal(true);
  };
  const backToProductLs = () => {
    props.onBack();
  };
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const callback = () => {
    if (tableWrapperRef.current) {
      const tBody = tableWrapperRef.current.querySelector('.ant-table-body');
      if (tBody) tBody.scrollTo(0, 0);
    }
  };

  const productListWidth = useMemo(() => {
    let column = 5;
    if (imgSize == 150) {
      column = 4;
    } else if (imgSize == 200) {
      column = 3;
    }
    const l = props.selectedRowKeys.length;
    while (l % column > 0 && l % column <= column / 2) {
      column--;
    }
    return column * (imgSize + 31.5) - 31.5;
  }, [imgSize, props.selectedRowKeys]);

  const cascaderOptions = useMemo(() => {
    return props.siteList.map((siteItem: { siteId: string; siteName: string; bindDomains: string[] }) => ({
      value: siteItem.siteId,
      label: siteItem.siteName,
      children:
        siteItem.bindDomains?.length > 1
          ? siteItem.bindDomains.map(d => ({
              value: d,
              label: d,
            }))
          : [],
    }));
  }, [props.siteList]);

  return (
    <>
      <SiriusModal
        title={getIn18Text('QUERENSHANGPINYANGSHI')}
        width={816}
        visible={props.visible}
        maskClosable={false}
        className={style.productPreviewModal}
        footer={null}
        onCancel={props.onClose}
        afterClose={() => {
          setCurrentTab(0);
          props.afterClose();
        }}
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
        <>
          <div className={style.description}>
            {`商品以${
              currentTab === 0 ? getIn18Text('TUWEN') : getIn18Text('BIAOGE')
            }形式插入到邮件正文，当客户点击时跳转到商品详情页，系统同时会记录客户的浏览数据，便于培育客户。`}
            <a onClick={openUpdateColumn} className={style.updateColumn}>
              {getIn18Text('XIUGAIZHANSHIZIDUAN')}
            </a>
          </div>
          {currentTab === 1 ? (
            <div ref={tableWrapperRef}>
              <Table
                className={style.table}
                columns={getColumns(tableColumns, props.fieldsMap, callback) as any[]}
                dataSource={tableList}
                pagination={false}
                scroll={{
                  scrollToFirstRowOnChange: true,
                  y: 310,
                  x: 759,
                }}
              />
            </div>
          ) : (
            <div className={style.productListBlockOuter}>
              <div className={style.productListBlock} style={{ width: `${productListWidth}px`, gridTemplateColumns: `repeat(auto-fill, ${imgSize}px)` }}>
                {props.selectedRowKeys.map(id => {
                  return (
                    <div key={id} className={style.productItem} style={{ width: imgSize }}>
                      <img className={style.img} width={imgSize} height={imgSize} src={props.tableMap[id]?.pictures?.[0]?.url || EdmEmptyProductPic} />
                      {imgColumns.map((key, index) => {
                        let text = props.tableMap[id][key];
                        // 富文本字段转换为纯文本
                        if (key == 'product_description_en') {
                          text = getTextContent(text);
                        } else if (key === 'price') {
                          text = props.tableMap[id]['priceRange'] || text; // 优先展示价格区间
                          if (text) {
                            const currency: keyof typeof CURRENCY_MAP = props.tableMap[id]['price_currency'];
                            const currencyIcon = currency ? CURRENCY_MAP[currency] || '$' : '$';
                            text = currencyIcon + text;
                          }
                        }
                        return (
                          <div className={Enum[index]} key={id}>
                            {text}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>

        <BackSvg onClick={backToProductLs} className={style.back} />

        <div className={style.footer}>
          <div className={style.footerLeft}>
            <div>
              {cascaderOptions.length < 1 || (cascaderOptions.length == 1 && cascaderOptions[0].children.length < 2) ? null : (
                <div className={style.siteWrapper}>
                  <span>{getIn18Text('SHANGPINXIANGQINGYESUOSHU')}</span>
                  <Cascader
                    placeholder={getIn18Text('QINGXUANZE')}
                    style={{ width: 160 }}
                    popupClassName={style.siteCascader}
                    options={cascaderOptions}
                    changeOnSelect={true}
                    value={selectSite}
                    onChange={(value: any) => setSelectSite(value)}
                  />
                </div>
              )}
            </div>
            {currentTab === 0 ? (
              <div>
                <span>{getIn18Text('SHANGPINTUPIANCHICUN：')}</span>
                <EnhanceSelect
                  style={{ width: 140 }}
                  options={[
                    { value: 120, label: getIn18Text('XIAO') + '（120*120）' },
                    { value: 150, label: getIn18Text('SHIZHONG') + '（150*150）' },
                    { value: 200, label: getIn18Text('DA') + '（200*200）' },
                  ]}
                  value={imgSize}
                  onChange={(value: any) => setImgSize(value)}
                />
              </div>
            ) : null}
          </div>
          <div className={style.footerBtns}>
            <Button btnType="minorLine" onClick={props.onClose}>
              {getIn18Text('QUXIAO')}
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                props.onAdd(currentTab, imgSize);
              }}
            >
              {getIn18Text('QUEDING')}
            </Button>
          </div>
        </div>
      </SiriusModal>
      <ProductUpdateColumnModal
        container={container}
        theme={currentTab}
        fields={props.fields}
        visible={showUpdateColumnModal}
        onClose={() => setShowUpdateColumnModal(false)}
      />
    </>
  );
};
