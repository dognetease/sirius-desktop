import * as React from 'react';
import { Menu } from 'antd';
import 'antd/es/menu/style/index.css';
import ButtonDoc from '../src/Button/buttonDoc';
import IconDoc from './icon';
import NpmDoc from './npm';
import DividerDoc from '../src/Divider/dividerDoc';
import TagDoc from '../src/Tag/TagDoc';
// import HollowOutGuideDoc from '../src/HollowOutGuideNew/HollowOutGuideDoc';
import PaginationDoc from '../src/Pagination/paginationDoc';
import TableDoc from '../src/Table/tableDoc';
import TabsDoc from '../src/Tabs/tabsDoc';
import DrawerDoc from '../src/siriusDrawer-ui/drawerDoc';
import CascaderDoc from '../src/Cascader/cascaderDoc';
import RadioDoc from '../src/Radio/radioDoc';
import CheckboxDoc from '../src/Checkbox/checkboxDoc';
import switchDoc from '../src/Switch/switchDoc';
import InputDoc from '../src/Input/inputDoc';
import SelectDoc from '../src/Select/selectDoc';
import ModalDoc from '../src/SiriusModal-ui/modalDoc';
import TooltipDoc from '../src/Tooltip/tooltipDoc';
import BreadcrumbDoc from '../src/Breadcrumb/breadcrumbDoc';
import PageHeaderDoc from '../src/PageHeader/pageHeaderDoc';
import DatePickerDoc from '../src/DatePicker/datePickerDoc';
import TimePickerDoc from '../src/TimePicker/timePickerDoc';
import BadgeDoc from '../src/SiriusBadge/badgeDoc';
import StepsDoc from '../src/SiriusSteps/stepsDoc';

const docs = [
  {
    title: '快速上手',
    key: 'quickStart',
    menuItems: [{ title: 'npm 安装', comp: NpmDoc, key: 'npm' }],
  },
  {
    title: '通用',
    key: 'common',
    menuItems: [
      { title: 'Button 按钮', comp: ButtonDoc, key: 'button' },
      { title: 'Icon 图标', comp: IconDoc, key: 'icon' },
      { title: 'Divider 分割线', comp: DividerDoc, key: 'divider' },
      { title: 'Badge 徽标', comp: BadgeDoc, key: 'badge' },
      { title: 'Tag 标签', comp: TagDoc, key: 'tag' },
      { title: 'Guide 新手引导', comp: () => <div>Guide 新手引导（待补充）</div>, key: 'guide' },
    ],
  },
  {
    title: '导航',
    key: 'navigation',
    menuItems: [
      { title: 'Pagination 分页', comp: PaginationDoc, key: 'pagination' },
      { title: 'Breadcrumb 面包屑', comp: BreadcrumbDoc, key: 'breadcrumb' },
      { title: 'PageHeader 页头', comp: PageHeaderDoc, key: 'pageHeader' },
      { title: 'Steps 步骤条', comp: StepsDoc, key: 'steps' },
      { title: 'Timeline 时间轴', comp: () => <div>Timeline 时间轴（待补充）</div>, key: 'timeline' },
    ],
  },
  {
    title: '数据展示',
    key: 'dataPresentation',
    menuItems: [
      { title: 'Table 表格', comp: TableDoc, key: 'table' },
      { title: 'Tabs 标签页', comp: TabsDoc, key: 'tabs' },
      { title: 'Drawer 抽屉', comp: DrawerDoc, key: 'drawer' },
    ],
  },
  {
    title: '数据输入',
    key: 'dataEntry',
    menuItems: [
      { title: 'Dropdown 下拉菜单', comp: () => <div>Dropdown 下拉菜单（待补充）</div>, key: 'dropdown' },
      { title: 'Cascader 级联菜单', comp: CascaderDoc, key: 'cascader' },
      { title: 'Radio 单选', comp: RadioDoc, key: 'radio' },
      { title: 'Checkbox 多选', comp: CheckboxDoc, key: 'checkbox' },
      { title: 'Switch 开关', comp: switchDoc, key: 'switch' },
      { title: 'TimePicker 时间选择器', comp: TimePickerDoc, key: 'timePicker' },
      { title: 'DatePicker 日期选择器', comp: DatePickerDoc, key: 'datepicker' },
      { title: 'Input 输入框', comp: InputDoc, key: 'input' },
      { title: 'Select 选择器', comp: SelectDoc, key: 'select' },
    ],
  },
  {
    title: '反馈',
    key: 'feedback',
    menuItems: [
      { title: 'Message 全局提示', comp: () => <div>Message 全局提示（待补充）</div>, key: 'message' },
      { title: 'Modal 对话框', comp: ModalDoc, key: 'modal' },
      { title: 'ToolTip 文字提示', comp: TooltipDoc, key: 'toolTip' },
      { title: 'Alert 警告提示', comp: () => <div>Alert 警告提示（待补充）</div>, key: 'alert' },
    ],
  },
];

const Comp = () => {
  const [onComp, setOnComp] = React.useState<string>('button');
  const RightComp = React.useMemo(() => {
    for (let i = 0; i < docs.length; i++) {
      for (let j = 0; j < docs[i].menuItems.length; j++) {
        if (docs[i].menuItems[j].key === onComp) {
          return docs[i].menuItems[j].comp;
        }
      }
    }
    return <div>组件文档未找到</div>;
  }, [onComp]) as React.FC;

  const menuClick = ({ key }: any) => {
    setOnComp(key);
  };
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div className="page-left" style={{ width: '200px', minWidth: '200px', overflowY: 'auto' }}>
        <Menu selectedKeys={[onComp]} onClick={menuClick}>
          {docs.map((item: any) => {
            return (
              <Menu.ItemGroup key={item.key} title={item.title}>
                {item.menuItems.map((subItem: any) => {
                  return <Menu.Item key={subItem.key}>{subItem.title}</Menu.Item>;
                })}
              </Menu.ItemGroup>
            );
          })}
        </Menu>
      </div>
      <div className="page-right" style={{ flex: '1 1 auto', overflowY: 'auto' }}>
        <RightComp />
      </div>
    </div>
  );
};

export default Comp;