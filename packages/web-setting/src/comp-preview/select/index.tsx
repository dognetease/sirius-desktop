import React from 'react';
import { Form, message, Divider, Button } from 'antd';
// import { EnhanceSelect, InSingleOption, InMultiOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import styles from './index.module.scss';

export const SelectComponent = () => {
  const [form] = Form.useForm();
  const [isDisabled, setDisabled] = React.useState(false);
  const handleClick = () => {
    form
      .validateFields()
      .then(() => {
        console.log('sky', form.getFieldValue('sky'));
      })
      .catch(() => {
        message.info({
          content: '请填写完整数据～',
        });
      });
  };

  const handleDisabledClick = () => setDisabled(!isDisabled);

  // @ts-ignore
  const handleSelect = (value, option) => {
    console.log('value: ', value);
    console.log('option: ', option);
  };

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
        { label: 'Tiktok', value: 'tiktok' },
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

  return (
    <>
      <Divider orientation="left">基础使用</Divider>
      <EnhanceSelect allowClear size="large" disabled={isDisabled} placeholder={'请选择'} style={{ width: 300 }}>
        <InSingleOption disabled value="lucy">
          路西
        </InSingleOption>
        <InSingleOption value="jack">杰克</InSingleOption>
        <InSingleOption value="nice">奶昔</InSingleOption>
      </EnhanceSelect>
      <br />
      <Divider orientation="left">两种大小</Divider>
      <div className="comp-list-box">
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
      </div>
      <div className="comp-list-box">
        <EnhanceSelect defaultValue={['jack', 'nice']} mode="multiple" disabled={isDisabled} placeholder={'请选择'} style={{ width: 300 }}>
          <InMultiOption value="jack">杰克</InMultiOption>
          <InMultiOption value="nice">奶昔</InMultiOption>
          <InMultiOption value="make">麦克</InMultiOption>
        </EnhanceSelect>
        <EnhanceSelect defaultValue={['jack', 'nice']} mode="multiple" size="large" disabled={isDisabled} placeholder={'请选择'} style={{ width: 300 }}>
          <InMultiOption value="jack">杰克</InMultiOption>
          <InMultiOption value="nice">奶昔</InMultiOption>
          <InMultiOption value="make">麦克</InMultiOption>
        </EnhanceSelect>
      </div>
      <Divider orientation="left">无边框</Divider>
      <div className="comp-list-box">
        <EnhanceSelect bordered={false} disabled={isDisabled} placeholder={'请选择'} allowClear style={{ width: 84 }}>
          <InSingleOption disabled value="lucy">
            路西
          </InSingleOption>
          <InSingleOption value="jack">杰克</InSingleOption>
          <InSingleOption value="nice">奶昔</InSingleOption>
        </EnhanceSelect>
      </div>
      <Divider orientation="left">loading 状态</Divider>
      <div className="comp-list-box">
        <EnhanceSelect fetching disabled={isDisabled} placeholder={'请选择'} allowClear style={{ width: 300 }} />
      </div>
      <Divider orientation="left">分组</Divider>
      <EnhanceSelect options={SearchSiteList} allowClear disabled={isDisabled} placeholder={'请选择'} style={{ width: 300 }} />
      <Divider orientation="left">表单中的表现</Divider>
      <Form form={form} initialValues={{ sky: 'nice', multipleSelect: ['make', 'jack'] }}>
        <div className={styles.compListBox}>
          <Form.Item name="sky" label="sky" rules={[{ required: true, message: '数据不能为空' }]}>
            <EnhanceSelect showSearch onChange={handleSelect} optionFilterProp="name" disabled={isDisabled} placeholder={'请选择'} style={{ width: 300 }}>
              <InSingleOption value="lucy">路西</InSingleOption>
              <InSingleOption value="jack">杰克</InSingleOption>
              <InSingleOption value="nice">奶昔</InSingleOption>
            </EnhanceSelect>
          </Form.Item>
          <Form.Item name="searchSelect" label="带搜索的 Select" rules={[{ required: true, message: '数据不能为空' }]}>
            <EnhanceSelect showSearch allowClear onChange={handleSelect} disabled={isDisabled} placeholder={'请选择'} optionFilterProp="name" style={{ width: 300 }}>
              {/* 第一项搜不到，因为有<span>包裹 */}
              <InSingleOption value="lucy">
                <span>路西</span>
              </InSingleOption>
              <InSingleOption value="jack">杰克</InSingleOption>
              <InSingleOption value="nice">奶昔</InSingleOption>
            </EnhanceSelect>
          </Form.Item>
          <Form.Item name="multipleSelect" label="多选 Select" rules={[{ required: true, message: '数据不能为空' }]}>
            <EnhanceSelect
              mode="multiple"
              disabled={isDisabled}
              onChange={handleSelect}
              showSearch
              optionFilterProp="name"
              showArrow
              allowClear
              maxTagCount="responsive"
              placeholder={'请选择'}
              style={{ width: 300 }}
            >
              <InMultiOption value="lucy" disabled={true}>
                路西
              </InMultiOption>
              <InMultiOption value="jack">杰克</InMultiOption>
              <InMultiOption value="nice">奶昔</InMultiOption>
              <InMultiOption value="make">麦克</InMultiOption>
              <InMultiOption value="john">约翰</InMultiOption>
            </EnhanceSelect>
          </Form.Item>
        </div>
        <Button onClick={handleClick}> 提交 </Button>
        <Button style={{ marginLeft: 20 }} onClick={handleDisabledClick}>
          {' '}
          {isDisabled ? '不禁用' : '禁用'}{' '}
        </Button>
        {/* <Divider orientation="left">dropdownRender</Divider>
				<EnhanceSelect
					mode="multiple"
					dropdownRender={(menu) => (
						<>
							{menu}
							<Divider style={{ margin: '8px 0' }} />
							<Space align="center" style={{ padding: '0 8px 4px' }}>
								<Button>选择当前显示字段</Button>
								<Button>选择全部字段</Button>
							</Space>
						</>
					)}
					disabled={isDisabled}
					placeholder={'请选择'}
					style={{ width: 300 }}
				>
					<InMultiOption value="jack">杰克</InMultiOption>
					<InMultiOption value="nice">奶昔</InMultiOption>
					<InMultiOption value="make">麦克</InMultiOption>
					<InMultiOption value="john">约翰</InMultiOption>
				</EnhanceSelect>
				*/}
      </Form>
    </>
  );
};
