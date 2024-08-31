import { getIn18Text } from 'api';
const normFile = e => {
  const text = e.target.value.match(/^\d*(\.?\d{0,2})/g)[0];
  if (text.includes('.')) {
    let arr = text.split('.');
    return `${arr[0].slice(0, 16)}.${arr[1]}`;
  }
  return text.slice(0, 16);
};
export type customerFormListType = formListItem[];
export interface formListItem {
  type: string;
  label: string;
  name: string;
  required: boolean;
  width?: number | string;
  maxLength?: number;
  message?: string;
  placeholder?: string;
  option?: {
    key: string;
    value: string;
  }[];
  selectField?: string;
  selfMessage?: string;
  isSubmit?: boolean;
  asyncCheck?: (value: string, item: any, isError: boolean) => void;
  regular?: string;
  multiple?: string;
  remote?: boolean;
  mode?: string;
  labelType?: number;
  dateFormat?: string;
  errArrMap?: {
    col: number;
    row: number;
  }[];
  isMulChecked?: boolean;
  checkName?: string;
  children?: formListItem[];
}
export interface customerContactType {
  type: string;
  name: string;
  multiple: boolean;
  children: customerFormListType;
}
const customerFormList = [
  {
    type: 'Complex',
    label: getIn18Text('GONGSIMINGCHENG'),
    name: 'company_name_box',
    required: true,
    children: [
      {
        type: 'Input',
        name: 'company_name',
        width: 252,
        maxLength: 100,
        label: getIn18Text('GONGSIMINGCHENG'),
        required: true,
        message: getIn18Text('QINGSHURUGONGSIMINGCHENG'),
        placeholder: getIn18Text('QINGSHURUGONGSIMINGCHENG'), // 提示文案
      },
      {
        type: 'Upload',
        name: 'company_logo',
        label: '',
        required: false,
        message: '',
        placeholder: '', // 提示文案
      },
    ],
  },
  {
    type: 'Input',
    name: 'short_name',
    maxLength: 100,
    label: getIn18Text('GONGSIJIANCHENG'),
    required: false,
    message: '',
    placeholder: getIn18Text('QINGSHURUGONGSIJIANCHENG'), // 提示文案
  },
  {
    type: 'Select',
    name: 'company_level',
    label: getIn18Text('KEHUFENJI'),
    remote: false,
    selectField: 'company_level',
    option: [{ key: '1', value: getIn18Text('WOSHIGAOJIKEHU') }],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZE'), // 提示文案
  },
  {
    type: 'Select',
    name: 'source',
    label: getIn18Text('KEHULAIYUAN'),
    remote: false,
    selectField: 'company_source',
    option: [],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZE'), // 提示文案
  },
  {
    type: 'Select',
    name: 'star_level',
    label: getIn18Text('KEHUXINGJI'),
    remote: false,
    selectField: 'star_level',
    option: [],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZE'), // 提示文案
  },
  {
    type: 'CascaserArea',
    name: 'area',
    label: getIn18Text('GUOJIADEQU'),
    remote: false,
    selectField: 'area',
    option: [],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZE'), // 提示文案
  },
  {
    type: 'Select',
    name: 'intent',
    label: getIn18Text('KEHUYIXIANG'),
    remote: false,
    selectField: 'intent',
    option: [],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZE'), // 提示文案
  },
  {
    type: 'Tags',
    mode: 'tags',
    labelType: 0,
    name: 'label_list',
    label: getIn18Text('KEHUBIAOQIAN'),
    remote: true,
    option: [],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGSHURU/XUANZEBIAOQIAN'), // 提示文案
  },
  {
    type: 'Input',
    name: 'company_domain',
    maxLength: 100,
    label: getIn18Text('GONGSIYUMING'),
    required: false,
    message: '',
    placeholder: getIn18Text('QINGSHURUGONGSIYUMING'), // 提示文案
  },
  {
    type: 'Input',
    name: 'website',
    maxLength: 100,
    label: getIn18Text('WANGZHI'),
    required: false,
    message: '',
    placeholder: getIn18Text('QINGSHURUWANGZHI'), // 提示文案
  },
  {
    type: 'Select',
    name: 'main_industry',
    selectField: 'main_industry',
    option: [],
    label: getIn18Text('ZHUYINGCHANPIN'),
    required: false,
    message: '',
    placeholder: getIn18Text('QINGSHURUZHUYINGCHANPIN'), // 提示文案
  },
  {
    type: 'Select',
    name: 'require_product_type',
    selectField: 'company_require_product_type',
    option: [],
    label: getIn18Text('XUQIUCHANPINLEIXING'),
    required: false,
    message: '',
    placeholder: getIn18Text('QINGSHURUXUQIUCHANPINLEIXING'), // 提示文案
  },
  {
    type: 'Select',
    name: 'product_require_level',
    selectField: 'company_product_require_level',
    option: [],
    label: getIn18Text('CHANPINXUQIUDU'),
    required: false,
    message: '',
    placeholder: getIn18Text('QINGSHURUCHANPINXUQIUDU'), // 提示文案
  },
  {
    type: 'Select',
    name: 'purchase_amount',
    label: getIn18Text('NIANCAIGOUE'),
    selectField: 'purchase_amount',
    option: [],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZE'), // 提示文案
  },
  {
    type: 'Select',
    name: 'zone',
    label: getIn18Text('DANGDESHIQU'),
    remote: false,
    selectField: 'zone',
    option: [],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZE'), // 提示文案
  },
  {
    type: 'Select',
    name: 'scale',
    label: getIn18Text('GONGSIGUIMO'),
    remote: false,
    selectField: 'scale',
    option: [],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZE'), // 提示文案
  },
  {
    type: 'Input',
    name: 'fax',
    label: getIn18Text('CHUANZHENHAO'),
    required: false,
    message: '',
    placeholder: getIn18Text('QINGSHURUCHUANZHENHAO'),
    maxLength: 100, // 字数限制
  },
  {
    type: 'Input',
    name: 'telephone',
    label: getIn18Text('ZUOJIDIANHUA'),
    checkName: 'landline_telephone',
    required: false,
    message: '',
    placeholder: getIn18Text('QINGSHURUZUOJIHAOMA'),
    maxLength: 100, // 字数限制
  },
  {
    type: 'TextArea',
    name: 'address',
    label: getIn18Text('LIANXIDEZHI'),
    placeholder: getIn18Text('QINGSHURULIANXIDEZHI'),
    required: false,
    message: '',
    regular: '',
    multiple: '',
    maxLength: 200, // 字数限制
  },
  {
    type: 'TextArea',
    name: 'remark',
    label: getIn18Text('BEIZHU'),
    placeholder: getIn18Text('TIANJIAKEHUBEIZHU'),
    required: false,
    message: '',
    regular: '',
    multiple: '',
    maxLength: 2000, // 字数限制
  },
  {
    type: 'PicturesWall',
    name: 'pictures',
    label: getIn18Text('TUPIAN'),
    placeholder: '',
    required: false,
    message: '',
    regular: '',
    multiple: '', // 是否支持多选
  },
];
const customerContactList = [
  {
    type: 'Radio',
    name: 'main_contact',
    maxLength: 100,
    label: getIn18Text('SHEWEIZHUYAOLIANXIREN'),
    required: false,
    message: getIn18Text('QINGSHURULIANXIRENXINGMING'),
    placeholder: getIn18Text('QINGSHURULIANXIRENXINGMING'), // 提示文案
  },
  {
    type: 'Complex',
    label: getIn18Text('LIANXIREN'),
    name: 'contact_name_box',
    required: false,
    children: [
      {
        type: 'Input',
        name: 'contact_name',
        width: 252,
        maxLength: 100,
        label: getIn18Text('LIANXIREN'),
        required: false,
        message: getIn18Text('QINGSHURULIANXIRENXINGMING'),
        placeholder: getIn18Text('QINGSHURULIANXIRENXINGMING'), // 提示文案
      },
      {
        type: 'Upload',
        name: 'contact_icon',
        label: '',
        required: false,
        message: '',
        placeholder: '', // 提示文案
      },
    ],
  },
  {
    type: 'Tags',
    name: 'label_list',
    option: [],
    label: getIn18Text('BIAOQIAN'),
    remote: true,
    mode: 'tags',
    labelType: 1,
    required: false,
    message: '',
    placeholder: getIn18Text('QINGSHURU/XUANZEBIAOQIAN'), // 提示文案
  },
  {
    type: 'Input',
    name: 'email',
    maxLength: 100,
    label: getIn18Text('YOUXIANGDEZHI'),
    ruleType: 'email',
    required: true,
    message: getIn18Text('QINGSHURUYOUXIANGDEZHI'),
    placeholder: getIn18Text('QINGSHURUYOUXIANGDEZHI'), // 提示文案
  },
  {
    type: 'Telephones',
    name: 'telephones',
    checkName: 'telephone',
    label: getIn18Text('DIANHUAHAOMA'),
    required: false,
    message: '',
    placeholder: getIn18Text('QINGSHURUDIANHUAHAOMA'), // 提示文案
  },
  {
    type: 'Input',
    name: 'whats_app',
    maxLength: 100,
    label: 'WhatsApp',
    required: false,
    message: '',
    placeholder: getIn18Text('QINGSHURUWhatsApp'), // 提示文案
  },
  {
    type: 'SocialPlatform',
    name: 'social_platform',
    label: getIn18Text('SHEJIAOPINGTAI'),
    remote: false,
    selectField: 'social_platform',
    option: [{ key: '1', value: getIn18Text('WOSHIGAOJIKEHU') }],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZE'), // 提示文案
  },
  {
    type: 'Input',
    name: 'job',
    maxLength: 100,
    label: getIn18Text('ZHIWEI'),
    required: false,
    message: '',
    placeholder: getIn18Text('QINGSHURUZHIWEI'), // 提示文案
  },
  {
    type: 'Input',
    name: 'home_page',
    maxLength: 100,
    label: getIn18Text('GERENZHUYE'),
    required: false,
    message: '',
    placeholder: getIn18Text('QINGSHURUGERENZHUYE'), // 提示文案
  },
  {
    type: 'Select',
    name: 'gender',
    label: getIn18Text('XINGBIE'),
    remote: false,
    selectField: 'gender',
    option: [],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZE'), // 提示文案
  },
  {
    type: 'DatePicker',
    name: 'birthday',
    dateFormat: 'YYYY/MM/DD',
    width: '100%',
    label: getIn18Text('SHENGRI'),
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZELIANXIRENCHUSHENGRIQI'), // 提示文案
  },
  {
    type: 'TextArea',
    name: 'remark',
    label: getIn18Text('BEIZHU'),
    placeholder: getIn18Text('TIANJIALIANXIRENBEIZHU'),
    required: false,
    message: '',
    regular: '',
    multiple: '',
    maxLength: 2000, // 字数限制
  },
  {
    type: 'PicturesWall',
    name: 'pictures',
    label: getIn18Text('TUPIAN'),
    placeholder: '',
    required: false,
    message: '',
    regular: '',
    multiple: '', // 是否支持多选
  },
];
const businessList = [
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
    placeholder: getIn18Text('QINGXUANSHANGJILAIYUAN'), // 提示文案
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
    type: 'Input',
    name: 'estimate',
    maxLength: 100,
    label: getIn18Text('YUGUSHANGJIJINE'),
    normFile: normFile,
    required: false,
    message: getIn18Text('QINGSHURUXUQIUCHANPIN'),
    placeholder: getIn18Text('QINGSHURUJINE'), // 提示文案
  },
  {
    type: 'Select',
    name: 'stage',
    label: getIn18Text('XIAOSHOUJIEDUAN'),
    remote: false,
    selectField: 'businessStages',
    options: [] as {
      value: number;
      label: string;
      type: number;
    }[],
    option: [],
    required: true,
    message: getIn18Text('QINGXUANXIAOSHOUJIEDUAN'),
    placeholder: getIn18Text('QINGXUANXIAOSHOUJIEDUAN'), // 提示文案
  },
  {
    type: 'Input',
    name: 'turnover',
    isHidden: true,
    maxLength: 100,
    normFile: normFile,
    label: getIn18Text('CHENGJIAOJINE'),
    required: true,
    message: getIn18Text('QINGSHURUCHENGJIAOJINE'),
    placeholder: getIn18Text('QINGSHURUCHENGJIAOJINE'), // 提示文案
  },
  {
    type: 'DatePicker',
    name: 'deal_at',
    dateFormat: 'YYYY/MM/DD',
    width: '100%',
    label: getIn18Text('CHENGJIAORIQI'),
    isHidden: true,
    required: true,
    message: getIn18Text('QINGXUANZECHENGJIAORIQI'),
    placeholder: getIn18Text('QINGXUANZECHENGJIAORIQI'), // 提示文案
  },
  {
    type: 'Input',
    name: 'deal_info',
    maxLength: 100,
    label: getIn18Text('CHENGJIAOXINXI'),
    isHidden: true,
    required: false,
    message: getIn18Text('QINGSHURUCHENGJIAOXINXI'),
    placeholder: getIn18Text('QINGSHURUCHENGJIAOXINXI'), // 提示文案
  },
  {
    type: 'TextArea',
    name: 'remark',
    label: getIn18Text('BEIZHU'),
    placeholder: getIn18Text('QINGSHURUBEIZHU'),
    required: false,
    message: '',
    regular: '',
    multiple: '',
    maxLength: 2000, // 字数限制
  },
];
const customerContact = {
  type: 'contactWrap',
  name: 'contact_list',
  multiple: true,
  children: customerContactList,
};
export { customerFormList, customerContactList, customerContact, businessList };
