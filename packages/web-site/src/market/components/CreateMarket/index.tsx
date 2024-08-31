import React, { useEffect, useRef } from 'react';
import styles from './index.module.scss';
import { Form, Input } from 'antd';
import { Rule } from 'antd/lib/form';

// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { ChooseTemplateStatus, Template, Ref } from '../../../components/ChooseTemplateStatus';
import { ReactComponent as CaretDownOutlined } from '../../../images/down-arrow.svg';
import { getIn18Text } from 'api';

interface CreateMarketProps {
  visible: boolean;
  onClose?: ((e: React.MouseEvent<HTMLElement, MouseEvent>) => void) | undefined;
  onOk: (value: any) => void;
  onChoose: () => void;
  parentRef: Ref;
  isEdit: boolean;
  siteOptions: Array<{ value: string; label: string }>;
  data: {
    pageName: string;
    templateData: { templateId: string; templateName: string };
    siteId: string;
  };
}
interface MarketInputProps {
  value?: string;
  onChange?: (value: React.ChangeEvent<HTMLInputElement>) => void;
}

const MarketInput: React.FC<MarketInputProps> = props => {
  const handleChange = (value: React.ChangeEvent<HTMLInputElement>) => {
    props.onChange?.(value);
  };

  return (
    <div className="market-name">
      <Input placeholder="请输入营销落地页名称" defaultValue={props.value} onChange={handleChange} maxLength={500} />
    </div>
  );
};

export const CreateMarket: React.FC<CreateMarketProps> = props => {
  const { parentRef, onChoose, isEdit, siteOptions } = props;
  const ref = useRef({ chooseTemplate: (templateData: Template) => {} });

  const title = isEdit ? '编辑营销落地页' : '新建营销落地页';

  useEffect(() => {
    parentRef.current = {
      chooseTemplate: (templateData: Template) => {
        ref.current.chooseTemplate(templateData);
      },
    };
  }, []);

  const checkTemplate = (rule: Rule, value: Template) => {
    if (isEdit || value.templateId) {
      return Promise.resolve();
    }

    return Promise.reject('请选择模板');
  };

  const checkSiteId = (rule: Rule, value: string) => {
    if (value) {
      return Promise.resolve();
    }

    return Promise.reject('所属站点不能为空');
  };

  const checkMarketName = (rule: Rule, value: string) => {
    if (value && value.trim()) {
      //校验条件自定义
      if (value.length > 20) {
        return Promise.reject('营销落地页名称不能超过20个字符');
      } else {
        return Promise.resolve();
      }
    }

    return Promise.reject('营销落地页名称不能为空');
  };

  return (
    <Modal
      zIndex={800}
      visible={props.visible}
      getContainer={false}
      width={480}
      title={title}
      footer={null}
      maskClosable={false}
      className={styles.createMarket}
      destroyOnClose={true}
      onCancel={props.onClose}
    >
      <Form onFinish={props.onOk} initialValues={props.data} labelCol={{ span: 5 }} wrapperCol={{ span: 19 }} colon={false}>
        <Form.Item name="pageName" label={getIn18Text('LUODIYEMINGCHENG')} rules={[{ required: true, validator: checkMarketName }]}>
          <MarketInput />
        </Form.Item>

        <Form.Item name="siteId" label={getIn18Text('SUOSHUZHANDIAN')} rules={[{ required: true, validator: checkSiteId }]}>
          <EnhanceSelect suffixIcon={<CaretDownOutlined />} options={siteOptions} />
        </Form.Item>

        <Form.Item name="templateData" label={getIn18Text('XUANZEMOBAN')} rules={[{ required: true, validator: checkTemplate }]}>
          <ChooseTemplateStatus parentRef={ref} onChoose={onChoose} isEdit={isEdit} />
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
    </Modal>
  );
};
