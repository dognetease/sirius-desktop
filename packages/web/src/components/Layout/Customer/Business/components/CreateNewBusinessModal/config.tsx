import { getIn18Text } from 'api';
const normFile = e => {
  const text = e.target.value.match(/^\d*(\.?\d{0,2})/g)[0];
  if (text.includes('.')) {
    let arr = text.split('.');
    return `${arr[0].slice(0, 16)}.${arr[1]}`;
  }
  return text.slice(0, 16);
};
interface OptionProps {
  value: string;
  label: string;
}
interface OptionClientProps {
  value: number;
  label?: string;
}
const businessListLeft = [
  {
    type: 'Input',
    name: 'name',
    maxLength: 100,
    label: getIn18Text('SHANGJIMINGCHENG'),
    required: true,
    message: getIn18Text('QINGSHURUSHANGJIMINGCHENG'),
    placeholder: getIn18Text('QINGSHURUSHANGJIMINGCHENG'), // 提示文案
  },
  {
    type: 'Select',
    name: 'currency',
    label: getIn18Text('BIZHONG'),
    remote: false,
    selectField: 'currency',
    // options: currencyOptions,
    required: false,
    message: getIn18Text('QINGXUANZEBIZHONG'),
    placeholder: getIn18Text('QINGXUANZEBIZHONG'), // 提示文案
  },
  {
    type: 'Select',
    name: 'source',
    label: getIn18Text('SHANGJILAIYUAN'),
    remote: false,
    selectField: 'opportunity_source',
    option: [],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZESHANGJILAIYUAN'), // 提示文案
  },
  {
    type: 'Input',
    name: 'estimate',
    maxLength: 100,
    label: getIn18Text('YUGUSHANGJIJINE'),
    normFile: normFile,
    // checkFun: checkNumsLenth,
    required: false,
    message: getIn18Text('QINGSHURUXUQIUCHANPIN'),
    placeholder: getIn18Text('QINGSHURUJINE'), // 提示文案
  },
  {
    type: 'Input',
    name: 'turnover',
    isShow: 5,
    isHidden: true,
    maxLength: 100,
    normFile: normFile,
    label: getIn18Text('CHENGJIAOJINE'),
    required: true,
    message: getIn18Text('QINGSHURUCHENGJIAOJINE'),
    placeholder: getIn18Text('QINGSHURUCHENGJIAOJINE'), // 提示文案
  },
  {
    type: 'TextArea',
    name: 'close_reason',
    isShow: 6,
    isHidden: true,
    maxLength: 2000,
    label: getIn18Text('GUANBIYUANYIN'),
    required: true,
    message: getIn18Text('QINGSHURUGUANBIYUANYIN'),
    placeholder: getIn18Text('QINGSHURUGUANBIYUANYIN'), // 提示文案
  },
  {
    type: 'Input',
    name: 'deal_info',
    maxLength: 100,
    label: getIn18Text('CHENGJIAOXINXI'),
    isShow: 5,
    isHidden: true,
    required: false,
    message: getIn18Text('QINGSHURUCHENGJIAOXINXI'),
    placeholder: getIn18Text('QINGSHURUCHENGJIAOXINXI'), // 提示文案
  },
  {
    type: 'TextArea',
    name: 'remark',
    label: getIn18Text('BEIZHU'),
    isHidden: true,
    isShow: [0, 1, 2, 3, 4, 7],
    placeholder: getIn18Text('QINGSHURUBEIZHU'),
    required: false,
    message: '',
    regular: '',
    multiple: '',
    maxLength: 2000, // 字数限制
  },
];
const businessListRight = [
  {
    type: 'ClientSelect',
    name: 'company_id',
    label: getIn18Text('GUANLIANKEHU'),
    remote: false,
    disabled: false,
    // selectField: 'company_source', // ??? 字段等待替换
    options: [] as OptionClientProps[],
    // showSearch: true,
    // onSearch: throttle(handleTagsSearch, 1000),
    // options: options,
    required: true,
    message: getIn18Text('QINGXUANZEGUANLIANKEHU'),
    placeholder: getIn18Text('QINGXUANZEGUANLIANKEHU'), // 提示文案
  },
  {
    type: 'Select',
    name: 'contact_id_list',
    label: getIn18Text('GUANLIANLIANXIREN'),
    remote: false,
    mode: 'multiple',
    selectField: 'contact_list',
    options: [] as OptionProps[],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZEGUANLIANXIREN'), // 提示文案
  },
  {
    type: 'Input',
    name: 'product',
    maxLength: 100,
    label: getIn18Text('XUQIUCHANPIN'),
    required: false,
    message: getIn18Text('QINGSHURUXUQIUCHANPIN'),
    placeholder: getIn18Text('QINGSHURUXUQIUCHANPIN'), // 提示文案
  },
  {
    type: 'Select',
    name: 'stage',
    label: getIn18Text('XIAOSHOUJIEDUAN'),
    remote: false,
    selectField: 'businessStages',
    options: [] as OptionProps[],
    option: [],
    required: true,
    message: getIn18Text('QINGXUANZEXIAOSHOUJIEDUAN'),
    placeholder: getIn18Text('QINGXUANZEXIAOSHOUJIEDUAN'), // 提示文案
  },
  {
    type: 'DatePicker',
    name: 'deal_at',
    dateFormat: 'YYYY/MM/DD',
    width: '100%',
    label: getIn18Text('CHENGJIAORIQI'),
    isShow: 5,
    isHidden: true,
    required: true,
    message: getIn18Text('QINGXUANZECHENGJIAORIQI'),
    placeholder: getIn18Text('QINGXUANZECHENGJIAORIQI'), // 提示文案
  },
  {
    type: 'TextArea',
    name: 'remark',
    label: getIn18Text('BEIZHU'),
    isHidden: true,
    isShow: [5, 6],
    placeholder: getIn18Text('QINGSHURUBEIZHU'),
    required: false,
    message: '',
    regular: '',
    multiple: '',
    maxLength: 2000, // 字数限制
  },
];
export { businessListLeft, businessListRight };
