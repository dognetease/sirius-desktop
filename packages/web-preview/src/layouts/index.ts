import { message } from 'antd';
import ContainerLayout from './container/index';

message.config({
  // top: 10,
  duration: 1.5,
  maxCount: 3,
  rtl: false,
  // prefixCls: 'my-message',
});
const SiriusLayout = {
  ContainerLayout,
};

export default SiriusLayout;
