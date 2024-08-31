import React, { useState, useMemo, useEffect, useContext } from 'react';
import moment from 'moment';
// import SiriusDrawer from '@web-common/components/UI/SiriusDrawer';
import SiriusDrawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import { Button, Form, Space, message, InputNumber, Alert } from 'antd';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import { apiHolder, apis, FFMSApi, FFMSRate } from 'api';
import { useMount } from 'ahooks';
import { GlobalContext } from '@web-entry-ff/layouts/WmMain/globalProvider';
import { FfDatePicker } from '../search/quickTime';
const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
import style from './style.module.scss';
const dateFormat = 'YYYY/MM/DD';

interface Props {
  id: string;
  visible: boolean;
  dataType?: 'draft';
  rowDetail?: FFMSRate.ListItem;
  onCancel: () => void;
  onSuccess?: () => void;
}

const Detail: React.FC<Props> = ({ id, visible, onCancel, onSuccess, dataType, rowDetail }) => {
  const [portList, setPortList] = useState<FFMSRate.Option[]>([]);
  const [carrierList, setCarrierList] = useState<FFMSRate.Option[]>([]);
  const [form] = Form.useForm();
  const [detail, setDetail] = useState<FFMSRate.DraftDetailRes | FFMSRate.ListItem>();
  const { state } = useContext(GlobalContext);

  const getDetail = (id: string) => {
    if (dataType) {
      ffmsApi.ffRateDraftDetail({ freightDraftId: id }).then(res => {
        setDetail(res);
        form.setFieldsValue(res.analyzeDetail);
        if (res.analyzeDetail) onValuesChange({}, res.analyzeDetail);
      });
    } else {
      setDetail(rowDetail);
      form.setFieldsValue(rowDetail);
    }
  };
  const hasKeys = (allValues: FFMSRate.SaveReq) => {
    type allkeys = keyof FFMSRate.SaveReq;
    let keys = ['sailingDate', 'arriveDate', 'voyage'];
    let hasValue: string[] = [];
    keys.forEach(key => {
      if (allValues[key as allkeys]) {
        hasValue.push(key);
      }
    });
    return hasValue;
  };

  const changeVoyage = (allValues: FFMSRate.SaveReq) => {
    let start = moment(allValues.sailingDate).format('x');
    let end = moment(allValues.arriveDate).format('x');
    form.setFieldsValue({
      voyage: (Number(end) - Number(start)) / (24 * 60 * 60 * 1000),
    });
  };

  const changeArriveDate = (allValues: FFMSRate.SaveReq) => {
    let end = moment(allValues.sailingDate).add(allValues.voyage, 'days').format(dateFormat);
    form.setFieldsValue({
      arriveDate: end,
    });
  };
  /*
   * 需要两个值才能计算
   **/
  const onValuesChange = (changedValues: Partial<FFMSRate.SaveReq>, allValues: FFMSRate.SaveReq) => {
    // sailingDate arriveDate voyage
    let allKeys = hasKeys(allValues);
    // 航程修改
    if (allKeys.length === 3) {
      if (changedValues.sailingDate || changedValues.arriveDate) {
        changeVoyage(allValues);
      }
      if (changedValues.voyage) {
        changeArriveDate(allValues);
      }
    }
    if (allKeys.length === 2) {
      if (!allValues.voyage) {
        changeVoyage(allValues);
      } else if (allValues.sailingDate) {
        changeArriveDate(allValues);
      }
    }
  };

  useEffect(() => {
    if (id && visible) {
      getDetail(id);
    }
  }, [id, visible]);

  useEffect(() => {
    !visible && form.resetFields();
  }, [visible]);

  const getCarrierList = () => {
    ffmsApi.ffCarrierList().then(res => {
      setCarrierList(() => {
        return (res || []).map(item => {
          return {
            label: `${item.carrier} ${item.cnName}`,
            value: item.carrier,
          };
        });
      });
    });
  };

  const getFfPortList = () => {
    ffmsApi.ffPermissionsPortList().then(res => {
      setPortList(() =>
        (res || []).map(item => {
          return {
            label: `${item.enName} ${item.cnName} ${item.countryCnName}`,
            value: item.code,
          };
        })
      );
    });
  };

  useMount(() => {
    getFfPortList();
    getCarrierList();
  });

  const fromList = useMemo(() => {
    let draftDetail = {} as FFMSRate.DraftItem;
    if (detail && (detail as FFMSRate.DraftDetailRes).draftDetail) {
      draftDetail = (detail as FFMSRate.DraftDetailRes).draftDetail;
    }

    const disabledPrimary = dataType !== 'draft';
    const list = [
      {
        layout: { label: '起运港', name: 'departurePortCode', required: true, rules: [{ required: true, message: '请选择起运港' }] },
        component: <EnhanceSelect disabled={disabledPrimary} showSearch optionFilterProp="label" size="large" placeholder="请选择起运港" options={portList} />,
        originData: draftDetail.departurePort,
      },
      {
        layout: { label: '目的港', name: 'destinationPortCode', required: true, rules: [{ required: true, message: '请选择目的港' }] },
        component: <EnhanceSelect disabled={disabledPrimary} showSearch optionFilterProp="label" size="large" placeholder="请选择目的港" options={portList} />,
        originData: draftDetail.destinationPort,
      },
      {
        layout: { label: '船司', name: 'carrier', required: true, rules: [{ required: true, message: '请输入船司' }] },
        component: <EnhanceSelect disabled={disabledPrimary} showSearch optionFilterProp="label" size="large" placeholder="请输入船司" options={carrierList} />,
        originData: draftDetail.carrier,
      },
      {
        layout: { label: '航线', name: 'route' },
        component: <Input maxLength={64} placeholder={'请输入航线'}></Input>,
        originData: draftDetail.route,
      },
      {
        layout: { label: '船只', name: 'vessel' },
        component: <Input maxLength={64} placeholder={'请输入船只'}></Input>,
        originData: draftDetail.vessel,
      },
      {
        layout: {
          label: '价格',
          name: 'price',
          required: true,
          validateFirst: true,
          rules: [
            { required: true, message: '请输入价格' },
            {
              validator: async (_: any, value: string) => {
                let prices = value.split('/');
                let hasError = prices.some(pirce => !pirce || isNaN(Number(pirce)));
                if (hasError || prices.length < 2 || prices.length > 3) {
                  return Promise.reject('请输入正确格式的价格');
                }
                return Promise.resolve();
              },
            },
          ],
        },
        component: <Input placeholder={'请输入价格'}></Input>,
        originData: draftDetail.price,
        notice: '默认为20GP/40GP/40HQ的美元价格，多个价格请用/隔开，若仅输入2个价格则默认代表20GP/40HQ，且40GP=40HQ',
      },
      {
        layout: { label: '截止日', name: 'expiryDate' },
        component: <FfDatePicker format={dateFormat} placeholder={'请输入截止日'}></FfDatePicker>,
        originData: draftDetail.expiryDate,
      },
      {
        layout: { label: '出发日', name: 'sailingDate', required: true, rules: [{ required: true, message: '请输入出发日' }] },
        component: <FfDatePicker format={dateFormat} allowClear={false} placeholder={'请输入出发日'}></FfDatePicker>,
        originData: draftDetail.sailingDate,
      },
      {
        layout: { label: '航程', name: 'voyage', required: true, rules: [{ required: true, message: '请输入航程' }] },
        component: <InputNumber style={{ width: '100%' }} placeholder={'请输入航程'} min={1} step={1}></InputNumber>,
      },
      {
        layout: { label: '参考到港日', name: 'arriveDate', required: true, rules: [{ required: true, message: '请输入参考到港日' }] },
        component: <FfDatePicker format={dateFormat} placeholder={'请输入参考到港日'}></FfDatePicker>,
        originData: draftDetail.arriveDate,
      },
    ];
    return list;
  }, [portList, detail, dataType, state.departurePortOptions, carrierList]);

  const submit = () => {
    form
      .validateFields()
      .then(res => {
        let params = {
          ...res,
        };
        if (dataType) {
          params.freightDraftId = id;
        } else {
          params.freightId = id;
        }
        ffmsApi.saveFfRate(params).then(res => {
          message.success('保存成功');
          onSuccess && onSuccess();
        });
      })
      .catch(err => {
        form.scrollToField(err.errorFields[0].name, {
          block: 'center',
        });
      });
  };

  return (
    <SiriusDrawer
      title="报价详情页"
      className={style.priceDetail}
      closable={true}
      destroyOnClose={true}
      onClose={onCancel}
      visible={visible}
      footer={
        <div className={style.footer}>
          <Button className={style.footerBtn} type="primary" onClick={onCancel}>
            取消
          </Button>
          <Button className={style.footerBtn} type="primary" htmlType="submit" onClick={submit}>
            保存
          </Button>
        </div>
      }
    >
      {(detail as FFMSRate.DraftDetailRes)?.draftDetail?.reason ? (
        <Alert type="error" message={(detail as FFMSRate.DraftDetailRes).draftDetail.reason} style={{ marginBottom: 12 }} />
      ) : null}
      <Form
        form={form}
        onValuesChange={onValuesChange}
        scrollToFirstError={{ behavior: 'smooth' }}
        labelCol={{ span: dataType ? 7 : 6 }}
        wrapperCol={{ span: dataType ? 17 : 18 }}
      >
        {fromList.map(item => (
          <>
            <Space style={{ display: 'flex', width: '100%' }}>
              <Form.Item {...item.layout}>{item.component}</Form.Item>
              {dataType ? <div className={style.oldData}>{item.originData}</div> : null}
            </Space>
            {item.notice ? <div className={style.notice}>{item.notice}</div> : null}
          </>
        ))}
      </Form>
    </SiriusDrawer>
  );
};

export default Detail;
