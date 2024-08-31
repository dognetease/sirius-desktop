import { Form, Input, Select } from 'antd';
const { Option } = Select;
const { TextArea } = Input;
import { apiHolder, apis, MailEntryModel, CustomerApi, SystemApi, ContactApi, MailConfApi, ContactModel, MailApi } from 'api';
import { getIn18Text } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const customerFormList = [
  {
    type: 'Input',
    name: 'name',
    maxLength: 100,
    label: getIn18Text('XIANSUOMINGCHENG'),
    required: true,
    message: getIn18Text('QINGSHURUXIANSUOMINGCHENG'),
    placeholder: getIn18Text('QINGSHURUXIANSUOMINGCHENG'), // 提示文案
  },
  {
    type: 'Select',
    name: 'source',
    label: getIn18Text('XIANSUOLAIYUAN'),
    remote: false,
    selectField: 'clue_source',
    option: [],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZE'), // 提示文案
  },
  {
    type: 'Select',
    name: 'clue_batch',
    label: getIn18Text('XIANSUOPICI'),
    remote: false,
    selectField: 'clue_batch',
    option: [],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZE'), // 提示文案
  },
  {
    type: 'TextArea',
    name: 'remark',
    label: getIn18Text('XIANSUOBEIZHU'),
    placeholder: getIn18Text('TIANJIAXIANSUOBEIZHU'),
    required: false,
    message: '',
    regular: '',
    multiple: '',
    maxLength: 2000, // 字数限制
  },
  {
    type: 'Input',
    name: 'company_name',
    maxLength: 100,
    label: getIn18Text('GONGSIMINGCHENG'),
    required: false,
    message: '',
    placeholder: getIn18Text('QINGSHURUGONGSIMINGCHENG'), // 提示文案
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
  // {
  //     type: 'Input',
  //     name: "website",
  //     maxLength: 100, // 字数限制
  //     label: "网址",
  //     required: false, // 是否必填
  //     message: '',  // 错误提示信息
  //     placeholder: '请输入网址' // 提示文案
  // },
  {
    type: 'CascaserArea',
    name: 'area',
    label: getIn18Text('GUOJIADEQU'),
    className: 'clue-cascader-wrap',
    remote: false,
    selectField: 'area',
    option: [],
    required: false,
    message: '',
    placeholder: getIn18Text('QINGXUANZE'), // 提示文案
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
    type: 'Input',
    name: 'email',
    maxLength: 100,
    label: getIn18Text('YOUXIANGDEZHI'),
    ruleType: 'email',
    required: false,
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
const customerContact = {
  type: 'contactWrap',
  name: 'contact_list',
  multiple: true,
  children: customerContactList,
};
export { customerFormList, customerContactList, customerContact };
