import { getIn18Text } from 'api';
const language = getIn18Text(process.env.BUILD_ISEDM ? 'YINGYU' : 'ZHONGWEN-ZHONGWEN');
export const defaultValueMap = {
  develop: {
    type: '1',
    company: '',
    language,
    product: '',
    tone: null,
    mustContains: '',
    extraDesc: '',
    requiredList: ['extraDesc'],
    otherTone: '',
    wordCountLevel: 0,
  },

  product_desc: {
    type: '2',
    company: '',
    language,
    product: '',
    tone: null,
    mustContains: '',
    extraDesc: '',
    requiredList: ['extraDesc'],
    otherTone: '',
    wordCountLevel: 0,
  },
  holiday_wishes: {
    type: '3',
    company: '',
    language,
    product: '',
    tone: null,
    // 'mustContains': '3',
    extraDesc: '',
    requiredList: ['extraDesc'],
    otherTone: '',
    wordCountLevel: 0,
  },
  default: {
    type: '0', //类型，(1：开发信，2：产品介绍，3：节日祝福，0：其他)
    language, //语言
    tone: null, //语气
    // 'company': '', //公司名称
    // 'product': '', //产品名称
    // 'mustContains': '0', //必须包含的语句
    extraDesc: '', //额外描述
    requiredList: ['extraDesc'],
    otherTone: '',
    wordCountLevel: 0,
  },
  retouch: {
    type: '0', //类型，(1：开发信，2：产品介绍，3：节日祝福，0：其他)
    language, //语言
    tone: null, //语气
    // 'company': '', //公司名称
    // 'product': '', //产品名称
    // 'mustContains': '0', //必须包含的语句
    extraDesc: '', //额外描述
    otherTone: '',
    wordCountLevel: 0,
  },
  report: {
    type: '5',
    // company: '',
    language,
    // product: '',
    tone: null,
    reportType: '日报',
    date: '',
    // 'mustContains': '3',
    extraDesc: '',
    requiredList: ['extraDesc'],
    additional: '',
    otherTone: '',
    wordCountLevel: 0,
  },
  conference_invitatio: {
    type: '6',
    language,
    tone: null,
    meetingSubject: '',
    meetingPosition: '',
    time: '',
    // 'mustContains': '3',
    additional: '',
    requiredList: ['meetingSubject'],
    otherTone: '',
    wordCountLevel: 0,
  },
  attendance_application: {
    type: '7',
    language,
    tone: null,
    attendanceType: '年假',
    attendanceReason: '',
    time: '',
    // 'mustContains': '3',
    additional: '',
    requiredList: ['attendanceReason'],
    otherTone: '',
    wordCountLevel: 0,
  },
  notice: {
    type: '8',
    language,
    tone: null,
    announcementTitle: '',
    // 'mustContains': '3',
    extraDesc: '',
    requiredList: ['extraDesc'],
    additional: '',
    otherTone: '',
    wordCountLevel: 0,
  },
};

const staticTabs = [
  {
    value: 'product_desc',
    label: getIn18Text('CHANPINJIESHAO'),
    id: '2',
  },
  {
    value: 'holiday_wishes',
    label: getIn18Text('JIERIZHUFU'),
    id: '3',
  },
];

if (process.env.BUILD_ISEDM) {
  staticTabs.unshift({
    value: 'develop',
    label: getIn18Text('KAIFAXIN'),
    id: '1',
  });
} else {
  staticTabs.push(
    ...[
      {
        value: 'report',
        label: '汇报',
        id: '5',
      },
      {
        value: 'conference_invitatio',
        label: '会议邀请',
        id: '6',
      },
      {
        value: 'attendance_application',
        label: '考勤申请',
        id: '7',
      },
      {
        value: 'notice',
        label: '通知公告',
        id: '8',
      },
    ]
  );
}

staticTabs.push({
  value: 'default',
  label: getIn18Text('QITA'),
  id: '0',
});

export { staticTabs };

export const toneList = [
  {
    value: getIn18Text('YOUSHUOFULI'),
    label: getIn18Text('YOUSHUOFULI'),
  },
  {
    value: getIn18Text('ZHENGSHISHANGWU'),
    label: getIn18Text('ZHENGSHISHANGWU'),
  },
  {
    value: getIn18Text('ZUNJING'),
    label: getIn18Text('ZUNJING'),
  },
  {
    value: getIn18Text('ZIXIN'),
    label: getIn18Text('ZIXIN'),
  },
  {
    value: getIn18Text('LIMAO'),
    label: getIn18Text('LIMAO'),
  },
  {
    value: getIn18Text('WEIWAN'),
    label: getIn18Text('WEIWAN'),
  },
  {
    value: getIn18Text('QITA'),
    label: getIn18Text('QITA'),
  },
];

export const reportType = [
  {
    value: '日报',
    label: '日报',
  },
  {
    value: '周报',
    label: '周报',
  },
  {
    value: '月报',
    label: '月报',
  },
  {
    value: '其他',
    label: '其他',
  },
];

export const attendanceType = [
  {
    value: '年假',
    label: '年假',
  },
  {
    value: '病假',
    label: '病假',
  },
  {
    value: '事假',
    label: '事假',
  },
  {
    value: '调休',
    label: '调休',
  },
];

export const wordCountOptionsList = [
  {
    value: 0,
    label: getIn18Text('BUXIANZISHU'),
  },
  {
    value: 1,
    label: getIn18Text('100ZI（CI）'),
  },
  {
    value: 2,
    label: getIn18Text('300ZI（CI）Nei'),
  },
  {
    value: 3,
    label: getIn18Text('300ZI（CI）'),
  },
];

export const languageList = [
  {
    value: getIn18Text('ZHONGWEN - ZHONGWEN'),
    label: getIn18Text('ZHONGWEN - ZHONGWEN'),
  },
  {
    value: getIn18Text('English'),
    label: getIn18Text('English'),
  },
  {
    value: getIn18Text('FANTIZHONGWEN - '),
    label: getIn18Text('FANTIZHONGWEN - '),
  },
  {
    value: getIn18Text('RIBENYU - RI'),
    label: getIn18Text('RIBENYU - RI'),
  },
  {
    value: getIn18Text('Español'),
    label: getIn18Text('Español'),
  },
  {
    value: getIn18Text('Françai'),
    label: getIn18Text('Françai'),
  },
  {
    value: getIn18Text('Deutsch'),
    label: getIn18Text('Deutsch'),
  },
  {
    value: getIn18Text('Русский'),
    label: getIn18Text('Русский'),
  },
  {
    value: getIn18Text('Portugu'),
    label: getIn18Text('Portugu'),
  },
  {
    value: getIn18Text('Italian'),
    label: getIn18Text('Italian'),
  },
  {
    value: getIn18Text('한국어 - HAN'),
    label: getIn18Text('한국어 - HAN'),
  },
  {
    value: getIn18Text('Türkçe '),
    label: getIn18Text('Türkçe '),
  },
  {
    value: getIn18Text('ภาษาไทย'),
    label: getIn18Text('ภาษาไทย'),
  },
  {
    value: getIn18Text('Svenska'),
    label: getIn18Text('Svenska'),
  },
  {
    value: getIn18Text('Dansk -'),
    label: getIn18Text('Dansk -'),
  },
  {
    value: getIn18Text('Tiếng V'),
    label: getIn18Text('Tiếng V'),
  },
  {
    value: getIn18Text('Polski '),
    label: getIn18Text('Polski '),
  },
  {
    value: getIn18Text('Suomi -'),
    label: getIn18Text('Suomi -'),
  },
  {
    value: getIn18Text('Bahasa '),
    label: getIn18Text('Bahasa '),
  },
  {
    value: getIn18Text('Ελληνικ'),
    label: getIn18Text('Ελληνικ'),
  },
  {
    value: getIn18Text('Română '),
    label: getIn18Text('Română '),
  },
  {
    value: getIn18Text('Magyar '),
    label: getIn18Text('Magyar '),
  },
  {
    value: getIn18Text('Ceština'),
    label: getIn18Text('Ceština'),
  },
  {
    value: getIn18Text('Català '),
    label: getIn18Text('Català '),
  },
  {
    value: getIn18Text('Slovenc'),
    label: getIn18Text('Slovenc'),
  },
  {
    value: getIn18Text('Українс'),
    label: getIn18Text('Українс'),
  },
  {
    value: getIn18Text('Hrvatsk'),
    label: getIn18Text('Hrvatsk'),
  },
  {
    value: getIn18Text('Bahasa '),
    label: getIn18Text('Bahasa '),
  },
  {
    value: getIn18Text('العربية'),
    label: getIn18Text('العربية'),
  },
  {
    value: getIn18Text('Nederla'),
    label: getIn18Text('Nederla'),
  },
];

export const translateFromList = [
  {
    language: getIn18Text('ZHONGWEN-ZHONGWEN'),
    translateFrom: 'zh-CHS',
  },
  {
    language: getIn18Text('English'),
    translateFrom: 'en',
  },
  {
    language: getIn18Text('FANTIZHONGWEN-FANTI'),
    translateFrom: 'zh-CHT',
  },
  {
    language: getIn18Text('RIBENYU-RIYU'),
    translateFrom: 'ja',
  },
  {
    language: getIn18Text('Español'),
    translateFrom: 'es',
  },
  {
    language: getIn18Text('Françai'),
    translateFrom: 'fr',
  },
  {
    language: getIn18Text('Deutsch'),
    translateFrom: 'de',
  },
  {
    language: getIn18Text('Русский'),
    translateFrom: 'ru',
  },
  {
    language: getIn18Text('Portugu'),
    translateFrom: 'pt',
  },
  {
    language: getIn18Text('Italian'),
    translateFrom: 'it',
  },
  {
    language: getIn18Text('한국어-HANYU'),
    translateFrom: 'ko',
  },
  {
    language: getIn18Text('Türkçe-'),
    translateFrom: 'tr',
  },
  {
    language: getIn18Text('ภาษาไทย'),
    translateFrom: 'th',
  },
  {
    language: getIn18Text('Svenska'),
    translateFrom: 'sv',
  },
  {
    language: getIn18Text('Dansk-DAN'),
    translateFrom: 'da',
  },
  {
    language: getIn18Text('Tiếng V'),
    translateFrom: 'vi',
  },
  {
    language: getIn18Text('Polski-'),
    translateFrom: 'pl',
  },
  {
    language: getIn18Text('Suomi-FEN'),
    translateFrom: 'fi',
  },
  {
    language: getIn18Text('Bahasa '),
    translateFrom: 'id',
  },
  {
    language: getIn18Text('Ελληνικ'),
    translateFrom: 'el',
  },
  {
    language: getIn18Text('Română-'),
    translateFrom: 'ro',
  },
  {
    language: getIn18Text('Magyar-'),
    translateFrom: 'hu',
  },
  {
    language: getIn18Text('Ceština'),
    translateFrom: 'cs',
  },
  {
    language: getIn18Text('Català-'),
    translateFrom: 'ca',
  },
  {
    language: getIn18Text('Slovenc'),
    translateFrom: 'sk',
  },
  {
    language: getIn18Text('Українс'),
    translateFrom: 'uk',
  },
  {
    language: getIn18Text('Hrvatsk'),
    translateFrom: 'hr',
  },
  {
    language: getIn18Text('Bahasa '),
    translateFrom: 'ms',
  },
  {
    language: getIn18Text('العربية'),
    translateFrom: 'ar',
  },
  {
    language: getIn18Text('Nederla'),
    translateFrom: 'nl',
  },
];

export const getTranslateFrom = (language: string) => {
  try {
    let from = 'auto';
    translateFromList.forEach(fromItem => {
      const languageArr = fromItem.language.split('-');
      languageArr.push(`${languageArr[0]}（${languageArr[1]}）`);
      languageArr.push(`${languageArr[1]}（${languageArr[0]}）`);
      if (languageArr.indexOf(language) !== -1) {
        from = fromItem.translateFrom;
      }
    });
    return from;
  } catch (e) {
    return 'auto';
  }
};
