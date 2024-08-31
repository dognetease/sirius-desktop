import React from 'react';
import Icon from '@ant-design/icons/es/components/Icon';
import { IconBaseProps } from '@ant-design/icons/lib/components/Icon';
import MailBoxSvg from './svgs/MailBoxSvg';
import ContactSvg from './svgs/ContactSvg';
import CopySvg from './svgs/CopySvg';
import BackToTopSvg from './svgs/BackToTopSvg';
import BackToTopNewSvg from './svgs/BackToTopNewSvg';
import IMSvg from './svgs/IMSvg';
import CalenderSvg from './svgs/CalenderSvg';
import SendEmailSvg from './svgs/SendEmailSvg';
import WarnSvg from './svgs/WarnSvg';
import SuccessSvg from './svgs/SuccessSvg';
import AlertErrorSvg from './svgs/AlertErrorSvg';
import AlertCloseSvg from './svgs/AlertCloseSvg';
import DiskTab from './svgs/DiskTab';
import PlusSvg from './svgs/PlusSvg';
import AddCalendar from './svgs/AddCalendar';
import ImportCalendarSvg from './svgs/ImportCalendar';
import SubscribeCalendarSvg from './svgs/SubscribeCalendar';
import CloseCircleSvg from './svgs/CloseCircle';
import SpinSvg from './svgs/SpinSvg';
import MediaSvg, { MediaWhiteSvg } from './svgs/MediaSvg';
import SetCalendarSvg from './svgs/SetCalendar';
import ModalCloseSvg from './svgs/CloseModalSvg';
import ModalCloseSmallSvg from './svgs/ModalCloseSmall';
import EdmSvg from './svgs/EdmSvg';
import CustomerSvg from './svgs/CustomerSvg';
import WorktableSvg from './svgs/WorktableSvg';
import CustomsDataSvg from './svgs/CustomsDataSvg';
import SiteSvg from './svgs/SiteSvg';

export interface SiriusIconProps extends IconBaseProps {
  enhance?: boolean;
}

export type WrapperIcon = {
  (): JSX.Element;
  Enhance?(): JSX.Element;
};

const IconEnhenceHoc = (WrapperComponent: WrapperIcon) =>
  React.forwardRef((props: SiriusIconProps, ref: any) => {
    const { enhance, ...rest } = props;
    return <Icon ref={ref} component={enhance && WrapperComponent.Enhance ? WrapperComponent.Enhance : WrapperComponent} {...rest} />;
  });

export const MailBoxIcon = IconEnhenceHoc(MailBoxSvg);
export const DiskTabIcon = IconEnhenceHoc(DiskTab);
export const ContactIcon = IconEnhenceHoc(ContactSvg);
export const CopyIcon = IconEnhenceHoc(CopySvg);
export const BackToTopIcon = IconEnhenceHoc(BackToTopSvg);
export const BackToTopNewIcon = IconEnhenceHoc(BackToTopNewSvg);
export const CalenderIcon = IconEnhenceHoc(CalenderSvg);
export const IMIcon = IconEnhenceHoc(IMSvg);
export const SendEmailIcon = IconEnhenceHoc(SendEmailSvg);
export const WarnIcon = IconEnhenceHoc(WarnSvg);
export const SuccessIcon = IconEnhenceHoc(SuccessSvg);
export const AlertErrorIcon = IconEnhenceHoc(AlertErrorSvg);
export const AlertCloseIcon = IconEnhenceHoc(AlertCloseSvg);
export const PlusIcon = IconEnhenceHoc(PlusSvg);
export const AddCalendarIcon = IconEnhenceHoc(AddCalendar);
export const SetCalendarIcon = IconEnhenceHoc(SetCalendarSvg);
export const ImportCalendarIcon = IconEnhenceHoc(ImportCalendarSvg);
export const SubscribeCalendarIcon = IconEnhenceHoc(SubscribeCalendarSvg);
export const CloseCircleIcon = IconEnhenceHoc(CloseCircleSvg);
export const SpinIcon = IconEnhenceHoc(SpinSvg);
export const MediaIcon = IconEnhenceHoc(MediaSvg);
export const MediaWhiteIcon = IconEnhenceHoc(MediaWhiteSvg);
export const ModalClose = IconEnhenceHoc(ModalCloseSvg);
export const ModalCloseSmall = IconEnhenceHoc(ModalCloseSmallSvg);
export const EdmIcon = IconEnhenceHoc(EdmSvg);
export const CustomerIcon = IconEnhenceHoc(CustomerSvg);
export const WorktableIcon = IconEnhenceHoc(WorktableSvg);
export const CustomsDataIcon = IconEnhenceHoc(CustomsDataSvg);
export const SiteIcon = IconEnhenceHoc(SiteSvg);

const SiriusIcons = {
  MailBoxIcon,
  DiskTabIcon,
  ContactIcon,
  CopyIcon,
  BackToTopIcon,
  BackToTopNewIcon,
  IMIcon,
  CalenderIcon,
  SendEmailIcon,
  WarnIcon,
  AlertErrorIcon,
  AlertCloseIcon,
  PlusIcon,
  AddCalendarIcon,
  SetCalendarIcon,
  ImportCalendarIcon,
  SubscribeCalendarIcon,
  CloseCircleIcon,
  SpinIcon,
  MediaIcon,
  MediaWhiteIcon,
  ModalClose,
  ModalCloseSmall,
  EdmIcon,
  CustomerIcon,
  WorktableIcon,
  CustomsDataIcon,
  SiteIcon,
};

export default SiriusIcons;
