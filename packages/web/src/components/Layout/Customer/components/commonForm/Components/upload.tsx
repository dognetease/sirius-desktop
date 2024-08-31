import React, { useState, useMemo } from 'react';
import { Upload, Button, Form, Tooltip } from 'antd';
import UploadImgWrap from './uploadWrapper';
interface comsProps {
  name: string;
  level1Fieldname?: number;
  fieldKey?: number;
  isFormList?: boolean; // 是否在formlist 中
  Logo: any;
}

const UploadImg = (props: comsProps) => {
  console.log('props.nameall', props);
  const { Logo } = props;
  // 特殊处理formList 中的元素
  const formItemLayout = () => {
    const layout = {};
    if (props.isFormList) {
      let layoutName = [props.level1Fieldname, props.name];
      let layoutFieldKey = [props.fieldKey, props.name];
      layout['name'] = layoutName;
      layout['fieldKey'] = layoutFieldKey;
    } else {
      layout['name'] = props.name;
    }
    return layout;
  };
  return (
    <Form.Item {...formItemLayout()} noStyle>
      <UploadImgWrap Logo={Logo} />
    </Form.Item>
  );
};
export default UploadImg;
