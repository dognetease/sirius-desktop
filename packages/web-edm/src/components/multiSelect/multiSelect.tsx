import { Button, Popover } from 'antd';
import React, { useRef } from 'react';
import { ReactComponent as IconGroup } from '@/images/icons/edm/template-group-group.svg';
import { ReactComponent as IconDown } from '@/images/icons/edm/template-group-down.svg';
import MultiSelectContent from '../multiSelectContent/multiSelectContent';
import classes from './multiSelect.module.scss';
interface Props {
  // 可选数组
  dataList: any[];
  // 选中id数组
  selectedIds: (number | string)[];
  // 选中内容变化
  onCheckedChange: (selection: any) => void;
  // 获取下拉内容函数
  getSelectContent: () => void;
  // 获取下拉标题结构
  groupNameRender: () => React.ReactNode;
  // 左下方按钮
  createItems: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  // 右下方按钮
  manageItems: () => void;
  // 确认新建
  addItems: (name: string) => void;
  // 取消新建
  addCancel: () => void;
  // 错误提示信息
  errorMessage?: string;
  // 是否隐藏popover
  hidePopover?: boolean;
  // 新建默认id
  createGroupId?: number | string;
}
const MultiSelect: React.FC<Props> = ({
  dataList,
  selectedIds,
  onCheckedChange,
  getSelectContent,
  groupNameRender,
  createItems,
  manageItems,
  addItems,
  addCancel,
  errorMessage,
  hidePopover = false,
  createGroupId,
}) => {
  const popoverRef = useRef(null);
  return (
    <Popover
      ref={popoverRef}
      content={
        <MultiSelectContent
          dataList={dataList}
          selectedIds={selectedIds}
          onCheckedChange={onCheckedChange}
          createItems={createItems}
          manageItems={() => {
            manageItems();
            popoverRef.current?.close();
          }}
          addItems={addItems}
          addCancel={addCancel}
          errorMessage={errorMessage}
          createGroupId={createGroupId}
        />
      }
      placement="bottomRight"
      destroyTooltipOnHide={{ keepParent: false }}
      trigger="click"
      overlayClassName={classes.wrapper}
      {...(hidePopover ? { visible: false } : {})}
    >
      <div className={classes.container}>
        <span>
          <Button onClick={getSelectContent} type="text" className={classes.button}>
            <IconGroup />
            <span className={classes.text}>{groupNameRender()}</span>
            <IconDown />
          </Button>
        </span>
      </div>
    </Popover>
  );
};

export default MultiSelect;
