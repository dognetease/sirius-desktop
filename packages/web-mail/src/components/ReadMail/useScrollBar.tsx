/**
 * 邮件正文页的横向虚拟滚动条
 *
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef } from 'react';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';

interface WrapCompenentProps {
  [key: string]: any;
}

interface VrticalScrollWrapProps {
  [key: string]: any;
}

interface HorizontalScrollWrapProps {
  [key: string]: any;
}

interface ConfigProps {
  /**
   * 内容上边框判断偏移
   */
  contentRectTopOffset?: number;
  /**
   * 内容下边框判断偏移
   */
  contentRectBottomOffset?: number;
}

const useScroolBar = (config: ConfigProps) => {
  const { contentRectTopOffset = 0, contentRectBottomOffset = 0 } = config || {};
};

export default useScroolBar;
