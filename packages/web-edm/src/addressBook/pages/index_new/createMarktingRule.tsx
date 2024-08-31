import React, { useState, useImperativeHandle, useRef, useCallback } from 'react';
import { apiHolder, apis, AddressBookNewApi, getIn18Text } from 'api';
import { Form, message, Select } from 'antd';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import style from './createMarktingRule.module.scss';
import classnames from 'classnames/bind';
// import Modal from '@web-common/components/UI/SiriusModal/index';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import ContactsFilter from '../../components/Contacts/contactFilter-modal';
import { generateAddressBookContactSearchParams, setRefreshParams } from '../../utils';
import lodashGet from 'lodash/get';

const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;
const eventApi = apiHolder.api.getEventApi();
const realStyle = classnames.bind(style);

export const CreateMarktingRule = React.forwardRef<
  {
    showModal(): void;
  },
  {
    onOK(params: { groupId: number; groupName: string }): unknown;
  }
>((props, ref) => {
  const { onOK } = props;
  const [visible, setVisible] = useState(false);

  useImperativeHandle(ref, () => {
    return {
      showModal() {
        setVisible(true);
      },
    };
  });

  const [noFilter, setNoFilter] = useState(true);

  const confirmCreateRule = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    const ruleValues = await (ruleRef.current ? ruleRef.current!.getValidateFields() : Promise.resolve({ groupName: '' }));

    if (!ruleValues || !ruleValues.groupName) {
      return;
    }

    const { groupName, ...restCondition } = ruleValues;

    // 调用生成规则接口
    // message.info('调用服务端生成自定义规则接口');

    const filter = generateAddressBookContactSearchParams(restCondition, 'grouped_filter');

    if (!lodashGet(filter, 'grouped_filter.subs.length', 0)) {
      setNoFilter(true);
      return;
    }

    setNoFilter(false);

    const groupId = await addressBookApi.createQuickMarktingGroup({
      group_name: groupName,
      group_filter_settings: filter,
    });

    onOK({
      groupId: groupId,
      groupName: groupName,
    });
    setVisible(false);
  };

  const ruleRef = useRef<{
    getValidateFields(): Promise<{ groupName: string; [key: string]: unknown }>;
  }>(null);

  const validRuleForm = () => {
    const fields = ruleRef.current ? ruleRef.current!.getValidateFields() : null;
    if (!fields) {
      return null;
    }
    const { groupName, ...restCondition } = fields;
    const filter = generateAddressBookContactSearchParams(restCondition, 'grouped_filter');
    if (lodashGet(filter, 'grouped_filter.subs.length', 0)) {
      return null;
    }
    return <p className={realStyle('noFilterError')}>{getIn18Text('ZHISHAOPEIZHIYIGSXTJ')}</p>;
  };

  const [labelStyle] = useState({
    margin: 0,
    padding: '8px 0',
    fontSize: 14,
    lineHeight: '22px',
    display: 'block',
  });

  return (
    <Modal
      title={'自定义快捷营销'}
      destroyOnClose={true}
      visible={visible}
      onOk={confirmCreateRule}
      headerBottomLine={false}
      footerTopLine={false}
      className={realStyle('marktingRuleWrapper')}
      onCancel={() => {
        setVisible(false);
      }}
    >
      <div className={realStyle('ruleTip')}>将以下筛选规则配置为快捷营销条件，可以一键选择对应状态地址</div>
      <ContactsFilter
        ref={ruleRef}
        onChange={(...args) => {
          console.log('xxxxxx', args);
        }}
        classnames={realStyle('filterEntry')}
        preExtraContent={
          <Form.Item label="自定义规则名称" name="groupName" className={realStyle('marktingRuleFormName')} rules={[{ required: true, message: '请输入自定义营销名称' }]}>
            <Input placeholder="请输入自定义营销名称" required maxLength={10} />
          </Form.Item>
        }
        suffExtraContent={
          <Form.Item className={realStyle('noFilterError')} shouldUpdate>
            {validRuleForm}
          </Form.Item>
        }
      ></ContactsFilter>
      {/* {noFilter ? <p className={realStyle('noFilterError')}>{getIn18Text("ZHISHAOPEIZHIYIGSXTJ")}</p> : null} */}
    </Modal>
  );
});
