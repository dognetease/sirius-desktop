import { getIn18Text } from 'api';
interface ErrorMessage {
  [key: string]: string;
}
const textErrMsg = new Map<number, string>();
const htmlErrmsg = new Map<number, string | ErrorMessage>();
const notSupport = [102, 104, 105, 106, 107, 109, 110, 116, 202, 205];
const textLong = [103];
const retry = [101, 108, 201, 203, 206, 111, 401];
const noContext = [113];
const visitRepeat = [411];
const longRepeat = [412];
const others = [304, 402, 112, 207, 301, 302, 303];
notSupport.forEach(n => {
  textErrMsg.set(n, getIn18Text('BUZHICHIGAILEI11'));
});
textLong.forEach(n => {
  textErrMsg.set(n, getIn18Text('FANYISHIBAI\uFF0C11'));
});
retry.forEach(n => {
  textErrMsg.set(n, getIn18Text('FANYISHIBAI\uFF0C'));
});
noContext.forEach(n => {
  textErrMsg.set(n, getIn18Text('FANYINEIRONGBU'));
});
visitRepeat.forEach(n => {
  textErrMsg.set(n, getIn18Text('FANGWENPINLVGUO'));
});
longRepeat.forEach(n => {
  textErrMsg.set(n, getIn18Text('CHANGQINGQIUGUOYU'));
});
others.forEach(n => {
  textErrMsg.set(n, getIn18Text('FANYISHIBAI\uFF0C'));
});
htmlErrmsg.set(101, getIn18Text('FANYINEIRONGBU'));
htmlErrmsg.set(301, getIn18Text('FANYISHIBAI\uFF0C'));
htmlErrmsg.set(405, getIn18Text('FANYISHIBAI\uFF0C'));
htmlErrmsg.set(411, getIn18Text('FANGWENPINLVGUO'));
htmlErrmsg.set(500, {
  '11': getIn18Text('BUZHICHIGAILEI11'),
  '12': getIn18Text('FANYISHIBAI\uFF0C11'),
  '14': getIn18Text('BUZHICHIDEFAN'),
  '30': getIn18Text('FANYISHIBAI\uFF0C'),
});
const translateLangMap: {
  [params: string]: string;
} = {
  'zh-CHS': getIn18Text('ZHONGWEN'),
  en: getIn18Text('YINGWEN'),
  ja: getIn18Text('RIWEN'),
  ko: getIn18Text('HANWEN'),
  // fr: '法文',
  // es: '西班牙文',
  // pt: '葡萄牙文',
  // ru: '俄文',
  // vi: '越南文',
  // de: '德文',
  // ar: '阿拉伯文',
  // id: '印尼文',
  // it: '意大利文'
};
export { textErrMsg, translateLangMap, htmlErrmsg, ErrorMessage };
