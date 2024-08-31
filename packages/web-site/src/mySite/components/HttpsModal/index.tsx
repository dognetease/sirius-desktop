import React, { useEffect } from 'react';
import styles from './style.module.scss';
import { Form, Input, Radio } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { navigate } from '@reach/router';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import CloseIcon from '../../../images/close.svg';
import { AddDomainCertReq, getIn18Text } from 'api';
import { CustomDomain } from '@web-site/mySite';
// import { EnhanceSelect } from '@web-site/../../web-common/src/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';

const { TextArea } = Input;

interface InitData {
  certName: string; // 证书名称
  certPublicKey: string; // 证书公钥
  certPrivateKey: string; // 证书私钥
  domain: string; // 绑定域名
  expired: boolean; // 是否过期
}

interface HttpsModalProps {
  visible: boolean;
  onClose: ((e: React.MouseEvent<HTMLElement, MouseEvent>) => void) | undefined;
  onOk: (params: AddDomainCertReq) => void;
  onChangeDomain?: (newDomain: string, domainList: CustomDomain[], formValues: any, prevDomain: string) => void;
  domain: string;
  domainList?: CustomDomain[];
  initData?: InitData;
  siteId: string;
}

function HttpsModal(props: HttpsModalProps) {
  const { domain, initData, siteId, domainList, onChangeDomain } = props;
  const formRef = React.useRef<FormInstance>(null);

  const onFinish = (values: any) => {
    props.onOk({
      publicKey: values.certPublicKey,
      privateKey: values.certPrivateKey,
      domain,
      certName: domain,
    });
  };

  useEffect(() => {
    formRef.current?.setFieldsValue({
      certPublicKey: initData?.certPublicKey,
      certPrivateKey: initData?.certPrivateKey,
    });
  }, [initData]);

  const goPurchaseCert = () => {
    navigate(`#site?page=purchaseCert&siteId=${siteId}&domain=${domain}`);
  };

  return (
    <Modal
      className={styles.httpsModal}
      visible={props.visible}
      onCancel={props.onClose}
      title="添加Https证书"
      width={700}
      closeIcon={<img src={CloseIcon} />}
      destroyOnClose={true}
      maskClosable={false}
      footer={null}
    >
      <div className={styles.purchaseCert}>
        {getIn18Text('ANQUANZHENGSHUXIANSHITEHUI')}，<a onClick={goPurchaseCert}>{getIn18Text('QUGOUMAI')}&gt;</a>
      </div>
      <Form ref={formRef} onFinish={onFinish} className={styles.semForm} requiredMark={false} labelCol={{ span: 3 }} wrapperCol={{ span: 21 }} colon={false}>
        <Form.Item label="绑定域名">
          {domainList && domainList.length > 1 ? (
            <EnhanceSelect
              value={domain}
              options={domainList?.map(d => ({ value: d.domain, label: d.domain }))}
              style={{ width: '248px' }}
              onChange={value => {
                // 当切换域名时，保存填写的数据
                onChangeDomain?.(value, domainList, formRef.current?.getFieldsValue(), domain);
              }}
            />
          ) : (
            <span>{domain}</span>
          )}
        </Form.Item>
        {initData && (
          <Form.Item label="证书状态" style={{ marginTop: '-10px' }}>
            {initData.expired ? getIn18Text('YIGUOQI') : '未过期'}
          </Form.Item>
        )}
        <Form.Item name="certPublicKey" label="证书内容" rules={[{ required: true, message: '请输入证书内容!' }]} initialValue={initData?.certPublicKey}>
          <TextArea rows={8} />
        </Form.Item>
        <Form.Item name="certPrivateKey" label="私钥内容" rules={[{ required: true, message: '请输入私钥内容!' }]} initialValue={initData?.certPrivateKey}>
          <TextArea rows={8} />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 3, span: 21 }} style={{ textAlign: 'right' }}>
          <Button btnType="minorLine" type="button" onClick={props.onClose}>
            {getIn18Text('QUXIAO')}
          </Button>
          <Button btnType="primary" type="submit">
            立即提交
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default HttpsModal;
