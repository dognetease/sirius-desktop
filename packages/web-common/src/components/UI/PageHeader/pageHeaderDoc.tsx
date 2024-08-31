import React from 'react';
import CompDoc from '../CompDoc/index';
import PageHeader from './index';
import Button from '../Button/index';
import IconCard from '@web-common/components/UI/IconCard/index';
import compDes from './compDes';

const PageHeaderDoc: React.FC = () => {
  const describe = `## PageHeader 页头`;

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Use
          npmPath="import PageHeader, { PageHeaderProps } from '@lingxi-common-component/sirius-ui/PageHeader';"
          path="import PageHeader from '@web-common/components/UI/PageHeader';"
        />
        <CompDoc.RenderCode describe="#### 完整的页头">
          <PageHeader
            className="page-header-test-class-name"
            title="页面标题"
            titleExtraIcon={<IconCard type="tongyong_cuowutishi_xian" />}
            subTitle="这是一段说明文案"
            extra={
              <>
                <Button>次要按钮</Button>
              </>
            }
            onBack={() => {
              alert('点了返回');
            }}
          ></PageHeader>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 自定义返回按钮 & 背景透明">
          <PageHeader
            bgTransparent
            backIcon={<IconCard type="tongyong_jiantou_zuo1" />}
            title="页面标题"
            titleExtraIcon={<IconCard type="tongyong_cuowutishi_xian" />}
            subTitle="这是一段说明文案"
            extra={
              <>
                <Button>次要按钮</Button>
              </>
            }
          ></PageHeader>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 无返回按钮 ">
          <PageHeader
            backIcon={false}
            title="页面标题"
            titleExtraIcon={<IconCard type="tongyong_cuowutishi_xian" />}
            subTitle="这是一段说明文案"
            extra={
              <>
                <Button>次要按钮</Button>
              </>
            }
          ></PageHeader>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 无标题和二级标题中间的图标">
          <PageHeader
            backIcon={false}
            title="页面标题"
            subTitle="这是一段说明文案"
            extra={
              <>
                <Button>次要按钮</Button>
              </>
            }
          ></PageHeader>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 无二级标题">
          <PageHeader
            backIcon={false}
            title="页面标题"
            extra={
              <>
                <Button>次要按钮</Button>
              </>
            }
          ></PageHeader>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 无操作区（操作区，位于 title 行的行尾）">
          <PageHeader backIcon={false} title="页面标题"></PageHeader>
        </CompDoc.RenderCode>
        <CompDoc.RenderTypeTable compDesProps={compDes[0].props} />
      </CompDoc>
    </>
  );
};

export default PageHeaderDoc;
