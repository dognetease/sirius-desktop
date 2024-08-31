import React from 'react';
import Tag from './index';
import CompDoc from '../CompDoc/index';
import compDes from './compDes';
import './tag.scss';

const TagDoc: React.FC = () => {
  const describe = `## Tag 标签
    进行标记和分类的小标签。`;

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <a
          style={{ paddingLeft: '15px' }}
          target="_blank"
          href="https://www.figma.com/file/1F6cc4nycRU4WjWZ0WKXvU/%E6%96%B0%E7%89%88%E7%81%B5%E7%8A%80%E8%A7%84%E8%8C%83-%E6%A1%8C%E9%9D%A2%E7%AB%AF?node-id=4987%3A53626&t=DF2Rojq7WdFGcYtM-0"
        >
          标签UI稿
        </a>
        <CompDoc.Use npmPath="import Tag, { TagProps } from '@lingxi-common-component/sirius-ui/Tag';" path="import Tag from '@web-common/components/UI/Tag';" />
        <CompDoc.RenderCode describe="#### 卡片标签 通用场景，一般用于自定义内容的标签展示">
          <div className="btn-row">
            <Tag type="label-1-1" hideBorder={true}>
              优质客户
            </Tag>
            <Tag type="label-2-1" hideBorder={true}>
              优质客户
            </Tag>
            <Tag type="label-3-1" hideBorder={true}>
              优质客户
            </Tag>
            <Tag type="label-4-1" hideBorder={true}>
              优质客户
            </Tag>
            <Tag type="label-5-1" hideBorder={true}>
              优质客户
            </Tag>
            <Tag type="label-6-1" hideBorder={true}>
              优质客户
            </Tag>
          </div>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 描边标签 特殊场景，一般用于内容信息较多，起到弱分割作用的场景">
          <div className="btn-row">
            <Tag type="label-1-1">优质客户</Tag>
            <Tag type="label-2-1">优质客户</Tag>
            <Tag type="label-3-1">优质客户</Tag>
            <Tag type="label-4-1">优质客户</Tag>
            <Tag type="label-5-1">优质客户</Tag>
            <Tag type="label-6-1">优质客户</Tag>
          </div>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 可删除卡片标签">
          <div className="btn-row">
            <Tag type="label-1-1" closable={true}>
              优质客户
            </Tag>
            <Tag type="label-2-1" closable={true}>
              优质客户
            </Tag>
            <Tag type="label-3-1" closable={true}>
              优质客户
            </Tag>
            <Tag type="label-4-1" closable={true}>
              优质客户
            </Tag>
            <Tag type="label-5-1" closable={true}>
              优质客户
            </Tag>
            <Tag type="label-6-1" closable={true}>
              优质客户
            </Tag>
          </div>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 系统标签">
          <div className="btn-row">
            <Tag bgColor="#fff" borderColor="#4C6AFF" fontColor="#4C6AFF">
              群主
            </Tag>
            <Tag bgColor="#fff" borderColor="#FFB54C" fontColor="#FFB54C">
              未启用
            </Tag>
            <Tag bgColor="#fff" borderColor="#FE5B4C" fontColor="#FE5B4C">
              已失效
            </Tag>
            <Tag bgColor="#fff" borderColor="#0FD683" fontColor="#0DC076">
              通过
            </Tag>
          </div>
        </CompDoc.RenderCode>
        <CompDoc.RenderTypeTable compDesProps={compDes[0].props} />
      </CompDoc>
    </>
  );
};

export default TagDoc;
