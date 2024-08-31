import { enc } from 'crypto-js';

const hexToString = (hex: string) => {
  let res = '';
  for (let i = 0; i < hex.length; i += 2) {
    res += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
  }
  return res;
};

const s1 = '\u0042\u0032\u0032\u0033\u0032\u0045\u0036\u0045\u0033\u0041\u0061';
const s2 = 'Q0M1QkQyOTUzMTg=';
const s3 = '6641333037443631383263';
const s4 = ['7', 'd', '9', '8', '9', '8', 'd'];

const format = (str: string) => enc.Utf8.stringify(enc.Base64.parse(str));
const API_FETCH_SIGN_SECRET1 = [s4.reverse().join(''), hexToString(s3)].reverse().join('');

const API_FETCH_SIGN_SECRET2 = [format(s2), decodeURIComponent(s1)];

export const API_FETCH_SIGN_SECRET = [API_FETCH_SIGN_SECRET1, ...API_FETCH_SIGN_SECRET2].reverse().join('');
