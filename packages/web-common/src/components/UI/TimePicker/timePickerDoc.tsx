import React from 'react';
import TimePicker from './index';
import moment from 'moment';
import CompDoc from '../CompDoc/index';

const TimePickerDoc: React.FC = () => {
  const describe = `## TimePicker 时间选择器
  日期选择器组件是基于 react-datepicker 组件开发的，支持 react-datepicker 的所有 API https://github.com/Hacker0x01/react-datepicker`;

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Use
          npmPath="import TimePicker, { TimePickerProps } from '@lingxi-common-component/sirius-ui/TimePicker';"
          path="import TimePicker from '@web-common/components/UI/TimePicker';"
        />
        <CompDoc.RenderCode describe="#### 基本用法">
          <TimePicker value={moment('22:30', 'HH:mm')} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 禁用">
          <TimePicker value={moment('22:30', 'HH:mm')} disabled />
        </CompDoc.RenderCode>
        <CompDoc.Link href="https://github.com/Hacker0x01/react-datepicker">react-datepicker 文档</CompDoc.Link>
      </CompDoc>
    </>
  );
};

export default TimePickerDoc;
