import * as React from 'react';
import { Menu } from 'antd';
import { PageProps } from 'gatsby';
import ButtonDoc from '@web-common/components/UI/Button/buttonDoc';
import DividerDoc from '@web-common/components/UI/Divider/dividerDoc';
import TagDoc from '@web-common/components/UI/Tag/TagDoc';
import HollowOutGuideDoc from '@web-common/components/UI/HollowOutGuideNew/HollowOutGuideDoc';
import PaginationDoc from '@web-common/components/UI/Pagination/paginationDoc';
import TableDoc from '@web-common/components/UI/Table/tableDoc';
import CascaderDoc from '@web-common/components/UI/Cascader/cascaderDoc';
import InputDoc from '@web-common/components/UI/Input/inputDoc';
import TooltipDoc from '@web-common/components/UI/Tooltip/tooltipDoc';
import BreadcrumbDoc from '@web-common/components/UI/Breadcrumb/breadcrumbDoc';
import PageHeaderDoc from '@web-common/components/UI/PageHeader/pageHeaderDoc';
import DatePickerDoc from '@web-common/components/UI/DatePicker/datePickerDoc';
import TimePickerDoc from '@web-common/components/UI/TimePicker/timePickerDoc';
import CssStandard from './cssStandard.mdx';
import IconUsage from './iconUsage.mdx';

const docs = [
  { title: 'Button 按钮', comp: ButtonDoc, key: 'button' },
  { title: 'Divider 分割线', comp: DividerDoc, key: 'divider' },
  { title: 'Tag 标签', comp: TagDoc, key: 'tag' },
  { title: 'Guide 新手引导', comp: HollowOutGuideDoc, key: 'guide' },
  { title: 'Breadcrumb 面包屑', comp: BreadcrumbDoc, key: 'breadcrumb' },
  { title: 'PageHeader 页头', comp: PageHeaderDoc, key: 'pageHeader' },
  { title: 'Pagination 分页', comp: PaginationDoc, key: 'pagination' },
  { title: 'Table 表格', comp: TableDoc, key: 'table' },
  { title: 'Cascader 级联菜单', comp: CascaderDoc, key: 'cascader' },
  { title: 'Input 输入框', comp: InputDoc, key: 'input' },
  { title: 'DatePicker 日期选择器', comp: DatePickerDoc, key: 'datepicker' },
  { title: 'TimePicker 时间选择器', comp: TimePickerDoc, key: 'timePicker' },
  { title: 'ToolTip 文字提示', comp: TooltipDoc, key: 'toolTip' },
  {
    title: 'Icon 图标',
    comp: () => (
      <div style={{ padding: '15px' }}>
        <IconUsage />
      </div>
    ),
    key: 'icon',
  },
  {
    title: '标准化',
    comp: () => (
      <div style={{ padding: '15px' }}>
        <CssStandard />
      </div>
    ),
    key: 'css',
  },
];

const CompDocPage: React.FC<PageProps> = () => {
  const [onComp, setOnComp] = React.useState<string>('button');
  const RightComp = React.useMemo(() => {
    for (let i = 0; i < docs.length; i++) {
      if (docs[i].key === onComp) {
        return docs[i].comp;
      }
    }
    return <div>组件文档未找到</div>;
  }, [onComp]) as React.FC;

  const menuClick = ({ key }: any) => {
    setOnComp(key);
  };
  return (
    <div>
      <div className="page-left" style={{ position: 'fixed', left: 0, top: 0, width: '150px', overflowY: 'auto' }}>
        <Menu selectedKeys={[onComp]} onClick={menuClick}>
          {docs.map((item: any) => (
            <Menu.Item key={item.key}>{item.title}</Menu.Item>
          ))}
        </Menu>
      </div>
      <div className="page-left" style={{ position: 'fixed', left: '150px', top: 0, bottom: 0, right: 0, overflowY: 'auto' }}>
        <RightComp />
      </div>
    </div>
  );
};

export default CompDocPage;
