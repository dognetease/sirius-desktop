import React, { useMemo } from 'react';
import lodashGet from 'lodash/get';
import classnames, { Argument as ClassnamesTypes } from 'classnames';
import { LabelModel } from 'api';
import { Space } from 'antd';
import { getLabelStyle } from '@/components/Layout/Customer/utils/utils';
import Label from '@/components/Layout/Customer/components/label/label';
import EllipsisMore from '@/components/Layout/Customer/components/ellipsisMore/ellipsisMore';
import style from './ellipsisLabels.module.scss';
import { ReactComponent as AddIcon } from '@/images/mailCustomerCard/add.svg';
import { PrivilegeCheckForMailPlus } from '@/components/UI/PrivilegeEnhance';

interface EllipsisLabelsProps {
  className?: ClassnamesTypes;
  list?: LabelModel[];
  labelMaxWidth?: number | string;
  deletable?: boolean;
  clickable?: boolean;
  randomColor?: boolean;
  onDeleteLabel?: (label_id: string) => void;
  onClickLabel?: (label_id: string) => void;
  renderEllipsisByLabel?: boolean;
  onAddLabels?: () => void;
  hideAdd?: boolean; // 是否隐藏添加按钮
  isMailPlus?: boolean; //是否是邮件+侧边栏使用
}

const randomColors = [
  { color: '#4759B2', backgroundColor: '#DEEBFD' },
  { color: '#398E80', backgroundColor: '#D6F7F1' },
  { color: '#7A51CB', backgroundColor: '#EDE4FF' },
  { color: '#CC913D', backgroundColor: '#FFF3E2' },
  { color: '#CB493D', backgroundColor: '#FFE5E2' },
  { color: '#4E5A70', backgroundColor: '#E7EBF1' },
];

const colorMap: Record<string, string> = {
  '#DEEBFD': '#4759B2',
  '#6BA9FF': '#545a6e', // 默认色
  '#D6F7F1': '#398E80',
  '#FFF3E2': '#CC913D',
  '#EDE4FF': '#7A51CB',
  '#FFE5E2': '#CB493D',
  '#E7EBF1': '#4E5A70',
};

const EllipsisLabels: React.FC<EllipsisLabelsProps> = props => {
  const {
    className,
    list,
    labelMaxWidth,
    deletable,
    clickable,
    randomColor = false,
    isMailPlus,
    onDeleteLabel,
    onClickLabel,
    renderEllipsisByLabel,
    onAddLabels,
    hideAdd = false,
  } = props;

  // 展示...时默认的样式
  let ellipsisColor = randomColor ? randomColors[0].color : lodashGet(list, '0.label_color', '');
  let ellipsisBgColor = randomColor ? randomColors[0].backgroundColor : getLabelStyle('', ellipsisColor).backgroundColor;

  if (isMailPlus) {
    ellipsisBgColor = lodashGet(list, '0.label_color', '#6BA9FF');
    ellipsisColor = colorMap[ellipsisBgColor];
  } else {
    ellipsisColor = randomColor ? randomColors[0].color : lodashGet(list, '0.label_color', '');
    ellipsisBgColor = randomColor ? randomColors[0].backgroundColor : getLabelStyle('', ellipsisColor).backgroundColor;
  }

  // 展示添加按钮,公海客户不展示添加按钮
  const AddElement: React.ReactElement = !hideAdd ? (
    <PrivilegeCheckForMailPlus accessLabel="OP" resourceLabel="CONTACT">
      <span className={style.ellipsisLabelsAdd} onClick={onAddLabels}>
        <AddIcon />
        {!list?.length ? <span className={style.ellipsisLabelsAddText}>添加标签</span> : ''}
      </span>
    </PrivilegeCheckForMailPlus>
  ) : (
    <></>
  );

  return (
    <div className={classnames([style.ellipsisLabels, className])}>
      {Array.isArray(list) && list.length ? (
        <EllipsisMore
          className={style.labels}
          renderEllipsisDropdown={ellipsisCount =>
            renderEllipsisByLabel ? (
              <Space size={4}>
                {list
                  .filter((item, index) => list.length - 1 - index < ellipsisCount)
                  .map((item, index) => {
                    const dropdownColorIndex = (list.length - ellipsisCount + index) % 6;

                    return (
                      <Label
                        className={style.labelItem}
                        key={item.label_id}
                        color={randomColor ? randomColors[dropdownColorIndex].color : item.label_color}
                        backgroundColor={randomColor ? randomColors[dropdownColorIndex].backgroundColor : undefined}
                        name={item.label_name}
                        maxWidth={labelMaxWidth}
                        deletable={deletable}
                        clickable={clickable}
                        onDelete={() => onDeleteLabel && onDeleteLabel(item.label_id)}
                        onClick={() => onClickLabel && onClickLabel(item.label_id)}
                      />
                    );
                  })}
              </Space>
            ) : (
              list
                .filter((item, index) => list.length - 1 - index < ellipsisCount)
                .map(item => item.label_name)
                .join('、')
            )
          }
          addElement={onAddLabels ? AddElement : <></>}
          ellipsisColor={ellipsisColor}
          ellipsisBgColor={ellipsisBgColor}
        >
          {list.map((item, index) => {
            let backgroundColor = randomColor ? randomColors[index % 6].backgroundColor : undefined;
            let color = randomColor ? randomColors[index % 6].color : item.label_color;
            let innerStyle = {};
            if (isMailPlus) {
              // 邮件+客户标签白色底
              // backgroundColor = item.label_color;
              color = colorMap[item.label_color];
              backgroundColor = '#ffffff';
              innerStyle = { border: `1px solid ${color}` };
            }
            return (
              <Label
                style={innerStyle}
                className={style.labelItem}
                key={item.label_id}
                color={color}
                backgroundColor={backgroundColor}
                name={item.label_name}
                maxWidth={labelMaxWidth}
                deletable={deletable}
                clickable={clickable}
                onDelete={() => onDeleteLabel && onDeleteLabel(item.label_id)}
                onClick={() => onClickLabel && onClickLabel(item.label_id)}
              />
            );
          })}
        </EllipsisMore>
      ) : null}
      {!list?.length && onAddLabels && AddElement}
    </div>
  );
};

EllipsisLabels.defaultProps = {
  list: [],
};

export default EllipsisLabels;
