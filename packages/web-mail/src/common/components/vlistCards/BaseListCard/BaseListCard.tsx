/**
 * 卡片列表-卡片的用例模板
 * 1.由于卡片列表是虚拟列表，其对显示内容的高度需要很精确的感知才能实现正确的布局
 * 2.所以卡片的内容高度一定要受控，在编写的时候，请显示声卡片中各结构行的高度，通过数据计算显示策略
 * 3.请在文件中提供与组件策略一致的高度计算方法。
 * 4.卡片的宽度请设置为100%，以适应列表容器宽度。
 */

import React from 'react';
import { ListCardComProps } from '../../../../types';
import './BaseListCard.scss';

// 默认方法的空实现
const defaultEventHandle = () => {};

// 样例数据接口
interface ExData {
  name: string;
  sex: string;
  address: string;
}

interface ExListCardComProps extends ListCardComProps {
  data: ExData;
}

interface stringMap {
  [key: string]: number;
}

// 卡片结构的静态高度
const structHeightMap = {
  title: 20,
  btn: 20,
  name: 20,
  sex: 20,
};

// 卡片结构的显示策略
const getVisibleStructHeight = (data: ExData): stringMap => {
  const res: stringMap = {
    title: structHeightMap.title,
    btn: structHeightMap.btn,
  };
  if (data.name) {
    res.name = structHeightMap.name;
  }
  if (data.sex) {
    res.sex = structHeightMap.sex;
  }
  return res;
};

// todo:  有空再补全帮助函数
// 递归设置是否显示和高度
// const configComHeiht = (element, map: stringMap) => {
//   // const childrenList = [element];
//   // while (childrenList.length) {
//   //   const curElement = childrenList.shift();
//   //   if (curElement) {
//   //     // if (Symbol.for('react.element') === curElement.$$typeof) {
//   //     // if (element.className) {
//   //     //   // return false;
//   //     // }
//   //     if (curElement?.props?.children) {
//   //       curElement.props.children.forEach(item => {
//   //         if (typeof item === 'object' && map[item.key]) {
//   //           childrenList.push(item);
//   //         }
//   //       });
//   //       curElement?.props.children = curElement?.props.children.filter(item => map[item.key]);
//   //     }
//   //     // }
//   //     // const childrenList = element.props.children.filter(item => {

//   //     //   return true;
//   //     // });
//   //   }
//   // }

//   return  React.cloneElement(element,{
//     style:{background:'red'}
//   });;
// };

const BaseListCard: React.FC<ExListCardComProps> = props => {
  const { data, active, onClick = defaultEventHandle, onMouseEnter = defaultEventHandle, onMouseLeave = defaultEventHandle, onContextMenu = defaultEventHandle } = props;

  const showMsg = (e: React.MouseEvent) => {
    // 阻止事件冒泡，防止最外层click触发
    e.stopPropagation();
    // window.console.log('仅仅打印消息');
  };

  const key2Heigt = getVisibleStructHeight(data);

  // 卡片最外层必须实现onClick onContextMenu
  return (
    <div className={`card-wrap ${active ? 'active' : ''}`} style={{ background: active ? 'blue' : '', color: active ? '#FFF' : '' }}>
      {key2Heigt.title ? (
        <span key="title" style={{ height: key2Heigt.title }}>
          一个基础的卡片
        </span>
      ) : (
        ''
      )}
      <div key="btn" style={{ height: key2Heigt.btn }} hidden={!key2Heigt.btn} className="btn" onClick={showMsg}>
        我是一个按钮，点击我触发其他功能
      </div>
      <div key="name" style={{ height: key2Heigt.name }} hidden={!data.name}>
        我高100
        {data.name}
      </div>
      {key2Heigt.sex ? (
        <div key="sex" style={{ height: key2Heigt.sex }}>
          我可能是
          {data.sex}
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export const getCardHeight = (data: ExData): number => {
  // 边距之类的距离，一定要加到总高度里
  const baseHeight = 20;
  let sumHeight = baseHeight;
  // 根据显示策略获取高度
  const heightMap = getVisibleStructHeight(data);
  Object.values(heightMap).forEach(height => {
    sumHeight += height;
  });
  return sumHeight;
};

export default BaseListCard;
