import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { Button, Form, ModalProps, Radio } from 'antd';
import { AIGCCreateSiteReq, api, apiHolder, apis, DataTrackerApi, getIn18Text, SiteApi } from 'api';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import AICreateSiteProgressModal from '../AICreateSiteProgressModal';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import styles from './index.module.scss';

export interface AICreateSiteModalProps extends ModalProps {
  onClose?: () => void;
  onSubmitSuccess?: () => void;
  onCreateSiteFailed?: () => void;
  refreshSiteList?: () => void;
  defaultTheme?: string;
  onOpenEditor?: (siteId: string) => void;
  industryList?: { label: string; value: string }[];
  themeList?: { label: string; value: string }[];
  onPreventCreateNewSite?: () => void;
}

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const AICreateSiteModal: React.FC<AICreateSiteModalProps> = props => {
  const { onClose, onSubmitSuccess, industryList = [], themeList = [], defaultTheme = '', onCreateSiteFailed, refreshSiteList, ...modalProps } = props;

  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [isCreateSucc, setIsCreateSucc] = useState(false);
  const [isGateTimeout, setIsGateTimeout] = useState(false);
  const [collapse, setCollapse] = useState(false); // 收起弹窗
  const [siteId, setSiteId] = useState('');

  const onFinish = async () => {
    trackApi.track('AI_creat_next');
    try {
      const result = await form.validateFields();
      onCancel();
      postAIGCSiteCreate(result);
    } catch (error) {}
    //
  };

  const onCancel = () => {
    onClose && onClose();
  };

  const postAIGCSiteCreate = async (params: AIGCCreateSiteReq) => {
    if (loading) return;
    setLoading(true);
    setShowLoadingModal(true);
    try {
      const result = await siteApi.aigcCreateSite({ ...params });
      if (result && result.siteId) {
        setIsCreateSucc(true);
        setSiteId(result.siteId ?? '');
        onSubmitSuccess && onSubmitSuccess();
        if (collapse) {
          Toast.success('站点创建成功');
        }
      }
    } catch (error: any) {
      if (error === 'NETWORK.ERR.TIMEOUT') {
        // 504 'NETWORK.ERR.TIMEOUT'
        setIsGateTimeout(true);
      } else {
        if (error && error.code === 1007) {
          props.onPreventCreateNewSite && props.onPreventCreateNewSite();
        }
        setShowLoadingModal(false);
        onCreateSiteFailed && onCreateSiteFailed();
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!props.visible) {
      form.resetFields();
      setIsCreateSucc(false);
      setIsGateTimeout(false);
    }
  }, [props.visible]);

  return (
    <>
      <SiriusModal className={styles.aiCreateSiteModal} width={600} footer={null} closable={false} destroyOnClose {...modalProps}>
        <div className={styles.mainContent}>
          <div className={styles.header}>
            <div className={styles.icon}></div>
          </div>
          <div className={styles.form}>
            <Form
              name="form"
              form={form}
              onFinish={onFinish}
              autoComplete="off"
              labelCol={{ span: 4 }}
              style={{
                width: '100%',
                marginTop: 20,
              }}
            >
              <Form.Item label="网站名称" name="siteName" rules={[{ required: true, message: '网站名称不能为空' }]}>
                <Input placeholder="名称用于浏览器标签页，对外可见" maxLength={500} />
              </Form.Item>
              <Form.Item label="所属行业" name="industry" rules={[{ required: true, message: '所属行业不能为空' }]}>
                <EnhanceSelect showSearch placeholder="请选择或输入您所在的行业" optionFilterProp="label" options={industryList}></EnhanceSelect>
              </Form.Item>
              <Form.Item label="主营商品" name="product" rules={[{ required: true, message: '主营商品不能为空' }]}>
                <Input placeholder="请填写公司的商品名称，多个可用逗号隔开" maxLength={20} />
              </Form.Item>
              <Form.Item label="描述" name="description">
                <Input.TextArea placeholder="请用一段话描述您的公司或者产品，如物美价廉、商品畅销海内外（选填）" rows={4} maxLength={1000} />
              </Form.Item>
              <Form.Item label="网站风格" name="theme" rules={[{ required: true, message: '网站风格不能为空' }]} initialValue={defaultTheme}>
                <Radio.Group options={themeList} />
              </Form.Item>
            </Form>
          </div>

          <div className={styles.buttonGroup}>
            <Button className={styles.cancelButton} onClick={onCancel}>
              取消
            </Button>
            <Button className={styles.submitButton} type="primary" onClick={onFinish}>
              {getIn18Text('XIAYIBU')}
            </Button>
          </div>
        </div>
      </SiriusModal>

      <AICreateSiteProgressModal
        visible={showLoadingModal}
        isSuccess={isCreateSucc}
        isGateTimeout={isGateTimeout}
        onCancel={() => setShowLoadingModal(false)}
        onClose={() => {
          trackApi.track('AI_creat_loseshow');
          setShowLoadingModal(false);
          refreshSiteList && refreshSiteList();
        }}
        onJumpButtonClick={() => {
          trackApi.track('AI_creat_gosee');
          setShowLoadingModal(false);
          props.onOpenEditor && props.onOpenEditor(siteId);
        }}
        onCollapse={() => {
          setShowLoadingModal(false);
          setCollapse(true);
          Toast.info('弹窗已收起，稍后可在站点列表查看结果');
        }}
      />
    </>
  );
};

export default AICreateSiteModal;
