import React from 'react';
import Button from './index';

export const ButtonList: React.FC = () => {
  return (
    <>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="primary" size="mini" inline>
          常规按钮
        </Button>
        <Button btnType="primary" size="small" inline>
          常规按钮
        </Button>
        <Button btnType="primary" inline>
          常规按钮
        </Button>
        <Button btnType="primary" size="large" inline>
          常规按钮
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="primary" size="mini" disabled inline>
          常规disabled
        </Button>
        <Button btnType="primary" size="small" disabled inline>
          常规disabled
        </Button>
        <Button btnType="primary" disabled inline>
          常规disabled
        </Button>
        <Button btnType="primary" size="large" disabled inline>
          常规disabled
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="primary" size="mini" loading inline />
        <Button btnType="primary" size="small" loading inline />
        <Button btnType="primary" loading inline>
          loading
        </Button>
        <Button btnType="primary" size="large" loading inline>
          loading
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="minorLine" size="mini" inline>
          次要按钮
        </Button>
        <Button btnType="minorLine" size="small" inline>
          次要按钮
        </Button>
        <Button btnType="minorLine" inline>
          次要按钮
        </Button>
        <Button btnType="minorLine" size="large" inline>
          次要按钮
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="minorLine" size="mini" disabled inline>
          次要disabled
        </Button>
        <Button btnType="minorLine" size="small" disabled inline>
          次要disabled
        </Button>
        <Button btnType="minorLine" disabled inline>
          次要disabled
        </Button>
        <Button btnType="minorLine" size="large" disabled inline>
          次要disabled
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="minorLine" size="mini" loading inline />
        <Button btnType="minorLine" size="small" loading inline />
        <Button btnType="minorLine" loading inline>
          loading
        </Button>
        <Button btnType="minorLine" size="large" loading inline>
          loading
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button size="mini" inline>
          线框按钮
        </Button>
        <Button size="small" inline>
          线框按钮
        </Button>
        <Button inline>线框按钮</Button>
        <Button size="large" inline>
          线框按钮
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button size="mini" disabled inline>
          线框disabled
        </Button>
        <Button size="small" disabled inline>
          线框disabled
        </Button>
        <Button disabled inline>
          线框disabled
        </Button>
        <Button size="large" disabled inline>
          线框disabled
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button size="mini" loading inline />
        <Button size="small" loading inline />
        <Button loading inline>
          loading
        </Button>
        <Button size="large" loading inline>
          loading
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="danger" size="mini" inline>
          警示按钮
        </Button>
        <Button btnType="danger" size="small" inline>
          警示按钮
        </Button>
        <Button btnType="danger" inline>
          警示按钮
        </Button>
        <Button btnType="danger" size="large" inline>
          警示按钮
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="danger" size="mini" disabled inline>
          警示disabled
        </Button>
        <Button btnType="danger" size="small" disabled inline>
          警示disabled
        </Button>
        <Button btnType="danger" disabled inline>
          警示disabled
        </Button>
        <Button btnType="danger" size="large" disabled inline>
          警示disabled
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="danger" size="mini" loading inline />
        <Button btnType="danger" size="small" loading inline />
        <Button btnType="danger" loading inline>
          loading
        </Button>
        <Button btnType="danger" size="large" loading inline>
          loading
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="dashedLine" size="mini" inline>
          虚线按钮
        </Button>
        <Button btnType="dashedLine" size="small" inline>
          虚线按钮
        </Button>
        <Button btnType="dashedLine" inline>
          虚线按钮
        </Button>
        <Button btnType="dashedLine" size="large" inline>
          虚线按钮
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="dashedLine" size="mini" disabled inline>
          虚线disabled
        </Button>
        <Button btnType="dashedLine" size="small" disabled inline>
          虚线disabled
        </Button>
        <Button btnType="dashedLine" disabled inline>
          虚线disabled
        </Button>
        <Button btnType="dashedLine" size="large" disabled inline>
          虚线disabled
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="dashedLine" size="mini" loading inline />
        <Button btnType="dashedLine" size="small" loading inline />
        <Button btnType="dashedLine" loading inline>
          loading
        </Button>
        <Button btnType="dashedLine" size="large" loading inline>
          loading
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="link" size="mini" inline>
          文字按钮
        </Button>
        <Button btnType="link" size="small" inline>
          文字按钮
        </Button>
        <Button btnType="link" inline>
          文字按钮
        </Button>
        <Button btnType="link" size="large" inline>
          文字按钮
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="link" size="mini" disabled inline>
          文字disabled
        </Button>
        <Button btnType="link" size="small" disabled inline>
          文字disabled
        </Button>
        <Button btnType="link" disabled inline>
          文字disabled
        </Button>
        <Button btnType="link" size="large" disabled inline>
          文字disabled
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="link" size="mini" loading inline />
        <Button btnType="link" size="small" loading inline />
        <Button btnType="link" loading inline>
          loading
        </Button>
        <Button btnType="link" size="large" loading inline>
          loading
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="minorWhite" size="mini" inline>
          白底按钮
        </Button>
        <Button btnType="minorWhite" size="small" inline>
          白底按钮
        </Button>
        <Button btnType="minorWhite" inline>
          白底按钮
        </Button>
        <Button btnType="minorWhite" size="large" inline>
          白底按钮
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="minorWhite" size="mini" disabled inline>
          白底disabled
        </Button>
        <Button btnType="minorWhite" size="small" disabled inline>
          白底disabled
        </Button>
        <Button btnType="minorWhite" disabled inline>
          白底disabled
        </Button>
        <Button btnType="minorWhite" size="large" disabled inline>
          白底disabled
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="minorWhite" size="mini" loading inline />
        <Button btnType="minorWhite" size="small" loading inline />
        <Button btnType="minorWhite" loading inline>
          loading
        </Button>
        <Button btnType="minorWhite" size="large" loading inline>
          loading
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="minorGray" size="mini" inline>
          灰底按钮
        </Button>
        <Button btnType="minorGray" size="small" inline>
          灰底按钮
        </Button>
        <Button btnType="minorGray" inline>
          灰底按钮
        </Button>
        <Button btnType="minorGray" size="large" inline>
          灰底按钮
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="minorGray" size="mini" disabled inline>
          灰底disabled
        </Button>
        <Button btnType="minorGray" size="small" disabled inline>
          灰底disabled
        </Button>
        <Button btnType="minorGray" disabled inline>
          灰底disabled
        </Button>
        <Button btnType="minorGray" size="large" disabled inline>
          灰底disabled
        </Button>
      </p>
      <p style={{ display: 'flex', alignItems: 'center' }}>
        <Button btnType="minorGray" size="mini" loading inline />
        <Button btnType="minorGray" size="small" loading inline />
        <Button btnType="minorGray" loading inline>
          loading
        </Button>
        <Button btnType="minorGray" size="large" loading inline>
          loading
        </Button>
      </p>
    </>
  );
};

export default ButtonList;
