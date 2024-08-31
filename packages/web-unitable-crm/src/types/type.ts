export interface HandlerData {
  action: 'product-send-email' | 'product-one-key-marketing' | 'product-send-email' | 'product-one-key-marketing';
  payload: {
    allSelected?: boolean; // 是否全选，暂时用不上，外贸侧的弹框自己处理全选
    totalCount?: number; // 所有数据的个数
    filter?: string; // 筛选条件，全选场景需要使用; 外贸侧可以不用理解Filter类型，仅在获取数据时做透传
    tableId: string;
    recordIds: string[]; // 当前所选的记录Id, 外贸侧根据该id去uni查询具体数据
    records: any[];
  };
}
