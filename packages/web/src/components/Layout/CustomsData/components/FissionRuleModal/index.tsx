import { api, apis, apiHolder, EdmCustomsApi, suppliersCompany, getIn18Text, FissionRuleSaveReq, ImportRuleSaveReq } from 'api';
import uniq from 'lodash/uniq';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { Form, Divider, Tooltip, Radio, Input, Checkbox } from 'antd';
import { ReactComponent as QuestionIcon } from '@/images/icons/customs/question.svg';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useGlobalSearchCountryHook } from '../../../globalSearch/hook/globalSearchCountryHook';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import styles from './index.module.scss';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
// import Cascader from '@web-common/components/UI/Cascader';
import Cascader from '@lingxi-common-component/sirius-ui/Cascader';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import NationFlag from '../NationalFlag';
import { asyncTaskMessage$ } from '@/components/Layout/globalSearch/search/GrubProcess/GrubProcess';
import { GrubProcessCodeEnum, GrubProcessTypeEnum } from '@/components/Layout/globalSearch/search/GrubProcess/constants';
import ExampleImgBuyer from './exampleImgBuyer.png';
import ExampleImgSupplier from './exampleImgSupplier.png';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
interface paramDataItem {
  id: number;
  country: string;
  companyName: string;
  type: 'import' | 'subscribe';
}
interface Props {
  visible: boolean;
  onClose: () => void;
  paramData: paramDataItem;
  refresh: () => void;
}
export interface KeywordsForm {
  type: number;
  companyType: number;
  middleCustomsCompanyIdList: string;
  countryList?: string[];
}

export const FissionRuleModal: React.FC<Props> = props => {
  const { visible, onClose, paramData, refresh } = props;
  const [continentList] = useGlobalSearchCountryHook();
  const [exampleVisible, setExampleVisible] = useState<boolean>(false);
  const [middleNameAndCountrysOption, setMiddleNameAndCountrysOption] = useState<suppliersCompany[]>([]);
  const [form] = Form.useForm<KeywordsForm>();
  const [addLoading, setLoading] = useState<boolean>(false);
  const [showMore, setShowMore] = useState<boolean>(false);
  const [isMidCompanyCountries, setIsMidCompanyCountries] = useState<boolean>(true);
  const [midCompanyCountryList, setMidCompanyCountryList] = useState<string>();
  const typeTextLeft = useMemo(() => (paramData.country === 'China' ? '供应' : '采购'), [paramData.country]);
  const typeTextRight = useMemo(() => (paramData.country === 'China' ? '采购' : '供应'), [paramData.country]);
  useEffect(() => {
    reqMiddleNameAndCountrysOption();
  }, [visible]);
  const reqMiddleNameAndCountrysOption = () => {
    edmCustomsApi
      .fissioCompanyRelation({
        companyList: [{ companyName: paramData.companyName, country: paramData.country }],
        size: 20,
        country: paramData.country,
        from: 0,
        groupByCountry: true,
        sortBy: 'percentage',
        order: 'desc',
      })
      .then(res => {
        const { companies, total } = res;
        setMiddleNameAndCountrysOption(companies);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };
  const handleFinish = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      finishOK(values);
    } catch (error) {
      console.warn(error);
      setLoading(false);
    }
    setLoading(false);
  };
  const finishOK = (values: KeywordsForm) => {
    const countryList = uniq(values.countryList ?? []).reduce((prev, curr) => (curr[1] ? [...prev, curr[1]] : prev), [] as string[]);
    const params = {
      type: values.type,
      companyType: values.companyType,
      middleCustomsCompanyIdList: values.middleCustomsCompanyIdList ? [values.middleCustomsCompanyIdList] : [],
      countryList,
      midCompanyCountryList: isMidCompanyCountries ? [midCompanyCountryList] : undefined,
    };
    const apiurl = () =>
      paramData.type === 'import'
        ? edmCustomsApi.importCompanyFission({ ...params, importId: paramData.id })
        : edmCustomsApi.fissionRuleSave({ ...params, collectId: paramData.id });
    apiurl()
      .then(res => {
        onClose();
        if (!res) return;
        refresh();
        asyncTaskMessage$.next({
          eventName: 'globalSearchGrubTaskAdd',
          eventData: {
            type: GrubProcessTypeEnum.fission,
            data: {
              id: res,
              name: `核心客户${paramData.companyName}作为${typeTextLeft}商`,
              code: GrubProcessCodeEnum.companyFission,
              grubStatus: 'GRUBBING',
            },
          },
        });
      })
      .catch(() => {
        setLoading(false);
      });
  };
  const handleExampleVisible = () => {
    setExampleVisible(!exampleVisible);
  };
  const countryListChange = (value: string, options: any) => {
    setMidCompanyCountryList(options.country);
  };

  return (
    <SiriusModal
      className={styles.modal}
      title="添加裂变规则"
      visible={visible}
      width={490}
      destroyOnClose
      onCancel={() => {
        onClose();
      }}
      footer={null}
    >
      <>
        <div className={styles.modalBox}>
          <Form<KeywordsForm>
            form={form}
            preserve={false}
            className={styles.form}
            initialValues={{
              type: 1,
              companyType: paramData.country === 'China' ? 2 : 1,
            }}
          >
            <div className={styles.modalTop}>
              <div>系统将以交易双方的采供关系链，进行潜客裂变</div>
              <span className={styles.modalPointer} onClick={handleExampleVisible}>
                {'裂变示例'}
              </span>
            </div>
            <div className={styles.roleBox}>
              <div className={styles.roleRight}>
                <div className={styles.tipBox}>
                  {typeTextLeft}商
                  <span className={styles.modalTip}>
                    <Tooltip title={<span>若核心客户为海外公司，会将该公司作为采购商进行裂变，若为国内公司，则作为供应商进行裂变。</span>}>
                      <QuestionIcon />
                    </Tooltip>
                  </span>
                </div>
                <div className={styles.modalEllipsis}>{paramData.companyName}</div>
              </div>
              <div className={styles.lineBox}> —— </div>
              <div className={styles.roleLeft}>
                <div>{typeTextRight}商</div>
                <div>
                  <Form.Item className={styles.oneLineItem} name="middleCustomsCompanyIdList" rules={[{ required: true, message: '请选择交易对手' }]}>
                    <EnhanceSelect
                      dropdownClassName={styles.selectWidth}
                      style={{ borderRadius: '2px' }}
                      placeholder={`请选择${typeTextRight}商`}
                      onChange={countryListChange}
                    >
                      {middleNameAndCountrysOption?.map((item: any) => (
                        <InSingleOption key={item?.companyNameAndCountry} value={item?.companyNameAndCountry} country={item.country}>
                          <div className={styles.optionItem}>
                            <div className={styles.optionNameStyle}>{item.companyName}</div>
                            <div className={styles.optionNameStyle}>{item.companyCnName}</div>
                            <div>
                              <span className={styles.grayText}>交易额占比{item.percentage}</span>
                              <Divider type="vertical" />
                              {item.country ? <NationFlag showLabel name={item.country} /> : null}
                            </div>
                          </div>
                        </InSingleOption>
                      )) || null}
                    </EnhanceSelect>
                  </Form.Item>
                </div>
              </div>
            </div>
            <div className={styles.checkBoxStyle}>
              <Checkbox checked={isMidCompanyCountries} onChange={e => setIsMidCompanyCountries(e.target.checked)}>
                {`锁定${typeTextRight}国家地区`}
              </Checkbox>
              <span className={styles.checkBoxTip}>
                <Tooltip title={<span>{`裂变过程，仅筛选${typeTextRight}商所在的国家地区，潜客数量较少，但结果更精准。`}</span>}>
                  <QuestionIcon />
                </Tooltip>
              </span>
            </div>
            <Form.Item
              // className={styles.oneLineItem}
              label={'国家地区'}
              name="countryList"
              rules={[
                {
                  required: true,
                  type: 'array',
                  message: '至少选择1个国家',
                },
                {
                  max: 3,
                  type: 'array',
                  message: '最多选择3个国家',
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
                placeholder={'请选择潜客所在国家地区'}
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
            <Form.Item label={'裂变范围'} name="type" style={{ marginTop: '6px' }} rules={[{ required: true, message: '请选择裂变范围' }]}>
              <Radio.Group>
                <Radio value={1}>一级裂变</Radio>
                <Radio value={2}>一级和二级裂变</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label={'公司类型'} name="companyType" style={{ marginTop: '6px' }} rules={[{ required: true, message: '请选择公司类型' }]}>
              <Radio.Group>
                <Radio value={1}>采购商</Radio>
                <Radio value={2}>供应商</Radio>
              </Radio.Group>
            </Form.Item>

            {showMore && (
              <>
                <div className={styles.modalOpacity}>
                  <Divider dashed />
                  精准裂变（暂未开放，敬请期待）
                  <Form.Item className={styles.oneLineItem20} label={'货物类型'} name="huowuleixing">
                    <Select disabled mode="multiple" style={{ width: '100%', borderRadius: '2px' }} placeholder={'请选择'}>
                      {[]?.map((item: any) => (
                        <Select.Option key={item?.value} value={item?.value}>
                          {item?.label}
                        </Select.Option>
                      )) || null}
                    </Select>
                  </Form.Item>
                  <Form.Item className={classnames(styles.oneLineItem20, styles.oneLineItem20Label)} label={'港口'} name="yunshuleixing">
                    <Input disabled style={{ width: '100%', borderRadius: '2px' }} placeholder={'请输入港口'}></Input>
                  </Form.Item>
                  <Form.Item className={styles.oneLineItem20} label={'运输类型'} name="yunshuleixing">
                    <Select disabled mode="multiple" style={{ width: '100%', borderRadius: '2px' }} placeholder={'海运整装'}>
                      {[]?.map((item: any) => (
                        <Select.Option key={item?.value} value={item?.value}>
                          {item?.label}
                        </Select.Option>
                      )) || null}
                    </Select>
                  </Form.Item>
                  <Form.Item className={styles.oneLineItem20} label={'运输时效'} name="yunshuleixing">
                    <Input disabled style={{ width: '32px', borderRadius: '2px' }} placeholder={'0'}></Input>
                    <span style={{ margin: '0 8px' }}>天 ——</span>
                    <Input disabled style={{ width: '32px', borderRadius: '2px' }} placeholder={'0'}></Input>
                    <span style={{ marginLeft: '8px' }}>天</span>
                  </Form.Item>
                </div>
              </>
            )}
          </Form>
        </div>
        <div className={styles.modalFooter}>
          <div>
            <div>
              {!showMore && (
                <Button
                  style={{ border: '1px solid #4c6aff' }}
                  btnType="link"
                  // ghost
                  onClick={() => {
                    setShowMore(true);
                  }}
                >
                  {'更多'}
                </Button>
              )}
            </div>
          </div>
          <div className={styles.modalFooterRight}>
            <Button
              btnType="minorLine"
              onClick={() => {
                onClose();
              }}
            >
              {getIn18Text('QUXIAO')}
            </Button>
            <Button
              disabled={addLoading}
              style={{ marginLeft: 12 }}
              btnType="primary"
              onClick={() => {
                handleFinish();
              }}
            >
              {'开始裂变'}
            </Button>
          </div>
        </div>
        {exampleVisible && (
          <SiriusModal className={styles.exampleModal} title="裂变示例" visible={exampleVisible} onCancel={handleExampleVisible} footer={null}>
            <div className={styles.exampleImg}>
              <img src={paramData.country === 'China' ? ExampleImgBuyer : ExampleImgSupplier}></img>
            </div>
          </SiriusModal>
        )}
      </>
    </SiriusModal>
  );
};

export const showFissionRuleModal = (paramData: paramDataItem, modalRefreshTable: (id: number, params: any) => void) => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const closeHandler = () => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  };
  const refresh = () => {
    modalRefreshTable(paramData.id, { fissionStatus: 1 });
  };
  ReactDOM.render(<FissionRuleModal visible onClose={closeHandler} paramData={paramData} refresh={refresh} />, container);
};
