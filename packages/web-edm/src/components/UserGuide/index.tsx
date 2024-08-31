import React, { useEffect, useState, useContext, useRef } from 'react';
import { debounce } from 'lodash';
import { apiHolder, apis, EdmSendBoxApi } from 'api';
import { UserGuideContext } from './context';
import { CoverBox } from './CoverBox';
import { getCalculatedPosition, fixStackingContext, canMakeRelative } from './utils';
import style from './style.module.scss';

interface Step {
  selector: string;
  stagePadding?: number;
  stageOffset?: Partial<PositionOffset>;
  popoverOffset?: Partial<PositionOffset>;
  closePanel?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'none';
  popover?: PopoverOption;
  clickTip?: Partial<PositionOffset>;
}

interface Props {
  type: number; // 引导类型  和后端确认
  steps: Step[];
  stagePadding?: number;
  canGoBack?: boolean;
  visible?: boolean;
}

export interface PopoverOption {
  title: string;
  desc: string;
  tip?: string;
  showFinish?: boolean;
  placement?: 'top' | 'left' | 'bottom' | 'right';
}

export interface Position {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PositionOffset extends Position {
  right: number;
  bottom: number;
}

interface GuideState {
  isFinish: boolean;
  getStatePromise: Promise<void> | null;
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export const UserGuide: React.FC<Props> = ({ type, steps = [], stagePadding = 10, canGoBack = false, visible = true }) => {
  const { state, dispatch } = useContext(UserGuideContext);
  const [closePanel, setClosePanel] = useState('');
  const [stagePos, setStagePos] = useState<Position>({ left: 0, top: 0, width: 0, height: 0 });
  const [popoverPos, setPopoverPos] = useState<Position>({ left: 0, top: 0, width: 0, height: 0 });
  const [clickTipPos, setClickTipPos] = useState<Position | undefined>({ left: 0, top: 0, width: 0, height: 0 });
  const [popover, setPopover] = useState<PopoverOption>();
  const [userFinish, setUserFinish] = useState(true);
  const guide = useRef(-1);
  // 默认isFinish=true 状态需要和后端确认
  const guideState = useRef<GuideState>({
    isFinish: true,
    getStatePromise: null,
  });

  function setPosition(index: number) {
    const step = steps[index];
    if (!step) {
      return;
    }
    const element = document.querySelector(step.selector) as HTMLElement;
    if (element) {
      const { stageOffset = {}, popoverOffset = {}, closePanel = '', clickTip } = step;
      const elementPos = getCalculatedPosition(element);
      const padding = typeof step.stagePadding === 'undefined' ? stagePadding : step.stagePadding;
      setClosePanel(closePanel);
      setStagePos({
        left: elementPos.left - padding + (stageOffset.left || 0),
        top: elementPos.top - padding + (stageOffset.top || 0),
        width: stageOffset.width || elementPos.width + 2 * padding,
        height: stageOffset.height || elementPos.height + 2 * padding,
      });

      let popoverLeft;
      let popoverTop;
      if (typeof popoverOffset.bottom !== 'undefined') {
        popoverTop = elementPos.top + elementPos.height + popoverOffset.bottom;
      } else {
        popoverTop = elementPos.top + (popoverOffset.top || 0);
      }

      if (typeof popoverOffset.right !== 'undefined') {
        popoverLeft = elementPos.left + elementPos.width + popoverOffset.right;
      } else {
        popoverLeft = elementPos.left + (popoverOffset.left || 0);
      }

      setPopoverPos({
        left: popoverLeft,
        top: popoverTop,
        width: popoverOffset.width || 0,
        height: popoverOffset.height || 0,
      });

      if (clickTip) {
        let clickTipLeft;
        let clickTipTop;
        if (typeof clickTip.bottom !== 'undefined') {
          clickTipTop = elementPos.top + elementPos.height + clickTip.bottom;
        } else {
          clickTipTop = elementPos.top + (clickTip.top || 0);
        }

        if (typeof clickTip.right !== 'undefined') {
          clickTipLeft = elementPos.left + elementPos.width + clickTip.right;
        } else {
          clickTipLeft = elementPos.left + (clickTip.left || 0);
        }

        setClickTipPos({
          left: clickTipLeft,
          top: clickTipTop,
          width: 0,
          height: 0,
        });
      } else {
        setClickTipPos(undefined);
      }
    }
  }

  function highlight() {
    const step = steps[state.currentStep];
    if (!step) {
      return;
    }
    if (!canGoBack && state.currentStep <= guide.current) {
      return;
    }

    guide.current = state.currentStep;
    setPosition(state.currentStep);
    setPopover(step.popover);
    const element = document.querySelector(step.selector) as HTMLElement;
    if (element) {
      if (canMakeRelative(element)) {
        element.classList.add(style.highlightElementRelative);
      }
      fixStackingContext(element, style.driverFixStacking);
      element.classList.add(style.highlightElement);
    }
  }

  function removeHighlight() {
    const stackFixes = document.querySelectorAll(`.${style.driverFixStacking}`);
    for (let counter = 0; counter < stackFixes.length; counter++) {
      stackFixes[counter]?.classList?.remove(style.driverFixStacking);
    }
    const step = steps[guide.current];
    if (!step) {
      return;
    }
    const element = document.querySelector(step.selector) as HTMLElement;
    if (element) {
      element.classList.remove(style.highlightElement);
      element.classList.remove(style.highlightElementRelative);
    }
  }

  const finishClick = () => {
    guideState.current.isFinish = true;
    dispatch({ payload: { shouldShow: false, currentStep: Number.POSITIVE_INFINITY, guideState: 'finish' } });
    removeHighlight();
    edmApi.setUserGuideRecord(type, false);
  };

  const exitClick = () => {
    guideState.current.isFinish = true;
    dispatch({ payload: { shouldShow: false, currentStep: Number.POSITIVE_INFINITY, guideState: 'finish' } });
    removeHighlight();
    edmApi.setUserGuideRecord(type, true);
  };

  async function handleStepChange() {
    if (!state.shouldShow || !steps[state.currentStep]) {
      return;
    }
    // 检查状态
    if (!guideState.current?.getStatePromise) {
      guideState.current.getStatePromise = edmApi.getUserGuideRecords().then(res => {
        const currentGuide = (res?.records || []).find(record => String(record.type) === String(type));
        if (currentGuide) {
          guideState.current.isFinish = currentGuide.finish;
          dispatch({ payload: { guideState: currentGuide.finish ? 'finish' : 'notFinish' } });
          setUserFinish(currentGuide.finish);
        }
      });
    }

    await guideState.current.getStatePromise;
    if (guideState.current.isFinish === true || !visible) {
      // 已完成
      return;
    }

    removeHighlight();
    highlight();
  }

  useEffect(() => {
    handleStepChange();
  }, [state.currentStep, state.shouldShow]);

  useEffect(() => {
    if (!state.shouldShow) {
      removeHighlight();
      if (state.currentStep === steps.length - 1) {
        //  已完成
        finishClick();
      }
    }
  }, [state.shouldShow]);

  useEffect(() => {
    const resize = debounce(() => {
      setPosition(guide.current);
    }, 100);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <>
      {visible && state.shouldShow && steps[state.currentStep] && !userFinish ? (
        <CoverBox
          stagePos={stagePos}
          popoverPos={popoverPos}
          clickTipPos={clickTipPos}
          closePanel={closePanel}
          popover={popover}
          onFinish={finishClick}
          onExit={exitClick}
        />
      ) : (
        ''
      )}
    </>
  );
};
