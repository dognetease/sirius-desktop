import React from 'react';

import { Button } from 'antd';
import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
import { useActions, HollowOutGuideAction } from '@web-common/state/createStore';
import styles from './index.module.scss';
import useState2SalesPitchReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import GuideImg1 from '@/images/icons/mail/salespitch_guide_1.png';
import GuideImg2 from '@/images/icons/mail/salespitch_guide_2.png';
import GuideImg3 from '@/images/icons/mail/salespitch_guide_3.png';
import { getIn18Text } from 'api';

export interface SalesPitchGuideProps {
  source?: string; // 1：读信页，2：写信页
  children?: React.ReactNode;
}

export const SALES_PITCH_GUIDE_ID = 'SALES_PITCH_GUIDE_ID';

const SalesPitchGuide: React.FC<SalesPitchGuideProps> = props => {
  const { source, children } = props;

  const [guideVisible, setGuideVisible] = useState2SalesPitchReduxMock('guideVisible');
  const [writePageGuidePos] = useState2SalesPitchReduxMock('writePageGuidePos');
  const [, setWritePageOuterDrawerVisible] = useState2SalesPitchReduxMock('writePageOuterDrawerVisible');

  const { doNextStep } = useActions(HollowOutGuideAction);

  const handleHaveALook = () => {
    doNextStep({ step: 3, guideId: SALES_PITCH_GUIDE_ID });
    setGuideVisible(false);
    setWritePageOuterDrawerVisible(true);
  };

  const ignore = () => {
    doNextStep({ step: 3, guideId: SALES_PITCH_GUIDE_ID });
  };

  const next = (step: number) => {
    doNextStep({ step, guideId: SALES_PITCH_GUIDE_ID });
  };

  const getPosEle: () => HTMLElement = () => document.querySelector('.tab-read-page') || document.body;

  const constructRenderFooter = (step: number) => (
    <div className={styles.footer}>
      <Button className={styles.ignore} onClick={ignore}>
        {getIn18Text('HULVE')}
      </Button>
      <Button className={styles.haveLook} onClick={() => next(step)}>
        {getIn18Text('XIAYIBU')}
      </Button>
    </div>
  );

  const constructRenderMailDetailLastFooter = () => (
    <div className={styles.footer}>
      <Button className={styles.ignore} onClick={ignore}>
        {getIn18Text('HULVE')}
      </Button>
      <Button className={styles.haveLook} onClick={ignore}>
        {getIn18Text('WOZHIDAOLE')}
      </Button>
    </div>
  );

  const constructRenderMailWriteLastFooter = () => (
    <div className={styles.footer}>
      <Button className={styles.ignore} onClick={ignore}>
        {getIn18Text('HULVE')}
      </Button>
      <Button className={styles.haveLook} onClick={handleHaveALook}>
        {getIn18Text('QUKANKAN')}
      </Button>
    </div>
  );

  if (source === '1') {
    return (
      <HollowOutGuide
        type="2"
        contentImg={GuideImg1}
        guideId={SALES_PITCH_GUIDE_ID}
        title={getIn18Text('salesPitchFirstGuideTitle')}
        intro={getIn18Text('salesPitchFirstGuideDetail')}
        placement="bottomRight"
        padding={[10, 10, 10, 10]}
        renderFooter={constructRenderFooter(1)}
        getPopupContainer={() => getPosEle()}
        step={1}
      >
        <HollowOutGuide
          type="2"
          contentImg={GuideImg2}
          guideId={SALES_PITCH_GUIDE_ID}
          title={getIn18Text('MailDetailPitchGuideTitle')}
          intro={getIn18Text('MailDetailPitchGuideDetail')}
          placement="bottomRight"
          padding={[10, 10, 10, 10]}
          renderFooter={constructRenderFooter(2)}
          getPopupContainer={() => getPosEle()}
          step={2}
        >
          <HollowOutGuide
            type="2"
            contentImg={GuideImg3}
            guideId={SALES_PITCH_GUIDE_ID}
            title={getIn18Text('WriteMailPitchGuideTitle')}
            intro={getIn18Text('WriteMailPitchGuideDetail')}
            placement="bottomRight"
            padding={[10, 10, 10, 10]}
            renderFooter={constructRenderMailDetailLastFooter()}
            getPopupContainer={() => getPosEle()}
            step={3}
          >
            {children}
          </HollowOutGuide>
        </HollowOutGuide>
      </HollowOutGuide>
    );
  }

  if (!guideVisible) {
    return null;
  }

  return (
    <HollowOutGuide
      enable={guideVisible}
      type="2"
      contentImg={GuideImg1}
      guideId={SALES_PITCH_GUIDE_ID}
      title={getIn18Text('salesPitchFirstGuideTitle')}
      intro={getIn18Text('salesPitchFirstGuideDetail')}
      placement="right"
      padding={[10, 10, 10, 10]}
      renderFooter={constructRenderFooter(1)}
      step={1}
    >
      <HollowOutGuide
        enable={guideVisible}
        type="2"
        contentImg={GuideImg2}
        guideId={SALES_PITCH_GUIDE_ID}
        title={getIn18Text('MailDetailPitchGuideTitle')}
        intro={getIn18Text('MailDetailPitchGuideDetail')}
        placement="right"
        padding={[10, 10, 10, 10]}
        renderFooter={constructRenderFooter(2)}
        step={2}
      >
        <HollowOutGuide
          enable={guideVisible}
          type="2"
          contentImg={GuideImg3}
          guideId={SALES_PITCH_GUIDE_ID}
          title={getIn18Text('WriteMailPitchGuideTitle')}
          intro={getIn18Text('WriteMailPitchGuideDetail')}
          placement="right"
          padding={[10, 10, 10, 10]}
          renderFooter={constructRenderMailWriteLastFooter()}
          step={3}
        >
          <div
            style={{
              position: 'fixed',
              top: writePageGuidePos.y,
              left: writePageGuidePos.x,
              width: writePageGuidePos.width,
              height: writePageGuidePos.height,
              zIndex: 999,
              pointerEvents: 'none',
            }}
          />
        </HollowOutGuide>
      </HollowOutGuide>
    </HollowOutGuide>
  );
};
// 240112版本下掉了引导，无引用了
const SalesPitchGuideHoc = (source: string) => {
  let Instance: React.ReactElement;
  const Comp: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    if (!Instance) {
      Instance = <SalesPitchGuide source={source}>{children}</SalesPitchGuide>;
    }
    return <SalesPitchGuide source={source}>{children}</SalesPitchGuide>;
  };
  return Comp;
};

export default SalesPitchGuideHoc;
