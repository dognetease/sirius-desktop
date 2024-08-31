import React from 'react';
import Icon from '@ant-design/icons/lib/components/Icon';
import { IconBaseProps } from '@ant-design/icons/lib/components/Icon';
import MailBoxSvg from './svgs/MailBoxSvg';
import ContactSvg from './svgs/ContactSvg';
import AppsSvg from './svgs/AppsSvg';
import CopySvg from './svgs/CopySvg';
import BackToTopSvg from './svgs/BackToTopSvg';
import BackToTopNewSvg from './svgs/BackToTopNewSvg';
import IMSvg from './svgs/IMSvg';
import CalenderSvg from './svgs/CalenderSvg';
import SendEmailSvg from './svgs/SendEmailSvg';
import SendEmailBigSvg from './svgs/SendEmailBigSvg';
import ContactDeleteSvg from './svgs/ContactDeleteSvg';
import PersonalGroupBigSvg from './svgs/PersonalGroupBigSvg';
import PersonalGroupSvg from './svgs/personalGroupSVG';
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
import ConferenceSvg from './svgs/ConferenceSvg';
import EdmSvg from './svgs/EdmSvg';
import CustomerSvg from './svgs/CustomerSvg';
import WorktableSvg from './svgs/WorktableSvg';
import CustomsDataSvg from './svgs/CustomsDataSvg';
import BigDataSvg from './svgs/BigDataSvg';
import IntelliMarketingSvg from './svgs/IntelliMarketingSvg';
import GlobalSearchSvg from './svgs/GlobalSearch';
import EnterpriseSvg from './svgs/EnterpriseSvgs';
import SnsSvg from './svgs/SnsSvg';
import BusinessSvg from './svgs/BusinessSvg';
import BusinessExecSvg from './svgs/BusinessExecSvg';
import BetaSvg from './svgs/BetaSvg';
import SiteSvg from './svgs/SiteSvg';
import SystemTaskSvg from './svgs/SystemTaskSvg';
import KnowledgeSvg from './svgs/Knowledge';
import { ReactComponent as AlertInfoSvg } from '@/images/icons/alert_info.svg';
import TradeAcquisitionSvg from '@web-common/components/UI/Icons/svgs/jump_out/TradeAcquisitiosSvg';
import MailMarketingSvg from '@web-common/components/UI/Icons/svgs/jump_out/MailMarketingSvg';
import WaimaoWebsiteSvg from '@web-common/components/UI/Icons/svgs/jump_out/WaimaoWebsiteSvg';
import MediaMarketingSvg from '@web-common/components/UI/Icons/svgs/jump_out/MediaMarketingSvg';
import CustomBigDataSvg from '@web-common/components/UI/Icons/svgs/jump_out/CustomBigDataSvg';
import WaTabSvg from './svgs/WaTabSvg';
import CoopSvg from './svgs/CoopSvg';

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

const IconEnhenceHocWithBeta = (WrapperComponent: WrapperIcon) =>
  React.forwardRef((props: SiriusIconProps, ref: any) => {
    const { enhance, ...rest } = props;
    return (
      <span>
        <Icon ref={ref} component={enhance && WrapperComponent.Enhance ? WrapperComponent.Enhance : WrapperComponent} {...rest} />
        {/* <BetaSvg ref={ref} component={enhance && WrapperComponent.Enhance ? WrapperComponent.Enhance : WrapperComponent} {...rest} /> */}
      </span>
    );
  });

const IconEnhenceHocWithFree = (WrapperComponent: WrapperIcon) =>
  React.forwardRef((props: SiriusIconProps, ref: any) => {
    const { enhance, ...rest } = props;
    return (
      <span>
        <Icon ref={ref} component={enhance && WrapperComponent.Enhance ? WrapperComponent.Enhance : WrapperComponent} {...rest} />
        <span ref={ref} className="sirius-icon sirius-icon-free" />
      </span>
    );
  });

const IconEnhenceHocWithCustomBeta = (WrapperComponent: WrapperIcon, className: string) =>
  React.forwardRef((props: SiriusIconProps, ref: any) => {
    const { enhance, ...rest } = props;
    return (
      <span>
        <Icon ref={ref} component={enhance && WrapperComponent.Enhance ? WrapperComponent.Enhance : WrapperComponent} {...rest} />
        <span className={`sirius-icon ${className}`} ref={ref} />
      </span>
    );
  });

export const JumpOutTradeAcquisitionIcon = IconEnhenceHoc(TradeAcquisitionSvg);
export const JumpOutMailMarketingIcon = IconEnhenceHoc(MailMarketingSvg);
export const JumpOutWaimaoWebsiteIcon = IconEnhenceHoc(WaimaoWebsiteSvg);
export const JumpOutMediaMarketingIcon = IconEnhenceHoc(MediaMarketingSvg);
export const JumpOutCustomBigDataIcon = IconEnhenceHoc(CustomBigDataSvg);

export const MailBoxIcon = IconEnhenceHoc(MailBoxSvg);
export const WaTabIcon = IconEnhenceHoc(WaTabSvg);
export const DiskTabIcon = IconEnhenceHoc(DiskTab);
export const BusinessIcon = IconEnhenceHoc(BusinessSvg);
export const BusinessExecIcon = IconEnhenceHoc(BusinessExecSvg);
export const ContactIcon = IconEnhenceHoc(ContactSvg);
export const AppsIcon = IconEnhenceHoc(AppsSvg);
export const CopyIcon = IconEnhenceHoc(CopySvg);
export const BackToTopIcon = IconEnhenceHoc(BackToTopSvg);
export const BackToTopNewIcon = IconEnhenceHoc(BackToTopNewSvg);
export const CalenderIcon = IconEnhenceHoc(CalenderSvg);
export const IMIcon = IconEnhenceHoc(IMSvg);
export const SendEmailIcon = IconEnhenceHoc(SendEmailSvg);
export const SendEmailBigIcon = IconEnhenceHoc(SendEmailBigSvg);
export const ContactDeleteIcon = IconEnhenceHoc(ContactDeleteSvg);
export const PersonalGroupBigIcon = IconEnhenceHoc(PersonalGroupBigSvg);
export const PersonalGroupIcon = IconEnhenceHoc(PersonalGroupSvg);
export const InfoIcon = IconEnhenceHoc(AlertInfoSvg);
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
export const ConferenceIcon = IconEnhenceHoc(ConferenceSvg);

export const EdmIcon = IconEnhenceHoc(EdmSvg);
export const CustomerIcon = IconEnhenceHoc(CustomerSvg);
export const WorktableIcon = IconEnhenceHoc(WorktableSvg);
export const CustomsDataIcon = IconEnhenceHoc(CustomsDataSvg);
export const BigDataIcon = IconEnhenceHoc(BigDataSvg);
export const IntelliMarketingIcon = IconEnhenceHoc(IntelliMarketingSvg);
export const GlobalSearchIcon = IconEnhenceHoc(GlobalSearchSvg);
export const EnterpriseIcon = IconEnhenceHoc(EnterpriseSvg);
export const SnsIcon = IconEnhenceHoc(SnsSvg);
export const SiteIcon = IconEnhenceHoc(SiteSvg);
export const SystemTaskIcon = IconEnhenceHoc(SystemTaskSvg);
export const KnowledgeIcon = IconEnhenceHocWithCustomBeta(KnowledgeSvg, 'sirius-icon-knowledge-beta');
export const CoopIcon = IconEnhenceHoc(CoopSvg);

const SiriusIcons = {
  MailBoxIcon,
  JumpOutTradeAcquisitionIcon,
  JumpOutMailMarketingIcon,
  JumpOutWaimaoWebsiteIcon,
  JumpOutMediaMarketingIcon,
  JumpOutCustomBigDataIcon,
  DiskTabIcon,
  BusinessIcon,
  ContactIcon,
  AppsIcon,
  CopyIcon,
  BackToTopIcon,
  BackToTopNewIcon,
  IMIcon,
  CalenderIcon,
  SendEmailIcon,
  SendEmailBigIcon,
  ContactDeleteIcon,
  PersonalGroupBigIcon,
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
  ConferenceIcon,
  EdmIcon,
  CustomerIcon,
  WorktableIcon,
  CustomsDataIcon,
  GlobalSearchIcon,
  EnterpriseIcon,
  SiteIcon,
  CoopIcon,
};

export default SiriusIcons;
