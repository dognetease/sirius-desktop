import React, { useState } from 'react';
import { apiHolder as api, DataStoreApi } from 'api';
import HollowOutGuide from './index';
import Button from '../../../Button/index';
import CompDoc from '../CompDoc/index';
import compDes from './compDes';
import noConImg from '@/images/no_contacts.png';
import './hollowOutGuideDoc.scss';

const storeApi: DataStoreApi = api.api.getDataStoreApi();

const HollowOutGuideDoc: React.FC = () => {
  const describe = `## HollowOutGuide 新手引导
    自主注册的飘新引导，防止不同的引导冲突重叠
    注意：如果引导无法展示，试一下为目标元素的css设置宽高。组件使用 getBoundingClientRect 获取目标元素的宽高，
    有时候如果目标元素没有渲染，会出现宽高数据不准确问题，表现出来就是引导无法展示。
  `;
  const [isShowSingleGuide, setShowSingleGuide] = useState<boolean>(false); // 蒙层引导（单步）
  const [isShowTwoGuide, setShowTwoGuide] = useState<boolean>(false); // 蒙层引导（两步）
  const [isShowMuchGuide, setShowMuchGuide] = useState<boolean>(false); // 蒙层引导（大于两步）
  const hollowOutGuideNewReset = () => {
    setShowSingleGuide(false);
    setShowTwoGuide(false);
    setShowMuchGuide(false);
    storeApi.del('ljjTestHollowOutGuideNewSingle');
    storeApi.del('ljjTestHollowOutGuideNewTwo');
    storeApi.del('ljjTestHollowOutGuideNewMuch');
  };
  const [isShowSingleImgGuide, setShowSingleImgGuide] = useState<boolean>(false); // 图文气泡引导（单步）
  const [isShowTwoImgGuide, setShowTwoImgGuide] = useState<boolean>(false); // 图文气泡引导（两步）
  const [isShowMuchImgGuide, setShowMuchImgGuide] = useState<boolean>(false); // 图文气泡引导（大于两步）
  const hollowOutImgGuideNewReset = () => {
    setShowSingleImgGuide(false);
    setShowTwoImgGuide(false);
    setShowMuchImgGuide(false);
    storeApi.del('ljjTestHollowOutImgGuideNewSingle');
    storeApi.del('ljjTestHollowOutImgGuideNewTwo');
    storeApi.del('ljjTestHollowOutImgGuideNewMuch');
  };
  const [isShowTipGuide1, setShowTipGuide1] = useState<boolean>(false);
  const [isShowTipGuide2, setShowTipGuide2] = useState<boolean>(false);
  const hollowOutTipGuideNewReset = () => {
    setShowTipGuide1(false);
    setShowTipGuide2(false);
    storeApi.del('ljjTestHollowOutTipGuideNew1');
    storeApi.del('ljjTestHollowOutTipGuideNew2');
  };

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Use npmPath="npm暂不支持新手引导" path="import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew';" />
        <CompDoc.RenderCode describe="#### 基础用法，默认为蒙层引导，点击下面案例中的唤起按钮可以查看案例效果。点击唤起无响应，请先点击重置按钮。">
          <div className="btn-row">
            <Button
              btnType="primary"
              onClick={() => {
                setShowSingleGuide(true);
              }}
            >
              唤起蒙层新手引导（单步）
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                setShowTwoGuide(true);
              }}
            >
              唤起蒙层新手引导（两步）
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                setShowMuchGuide(true);
              }}
            >
              唤起蒙层新手引导（大于两步）
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                setShowSingleGuide(true);
                setShowTwoGuide(true);
                setShowMuchGuide(true);
              }}
            >
              唤起所有蒙层引导
            </Button>
            <Button btnType="primary" onClick={hollowOutGuideNewReset}>
              重置
            </Button>
          </div>
          <br />
          <HollowOutGuide enable={isShowSingleGuide} guideId="ljjTestHollowOutGuideNewSingle" title="单步title" intro="单步info" placement="right">
            <span>(蒙层引导单步)目标元素</span>
          </HollowOutGuide>
          <br />
          <HollowOutGuide enable={isShowTwoGuide} guideId="ljjTestHollowOutGuideNewTwo" title="这是第一步的title" intro="这是第一步的info" step={1} placement="bottom">
            <span>(蒙层引导共两步)目标元素(第一步)</span>
          </HollowOutGuide>
          <HollowOutGuide enable={isShowTwoGuide} guideId="ljjTestHollowOutGuideNewTwo" title="这是第二步的title" intro="这是第二步的info" step={2} placement="left">
            <span>(蒙层引导共两步)目标元素(第二步)</span>
          </HollowOutGuide>
          <br />
          <HollowOutGuide enable={isShowMuchGuide} guideId="ljjTestHollowOutGuideNewMuch" title="这是第一步的title" intro="这是第一步的info" step={1} placement="top">
            <span>(蒙层引导共三步)目标元素(第一步)</span>
          </HollowOutGuide>
          <HollowOutGuide enable={isShowMuchGuide} guideId="ljjTestHollowOutGuideNewMuch" title="这是第二步的title" intro="这是第二步的info" step={2} showArrow={false}>
            <span>(蒙层引导共三步)目标元素(第二步)</span>
          </HollowOutGuide>
          <HollowOutGuide enable={isShowMuchGuide} guideId="ljjTestHollowOutGuideNewMuch" title="这是第三步的title" intro="这是第三步的info" step={3}>
            <span>(蒙层引导共三步)目标元素(第三步)</span>
          </HollowOutGuide>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 气泡图文引导">
          <div className="btn-row">
            <Button
              btnType="primary"
              onClick={() => {
                setShowSingleImgGuide(true);
              }}
            >
              唤起气泡图文引导（单步）
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                setShowTwoImgGuide(true);
              }}
            >
              唤起气泡图文引导（两步）
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                setShowMuchImgGuide(true);
              }}
            >
              唤起气泡图文引导（大于两步）
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                setShowSingleImgGuide(true);
                setShowTwoImgGuide(true);
                setShowMuchImgGuide(true);
              }}
            >
              唤起所有气泡图文引导
            </Button>
            <Button btnType="primary" onClick={hollowOutImgGuideNewReset}>
              重置
            </Button>
          </div>
          <br />
          <HollowOutGuide type="2" enable={isShowSingleImgGuide} guideId="ljjTestHollowOutImgGuideNewSingle" title="单步title" intro="单步info">
            <span>(气泡图文引导单步)目标元素</span>
          </HollowOutGuide>
          <br />
          <HollowOutGuide
            type="2"
            enable={isShowTwoImgGuide}
            contentImg="https://img-blog.csdnimg.cn/5eb39ba135e644c6830e56a47ece3daf.png"
            guideId="ljjTestHollowOutImgGuideNewTwo"
            title="这是第一步的title"
            intro="这是第一步的info"
            step={1}
          >
            <span>(气泡图文引导共两步)目标元素(第一步)</span>
          </HollowOutGuide>
          <HollowOutGuide
            type="2"
            enable={isShowTwoImgGuide}
            contentImg={noConImg}
            guideId="ljjTestHollowOutImgGuideNewTwo"
            title="这是第二步的title"
            intro="这是第二步的info"
            step={2}
          >
            <span>(气泡图文引导共两步)目标元素(第二步)</span>
          </HollowOutGuide>
          <br />
          <HollowOutGuide type="2" enable={isShowMuchImgGuide} guideId="ljjTestHollowOutImgGuideNewMuch" title="这是第一步的title" intro="这是第一步的info" step={1}>
            <span>(气泡图文引导共三步)目标元素(第一步)</span>
          </HollowOutGuide>
          <HollowOutGuide type="2" enable={isShowMuchImgGuide} guideId="ljjTestHollowOutImgGuideNewMuch" title="这是第二步的title" intro="这是第二步的info" step={2}>
            <span>(气泡图文引导共三步)目标元素(第二步)</span>
          </HollowOutGuide>
          <HollowOutGuide type="2" enable={isShowMuchImgGuide} guideId="ljjTestHollowOutImgGuideNewMuch" title="这是第三步的title" intro="这是第三步的info" step={3}>
            <span>(气泡图文引导共三步)目标元素(第三步)</span>
          </HollowOutGuide>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 气泡单行引导">
          <div className="btn-row">
            <Button
              btnType="primary"
              onClick={() => {
                setShowTipGuide1(true);
              }}
            >
              唤起气泡单行引导
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                setShowTipGuide2(true);
              }}
            >
              唤起气泡单行引导（长文本）
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                setShowTipGuide1(true);
                setShowTipGuide2(true);
              }}
            >
              唤起所有气泡单行引导
            </Button>
            <Button btnType="primary" onClick={hollowOutTipGuideNewReset}>
              重置
            </Button>
          </div>
          <br />
          <HollowOutGuide type="3" enable={isShowTipGuide1} guideId="ljjTestHollowOutTipGuideNew1" title="这是title">
            <span>(唤起气泡单行引导)目标元素</span>
          </HollowOutGuide>
          <HollowOutGuide
            type="3"
            enable={isShowTipGuide2}
            guideId="ljjTestHollowOutTipGuideNew2"
            title="这是title这是title这是title这是title这是title这是title这是title这是title这是title"
          >
            <span>(唤起气泡单行引导)目标元素</span>
          </HollowOutGuide>
        </CompDoc.RenderCode>
        <CompDoc.RenderTypeTable compDesProps={compDes[0].props} />
      </CompDoc>
    </>
  );
};

export default HollowOutGuideDoc;
