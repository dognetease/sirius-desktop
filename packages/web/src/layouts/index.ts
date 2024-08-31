import { message } from 'antd';
import LoginLayout from './login';
import MainLayout from '@/layouts/Main/mainLayout';
import ContainerLayout from './container/index';
import NewMainLayout from '@/layouts/Main/NewMainLayout';
import WebMainLayout from '@/layouts/Main/webMainLayout';

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
  WebMainLayout,
  ContainerLayout,
  NewMainLayout,
};

export default SiriusLayout;
