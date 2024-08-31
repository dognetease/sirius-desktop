import React, { useState } from 'react';
import classnames from 'classnames';
import { ICustomerContactData, ViewChangeParams, View, WayType } from 'api';
import CustomerViewFromModal from './customerViewFromModal';
import { CustomerFilterModal } from './customerFilterModal';
import style from './customer.module.scss';
import qs from 'querystring';
import { getIn18Text } from 'api';
import { Breadcrumb, Button } from 'antd';
interface CustomerProps {
  className?: string;
  style?: React.CSSProperties;
  pickedContacts: ICustomerContactData[];
  onPickedChange: (contacts: ICustomerContactData[], fromType: string) => void;
  way?: WayType;
}
const Customer: React.FC<CustomerProps> = props => {
  const { className, style: styleFromProps, pickedContacts, onPickedChange, way = 'EDM' } = props;
  const params = qs.parse(location.hash.split('?')[1]);
  const [view, setView] = useState<View | undefined>();
  const [activeLabelId, setActiveLabelId] = useState<string>('');
  const [activeLabelName, setActiveLabelName] = useState<string>('');
  const [customerFilterModalVisible, setCustomerFilterModalVisible] = useState<boolean>(false);
  const [searchCondition, setSearchCondition] = useState({});
  const [defaultActiveTab, setDefaultActiveTab] = useState<string | undefined>();
  const handleViewChange = (nextView: View, params?: ViewChangeParams) => {
    setView(nextView);
    if (nextView === 'labelDetail' && params) {
      setActiveLabelId(params.labelId);
      setActiveLabelName(params.labelName);
    }
  };
  const handleClickEntry = (key: string) => {
    setDefaultActiveTab(key);
    setCustomerFilterModalVisible(true);
  };
  const handleFilterCustomer = values => {
    setCustomerFilterModalVisible(false);
    setSearchCondition(values);
    setView('customer-from-modal');
  };
  const cancelFilterCustomer = () => {
    setCustomerFilterModalVisible(false);
  };

  const onPickedContactChange = (contacts: ICustomerContactData[]) => {
    onPickedChange(contacts, defaultActiveTab === 'leads' ? getIn18Text('WODEXIANSUO') : getIn18Text('WODEKEHU'));
  };

  const renderBreadcrumbComp = () => {
    return (
      <div className={style.title}>
        <Breadcrumb separator=">">
          <Breadcrumb.Item
            onClick={() => {
              setView(undefined);
            }}
          >
            {getIn18Text('KEHUGUANLI')}
          </Breadcrumb.Item>
          <Breadcrumb.Item>{defaultActiveTab === 'leads' ? getIn18Text('WODEXIANSUO') : getIn18Text('WODEKEHU')}</Breadcrumb.Item>
        </Breadcrumb>
        <div className={style.filterRow}>
          <p className={style.filterText}>
            {getIn18Text('YISHAIXUAN')}
            <span className={style.filterCount}>{searchCondition?.contact_num || 0}</span>
            {getIn18Text('REN')}
          </p>
          <Button
            type="link"
            className={style.clearFilterBtn}
            onClick={() => {
              setCustomerFilterModalVisible(true);
            }}
          >
            {getIn18Text('ZHONGXINSHAIXUAN')}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={classnames(style.customer, className)} style={styleFromProps}>
      {!view && (
        <div className={style.empty}>
          {/* <div className={style.entryTitle}>请根据条件选择相关客户或线索进行邮件群发</div> */}
          <div className={style.entryTitle}>{getIn18Text('QINGGENJUTIAOJIANXUANZEXIANGGUANKEHUJINXINGYOUJIANQUNFA')}</div>
          <div className={style.entryList}>
            <div className={style.entryItem} onClick={() => handleClickEntry('1')}>
              <div className={classnames([style.entryIcon, style.customer])}></div>
              <div className={style.entryText}>{getIn18Text('CONGWODEKEHUZHONGSHAIXUAN')}</div>
              <div className={style.entryArrowIcon} />
            </div>
            <div className={style.entryItem} onClick={() => handleClickEntry('leads')}>
              <div className={classnames([style.entryIcon, style.customer])}></div>
              <div className={style.entryText}>{getIn18Text('CONGWODEXIANSUOZHONGSHAIXUAN')}</div>
              <div className={style.entryArrowIcon} />
            </div>
            {/* uni邀测包修改 */}
            {/* <div className={style.entryItem} onClick={() => handleClickEntry('2')}>
                                  <div className={classnames([style.entryIcon, style.personClue])}></div>
                                  <div className={style.entryText}>从个人线索中筛选</div>
                                  <div className={style.entryArrowIcon} />
                                </div>
                                <div className={style.entryItem} onClick={() => handleClickEntry('3')}>
                                  <div className={classnames([style.entryIcon, style.openSea])}></div>
                                  <div className={style.entryText}>从线索公海筛选</div>
                                  <div className={style.entryArrowIcon} />
                                </div> */}
          </div>
        </div>
      )}
      <CustomerFilterModal
        visible={customerFilterModalVisible}
        defaultActiveTab={defaultActiveTab}
        way={way}
        onOk={handleFilterCustomer}
        onCancel={cancelFilterCustomer}
      />

      {view === 'customer-from-modal' && (
        <>
          {renderBreadcrumbComp()}
          <CustomerViewFromModal
            searchCondition={searchCondition}
            defaultCheckedKeys={pickedContacts.map(contact => contact.email)}
            onPickedChange={onPickedContactChange}
            onViewChange={handleViewChange}
            openCustomerFilterModal={() => setCustomerFilterModalVisible(true)}
            showOwnTips={false}
            calcDecreaseHeight={48}
          />
        </>
      )}
    </div>
  );
};
Customer.defaultProps = {};
export default Customer;
