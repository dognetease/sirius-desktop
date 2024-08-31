import React, { useMemo } from 'react';
import './VListTree.scss';
import CaretDownOutlined from '@ant-design/icons/CaretDownOutlined';
import CaretRightOutlined from '@ant-design/icons/CaretRightOutlined';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { TreeDataNode } from 'antd';

interface VlistTreeCardProps {
  /**
   * 用于展示的节点数据
   */
  data: TreeDataNode;
  /**
   * 默认的图标
   */
  icon?: React.ReactElement;
  /**
   * 折叠展开
   */
  expand: boolean;
  /**
   * 所属深度
   */
  deep?: number;
  /**
   * 是否选中
   */
  active?: boolean;
  /**
   * 是否展示展开按钮
   */
  showExpand?: boolean;
  /**
   * 是否处于加载中
   */
  isLoading?: boolean;
  /**
   * 点击展开/关闭事件
   */
  onExpand: (expand: boolean) => void;
  /**
   * 右键点击事件
   */
  onRightClick: (event: React.MouseEvent, data: TreeDataNode) => void;
  /**
   * 点击事件
   */
  onClick: (event: React.MouseEvent, data: TreeDataNode) => void;
  /**
   * 通用的title渲染函数
   */
  titleRender?: (data: TreeDataNode) => React.ReactElement;
}

/**
 * 卡片的填充结构
 */
const defaultOffsetBlock = <div style={{ width: 8, flexShrink: 0 }}></div>;

const VListTreeCard: React.FC<VlistTreeCardProps> = props => {
  const { data, expand, deep = 0, active, onRightClick, onClick, onExpand, titleRender, showExpand, isLoading = false, icon } = props;

  /**
   * 卡片内容渲染
   */
  const _titleRender = useMemo(() => {
    return typeof data?.title == 'function' ? data?.title : titleRender;
  }, [data, titleRender]);

  const title = useMemo(() => {
    return data?.title;
  }, [data]);

  /**
   * 展开
   */
  const handleExpand = (event: React.MouseEvent) => {
    event.stopPropagation();
    onExpand && onExpand(!expand);
  };

  /**
   * 右键
   */
  const handleRightClick = (event: React.MouseEvent) => {
    event.persist();
    event.preventDefault();
    onRightClick && onRightClick(event, data);
  };

  /**
   * 点击
   */
  const handleClick = (event: React.MouseEvent) => {
    event.persist();
    onClick && onClick(event, data);
  };

  /**
   * **************************************************
   * 渲染结构
   */

  /**
   * 卡片的折叠深度
   */
  const OffsetElement = useMemo(() => {
    let list: React.ReactElement[] = [];
    list.length = deep ? deep - 1 : 0;
    list.fill(defaultOffsetBlock);
    return list;
  }, [deep]);

  /**
   * 展开折叠/占位
   */
  const ExpandElement = useMemo(() => {
    const expandIcon = expand ? <CaretDownOutlined className="VLExpand-icon" /> : <CaretRightOutlined className="VLExpand-icon" />;
    return showExpand ? (
      <div
        className="VLExpand-wrap"
        onClick={e => {
          !isLoading && handleExpand(e);
        }}
      >
        {isLoading ? <LoadingOutlined style={{ fontSize: '12px', color: '#84868d' }} /> : expandIcon}
      </div>
    ) : (
      <div style={{ width: 25, flexShrink: 0 }}></div>
    );
  }, [data]);

  /**
   * 卡片的图标
   */
  const IconElement = useMemo(() => {
    return data?.icon || icon ? (
      <div className="VListTreeCard-icon" onClick={handleExpand}>
        {icon ? icon : data?.icon}
      </div>
    ) : (
      <></>
    );
  }, [data, icon]);

  return (
    <div className={`VListTreeCard-Wrap ${active ? 'active' : ''}`} onContextMenu={handleRightClick} onClick={handleClick}>
      {OffsetElement}
      {ExpandElement}
      {IconElement}
      {_titleRender ? _titleRender(data) : <div className="vlist-tree-title-wrap">{title}</div>}
    </div>
  );
};

export default VListTreeCard;
