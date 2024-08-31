import { api, apis, GlobalSearchApi, GlobalSearchSubKeywordType, SmartRcmdItem } from 'api';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { Form, Select, Input, Button, ModalProps, Tooltip, Checkbox, Row, Col } from 'antd';
import React, { useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
// import { SubKeyWordContext } from '../subcontext';
import styles from './ruleformmodal.module.scss';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import { ReactComponent as RemoveIcon } from './form-remove.svg';
import { ReactComponent as CarriageIcon } from './carriage-return.svg';
import { ReactComponent as AlertIcon } from './alert.svg';
import { getIn18Text } from 'api';
import { useGlobalSearchCountryHook } from '../../../hook/globalSearchCountryHook';
import classNames from 'classnames';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
// import Cascader from '@web-common/components/UI/Cascader';
import Cascader from '@lingxi-common-component/sirius-ui/Cascader';
// import { EnhanceSelect, InMultiOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import { useDebounce } from 'react-use';
import { edmCustomsApi } from '../../../constants';
import { useMemoizedFn } from 'ahooks';

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

export interface KeywordsForm {
  keyword: string[];
  country?: string[][];
  id?: number;
  targetCompanys?: Array<{
    companyName?: string;
    domain?: string;
  }>;
  synonyms?: string[];
  customerProducts?: string[];
}

interface RuleFormModalProps extends ModalProps {
  item?: SmartRcmdItem;
}

const RuleFormModal: React.FC<RuleFormModalProps> = ({ item, onOk, ...rest }) => {
  const [form] = Form.useForm<KeywordsForm>();
  const [continentList] = useGlobalSearchCountryHook();
  const [addLoading, setAddLoading] = useState<boolean>(false);
  const [synonymsLoading, setSynonymsLoading] = useState<boolean>(false);
  const [synonymsArr, setSynonymsArr] = useState<string[]>([]);
  const [synonymsLoaded, setSynonymsLoaded] = useState(false);
  const [keyword, setKeyword] = useState<string>('');
  const [suggesOptinon, setSuggesOption] = useState<Array<{ label: string; value: string }>>([]);
  const [defaultOptipn, setDefaultOption] = useState<Array<{ label: string; value: string }>>([]);
  const [keywordList, setKeywordList] = useState<string[]>([]);
  const handleSearch = async () => {
    const value = await form.getFieldValue('keyword');
    setSynonymsLoading(true);
    try {
      const arrs = await globalSearchApi.doGetGlobalSearchGptRcmd({
        value: Array.isArray(value) ? value.map(item => item.trim()).join(',') : value,
        // 这个地方不要做国际化转换，就是输入的中文
        language: '英语',
        size: 5,
      });
      if (arrs.length > 0) {
        form.setFieldsValue({
          synonyms: arrs,
        });
      }
      setSynonymsArr(arrs);
    } catch (error) {}
    setSynonymsLoading(false);
    setSynonymsLoaded(true);
  };

  const handleFinish = async (e: any) => {
    try {
      setAddLoading(true);
      const values = await form.validateFields();
      values.targetCompanys = values.targetCompanys?.filter(target => {
        return target.companyName || target.domain;
      });
      let allList: string[] = [];
      if (values.country && values.country.length > 0) {
        values.country.forEach(val => {
          const [con, cou] = val || [];
          if (cou) {
            allList.push(cou);
          } else {
            const allCou = continentList.find(el => el.continent == con)?.countries.map(e => e.name);
            if (allCou) {
              allList = allList.concat(allCou);
            }
          }
        });
        allList = Array.from(new Set(allList));
      }
      if (item?.id) {
        await globalSearchApi.doUpdateSmartRcmd({
          type: 'product',
          value: Array.isArray(values.keyword) ? values.keyword.map(item => item.trim()).join(',') : values.keyword,
          customerProducts: Array.isArray(values.keyword) ? values.customerProducts?.map(item => item.trim()).join(',') : '',
          country: allList,
          id: item?.id,
          targetCompanys: values.targetCompanys,
          synonyms: values.synonyms,
        });
        SiriusMessage.success('保存成功，系统将在24小时内返回订阅结果');
      } else {
        await globalSearchApi.doCreateSmartRcmd({
          type: 'product',
          value: Array.isArray(values.keyword) ? values.keyword.map(item => item.trim()).join(',') : values.keyword,
          customerProducts: Array.isArray(values.keyword) ? values.customerProducts?.map(item => item.trim()).join(',') : '',
          country: allList,
          targetCompanys: values.targetCompanys,
          synonyms: values.synonyms,
        });
        SiriusMessage.success('新建订阅规则成功，系统将在24小时内返回订阅结果');
      }
      onOk?.(e);
    } catch (error) {
      console.warn(error);
      setAddLoading(false);
    }
    setAddLoading(false);
  };
  useEffect(() => {
    if (rest.visible && item) {
      if (item.synonyms) {
        setSynonymsArr(item.synonyms);
      }
      const countrys: string[][] = [];
      const targetCountrysSet = new Set(item.originCountrys?.slice());
      if (targetCountrysSet.size > 0) {
        continentList.forEach(continent => {
          if (targetCountrysSet.has(continent.continent)) {
            countrys.push([continent.continent]);
          } else {
            continent.countries.forEach(country => {
              if (targetCountrysSet.has(country.name)) {
                countrys.push([continent.continent, country.name]);
              }
            });
          }
        });
      }
      setKeywordList(item.value.split(',').map(item => item));
      form.setFieldsValue({
        keyword: item.value.split(',').map(vl => vl),
        customerProducts: item.customerProducts ? item.customerProducts.split(',').map(vl => vl) : [],
        country: countrys,
        synonyms: item.synonyms ?? undefined,
        targetCompanys: item.targetCompanys?.length
          ? item.targetCompanys
          : [
              {
                companyName: '',
                domain: '',
              },
            ],
      });
    }
  }, [item, rest.visible, continentList]);
  const doGetRcmdSuggestion = useMemoizedFn(() => {
    edmCustomsApi
      .getRcmdSuggestion({
        keyword: keyword ? keyword.trim() : '',
      })
      .then(res => {
        const stringList = Array.isArray(res) ? res.map(item => item.keyword) : [];
        stringList.length > 0 ? stringList.unshift(keyword) : [];
        setSuggesOption(() => {
          return [...new Set(stringList)].map(item => {
            return {
              label: item,
              value: item,
            };
          });
        });
      })
      .catch(() => {
        setSuggesOption([]);
      });
  });

  const handleKeywordSearch = useMemoizedFn((val: string) => {
    if (/^\s*$/.test(val)) {
      setDefaultOption([]);
      setSuggesOption([]);
      return;
    }
    setKeyword(val);
    if (val && val.length) {
      setDefaultOption([
        {
          label: val,
          value: val,
        },
      ]);
    } else {
      setDefaultOption([]);
    }
  });

  const handleKeywordChange = useMemoizedFn((val: string[]) => {
    if (val.length === 0) {
      setDefaultOption([]);
      setSuggesOption([]);
      setKeywordList([]);
    } else if (val.some(item => /^\s*$/.test(item))) {
      form.setFieldsValue({
        ...form.setFieldsValue,
        keyword: val.filter(item => !/^\s*$/.test(item)),
      });
      setKeywordList(val.filter(item => !/^\s*$/.test(item)));
      SiriusMessage.warning({
        content: '请输入正确的产品名',
      });
    } else {
      setKeywordList(val);
    }
  });

  useDebounce(
    () => {
      if (keyword && keyword.length > 0) {
        doGetRcmdSuggestion();
      } else {
        setSuggesOption([]);
      }
    },
    500,
    [keyword]
  );

  return (
    <SiriusModal
      {...rest}
      className={styles.modal}
      width={480}
      destroyOnClose
      maskClosable={false}
      onOk={handleFinish}
      title={<h3 className={styles.title}>{item?.id ? getIn18Text('BIANJI') : getIn18Text('XINJIAN')}推荐规则</h3>}
      okButtonProps={{
        loading: addLoading,
      }}
      transitionName=""
    >
      <Form<KeywordsForm>
        form={form}
        preserve={false}
        className={styles.form}
        initialValues={{
          targetCompanys: [
            {
              companyName: '',
              domain: '',
            },
          ],
        }}
      >
        <p className={styles.formtitle}>
          <i>*&nbsp;</i>
          <span>{getIn18Text('NINGONGSIJINGYINGDEZHUYAOCHANPIN')}</span>
        </p>
        <Form.Item
          name="keyword"
          style={{ marginBottom: 0 }}
          className={styles.keyword}
          rules={[
            {
              required: true,
              message: '请输入需要追踪的产品关键词',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value.join('').length > 1000) {
                  return Promise.reject('最多输入1000个中文或者字母');
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <EnhanceSelect
            mode="multiple"
            style={{ borderRadius: '2px' }}
            className={styles.origin}
            maxTagCount="responsive"
            showSearch
            filterOption={false}
            placeholder={'请输入需要追踪的产品关键词'}
            suffixIcon={null}
            onSearch={val => {
              handleKeywordSearch(val);
            }}
            onChange={val => {
              if (Array.isArray(val)) {
                handleKeywordChange(val);
              }
            }}
            onBlur={() => {
              setSuggesOption([]);
              setDefaultOption([]);
            }}
          >
            {suggesOptinon.map(node => (
              <InMultiOption key={node.value} value={node.value} tag={node.value}>
                {node.value}
              </InMultiOption>
            ))}
            {suggesOptinon.length === 0 &&
              defaultOptipn?.map(gps => (
                <InMultiOption key={gps.value} value={gps.value} tag={gps.value}>
                  {gps.value}
                </InMultiOption>
              ))}
          </EnhanceSelect>
        </Form.Item>
        <p className={styles.formIntro}>
          可添加多个产品词，每个产品词用
          <CarriageIcon style={{ marginLeft: '4px' }} />
          （回车键）确认
        </p>
        <p className={styles.formtitle}>
          <span>目标客户主营产品</span>
        </p>
        <Form.Item name="customerProducts" style={{ marginBottom: 0 }} className={styles.keyword}>
          <EnhanceSelect
            mode="multiple"
            style={{ borderRadius: '2px' }}
            className={styles.origin}
            maxTagCount="responsive"
            showSearch
            placeholder={'请输入目标客户主营产品'}
            suffixIcon={null}
            filterOption={false}
            onSearch={val => {
              handleKeywordSearch(val);
            }}
            onBlur={() => {
              setSuggesOption([]);
              setDefaultOption([]);
            }}
            onChange={val => {
              if (Array.isArray(val)) {
                handleKeywordChange(val);
              }
            }}
          >
            {suggesOptinon.map(node => (
              <InMultiOption key={node.value} value={node.value} tag={node.label || node.value}>
                {node.value}
              </InMultiOption>
            ))}
            {suggesOptinon.length === 0 &&
              defaultOptipn?.map(gps => (
                <InMultiOption key={gps.value} value={gps.value} tag={gps.label || gps.value}>
                  {gps.value}
                </InMultiOption>
              ))}
          </EnhanceSelect>
        </Form.Item>
        <p className={styles.formIntro}>
          可添加多个产品词，每个产品词用
          <CarriageIcon style={{ marginLeft: '4px' }} />
          （回车键）确认
        </p>
        <p className={styles.formtitle} style={{ marginBottom: 8 }}>
          {getIn18Text('KEHUSUOZAIGUOJIA/DIQU')}
        </p>
        <Form.Item className={styles.oneLineItem} style={{ marginBottom: 20 }} name="country">
          <Cascader
            showSearch
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
        <p className={styles.formtitle} style={{ display: 'flex', marginBottom: 8, gap: 6, marginRight: 24, marginTop: 12 }}>
          <span style={{ width: '50%' }}>{getIn18Text('MUBIAOKEHUGONGSIMINGCHENG')}</span>
          <span>{getIn18Text('GUANWANG')}</span>
        </p>
        <Form.List name="targetCompanys">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => {
                return (
                  <div key={key} className={styles.companys}>
                    <Form.Item
                      {...restField}
                      style={{ marginBottom: 8, flex: 1 }}
                      name={[name, 'companyName']}
                      rules={[
                        {
                          max: 100,
                          message: '最大不超过100字符',
                        },
                      ]}
                    >
                      <Input placeholder={getIn18Text('QINGSHURUGONGSIMINGCHENG')} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      style={{ marginBottom: 8, marginLeft: 12, flex: 1 }}
                      name={[name, 'domain']}
                      rules={[
                        {
                          max: 100,
                          message: '最大不超过100字符',
                        },
                      ]}
                    >
                      <Input placeholder={getIn18Text('QINGSHURUWANGZHI')} />
                    </Form.Item>
                    <span
                      className={styles.remove}
                      onClick={() => {
                        remove(name);
                      }}
                    >
                      <RemoveIcon />
                    </span>
                  </div>
                );
              })}
              {fields.length < 10 && (
                <Button className={styles.addBtn} type="link" icon={<PlusOutlined />} onClick={() => add()}>
                  {getIn18Text('TIANJIAKEHU')}
                </Button>
              )}
            </>
          )}
        </Form.List>
      </Form>
    </SiriusModal>
  );
};
export default RuleFormModal;
