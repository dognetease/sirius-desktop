import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { showLeadsBackToOpenseaModal, showOpenseaLeadsReceiveModal, L2cCustomerSelectGridModal, L2cLeadsSelectGridModal, Scenes } from '@lxunit/app-l2c-crm';

// 退回公海线索，是一个方法
export const clueBackToOpenseaModal = (leadsId: string, callback?: () => void) => {
  try {
    showLeadsBackToOpenseaModal(leadsId, callback);
  } catch (err) {
    console.log('[showLeadsBackToOpenseaModal] err:', err);
  }
};
// 公海线索，认领
export const openseaLeadsReceiveModal = (id: string, callback?: () => void) => {
  try {
    showOpenseaLeadsReceiveModal(id, callback);
  } catch (err) {
    console.log('[showOpenseaLeadsReceiveModal] err:', err);
  }
};

export const scenes = Scenes;
// 添加到原有客户，添加到原有线索
export interface addToCustomerOrClueProps {
  visible: boolean;
  contacts: Array<{ email: string; contact_name?: string }>;
  onOk: () => void;
  onCancel?: () => void;
  type: 'customer' | 'clue';
  way?: Scenes; // 'Email_Read' | 'Email_stranger_card' | 'Email_stranger_sidebar'; // 打点用,邮件+固定传递，所以此处不再传递,分别是：读信页，陌生人卡片，陌生人侧边栏
}
export const AddToCustomerOrClue = (prop: addToCustomerOrClueProps) => {
  const { contacts, onOk, onCancel, type, visible, way } = prop;
  if (!visible) {
    return null;
  }
  // 添加到原有客户
  if (type === 'customer') {
    return (
      <L2cCustomerSelectGridModal
        onCancel={() => {
          onCancel && onCancel();
        }}
        onOk={() => {
          onOk && onOk();
        }}
        contacts={contacts}
        way={way}
      />
    );
  }
  // 添加到原有客户
  if (type === 'clue') {
    return (
      <L2cLeadsSelectGridModal
        onCancel={() => {
          onCancel && onCancel();
        }}
        onOk={() => {
          onOk && onOk();
        }}
        contacts={contacts}
        way={way}
      />
    );
  }
  return null;
};
