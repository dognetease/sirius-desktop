import React, { useEffect, useRef } from 'react';
import styles from './index.module.scss';
import { Form, Input } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { ChooseTemplateStatus, Template, Ref } from '../../../components/ChooseTemplateStatus';
import { getIn18Text } from 'api';

interface CreateSiteProps {
  visible: boolean;
  onClose?: ((e: React.MouseEvent<HTMLElement, MouseEvent>) => void) | undefined;
  onOk: (value: any) => void;
  onChoose: () => void;
  onCreateCustom: () => void;
  parentRef: Ref;
}

export const CreateSite: React.FC<CreateSiteProps> = props => {
  const { parentRef, onChoose } = props;
  const ref = useRef({ chooseTemplate: value => {} });

  useEffect(() => {
    parentRef.current = {
      chooseTemplate: (templateData: Template) => {
        ref.current.chooseTemplate(templateData);
      },
    };
  }, []);

  const checkTemplate = (rule, value: string) => {
    if (value) {
      //校验条件自定义
      return Promise.resolve();
    }

    return Promise.reject('请选择模板');
  };

  const checkSiteName = (rule, value: string) => {
    if (value && value.trim()) {
      //校验条件自定义
      return Promise.resolve();
    }
    return Promise.reject('网站名称不能为空');
  };

  const createCustom = (e: any) => {
    props.onClose?.(e);
    props.onCreateCustom();
  };

  return (
    <Modal
      zIndex={800}
      visible={props.visible}
      getContainer={false}
      width={480}
      title={getIn18Text('XINJIANZHANDIAN')}
      footer={null}
      maskClosable={false}
      className={styles.createSite}
      destroyOnClose={true}
      onCancel={props.onClose}
    >
      <Form className={styles.semForm} onFinish={props.onOk} labelCol={{ span: 5 }} wrapperCol={{ span: 19 }} colon={false}>
        <Form.Item name="siteName" label="网站名称" rules={[{ required: true, validator: checkSiteName }]}>
          <div className="site-name">
            <Input placeholder="名称用于浏览器标签页，对外可见" maxLength={500} />
          </div>
        </Form.Item>

        <Form.Item name="templateData" label="选择模板" rules={[{ required: true, validator: checkTemplate }]}>
          <ChooseTemplateStatus parentRef={ref} onChoose={onChoose} isEdit={false} />
        </Form.Item>
        <Form.Item>
          <Button btnType="minorLine" type="button" onClick={props.onClose}>
            {getIn18Text('QUXIAO')}
          </Button>
          <Button btnType="primary" type="submit">
            {getIn18Text('QUEDING')}
          </Button>
        </Form.Item>
      </Form>
      <div className="info">
        {getIn18Text('YIYOUWAIBUZHANDIAN')}
        <span onClick={createCustom}>{getIn18Text('QUBANGDING')} &gt;</span>
      </div>
    </Modal>
  );
};
