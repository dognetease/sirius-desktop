/**
 * 自主注册的飘新引导，防止不同的引导冲突重叠
 * 注意：如果引导无法展示，试一下为目标元素的css设置宽高。组件使用 getBoundingClientRect 获取目标元素的宽高，有时候如果目标元素没有渲染，会出现宽高数据不准确问题，表现出来就是引导无法展示。
 */
import * as React from 'react';
import { useLocation } from 'react-use';
import { useActions, HollowOutGuideAction, useAppSelector } from '@web-common/state/createStore';
import useInView from './useInView';
import ImgBubbleGuide from './imgBubbleGuide/index';
import HasMaskGuiden from './hasMaskGuide/index';
import TipGuide from './tipGuide/index';

export interface HollowOutGuideProps {
  /**
   * 类型，1：蒙层引导，2：气泡图文，3：气泡单行引导。默认为蒙层引导
   */
  type?: string;
  /**
   * 是否启用飘新引导，由业务控制
   */
  enable?: boolean;
  /**
   * 引导生效的页面，设置后，会在路由到当前页面的时候，才会注册展示引导
   * （发现使用引导的组件，存在误加载的问题，导致引导被注册，但是又无法展示，阻塞了其他引导的展示，这种场景，可以使用 hash 字段来约束）
   * 实例：#setting、#mailbox
   */
  hash?: string;
  /**
   * 唯一id，是存入 localstroage 的 key，不同的飘新引导必须保证 guideId 不同，同一个飘新引导的分步要保证 guideId 一致
   */
  guideId: string;
  /**
   * 存入 localstroage 的 key 是否不关联 用户id，默认false，关联用户id
   */
  noneUserRelated?: boolean;
  /**
   * 分步，初始值为 1，注意 step 必须顺序不能间断
   */
  step?: number;
  /**
   * 引导弹窗标题
   */
  title: React.ReactNode;
  /**
   * 引导弹窗详情
   */
  intro?: string | JSX.Element;
  /**
   * refresh变更后，会重新刷新 引导弹窗的位置
   */
  refresh?: number;
  /**
   * 底部按钮
   */
  renderFooter?: JSX.Element;
  /**
   * 引导弹窗位置
   */
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  /**
   * 目标元素的聚焦框 padding，通过修改 padding 可以优化聚焦框展示UI效果, [上,右,下,左]
   */
  padding?: number[];
  /**
   * 目标元素的聚焦框的圆角，默认是6px
   */
  borderRadius?: number;
  /**
   * 目标元素宽度，可以自定义设置，不设置的话，会计算目标元素的宽度
   * targetWidth，targetHeight 是为了临时解决兼容性问题加的，后期会优化
   */
  targetWidth?: number;
  /**
   * 目标元素高度，可以自定义设置，不设置的话，会计算目标元素的高度
   */
  targetHeight?: number;
  /**
   * 弹窗位置是'top' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' 箭头距离左边框距离
   * 弹窗位置是'left' | 'right' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom' 箭头距离上边框距离
   */
  arrowDistance?: number;
  /**
   * 确认按钮文案，默认知道了
   */
  okText?: string;
  /**
   * 遮罩是否保留左边导航栏（暂时不可用，如要使用，请与我联系@lujiajian）
   */
  showSideBar?: boolean;
  /**
   * 是否展示箭头
   */
  showArrow?: boolean;
  /**
   * 气泡图文引导图片
   */
  contentImg?: string;
  /**
   * 关闭回调
   */
  onClose?: () => void;
  /**
   * 目标元素, 只有文本节点会导致目标元素位置计算错误，所以目标元素文本最好被标签包裹
   */
  children: React.ReactNode;
  /**
   * 容器元素
   */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  /**
   * 目标元素ref，通过目标元素Ref判断children dom 是否已经在视窗内，在视窗内则注册引导，解决引导被错误的提前注册的问题
   */
  childrenRef?: React.MutableRefObject<any>;
}

const HollowOutGuide: React.FC<HollowOutGuideProps> = props => {
  const { type = '1', enable = true, guideId, step, noneUserRelated, hash, childrenRef } = props;
  const location = useLocation();
  const onGuide = useAppSelector(state => state.hollowOutGuideReducer.guideQueue[0]);
  const { doAddGuide, doDeleteGuide } = useActions(HollowOutGuideAction);
  const hashMatched = React.useMemo(() => (hash ? location?.hash === hash : true), [location, hash]);
  const onStep = React.useMemo(() => (step ? step : 1), [step]);
  const show = React.useMemo(
    () => enable && hashMatched && onGuide && onGuide.guideId === guideId && onGuide?.steps[onStep - 1]?.show,
    [enable, hashMatched, onGuide, guideId, onStep]
  );
  const inView = useInView(childrenRef);

  React.useEffect(() => {
    if (enable && hashMatched && inView) {
      // 注册
      doAddGuide({ step: onStep, guideId, type, noneUserRelated });
    } else {
      doDeleteGuide({ step: onStep, guideId });
    }
  }, [enable, hashMatched, inView]);

  return (
    <>
      {type === '3' ? (
        <TipGuide {...props} {...{ show, onStep }} />
      ) : type === '2' ? (
        <ImgBubbleGuide {...props} {...{ show, onStep }} />
      ) : (
        <HasMaskGuiden {...props} {...{ show, onStep }} />
      )}
    </>
  );
};
export default HollowOutGuide;
