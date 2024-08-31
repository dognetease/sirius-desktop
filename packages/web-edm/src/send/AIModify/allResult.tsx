import { Modal, Button, Dropdown, Menu, Tabs } from 'antd';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import TongyongGuanbiXian from '@web-common/images/newIcon/tongyong_guanbi_xian.svg';
import TongyongZhanKaiXia from '@web-common/images/newIcon/tongyong_zhankai_xia.svg';
import style from './AIModify.module.scss';
import { AIModifyInfo, AIResults } from 'api';
import cloneDeep from 'lodash/cloneDeep';
// import Tabs from '@/components/Layout/Customer/components/UI/Tabs/tabs';
import { buildMailContentWithPlaceholder } from './utils';
import { buildAiResultMatrix, Result } from '../../AIHosting/MarketingPlan/utils';
import { getIn18Text } from 'api';
import UnorderedListOutlined from '@ant-design/icons/UnorderedListOutlined';
// import { Tabs } from '@web-common/components/UI/Tabs';
import { ReactComponent as TongyongGengduo } from '@web-common/images/newIcon/tongyong_gengduo.svg';

export interface Props {
  visiable: boolean;
  onClose: () => void;
  contactSize?: number;
  aiResults?: Array<AIResults>;
  defaultTab?: number;
  afterClose?: () => void;
}

interface ValueMap {
  placeholder?: string;
  aiSentence?: string;
}

const visiableTabCount = 10;
export const AllResultModal = (props: Props) => {
  const { visiable, onClose, aiResults = [], contactSize = 0, defaultTab = 0, afterClose } = props;

  const [innerAiResult, setInnerAiResult] = useState<AIResults>();
  // 当前选中的改写方案
  const [aiResultIndex, setAiResultIndex] = useState(0);

  // 当前改写方案的第几个版本
  const [selectedIndex, setSelectedIndex] = useState(0);
  // [[1, 1, 1], [1, 1, 2], [1, 2, 2]...]   index代表 valueMatrix的index, value的值是valueMatrix二层数组的value
  const [indexArray, setIndexArray] = useState<Array<Array<number>>>([]);
  const [valueMatrix, setValueMatrix] = useState<Array<Array<ValueMap>>>([]);

  useEffect(() => {
    setAiResultIndex(defaultTab);
  }, [defaultTab]);

  const TabComp = () => {
    let visiableIndexArray = new Array<number>();

    let count = 0;
    let emailCount = indexArray.length;
    if (contactSize > 0) {
      emailCount = Math.min(contactSize, emailCount);
    }
    while (count < Math.min(emailCount, visiableTabCount)) {
      visiableIndexArray.push(count);
      count += 1;
    }

    return (
      <div className={style.tabArea} style={aiResults.length > 0 ? { marginTop: '16px' } : {}}>
        <Button onClick={() => setSelectedIndex(0)} className={selectedIndex === 0 ? style.buttonSelected : style.button} style={{ width: '74px' }}>
          {getIn18Text('YUANYOUJIAN')}
        </Button>
        {visiableIndexArray.map((item, index) => {
          if (index === 0) {
            return;
          }
          return <Button onClick={() => setSelectedIndex(item)} className={item === selectedIndex ? style.buttonSelected : style.button}>{`内容${item}`}</Button>;
        })}
        {emailCount > visiableTabCount && DropDownButtonComp()}
      </div>
    );
  };

  useEffect(() => {
    const currentAiResult = aiResults[aiResultIndex];
    const temp = cloneDeep(currentAiResult);

    let modify = new Array<AIModifyInfo>();
    temp?.modify?.forEach(item => {
      let info: AIModifyInfo = {
        ...item,
        aiSentenceList: item.aiSentenceList?.filter(item => {
          return !item.unSelected;
        }),
      };
      modify.push(info);
    });
    if (temp) {
      temp.modify = modify;
      setInnerAiResult(temp);
    }
  }, [aiResults, aiResultIndex]);

  useEffect(() => {
    if (!innerAiResult) {
      return;
    }
    const result = buildAiResultMatrix(innerAiResult);
    setIndexArray(result.indexMatrix || []);
    setValueMatrix(result.valueMatrix || []);
  }, [innerAiResult]);

  const MultiTabComp = () => {
    if ((aiResults?.length || 0) < 2) {
      return null;
    }
    return (
      <div className={style.multiVersion}>
        <Tabs
          size="small"
          tabPosition={'top'}
          moreIcon={<TongyongGengduo />}
          style={{ height: '38px' }}
          tabBarGutter={20}
          onChange={key => {
            setAiResultIndex(parseInt(key));
            setSelectedIndex(0);
          }}
          animated={false}
          activeKey={aiResultIndex.toString()}
        >
          {aiResults?.map((item, index) => {
            if (!item.modify || item.modify.length === 0) {
              return;
            }
            const title = item.title || `开发信${index}`;
            return <Tabs.TabPane tab={title} key={index.toString()} />;
          })}
        </Tabs>
      </div>
    );
  };

  const DropDownButtonComp = () => {
    return (
      <Dropdown
        overlayClassName={style.menu}
        trigger={['hover']}
        placement={'bottomRight'}
        overlay={
          <Menu>
            {indexArray.map((item, index) => {
              if (contactSize > 0 && index >= contactSize) {
                return;
              }
              if (index >= visiableTabCount) {
                return (
                  <Menu.Item>
                    <div
                      onClick={() => {
                        setSelectedIndex(index);
                      }}
                      className={style.dropdownButton}
                    >
                      {`内容${index}`}
                    </div>
                  </Menu.Item>
                );
              }
            })}
          </Menu>
        }
      >
        <div
          className={selectedIndex > 9 ? style.buttonSelected : style.buttonMore}
          style={{ display: 'flex', flexDirection: 'row', flexShrink: '0', justifyContent: 'space-between', minWidth: '74px', width: 'auto', padding: '4px 6px' }}
        >
          {selectedIndex >= visiableTabCount ? `内容${selectedIndex}` : getIn18Text('GENGDUO')}
          <img src={TongyongZhanKaiXia} />
        </div>
      </Dropdown>
    );
  };

  const ContentComp = () => {
    let tempContent = cloneDeep(buildMailContentWithPlaceholder(innerAiResult));
    if (indexArray.length === 0) {
      tempContent = innerAiResult?.mailContent || '';
    }

    const combine = indexArray[selectedIndex] || [];
    combine.forEach((item, index) => {
      // 1. index 表示 原味的第几处, 对应的事  valueMatrix 的 index
      // 2. item 表示 valueMatrix 的二维数组里面的 index
      const valueMap = valueMatrix[index][item];
      if (valueMap && valueMap.placeholder && valueMap.aiSentence) {
        tempContent = tempContent.replace(valueMap.placeholder, valueMap.aiSentence);
      }
    });

    return (
      <div>
        <div className={style.mailContent} dangerouslySetInnerHTML={{ __html: tempContent }} />
      </div>
    );
  };

  return (
    <Modal
      wrapClassName={style.modalText}
      footer={null}
      onCancel={() => onClose()}
      width={984}
      visible={visiable}
      title={'全部内容方案'}
      closeIcon={<img style={{ width: '24px', height: '24px' }} src={TongyongGuanbiXian} />}
      afterClose={afterClose}
    >
      <div className={style.allResult}>
        {MultiTabComp()}
        {TabComp()}
        {ContentComp()}
      </div>
    </Modal>
  );
};
