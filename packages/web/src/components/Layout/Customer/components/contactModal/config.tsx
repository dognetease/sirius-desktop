import { getIn18Text } from 'api';
// 线索联系人数据
const customerContactList = [
  {
    type: 'Radio',
    isCheckBox: true,
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
];
// 客户联系人数据
const allClientFormList = [
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
const allCustomerContact = {
  type: 'contactWrap',
  name: 'contact_list',
  multiple: false,
  children: allClientFormList,
};
const clueContact = {
  type: 'contactWrap',
  name: 'contact_list',
  multiple: false,
  children: customerContactList,
};
export { allCustomerContact, clueContact };
