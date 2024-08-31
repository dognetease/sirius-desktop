import React from 'react';
import { Select, Tooltip, Space } from 'antd';
import { getTransText } from '@/components/util/translate';
import { SelectProps, SelectValue } from 'antd/lib/select';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import ShowConfirm from '@/components/Layout/Customer/components/confirm/makeSureConfirm';
// import style from './emailOpTypeSelect.scss';
import { getIn18Text } from 'api';

interface Props extends SelectProps<SelectValue> {
  branchStatus?: boolean;
}

export const EmailOpTypeSelect: React.FC<Props> = props => {
  const onChangeValue = (e: number) => {
    let disabledType = [2, 3];
    if (props?.branchStatus && !disabledType.includes(e)) {
      ShowConfirm({
        title: getTransText('JIANCEDAOXIUGAIZHUIJIADONGZUO'),
        content: getTransText('RUOZHUIJIADONGZUO1DECHUFATIAOJIAN'),
        type: 'danger',
        okText: getIn18Text('QUEDING'),
        cancelText: getIn18Text('setting_system_switch_cancel'),
        makeSure: () => props.onChange && props.onChange(e),
      });
    } else {
      console.log('xxxx-target-vlaue');
      props.onChange && props.onChange(e);
    }
  };

  return (
    <Select placeholder={getTransText('XUANZEDONGZUO')} allowClear {...props} value={props.value} onChange={value => onChangeValue(value as number)}>
      {props.children}
      <Select.OptGroup
        label={
          <Space>
            <span>{getTransText('PassivityAction')}</span>
            <Tooltip title={getTransText('PassivityActionTip')}>
              <QuestionCircleOutlined />
            </Tooltip>
          </Space>
        }
      >
        <Select.Option value={2}>{getTransText('SONGDAWEIDAKAI')}</Select.Option>
        <Select.Option value={3}>{getTransText('DAKAIWEIHUIFU')}</Select.Option>
      </Select.OptGroup>
      <Select.OptGroup
        label={
          <Space>
            <span>{getTransText('ActiveAction')}</span>
            <Tooltip title={getTransText('ActiveActionTip')}>
              <QuestionCircleOutlined />
            </Tooltip>
          </Space>
        }
      >
        <Select.Option value={0}>{getTransText('DAKAI')}</Select.Option>
        <Select.Option value={1}>
          {
            <Space>
              <span>{getTransText('HUIFU')}</span>
              <Tooltip title={getTransText('BUBAOHANZIDONGHUIFU')}>
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          }
        </Select.Option>
      </Select.OptGroup>
    </Select>
  );
};
