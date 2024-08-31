import React from 'react';
import CompDoc from '../CompDoc/index';
import Cascader from './index';

const addressOptions = [
  {
    label: '福建',
    value: 'fj',
    children: [
      {
        label: '福州',
        value: 'fuzhou',
        children: [
          {
            label: '马尾',
            value: 'mawei',
          },
        ],
      },
      {
        label: '泉州',
        value: 'quanzhou',
      },
      {
        label: '建州',
        value: 'jianzhou',
      },
      {
        label: '漳州',
        value: 'zhanzhou',
        disabled: true,
      },
    ],
  },
  {
    label: '浙江',
    value: 'zj',
    children: [
      {
        label: '杭州',
        value: 'hangzhou',
        children: [
          {
            label: '余杭',
            value: 'yuhang',
          },
        ],
      },
    ],
  },
  {
    label: '北京',
    value: 'bj',
    children: [
      {
        label: '朝阳区',
        value: 'chaoyang',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
    ],
  },
  {
    label: '这是一个最长字符是一个长字符',
    value: 'cjf',
  },
];

for (let i = 0; i < 100; i++) {
  addressOptions.push({
    label: '北京' + i,
    value: 'bj' + i,
    children: [
      {
        label: '朝阳区',
        value: 'chaoyang',
      },
      {
        label: '海淀区',
        value: 'haidian',
      },
    ],
  });
}

addressOptions.push({
  label: '北京11111',
  value: 'bj1111',
  children: [
    {
      label: '朝阳区',
      value: 'chaoyang',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
    {
      label: '海淀区',
      value: 'haidian',
    },
  ],
});

const PaginationDoc: React.FC = () => {
  const describe = `## Cascader级联菜单
    当前组件是基于 rc-cascader 组件包装生成的，所以支持 rc-cascader 组件所有API。`;

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Link href="https://www.npmjs.com/package/rc-cascader">rc-cascader 文档</CompDoc.Link>
        <CompDoc.Use
          npmPath="import Cascader, { CascaderProps } from '@lingxi-common-component/sirius-ui/Cascader';"
          path="import Cascader from '@web-common/components/UI/Cascader';"
        />
        <CompDoc.RenderCode describe="#### 禁用" customCode={`<Cascader disabled placeholder="请选择" style={{ width: 300 }} options={addressOptions} />`}>
          <Cascader disabled placeholder="请选择" style={{ width: 300 }} options={addressOptions} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<Cascader size="mini" allowClear defaultValue={['bj', 'chaoyang']} placeholder="请选择" style={{ width: 300 }} options={addressOptions} /><Cascader size="small" allowClear defaultValue={['bj', 'chaoyang']} placeholder="请选择" style={{ width: 300 }} options={addressOptions} /><Cascader allowClear defaultValue={['bj', 'chaoyang']} placeholder="请选择" style={{ width: 300 }} options={addressOptions} /><Cascader size="large" allowClear defaultValue={['bj', 'chaoyang']} placeholder="请选择" style={{ width: 300 }} options={addressOptions} />`}
          describe="#### size 不同大小，'mini' | 'small' | 'default' | 'large' ，默认为 default"
        >
          <Cascader size="mini" allowClear defaultValue={['bj', 'chaoyang']} placeholder="请选择" style={{ width: 300 }} options={addressOptions} />
          <Cascader size="small" allowClear defaultValue={['bj', 'chaoyang']} placeholder="请选择" style={{ width: 300 }} options={addressOptions} />
          <Cascader allowClear defaultValue={['bj', 'chaoyang']} placeholder="请选择" style={{ width: 300 }} options={addressOptions} />
          <Cascader size="large" allowClear defaultValue={['bj', 'chaoyang']} placeholder="请选择" style={{ width: 300 }} options={addressOptions} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode customCode={`<Cascader placeholder="请选择" style={{ width: 300 }} options={addressOptions} />`} describe="#### 单选">
          <Cascader placeholder="请选择" style={{ width: 300 }} options={addressOptions} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<Cascader multiple maxTagCount="responsive" placeholder="请选择" style={{ width: 300 }} onBlur={() => { console.log('Cascader multiple onBlur event');}} options={addressOptions}/>`}
          describe="#### 多选"
        >
          <Cascader
            multiple
            maxTagCount="responsive"
            placeholder="请选择"
            style={{ width: 300 }}
            onBlur={() => {
              console.log('Cascader multiple onBlur event');
            }}
            options={addressOptions}
          />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<Cascader multiple showCheckedStrategy="SHOW_CHILD" placeholder="请选择" style={{ width: 300 }} options={addressOptions} />`}
          describe="#### 只显示子节点"
        >
          <Cascader multiple showCheckedStrategy="SHOW_CHILD" placeholder="请选择" style={{ width: 300 }} options={addressOptions} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<Cascader multiple maxTagCount={3} showCheckedStrategy="SHOW_CHILD" placeholder="请选择" style={{ width: 248 }} options={addressOptions} />`}
          describe="#### 多余省略"
        >
          <Cascader multiple maxTagCount={3} showCheckedStrategy="SHOW_CHILD" placeholder="请选择" style={{ width: 248 }} options={addressOptions} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<Cascader fetching showSearch placeholder="请选择" style={{ width: 300 }} options={addressOptions} />`}
          describe="#### 【beta】loading 状态"
        >
          <Cascader fetching showSearch placeholder="请选择" style={{ width: 300 }} options={addressOptions} />
        </CompDoc.RenderCode>
      </CompDoc>
    </>
  );
};

export default PaginationDoc;
