import React from 'react';
import DatePicker from './index';
import moment from 'moment';
import CompDoc from '../CompDoc/index';
const { RangePicker } = DatePicker;

const DatePickerDoc: React.FC = () => {
  const describe = `## DatePicker 日期选择器
  日期选择器组件是基于 antd 的 DatePicker 组件开发的，支持 antd DatePicker 的所有 API https://4x.ant.design/components/date-picker-cn/`;
  const path = `import DatePicker from '@web-common/components/UI/DatePicker';
  const { RangePicker } = DatePicker;`;
  const npmPath = "import DatePicker, { DatePickerProps } from '@lingxi-common-component/sirius-ui/DatePicker';";

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Use npmPath={npmPath} path={path} />
        <CompDoc.RenderCode describe="#### 基本用法" rowSpace>
          <DatePicker />
          <DatePicker picker="week" />
          <DatePicker picker="month" />
          <DatePicker picker="quarter" />
          <DatePicker picker="year" />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 默认填充日期">
          <DatePicker allowClear={false} defaultValue={moment('2022-09-08', 'YYYY-MM-DD')} width={200} />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 选择时间段" customCode="<RangePicker />">
          <RangePicker />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode
          describe="#### 快捷选择"
          customCode={`<RangePicker ranges={{Today: [moment(), moment()],'This Month': [moment().startOf('month'), moment().endOf('month')],}}/>`}
        >
          <RangePicker
            ranges={{
              Today: [moment(), moment()],
              'This Month': [moment().startOf('month'), moment().endOf('month')],
            }}
          />
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 禁用">
          <DatePicker defaultValue={moment('2022-09-08', 'YYYY-MM-DD')} disabled />
        </CompDoc.RenderCode>
        <CompDoc.Link href="https://4x.ant.design/components/date-picker-cn/">antd DatePicker 文档</CompDoc.Link>
      </CompDoc>
    </>
  );
};

export default DatePickerDoc;
