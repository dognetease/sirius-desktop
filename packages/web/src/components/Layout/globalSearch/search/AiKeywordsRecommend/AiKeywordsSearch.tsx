import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './index.module.scss';
import classNames from 'classnames';
import { Empty, Drawer, Radio, Tooltip, Form, Input, InputNumber, Select, Button } from 'antd';
// import { EnhanceSelect, InSingleOption, InMultiOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import { api, apis, CustomsRecord, CustomsRecordReq, DataTrackerApi, EdmCustomsApi, GlobalSearchCompanyDetail } from 'api';
// import useLangOption from '../../../CustomsData/customs/search/useLangOption';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
interface AiKeywordsSearchParams {
  type: number;
  language: string;
  size: number;
  text: string;
}

interface AiKeywordsSearchProp {
  visible: boolean;
  querySetNumber: () => void;
  type: string;
  createKeyWords: (value: string[]) => void;
  loading: (value: boolean) => void;
  updatePage: boolean;
  useNumber: number;
}

enum aiSearchType {
  product = 0,
  company,
  domain,
}

const useLangOption = [
  {
    label: '英语',
    value: '英语',
  },
  {
    label: '西班牙语',
    value: '西班牙语',
  },
  {
    label: '俄语',
    value: '俄语',
  },
  {
    label: '法语',
    value: '法语',
  },
  {
    label: '葡萄牙语',
    value: '葡萄牙语',
  },
  {
    label: '越南语',
    value: '越南语',
  },
];

const CustomsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

const AikeywordsSearch: React.FC<AiKeywordsSearchProp> = props => {
  const { visible, querySetNumber, type, createKeyWords, loading, updatePage, useNumber } = props;
  const [form] = Form.useForm<AiKeywordsSearchParams>();
  const [searchType, setSearchType] = useState<string>('');
  const [searchStatus, setSearchStatus] = useState<boolean>(false);
  const initParams: AiKeywordsSearchParams = {
    type: 0,
    language: '英语',
    size: 5,
    text: '',
  };

  const createRecommendKey = async () => {
    const fieldsValue = await form.validateFields();
    if (useNumber === 0) {
      SiriusMessage.warn('抱歉，今日AI推荐次数已用光，可明日继续使用');
      return;
    }
    const value = form.getFieldsValue();
    loading(true);
    setSearchStatus(true);
    CustomsApi.aiKeywordSearch(value)
      .then(data => {
        createKeyWords(data);
        querySetNumber();
        loading(false);
        setSearchStatus(false);
      })
      .catch(e => {
        querySetNumber();
        loading(false);
        setSearchStatus(false);
      });
  };
  useEffect(() => {
    if (type !== searchType) {
      setSearchType(type);
      // form.resetFields()
      form.setFields([{ name: 'type', value: aiSearchType[type] }]);
    }
  }, [type]);

  useEffect(() => {
    if (updatePage) {
      createRecommendKey();
    }
  }, [updatePage]);

  // console.log(langOptions, '_____@@@@@####这里');
  return (
    <>
      <div className={classNames(styles.aiSeach)}>
        <Form form={form} layout="vertical" colon={false} className={classNames(styles.form)} initialValues={initParams}>
          <Form.Item
            // hidden={searchType === 'goodsShipped'}
            hidden={true}
            name="type"
            label="联想类型"
            className={classNames(styles.formItem)}
          >
            <Radio.Group>
              <Radio.Button value={0}>{getIn18Text('CHANPIN')}</Radio.Button>
              <Radio.Button value={1}>{getIn18Text('GONGSIMINGCHENG')}</Radio.Button>
              <Radio.Button value={2}>{getIn18Text('GONGSIYUMING')}</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, curv) => {
              console.log(prev, curv, 24242424242);

              return prev.type !== curv.type;
            }}
          >
            {({ getFieldsValue }) => {
              const { type } = getFieldsValue(['type']);
              return (
                <Form.Item
                  name="text"
                  label={type === 0 ? '您的公司所经营的产品' : type === 1 ? '您寻找的公司' : '域名'}
                  className={classNames(styles.formItem)}
                  rules={[{ required: true }]}
                >
                  <Input
                    placeholder={type === 0 ? '请输入产品，如：汽车' : type === 1 ? '请输入公司名称，如：Netease' : '请输入公司域名，如：abc.com'}
                    className={classNames(styles.formInput)}
                    allowClear
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item
            // hidden={searchType === 'goodsShipped'}
            name="size"
            label="希望推荐的相关关键词数量："
            className={classNames(styles.formItem)}
            rules={[
              {
                required: true,
                pattern: /^([1-9]|10)$/, //输入内容进行正则校验
                message: '请输入1-10的纯数字',
              },
            ]}
          >
            <InputNumber style={{ width: '100%' }} className={classNames(styles.formInput)} min={1}></InputNumber>
            {/* <Input placeholder="input placeholder" className={classNames(styles.formInput)} allowClear /> */}
          </Form.Item>
          <Form.Item name="language" label="搜索使用语言" className={styles.formItem}>
            <EnhanceSelect size="large" placeholder={'请选择'}>
              {useLangOption.map(lo => (
                // <Select.Option value={lo.value} >{lo.label}</Select.Option>
                <InSingleOption value={lo.value}>{lo.label}</InSingleOption>
              ))}
            </EnhanceSelect>
          </Form.Item>
        </Form>
      </div>
      <div className={classNames(styles.searchBtn)}>
        <Button type="primary" className={classNames(styles.btn)} disabled={searchStatus} onClick={createRecommendKey}>
          AI生成推荐搜索词
        </Button>
      </div>
    </>
  );
};

export default AikeywordsSearch;
