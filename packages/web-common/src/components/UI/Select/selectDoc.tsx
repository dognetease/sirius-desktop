import React from 'react';
import { Button } from 'antd';
import { EnhanceSelect, InSingleOption, InMultiOption } from './index';
import CompDoc from '../CompDoc/index';

const SearchSiteList = [
  {
    label: '社交平台',
    options: [
      { label: 'Facebook', value: 'facebook' },
      { label: 'LinkedIn', value: 'linkedin' },
      { label: 'Twitter', value: 'twitter' },
      { label: 'Instagram', value: 'instagram' },
      { label: 'Telegram', value: 'telegram' },
      { label: 'Line', value: 'line' },
      { label: 'Snapchat', value: 'snapchat' },
      { label: 'Tumbler', value: 'tumbler' },
      { label: 'Pinterest', value: 'pinterest' },
      { label: 'Vk', value: 'vk' },
      { label: 'Skype', value: 'skype' },
      { label: 'Viber', value: 'viber' },
      { label: 'Crunchbase', value: 'crunchbase' },
    ],
  },
  {
    label: '短视频平台',
    options: [
      { label: 'Youtube', value: 'youtube' },
      { label: 'Ticktok', value: 'ticktok' },
      { label: 'Kwai', value: 'kwai' },
    ],
  },
  {
    label: '电商平台',
    options: [
      { label: 'Amazon', value: 'amazon' },
      { label: 'Aliexpress', value: 'aliexpress' },
      { label: 'Wish', value: 'wish' },
      { label: 'Shopee', value: 'shopee' },
      { label: 'Ebay', value: 'ebay' },
      { label: 'Lazada', value: 'lazada' },
    ],
  },
];

const ButtonDoc: React.FC = () => {
  const describe = `## Select 选择器
    当前组件是基于antd 的 Select 组件包装生成的，所以支持 antd Select 组件所有API。`;
  const [isDisabled, setDisabled] = React.useState(false);
  const handleDisabledClick = () => setDisabled(!isDisabled);

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Link href="https://3x.ant.design/components/select-cn/">antd Select 文档</CompDoc.Link>
        <CompDoc.Use
          npmPath="import { EnhanceSelect, InSingleOption, InMultiOption, EnhanceSelectProps, InMultiOptionProps, InSingleOptionProps } from '@lingxi-common-component/sirius-ui/Select';"
          path="import { EnhanceSelect, InSingleOption, InMultiOption } from '@web-common/components/UI/Select';"
        />
        <Button style={{ marginLeft: 20 }} onClick={handleDisabledClick}>
          当前 disabled {isDisabled ? '禁用' : '不禁用'}
        </Button>
        <CompDoc.RenderCode
          customCode={`<EnhanceSelect allowClear size="large" disabled={isDisabled} placeholder="请选择" style={{ width: 300 }}>
            <InSingleOption disabled value="lucy">
              路西
            </InSingleOption>
            <InSingleOption value="jack">杰克</InSingleOption>
            <InSingleOption value="nice">奶昔</InSingleOption>
          </EnhanceSelect>`}
          describe="#### 基础使用"
        >
          <EnhanceSelect allowClear size="large" disabled={isDisabled} placeholder="请选择" style={{ width: 300 }}>
            <InSingleOption disabled value="lucy">
              路西
            </InSingleOption>
            <InSingleOption value="jack">杰克</InSingleOption>
            <InSingleOption value="nice">奶昔</InSingleOption>
          </EnhanceSelect>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<EnhanceSelect defaultValue={'jack'} disabled={isDisabled} placeholder={'请选择'} style={{ width: 300 }}>
            <InSingleOption disabled value="lucy">
              路西
            </InSingleOption>
            <InSingleOption value="jack">杰克</InSingleOption>
            <InSingleOption value="nice">奶昔</InSingleOption>
          </EnhanceSelect>
          <EnhanceSelect defaultValue={'jack'} size="large" disabled={isDisabled} placeholder={'请选择'} style={{ width: 300 }}>
            <InSingleOption disabled value="lucy">
              路西
            </InSingleOption>
            <InSingleOption value="jack">杰克</InSingleOption>
            <InSingleOption value="nice">奶昔</InSingleOption>
          </EnhanceSelect>`}
          describe="#### size 选择框大小，可选 large small，默认 small"
        >
          <EnhanceSelect defaultValue={'jack'} disabled={isDisabled} placeholder={'请选择'} style={{ width: 300 }}>
            <InSingleOption disabled value="lucy">
              路西
            </InSingleOption>
            <InSingleOption value="jack">杰克</InSingleOption>
            <InSingleOption value="nice">奶昔</InSingleOption>
          </EnhanceSelect>
          <EnhanceSelect defaultValue={'jack'} size="large" disabled={isDisabled} placeholder={'请选择'} style={{ width: 300 }}>
            <InSingleOption disabled value="lucy">
              路西
            </InSingleOption>
            <InSingleOption value="jack">杰克</InSingleOption>
            <InSingleOption value="nice">奶昔</InSingleOption>
          </EnhanceSelect>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<EnhanceSelect defaultValue={['jack', 'nice']} mode="multiple" disabled={isDisabled} placeholder={'请选择'} style={{ width: 300 }}>
            <InMultiOption value="jack">杰克</InMultiOption>
            <InMultiOption value="nice">奶昔</InMultiOption>
            <InMultiOption value="make">麦克</InMultiOption>
          </EnhanceSelect>`}
          describe="#### mode	设置 Select 的模式为多选或标签，'multiple' | 'tags'"
        >
          <EnhanceSelect defaultValue={['jack', 'nice']} mode="multiple" disabled={isDisabled} placeholder={'请选择'} style={{ width: 300 }}>
            <InMultiOption value="jack">杰克</InMultiOption>
            <InMultiOption value="nice">奶昔</InMultiOption>
            <InMultiOption value="make">麦克</InMultiOption>
          </EnhanceSelect>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<EnhanceSelect bordered={false} disabled={isDisabled} placeholder={'请选择'} allowClear style={{ width: 84 }}>
            <InSingleOption disabled value="lucy">
              路西
            </InSingleOption>
            <InSingleOption value="jack">杰克</InSingleOption>
            <InSingleOption value="nice">奶昔</InSingleOption>
          </EnhanceSelect>`}
          describe="#### bordered	设置 Select 无边框"
        >
          <EnhanceSelect bordered={false} disabled={isDisabled} placeholder={'请选择'} allowClear style={{ width: 84 }}>
            <InSingleOption disabled value="lucy">
              路西
            </InSingleOption>
            <InSingleOption value="jack">杰克</InSingleOption>
            <InSingleOption value="nice">奶昔</InSingleOption>
          </EnhanceSelect>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<EnhanceSelect fetching disabled={isDisabled} placeholder={'请选择'} allowClear style={{ width: 300 }} />`}
          describe="#### fetching 设置 loading 状态"
        >
          <EnhanceSelect fetching disabled={isDisabled} placeholder={'请选择'} allowClear style={{ width: 300 }} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          customCode={`<EnhanceSelect options={SearchSiteList} allowClear disabled={isDisabled} placeholder={'请选择'} style={{ width: 300 }} />`}
          describe="#### 分组"
        >
          <EnhanceSelect options={SearchSiteList} allowClear disabled={isDisabled} placeholder={'请选择'} style={{ width: 300 }} />
        </CompDoc.RenderCode>
      </CompDoc>
    </>
  );
};

export default ButtonDoc;
