import passCheck from './password';

describe('密码校验规则测试', () => {
  test('密码长度必须为8-16位', () => {
    expect(passCheck.isValidLength('12345678')).toBe(true);
    expect(passCheck.isValidLength('12345678876543210')).toBe(false);
    expect(passCheck.isValidLength('1234567')).toBe(false);
  });

  test('密码不能包含用户姓名全拼', () => {
    expect(passCheck.isIncludeUsername('hufan123', '胡凡')).toBe(true);
    expect(passCheck.isIncludeUsername(' zhangpei', '张培源')).toBe(true);
    expect(passCheck.isIncludeUsername('mingliang', '邹明亮')).toBe(true);
    expect(passCheck.isIncludeUsername('liangming ', '邹明亮')).toBe(false);
    expect(passCheck.isIncludeUsername('guochao42', ' 郭超')).toBe(true);
    expect(passCheck.isIncludeUsername('zzhangsanss05', '张三')).toBe(true);
  });

  test('密码不能包含账号', () => {
    expect(passCheck.isIncludeAccount('hufan123', 'hufan02')).toBe(true);
    expect(passCheck.isIncludeAccount('zhangpei', 'zhangpeiyuan01')).toBe(true);
    expect(passCheck.isIncludeAccount('mingliang', 'zoumingliang')).toBe(true);
    expect(passCheck.isIncludeAccount('liangming', 'zoumingliang03')).toBe(false);
    expect(passCheck.isIncludeAccount('zoumi', 'zoumingliang08')).toBe(true);
  });

  test('连续3位及以上数字不能连号（例如 123,321', () => {
    expect(passCheck.isStringConsecutive('89676', 'number')).toBe(false);
    expect(passCheck.isStringConsecutive('123569', 'number')).toBe(true);
    expect(passCheck.isStringConsecutive('98723', 'number')).toBe(true);
    expect(passCheck.isStringConsecutive('abc', 'number')).toBe(false);
    expect(passCheck.isStringConsecutive('cba', 'number')).toBe(false);
  });

  test('连续3位及以上字符不能连号（例如 abc、cba）', () => {
    expect(passCheck.isStringConsecutive('abcd', 'char')).toBe(true);
    expect(passCheck.isStringConsecutive('cbad', 'char')).toBe(true);
    expect(passCheck.isStringConsecutive('fwg', 'char')).toBe(false);
    expect(passCheck.isStringConsecutive('ababba', 'char')).toBe(false);
    expect(passCheck.isStringConsecutive('1234', 'char')).toBe(false);
  });

  test('密码不能包含连续三个以及以上的字符 例如（aaa,rrr）', () => {
    expect(passCheck.isMultiSameChar('rrrc')).toBe(true);
    expect(passCheck.isMultiSameChar('cbad')).toBe(false);
    expect(passCheck.isMultiSameChar('444dgw')).toBe(true);
    expect(passCheck.isMultiSameChar('ewwwg')).toBe(true);
    expect(passCheck.isMultiSameChar('ggwwzz')).toBe(false);
  });

  test('必须包含: 数字、大写字母、小写字母、特殊字符中的3种字符', () => {
    expect(passCheck.isContainSpecialChar('@1s')).toBe(true);
    expect(passCheck.isContainSpecialChar('_5A')).toBe(true);
    expect(passCheck.isContainSpecialChar('=sB')).toBe(true);
    expect(passCheck.isContainSpecialChar('5a@9B')).toBe(true);

    expect(passCheck.isContainSpecialChar('a123')).toBe(false);
    expect(passCheck.isContainSpecialChar('B123')).toBe(false);
    expect(passCheck.isContainSpecialChar('b@')).toBe(false);
    expect(passCheck.isContainSpecialChar('bB')).toBe(false);
    expect(passCheck.isContainSpecialChar('123_')).toBe(false);
  });
});
