/*
 * @Author: wangzhijie02
 * @Date: 2021-11-26 10:51:36
 * @LastEditTime: 2022-06-02 22:00:30
 * @LastEditors: wangzhijie02
 * @Description:
 */
import React, { useCallback, useState } from 'react';
import { DOC_VALUES } from './definition';
/**
 * 需要配合 TemplateModal 组件 使用
 * @param onSuccess
 * @param args 用于区分是否使用缓存中的onSucess函数
 * @returns
 */
export const useTemplateModal = (onSuccess: () => void, args: any[] = []) => {
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [docType, setDocType] = useState<DOC_VALUES>('all');
  const hideTemplateModal = useCallback(() => {
    setTemplateModalVisible(false);
  }, []);
  const showTemplateModal = useCallback((docType?: DOC_VALUES) => {
    setTemplateModalVisible(true);
    setDocType(docType ?? 'all');
  }, []);
  /**
   * 展示 模板弹层
   */
  const createSuccessHandle = useCallback(() => {
    onSuccess();
    setTemplateModalVisible(false);
  }, args);
  return {
    /**
     * 模板库弹层 显示/隐藏 属性控制
     */
    templateModalVisible,
    /**展示模板类型 */
    docType,
    /**
     * 隐藏 模板弹层
     */
    hideTemplateModal,
    /**
     * 展示 模板弹层
     */
    showTemplateModal,
    /**
     * 通过模板创建文档成功后 需要绑定的函数
     */
    createSuccessHandle,
  };
};
