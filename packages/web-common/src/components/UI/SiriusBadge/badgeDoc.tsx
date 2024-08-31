import React from 'react';
import Badge from './index';
import CompDoc from '../CompDoc/index';
import compDes from './compDes';
import variables from '@web-common/styles/export.module.scss';
import './style.scss';

const BadgeDoc: React.FC = () => {
  const describe = `## Badge 徽标
    图标右上角的圆形徽标数字或者文案，一般出现在通知图标或头像的右上角，用于显示需要处理的消息条数，通过醒目视觉形式吸引用户处理。`;

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Use
          npmPath="import Badge, { BadgeProps } from '@lingxi-common-component/sirius-ui/SiriusBadge';"
          path="import Badge from '@web-common/components/UI/SiriusBadge';"
        />
        <CompDoc.RenderCode describe="#### 简单的徽章展示，当 count 为 0 时，默认不显示，但是可以使用 showZero 修改为显示。">
          <Badge count={9}>
            <div className="badge-comp-gray-block" />
          </Badge>
          <Badge count={99}>
            <div className="badge-comp-gray-block" />
          </Badge>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### dot为true。状态点，用于表示状态的小圆点。dotSize设置状态点大小，default宽高8px，small宽高6px">
          <Badge dot>
            <div className="badge-comp-gray-block" />
          </Badge>
          <Badge dot dotSize="small">
            <div className="badge-comp-gray-block" />
          </Badge>
          <Badge dot color={variables.fill5}>
            <div className="badge-comp-gray-block" />
          </Badge>
          <Badge dot color={variables.fill5} dotSize="small">
            <div className="badge-comp-gray-block" />
          </Badge>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### intro设置文本徽标 ">
          <Badge intro="新功能">
            <div className="badge-comp-gray-block" />
          </Badge>
          <Badge intro="热点">
            <div className="badge-comp-gray-block" />
          </Badge>
          <Badge intro="新产品">
            <div className="badge-comp-gray-block" />
          </Badge>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 封顶数字，超过 overflowCount 的会显示为 ${overflowCount}+，默认的 overflowCount 为 99。">
          <div className="badge-comp-wrap">
            <Badge count={200} overflowCount={99} />
            <Badge count={1223} overflowCount={999} />
          </div>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 独立使用，不包裹任何元素即是独立使用，可通过style={}自定样式展现, 比如style={{ backgroundColor: #C9CBD6 }}">
          <div className="badge-comp-wrap">
            <Badge count={9} style={{ backgroundColor: variables.fill5 }} />
            <Badge count={9} />
            <Badge count={99} />
            <Badge dot />
            <Badge dot dotSize="small" />
            <Badge dot color="#c9cbd6" />
            <Badge dot color="#c9cbd6" dotSize="small" />
            <Badge intro="新功能" />
            <Badge intro="Beta" style={{ backgroundColor: variables.success6 }} />
            <Badge intro="展会" style={{ backgroundColor: variables.success6 }} />
          </div>
        </CompDoc.RenderCode>
        <CompDoc.RenderTypeTable compDesProps={compDes[0].props} />
      </CompDoc>
    </>
  );
};

export default BadgeDoc;
