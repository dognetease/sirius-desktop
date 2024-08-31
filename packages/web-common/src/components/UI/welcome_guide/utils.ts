/**
 * 根据日期生成切换人数
 * @returns number
 */
export function _fGenerateSwitchNumber() {
  var a = [
    '2022/6/13',
    '2022/6/20',
    '2022/6/27',
    '2022/7/4',
    '2022/7/11',
    '2022/7/18',
    '2022/7/25',
    '2022/8/1',
    '2022/8/8',
    '2022/8/15',
    '2022/8/22',
    '2022/8/29',
    '2022/9/5',
    '2022/9/12',
    '2022/9/19',
    '2022/9/26',
    '2022/10/3',
    '2022/10/10',
    '2022/10/17',
    '2022/10/24',
    '2022/10/31',
    '2022/11/7',
    '2022/11/14',
    '2022/11/21',
    '2022/11/28',
    '2022/12/5',
    '2022/12/12',
    '2022/12/19',
    '2022/12/26',
    '2023/1/2',
  ];
  var b = [
    3500, 5000, 7061, 10568, 17688, 27546, 42520, 75040, 135285, 226321, 348677, 363933, 546198, 757448, 982003, 1259529, 1505526, 1815804, 2202068, 2671642, 3241528,
    3931800, 4765974, 5771358, 6979274, 8425107, 10148018, 12190103, 14594707, 17403414,
  ];
  var oDate = new Date();
  var X = oDate.setHours(0, 0, 0, 0);
  var x1: string | number = a[0],
    y1 = b[0],
    x2: string | number = a[1],
    y2 = b[1];
  for (var index = 0; index < a.length; index++) {
    var sDate = a[index];
    var sDate2 = a[index + 1] || sDate;
    var nTime1 = new Date(sDate).getTime();
    var nTime2 = new Date(sDate2).getTime();
    if (X >= nTime1 && X < nTime2) {
      x1 = a[index];
      x2 = a[index + 1] || x1;
      y1 = b[index];
      y2 = b[index + 1] || y1;
      break;
    }
  }
  if (x1 === x2) {
    return y1;
  }
  x1 = new Date(x1).getTime();
  x2 = new Date(x2).getTime();

  return Math.floor(((X - x1) / (x2 - x1)) * (y2 - y1) + y1);
}
