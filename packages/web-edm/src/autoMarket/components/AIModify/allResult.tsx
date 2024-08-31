import { Modal, Button, Dropdown, Menu, MenuProps, Space } from 'antd';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import TongyongGuanbiXian from '@web-common/images/newIcon/tongyong_guanbi_xian.svg';
import TongyongZhanKaiXia from '@web-common/images/newIcon/tongyong_zhankai_xia.svg';
import style from './AIModify.module.scss';
import { AIModifyInfo, AIResults } from 'api';
import cloneDeep from 'lodash/cloneDeep';
import { getIn18Text } from 'api';

export interface Props {
  visiable: boolean;
  onClose: () => void;
  mailContent?: string;
  mailContentWithPlaceholder?: string;
  aiResult?: AIResults;
  contactSize?: number;
}

interface ValueMap {
  placeholder?: string;
  aiSentence?: string;
}

const visiableTabCount = 10;
export const AllResultModal = (props: Props) => {
  const { mailContent, mailContentWithPlaceholder = '', visiable, onClose, aiResult, contactSize = 0 } = props;

  const [innerAiResult, setInnerAiResult] = useState<AIResults>();

  const [selectedIndex, setSelectedIndex] = useState(0);
  // [[1, 1, 1], [1, 1, 2], [1, 2, 2]...]   index代表 valueMatrix的index, value的值是valueMatrix二层数组的value
  const [indexArray, setIndexArray] = useState<Array<Array<number>>>([]);
  const [valueMatrix, setValueMatrix] = useState<Array<Array<ValueMap>>>([]);

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
      <div className={style.tabArea}>
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
    const temp = cloneDeep(aiResult);

    let modify = new Array<AIModifyInfo>();
    aiResult?.modify?.forEach(item => {
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
  }, [aiResult]);

  useEffect(() => {
    buildMatrix();
  }, [innerAiResult]);

  const buildMatrix = () => {
    if (!innerAiResult || innerAiResult.modify.length === 0) {
      return;
    }

    let indexMatrix = new Array<Array<number>>();
    let valueMatrix = new Array<Array<ValueMap>>();

    innerAiResult?.modify.forEach(item => {
      let innerIndexArray = new Array<number>();
      let innerValueArray = new Array<ValueMap>();
      // 先把原始内容本身加进去
      innerIndexArray.push(0);
      innerValueArray.push({
        placeholder: item.placeholder,
        aiSentence: item.originalSentence,
      });
      item.use &&
        item.aiSentenceList?.forEach((innerItem, innerIndex) => {
          if (!innerItem.unSelected) {
            innerIndexArray.push(innerIndex + 1);
            innerValueArray.push({
              placeholder: item.placeholder,
              aiSentence: innerItem.aiSentence,
            });
          }
        });
      indexMatrix.push(innerIndexArray);
      valueMatrix.push(innerValueArray);
    });
    setValueMatrix(valueMatrix);
    console.log('hanxu buildMatrix: ' + indexMatrix);
    buildIndex(indexMatrix);
  };

  const buildIndex = useCallback((arr: Array<Array<number>>) => {
    var ans = new Array();
    dfs(arr.length, 0, arr, new Array(), ans);
    console.log('hanxu buildIndex: ' + ans);
    setIndexArray(ans);
    return ans;
  }, []);

  const dfs = (n, row, arr, selected, ans) => {
    if (row == n) {
      ans.push([...selected]);
      return;
    }
    for (const value of arr[row]) {
      selected.push(value);
      dfs(n, row + 1, arr, selected, ans);
      selected.pop();
    }
  };

  const DropDownButtonComp = () => {
    return (
      <Dropdown
        overlayClassName={style.menu}
        trigger={['click']}
        overlay={
          <Menu>
            {indexArray.map((item, index) => {
              if (contactSize > 0 && index >= contactSize) {
                return;
              }
              if (index >= visiableTabCount) {
                return (
                  <Menu.Item
                    className={style.moreContentMenu}
                    onClick={() => {
                      setSelectedIndex(index);
                    }}
                  >
                    {`内容${index}`}
                    {/* <Button onClick={() => { setSelectedIndex(index) }} className={style.button}></Button> */}
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
    let tempContent = cloneDeep(mailContentWithPlaceholder);
    if (indexArray.length === 0) {
      tempContent = mailContent || '';
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
    >
      <div className={style.allResult}>
        {TabComp()}
        {ContentComp()}
      </div>
    </Modal>
  );
};
