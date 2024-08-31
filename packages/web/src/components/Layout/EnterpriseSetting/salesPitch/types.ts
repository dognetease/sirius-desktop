import { DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { CSSProperties } from 'react';
import { SalesPitchStages, SalesPitchTypes, SalesPitchModel } from 'api';
import { DrawerType } from '@web-common/state/reducer/salesPitchReducer/types';

export interface SalesPitchCardIdInfo {
  stageId: SalesPitchStages;
  type: SalesPitchTypes;
  id: string;
}

// export interface CardHandleProps {
//   onEdit: (cardId: string) => void;
//   onDelete: (cardId: string) => void;
//   onSend: (cardId: string) => void; // 快捷发送
//   onCopy: (cardId: string) => void; // 复制
//   onCheck: (cardId: string) => void; // 查看全文
// }

export interface CardDragProps {
  provided?: DraggableProvided;
  snapshot?: DraggableStateSnapshot;
  isAllDragging?: boolean;
  patchedStyle?: CSSProperties;
  isDragDisabled?: boolean;
}

export interface CardBaseProps {
  scene?: SalesPitchScenes;
  cardId: string;
}

export type SalesPitchCardProps = CardBaseProps & CardDragProps;

export interface BoardListBaseProps {
  idList: string[];
  scene?: SalesPitchScenes;
}

export interface BoardListDragProps {
  stageId: SalesPitchStages;
  isAllDragging: boolean;
  isDragDisabled: boolean;
}

export type SalesPitchBoardListProps = BoardListBaseProps & BoardListDragProps;

export interface SalesPitchDrawerBase {
  // stageId?: SalesPitchStages; // 新建可能传递阶段
  // data?: SalesPitchModel; // 编辑，查看使用
  width?: number; // 可以定义宽度
  scene?: SalesPitchScenes;
}

export interface SalesPitchDrawerHandle {
  onClose?: (success?: boolean) => void; // 关闭
  // onNext?: (cardId: string) => void; // 下一个,查看
  // onPrev?: (cardId: string) => void; // 上一个，查看
  // checkToEdit?: (cardId: string) => void; // 查看转为编辑
  // saveAsMy?: (cardId: string) => void; // 查看转存为我的话术
}

export type SalesPitchDrawerProps = SalesPitchDrawerBase & SalesPitchDrawerHandle;

export interface OnSortReqParams {
  newList: SalesPitchModel[];
  stageId: SalesPitchStages;
}
// 场景值添加,营销模板编辑器:edmTemplate,营销邮件编辑器:edmMailEditor 类似写信
export type SalesPitchScenes = 'settingBoard' | 'settingList' | 'readMailAside' | 'writePage' | 'uniCustomer' | 'edmTemplate' | 'edmMailEditor';

export interface SalesPitchPageProps {
  scene?: SalesPitchScenes;
  refresh?: boolean;
}

export interface SalesPitchTrackUsePrams {
  opera: 'use';
  scene: SalesPitchScenes;
}

export interface SalesPitchTrackUseReqPrams {
  opera: 'use';
  scene: 'read_page' | 'write_page' | 'managepage';
}

export interface SalesPitchTrackManagePrams {
  opera: 'ADD' | 'EDIT' | 'DRAG' | 'SHOW';
  type?: SalesPitchTypes;
}

export interface SalesPitchTrackManageReqPrams {
  opera: 'show' | 'drag' | 'create' | 'edit';
  type?: 'company' | 'personal';
}
