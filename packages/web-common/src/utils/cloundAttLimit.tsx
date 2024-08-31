import { getIn18Text } from 'api';
// 单个文件云附件限制提示
export const overLimitLabel = {
  free: getIn18Text('DANGQIANWENJIANYI11'),
  ultimate: getIn18Text('DANGQIANWENJIANYI12'),
  sirius: getIn18Text('DANGQIANWENJIANYI'),
};
// 总文件上限提示
export const totalOverLimitLabel = {
  free: getIn18Text('MIANFEIBANYUNFU'),
  ultimate: getIn18Text('QIJIANBANYUNFU'),
  sirius: getIn18Text('ZUNXIANGBANYUNFU'),
};
