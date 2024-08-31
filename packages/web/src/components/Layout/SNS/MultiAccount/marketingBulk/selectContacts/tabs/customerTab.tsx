import React, { useState } from 'react';
import classnames from 'classnames';
import { Breadcrumb, Button, Alert } from 'antd';
import { getIn18Text } from 'api';
import UniGridViewModal from '@web-edm/components/uniGridViewModal';
import VirtualList from '../virtualList/index';
import style from './customer.module.scss';
import tabStyle from './tab.module.scss';

interface CustomerProps {
  addWhatsApp: (whatsApp: string[]) => void;
}

export interface ListItem {
  name: string;
  number: number;
  companyName: string;
  isTitle?: boolean;
}

type TabType = '1' | 'leads' | undefined;

export const CustomerTab: React.FC<CustomerProps> = props => {
  const { addWhatsApp } = props;
  const [view, setView] = useState<TabType>();
  const [searchCondition, setSearchCondition] = useState<number>(0);
  const [defaultActiveTab, setDefaultActiveTab] = useState<TabType>();
  const [list, setList] = useState<ListItem[]>([]);
  const [_, setCurrentMap] = useState<Map<string, Record<string, string | boolean>[]>>(new Map());

  const handleClickEntry = (key: TabType) => {
    setDefaultActiveTab(key);
  };

  const formatData = (contactsList: any[]) => {
    const map: Map<string, Record<string, string | boolean>[]> = new Map();
    if (contactsList?.length) {
      contactsList.forEach((item, companyIndex) => {
        const companyName = item.company_name || `公司名称${companyIndex}`;
        if (item?.contact_list?.length) {
          item.contact_list.forEach(contactItem => {
            if (contactItem?.whats_app) {
              if (map.has(companyName)) {
                const whatsAppArr = map.get(companyName) || [];
                whatsAppArr.push({
                  contactName: contactItem.contact_name,
                  whatsApp: contactItem.whats_app,
                  companyName,
                });
                map.set(companyName, whatsAppArr);
              } else {
                map.set(companyName, [
                  {
                    companyName,
                    isTitle: true,
                  },
                  {
                    contactName: contactItem.contact_name,
                    whatsApp: contactItem.whats_app,
                    companyName,
                  },
                ]);
              }
            }
          });
        }
      });
    }
    return map;
  };

  const mapToArr = (map: Map<string, Record<string, string | boolean>[]>): ListItem[] => {
    const arr: any = [];
    let selectNums = 0;
    Array.from(map.entries()).forEach(entry => {
      const lastIndex = entry[1].length - 1;
      entry[1].forEach((entryItem, entryIndex) => {
        if (entryItem.isTitle) {
          arr.push({
            isTitle: true,
            name: entryItem.companyName,
            companyName: entryItem.companyName,
            height: 38,
          });
          selectNums += 1;
        } else {
          arr.push({
            number: entryItem.whatsApp,
            name: entryItem.contactName,
            companyName: entryItem.companyName,
            height: lastIndex === entryIndex ? 38 : 30,
          });
        }
      });
    });
    setSearchCondition(selectNums);
    return arr;
  };

  const handleFilterCustomer = values => {
    const lastMap = formatData(values?.company_list || values?.leads_list || []);
    setCurrentMap(lastMap);
    setList(mapToArr(lastMap) || []);
    // setSearchCondition(values?.contact_num || 0);
    setView(defaultActiveTab);
    setDefaultActiveTab(undefined);
  };
  const cancelFilterCustomer = () => {
    setDefaultActiveTab(undefined);
  };
  const renderBreadcrumbComp = () => (
    <>
      <div>
        <Alert className={style.expiresAlert} type="warning" showIcon closable message={'已为您过滤掉没有WhatsApp联系人'} />
        <div className={style.title}>
          <Breadcrumb separator=">">
            <Breadcrumb.Item
              onClick={() => {
                setView(undefined);
                setSearchCondition(0);
              }}
            >
              {getIn18Text('KEHUGUANLI')}
            </Breadcrumb.Item>
            <Breadcrumb.Item>{view === 'leads' ? getIn18Text('WODEXIANSUO') : getIn18Text('WODEKEHU')}</Breadcrumb.Item>
          </Breadcrumb>
          <div className={style.filterRow}>
            <p className={style.filterText}>
              {getIn18Text('YISHAIXUAN')}
              <span className={style.filterCount}>{searchCondition}</span>
              {getIn18Text('REN')}
            </p>
            <Button
              type="link"
              className={style.clearFilterBtn}
              onClick={() => {
                setDefaultActiveTab(view);
              }}
            >
              {getIn18Text('ZHONGXINSHAIXUAN')}
            </Button>
          </div>
        </div>
      </div>
      <VirtualList
        way="customer"
        originalList={list}
        onDelete={(whatsApp, companyName) => {
          setCurrentMap(lastMap => {
            const newMap = new Map(lastMap);
            let mapItemArr = newMap.get(companyName) || [];
            if (whatsApp) {
              mapItemArr = mapItemArr.filter(item => item.whatsApp !== whatsApp);
              if (mapItemArr?.length > 1) {
                newMap.set(companyName, mapItemArr);
              } else {
                newMap.delete(companyName);
              }
              setList(mapToArr(newMap) || []);
            } else {
              newMap.delete(companyName);
              setList(mapToArr(newMap) || []);
            }
            return newMap;
          });
        }}
      />
      <div className={tabStyle.btnBox}>
        <Button
          disabled={!list.length}
          onClick={() =>
            addWhatsApp(
              list
                ?.filter(listItem => !listItem?.isTitle)
                ?.map(item => item.number + '')
                ?.filter(wa => wa)
            )
          }
        >
          添加
        </Button>
      </div>
    </>
  );

  return (
    <div className={classnames(style.customer, tabStyle.tabContentWrap)}>
      {view ? (
        renderBreadcrumbComp()
      ) : (
        <div className={style.empty}>
          <div className={style.entryTitle}>{'请根据条件选择群发'}</div>
          <div className={style.entryList}>
            <div className={style.entryItem} onClick={() => handleClickEntry('1')}>
              <div className={classnames([style.entryIcon, style.customer])}></div>
              <div className={style.entryText}>{getIn18Text('CONGWODEKEHUZHONGSHAIXUAN')}</div>
              <div className={style.entryArrowIcon} />
            </div>
            <div className={style.entryItem} onClick={() => handleClickEntry('leads')}>
              <div className={classnames([style.entryIcon, style.personClue])}></div>
              <div className={style.entryText}>{getIn18Text('CONGWODEXIANSUOZHONGSHAIXUAN')}</div>
              <div className={style.entryArrowIcon} />
            </div>
          </div>
        </div>
      )}
      {defaultActiveTab ? <UniGridViewModal activeKey={defaultActiveTab} way="PersonWhatsApp" onOk={handleFilterCustomer} onCancel={cancelFilterCustomer} /> : null}
    </div>
  );
};
