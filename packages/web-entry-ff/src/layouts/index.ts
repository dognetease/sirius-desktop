import { message } from 'antd';
import LoginLayout from './login';
import MainLayout2 from '@web/layouts/Main/mainLayout';
import MainLayout from './WmMain/wmMainLayout';
import ContainerLayout from './container/index';

message.config({
  // top: 10,
  duration: 1.5,
  maxCount: 3,
  rtl: false,
  // prefixCls: 'my-message',
});
const SiriusLayout = {
  LoginLayout,
  MainLayout,
  ContainerLayout,
};

export default SiriusLayout;
