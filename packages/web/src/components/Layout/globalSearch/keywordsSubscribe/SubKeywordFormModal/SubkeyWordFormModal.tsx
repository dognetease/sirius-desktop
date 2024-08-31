import { api, apis, GlobalSearchApi, GlobalSearchSubKeywordType } from 'api';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { Form, Select, Input, Button } from 'antd';
import { Rule } from 'antd/lib/form';
import React, { useContext, useEffect, useRef, useState } from 'react';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { SubKeyWordContext } from '../subcontext';
import styles from './subkeymodal.module.scss';
import { globalSearchDataTracker } from '../../tracker';
import GuideToolTip from '../GuideTooltip';
import { useGlobalSearchCountryHook } from '../../hook/globalSearchCountryHook';
import HscodeDropList from '@/components/Layout/CustomsData/customs/docSearch/component/HscodeDropList/HscodeDropList';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import { ReactComponent as RemoveIcon } from './form-remove.svg';
import { getIn18Text } from 'api';
// import Cascader from '@web-common/components/UI/Cascader';
import Cascader from '@lingxi-common-component/sirius-ui/Cascader';

const ArrowDown = () => <i className={styles.arrowDown} />;

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

export interface KeywordsForm {
  product: GlobalSearchSubKeywordType;
  keyword: string;
  country?: string[][];
  id?: number;
  targetCompanys?: Array<{
    companyName?: string;
    domain?: string;
  }>;
}

const SubKeywordFormModal: React.FC<{}> = () => {
  const [form] = Form.useForm<KeywordsForm>();
  const [state, dispatch] = useContext(SubKeyWordContext);
  const [continentList] = useGlobalSearchCountryHook();
  const keywordInputRef = useRef<Input>(null);
  const [hsCodeListVisible, setHsCodeListVisible] = useState<boolean>(false);
  const handleClose = () => {
    dispatch({
      type: 'MODAL_OPEN_CHANGE',
      payload: {
        open: false,
      },
    });
  };
  const handleFinish = async () => {
    if (state.list.length > 20) {
      globalSearchDataTracker.trackKeywordSubCreateOverflow();
      return SiriusMessage.error(getIn18Text('ZUIDUOKEDINGYUE20GEGUANJIANCI'));
    }
    dispatch({
      type: 'ADD_START',
    });
    try {
      const values = await form.validateFields();
      values.targetCompanys = values.targetCompanys?.filter(target => {
        return target.companyName || target.domain;
      });
      const country = values.country?.map(cl => {
        const [last] = cl.slice().reverse();
        return last;
      });
      if (state.modalInit?.id) {
        await globalSearchApi.doUpdateProductSub({
          type: values.product,
          value: values.keyword,
          country: country,
          id: state.modalInit.id,
          targetCompanys: values.targetCompanys,
        });
        SiriusMessage.success('保存成功，系统将在24小时内返回订阅结果');
      } else {
        await globalSearchApi.doCreateSub({
          type: values.product,
          value: values.keyword,
          country: country,
          targetCompanys: values.targetCompanys,
        });
        SiriusMessage.success('新建订阅规则成功，系统将在24小时内返回订阅结果');
      }
      dispatch({
        type: 'LIST_REFRESH',
      });
      dispatch({
        type: 'MODAL_OPEN_CHANGE',
        payload: {
          open: false,
        },
      });
    } catch (error) {}
    dispatch({
      type: 'ADD_FINISH',
    });
  };
  useEffect(() => {
    const { id, targetCompanys, country, ...initVal } = state.modalInit || {};
    const countrys: string[][] = [];
    const targetCountrysSet = new Set(country?.slice());
    if (targetCountrysSet.size > 0) {
      continentList.forEach(continent => {
        continent.countries.forEach(country => {
          if (targetCountrysSet.has(country.name)) {
            countrys.push([continent.continent, country.name]);
          }
        });
      });
    }
    form.setFieldsValue({
      ...initVal,
      country: countrys,
      targetCompanys: targetCompanys?.length
        ? targetCompanys
        : [
            {
              companyName: '',
              domain: '',
            },
          ],
    });
    setHsCodeListVisible(false);
  }, [state.modalInit, continentList]);

  return (
    <SiriusModal
      className={styles.modal}
      visible={state.addModalOpen}
      width={480}
      destroyOnClose
      onOk={handleFinish}
      okButtonProps={{
        loading: state.addLoading,
      }}
      onCancel={handleClose}
      transitionName=""
    >
      <h3 className={styles.title}>{state.modalInit?.id ? '编辑' : '新建'}订阅规则</h3>
      <Form<KeywordsForm>
        form={form}
        preserve={false}
        // layout="inline"
        className={styles.form}
        initialValues={{
          product: 'product',
          targetCompanys: [
            {
              companyName: '',
              domain: '',
            },
          ],
        }}
      >
        <p className={styles.formtitle}>
          <i>*</i>
          {getIn18Text('CHANPINMINGCHENG')}/HSCode
        </p>
        <div className={styles.inlineWrapper}>
          <GuideToolTip
            getPopupContainer={() => document.getElementsByClassName(styles.form)[0] as HTMLElement}
            storeId="global_search_keyword_sub_select_type"
            title={getIn18Text('KEANZHAOCHANPINMINGCHENG\u3001HSCodeJINXINGDINGYUE\u3002')}
            placement="bottomLeft"
          >
            <Form.Item name="product">
              <Select
                suffixIcon={<ArrowDown />}
                style={{ width: 100 }}
                onChange={() => {
                  form.setFieldsValue({
                    keyword: '',
                  });
                }}
              >
                <Select.Option value="product">{getIn18Text('CHANPINMINGCHENG')}</Select.Option>
                <Select.Option value="hscode">HSCode</Select.Option>
              </Select>
            </Form.Item>
          </GuideToolTip>
          <span className={styles.includeText}>{getIn18Text('BAOHAN')}</span>
          <Form.Item noStyle dependencies={['product']}>
            {({ getFieldValue }) => {
              const optionVal = getFieldValue(['product']);
              const optionDependRule: Record<string, Rule[]> = {
                product: [
                  {
                    required: true,
                    min: 2,
                    message: getIn18Text('QINGZHISHAOSHURU2GEZIFU'),
                  },
                  {
                    max: 100,
                    message: '最大不超过100字符',
                  },
                ],
                hscode: [
                  {
                    required: true,
                    min: 4,
                    message: getIn18Text('XUZHISHAOSHURU4WEIHSCode'),
                  },
                  {
                    max: 16,
                    message: '最大不超过16字符',
                  },
                  {
                    pattern: /^\d+$/,
                    message: getIn18Text('QINGSHURUZHENGQUEDEGUANJIANCI'),
                  },
                ],
              };
              return (
                <Form.Item name="keyword" style={{ flex: 1 }} rules={optionDependRule[optionVal]}>
                  <Input
                    onChange={() => {
                      if (optionVal === 'hscode') {
                        setHsCodeListVisible(true);
                      }
                    }}
                    ref={keywordInputRef}
                    placeholder={
                      optionVal === 'product'
                        ? getIn18Text('QINGSHURUXUYAOZHUIZONGDEGUANJIANCI\uFF0CRU\uFF1Atoy')
                        : getIn18Text('QINGSHURUXUYAOZHUIZONGDEHSCode\uFF0CRU\uFF1A1001')
                    }
                    allowClear
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
        </div>
        <p className={styles.formtitle}>填入目标客户的相关信息，推荐更准确</p>
        <div className={styles.listForm}>
          <p className={styles.formtitle} style={{ marginBottom: 8 }}>
            {getIn18Text('KEHUSUOZAIGUOJIA/DIQU')}
          </p>
          <Form.Item
            className={styles.oneLineItem}
            style={{ marginBottom: 20 }}
            name="country"
            rules={[
              {
                max: 10,
                type: 'array',
                message: '最多选择10个国家',
              },
            ]}
          >
            <Cascader
              showSearch
              showCheckedStrategy="SHOW_CHILD"
              allowClear
              style={{ width: '100%', borderRadius: '2px' }}
              multiple
              maxTagCount="responsive"
              placeholder={getIn18Text('BUXIAN')}
              options={continentList.map(e => ({
                label: e.continentCn,
                value: e.continent,
                children: e.countries.map(d => ({
                  label: `${d.nameCn}-${d.name}`,
                  value: d.name,
                })),
              }))}
            />
          </Form.Item>
          <Form.Item noStyle dependencies={['product', 'keyword']}>
            {({ getFieldValue }) => {
              const optionVal = getFieldValue(['product']);
              const keywordVal = optionVal === 'hscode' ? getFieldValue(['keyword']) : '';
              return (
                <HscodeDropList
                  placement="bottom-start"
                  sameWith={false}
                  className={styles.hscodeDrop}
                  isFouse
                  onSelect={val => {
                    form.setFieldsValue({
                      keyword: val,
                    });
                    setHsCodeListVisible(false);
                  }}
                  visible={hsCodeListVisible}
                  onChangeVisible={setHsCodeListVisible}
                  searchValue={keywordVal}
                  target={keywordInputRef.current?.input.parentElement || null}
                />
              );
            }}
          </Form.Item>
        </div>
      </Form>
    </SiriusModal>
  );
};
export default SubKeywordFormModal;
