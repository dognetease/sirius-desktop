import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import classnames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';
import AppstoreOutlined from '@ant-design/icons/AppstoreOutlined';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import { FFMSRate } from 'api';
import DragDomWrap from '../components/dragDom';
import style from './image.module.scss';

interface HeaderProps {
  label: number | string;
  value: string | number;
  data: string[];
  relatedCode?: string;
}

interface Props {
  standardField: FFMSRate.StandardField[];
  tableData?: FFMSRate.PricePicRes;
  getImageData: (req: FFMSRate.SaveAnalyzePrice) => void;
}

// const ImageRecognition: React.FC<Props> = ({ standardField, tableData }) => {

const ImageRecognition = forwardRef((props: Props, ref) => {
  const { standardField, tableData, getImageData } = props;
  const [headerFields, setHeader] = useState<HeaderProps[]>([]);

  const getFormatData = () => {
    let lastData = [...headerFields].filter(item => typeof item.label === 'string').sort((a, b) => Number(a.value) - Number(b.value));
    let rows = lastData[0].data;
    let transData: string[][] = [];
    rows.forEach((item, index) => {
      let arr: string[] = [];
      lastData.forEach((child, childIndex) => {
        arr.push(child.data[index]);
      });
      transData.push(arr);
    });
    let mapData = headerFields
      .filter(item => item.relatedCode)
      .map(ele => ({
        label: ele.label,
        value: ele.relatedCode,
      }));

    getImageData({
      data: transData,
      map: true,
      mappingRules: mapData,
    });
    console.log('xxx-transData', mapData, transData);
  };

  const onDragChange = useCallback((id: string, hoverId: string) => {
    setHeader(prve => {
      let list = [...prve];
      let originIndex = list.findIndex(item => item.value === id);
      let tagrgeIndex = list.findIndex(item => item.value === hoverId);
      console.log('onDragChange', list[originIndex], list[tagrgeIndex]);
      if (originIndex > -1 && tagrgeIndex > -1) {
        [list[originIndex], list[tagrgeIndex]] = [list[tagrgeIndex], list[originIndex]];
        list[originIndex].relatedCode = '';
        list[tagrgeIndex].relatedCode = '';
      }
      console.log('onDragChangelist', list);
      return list;
    });
  }, []);

  const relation = (index: number, type: string) => {
    console.log('xxxx-reloation');
    if (type) {
      setHeader(pre => {
        let curr = [...pre];
        curr[index].relatedCode = '';
        return curr;
      });
    } else {
      let value = standardField[index]?.value;
      value &&
        setHeader(pre => {
          let curr = [...pre];
          curr[index].relatedCode = value;
          return curr;
        });
    }
  };

  const initAnalyzeData = (tableData: FFMSRate.PricePicRes) => {
    let header: HeaderProps[] = [];
    let firstRow = tableData.data[0];
    let longColumns = firstRow.length <= standardField.length ? standardField : firstRow;
    if (longColumns?.length) {
      longColumns.forEach((_, index) => {
        let columns = tableData.data.map(row => {
          return row[index]; // 数据旋转
        });
        header.push({
          label: index >= firstRow.length ? -1 : firstRow[index],
          value: index,
          relatedCode: '',
          data: columns,
        });
      });
    }
    if (tableData?.mappingRules?.length) {
      header = header.map(item => {
        let hasMap = tableData.mappingRules.find(map => map.label === item.label);
        if (hasMap) {
          item.relatedCode = hasMap.value + '';
          return item;
        }
        return item;
      });

      let newArr = cloneDeep(header);
      header.forEach((newItem, index) => {
        if (newItem.relatedCode) {
          let _index = standardField.findIndex(item => item.value === newItem.relatedCode);
          [newArr[_index], newArr[index]] = [newArr[index], newArr[_index]];
        }
      });
      console.log('xxxx', newArr, header);
      setHeader(newArr);
    } else {
      setHeader(header);
    }
  };

  useEffect(() => {
    console.log('xxxx-e -headerFields', headerFields);
  }, [headerFields]);
  useEffect(() => {
    if (tableData?.data?.length) initAnalyzeData(tableData);
  }, [tableData]);

  useImperativeHandle(ref, () => ({
    getFormatData,
  }));

  return (
    <div className={style.ffmsDrapWrap}>
      <span className={style.title} onClick={() => getFormatData()}>
        系统标准字段
      </span>
      <div className={style.standard}>
        {standardField.map((item, index) => (
          <div className={classnames(style.dragBox, style.dragBoxCommon, { [style.dragBoxRequired]: item.required })} key={index}>
            <span> {item.label}</span>
          </div>
        ))}
      </div>

      <div className={style.uploadField}>
        {headerFields.map((item, index) => (
          <DragDomWrap onDragChange={onDragChange} itemData={item} index={index} key={item.value}>
            <div className={style.dragBoxColumn} key={index}>
              <span key={index} className={classnames(style.box, style.boxHeader)}>
                <AppstoreOutlined />
                {typeof item.label === 'string' ? (
                  <span className={style.btn} onClick={() => relation(index, '')}>
                    {' '}
                    对应{' '}
                  </span>
                ) : null}
                {item.relatedCode ? (
                  <span className={style.cancel} onClick={() => relation(index, 'delete')}>
                    {' '}
                    <CloseCircleOutlined />{' '}
                  </span>
                ) : null}
              </span>
              {item.data.map((ele, _index) => {
                return (
                  <span key={_index} className={style.box} style={{ cursor: 'move' }}>
                    {_index === 0 || typeof item.label === 'number' ? (
                      ele
                    ) : (
                      <Input
                        value={ele}
                        onChange={e => {
                          let lastValue = e.target.value; // 直接引用 null ?
                          setHeader(pre => {
                            let curr = [...pre];
                            curr[index].data[_index] = lastValue;
                            return curr;
                          });
                        }}
                      ></Input>
                    )}
                  </span>
                );
              })}
            </div>
          </DragDomWrap>
        ))}
      </div>
    </div>
  );
});
export default ImageRecognition;
