import React from 'react';
import { ReactComponent as EditIcon } from '@/images/icons/edit.svg';
import { ReactComponent as EditIconDarkSvg } from '@/images/icons/edit_dark.svg';
import { ReactComponent as MailEditIcon } from '@/images/icons/mail/edit.svg';
import { ReactComponent as SearchIcon } from '@/images/icons/new_search.svg';
import { ReactComponent as RefreshIcon } from '@/images/icons/mail_refresh.svg';
import { ReactComponent as ReceiveFolderIcon, ReactComponent as UnreadIcon } from '@/images/icons/mail/receive_folder.svg';
import { ReactComponent as NewReceiveFolderIcon } from '@/images/icons/newreceive_folder.svg';
import { ReactComponent as SendFolderIcon } from '@/images/icons/mail/send_folder.svg';
import { ReactComponent as FlagFolderIcon } from '@/images/icons/mail/flag_folder.svg';
import { ReactComponent as DraftFolderIcon } from '@/images/icons/mail/draft_folder.svg';
import { ReactComponent as UnverifyFolderIcon } from '@/images/icons/mail/unverify_folder.svg';
import { ReactComponent as VerifyFolderIcon } from '@/images/icons/mail/verify_folder.svg';
import { ReactComponent as JunkFolderIcon } from '@/images/icons/mail/junk_folder.svg';
import { ReactComponent as AdFolderIcon } from '@/images/icons/mail/ad_folder.svg';
import { ReactComponent as RecoverFolderIcon } from '@/images/icons/mail/recover_folder.svg';
import { ReactComponent as FolderIcon } from '@/images/icons/mail/floder.svg';
import { ReactComponent as FlagIcon, ReactComponent as BottomFlagIcon } from '@/images/icons/mail/flag.svg';
import { ReactComponent as PreferredSetIcon } from '@/images/icons/mail/preferred_set.svg';
import { ReactComponent as RedFlagIcon } from '@/images/icons/mail/red_flag.svg';
import { ReactComponent as WhiteFlagIcon } from '@/images/icons/white_flag.svg';
import { ReactComponent as TransmitIcon } from '@/images/icons/mail/transmit.svg';
import { ReactComponent as MoreIcon } from '@/images/icons/mail/more.svg';
import { ReactComponent as RecycleIcon } from '@/images/icons/mail/recycle.svg';
import { ReactComponent as ReplyIcon } from '@/images/icons/mail/reply.svg';
import { ReactComponent as ReplyAllIcon } from '@/images/icons/mail/reply_all.svg';
import { ReactComponent as DeleteAllIcon } from '@/images/icons/mail/bottom-delete-all.svg';
import { ReactComponent as DeleteIcon } from '@/images/icons/bottom-delete.svg';
import { ReactComponent as DeleteCheckedIcon } from '@/images/icons/bottom-delete-hover.svg';
import { ReactComponent as FlagAllIcon } from '@/images/icons/bottom-flag-all.svg';
import { ReactComponent as ReadIcon } from '@/images/icons/mail/bottom-read.svg';
import { ReactComponent as MoveIcon } from '@/images/icons/mail/bottom-move.svg';
import { ReactComponent as UserIcon } from '@/images/icons/list-group.svg';
import { ReactComponent as FailIcon } from '@/images/icons/alert-fail.svg';
import { ReactComponent as SucIcon } from '@/images/icons/alert-suc.svg';
// import { ReactComponent as AttachIcon } from '@/images/icons/attach.svg';
import { ReactComponent as AttachIconLarge } from '@/images/icons/attach-large.svg';
import { ReactComponent as AttachOrangeIcon } from '@/images/icons/attach-orange.svg';
import { ReactComponent as LockIcon } from '@/images/icons/Lock.svg';
import { ReactComponent as AlertIcon } from '@/images/icons/list_alert.svg';
import { ReactComponent as CloseIcon } from '@/images/icons/list_close.svg';
import { ReactComponent as ModalCloseIcon } from '@/images/icons/modal_close.svg';
import { ReactComponent as TriangleIcon } from '@/images/icons/triangle.svg';
import { ReactComponent as OktextIcon } from '@/images/icons/ok_text.svg';
import { ReactComponent as GoodTextIcon } from '@/images/icons/good_text.svg';
import { ReactComponent as HandsTextIcon } from '@/images/icons/hands_text.svg';
import { ReactComponent as XialaIcon } from '@/images/icons/xiala.svg';
import { ReactComponent as EditorIcon } from '@/images/icons/editor.svg';
import { ReactComponent as SendBtnIcon } from '@/images/icons/send_btn.svg';
import { ReactComponent as ReplyMutiSvgIcon } from '@/images/icons/reply_muti.svg';
import { ReactComponent as WithdrawIcon } from '@/images/icons/with-draw.svg';
import { ReactComponent as WithdrawCheckedIcon } from '@/images/icons/with-draw-hover.svg';
import { ReactComponent as WarnIcon } from '@/images/icons/warn.svg';
import { ReactComponent as SimpCloseIcon } from '@/images/icons/close_simp.svg';
import { ReactComponent as ReplyWhiteIcon } from '@/images/icons/reply_white.svg';
import { ReactComponent as ReplyAllWhiteIcon } from '@/images/icons/reply_all_white.svg';
import { ReactComponent as AttachPinIcon } from '@/images/icons/mail/attachment-pin.svg';
import { ReactComponent as TagIcon } from '@/images/icons/mail/tag.svg';
import { ReactComponent as RelatedMailIcon } from '@/images/icons/mail/related-mail.svg';
import { ReactComponent as TabDelete } from '@/images/icons/disk/tab_delete.svg';
import { ReactComponent as ReplyCircle } from '@/images/icons/reply_circle.svg';
import { ReactComponent as ReplyCircleActive } from '@/images/icons/reply_circle_active.svg';
import { ReactComponent as ReplyFull } from '@/images/icons/reply_full.svg';
import { ReactComponent as ReplyFullActive } from '@/images/icons/reply_full_active.svg';
import { ReactComponent as Alarm } from '@/images/icons/alarm.svg';
import { ReactComponent as System } from '@/images/icons/system.svg';
import { ReactComponent as Forwarded } from '@/images/icons/forwarded.svg';
import { ReactComponent as ReplayedForwarded } from '@/images/icons/replayed-forwarded.svg';
import { ReactComponent as Pop } from '@/images/icons/pop.svg';
import { ReactComponent as RcptSucc } from '@/images/icons/rcpt-succ.svg';
import { ReactComponent as RcptFail } from '@/images/icons/rcpt-fail.svg';
import { ReactComponent as PartialRcptSucc } from '@/images/icons/partial-rcpt-succ.svg';
import { ReactComponent as WithdrawSucc } from '@/images/icons/withdraw-succ.svg';
import { ReactComponent as WithdrawFail } from '@/images/icons/withdraw-fail.svg';
import { ReactComponent as PartialWithdrawSucc } from '@/images/icons/partial-withdraw-succ.svg';
import { ReactComponent as MailTop } from '@/images/icons/mail/mail_top.svg';
import { ReactComponent as MailUnTop } from '@/images/icons/mail/mail_untop.svg';
import { ReactComponent as Preferred } from '@/images/icons/mail/preferred.svg';
import { ReactComponent as PreferredActive } from '@/images/icons/mail/preferred-active.svg';
import { ReactComponent as TaskFolder } from '@/images/icons/mail/task_folder.svg';
import { ReactComponent as UnreadFolder } from '@/images/icons/mail/unRead_folder.svg';
import { ReactComponent as StartFolder } from '@/images/icons/mail/start_folder.svg';
import { ReactComponent as StartGroup } from '@/images/icons/mail/start_group.svg';
import { ReactComponent as AddFolder } from '@/images/icons/mail/add_folder.svg';
import { ReactComponent as TaskMail } from '@/images/icons/mail/task_mail.svg';

export const ReplyCircleSvg = () => <ReplyCircle />;
export const ReplyCircleActiveSvg = () => <ReplyCircleActive />;
export const ReplyFullSvg = () => <ReplyFull />;
export const ReplyFullActiveSvg = () => <ReplyFullActive />;
export const AlarmSvg = () => <Alarm />;
export const SystemSvg = () => <System />;
export const ForwardedSvg = () => <Forwarded />;
export const ReplayedForwardedSvg = () => <ReplayedForwarded />;
export const PopSvg = () => <Pop />;
export const RcptSuccSvg = () => <RcptSucc />;
export const RcptFailSvg = () => <RcptFail />;
export const PartialRcptSuccSvg = () => <PartialRcptSucc />;
export const WithdrawSuccSvg = () => <WithdrawSucc />;
export const WithdrawFailSvg = () => <WithdrawFail />;
export const PartialWithdrawSuccSvg = () => <PartialWithdrawSucc />;
export const TabDeleteSvg = () => <TabDelete />;
export const EditSvg = () => <EditIcon />;
export const MailEditSvg = () => <MailEditIcon />;
export const RefreshSvg = () => <RefreshIcon />;
export const ReceiveFolderSvg = () => <ReceiveFolderIcon />;
export const NewReceiveFolderSvg = () => <NewReceiveFolderIcon />;
export const SendFolderSvg = () => <SendFolderIcon />;
export const FlagFolderSvg = () => <FlagFolderIcon />;
export const DraftFolderSvg = () => <DraftFolderIcon />;
export const UnverifyFolderSvg = () => <UnverifyFolderIcon />;
export const VerifyFolderSvg = () => <VerifyFolderIcon />;
export const JunkFolderSvg = () => <JunkFolderIcon />;
export const AdFolderSvg = () => <AdFolderIcon />;
export const RecoverFolderSvg = () => <RecoverFolderIcon />;
export const FolderSvg = () => <FolderIcon />;
export const FlagSvg = () => <FlagIcon />;
export const PreferredSetSvg = () => <PreferredSetIcon />;
export const RedFlagSvg = () => <RedFlagIcon />;
export const WhiteFlagSvg = () => <WhiteFlagIcon />;
export const ReplySvg = () => <ReplyIcon />;
export const TransmitSvg = () => <TransmitIcon />;
export const MoreSvg = () => <MoreIcon />;
export const RecycleSvg = () => <RecycleIcon />;
// export const AttachSvg = () => <AttachIcon />;
export const AttachSvgLarge = () => <AttachIconLarge />;
export const AttachOrangeSvg = () => <AttachOrangeIcon />;
export const LockSvg = () => <LockIcon />;
export const AlertSvg = () => <AlertIcon />;
export const CloseSvg = () => <CloseIcon />;
export const ModalCloseSvg = () => <ModalCloseIcon />;
export const ReplyAllSvg = () => <ReplyAllIcon />;
export const DeleteAllSvg = () => <DeleteAllIcon />;
export const DeleteSvg = () => <DeleteIcon />;
export const DeleteCheckedSvg = () => <DeleteCheckedIcon />;
export const FlagAllSvg = () => <FlagAllIcon />;
export const BottomFlagSvg = () => <BottomFlagIcon />;
export const ReadSvg = () => <ReadIcon />;
export const UnreadSvg = () => <UnreadIcon />;
export const MoveSvg = () => <MoveIcon />;
export const UserSvg = () => <UserIcon />;
export const FailSvg = () => <FailIcon />;
export const SucSvg = () => <SucIcon />;
export const TriangleSvg = () => <TriangleIcon />;
export const OktextSvg = () => <OktextIcon />;
export const GoodTextSvg = () => <GoodTextIcon />;
export const HandsTextSvg = () => <HandsTextIcon />;
export const XialaSvg = () => <XialaIcon />;
export const EditorSvg = () => <EditorIcon />;
export const SendBtnSvg = () => <SendBtnIcon />;
export const ReplyMutiSvg = () => <ReplyMutiSvgIcon />;
export const WithdrawSvg = () => <WithdrawIcon />;
export const WithdrawCheckedSvg = () => <WithdrawCheckedIcon />;
export const WarnSvg = () => <WarnIcon />;
export const SimpCloseSvg = () => <SimpCloseIcon />;
export const SearchSvg = () => <SearchIcon />;
export const ReplyWhiteSvg = () => <ReplyWhiteIcon />;
export const ReplyAllWhiteSvg = () => <ReplyAllWhiteIcon />;
export const MailTopSvg = () => <MailTop />;
export const MailUnTopSvg = () => <MailUnTop />;
export const PreferredSvg = () => <Preferred />;
export const PreferredActiveSvg = () => <PreferredActive />;

export const TagSvg = () => <TagIcon />;
export const AttachPinSvg = () => <AttachPinIcon />;
export const RelatedMailIconSvg = () => <RelatedMailIcon />;
export const TaskFolderSvg = () => <TaskFolder />;
export const UnreadFolderSvg = () => <UnreadFolder />;
export const StartFolderSvg = () => <StartFolder />;
export const StartGroupSvg = () => <StartGroup />;
export const TaskMailSvg = () => <TaskMail />;
export const AddFolderSvg = () => <AddFolder />;
export const MailRefreshIcon = RefreshIcon;
export const MailModalCloseIcon = ModalCloseIcon;

// 邮件多选面板需要一整套相似但颜色不同的图标,将固定的svg改为可配置
export const FlagSvg_Cof = props => {
  const { color = 'rgba(60, 63, 71, 1)' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.2237 2.52071L11.0948 1.93472L11.2237 2.52071ZM11.2003 9.07508L11.1239 8.47996L11.2003 9.07508ZM2.79873 2.31477L2.94787 2.89594L2.79873 2.31477ZM13.3742 2.04767L13.2453 1.46167L13.3742 2.04767ZM12.9 8.64892V2.14878H14.1V8.64892H12.9ZM2.41117 8.18661L4.04661 7.94179L4.22426 9.12857L2.58883 9.37339L2.41117 8.18661ZM11.1239 8.47996L13.2936 8.20156L13.4463 9.3918L11.2767 9.6702L11.1239 8.47996ZM4.25271 2.56108L2.94787 2.89594L2.64959 1.7336L3.95443 1.39875L4.25271 2.56108ZM13.5031 2.63366L11.3526 3.1067L11.0948 1.93472L13.2453 1.46167L13.5031 2.63366ZM3.1 2.69984V8.78H1.9V2.69984H3.1ZM3.1 8.78V14.5H1.9V8.78H3.1ZM11.3526 3.1067C10.0771 3.38726 8.74645 3.27427 7.53652 2.78265L7.98824 1.67092C8.97321 2.07113 10.0564 2.16312 11.0948 1.93472L11.3526 3.1067ZM3.95443 1.39875C5.29348 1.05512 6.70749 1.15052 7.98824 1.67092L7.53652 2.78265C6.4939 2.35901 5.34279 2.28134 4.25271 2.56108L3.95443 1.39875ZM7.92641 8.21832C8.96218 8.52842 10.0515 8.61756 11.1239 8.47996L11.2767 9.6702C10.0376 9.82919 8.77896 9.7262 7.58223 9.3679L7.92641 8.21832ZM4.04661 7.94179C5.34447 7.74751 6.66922 7.84193 7.92641 8.21832L7.58223 9.3679C6.49413 9.04213 5.34757 8.96041 4.22426 9.12857L4.04661 7.94179ZM2.94787 2.89594C3.0374 2.87296 3.1 2.79227 3.1 2.69984H1.9C1.9 2.24441 2.20845 1.84681 2.64959 1.7336L2.94787 2.89594ZM12.9 2.14878C12.9 2.46596 13.1934 2.70179 13.5031 2.63366L13.2453 1.46167C13.6843 1.36512 14.1 1.69932 14.1 2.14878H12.9ZM14.1 8.64892C14.1 9.02571 13.8201 9.34385 13.4463 9.3918L13.2936 8.20156C13.0686 8.23044 12.9 8.42202 12.9 8.64892H14.1Z"
        fill={color}
      />
    </svg>
  );
};
export const ReadSvg_Cof = props => {
  const { color = 'rgba(60, 63, 71, 1)' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.5 5.51187C1.5 5.19983 1.68143 4.91626 1.96475 4.7855L7.66475 2.15473C7.87747 2.05655 8.12253 2.05655 8.33525 2.15473L14.0352 4.7855C14.3186 4.91626 14.5 5.19983 14.5 5.51187V13.2C14.5 13.6418 14.1418 14 13.7 14H2.3C1.85817 14 1.5 13.6418 1.5 13.2V5.51187Z"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M2 5L7.64223 7.82111C7.86745 7.93373 8.13255 7.93373 8.35777 7.82111L14 5" stroke={color} strokeWidth="1.2" />
    </svg>
  );
};

export const UnreadSvg_Cof = props => {
  const { color = 'rgba(60, 63, 71, 1)' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.5 3.3C1.5 2.85817 1.85817 2.5 2.3 2.5H13.7C14.1418 2.5 14.5 2.85817 14.5 3.3V12.7C14.5 13.1418 14.1418 13.5 13.7 13.5H2.3C1.85817 13.5 1.5 13.1418 1.5 12.7V3.3Z"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M2 3L7.55624 6.70416C7.82496 6.88331 8.17504 6.88331 8.44376 6.70416L14 3" stroke={color} strokeWidth="1.2" />
    </svg>
  );
};

export const MoveSvg_Cof = props => {
  const { color = 'rgba(60, 63, 71, 1)' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.5 13.5L13.7 13.5C14.1418 13.5 14.5 13.1418 14.5 12.7V5.0223C14.5 4.58047 14.1418 4.2223 13.7 4.2223L8.40579 4.22231C8.14557 4.22231 7.89559 4.12087 7.70896 3.93954L6.51832 2.78277C6.33168 2.60144 6.08171 2.5 5.82148 2.5H2.8C2.35817 2.5 2 2.85817 2 3.3V6"
        stroke={color}
        strokeWidth="1.2"
      />
      <path d="M1.5 9.44726L9.18182 9.44726L6.81818 7.13147" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
};

export const RecoverFolderSvg_Cof = props => {
  const { color = 'rgba(60, 63, 71, 1)' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 2H11" stroke={color} strokeWidth="1.2" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15 5.09996H13.1V13.2C13.1 13.9732 12.4732 14.6 11.7 14.6H4.3C3.5268 14.6 2.9 13.9732 2.9 13.2V5.09996H1V3.89996H15V5.09996ZM4.1 5.09996H11.9V13.2C11.9 13.3105 11.8105 13.4 11.7 13.4H4.3C4.18954 13.4 4.1 13.3105 4.1 13.2V5.09996ZM7.4 7V11H8.6V7H7.4Z"
        fill={color}
      />
    </svg>
  );
};

export const DeleteAllSvg_Cof = props => {
  const { color = 'rgba(60, 63, 71, 1)' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 2H11" stroke={color} strokeWidth="1.2" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.1 5.09999H15V3.89999H1V5.09999H2.9V13.2C2.9 13.9732 3.5268 14.6 4.3 14.6H11.7C12.4732 14.6 13.1 13.9732 13.1 13.2V5.09999ZM11.9 5.09999H4.1V13.2C4.1 13.3105 4.18954 13.4 4.3 13.4H11.7C11.8105 13.4 11.9 13.3105 11.9 13.2V5.09999ZM7.15147 9.00003L5.57574 7.42429L6.42426 6.57577L8 8.1515L9.57574 6.57577L10.4243 7.42429L8.84853 9.00003L10.4243 10.5758L9.57574 11.4243L8 9.84856L6.42426 11.4243L5.57574 10.5758L7.15147 9.00003Z"
        fill={color}
      />
    </svg>
  );
};

export const TagSvg_Cof = props => {
  const { color = 'rgba(60, 63, 71, 1)' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13 12.727C13 13.3165 12.3842 13.7036 11.853 13.4479L8.34698 11.7602C8.1277 11.6547 7.8723 11.6547 7.65302 11.7602L4.14699 13.4479C3.61585 13.7036 3 13.3165 3 12.7271L3 2.8C3 2.35817 3.35817 2 3.8 2L12.2 2C12.6418 2 13 2.35817 13 2.8L13 12.727Z"
        stroke={color}
        strokeWidth="1.2"
      />
    </svg>
  );
};

export const ReplySvgCof = props => {
  const { color = 'rgba(60, 63, 71, 1)' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 2.5L1.5 8L8 13.5V10.2C9.77273 10.2 12.7273 10.75 14.5 12.4C14.5 6.90002 9.18182 5.80002 8 5.80002V2.5Z"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ReplyAllSvgCof = props => {
  const { color = 'rgba(60, 63, 71, 1)' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.0835 3L4.2085 8L9.0835 13V10.2222C10.7085 10.2222 12.8752 10.7778 14.5002 12.4444C14.5002 7.44444 10.1668 5.77779 9.0835 5.77779V3Z"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5.83333 3.55554L1.5 7.99999L5.83333 12.4444" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const MoreSvg_Cof = props => {
  const { color = 'rgba(60, 63, 71, 1)' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 8C5 8.55228 4.55228 9 4 9C3.44772 9 3 8.55228 3 8C3 7.44772 3.44772 7 4 7C4.55228 7 5 7.44772 5 8ZM9 8C9 8.55228 8.55228 9 8 9C7.44772 9 7 8.55228 7 8C7 7.44772 7.44772 7 8 7C8.55228 7 9 7.44772 9 8ZM12 9C12.5523 9 13 8.55228 13 8C13 7.44772 12.5523 7 12 7C11.4477 7 11 7.44772 11 8C11 8.55228 11.4477 9 12 9Z"
        fill={color}
      />
    </svg>
  );
};

export const MailEditSvg_Cof = props => {
  const { color = 'rgba(60, 63, 71, 1)' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 14H14" stroke="#7D8085" strokeWidth="1.2" />
      <path
        d="M10.2542 1.66545C10.4106 1.51062 10.6627 1.51127 10.8184 1.66691L13.0732 3.92175C13.2325 4.08107 13.2289 4.34049 13.0652 4.49527L6.14372 11.0385C5.89315 11.2753 5.56398 11.4114 5.21929 11.4206L3.12129 11.4766L3.12129 9.30929C3.12129 8.93548 3.27077 8.5772 3.53645 8.31425L10.2542 1.66545Z"
        stroke={color}
        strokeWidth="1.2"
      />
    </svg>
  );
};

export const TransmitSvg_Cof = props => {
  const { color = 'rgba(60, 63, 71, 1)' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.5 5V4.4C1.16863 4.4 0.9 4.66863 0.9 5H1.5ZM1.5 11H0.9C0.9 11.3314 1.16863 11.6 1.5 11.6L1.5 11ZM8 11H8.6C8.6 10.6686 8.33137 10.4 8 10.4V11ZM8 14H7.4C7.4 14.2383 7.54105 14.454 7.75936 14.5496C7.97767 14.6452 8.23185 14.6025 8.40697 14.4409L8 14ZM14.5 8L14.907 8.44088C15.03 8.3273 15.1 8.16746 15.1 8C15.1 7.83254 15.03 7.6727 14.907 7.55912L14.5 8ZM8 2L8.40697 1.55912C8.23185 1.39747 7.97767 1.35479 7.75936 1.45037C7.54105 1.54596 7.4 1.76168 7.4 2H8ZM8 5V5.6C8.33137 5.6 8.6 5.33137 8.6 5H8ZM0.9 5V11H2.1V5H0.9ZM1.5 11.6H8V10.4H1.5V11.6ZM7.4 11V14H8.6V11H7.4ZM8.40697 14.4409L14.907 8.44088L14.093 7.55912L7.59303 13.5591L8.40697 14.4409ZM14.907 7.55912L8.40697 1.55912L7.59303 2.44088L14.093 8.44088L14.907 7.55912ZM7.4 2V5H8.6V2H7.4ZM8 4.4H1.5V5.6H8V4.4Z"
        fill={color}
      />
    </svg>
  );
};

export const RecycleSvg_Cof = props => {
  const { color = 'rgba(60, 63, 71, 1)' } = props;
  return (
    // <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    //   <path d="M5 2H11" stroke={color} strokeWidth="1.2" />
    //   <path
    //     fillRule="evenodd"
    //     clipRule="evenodd"
    //     d="M15 5.09996H13.1V13.2C13.1 13.9732 12.4732 14.6 11.7 14.6H4.3C3.5268 14.6 2.9 13.9732 2.9 13.2V5.09996H1V3.89996H15V5.09996ZM4.1 5.09996H11.9V13.2C11.9 13.3105 11.8105 13.4 11.7 13.4H4.3C4.18954 13.4 4.1 13.3105 4.1 13.2V5.09996ZM7.4 7V11H8.6V7H7.4Z"
    //     fill={color}
    //   />
    // </svg>
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.75 6.25V16.7C3.75 17.1418 4.10817 17.5 4.55 17.5H15.45C15.8918 17.5 16.25 17.1418 16.25 16.7V6.25"
        stroke={color}
        stroke-opacity="0.9"
        stroke-width="1.5"
      />
      <path d="M10 7.5V13.75" stroke={color} stroke-opacity="0.9" stroke-width="1.5" />
      <path d="M1.25 4.375L18.75 4.375" stroke={color} stroke-opacity="0.9" stroke-width="1.5" />
      <path
        d="M6.25 4.375L6.82766 2.06437C6.85548 1.95307 6.95548 1.875 7.07019 1.875H12.9298C13.0445 1.875 13.1445 1.95307 13.1723 2.06437L13.75 4.375"
        stroke={color}
        stroke-width="1.5"
      />
    </svg>
  );
};

export const ExportSvg_Cof = props => {
  const { color = 'rgba(60, 63, 71, 1)' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 5V2.8C2 2.35817 2.35817 2 2.8 2H13.2C13.6418 2 14 2.35817 14 2.8V13.2C14 13.6418 13.6418 14 13.2 14H2.8C2.35817 14 2 13.6418 2 13.2V11"
        stroke={color}
        stroke-width="1.2"
      />
      <path
        d="M10 8L10.4243 8.42426C10.6586 8.18995 10.6586 7.81005 10.4243 7.57574L10 8ZM2 8.6H9.42857V7.4H2V8.6ZM6.57574 5.42426L9.57574 8.42426L10.4243 7.57574L7.42426 4.57574L6.57574 5.42426ZM9.57574 7.57574L6.57574 10.5757L7.42426 11.4243L10.4243 8.42426L9.57574 7.57574Z"
        fill={color}
      />
    </svg>
  );
};

export const ReplyMutiSvg_Cof = props => {
  const { color = '#386EE7' } = props;
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14ZM7.39961 2.99962C7.39961 2.84267 7.30782 2.70022 7.1649 2.63536C7.02197 2.57051 6.85433 2.59523 6.73621 2.69859L2.73621 6.19859C2.6494 6.27454 2.59961 6.38427 2.59961 6.49962C2.59961 6.61496 2.6494 6.72469 2.73621 6.80065L6.73621 10.3006C6.85433 10.404 7.02197 10.4287 7.1649 10.3639C7.30782 10.299 7.39961 10.1566 7.39961 9.99962V8.31482C7.84235 8.34699 8.36333 8.43219 8.88439 8.58892C9.57505 8.79666 10.2378 9.12157 10.7222 9.58782L11.3996 10.2398V9.29963C11.3996 7.3993 10.5001 6.23203 9.49584 5.5554C8.74388 5.04876 7.93355 4.81574 7.39961 4.73475V2.99962ZM6.59961 9.11811L3.60705 6.49962L6.59961 3.88112V5.09963C6.59961 5.32054 6.7787 5.49963 6.99961 5.49963C7.28952 5.49963 8.21052 5.65405 9.04883 6.21886C9.70337 6.65985 10.3081 7.34943 10.5198 8.43457C10.0748 8.16443 9.58943 7.96558 9.11482 7.82282C8.3488 7.59241 7.58262 7.49962 6.99961 7.49962C6.7787 7.49962 6.59961 7.6787 6.59961 7.89962V9.11811Z"
        fill={color}
      />
    </svg>
  );
};

export const SearchSvg_Cof = props => {
  const { color = '#386EE7' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.5 13C10.5376 13 13 10.5376 13 7.5C13 4.46243 10.5376 2 7.5 2C4.46243 2 2 4.46243 2 7.5C2 10.5376 4.46243 13 7.5 13Z"
        stroke={color}
        strokeWidth="1.2"
      />
      <path d="M11 11L14 14" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
};

export const ScheduleSvgCof = props => {
  const { color = 'rgba(60, 63, 71, 1)', fill = 'none', clockwiseColor = 'rgba(60, 63, 71, 1)' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={fill} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.3125 7C1.3125 3.85888 3.85888 1.3125 7 1.3125V1.3125C10.1411 1.3125 12.6875 3.85888 12.6875 7V7C12.6875 10.1411 10.1411 12.6875 7 12.6875V12.6875C3.85888 12.6875 1.3125 10.1411 1.3125 7V7Z"
        stroke={color}
        strokeWidth="1.05"
      />
      <path d="M7 3.5V7H9.625" stroke={clockwiseColor || color} strokeWidth="1.05" />
    </svg>
  );
};

export const unThumbUpSvg = () => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M7.76379 10.6129L12.0181 4.29463C12.3194 3.84701 12.8237 3.57861 13.3634 3.57861V3.57861C14.2988 3.57861 15.0402 4.36774 14.9821 5.30132L14.7367 9.23926H18.1606C19.3102 9.23926 20.1652 10.3023 19.9187 11.4252L18.4307 18.2039C18.2797 18.892 17.6701 19.3823 16.9656 19.3823H5.10499C4.27656 19.3823 3.60499 18.7107 3.60499 17.8823V12.1129C3.60499 11.2845 4.27656 10.6129 5.10499 10.6129H7.76379Z"
        stroke="#3C3F47"
        stroke-width="1.35"
        stroke-linejoin="round"
      />
      <line x1="7.51973" y1="10.5" x2="7.51973" y2="19.5" stroke="#3C3F47" stroke-width="1.35" />
    </svg>
  );
};

export const hasThumbUpSvg = () => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M7.76379 10.6129L12.0181 4.29463C12.3194 3.84701 12.8237 3.57861 13.3634 3.57861V3.57861C14.2988 3.57861 15.0402 4.36774 14.9821 5.30132L14.7367 9.23926H18.1606C19.3102 9.23926 20.1652 10.3023 19.9187 11.4252L18.4307 18.2039C18.2797 18.892 17.6701 19.3823 16.9656 19.3823H5.10499C4.27656 19.3823 3.60499 18.7107 3.60499 17.8823V12.1129C3.60499 11.2845 4.27656 10.6129 5.10499 10.6129H7.76379Z"
        fill="#6BA9FF"
        stroke="#6BA9FF"
        stroke-width="1.35"
        stroke-linejoin="round"
      />
      <path d="M6.79949 11.873L6.79968 18.2211" stroke="white" stroke-width="1.35" />
    </svg>
  );
};

export const AttachSvg = props => {
  const { color = '#386EE7' } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.3007 4.50789L5.41636 9.39226C5.09121 9.71742 5.09121 10.2446 5.41636 10.5698V10.5698C5.74152 10.8949 6.26871 10.8949 6.59387 10.5698L11.652 5.51159C12.3024 4.86127 12.3024 3.8069 11.652 3.15658V3.15658C11.0017 2.50626 9.94735 2.50626 9.29703 3.15658L3.75702 8.69659C2.78071 9.6729 2.78071 11.2558 3.75702 12.2321V12.2321C4.73333 13.2084 6.31625 13.2084 7.29256 12.2321L12.6588 6.86592"
        stroke={color}
      />
    </svg>
  );
};

export const MailTagSvg = props => {
  const { color = ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)'] } = props;
  return color.length === 1 ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 11.4088C14 12.1456 13.2302 12.6294 12.5663 12.3099L9.43373 10.802C9.15963 10.67 8.84037 10.67 8.56627 10.802L5.43373 12.3099C4.76981 12.6294 4 12.1456 4 11.4088L4 2C4 1.44771 4.44771 1 5 1L13 0.999999C13.5523 0.999999 14 1.44771 14 2L14 11.4088Z"
        fill={color[0]}
      />
      <path
        d="M12 13.4088C12 14.1456 11.2302 14.6294 10.5663 14.3099L7.43373 12.802C7.15963 12.67 6.84037 12.67 6.56627 12.802L3.43373 14.3099C2.76981 14.6294 2 14.1456 2 13.4088L2 4C2 3.44771 2.44771 3 3 3L11 3C11.5523 3 12 3.44771 12 4L12 13.4088Z"
        fill="rgba(0,0,0,0)"
      />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 11.4088C14 12.1456 13.2302 12.6294 12.5663 12.3099L9.43373 10.802C9.15963 10.67 8.84037 10.67 8.56627 10.802L5.43373 12.3099C4.76981 12.6294 4 12.1456 4 11.4088L4 2C4 1.44771 4.44771 1 5 1L13 0.999999C13.5523 0.999999 14 1.44771 14 2L14 11.4088Z"
        fill={color[1]}
      />
      <path
        d="M12 13.4088C12 14.1456 11.2302 14.6294 10.5663 14.3099L7.43373 12.802C7.15963 12.67 6.84037 12.67 6.56627 12.802L3.43373 14.3099C2.76981 14.6294 2 14.1456 2 13.4088L2 4C2 3.44771 2.44771 3 3 3L11 3C11.5523 3 12 3.44771 12 4L12 13.4088Z"
        fill={color[0]}
      />
    </svg>
  );
};

export const UpgradeInfoReceiveSvg = () => {
  return (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.69971 26.9952C2.69971 13.5747 13.5791 2.69531 26.9996 2.69531C40.42 2.69531 51.2994 13.5747 51.2994 26.9952C51.2994 40.4156 40.42 51.295 26.9996 51.295C13.5791 51.295 2.69971 40.4156 2.69971 26.9952Z"
        fill="#5FC375"
      />
      <path d="M16.2002 25.6484L23.4002 32.3984L37.8002 18.8984" stroke="white" stroke-width="3.24" stroke-linejoin="round" />
    </svg>
  );
};

export const SuspiciousSvg = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_2577_112419)">
        <path
          d="M7.13398 3C7.51888 2.33333 8.48112 2.33333 8.86603 3L14.0622 12C14.4471 12.6667 13.966 13.5 13.1962 13.5H2.80385C2.03405 13.5 1.55292 12.6667 1.93782 12L7.13398 3Z"
          fill="#FE5B4C"
        />
        <path
          d="M8.70517 5.69995C8.56517 7.61995 8.45183 9.11662 8.36517 10.19H7.61517L7.49517 8.40995L7.29517 5.69995H8.70517ZM7.36517 12V10.74H8.63517V12H7.36517Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="clip0_2577_112419">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

const ReadListIcons = {
  AttachPinSvg,
  AttachSvg,
  AttachSvgLarge,
  AttachOrangeSvg,
  EditSvg,
  EditIconDarkSvg,
  MailEditSvg,
  RefreshSvg,
  ReceiveFolderSvg,
  SendFolderSvg,
  FlagFolderSvg,
  TaskFolderSvg,
  UnreadFolderSvg,
  StartFolderSvg,
  StartGroupSvg,
  AddFolderSvg,
  DraftFolderSvg,
  UnverifyFolderSvg,
  VerifyFolderSvg,
  JunkFolderSvg,
  AdFolderSvg,
  RecoverFolderSvg,
  FolderSvg,
  FlagSvg,
  TransmitSvg,
  MoreSvg,
  RecycleSvg,
  PreferredSetSvg,
  RedFlagSvg,
  WhiteFlagSvg,
  ReplySvg,
  ReplyAllSvg,
  DeleteAllSvg,
  DeleteSvg,
  FlagAllSvg,
  BottomFlagSvg,
  ReadSvg,
  UnreadSvg,
  MoveSvg,
  UserSvg,
  FailSvg,
  SucSvg,
  LockSvg,
  AlertSvg,
  CloseSvg,
  TriangleSvg,
  ModalCloseSvg,
  OktextSvg,
  GoodTextSvg,
  HandsTextSvg,
  XialaSvg,
  EditorSvg,
  SendBtnSvg,
  ReplyMutiSvg,
  WarnSvg,
  SimpCloseSvg,
  SearchSvg,
  ReplyWhiteSvg,
  ReplyAllWhiteSvg,
  TagSvg,
  FlagSvg_Cof,
  ReadSvg_Cof,
  UnreadSvg_Cof,
  MoveSvg_Cof,
  RecoverFolderSvg_Cof,
  DeleteAllSvg_Cof,
  TagSvg_Cof,
  ReplySvgCof,
  ReplyAllSvgCof,
  MoreSvg_Cof,
  MailEditSvg_Cof,
  TransmitSvg_Cof,
  RecycleSvg_Cof,
  ExportSvg_Cof,
  ReplyMutiSvg_Cof,
  SearchSvg_Cof,
  ScheduleSvgCof,
  TabDeleteSvg,
  ReplyCircleSvg,
  ReplyCircleActiveSvg,
  ReplyFullSvg,
  ReplyFullActiveSvg,
  AlarmSvg,
  SystemSvg,
  ForwardedSvg,
  ReplayedForwardedSvg,
  PopSvg,
  RcptSuccSvg,
  RcptFailSvg,
  PartialRcptSuccSvg,
  WithdrawSuccSvg,
  WithdrawFailSvg,
  PartialWithdrawSuccSvg,
  MailTopSvg,
  MailUnTopSvg,
  PreferredSvg,
  PreferredActiveSvg,
  unThumbUpSvg, // 未点赞图标
  hasThumbUpSvg, // 已点赞图标
  MailTagSvg, // 邮件卡片标签图标
  TaskMailSvg, // 任务邮件icon
  UpgradeInfoReceiveSvg, // 成功
  SuspiciousSvg, // 可疑邮件
  NewReceiveFolderSvg, // 更换之后的收件箱图标
};

export default ReadListIcons;
