import MoreAccount from '@/images/onboarding/more_account180.png';
import Top from '@/images/onboarding/top180.png';
import MultipleFiles from '@/images/onboarding/multiple_files180.png';
import MailClassify from '@/images/onboarding/mail_classify180.png';
import FeedbackImg from '@/images/onboarding/feedback180.png';
import MailTemplate from '@/images/onboarding/template180.png';
import MailSignature from '@/images/onboarding/signature180.png';
import MailAggregation from '@/images/onboarding/aggregation180.png';
import Read from '@/images/onboarding/read180.png';
import Withdraw from '@/images/onboarding/withdraw180.png';
import Flag from '@/images/onboarding/flag180.png';
import Native from '@/images/onboarding/native180.png';
import { getIn18Text } from 'api';
// 引导页默认配置
// TODO: 暂时前端写死，后面要支持接口配置
export const configMap = {
  moreAccount: {
    title: getIn18Text('DUOGEZHANGHAO '),
    desc: getIn18Text('GAOXIAOGUANLIDUO'),
    imgUrl: MoreAccount,
    // btn: {
    //   txt: '添加账号',
    //   url: ''
    // }
  },
  toTop: {
    title: getIn18Text('YOUJIANZHIDING '),
    desc: getIn18Text('ZHONGYAOYOUJIANYI'),
    imgUrl: Top,
  },
  customFolder: {
    title: getIn18Text('DUOJIWENJIANJIA'),
    desc: getIn18Text('YOUXUFENLEIWANG'),
    imgUrl: MultipleFiles,
    // btn: {
    //   txt: '立即设置',
    //   url: ''
    // }
  },
  classify: {
    title: getIn18Text('LAIXINFENLEI '),
    desc: getIn18Text('SHEZHILAIXINFEN11'),
    imgUrl: MailClassify,
    // btn: {
    //   txt: '立即开启',
    //   url: ''
    // }
  },
  feedback: {
    title: getIn18Text('WENTIFANKUI '),
    desc: getIn18Text('RUONINXUYAOREN'),
    imgUrl: FeedbackImg,
    // btn: {
    //   txt: '我要反馈',
    //   url: ''
    // }
  },
  template: {
    title: getIn18Text('YOUJIANMOBAN '),
    desc: getIn18Text('ZHONGFUYOUJIANSHE'),
    imgUrl: MailTemplate,
    // btn: {
    //   txt: '定制我的邮件模板',
    //   url: ''
    // }
  },
  signature: {
    title: getIn18Text('DINGZHIQIANMING '),
    desc: getIn18Text('LINGXIDINGZHIYOU'),
    imgUrl: MailSignature,
    // btn: {
    //   txt: '完善签名',
    //   url: ''
    // }
  },
  aggregation: {
    title: getIn18Text('ZHINENGYOUJIAN '),
    desc: getIn18Text('TONGZHUTIYOUJIAN'),
    imgUrl: MailAggregation,
    // btn: {
    //   txt: '马上开启',
    //   url: ''
    // }
  },
  readStatus: {
    title: getIn18Text('YIDUWEIDU '),
    desc: getIn18Text('CHAKANYOUJIANYUE'),
    imgUrl: Read,
  },
  revocation: {
    title: getIn18Text('CHEHUIYOUJIAN '),
    desc: getIn18Text('CHEHUIYOUJIANZHONG'),
    imgUrl: Withdraw,
  },
  redFlag: {
    title: getIn18Text('HONGQIYOUJIAN '),
    desc: getIn18Text('ZHONGYAOYOUJIANHONG'),
    imgUrl: Flag,
  },
  nativeGuide: {
    title: getIn18Text('DUODUANZHICHI '),
    desc: getIn18Text('XIAZAISHOUJIDUAN'),
    imgUrl: Native,
    // btn: {
    //   txt: '立即体验',
    //   url: ''
    // }
  },
};
export const guideConfig = {
  1: {
    // 收件箱
    sort: ['aggregation', 'moreAccount', 'toTop', 'customFolder', 'classify', 'feedback', 'nativeGuide'],
    config: {
      aggregation: configMap.aggregation,
      moreAccount: configMap.moreAccount,
      toTop: configMap.toTop,
      customFolder: configMap.customFolder,
      classify: configMap.classify,
      feedback: configMap.feedback,
      nativeGuide: configMap.nativeGuide,
    },
  },
  3: {
    // 发件箱
    sort: ['readStatus', 'revocation', 'template', 'signature', 'nativeGuide'],
    config: {
      readStatus: configMap.readStatus,
      revocation: configMap.revocation,
      template: configMap.template,
      signature: configMap.signature,
      nativeGuide: configMap.nativeGuide,
    },
  },
  '-1': {
    // 红旗邮件
    sort: ['redFlag', 'nativeGuide'],
    config: {
      redFlag: configMap.redFlag,
      nativeGuide: configMap.nativeGuide,
    },
  },
  '-100': {
    // 其他文件夹
    sort: ['moreAccount', 'toTop', 'customFolder', 'readStatus', 'revocation', 'redFlag', 'nativeGuide'],
    config: {
      moreAccount: configMap.moreAccount,
      toTop: configMap.toTop,
      customFolder: configMap.customFolder,
      readStatus: configMap.readStatus,
      revocation: configMap.revocation,
      redFlag: configMap.redFlag,
      nativeGuide: configMap.nativeGuide,
    },
  },
};
