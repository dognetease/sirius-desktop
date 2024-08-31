import { apiHolder, apis, CustomerApi } from 'api';
import { getIn18Text } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const checkCompany = async (name, companyId) => {
  if (!name) {
    return Promise.resolve();
  }
  const param = {
    company_id: companyId,
    company_name: name,
  };
  // code 非零就是有名称异常
  const res = await clientApi.checkClientName(param);
  if (res.code === 0) {
    return Promise.resolve();
  }
  return Promise.reject(new Error(res.message));
};
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
        checkFun: checkCompany,
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
    maxLength: 100, // 字数限制
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
    message: getIn18Text('QINGSHURULIANXIRENMINGCHENG'),
    placeholder: getIn18Text('QINGSHURULIANXIRENMINGCHENG'), // 提示文案
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
        message: getIn18Text('QINGSHURULIANXIRENMINGCHENG'),
        placeholder: getIn18Text('QINGSHURULIANXIRENMINGCHENG'), // 提示文案
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
    placeholder: getIn18Text('QINGXUANZENINDECHUSHENGNIANYUERI'), // 提示文案
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
const customerContact = {
  type: 'contactWrap',
  name: 'contact_list',
  multiple: true,
  children: customerContactList,
};
export { customerFormList, customerContactList, customerContact };
