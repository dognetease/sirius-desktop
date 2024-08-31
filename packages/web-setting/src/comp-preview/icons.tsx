import React from 'react';
import { Tooltip } from 'antd';
import styles from './icon.module.scss';
import { ReactComponent as TranslateError } from '@/images/translate_error.svg';
import { ReactComponent as ThumbWarning } from '@/images/thumb_warning.svg';
import { ReactComponent as CardAddManager } from '@/images/mailCustomerCard/add-manager.svg';
import { ReactComponent as FollowTypeMailReceive } from '@/images/mailCustomerCard/follow-type-mail-receive.svg';
import { ReactComponent as NewSchedule } from '@/images/mailCustomerCard/new-schedule.svg';
import { ReactComponent as Cloack } from '@/images/mailCustomerCard/cloack.svg';
import { ReactComponent as CardAccount } from '@/images/mailCustomerCard/account.svg';
import { ReactComponent as CardEditContact } from '@/images/mailCustomerCard/edit-contact.svg';
import { ReactComponent as FollowTypeBusiness } from '@/images/mailCustomerCard/follow-type-business.svg';
import { ReactComponent as FollowTypeSchedule } from '@/images/mailCustomerCard/follow-type-schedule.svg';
import { ReactComponent as BackToOpenSea } from '@/images/mailCustomerCard/back-to-open-sea.svg';
import { ReactComponent as Website } from '@/images/mailCustomerCard/website.svg';
import { ReactComponent as FollowTypeMailSend } from '@/images/mailCustomerCard/follow-type-mail-send.svg';
import { ReactComponent as MenuChecked } from '@/images/mailCustomerCard/menu-checked.svg';
import { ReactComponent as EmptyData } from '@/images/mailCustomerCard/empty-data.svg';
import { ReactComponent as AttachmentLink } from '@/images/mailCustomerCard/attachment-link.svg';
import { ReactComponent as NewBo } from '@/images/mailCustomerCard/new-bo.svg';
import { ReactComponent as CardEdit } from '@/images/mailCustomerCard/edit.svg';
import { ReactComponent as NewFollow } from '@/images/mailCustomerCard/new-follow.svg';
import { ReactComponent as CardSendMail } from '@/images/mailCustomerCard/send-mail.svg';
import { ReactComponent as FollowTypeFollowup } from '@/images/mailCustomerCard/follow-type-followup.svg';
import { ReactComponent as Switch } from '@/images/mailCustomerCard/switch.svg';
import { ReactComponent as CardHelp } from '@/images/mailCustomerCard/help.svg';
import { ReactComponent as ClipboardCopy } from '@/images/mailCustomerCard/clipboard-copy.svg';
import { ReactComponent as CheckedValidIcon } from '@/images/checked-valid-icon.svg';
import { ReactComponent as MailTabArrowDown } from '@/images/mail/mail-tab-arrow-down.svg';
import { ReactComponent as ReceiverAvatar } from '@/images/mail/receiver_avatar.svg';
import { ReactComponent as WhatsApp } from '@/images/whats-app.svg';
import { ReactComponent as TranslateClose } from '@/images/translate_close.svg';
import { ReactComponent as TranslateSuccess } from '@/images/translate_success.svg';
import { ReactComponent as ThumbUp } from '@/images/thumb_up.svg';
import { ReactComponent as Selected } from '@/images/icons/selected.svg';
import { ReactComponent as BottomDeleteAll } from '@/images/icons/bottom-delete-all.svg';
import { ReactComponent as Triangle } from '@/images/icons/triangle.svg';
import { ReactComponent as Search } from '@/images/icons/search.svg';
import { ReactComponent as GoodText } from '@/images/icons/good_text.svg';
import { ReactComponent as Contact } from '@/images/icons/contact.svg';
import { ReactComponent as HandsText } from '@/images/icons/hands_text.svg';
import { ReactComponent as MailSelected } from '@/images/icons/mail-selected.svg';
import { ReactComponent as ArrowDown } from '@/images/icons/arrow-down.svg';
import { ReactComponent as System } from '@/images/icons/system.svg';
import { ReactComponent as SendMail } from '@/images/icons/contactDetail/send_mail.svg';
import { ReactComponent as AddContact } from '@/images/icons/contactDetail/add_contact.svg';
import { ReactComponent as SendReceiveMail } from '@/images/icons/contactDetail/send_receive_mail.svg';
import { ReactComponent as DeleteContact } from '@/images/icons/contactDetail/delete_contact.svg';
import { ReactComponent as CustomerSwitch } from '@/images/icons/contactDetail/customer_switch.svg';
import { ReactComponent as SendReceiveMailLight } from '@/images/icons/contactDetail/send_receive_mail_light.svg';
import { ReactComponent as DetailClose } from '@/images/icons/contactDetail/detail_close.svg';
import { ReactComponent as SendMessage } from '@/images/icons/contactDetail/send_message.svg';
import { ReactComponent as AddContactLight } from '@/images/icons/contactDetail/add_contact_light.svg';
import { ReactComponent as CustomerSelected } from '@/images/icons/contactDetail/customer_selected.svg';
import { ReactComponent as SendMessageLight } from '@/images/icons/contactDetail/send_message_light.svg';
import { ReactComponent as CustomerCompany } from '@/images/icons/contactDetail/customer_company.svg';
import { ReactComponent as EditContact } from '@/images/icons/contactDetail/edit_contact.svg';
import { ReactComponent as SendMailLight } from '@/images/icons/contactDetail/send_mail_light.svg';
import { ReactComponent as Ellipsis } from '@/images/icons/contactDetail/ellipsis.svg';
import { ReactComponent as CustomerClose } from '@/images/icons/contactDetail/customer_close.svg';
import { ReactComponent as CustomerWebAddress } from '@/images/icons/contactDetail/customer_web_address.svg';
import { ReactComponent as SidebarContact } from '@/images/icons/sidebar/contact.svg';
import { ReactComponent as CustomsData } from '@/images/icons/sidebar/customsData.svg';
import { ReactComponent as DiskSelected } from '@/images/icons/sidebar/disk_selected.svg';
import { ReactComponent as IconExpand } from '@/images/icons/sidebar/icon-expand.svg';
import { ReactComponent as Worktable } from '@/images/icons/sidebar/worktable.svg';
import { ReactComponent as SidebarMailBox } from '@/images/icons/sidebar/mailBox.svg';
import { ReactComponent as CatalogSelected } from '@/images/icons/sidebar/catalog_selected.svg';
import { ReactComponent as EnterpirseSettingEnhance } from '@/images/icons/sidebar/enterpirseSetting_enhance.svg';
import { ReactComponent as AppsSelected } from '@/images/icons/sidebar/apps_selected.svg';
import { ReactComponent as SnsEnhance } from '@/images/icons/sidebar/sns_enhance.svg';
import { ReactComponent as Apps } from '@/images/icons/sidebar/apps.svg';
import { ReactComponent as Catalog } from '@/images/icons/sidebar/catalog.svg';
import { ReactComponent as ContactSelected } from '@/images/icons/sidebar/contact_selected.svg';
import { ReactComponent as MailBoxSelected } from '@/images/icons/sidebar/mailBox_selected.svg';
import { ReactComponent as IconShrink } from '@/images/icons/sidebar/icon-shrink.svg';
import { ReactComponent as EnterpriseSetting } from '@/images/icons/sidebar/enterpriseSetting.svg';
import { ReactComponent as WorktableEnhance } from '@/images/icons/sidebar/worktable_enhance.svg';
import { ReactComponent as CustomsDataEnhance } from '@/images/icons/sidebar/customsData_enhance.svg';
import { ReactComponent as Message } from '@/images/icons/sidebar/message.svg';
import { ReactComponent as GlobalSearch } from '@/images/icons/sidebar/globalSearch.svg';
import { ReactComponent as Disk } from '@/images/icons/sidebar/disk.svg';
import { ReactComponent as Sns } from '@/images/icons/sidebar/sns.svg';
import { ReactComponent as AddAccount } from '@/images/icons/sidebar/add-account.svg';
import { ReactComponent as MessageSelected } from '@/images/icons/sidebar/message_selected.svg';
import { ReactComponent as GlobalSearchEnhance } from '@/images/icons/sidebar/globalSearch_enhance.svg';
import { ReactComponent as ModalClose } from '@/images/icons/modal_close.svg';
import { ReactComponent as Ascend } from '@/images/icons/ascend.svg';
import { ReactComponent as WriteLatter } from '@/images/icons/write_latter.svg';
import { ReactComponent as Editor } from '@/images/icons/editor.svg';
import { ReactComponent as CalendarModalClose } from '@/images/icons/calendarDetail/modal_close.svg';
import { ReactComponent as CalendarCloseCircle } from '@/images/icons/calendarDetail/closeCircle.svg';
import { ReactComponent as Checkboxbase } from '@/images/icons/calendarDetail/checkboxbase.svg';
import { ReactComponent as DatePickerArrowLeft } from '@/images/icons/calendarDetail/date-picker-arrow-left.svg';
import { ReactComponent as Import } from '@/images/icons/calendarDetail/import.svg';
import { ReactComponent as Checkboxcolor } from '@/images/icons/calendarDetail/checkboxcolor.svg';
import { ReactComponent as DatePickerArrowRight } from '@/images/icons/calendarDetail/date-picker-arrow-right.svg';
import { ReactComponent as Toopen } from '@/images/icons/calendarDetail/toopen.svg';
import { ReactComponent as CalendarSetting } from '@/images/icons/calendarDetail/setting.svg';
import { ReactComponent as CalendarLoading } from '@/images/icons/calendarDetail/loading.svg';
import { ReactComponent as SubscribeCalendar } from '@/images/icons/calendarDetail/subscribeCalendar.svg';
import { ReactComponent as CalendarAddGray } from '@/images/icons/calendarDetail/calendar_add_gray.svg';
import { ReactComponent as CloseCircleHover } from '@/images/icons/calendarDetail/closeCircleHover.svg';
import { ReactComponent as AddCalendar } from '@/images/icons/calendarDetail/addCalendar.svg';
import { ReactComponent as Floder } from '@/images/icons/floder.svg';
import { ReactComponent as AddManager } from '@/images/icons/addManager.svg';
import { ReactComponent as EditDark } from '@/images/icons/edit_dark.svg';
import { ReactComponent as ReplyCircleActive } from '@/images/icons/reply_circle_active.svg';
import { ReactComponent as Reply } from '@/images/icons/reply.svg';
import { ReactComponent as ActivityIcon } from '@/images/icons/activity-icon.svg';
import { ReactComponent as AddMember } from '@/images/icons/addMember.svg';
import { ReactComponent as RightArrow } from '@/images/icons/right-arrow.svg';
import { ReactComponent as Account } from '@/images/icons/account.svg';
import { ReactComponent as InfoErrorCircleOutline } from '@/images/icons/info-error-circle-outline.svg';
import { ReactComponent as WarnTransparent } from '@/images/icons/warn_transparent.svg';
import { ReactComponent as MailRelated } from '@/images/icons/contact/mail_related.svg';
import { ReactComponent as SendEmailBig } from '@/images/icons/contact/send_email_big.svg';
import { ReactComponent as ContactDelete } from '@/images/icons/contact/contact_delete.svg';
import { ReactComponent as FoldAdd } from '@/images/icons/contact/fold_add.svg';
import { ReactComponent as FoldMore } from '@/images/icons/contact/fold_more.svg';
import { ReactComponent as SendEmailSmall } from '@/images/icons/contact/send_email_small.svg';
import { ReactComponent as ContactSendMessage } from '@/images/icons/contact/send_message.svg';
import { ReactComponent as CustomerAvatar } from '@/images/icons/contact/customer_avatar.svg';
import { ReactComponent as ContactAdd } from '@/images/icons/contact/add.svg';
import { ReactComponent as ClueAvatar } from '@/images/icons/contact/clue_avatar.svg';
import { ReactComponent as PersonalGroupBig } from '@/images/icons/contact/personal_group_big.svg';
import { ReactComponent as SendEmail } from '@/images/icons/contact/send_email.svg';
import { ReactComponent as PersonalGroup } from '@/images/icons/contact/personal_group.svg';
import { ReactComponent as ToolbarDownloadAndroidMask } from '@/images/icons/toolbar_download_android_mask.svg';
import { ReactComponent as CloseEye } from '@/images/icons/close_eye.svg';
import { ReactComponent as Fold } from '@/images/icons/fold.svg';
import { ReactComponent as IconCorrect } from '@/images/icons/icon-correct.svg';
import { ReactComponent as IconCloseGrey } from '@/images/icons/icon-close-grey.svg';
import { ReactComponent as Recycle } from '@/images/icons/recycle.svg';
import { ReactComponent as Forwarded } from '@/images/icons/forwarded.svg';
import { ReactComponent as UnverifyFolder } from '@/images/icons/unverify_folder.svg';
import { ReactComponent as IconWarning } from '@/images/icons/icon-warning.svg';
import { ReactComponent as CloseIconSmall } from '@/images/icons/close_icon_small.svg';
import { ReactComponent as ToolbarDownloadIosMask } from '@/images/icons/toolbar_download_ios_mask.svg';
import { ReactComponent as RemoveManager } from '@/images/icons/removeManager.svg';
import { ReactComponent as IconError } from '@/images/icons/icon-error.svg';
import { ReactComponent as BackIcon } from '@/images/icons/back-icon.svg';
import { ReactComponent as WaimaoSearch } from '@/images/icons/waimao/search.svg';
import { ReactComponent as WaimaoArrowDown } from '@/images/icons/waimao/arrow-down.svg';
import { ReactComponent as GlobalSearchIcon } from '@/images/icons/waimao/global_search_icon.svg';
import { ReactComponent as WaimaoAdd } from '@/images/icons/waimao/add.svg';
import { ReactComponent as ArrowUp } from '@/images/icons/waimao/arrow-up.svg';
import { ReactComponent as WithDraw } from '@/images/icons/with-draw.svg';
import { ReactComponent as Vector } from '@/images/icons/Vector.svg';
import { ReactComponent as Inbox } from '@/images/icons/inbox.svg';
import { ReactComponent as PartialRcptSucc } from '@/images/icons/partial-rcpt-succ.svg';
import { ReactComponent as RotateLeft } from '@/images/icons/rotateLeft.svg';
import { ReactComponent as UpdateAppIcon } from '@/images/icons/update-app-icon.svg';
import { ReactComponent as DeviceWebIcon } from '@/images/icons/device_web_icon.svg';
import { ReactComponent as ListClose } from '@/images/icons/list_close.svg';
import { ReactComponent as AccountExpired } from '@/images/icons/account_expired.svg';
import { ReactComponent as QuestionGreen } from '@/images/icons/question-green.svg';
import { ReactComponent as ReceiveFolder } from '@/images/icons/receive_folder.svg';
import { ReactComponent as ContactEnhance } from '@/images/icons/contact_enhance.svg';
import { ReactComponent as UploadDelete } from '@/images/icons/upload_delete.svg';
import { ReactComponent as StarGold } from '@/images/icons/star-gold.svg';
import { ReactComponent as Eml } from '@/images/icons/eml.svg';
import { ReactComponent as Right } from '@/images/icons/collapsibleList/right.svg';
import { ReactComponent as RightHover } from '@/images/icons/collapsibleList/right-hover.svg';
import { ReactComponent as LeftHover } from '@/images/icons/collapsibleList/left-hover.svg';
import { ReactComponent as Left } from '@/images/icons/collapsibleList/left.svg';
import { ReactComponent as IconEyeClose } from '@/images/icons/icon-eye-close.svg';
import { ReactComponent as ArrowUp1 } from '@/images/icons/arrow-up-1.svg';
import { ReactComponent as IconFunnel } from '@/images/icons/icon_funnel.svg';
import { ReactComponent as BottomFlagAll } from '@/images/icons/bottom-flag-all.svg';
import { ReactComponent as RemoveMember } from '@/images/icons/removeMember.svg';
import { ReactComponent as Keyboard } from '@/images/icons/keyboard.svg';
import { ReactComponent as RegularReply } from '@/images/icons/regularcustomer/reply.svg';
import { ReactComponent as Pushnum } from '@/images/icons/regularcustomer/pushnum.svg';
import { ReactComponent as RegularMail } from '@/images/icons/regularcustomer/mail.svg';
import { ReactComponent as RegularCustomerManual } from '@/images/icons/regularcustomer/RegularCustomerManual.svg';
import { ReactComponent as MailRecive } from '@/images/icons/regularcustomer/mail-recive.svg';
import { ReactComponent as RegularClose } from '@/images/icons/regularcustomer/close.svg';
import { ReactComponent as RegularCustomerAuth } from '@/images/icons/regularcustomer/RegularCustomerAuth.svg';
import { ReactComponent as Refresh } from '@/images/icons/regularcustomer/refresh.svg';
import { ReactComponent as RegularCustomerOp } from '@/images/icons/regularcustomer/RegularCustomerOp.svg';
import { ReactComponent as RegularSend } from '@/images/icons/regularcustomer/send.svg';
import { ReactComponent as MailSend } from '@/images/icons/regularcustomer/mail-send.svg';
import { ReactComponent as RegularCustomerAuto } from '@/images/icons/regularcustomer/RegularCustomerAuto.svg';
import { ReactComponent as RegularIconWarning } from '@/images/icons/regularcustomer/icon_warning.svg';
import { ReactComponent as Calendar } from '@/images/icons/regularcustomer/calendar.svg';
import { ReactComponent as MailBox } from '@/images/icons/mail_box.svg';
import { ReactComponent as CustomsArrowDown } from '@/images/icons/customs/arrow-down.svg';
import { ReactComponent as CustomsCloseIcon } from '@/images/icons/customs/close-icon.svg';
import { ReactComponent as Translate } from '@/images/icons/customs/translate.svg';
import { ReactComponent as Im } from '@/images/icons/customs/im.svg';
import { ReactComponent as CustomerMark } from '@/images/icons/customs/customer-mark.svg';
import { ReactComponent as CustomerSync } from '@/images/icons/customs/customer-sync.svg';
import { ReactComponent as Translate1 } from '@/images/icons/customs/translate1.svg';
import { ReactComponent as CustomsCheck } from '@/images/icons/customs/check.svg';
import { ReactComponent as CustomerAllot } from '@/images/icons/customs/customer-allot.svg';
import { ReactComponent as StartHover } from '@/images/icons/customs/start-hover.svg';
import { ReactComponent as CustomsEmail } from '@/images/icons/customs/email.svg';
import { ReactComponent as AddFollow } from '@/images/icons/customs/add-follow.svg';
import { ReactComponent as CustomsRight } from '@/images/icons/customs/right.svg';
import { ReactComponent as Start } from '@/images/icons/customs/start.svg';
import { ReactComponent as CustomsStar } from '@/images/icons/customs/star.svg';
import { ReactComponent as CustomsDelete } from '@/images/icons/customs/delete.svg';
import { ReactComponent as Icon4 } from '@/images/icons/customs/icon4.svg';
import { ReactComponent as Linkedin } from '@/images/icons/customs/linkedin.svg';
import { ReactComponent as StarSelected } from '@/images/icons/customs/star-selected.svg';
import { ReactComponent as CustomsTwitter } from '@/images/icons/customs/twitter.svg';
import { ReactComponent as Icon2 } from '@/images/icons/customs/icon2.svg';
import { ReactComponent as Help } from '@/images/icons/customs/help.svg';
import { ReactComponent as AddBtn } from '@/images/icons/customs/addBtn.svg';
import { ReactComponent as Icon3 } from '@/images/icons/customs/icon3.svg';
import { ReactComponent as CustomsNewIcon } from '@/images/icons/customs/new-icon.svg';
import { ReactComponent as Icon1 } from '@/images/icons/customs/icon1.svg';
import { ReactComponent as Question } from '@/images/icons/question.svg';
import { ReactComponent as Lock } from '@/images/icons/Lock.svg';
import { ReactComponent as ToolbarVip } from '@/images/icons/toolbar_vip.svg';
import { ReactComponent as ScheduleAddContactGray } from '@/images/icons/schedule_add_contact_gray.svg';
import { ReactComponent as BottomDeleteHover } from '@/images/icons/bottom-delete-hover.svg';
import { ReactComponent as ModalCloseTemp } from '@/images/icons/modal_close_temp.svg';
import { ReactComponent as SubmenuRight } from '@/images/icons/submenu-right.svg';
import { ReactComponent as MailBottomDeleteAll } from '@/images/icons/mail/bottom-delete-all.svg';
import { ReactComponent as AddMedal } from '@/images/icons/mail/add-medal.svg';
import { ReactComponent as MailFloder } from '@/images/icons/mail/floder.svg';
import { ReactComponent as MailReply } from '@/images/icons/mail/reply.svg';
import { ReactComponent as MailRecycle } from '@/images/icons/mail/recycle.svg';
import { ReactComponent as MailTop } from '@/images/icons/mail/mail_top.svg';
import { ReactComponent as TnverifyFolder } from '@/images/icons/mail/unverify_folder.svg';
import { ReactComponent as RelatedMail } from '@/images/icons/mail/related-mail.svg';
import { ReactComponent as Tag } from '@/images/icons/mail/tag.svg';
import { ReactComponent as AddFolder } from '@/images/icons/mail/add_folder.svg';
import { ReactComponent as MailReceiveFolder } from '@/images/icons/mail/receive_folder.svg';
import { ReactComponent as MailQuestion } from '@/images/icons/mail/question.svg';
import { ReactComponent as IconAccount } from '@/images/icons/mail/icon-account.svg';
import { ReactComponent as MailIconClose } from '@/images/icons/mail/icon-close.svg';
import { ReactComponent as MailArrowRight } from '@/images/icons/mail/arrow-right.svg';
import { ReactComponent as MailBottomRead } from '@/images/icons/mail/bottom-read.svg';
import { ReactComponent as ErrorIcon } from '@/images/icons/mail/error-icon.svg';
import { ReactComponent as MailFlag } from '@/images/icons/mail/flag.svg';
import { ReactComponent as AddMemberSHover } from '@/images/icons/mail/add-member-s-hover.svg';
import { ReactComponent as IconClose1 } from '@/images/icons/mail/icon-close1.svg';
import { ReactComponent as MailRedFlag } from '@/images/icons/mail/red_flag.svg';
import { ReactComponent as TaskMail } from '@/images/icons/mail/task_mail.svg';
import { ReactComponent as IconClose2 } from '@/images/icons/mail/icon-close2.svg';
import { ReactComponent as MailBottomMove } from '@/images/icons/mail/bottom-move.svg';
import { ReactComponent as IconDelete } from '@/images/icons/mail/icon-delete.svg';
import { ReactComponent as ConferenceIcon } from '@/images/icons/mail/conference-icon.svg';
import { ReactComponent as PraiseIcon } from '@/images/icons/mail/praise-icon.svg';
import { ReactComponent as AddMedalHover } from '@/images/icons/mail/add-medal-hover.svg';
import { ReactComponent as MailTag } from '@/images/icons/mail/mail-tag.svg';
import { ReactComponent as MailMore } from '@/images/icons/mail/more.svg';
import { ReactComponent as MailDraftFolder } from '@/images/icons/mail/draft_folder.svg';
import { ReactComponent as MailJunkFolder } from '@/images/icons/mail/junk_folder.svg';
import { ReactComponent as MailEdit } from '@/images/icons/mail/edit.svg';
import { ReactComponent as PreferredSet } from '@/images/icons/mail/preferred_set.svg';
import { ReactComponent as TaskFolder } from '@/images/icons/mail/task_folder.svg';
import { ReactComponent as MailTransmit } from '@/images/icons/mail/transmit.svg';
import { ReactComponent as PreferredActive } from '@/images/icons/mail/preferred-active.svg';
import { ReactComponent as Preferred } from '@/images/icons/mail/preferred.svg';
import { ReactComponent as MailFlagFolder } from '@/images/icons/mail/flag_folder.svg';
import { ReactComponent as MailIconAdd } from '@/images/icons/mail/icon-add.svg';
import { ReactComponent as MailSendFolder } from '@/images/icons/mail/send_folder.svg';
import { ReactComponent as MailDeleteTag } from '@/images/icons/mail/delete-tag.svg';
import { ReactComponent as MailArrowLeft } from '@/images/icons/mail/arrow-left.svg';
import { ReactComponent as MailReplyAll } from '@/images/icons/mail/reply_all.svg';
import { ReactComponent as AdvancedSearchHover } from '@/images/icons/mail/advanced_search_hover.svg';
import { ReactComponent as AttachmentPin } from '@/images/icons/mail/attachment-pin.svg';
import { ReactComponent as AddMemberS } from '@/images/icons/mail/add-member-s.svg';
import { ReactComponent as MailVerifyFolder } from '@/images/icons/mail/verify_folder.svg';
import { ReactComponent as MailBottomFlag } from '@/images/icons/mail/bottom-flag.svg';
import { ReactComponent as IconEdit } from '@/images/icons/mail/icon-edit.svg';
import { ReactComponent as MailRecoverFolder } from '@/images/icons/mail/recover_folder.svg';
import { ReactComponent as MailUntop } from '@/images/icons/mail/mail_untop.svg';
import { ReactComponent as AdvancedSearch } from '@/images/icons/mail/advanced_search.svg';
import { ReactComponent as AdFolder } from '@/images/icons/mail/ad_folder.svg';
import { ReactComponent as SpamAlertIcon } from '@/images/icons/alert/spam-alert-icon.svg';
import { ReactComponent as AlertClose } from '@/images/icons/alert/close.svg';
import { ReactComponent as AlertWarn } from '@/images/icons/alert/warn.svg';
import { ReactComponent as AlertSuccess } from '@/images/icons/alert/success.svg';
import { ReactComponent as Error } from '@/images/icons/alert/error.svg';
import { ReactComponent as Calender } from '@/images/icons/calender.svg';
import { ReactComponent as ReplyMuti } from '@/images/icons/reply_muti.svg';
import { ReactComponent as SubmenuLeft } from '@/images/icons/submenu-left.svg';
import { ReactComponent as IconClose } from '@/images/icons/icon-close.svg';
import { ReactComponent as CheckboxNormal } from '@/images/icons/checkbox_normal.svg';
import { ReactComponent as ArrowRight } from '@/images/icons/arrow-right.svg';
import { ReactComponent as RcptSucc } from '@/images/icons/rcpt-succ.svg';
import { ReactComponent as Group } from '@/images/icons/group.svg';
import { ReactComponent as MediaWhite } from '@/images/icons/media_white.svg';
import { ReactComponent as ToolbarDownloadIcon } from '@/images/icons/toolbar_download_icon.svg';
import { ReactComponent as ClearOut } from '@/images/icons/clearOut.svg';
import { ReactComponent as BottomRead } from '@/images/icons/bottom-read.svg';
import { ReactComponent as RadioChecked } from '@/images/icons/radio_checked.svg';
import { ReactComponent as Expand } from '@/images/icons/expand.svg';
import { ReactComponent as OkText } from '@/images/icons/ok_text.svg';
import { ReactComponent as BackToTopNew } from '@/images/icons/back_to_top_new.svg';
import { ReactComponent as UploadPlusThin } from '@/images/icons/upload_plus_thin.svg';
import { ReactComponent as MailRefresh } from '@/images/icons/mail_refresh.svg';
import { ReactComponent as SendMailIcon } from '@/images/icons/send-mail-icon.svg';
import { ReactComponent as CloseCircle } from '@/images/icons/close_circle.svg';
import { ReactComponent as MailOther } from '@/images/icons/mail_other.svg';
import { ReactComponent as TranslateIconTrue } from '@/images/icons/translate_icon_true.svg';
import { ReactComponent as Collapse } from '@/images/icons/collapse.svg';
import { ReactComponent as CloseModal } from '@/images/icons/close_modal.svg';
import { ReactComponent as Xiala } from '@/images/icons/xiala.svg';
import { ReactComponent as MailIcon } from '@/images/icons/mail-icon.svg';
import { ReactComponent as Flag } from '@/images/icons/flag.svg';
import { ReactComponent as SearchHover } from '@/images/icons/search_hover.svg';
import { ReactComponent as MailExchange } from '@/images/icons/mail-exchange.svg';
import { ReactComponent as ToolbarWindowsMask } from '@/images/icons/toolbar_download_windows_mask.svg';
import { ReactComponent as DefaultTeamAvatar } from '@/images/icons/defaultTeamAvatar.svg';
import { ReactComponent as Plus } from '@/images/icons/plus.svg';
import { ReactComponent as SendBtn } from '@/images/icons/send_btn.svg';
import { ReactComponent as RedFlag } from '@/images/icons/red_flag.svg';
import { ReactComponent as CheckboxDisabled } from '@/images/icons/checkbox_disabled.svg';
import { ReactComponent as BottomUnread } from '@/images/icons/bottom-unread.svg';
import { ReactComponent as ExitIcon } from '@/images/icons/exit_icon.svg';
import { ReactComponent as ProductIconTrue } from '@/images/icons/product_icon_true.svg';
import { ReactComponent as CloseSimp } from '@/images/icons/close_simp.svg';
import { ReactComponent as TriangleDown } from '@/images/icons/triangle-down.svg';
import { ReactComponent as Comma } from '@/images/icons/comma.svg';
import { ReactComponent as Timeoutdone } from '@/images/icons/todomail/timeoutdone.svg';
import { ReactComponent as Two } from '@/images/icons/todomail/two.svg';
import { ReactComponent as Ontime } from '@/images/icons/todomail/ontime.svg';
import { ReactComponent as Timeout } from '@/images/icons/todomail/timeout.svg';
import { ReactComponent as Tnineteen } from '@/images/icons/todomail/tnineteen.svg';
import { ReactComponent as Nine } from '@/images/icons/todomail/nine.svg';
import { ReactComponent as Not } from '@/images/icons/todomail/not.svg';
import { ReactComponent as Nineteen } from '@/images/icons/todomail/nineteen.svg';
import { ReactComponent as None } from '@/images/icons/todomail/none.svg';
import { ReactComponent as Ontimedone } from '@/images/icons/todomail/ontimedone.svg';
import { ReactComponent as One } from '@/images/icons/todomail/one.svg';
import { ReactComponent as Other } from '@/images/icons/todomail/other.svg';
import { ReactComponent as WithdrawFail } from '@/images/icons/withdraw-fail.svg';
import { ReactComponent as RadioArrowUp } from '@/images/icons/radio-arrow-up.svg';
import { ReactComponent as ArrowRight1 } from '@/images/icons/arrow-right-1.svg';
import { ReactComponent as DeleteCircle } from '@/images/icons/edm/delete-circle.svg';
import { ReactComponent as IconWarningRed } from '@/images/icons/edm/icon_warning-red.svg';
import { ReactComponent as StepFinishIcon } from '@/images/icons/edm/step-finish-icon.svg';
import { ReactComponent as Persons } from '@/images/icons/edm/persons.svg';
import { ReactComponent as EdmCloseIcon } from '@/images/icons/edm/close-icon.svg';
import { ReactComponent as AppendName } from '@/images/icons/edm/append-name.svg';
import { ReactComponent as PushnumBlue } from '@/images/icons/edm/pushnum-blue.svg';
import { ReactComponent as OpenseaMenu } from '@/images/icons/edm/opensea-menu.svg';
import { ReactComponent as EdmBlacklistMenu } from '@/images/icons/edm/edm-blacklist-menu.svg';
import { ReactComponent as IconEntryArrow } from '@/images/icons/edm/icon-entry-arrow.svg';
import { ReactComponent as CalendarBlue } from '@/images/icons/edm/calendar-blue.svg';
import { ReactComponent as Polygon } from '@/images/icons/edm/polygon.svg';
import { ReactComponent as EdmDeleteIcon } from '@/images/icons/edm/deleteIcon.svg';
import { ReactComponent as UnionIcon } from '@/images/icons/edm/union-icon.svg';
import { ReactComponent as MailSmall } from '@/images/icons/edm/mail-small.svg';
import { ReactComponent as User } from '@/images/icons/edm/user.svg';
import { ReactComponent as WhatsAppMessageMenu } from '@/images/icons/edm/whatsApp-message-menu.svg';
import { ReactComponent as IconOpenSeaFilter } from '@/images/icons/edm/icon-open-sea-filter.svg';
import { ReactComponent as TemplateGroupGroup } from '@/images/icons/edm/template-group-group.svg';
import { ReactComponent as CardExpand } from '@/images/icons/edm/card-expand.svg';
import { ReactComponent as CustomerListMenu } from '@/images/icons/edm/customer-list-menu.svg';
import { ReactComponent as DeleteIconBig } from '@/images/icons/edm/deleteIconBig.svg';
import { ReactComponent as MobileIcon } from '@/images/icons/edm/mobileIcon.svg';
import { ReactComponent as Country } from '@/images/icons/edm/country.svg';
import { ReactComponent as DrawerFold } from '@/images/icons/edm/drawer-fold.svg';
import { ReactComponent as EdmQuestion } from '@/images/icons/edm/question.svg';
import { ReactComponent as AlertRed } from '@/images/icons/edm/alert-red.svg';
import { ReactComponent as CloudUpload } from '@/images/icons/edm/cloud-upload.svg';
import { ReactComponent as EmailRecive } from '@/images/icons/edm/email-recive.svg';
import { ReactComponent as WhatsAppJobMenu } from '@/images/icons/edm/whatsApp-job-menu.svg';
import { ReactComponent as CloseIconBorder } from '@/images/icons/edm/close-icon-border.svg';
import { ReactComponent as MoreAction } from '@/images/icons/edm/more-action.svg';
import { ReactComponent as TableSetting } from '@/images/icons/edm/tableSetting.svg';
import { ReactComponent as TemplateGroupManage } from '@/images/icons/edm/template-group-manage.svg';
import { ReactComponent as KeywordInfo } from '@/images/icons/edm/keyword-info.svg';
import { ReactComponent as KeywordLang } from '@/images/icons/edm/keyword-lang.svg';
import { ReactComponent as UnsubscribeTip } from '@/images/icons/edm/unsubscribe-tip.svg';
import { ReactComponent as RangeDate } from '@/images/icons/edm/range-date.svg';
import { ReactComponent as DraftListMenu } from '@/images/icons/edm/draft-list-menu.svg';
import { ReactComponent as GlobalSearchP2 } from '@/images/icons/edm/global-search-p2.svg';
import { ReactComponent as ExtensionMenu } from '@/images/icons/edm/extension-menu.svg';
import { ReactComponent as TemplateGroupDown } from '@/images/icons/edm/template-group-down.svg';
import { ReactComponent as ConfirmDelete } from '@/images/icons/edm/confirm-delete.svg';
import { ReactComponent as TipsIcon } from '@/images/icons/edm/tips-icon.svg';
import { ReactComponent as GlobalSearchP1 } from '@/images/icons/edm/global-search-p1.svg';
import { ReactComponent as AlertBlue } from '@/images/icons/edm/alert-blue.svg';
import { ReactComponent as EdmStatisticsMenu } from '@/images/icons/edm/edm-statistics-menu.svg';
import { ReactComponent as SearchClose } from '@/images/icons/edm/search-close.svg';
import { ReactComponent as TemplateGroupDelete } from '@/images/icons/edm/template-group-delete.svg';
import { ReactComponent as Check } from '@/images/icons/edm/check.svg';
import { ReactComponent as Warning } from '@/images/icons/edm/warning.svg';
import { ReactComponent as EdmInfo } from '@/images/icons/edm/info.svg';
import { ReactComponent as IconSuccess } from '@/images/icons/edm/icon_success.svg';
import { ReactComponent as IconCustomerFilter } from '@/images/icons/edm/icon-customer-filter.svg';
import { ReactComponent as Add } from '@/images/icons/edm/add.svg';
import { ReactComponent as DocumentIcon } from '@/images/icons/edm/document-icon.svg';
import { ReactComponent as CaretDownOutlined } from '@/images/icons/edm/caretDownOutlined.svg';
import { ReactComponent as EdmCopy } from '@/images/icons/edm/copy.svg';
import { ReactComponent as TwitterLogo } from '@/images/icons/edm/twitter-logo.svg';
import { ReactComponent as CardFold } from '@/images/icons/edm/card-fold.svg';
import { ReactComponent as SearchIcon } from '@/images/icons/edm/search-icon.svg';
import { ReactComponent as AlertError } from '@/images/icons/edm/alert-error.svg';
import { ReactComponent as IconPersonClueFilter } from '@/images/icons/edm/icon-person-clue-filter.svg';
import { ReactComponent as Send } from '@/images/icons/edm/send.svg';
import { ReactComponent as DataTransferMenu } from '@/images/icons/edm/data-transfer-menu.svg';
import { ReactComponent as ArriveCount } from '@/images/icons/edm/autoMarket/arriveCount.svg';
import { ReactComponent as HolidayGreeting } from '@/images/icons/edm/autoMarket/holidayGreeting.svg';
import { ReactComponent as EmailSourceCustom } from '@/images/icons/edm/autoMarket/email-source-custom.svg';
import { ReactComponent as EmailSourceEdm } from '@/images/icons/edm/autoMarket/email-source-edm.svg';
import { ReactComponent as Mail } from '@/images/icons/edm/autoMarket/mail.svg';
import { ReactComponent as ExecCount } from '@/images/icons/edm/autoMarket/execCount.svg';
import { ReactComponent as CustomProcess } from '@/images/icons/edm/autoMarket/customProcess.svg';
import { ReactComponent as PotentialContact } from '@/images/icons/edm/autoMarket/potentialContact.svg';
import { ReactComponent as Email } from '@/images/icons/edm/autoMarket/email.svg';
import { ReactComponent as AutoMarketAdd } from '@/images/icons/edm/autoMarket/add.svg';
import { ReactComponent as AutoMarketClose } from '@/images/icons/edm/autoMarket/close.svg';
import { ReactComponent as Subtract } from '@/images/icons/edm/autoMarket/subtract.svg';
import { ReactComponent as TriggerCount } from '@/images/icons/edm/autoMarket/triggerCount.svg';
import { ReactComponent as PreviousContact } from '@/images/icons/edm/autoMarket/previousContact.svg';
import { ReactComponent as AutoMarketMore } from '@/images/icons/edm/autoMarket/more.svg';
import { ReactComponent as ReplyCount } from '@/images/icons/edm/autoMarket/replyCount.svg';
import { ReactComponent as Clue } from '@/images/icons/edm/autoMarket/clue.svg';
import { ReactComponent as UnsubscribeCount } from '@/images/icons/edm/autoMarket/unsubscribeCount.svg';
import { ReactComponent as AutoMarketDelete } from '@/images/icons/edm/autoMarket/delete.svg';
import { ReactComponent as AutoMarketSuccess } from '@/images/icons/edm/autoMarket/success.svg';
import { ReactComponent as SendCount } from '@/images/icons/edm/autoMarket/sendCount.svg';
import { ReactComponent as Date } from '@/images/icons/edm/autoMarket/date.svg';
import { ReactComponent as ReadCount } from '@/images/icons/edm/autoMarket/readCount.svg';
import { ReactComponent as AutoMarketCustomer } from '@/images/icons/edm/autoMarket/customer.svg';
import { ReactComponent as UpLine } from '@/images/icons/edm/up-line.svg';
import { ReactComponent as WhatsAppTemplateMenu } from '@/images/icons/edm/whatsApp-template-menu.svg';
import { ReactComponent as PcIcon } from '@/images/icons/edm/pcIcon.svg';
import { ReactComponent as EdmCamera } from '@/images/icons/edm/camera.svg';
import { ReactComponent as Separator } from '@/images/icons/edm/separator.svg';
import { ReactComponent as AlertIcon } from '@/images/icons/edm/alert_icon.svg';
import { ReactComponent as SendboxMenu } from '@/images/icons/edm/sendbox-menu.svg';
import { ReactComponent as Admin } from '@/images/icons/edm/admin.svg';
import { ReactComponent as ReplyBlue } from '@/images/icons/edm/reply-blue.svg';
import { ReactComponent as Ok } from '@/images/icons/edm/emailscore/ok.svg';
import { ReactComponent as EmailscoreSuccess } from '@/images/icons/edm/emailscore/success.svg';
import { ReactComponent as AlertLevel1 } from '@/images/icons/edm/emailscore/alert_level1.svg';
import { ReactComponent as AlertLevel2 } from '@/images/icons/edm/emailscore/alert_level2.svg';
import { ReactComponent as AlertLevel3 } from '@/images/icons/edm/emailscore/alert_level3.svg';
import { ReactComponent as PhoneSmall } from '@/images/icons/edm/phone-small.svg';
import { ReactComponent as MenuExpand } from '@/images/icons/edm/menu-expand.svg';
import { ReactComponent as Sortable } from '@/images/icons/edm/sortable.svg';
import { ReactComponent as EmailSend } from '@/images/icons/edm/email-send.svg';
import { ReactComponent as MailTemplate } from '@/images/icons/edm/mail-template.svg';
import { ReactComponent as PageClose } from '@/images/icons/edm/page-close.svg';
import { ReactComponent as Star } from '@/images/icons/edm/star.svg';
import { ReactComponent as DataBlue } from '@/images/icons/edm/data-blue.svg';
import { ReactComponent as BusinessMenu } from '@/images/icons/edm/business-menu.svg';
import { ReactComponent as LoadMore } from '@/images/icons/edm/load-more.svg';
import { ReactComponent as TemplateGroupLeft } from '@/images/icons/edm/template-group-left.svg';
import { ReactComponent as DownOutlined } from '@/images/icons/edm/downOutlined.svg';
import { ReactComponent as MenuFold } from '@/images/icons/edm/menu-fold.svg';
import { ReactComponent as IconWarnning } from '@/images/icons/edm/icon_warnning.svg';
import { ReactComponent as MapStatusSuccess } from '@/images/icons/edm/map_status_success.svg';
import { ReactComponent as RbacIcon } from '@/images/icons/edm/rbac-icon.svg';
import { ReactComponent as SendBlue } from '@/images/icons/edm/send-blue.svg';
import { ReactComponent as EdmDelete } from '@/images/icons/edm/delete.svg';
import { ReactComponent as CustomerOpenseaMenu } from '@/images/icons/edm/customer-opensea-menu.svg';
import { ReactComponent as LocationSmall } from '@/images/icons/edm/location-small.svg';
import { ReactComponent as AddRole } from '@/images/icons/edm/add-role.svg';
import { ReactComponent as Mail6 } from '@/images/icons/edm/mail6.svg';
import { ReactComponent as BusinessStart } from '@/images/icons/edm/business-start.svg';
import { ReactComponent as Mail4 } from '@/images/icons/edm/mail4.svg';
import { ReactComponent as SendSuccess } from '@/images/icons/edm/send-success.svg';
import { ReactComponent as TemplateGroupAdd } from '@/images/icons/edm/template-group-add.svg';
import { ReactComponent as TemplateGroupBack } from '@/images/icons/edm/template-group-back.svg';
import { ReactComponent as KeywordSubSync } from '@/images/icons/edm/keyword-sub-sync.svg';
import { ReactComponent as Filter } from '@/images/icons/edm/filter.svg';
import { ReactComponent as CustomsFavorMenu } from '@/images/icons/edm/customs-favor-menu.svg';
import { ReactComponent as RemoveIcon } from '@/images/icons/edm/remove-icon.svg';
import { ReactComponent as CustomsMenu } from '@/images/icons/edm/customs-menu.svg';
import { ReactComponent as ClientCombine } from '@/images/icons/edm/client-combine.svg';
import { ReactComponent as CustomerLabelMenu } from '@/images/icons/edm/customer-label-menu.svg';
import { ReactComponent as AutoMarket } from '@/images/icons/edm/auto-market.svg';
import { ReactComponent as FacebookLogo } from '@/images/icons/edm/facebook-logo.svg';
import { ReactComponent as Mail5 } from '@/images/icons/edm/mail5.svg';
import { ReactComponent as BusinessClose } from '@/images/icons/edm/business-close.svg';
import { ReactComponent as DefaultAvartar } from '@/images/icons/edm/default-avartar.svg';
import { ReactComponent as Mail1 } from '@/images/icons/edm/mail1.svg';
import { ReactComponent as EnterpriseIcon } from '@/images/icons/edm/enterprise-icon.svg';
import { ReactComponent as Logo } from '@/images/icons/edm/logo.svg';
import { ReactComponent as EdmInfoBlueFill } from '@/images/icons/edm/info-blue-fill.svg';
import { ReactComponent as Confirm } from '@/images/icons/edm/confirm.svg';
import { ReactComponent as MapStatusError } from '@/images/icons/edm/map_status_error.svg';
import { ReactComponent as NewIcon } from '@/images/icons/edm/new-icon.svg';
import { ReactComponent as TemplateGroupEdit } from '@/images/icons/edm/template-group-edit.svg';
import { ReactComponent as TemplateGroupRight } from '@/images/icons/edm/template-group-right.svg';
import { ReactComponent as Mail2 } from '@/images/icons/edm/mail2.svg';
import { ReactComponent as EdmAlertClose } from '@/images/icons/edm/alert-close.svg';
import { ReactComponent as GlobalNotice } from '@/images/icons/edm/global-notice.svg';
import { ReactComponent as WhatsappActive } from '@/images/icons/edm/editor/whatsapp_active.svg';
import { ReactComponent as InstagramActive } from '@/images/icons/edm/editor/instagram_active.svg';
import { ReactComponent as TelegramActive } from '@/images/icons/edm/editor/telegram_active.svg';
import { ReactComponent as Instagram } from '@/images/icons/edm/editor/instagram.svg';
import { ReactComponent as Telegram } from '@/images/icons/edm/editor/telegram.svg';
import { ReactComponent as Facebook } from '@/images/icons/edm/editor/facebook.svg';
import { ReactComponent as Whatsapp } from '@/images/icons/edm/editor/whatsapp.svg';
import { ReactComponent as FacebookActive } from '@/images/icons/edm/editor/facebook_active.svg';
import { ReactComponent as Twitter } from '@/images/icons/edm/editor/twitter.svg';
import { ReactComponent as TwitterActive } from '@/images/icons/edm/editor/twitter_active.svg';
import { ReactComponent as InsLogo } from '@/images/icons/edm/ins-logo.svg';
import { ReactComponent as ClueListMenu } from '@/images/icons/edm/clue-list-menu.svg';
import { ReactComponent as LinkTrace } from '@/images/icons/edm/link-trace.svg';
import { ReactComponent as MoreTabs } from '@/images/icons/edm/more-tabs.svg';
import { ReactComponent as TemplateGroupClose } from '@/images/icons/edm/template-group-close.svg';
import { ReactComponent as Mail3 } from '@/images/icons/edm/mail3.svg';
import { ReactComponent as AboutIcon } from '@/images/icons/persoanalCenter/about_icon.svg';
import { ReactComponent as UpdateIcon } from '@/images/icons/persoanalCenter/update_icon.svg';
import { ReactComponent as PerSettingIcon } from '@/images/icons/persoanalCenter/setting_icon.svg';
import { ReactComponent as AccountIcon } from '@/images/icons/persoanalCenter/account_icon.svg';
import { ReactComponent as BackendIcon } from '@/images/icons/persoanalCenter/backend_icon.svg';
import { ReactComponent as ProductIcon } from '@/images/icons/persoanalCenter/product_icon.svg';
import { ReactComponent as FeedbackIcon } from '@/images/icons/persoanalCenter/feedback_icon.svg';
import { ReactComponent as CounselorIcon } from '@/images/icons/persoanalCenter/counselor_icon.svg';
import { ReactComponent as ScheduleAddContact } from '@/images/icons/schedule_add_contact.svg';
import { ReactComponent as Copy } from '@/images/icons/copy.svg';
import { ReactComponent as BottomMove } from '@/images/icons/bottom-move.svg';
import { ReactComponent as CommonSearch } from '@/images/icons/common/search.svg';
import { ReactComponent as CommonAddMember } from '@/images/icons/common/addMember.svg';
import { ReactComponent as SyncHover } from '@/images/icons/common/sync_hover.svg';
import { ReactComponent as CommonDeleteIcon } from '@/images/icons/common/delete_icon.svg';
import { ReactComponent as CommonArrowLeft } from '@/images/icons/common/arrow_left.svg';
import { ReactComponent as AddMemberHover } from '@/images/icons/common/addMember_hover.svg';
import { ReactComponent as CommonSearchHover } from '@/images/icons/common/search_hover.svg';
import { ReactComponent as Close } from '@/images/icons/common/close.svg';
import { ReactComponent as Loading } from '@/images/icons/common/loading.svg';
import { ReactComponent as TooltipArrows } from '@/images/icons/common/tooltip_arrows.svg';
import { ReactComponent as CommonSync } from '@/images/icons/common/sync.svg';
import { ReactComponent as Sync } from '@/images/icons/sync.svg';
import { ReactComponent as Word } from '@/images/icons/word.svg';
import { ReactComponent as Back } from '@/images/icons/back.svg';
import { ReactComponent as SaveAsTemplate } from '@/images/icons/save_as_template.svg';
import { ReactComponent as CloseIcon } from '@/images/icons/close_icon.svg';
import { ReactComponent as AlertSuc } from '@/images/icons/alert-suc.svg';
import { ReactComponent as ListAlert } from '@/images/icons/list_alert.svg';
import { ReactComponent as ImIconEnhance } from '@/images/icons/im_icon_enhance.svg';
import { ReactComponent as AdTagAdvert } from '@/images/icons/ad-tag-advert.svg';
import { ReactComponent as UploadVideo } from '@/images/icons/upload_video.svg';
import { ReactComponent as ReplyFull } from '@/images/icons/reply_full.svg';
import { ReactComponent as S } from '@/images/icons/s.svg';
import { ReactComponent as TimeIcon } from '@/images/icons/time_icon.svg';
import { ReactComponent as CloseBtn } from '@/images/icons/close_btn.svg';
import { ReactComponent as Camera } from '@/images/icons/camera.svg';
import { ReactComponent as BottomDelete } from '@/images/icons/bottom-delete.svg';
import { ReactComponent as Warn } from '@/images/icons/warn.svg';
import { ReactComponent as Amplification } from '@/images/icons/amplification.svg';
import { ReactComponent as CloseTooltips } from '@/images/icons/close_tooltips.svg';
import { ReactComponent as More } from '@/images/icons/more.svg';
import { ReactComponent as OrgIcon } from '@/images/icons/org_icon.svg';
import { ReactComponent as Media } from '@/images/icons/media.svg';
import { ReactComponent as Mail163 } from '@/images/icons/mail_163.svg';
import { ReactComponent as AttachOrange } from '@/images/icons/attach-orange.svg';
import { ReactComponent as MailQq } from '@/images/icons/mail_qq.svg';
import { ReactComponent as ArrowExpandGray } from '@/images/icons/arrow_expand_gray.svg';
import { ReactComponent as CloseMail } from '@/images/icons/close_mail.svg';
import { ReactComponent as DeleteIcon } from '@/images/icons/delete-icon.svg';
import { ReactComponent as Mark } from '@/images/icons/mark.svg';
import { ReactComponent as DraftFolder } from '@/images/icons/draft_folder.svg';
import { ReactComponent as Template } from '@/images/icons/template.svg';
import { ReactComponent as MailSetting } from '@/images/icons/mail-setting.svg';
import { ReactComponent as JunkFolder } from '@/images/icons/junk_folder.svg';
import { ReactComponent as Edit } from '@/images/icons/edit.svg';
import { ReactComponent as Browser } from '@/images/icons/browser.svg';
import { ReactComponent as Next } from '@/images/icons/next.svg';
import { ReactComponent as CalenderChecked } from '@/images/icons/calender-checked.svg';
import { ReactComponent as Pdf } from '@/images/icons/pdf.svg';
import { ReactComponent as AboudIcon } from '@/images/icons/aboud_icon.svg';
import { ReactComponent as Ppt } from '@/images/icons/ppt.svg';
import { ReactComponent as Transmit } from '@/images/icons/transmit.svg';
import { ReactComponent as Discuss } from '@/images/icons/discuss.svg';
import { ReactComponent as ErrorMark } from '@/images/icons/disk/error_mark.svg';
import { ReactComponent as OptionSelected } from '@/images/icons/disk/option-selected.svg';
import { ReactComponent as DiskFold } from '@/images/icons/disk/fold.svg';
import { ReactComponent as ExternalAccounts } from '@/images/icons/disk/external_accounts.svg';
import { ReactComponent as Doc } from '@/images/icons/disk/doc.svg';
import { ReactComponent as PackUp } from '@/images/icons/disk/pack_up.svg';
import { ReactComponent as DiskArrowLeft } from '@/images/icons/disk/arrow_left.svg';
import { ReactComponent as Link } from '@/images/icons/disk/link.svg';
import { ReactComponent as Rename } from '@/images/icons/disk/rename.svg';
import { ReactComponent as Recover } from '@/images/icons/disk/recover.svg';
import { ReactComponent as Download } from '@/images/icons/disk/download.svg';
import { ReactComponent as NotificationNoticeBg } from '@/images/icons/disk/notification_notice_bg.svg';
import { ReactComponent as Continue } from '@/images/icons/disk/continue.svg';
import { ReactComponent as Retry } from '@/images/icons/disk/retry.svg';
import { ReactComponent as ExternalLink } from '@/images/icons/disk/external_link.svg';
import { ReactComponent as UploadBtn } from '@/images/icons/disk/upload_btn.svg';
import { ReactComponent as Info } from '@/images/icons/disk/info.svg';
import { ReactComponent as TabDelete } from '@/images/icons/disk/tab_delete.svg';
import { ReactComponent as ExternalDownload } from '@/images/icons/disk/external_download.svg';
import { ReactComponent as NotificationThumbUp } from '@/images/icons/disk/notification_thumb_up.svg';
import { ReactComponent as DiskDelete } from '@/images/icons/disk/delete.svg';
import { ReactComponent as NotificationThumbUpHighlight } from '@/images/icons/disk/notification_thumb_up_highlight.svg';
import { ReactComponent as View } from '@/images/icons/disk/view.svg';
import { ReactComponent as NotificationClose } from '@/images/icons/disk/notification_close.svg';
import { ReactComponent as DiskPause } from '@/images/icons/disk/pause.svg';
import { ReactComponent as AddFile } from '@/images/icons/disk/add-file.svg';
import { ReactComponent as Excel } from '@/images/icons/disk/excel.svg';
import { ReactComponent as Unfold } from '@/images/icons/disk/unfold.svg';
import { ReactComponent as MulTable } from '@/images/icons/disk/mul_table.svg';
import { ReactComponent as Done } from '@/images/icons/disk/done.svg';
import { ReactComponent as Block } from '@/images/icons/disk/block.svg';
import { ReactComponent as ExternalVisit } from '@/images/icons/disk/external_visit.svg';
import { ReactComponent as UsingBrowser } from '@/images/icons/disk/using_browser.svg';
import { ReactComponent as ImportDoc } from '@/images/icons/disk/import-doc.svg';
import { ReactComponent as CopyHover } from '@/images/icons/im/copy-hover.svg';
import { ReactComponent as MsgRemove } from '@/images/icons/im/msg-remove.svg';
import { ReactComponent as OpenRight } from '@/images/icons/im/open_right.svg';
import { ReactComponent as AddPeopleIcon } from '@/images/icons/im/add-people-icon.svg';
import { ReactComponent as QuitHover } from '@/images/icons/im/quit_hover.svg';
import { ReactComponent as LxSysAvatar } from '@/images/icons/im/lx_sys_avatar.svg';
import { ReactComponent as ImRecycle } from '@/images/icons/im/recycle.svg';
import { ReactComponent as HappyIcon } from '@/images/icons/im/happy-icon.svg';
import { ReactComponent as MsgHistoryIcon } from '@/images/icons/im/msg-history-icon.svg';
import { ReactComponent as Uploading } from '@/images/icons/im/uploading.svg';
import { ReactComponent as Clear } from '@/images/icons/im/clear.svg';
import { ReactComponent as MsgDeal } from '@/images/icons/im/msg-deal.svg';
import { ReactComponent as AnnoSelected } from '@/images/icons/im/anno-selected.svg';
import { ReactComponent as ReplyCloseIcon } from '@/images/icons/im/reply-close-icon.svg';
import { ReactComponent as WhiteClose } from '@/images/icons/im/white_close.svg';
import { ReactComponent as Quit } from '@/images/icons/im/quit.svg';
import { ReactComponent as ReadedRectorIcon } from '@/images/icons/im/readed-rector-icon.svg';
import { ReactComponent as Stop } from '@/images/icons/im/stop.svg';
import { ReactComponent as ForwardDisable } from '@/images/icons/im/forward_disable.svg';
import { ReactComponent as DeleteDisable } from '@/images/icons/im/delete_disable.svg';
import { ReactComponent as Team } from '@/images/icons/im/team.svg';
import { ReactComponent as TeamDefaultPurple } from '@/images/icons/im/team_default_purple.svg';
import { ReactComponent as ImCopy } from '@/images/icons/im/copy.svg';
import { ReactComponent as MsgDealed } from '@/images/icons/im/msg-dealed.svg';
import { ReactComponent as TeamAvatar } from '@/images/icons/im/v2/team-avatar.svg';
import { ReactComponent as UploadError } from '@/images/icons/im/upload-error.svg';
import { ReactComponent as Setting } from '@/images/icons/im/setting.svg';
import { ReactComponent as DeleteHover } from '@/images/icons/im/delete_hover.svg';
import { ReactComponent as Anno } from '@/images/icons/im/anno.svg';
import { ReactComponent as AddMembersSelected } from '@/images/icons/im/add-members-selected.svg';
import { ReactComponent as TeamDefaultGreen } from '@/images/icons/im/team_default_green.svg';
import { ReactComponent as AddIconHover } from '@/images/icons/im/add-icon-hover.svg';
import { ReactComponent as AddIcon } from '@/images/icons/im/add-icon.svg';
import { ReactComponent as DiscussGroup } from '@/images/icons/im/discuss_group.svg';
import { ReactComponent as TeamDefaultBlue } from '@/images/icons/im/team_default_blue.svg';
import { ReactComponent as MsgLoadingIcon } from '@/images/icons/im/msg-loading-icon.svg';
import { ReactComponent as Delete } from '@/images/icons/im/delete.svg';
import { ReactComponent as SettingSelected } from '@/images/icons/im/setting-selected.svg';
import { ReactComponent as ImAddSchedule } from '@/images/icons/im/im_add_schedule.svg';
import { ReactComponent as ImgFallback } from '@/images/icons/im/imgFallback.svg';
import { ReactComponent as FileIcon } from '@/images/icons/im/file-icon.svg';
import { ReactComponent as ForwardHover } from '@/images/icons/im/forward_hover.svg';
import { ReactComponent as Pause } from '@/images/icons/im/pause.svg';
import { ReactComponent as Forward } from '@/images/icons/im/forward.svg';
import { ReactComponent as MsgLater } from '@/images/icons/im/msg-later.svg';
import { ReactComponent as AddMembers } from '@/images/icons/im/add-members.svg';
import { ReactComponent as TeamDefaultOrange } from '@/images/icons/im/team_default_orange.svg';
import { ReactComponent as ReplyWhite } from '@/images/icons/reply_white.svg';
import { ReactComponent as ProductIconFalse } from '@/images/icons/product_icon_false.svg';
import { ReactComponent as Exit } from '@/images/icons/exit.svg';
import { ReactComponent as WithDrawHover } from '@/images/icons/with-draw-hover.svg';
import { ReactComponent as ListGroup } from '@/images/icons/list-group.svg';
import { ReactComponent as Descend } from '@/images/icons/descend.svg';
import { ReactComponent as MailBoxEnhance } from '@/images/icons/mail_box_enhance.svg';
import { ReactComponent as MessageLoading } from '@/images/icons/message_loading.svg';
import { ReactComponent as FlagFolder } from '@/images/icons/flag_folder.svg';
import { ReactComponent as Pop } from '@/images/icons/pop.svg';
import { ReactComponent as AttachLarge } from '@/images/icons/attach-large.svg';
import { ReactComponent as AlertFail } from '@/images/icons/alert-fail.svg';
import { ReactComponent as ToolbarTriangleDown } from '@/images/icons/toolbar_triangle_down.svg';
import { ReactComponent as WarnYellow } from '@/images/icons/warn-yellow.svg';
import { ReactComponent as Dropdown } from '@/images/icons/dropdown.svg';
import { ReactComponent as CalenderEnhance } from '@/images/icons/calender_enhance.svg';
import { ReactComponent as ReplyAllWhite } from '@/images/icons/reply_all_white.svg';
import { ReactComponent as AccountSetting } from '@/images/icons/account-setting.svg';
import { ReactComponent as ArrowExpand } from '@/images/icons/arrow-expand.svg';
import { ReactComponent as SendFolder } from '@/images/icons/send_folder.svg';
import { ReactComponent as ArrowRightWhite } from '@/images/icons/arrow-right-white.svg';
import { ReactComponent as Attach } from '@/images/icons/attach.svg';
import { ReactComponent as RcptFail } from '@/images/icons/rcpt-fail.svg';
import { ReactComponent as AccountExit } from '@/images/icons/setting/account_exit.svg';
import { ReactComponent as KeyboardDelete } from '@/images/icons/setting/keyboard_delete.svg';
import { ReactComponent as SuccessAccount } from '@/images/icons/setting/success_account.svg';
import { ReactComponent as LinkAccount } from '@/images/icons/setting/link_account.svg';
import { ReactComponent as KeyboardTipIcon } from '@/images/icons/setting/keyboard_tip_icon.svg';
import { ReactComponent as SettingExit } from '@/images/icons/setting/exit.svg';
import { ReactComponent as IconEyeOpen } from '@/images/icons/icon-eye-open.svg';
import { ReactComponent as ArrowLeft } from '@/images/icons/arrow-left.svg';
import { ReactComponent as ReplyCircle } from '@/images/icons/reply_circle.svg';
import { ReactComponent as ReplyAll } from '@/images/icons/reply_all.svg';
import { ReactComponent as ContactModalClose } from '@/images/icons/contact_modal_close.svg';
import { ReactComponent as MailMain } from '@/images/icons/mail_main.svg';
import { ReactComponent as CheckboxChecked } from '@/images/icons/checkbox_checked.svg';
import { ReactComponent as DevicePcIcon } from '@/images/icons/device_pc_icon.svg';
import { ReactComponent as AccountSettingWhite } from '@/images/icons/account_setting_white.svg';
import { ReactComponent as VerifyFolder } from '@/images/icons/verify_folder.svg';
import { ReactComponent as ToTop } from '@/images/icons/to_top.svg';
import { ReactComponent as BottomFlag } from '@/images/icons/bottom-flag.svg';
import { ReactComponent as ModalCloseBtn } from '@/images/icons/modal-close-btn.svg';
import { ReactComponent as StarGray } from '@/images/icons/star-gray.svg';
import { ReactComponent as Brush } from '@/images/icons/brush.svg';
import { ReactComponent as CheckedCircle } from '@/images/icons/checked_circle.svg';
import { ReactComponent as TagClose } from '@/images/icons/tag_close.svg';
import { ReactComponent as BackToTop } from '@/images/icons/back_to_top.svg';
import { ReactComponent as AdTagActivity } from '@/images/icons/ad-tag-activity.svg';
import { ReactComponent as IcsInvite } from '@/images/icons/ics/ics_invite.svg';
import { ReactComponent as IcsRemark } from '@/images/icons/ics/ics_remark.svg';
import { ReactComponent as IcsIconCatalog } from '@/images/icons/ics/ics_icon_catalog.svg';
import { ReactComponent as IcsTime } from '@/images/icons/ics/ics_time.svg';
import { ReactComponent as IcsLocation } from '@/images/icons/ics/ics_location.svg';
import { ReactComponent as IcsIconRrule } from '@/images/icons/ics/ics_icon_rrule.svg';
import { ReactComponent as IcsOrganize } from '@/images/icons/ics/ics_organize.svg';
import { ReactComponent as WhiteFlag } from '@/images/icons/white_flag.svg';
import { ReactComponent as DeviceMobileIcon } from '@/images/icons/device_mobile_icon.svg';
import { ReactComponent as PartialWithdrawSucc } from '@/images/icons/partial-withdraw-succ.svg';
import { ReactComponent as ReplayedForwarded } from '@/images/icons/replayed-forwarded.svg';
import { ReactComponent as WifiClosed } from '@/images/icons/wifi_closed.svg';
import { ReactComponent as ToolbarDownloadMacosMask } from '@/images/icons/toolbar_download_macos_mask.svg';
import { ReactComponent as LoginBack } from '@/images/icons/login/back.svg';
import { ReactComponent as LoginWarn } from '@/images/icons/login/warn.svg';
import { ReactComponent as BackHover } from '@/images/icons/login/back-hover.svg';
import { ReactComponent as Success } from '@/images/icons/login/success.svg';
import { ReactComponent as Xls } from '@/images/icons/xls.svg';
import { ReactComponent as ReplyFullActive } from '@/images/icons/reply_full_active.svg';
import { ReactComponent as OpenEye } from '@/images/icons/open_eye.svg';
import { ReactComponent as CalendarIconCycle } from '@/images/icons/calendar_icon_cycle.svg';
import { ReactComponent as NewVersionClose } from '@/images/icons/new_version_close.svg';
import { ReactComponent as ImIcon } from '@/images/icons/im_icon.svg';
import { ReactComponent as InfoCircle } from '@/images/icons/whatsApp/info-circle.svg';
import { ReactComponent as WarningCircle } from '@/images/icons/whatsApp/warning-circle.svg';
import { ReactComponent as CreateJob } from '@/images/icons/whatsApp/create-job.svg';
import { ReactComponent as ErrorCircle } from '@/images/icons/whatsApp/error-circle.svg';
import { ReactComponent as RecoverFolder } from '@/images/icons/recover_folder.svg';
import { ReactComponent as Alarm } from '@/images/icons/alarm.svg';
import { ReactComponent as ArrowDown1 } from '@/images/icons/arrow-down-1.svg';
import { ReactComponent as GreenDiscuss } from '@/images/icons/green-discuss.svg';
import { ReactComponent as IconWarnRed } from '@/images/icons/icon-warn-red.svg';
import { ReactComponent as WithdrawSucc } from '@/images/icons/withdraw-succ.svg';
import { ReactComponent as NewSearch } from '@/images/icons/new_search.svg';
import { ReactComponent as ToolbarComputer } from '@/images/icons/toolbar_computer.svg';
import { ReactComponent as IconWarn } from '@/images/icons/icon-warn.svg';
import { ReactComponent as WebLogo } from '@/images/web_logo.svg';
import { ReactComponent as AutoReplyWarn } from '@/images/autoReply_warn.svg';
import { ReactComponent as TranslateLoading } from '@/images/translate_loading.svg';
import { ReactComponent as IconMacMax } from '@/images/electron/icon_mac_max.svg';
import { ReactComponent as IconMacUnMax } from '@/images/electron/icon_mac_un_max.svg';
import { ReactComponent as IconMax } from '@/images/electron/icon_max.svg';
import { ReactComponent as IconMinWhite } from '@/images/electron/icon_min_white.svg';
import { ReactComponent as ElectronIconClose } from '@/images/electron/icon_close.svg';
import { ReactComponent as AboutClose } from '@/images/electron/about_close.svg';
import { ReactComponent as IconMacClose } from '@/images/electron/icon_mac_close.svg';
import { ReactComponent as IconMacMin } from '@/images/electron/icon_mac_min.svg';
import { ReactComponent as IconCloseHover } from '@/images/electron/icon_close_hover.svg';
import { ReactComponent as IconMaxWhite } from '@/images/electron/icon_max_white.svg';
import { ReactComponent as IconMin } from '@/images/electron/icon_min.svg';
import { ReactComponent as IconUnMax } from '@/images/electron/icon_un_max.svg';
import { ReactComponent as IconUnMaxWhite } from '@/images/electron/icon_un_max_white.svg';
import { ReactComponent as ElectronLogo } from '@/images/electron/logo.svg';
import { ReactComponent as Customer } from '@/images/customer.svg';

const iconList = [
  { comp: <TranslateError />, name: 'TranslateError' },
  { comp: <ThumbWarning />, name: 'ThumbWarning' },
  { comp: <CardAddManager />, name: 'CardAddManager' },
  { comp: <FollowTypeMailReceive />, name: 'FollowTypeMailReceive' },
  { comp: <NewSchedule />, name: 'NewSchedule' },
  { comp: <Cloack />, name: 'Cloack' },
  { comp: <CardAccount />, name: 'CardAccount' },
  { comp: <CardEditContact />, name: 'CardEditContact' },
  { comp: <FollowTypeBusiness />, name: 'FollowTypeBusiness' },
  { comp: <FollowTypeSchedule />, name: 'FollowTypeSchedule' },
  { comp: <BackToOpenSea />, name: 'BackToOpenSea' },
  { comp: <Website />, name: 'Website' },
  { comp: <FollowTypeMailSend />, name: 'FollowTypeMailSend' },
  { comp: <MenuChecked />, name: 'MenuChecked' },
  { comp: <EmptyData />, name: 'EmptyData' },
  { comp: <AttachmentLink />, name: 'AttachmentLink' },
  { comp: <NewBo />, name: 'NewBo' },
  { comp: <CardEdit />, name: 'CardEdit' },
  { comp: <NewFollow />, name: 'NewFollow' },
  { comp: <CardSendMail />, name: 'CardSendMail' },
  { comp: <FollowTypeFollowup />, name: 'FollowTypeFollowup' },
  { comp: <Switch />, name: 'Switch' },
  { comp: <CardHelp />, name: 'CardHelp' },
  { comp: <ClipboardCopy />, name: 'ClipboardCopy' },
  { comp: <CheckedValidIcon />, name: 'CheckedValidIcon' },
  { comp: <MailTabArrowDown />, name: 'MailTabArrowDown' },
  { comp: <ReceiverAvatar />, name: 'ReceiverAvatar' },
  { comp: <WhatsApp />, name: 'WhatsApp' },
  { comp: <TranslateClose />, name: 'TranslateClose' },
  { comp: <TranslateSuccess />, name: 'TranslateSuccess' },
  { comp: <ThumbUp />, name: 'ThumbUp' },
  { comp: <Selected />, name: 'Selected' },
  { comp: <BottomDeleteAll />, name: 'BottomDeleteAll' },
  { comp: <Triangle />, name: 'Triangle' },
  { comp: <Search />, name: 'Search' },
  { comp: <GoodText />, name: 'GoodText' },
  { comp: <Contact />, name: 'Contact' },
  { comp: <HandsText />, name: 'HandsText' },
  { comp: <MailSelected />, name: 'MailSelected' },
  { comp: <ArrowDown />, name: 'ArrowDown' },
  { comp: <System />, name: 'System' },
  { comp: <SendMail />, name: 'SendMail' },
  { comp: <AddContact />, name: 'AddContact' },
  { comp: <SendReceiveMail />, name: 'SendReceiveMail' },
  { comp: <DeleteContact />, name: 'DeleteContact' },
  { comp: <CustomerSwitch />, name: 'CustomerSwitch' },
  { comp: <SendReceiveMailLight />, name: 'SendReceiveMailLight' },
  { comp: <DetailClose />, name: 'DetailClose' },
  { comp: <SendMessage />, name: 'SendMessage' },
  { comp: <AddContactLight />, name: 'AddContactLight' },
  { comp: <CustomerSelected />, name: 'CustomerSelected' },
  { comp: <SendMessageLight />, name: 'SendMessageLight' },
  { comp: <CustomerCompany />, name: 'CustomerCompany' },
  { comp: <EditContact />, name: 'EditContact' },
  { comp: <SendMailLight />, name: 'SendMailLight' },
  { comp: <Ellipsis />, name: 'Ellipsis' },
  { comp: <CustomerClose />, name: 'CustomerClose' },
  { comp: <CustomerWebAddress />, name: 'CustomerWebAddress' },
  { comp: <SidebarContact />, name: 'SidebarContact' },
  { comp: <CustomsData />, name: 'CustomsData' },
  { comp: <DiskSelected />, name: 'DiskSelected' },
  { comp: <IconExpand />, name: 'IconExpand' },
  { comp: <Worktable />, name: 'Worktable' },
  { comp: <SidebarMailBox />, name: 'SidebarMailBox' },
  { comp: <CatalogSelected />, name: 'CatalogSelected' },
  { comp: <EnterpirseSettingEnhance />, name: 'EnterpirseSettingEnhance' },
  { comp: <AppsSelected />, name: 'AppsSelected' },
  { comp: <SnsEnhance />, name: 'SnsEnhance' },
  { comp: <Apps />, name: 'Apps' },
  { comp: <Catalog />, name: 'Catalog' },
  { comp: <ContactSelected />, name: 'ContactSelected' },
  { comp: <MailBoxSelected />, name: 'MailBoxSelected' },
  { comp: <IconShrink />, name: 'IconShrink' },
  { comp: <EnterpriseSetting />, name: 'EnterpriseSetting' },
  { comp: <WorktableEnhance />, name: 'WorktableEnhance' },
  { comp: <CustomsDataEnhance />, name: 'CustomsDataEnhance' },
  { comp: <Message />, name: 'Message' },
  { comp: <GlobalSearch />, name: 'GlobalSearch' },
  { comp: <Disk />, name: 'Disk' },
  { comp: <Sns />, name: 'Sns' },
  { comp: <AddAccount />, name: 'AddAccount' },
  { comp: <MessageSelected />, name: 'MessageSelected' },
  { comp: <GlobalSearchEnhance />, name: 'GlobalSearchEnhance' },
  { comp: <ModalClose />, name: 'ModalClose' },
  { comp: <Ascend />, name: 'Ascend' },
  { comp: <WriteLatter />, name: 'WriteLatter' },
  { comp: <Editor />, name: 'Editor' },
  { comp: <CalendarModalClose />, name: 'CalendarModalClose' },
  { comp: <CalendarCloseCircle />, name: 'CalendarCloseCircle' },
  { comp: <Checkboxbase />, name: 'Checkboxbase' },
  { comp: <DatePickerArrowLeft />, name: 'DatePickerArrowLeft' },
  { comp: <Import />, name: 'Import' },
  { comp: <Checkboxcolor />, name: 'Checkboxcolor' },
  { comp: <DatePickerArrowRight />, name: 'DatePickerArrowRight' },
  { comp: <Toopen />, name: 'Toopen' },
  { comp: <CalendarSetting />, name: 'CalendarSetting' },
  { comp: <CalendarLoading />, name: 'CalendarLoading' },
  { comp: <SubscribeCalendar />, name: 'SubscribeCalendar' },
  { comp: <CalendarAddGray />, name: 'CalendarAddGray' },
  { comp: <CloseCircleHover />, name: 'CloseCircleHover' },
  { comp: <AddCalendar />, name: 'AddCalendar' },
  { comp: <Floder />, name: 'Floder' },
  { comp: <AddManager />, name: 'AddManager' },
  { comp: <ReplyCircleActive />, name: 'ReplyCircleActive' },
  { comp: <EditDark />, name: 'EditDark' },
  { comp: <Reply />, name: 'Reply' },
  { comp: <ActivityIcon />, name: 'ActivityIcon' },
  { comp: <AddMember />, name: 'AddMember' },
  {
    comp: <RightArrow />,
    name: 'RightArrow',
  },
  {
    comp: <Account />,
    name: 'Account',
  },
  {
    comp: <InfoErrorCircleOutline />,
    name: 'InfoErrorCircleOutline',
  },
  {
    comp: <WarnTransparent />,
    name: 'WarnTransparent',
  },
  {
    comp: <MailRelated />,
    name: 'MailRelated',
  },
  {
    comp: <SendEmailBig />,
    name: 'SendEmailBig',
  },
  {
    comp: <ContactDelete />,
    name: 'ContactDelete',
  },
  {
    comp: <FoldAdd />,
    name: 'FoldAdd',
  },
  {
    comp: <FoldMore />,
    name: 'FoldMore',
  },
  {
    comp: <SendEmailSmall />,
    name: 'SendEmailSmall',
  },
  {
    comp: <ContactSendMessage />,
    name: 'ContactSendMessage',
  },
  {
    comp: <CustomerAvatar />,
    name: 'CustomerAvatar',
  },
  {
    comp: <ContactAdd />,
    name: 'ContactAdd',
  },
  {
    comp: <ClueAvatar />,
    name: 'ClueAvatar',
  },
  {
    comp: <PersonalGroupBig />,
    name: 'PersonalGroupBig',
  },
  {
    comp: <SendEmail />,
    name: 'SendEmail',
  },
  {
    comp: <PersonalGroup />,
    name: 'PersonalGroup',
  },
  {
    comp: <ToolbarDownloadAndroidMask />,
    name: 'ToolbarDownloadAndroidMask',
  },
  {
    comp: <CloseEye />,
    name: 'CloseEye',
  },
  {
    comp: <Fold />,
    name: 'Fold',
  },
  {
    comp: <IconCorrect />,
    name: 'IconCorrect',
  },
  {
    comp: <IconCloseGrey />,
    name: 'IconCloseGrey',
  },
  {
    comp: <Recycle />,
    name: 'Recycle',
  },
  {
    comp: <Forwarded />,
    name: 'Forwarded',
  },
  {
    comp: <UnverifyFolder />,
    name: 'UnverifyFolder',
  },
  {
    comp: <IconWarning />,
    name: 'IconWarning',
  },
  {
    comp: <CloseIconSmall />,
    name: 'CloseIconSmall',
  },
  {
    comp: <ToolbarDownloadIosMask />,
    name: 'ToolbarDownloadIosMask',
  },
  {
    comp: <RemoveManager />,
    name: 'RemoveManager',
  },
  {
    comp: <IconError />,
    name: 'IconError',
  },
  {
    comp: <BackIcon />,
    name: 'BackIcon',
  },
  {
    comp: <WaimaoSearch />,
    name: 'WaimaoSearch',
  },
  {
    comp: <WaimaoArrowDown />,
    name: 'WaimaoArrowDown',
  },
  {
    comp: <GlobalSearchIcon />,
    name: 'GlobalSearchIcon',
  },
  {
    comp: <WaimaoAdd />,
    name: 'WaimaoAdd',
  },
  {
    comp: <ArrowUp />,
    name: 'ArrowUp',
  },
  {
    comp: <WithDraw />,
    name: 'WithDraw',
  },
  {
    comp: <Vector />,
    name: 'Vector',
  },
  {
    comp: <Inbox />,
    name: 'Inbox',
  },
  {
    comp: <PartialRcptSucc />,
    name: 'PartialRcptSucc',
  },
  {
    comp: <RotateLeft />,
    name: 'RotateLeft',
  },
  {
    comp: <UpdateAppIcon />,
    name: 'UpdateAppIcon',
  },
  {
    comp: <DeviceWebIcon />,
    name: 'DeviceWebIcon',
  },
  {
    comp: <ListClose />,
    name: 'ListClose',
  },
  {
    comp: <AccountExpired />,
    name: 'AccountExpired',
  },
  {
    comp: <QuestionGreen />,
    name: 'QuestionGreen',
  },
  {
    comp: <ReceiveFolder />,
    name: 'ReceiveFolder',
  },
  {
    comp: <ContactEnhance />,
    name: 'ContactEnhance',
  },
  {
    comp: <UploadDelete />,
    name: 'UploadDelete',
  },
  {
    comp: <StarGold />,
    name: 'StarGold',
  },
  {
    comp: <Eml />,
    name: 'Eml',
  },
  {
    comp: <Right />,
    name: 'Right',
  },
  {
    comp: <RightHover />,
    name: 'RightHover',
  },
  {
    comp: <LeftHover />,
    name: 'LeftHover',
  },
  {
    comp: <Left />,
    name: 'Left',
  },
  {
    comp: <IconEyeClose />,
    name: 'IconEyeClose',
  },
  {
    comp: <ArrowUp1 />,
    name: 'ArrowUp1',
  },
  {
    comp: <IconFunnel />,
    name: 'IconFunnel',
  },
  {
    comp: <BottomFlagAll />,
    name: 'BottomFlagAll',
  },
  {
    comp: <RemoveMember />,
    name: 'RemoveMember',
  },
  {
    comp: <Keyboard />,
    name: 'Keyboard',
  },
  {
    comp: <RegularReply />,
    name: 'RegularReply',
  },
  {
    comp: <Pushnum />,
    name: 'Pushnum',
  },
  {
    comp: <RegularMail />,
    name: 'RegularMail',
  },
  {
    comp: <RegularCustomerManual />,
    name: 'RegularCustomerManual',
  },
  {
    comp: <MailRecive />,
    name: 'MailRecive',
  },
  {
    comp: <RegularClose />,
    name: 'RegularClose',
  },
  {
    comp: <RegularCustomerAuth />,
    name: 'RegularCustomerAuth',
  },
  {
    comp: <Refresh />,
    name: 'Refresh',
  },
  {
    comp: <RegularCustomerOp />,
    name: 'RegularCustomerOp',
  },
  {
    comp: <RegularSend />,
    name: 'RegularSend',
  },
  {
    comp: <MailSend />,
    name: 'MailSend',
  },
  {
    comp: <RegularCustomerAuto />,
    name: 'RegularCustomerAuto',
  },
  {
    comp: <RegularIconWarning />,
    name: 'RegularIconWarning',
  },
  {
    comp: <Calendar />,
    name: 'Calendar',
  },
  {
    comp: <MailBox />,
    name: 'MailBox',
  },
  {
    comp: <CustomsArrowDown />,
    name: 'CustomsArrowDown',
  },
  {
    comp: <CustomsCloseIcon />,
    name: 'CustomsCloseIcon',
  },
  {
    comp: <Translate />,
    name: 'Translate',
  },
  {
    comp: <Im />,
    name: 'Im',
  },
  {
    comp: <CustomerMark />,
    name: 'CustomerMark',
  },
  {
    comp: <CustomerSync />,
    name: 'CustomerSync',
  },
  {
    comp: <Translate1 />,
    name: 'Translate1',
  },
  {
    comp: <CustomsCheck />,
    name: 'CustomsCheck',
  },
  {
    comp: <CustomerAllot />,
    name: 'CustomerAllot',
  },
  {
    comp: <StartHover />,
    name: 'StartHover',
  },
  {
    comp: <CustomsEmail />,
    name: 'CustomsEmail',
  },
  {
    comp: <AddFollow />,
    name: 'AddFollow',
  },
  {
    comp: <CustomsRight />,
    name: 'CustomsRight',
  },
  {
    comp: <Start />,
    name: 'Start',
  },
  {
    comp: <CustomsStar />,
    name: 'CustomsStar',
  },
  {
    comp: <CustomsDelete />,
    name: 'CustomsDelete',
  },
  {
    comp: <Icon4 />,
    name: 'Icon4',
  },
  {
    comp: <Linkedin />,
    name: 'Linkedin',
  },
  {
    comp: <StarSelected />,
    name: 'StarSelected',
  },
  {
    comp: <CustomsTwitter />,
    name: 'CustomsTwitter',
  },
  {
    comp: <Icon2 />,
    name: 'Icon2',
  },
  {
    comp: <Help />,
    name: 'Help',
  },
  {
    comp: <AddBtn />,
    name: 'AddBtn',
  },
  {
    comp: <Icon3 />,
    name: 'Icon3',
  },
  {
    comp: <CustomsNewIcon />,
    name: 'CustomsNewIcon',
  },
  {
    comp: <Icon1 />,
    name: 'Icon1',
  },
  {
    comp: <Question />,
    name: 'Question',
  },
  {
    comp: <Lock />,
    name: 'Lock',
  },
  {
    comp: <ToolbarVip />,
    name: 'ToolbarVip',
  },
  {
    comp: <ScheduleAddContactGray />,
    name: 'ScheduleAddContactGray',
  },
  {
    comp: <BottomDeleteHover />,
    name: 'BottomDeleteHover',
  },
  {
    comp: <ModalCloseTemp />,
    name: 'ModalCloseTemp',
  },
  {
    comp: <SubmenuRight />,
    name: 'SubmenuRight',
  },
  {
    comp: <MailBottomDeleteAll />,
    name: 'MailBottomDeleteAll',
  },
  {
    comp: <AddMedal />,
    name: 'AddMedal',
  },
  {
    comp: <MailFloder />,
    name: 'MailFloder',
  },
  {
    comp: <MailReply />,
    name: 'MailReply',
  },
  {
    comp: <MailRecycle />,
    name: 'MailRecycle',
  },
  {
    comp: <MailTop />,
    name: 'MailTop',
  },
  {
    comp: <TnverifyFolder />,
    name: 'TnverifyFolder',
  },
  {
    comp: <RelatedMail />,
    name: 'RelatedMail',
  },
  {
    comp: <Tag />,
    name: 'Tag',
  },
  {
    comp: <AddFolder />,
    name: 'AddFolder',
  },
  {
    comp: <MailReceiveFolder />,
    name: 'MailReceiveFolder',
  },
  {
    comp: <MailQuestion />,
    name: 'MailQuestion',
  },
  {
    comp: <IconAccount />,
    name: 'IconAccount',
  },
  {
    comp: <MailIconClose />,
    name: 'MailIconClose',
  },
  {
    comp: <MailArrowRight />,
    name: 'MailArrowRight',
  },
  {
    comp: <MailBottomRead />,
    name: 'MailBottomRead',
  },
  {
    comp: <ErrorIcon />,
    name: 'ErrorIcon',
  },
  {
    comp: <MailFlag />,
    name: 'MailFlag',
  },
  {
    comp: <AddMemberSHover />,
    name: 'AddMemberSHover',
  },
  {
    comp: <IconClose1 />,
    name: 'IconClose1',
  },
  {
    comp: <MailRedFlag />,
    name: 'MailRedFlag',
  },
  {
    comp: <TaskMail />,
    name: 'TaskMail',
  },
  {
    comp: <IconClose2 />,
    name: 'IconClose2',
  },
  {
    comp: <MailBottomMove />,
    name: 'MailBottomMove',
  },
  {
    comp: <IconDelete />,
    name: 'IconDelete',
  },
  {
    comp: <ConferenceIcon />,
    name: 'ConferenceIcon',
  },
  {
    comp: <PraiseIcon />,
    name: 'PraiseIcon',
  },
  {
    comp: <AddMedalHover />,
    name: 'AddMedalHover',
  },
  {
    comp: <MailTag />,
    name: 'MailTag',
  },
  {
    comp: <MailMore />,
    name: 'MailMore',
  },
  {
    comp: <MailDraftFolder />,
    name: 'MailDraftFolder',
  },
  {
    comp: <MailJunkFolder />,
    name: 'MailJunkFolder',
  },
  {
    comp: <MailEdit />,
    name: 'MailEdit',
  },
  {
    comp: <PreferredSet />,
    name: 'PreferredSet',
  },
  {
    comp: <TaskFolder />,
    name: 'TaskFolder',
  },
  {
    comp: <MailTransmit />,
    name: 'MailTransmit',
  },
  {
    comp: <PreferredActive />,
    name: 'PreferredActive',
  },
  {
    comp: <Preferred />,
    name: 'Preferred',
  },
  {
    comp: <MailFlagFolder />,
    name: 'MailFlagFolder',
  },
  {
    comp: <MailIconAdd />,
    name: 'MailIconAdd',
  },
  {
    comp: <MailSendFolder />,
    name: 'MailSendFolder',
  },
  {
    comp: <MailDeleteTag />,
    name: 'MailDeleteTag',
  },
  {
    comp: <MailArrowLeft />,
    name: 'MailArrowLeft',
  },
  {
    comp: <MailReplyAll />,
    name: 'MailReplyAll',
  },
  {
    comp: <AdvancedSearchHover />,
    name: 'AdvancedSearchHover',
  },
  {
    comp: <AttachmentPin />,
    name: 'AttachmentPin',
  },
  {
    comp: <AddMemberS />,
    name: 'AddMemberS',
  },
  {
    comp: <MailVerifyFolder />,
    name: 'MailVerifyFolder',
  },
  {
    comp: <MailBottomFlag />,
    name: 'MailBottomFlag',
  },
  {
    comp: <IconEdit />,
    name: 'IconEdit',
  },
  {
    comp: <MailRecoverFolder />,
    name: 'MailRecoverFolder',
  },
  {
    comp: <MailUntop />,
    name: 'MailUntop',
  },
  {
    comp: <AdvancedSearch />,
    name: 'AdvancedSearch',
  },
  {
    comp: <AdFolder />,
    name: 'AdFolder',
  },
  {
    comp: <SpamAlertIcon />,
    name: 'SpamAlertIcon',
  },
  {
    comp: <AlertClose />,
    name: 'AlertClose',
  },
  {
    comp: <AlertWarn />,
    name: 'AlertWarn',
  },
  {
    comp: <AlertSuccess />,
    name: 'AlertSuccess',
  },
  {
    comp: <Error />,
    name: 'Error',
  },
  {
    comp: <Calender />,
    name: 'Calender',
  },
  {
    comp: <ReplyMuti />,
    name: 'ReplyMuti',
  },
  {
    comp: <SubmenuLeft />,
    name: 'SubmenuLeft',
  },
  {
    comp: <IconClose />,
    name: 'IconClose',
  },
  {
    comp: <CheckboxNormal />,
    name: 'CheckboxNormal',
  },
  {
    comp: <ArrowRight />,
    name: 'ArrowRight',
  },
  {
    comp: <RcptSucc />,
    name: 'RcptSucc',
  },
  {
    comp: <Group />,
    name: 'Group',
  },
  {
    comp: <MediaWhite />,
    name: 'MediaWhite',
  },
  {
    comp: <ToolbarDownloadIcon />,
    name: 'ToolbarDownloadIcon',
  },
  {
    comp: <ClearOut />,
    name: 'ClearOut',
  },
  {
    comp: <BottomRead />,
    name: 'BottomRead',
  },
  {
    comp: <RadioChecked />,
    name: 'RadioChecked',
  },
  {
    comp: <Expand />,
    name: 'Expand',
  },
  {
    comp: <OkText />,
    name: 'OkText',
  },
  {
    comp: <BackToTopNew />,
    name: 'BackToTopNew',
  },
  {
    comp: <UploadPlusThin />,
    name: 'UploadPlusThin',
  },
  {
    comp: <MailRefresh />,
    name: 'MailRefresh',
  },
  {
    comp: <SendMailIcon />,
    name: 'SendMailIcon',
  },
  {
    comp: <CloseCircle />,
    name: 'CloseCircle',
  },
  {
    comp: <MailOther />,
    name: 'MailOther',
  },
  {
    comp: <TranslateIconTrue />,
    name: 'TranslateIconTrue',
  },
  {
    comp: <Collapse />,
    name: 'Collapse',
  },
  {
    comp: <CloseModal />,
    name: 'CloseModal',
  },
  {
    comp: <Xiala />,
    name: 'Xiala',
  },
  {
    comp: <MailIcon />,
    name: 'MailIcon',
  },
  {
    comp: <Flag />,
    name: 'Flag',
  },
  {
    comp: <SearchHover />,
    name: 'SearchHover',
  },
  {
    comp: <MailExchange />,
    name: 'MailExchange',
  },
  {
    comp: <ToolbarWindowsMask />,
    name: 'ToolbarWindowsMask',
  },
  {
    comp: <DefaultTeamAvatar />,
    name: 'DefaultTeamAvatar',
  },
  {
    comp: <Plus />,
    name: 'Plus',
  },
  {
    comp: <SendBtn />,
    name: 'SendBtn',
  },
  {
    comp: <RedFlag />,
    name: 'RedFlag',
  },
  {
    comp: <CheckboxDisabled />,
    name: 'CheckboxDisabled',
  },
  {
    comp: <BottomUnread />,
    name: 'BottomUnread',
  },
  {
    comp: <ExitIcon />,
    name: 'ExitIcon',
  },
  {
    comp: <ProductIconTrue />,
    name: 'ProductIconTrue',
  },
  {
    comp: <CloseSimp />,
    name: 'CloseSimp',
  },
  {
    comp: <TriangleDown />,
    name: 'TriangleDown',
  },
  {
    comp: <Comma />,
    name: 'Comma',
  },
  {
    comp: <Timeoutdone />,
    name: 'Timeoutdone',
  },
  {
    comp: <Two />,
    name: 'Two',
  },
  {
    comp: <Ontime />,
    name: 'Ontime',
  },
  {
    comp: <Timeout />,
    name: 'Timeout',
  },
  {
    comp: <Tnineteen />,
    name: 'Tnineteen',
  },
  {
    comp: <Nine />,
    name: 'Nine',
  },
  {
    comp: <Not />,
    name: 'Not',
  },
  {
    comp: <Nineteen />,
    name: 'Nineteen',
  },
  {
    comp: <None />,
    name: 'None',
  },
  {
    comp: <Ontimedone />,
    name: 'Ontimedone',
  },
  {
    comp: <One />,
    name: 'One',
  },
  {
    comp: <Other />,
    name: 'Other',
  },
  {
    comp: <WithdrawFail />,
    name: 'WithdrawFail',
  },
  {
    comp: <RadioArrowUp />,
    name: 'RadioArrowUp',
  },
  {
    comp: <ArrowRight1 />,
    name: 'ArrowRight1',
  },
  {
    comp: <DeleteCircle />,
    name: 'DeleteCircle',
  },
  {
    comp: <IconWarningRed />,
    name: 'IconWarningRed',
  },
  {
    comp: <StepFinishIcon />,
    name: 'StepFinishIcon',
  },
  {
    comp: <Persons />,
    name: 'Persons',
  },
  {
    comp: <EdmCloseIcon />,
    name: 'EdmCloseIcon',
  },
  {
    comp: <AppendName />,
    name: 'AppendName',
  },
  {
    comp: <PushnumBlue />,
    name: 'PushnumBlue',
  },
  {
    comp: <OpenseaMenu />,
    name: 'OpenseaMenu',
  },
  {
    comp: <EdmBlacklistMenu />,
    name: 'EdmBlacklistMenu',
  },
  {
    comp: <IconEntryArrow />,
    name: 'IconEntryArrow',
  },
  {
    comp: <CalendarBlue />,
    name: 'CalendarBlue',
  },
  {
    comp: <Polygon />,
    name: 'Polygon',
  },
  {
    comp: <EdmDeleteIcon />,
    name: 'EdmDeleteIcon',
  },
  {
    comp: <UnionIcon />,
    name: 'UnionIcon',
  },
  {
    comp: <MailSmall />,
    name: 'MailSmall',
  },
  {
    comp: <User />,
    name: 'User',
  },
  {
    comp: <WhatsAppMessageMenu />,
    name: 'whatsAppMessageMenu',
  },
  {
    comp: <IconOpenSeaFilter />,
    name: 'IconOpenSeaFilter',
  },
  {
    comp: <TemplateGroupGroup />,
    name: 'TemplateGroupGroup',
  },
  {
    comp: <CardExpand />,
    name: 'CardExpand',
  },
  {
    comp: <CustomerListMenu />,
    name: 'CustomerListMenu',
  },
  {
    comp: <DeleteIconBig />,
    name: 'DeleteIconBig',
  },
  {
    comp: <MobileIcon />,
    name: 'MobileIcon',
  },
  {
    comp: <Country />,
    name: 'Country',
  },
  {
    comp: <DrawerFold />,
    name: 'DrawerFold',
  },
  {
    comp: <EdmQuestion />,
    name: 'EdmQuestion',
  },
  {
    comp: <AlertRed />,
    name: 'AlertRed',
  },
  {
    comp: <CloudUpload />,
    name: 'CloudUpload',
  },
  {
    comp: <EmailRecive />,
    name: 'EmailRecive',
  },
  {
    comp: <WhatsAppJobMenu />,
    name: 'WhatsAppJobMenu',
  },
  {
    comp: <CloseIconBorder />,
    name: 'CloseIconBorder',
  },
  {
    comp: <MoreAction />,
    name: 'MoreAction',
  },
  {
    comp: <TableSetting />,
    name: 'TableSetting',
  },
  {
    comp: <TemplateGroupManage />,
    name: 'TemplateGroupManage',
  },
  {
    comp: <KeywordInfo />,
    name: 'KeywordInfo',
  },
  {
    comp: <KeywordLang />,
    name: 'KeywordLang',
  },
  {
    comp: <UnsubscribeTip />,
    name: 'UnsubscribeTip',
  },
  {
    comp: <RangeDate />,
    name: 'RangeDate',
  },
  {
    comp: <DraftListMenu />,
    name: 'DraftListMenu',
  },
  {
    comp: <GlobalSearchP2 />,
    name: 'GlobalSearchP2',
  },
  {
    comp: <ExtensionMenu />,
    name: 'ExtensionMenu',
  },
  {
    comp: <TemplateGroupDown />,
    name: 'TemplateGroupDown',
  },
  {
    comp: <ConfirmDelete />,
    name: 'ConfirmDelete',
  },
  {
    comp: <TipsIcon />,
    name: 'TipsIcon',
  },
  {
    comp: <GlobalSearchP1 />,
    name: 'GlobalSearchP1',
  },
  {
    comp: <AlertBlue />,
    name: 'AlertBlue',
  },
  {
    comp: <EdmStatisticsMenu />,
    name: 'EdmStatisticsMenu',
  },
  {
    comp: <SearchClose />,
    name: 'SearchClose',
  },
  {
    comp: <TemplateGroupDelete />,
    name: 'TemplateGroupDelete',
  },
  {
    comp: <Check />,
    name: 'Check',
  },
  {
    comp: <Warning />,
    name: 'Warning',
  },
  {
    comp: <EdmInfo />,
    name: 'EdmInfo',
  },
  {
    comp: <IconSuccess />,
    name: 'IconSuccess',
  },
  {
    comp: <IconCustomerFilter />,
    name: 'IconCustomerFilter',
  },
  {
    comp: <Add />,
    name: 'Add',
  },
  {
    comp: <DocumentIcon />,
    name: 'DocumentIcon',
  },
  {
    comp: <CaretDownOutlined />,
    name: 'CaretDownOutlined',
  },
  {
    comp: <EdmCopy />,
    name: 'EdmCopy',
  },
  {
    comp: <TwitterLogo />,
    name: 'TwitterLogo',
  },
  {
    comp: <CardFold />,
    name: 'CardFold',
  },
  {
    comp: <SearchIcon />,
    name: 'SearchIcon',
  },
  {
    comp: <AlertError />,
    name: 'AlertError',
  },
  {
    comp: <IconPersonClueFilter />,
    name: 'IconPersonClueFilter',
  },
  {
    comp: <Send />,
    name: 'Send',
  },
  {
    comp: <DataTransferMenu />,
    name: 'DataTransferMenu',
  },
  {
    comp: <ArriveCount />,
    name: 'ArriveCount',
  },
  {
    comp: <HolidayGreeting />,
    name: 'HolidayGreeting',
  },
  {
    comp: <EmailSourceCustom />,
    name: 'EmailSourceCustom',
  },
  {
    comp: <EmailSourceEdm />,
    name: 'EmailSourceEdm',
  },
  {
    comp: <Mail />,
    name: 'Mail',
  },
  {
    comp: <ExecCount />,
    name: 'ExecCount',
  },
  {
    comp: <CustomProcess />,
    name: 'CustomProcess',
  },
  {
    comp: <PotentialContact />,
    name: 'PotentialContact',
  },
  {
    comp: <Email />,
    name: 'Email',
  },
  {
    comp: <AutoMarketAdd />,
    name: 'AutoMarketAdd',
  },
  {
    comp: <AutoMarketClose />,
    name: 'AutoMarketClose',
  },
  {
    comp: <Subtract />,
    name: 'Subtract',
  },
  {
    comp: <TriggerCount />,
    name: 'TriggerCount',
  },
  {
    comp: <PreviousContact />,
    name: 'PreviousContact',
  },
  {
    comp: <AutoMarketMore />,
    name: 'AutoMarketMore',
  },
  {
    comp: <ReplyCount />,
    name: 'ReplyCount',
  },
  {
    comp: <Clue />,
    name: 'Clue',
  },
  {
    comp: <UnsubscribeCount />,
    name: 'UnsubscribeCount',
  },
  {
    comp: <AutoMarketDelete />,
    name: 'AutoMarketDelete',
  },
  {
    comp: <AutoMarketSuccess />,
    name: 'AutoMarketSuccess',
  },
  {
    comp: <SendCount />,
    name: 'SendCount',
  },
  {
    comp: <Date />,
    name: 'Date',
  },
  {
    comp: <ReadCount />,
    name: 'ReadCount',
  },
  {
    comp: <AutoMarketCustomer />,
    name: 'AutoMarketCustomer',
  },
  {
    comp: <UpLine />,
    name: 'UpLine',
  },
  {
    comp: <WhatsAppTemplateMenu />,
    name: 'WhatsAppTemplateMenu',
  },
  {
    comp: <PcIcon />,
    name: 'PcIcon',
  },
  {
    comp: <EdmCamera />,
    name: 'EdmCamera',
  },
  {
    comp: <Separator />,
    name: 'Separator',
  },
  {
    comp: <AlertIcon />,
    name: 'AlertIcon',
  },
  {
    comp: <SendboxMenu />,
    name: 'SendboxMenu',
  },
  {
    comp: <Admin />,
    name: 'Admin',
  },
  {
    comp: <ReplyBlue />,
    name: 'ReplyBlue',
  },
  {
    comp: <Ok />,
    name: 'Ok',
  },
  {
    comp: <EmailscoreSuccess />,
    name: 'EmailscoreSuccess',
  },
  {
    comp: <AlertLevel1 />,
    name: 'AlertLevel1',
  },
  {
    comp: <AlertLevel2 />,
    name: 'AlertLevel2',
  },
  {
    comp: <AlertLevel3 />,
    name: 'AlertLevel3',
  },
  {
    comp: <PhoneSmall />,
    name: 'PhoneSmall',
  },
  {
    comp: <MenuExpand />,
    name: 'MenuExpand',
  },
  {
    comp: <Sortable />,
    name: 'Sortable',
  },
  {
    comp: <EmailSend />,
    name: 'EmailSend',
  },
  {
    comp: <MailTemplate />,
    name: 'MailTemplate',
  },
  {
    comp: <PageClose />,
    name: 'PageClose',
  },
  {
    comp: <Star />,
    name: 'Star',
  },
  {
    comp: <DataBlue />,
    name: 'DataBlue',
  },
  {
    comp: <BusinessMenu />,
    name: 'BusinessMenu',
  },
  {
    comp: <LoadMore />,
    name: 'LoadMore',
  },
  {
    comp: <TemplateGroupLeft />,
    name: 'TemplateGroupLeft',
  },
  {
    comp: <DownOutlined />,
    name: 'DownOutlined',
  },
  {
    comp: <MenuFold />,
    name: 'MenuFold',
  },
  {
    comp: <IconWarnning />,
    name: 'IconWarnning',
  },
  {
    comp: <MapStatusSuccess />,
    name: 'MapStatusSuccess',
  },
  {
    comp: <RbacIcon />,
    name: 'RbacIcon',
  },
  {
    comp: <SendBlue />,
    name: 'SendBlue',
  },
  {
    comp: <EdmDelete />,
    name: 'EdmDelete',
  },
  {
    comp: <CustomerOpenseaMenu />,
    name: 'CustomerOpenseaMenu',
  },
  {
    comp: <LocationSmall />,
    name: 'LocationSmall',
  },
  {
    comp: <AddRole />,
    name: 'AddRole',
  },
  {
    comp: <Mail6 />,
    name: 'Mail6',
  },
  {
    comp: <BusinessStart />,
    name: 'BusinessStart',
  },
  {
    comp: <Mail4 />,
    name: 'Mail4',
  },
  {
    comp: <SendSuccess />,
    name: 'SendSuccess',
  },
  {
    comp: <TemplateGroupAdd />,
    name: 'TemplateGroupAdd',
  },
  {
    comp: <TemplateGroupBack />,
    name: 'TemplateGroupBack',
  },
  {
    comp: <KeywordSubSync />,
    name: 'KeywordSubSync',
  },
  {
    comp: <Filter />,
    name: 'Filter',
  },
  {
    comp: <CustomsFavorMenu />,
    name: 'CustomsFavorMenu',
  },
  {
    comp: <RemoveIcon />,
    name: 'RemoveIcon',
  },
  {
    comp: <CustomsMenu />,
    name: 'CustomsMenu',
  },
  {
    comp: <ClientCombine />,
    name: 'ClientCombine',
  },
  {
    comp: <CustomerLabelMenu />,
    name: 'CustomerLabelMenu',
  },
  {
    comp: <AutoMarket />,
    name: 'AutoMarket',
  },
  {
    comp: <FacebookLogo />,
    name: 'FacebookLogo',
  },
  {
    comp: <Mail5 />,
    name: 'Mail5',
  },
  {
    comp: <BusinessClose />,
    name: 'BusinessClose',
  },
  {
    comp: <DefaultAvartar />,
    name: 'DefaultAvartar',
  },
  {
    comp: <Mail1 />,
    name: 'Mail1',
  },
  {
    comp: <EnterpriseIcon />,
    name: 'EnterpriseIcon',
  },
  {
    comp: <Logo />,
    name: 'Logo',
  },
  {
    comp: <EdmInfoBlueFill />,
    name: 'EdmInfoBlueFill',
  },
  {
    comp: <Confirm />,
    name: 'Confirm',
  },
  {
    comp: <MapStatusError />,
    name: 'MapStatusError',
  },
  {
    comp: <NewIcon />,
    name: 'NewIcon',
  },
  {
    comp: <TemplateGroupEdit />,
    name: 'TemplateGroupEdit',
  },
  {
    comp: <TemplateGroupRight />,
    name: 'TemplateGroupRight',
  },
  {
    comp: <Mail2 />,
    name: 'Mail2',
  },
  {
    comp: <EdmAlertClose />,
    name: 'EdmAlertClose',
  },
  {
    comp: <GlobalNotice />,
    name: 'GlobalNotice',
  },
  {
    comp: <WhatsappActive />,
    name: 'WhatsappActive',
  },
  {
    comp: <InstagramActive />,
    name: 'InstagramActive',
  },
  {
    comp: <TelegramActive />,
    name: 'TelegramActive',
  },
  {
    comp: <Instagram />,
    name: 'Instagram',
  },
  {
    comp: <Telegram />,
    name: 'Telegram',
  },
  {
    comp: <Facebook />,
    name: 'Facebook',
  },
  {
    comp: <Whatsapp />,
    name: 'Whatsapp',
  },
  {
    comp: <FacebookActive />,
    name: 'FacebookActive',
  },
  {
    comp: <Twitter />,
    name: 'Twitter',
  },
  {
    comp: <TwitterActive />,
    name: 'TwitterActive',
  },
  {
    comp: <InsLogo />,
    name: 'InsLogo',
  },
  {
    comp: <ClueListMenu />,
    name: 'ClueListMenu',
  },
  {
    comp: <LinkTrace />,
    name: 'LinkTrace',
  },
  {
    comp: <MoreTabs />,
    name: 'MoreTabs',
  },
  {
    comp: <TemplateGroupClose />,
    name: 'TemplateGroupClose',
  },
  {
    comp: <Mail3 />,
    name: 'Mail3',
  },
  {
    comp: <AboutIcon />,
    name: 'AboutIcon',
  },
  {
    comp: <UpdateIcon />,
    name: 'UpdateIcon',
  },
  {
    comp: <PerSettingIcon />,
    name: 'PerSettingIcon',
  },
  {
    comp: <AccountIcon />,
    name: 'AccountIcon',
  },
  {
    comp: <BackendIcon />,
    name: 'BackendIcon',
  },
  {
    comp: <ProductIcon />,
    name: 'ProductIcon',
  },
  {
    comp: <FeedbackIcon />,
    name: 'FeedbackIcon',
  },
  {
    comp: <CounselorIcon />,
    name: 'CounselorIcon',
  },
  {
    comp: <ScheduleAddContact />,
    name: 'ScheduleAddContact',
  },
  {
    comp: <Copy />,
    name: 'Copy',
  },
  {
    comp: <BottomMove />,
    name: 'BottomMove',
  },
  {
    comp: <CommonSearch />,
    name: 'CommonSearch',
  },
  {
    comp: <CommonAddMember />,
    name: 'CommonAddMember',
  },
  {
    comp: <SyncHover />,
    name: 'SyncHover',
  },
  {
    comp: <CommonDeleteIcon />,
    name: 'CommonDeleteIcon',
  },
  {
    comp: <CommonArrowLeft />,
    name: 'CommonArrowLeft',
  },
  {
    comp: <AddMemberHover />,
    name: 'AddMemberHover',
  },
  {
    comp: <CommonSearchHover />,
    name: 'CommonSearchHover',
  },
  {
    comp: <Close />,
    name: 'Close',
  },
  {
    comp: <Loading />,
    name: 'Loading',
  },
  {
    comp: <TooltipArrows />,
    name: 'TooltipArrows',
  },
  {
    comp: <CommonSync />,
    name: 'CommonSync',
  },
  {
    comp: <Sync />,
    name: 'Sync',
  },
  {
    comp: <Word />,
    name: 'Word',
  },
  {
    comp: <Back />,
    name: 'Back',
  },
  {
    comp: <SaveAsTemplate />,
    name: 'SaveAsTemplate',
  },
  {
    comp: <CloseIcon />,
    name: 'CloseIcon',
  },
  {
    comp: <AlertSuc />,
    name: 'AlertSuc',
  },
  {
    comp: <ListAlert />,
    name: 'ListAlert',
  },
  {
    comp: <ImIconEnhance />,
    name: 'ImIconEnhance',
  },
  {
    comp: <AdTagAdvert />,
    name: 'AdTagAdvert',
  },
  {
    comp: <UploadVideo />,
    name: 'UploadVideo',
  },
  {
    comp: <ReplyFull />,
    name: 'ReplyFull',
  },
  {
    comp: <S />,
    name: 'S',
  },
  {
    comp: <TimeIcon />,
    name: 'TimeIcon',
  },
  {
    comp: <CloseBtn />,
    name: 'CloseBtn',
  },
  {
    comp: <Camera />,
    name: 'Camera',
  },
  {
    comp: <BottomDelete />,
    name: 'BottomDelete',
  },
  {
    comp: <Warn />,
    name: 'Warn',
  },
  {
    comp: <Amplification />,
    name: 'Amplification',
  },
  {
    comp: <CloseTooltips />,
    name: 'CloseTooltips',
  },
  {
    comp: <More />,
    name: 'More',
  },
  {
    comp: <OrgIcon />,
    name: 'OrgIcon',
  },
  {
    comp: <Media />,
    name: 'Media',
  },
  {
    comp: <Mail163 />,
    name: 'Mail163',
  },
  {
    comp: <AttachOrange />,
    name: 'AttachOrange',
  },
  {
    comp: <MailQq />,
    name: 'MailQq',
  },
  {
    comp: <ArrowExpandGray />,
    name: 'ArrowExpandGray',
  },
  {
    comp: <CloseMail />,
    name: 'CloseMail',
  },
  {
    comp: <DeleteIcon />,
    name: 'DeleteIcon',
  },
  {
    comp: <Mark />,
    name: 'Mark',
  },
  {
    comp: <DraftFolder />,
    name: 'DraftFolder',
  },
  {
    comp: <Template />,
    name: 'Template',
  },
  {
    comp: <MailSetting />,
    name: 'MailSetting',
  },
  {
    comp: <JunkFolder />,
    name: 'JunkFolder',
  },
  {
    comp: <Edit />,
    name: 'Edit',
  },
  {
    comp: <Browser />,
    name: 'Browser',
  },
  {
    comp: <Next />,
    name: 'Next',
  },
  {
    comp: <CalenderChecked />,
    name: 'CalenderChecked',
  },
  {
    comp: <Pdf />,
    name: 'Pdf',
  },
  {
    comp: <AboudIcon />,
    name: 'AboudIcon',
  },
  {
    comp: <Ppt />,
    name: 'Ppt',
  },
  {
    comp: <Transmit />,
    name: 'Transmit',
  },
  {
    comp: <Discuss />,
    name: 'Discuss',
  },
  {
    comp: <ErrorMark />,
    name: 'ErrorMark',
  },
  {
    comp: <OptionSelected />,
    name: 'OptionSelected',
  },
  {
    comp: <DiskFold />,
    name: 'DiskFold',
  },
  {
    comp: <ExternalAccounts />,
    name: 'ExternalAccounts',
  },
  {
    comp: <Doc />,
    name: 'Doc',
  },
  {
    comp: <PackUp />,
    name: 'PackUp',
  },
  {
    comp: <DiskArrowLeft />,
    name: 'DiskArrowLeft',
  },
  {
    comp: <Link />,
    name: 'Link',
  },
  {
    comp: <Rename />,
    name: 'Rename',
  },
  {
    comp: <Recover />,
    name: 'Recover',
  },
  {
    comp: <Download />,
    name: 'Download',
  },
  {
    comp: <NotificationNoticeBg />,
    name: 'NotificationNoticeBg',
  },
  {
    comp: <Continue />,
    name: 'Continue',
  },
  {
    comp: <Retry />,
    name: 'Retry',
  },
  {
    comp: <ExternalLink />,
    name: 'ExternalLink',
  },
  {
    comp: <UploadBtn />,
    name: 'UploadBtn',
  },
  {
    comp: <Info />,
    name: 'Info',
  },
  {
    comp: <TabDelete />,
    name: 'TabDelete',
  },
  {
    comp: <ExternalDownload />,
    name: 'ExternalDownload',
  },
  {
    comp: <NotificationThumbUp />,
    name: 'NotificationThumbUp',
  },
  {
    comp: <DiskDelete />,
    name: 'DiskDelete',
  },
  {
    comp: <NotificationThumbUpHighlight />,
    name: 'NotificationThumbUpHighlight',
  },
  {
    comp: <View />,
    name: 'View',
  },
  {
    comp: <NotificationClose />,
    name: 'NotificationClose',
  },
  {
    comp: <DiskPause />,
    name: 'DiskPause',
  },
  {
    comp: <AddFile />,
    name: 'AddFile',
  },
  {
    comp: <Excel />,
    name: 'Excel',
  },
  {
    comp: <Unfold />,
    name: 'Unfold',
  },
  {
    comp: <MulTable />,
    name: 'MulTable',
  },
  {
    comp: <Done />,
    name: 'Done',
  },
  {
    comp: <Block />,
    name: 'Block',
  },
  {
    comp: <ExternalVisit />,
    name: 'ExternalVisit',
  },
  {
    comp: <UsingBrowser />,
    name: 'UsingBrowser',
  },
  {
    comp: <ImportDoc />,
    name: 'ImportDoc',
  },
  {
    comp: <CopyHover />,
    name: 'CopyHover',
  },
  {
    comp: <MsgRemove />,
    name: 'MsgRemove',
  },
  {
    comp: <OpenRight />,
    name: 'OpenRight',
  },
  {
    comp: <AddPeopleIcon />,
    name: 'AddPeopleIcon',
  },
  {
    comp: <QuitHover />,
    name: 'QuitHover',
  },
  {
    comp: <LxSysAvatar />,
    name: 'LxSysAvatar',
  },
  {
    comp: <ImRecycle />,
    name: 'ImRecycle',
  },
  {
    comp: <HappyIcon />,
    name: 'HappyIcon',
  },
  {
    comp: <MsgHistoryIcon />,
    name: 'MsgHistoryIcon',
  },
  {
    comp: <Uploading />,
    name: 'Uploading',
  },
  {
    comp: <Clear />,
    name: 'Clear',
  },
  {
    comp: <MsgDeal />,
    name: 'MsgDeal',
  },
  {
    comp: <AnnoSelected />,
    name: 'AnnoSelected',
  },
  {
    comp: <ReplyCloseIcon />,
    name: 'ReplyCloseIcon',
  },
  {
    comp: <WhiteClose />,
    name: 'WhiteClose',
  },
  {
    comp: <Quit />,
    name: 'Quit',
  },
  {
    comp: <ReadedRectorIcon />,
    name: 'ReadedRectorIcon',
  },
  {
    comp: <Stop />,
    name: 'Stop',
  },
  {
    comp: <ForwardDisable />,
    name: 'ForwardDisable',
  },
  {
    comp: <DeleteDisable />,
    name: 'DeleteDisable',
  },
  {
    comp: <Team />,
    name: 'Team',
  },
  {
    comp: <TeamDefaultPurple />,
    name: 'TeamDefaultPurple',
  },
  {
    comp: <ImCopy />,
    name: 'ImCopy',
  },
  {
    comp: <MsgDealed />,
    name: 'MsgDealed',
  },
  {
    comp: <TeamAvatar />,
    name: 'TeamAvatar',
  },
  {
    comp: <UploadError />,
    name: 'UploadError',
  },
  {
    comp: <Setting />,
    name: 'Setting',
  },
  {
    comp: <DeleteHover />,
    name: 'DeleteHover',
  },
  {
    comp: <Anno />,
    name: 'Anno',
  },
  {
    comp: <AddMembersSelected />,
    name: 'AddMembersSelected',
  },
  {
    comp: <TeamDefaultGreen />,
    name: 'TeamDefaultGreen',
  },
  {
    comp: <AddIconHover />,
    name: 'AddIconHover',
  },
  {
    comp: <AddIcon />,
    name: 'AddIcon',
  },
  {
    comp: <DiscussGroup />,
    name: 'DiscussGroup',
  },
  {
    comp: <TeamDefaultBlue />,
    name: 'TeamDefaultBlue',
  },
  {
    comp: <MsgLoadingIcon />,
    name: 'MsgLoadingIcon',
  },
  {
    comp: <Delete />,
    name: 'Delete',
  },
  {
    comp: <SettingSelected />,
    name: 'SettingSelected',
  },
  {
    comp: <ImAddSchedule />,
    name: 'ImAddSchedule',
  },
  {
    comp: <ImgFallback />,
    name: 'ImgFallback',
  },
  {
    comp: <FileIcon />,
    name: 'FileIcon',
  },
  {
    comp: <ForwardHover />,
    name: 'ForwardHover',
  },
  {
    comp: <Pause />,
    name: 'Pause',
  },
  {
    comp: <Forward />,
    name: 'Forward',
  },
  {
    comp: <MsgLater />,
    name: 'MsgLater',
  },
  {
    comp: <AddMembers />,
    name: 'AddMembers',
  },
  {
    comp: <TeamDefaultOrange />,
    name: 'TeamDefaultOrange',
  },
  {
    comp: <ReplyWhite />,
    name: 'ReplyWhite',
  },
  {
    comp: <ProductIconFalse />,
    name: 'ProductIconFalse',
  },
  {
    comp: <Exit />,
    name: 'Exit',
  },
  {
    comp: <WithDrawHover />,
    name: 'WithDrawHover',
  },
  {
    comp: <ListGroup />,
    name: 'ListGroup',
  },
  {
    comp: <Descend />,
    name: 'Descend',
  },
  {
    comp: <MailBoxEnhance />,
    name: 'MailBoxEnhance',
  },
  {
    comp: <MessageLoading />,
    name: 'MessageLoading',
  },
  {
    comp: <FlagFolder />,
    name: 'FlagFolder',
  },
  {
    comp: <Pop />,
    name: 'Pop',
  },
  {
    comp: <AttachLarge />,
    name: 'AttachLarge',
  },
  {
    comp: <AlertFail />,
    name: 'AlertFail',
  },
  {
    comp: <ToolbarTriangleDown />,
    name: 'ToolbarTriangleDown',
  },
  {
    comp: <WarnYellow />,
    name: 'WarnYellow',
  },
  {
    comp: <Dropdown />,
    name: 'Dropdown',
  },
  {
    comp: <CalenderEnhance />,
    name: 'CalenderEnhance',
  },
  {
    comp: <ReplyAllWhite />,
    name: 'ReplyAllWhite',
  },
  {
    comp: <AccountSetting />,
    name: 'AccountSetting',
  },
  {
    comp: <ArrowExpand />,
    name: 'ArrowExpand',
  },
  {
    comp: <SendFolder />,
    name: 'SendFolder',
  },
  {
    comp: <ArrowRightWhite />,
    name: 'ArrowRightWhite',
  },
  {
    comp: <Attach />,
    name: 'Attach',
  },
  {
    comp: <RcptFail />,
    name: 'RcptFail',
  },
  {
    comp: <AccountExit />,
    name: 'AccountExit',
  },
  {
    comp: <KeyboardDelete />,
    name: 'KeyboardDelete',
  },
  {
    comp: <SuccessAccount />,
    name: 'SuccessAccount',
  },
  {
    comp: <LinkAccount />,
    name: 'LinkAccount',
  },
  {
    comp: <KeyboardTipIcon />,
    name: 'KeyboardTipIcon',
  },
  {
    comp: <SettingExit />,
    name: 'SettingExit',
  },
  {
    comp: <IconEyeOpen />,
    name: 'IconEyeOpen',
  },
  {
    comp: <ArrowLeft />,
    name: 'ArrowLeft',
  },
  {
    comp: <ReplyCircle />,
    name: 'ReplyCircle',
  },
  {
    comp: <ReplyAll />,
    name: 'ReplyAll',
  },
  {
    comp: <ContactModalClose />,
    name: 'ContactModalClose',
  },
  {
    comp: <MailMain />,
    name: 'MailMain',
  },
  {
    comp: <CheckboxChecked />,
    name: 'CheckboxChecked',
  },
  {
    comp: <DevicePcIcon />,
    name: 'DevicePcIcon',
  },
  {
    comp: <AccountSettingWhite />,
    name: 'AccountSettingWhite',
  },
  {
    comp: <VerifyFolder />,
    name: 'VerifyFolder',
  },
  {
    comp: <ToTop />,
    name: 'ToTop',
  },
  {
    comp: <BottomFlag />,
    name: 'BottomFlag',
  },
  {
    comp: <ModalCloseBtn />,
    name: 'ModalCloseBtn',
  },
  {
    comp: <StarGray />,
    name: 'StarGray',
  },
  {
    comp: <Brush />,
    name: 'Brush',
  },
  {
    comp: <CheckedCircle />,
    name: 'CheckedCircle',
  },
  {
    comp: <TagClose />,
    name: 'TagClose',
  },
  {
    comp: <BackToTop />,
    name: 'BackToTop',
  },
  {
    comp: <AdTagActivity />,
    name: 'AdTagActivity',
  },
  {
    comp: <IcsInvite />,
    name: 'IcsInvite',
  },
  {
    comp: <IcsRemark />,
    name: 'IcsRemark',
  },
  {
    comp: <IcsIconCatalog />,
    name: 'IcsIconCatalog',
  },
  {
    comp: <IcsTime />,
    name: 'IcsTime',
  },
  {
    comp: <IcsLocation />,
    name: 'IcsLocation',
  },
  {
    comp: <IcsIconRrule />,
    name: 'IcsIconRrule',
  },
  {
    comp: <IcsOrganize />,
    name: 'IcsOrganize',
  },
  {
    comp: <WhiteFlag />,
    name: 'WhiteFlag',
  },
  {
    comp: <DeviceMobileIcon />,
    name: 'DeviceMobileIcon',
  },
  {
    comp: <PartialWithdrawSucc />,
    name: 'PartialWithdrawSucc',
  },
  {
    comp: <ReplayedForwarded />,
    name: 'ReplayedForwarded',
  },
  {
    comp: <WifiClosed />,
    name: 'WifiClosed',
  },
  {
    comp: <ToolbarDownloadMacosMask />,
    name: 'ToolbarDownloadMacosMask',
  },
  {
    comp: <LoginBack />,
    name: 'LoginBack',
  },
  {
    comp: <LoginWarn />,
    name: 'LoginWarn',
  },
  {
    comp: <BackHover />,
    name: 'BackHover',
  },
  {
    comp: <Success />,
    name: 'Success',
  },
  {
    comp: <Xls />,
    name: 'Xls',
  },
  {
    comp: <ReplyFullActive />,
    name: 'ReplyFullActive',
  },
  {
    comp: <OpenEye />,
    name: 'OpenEye',
  },
  {
    comp: <CalendarIconCycle />,
    name: 'CalendarIconCycle',
  },
  {
    comp: <NewVersionClose />,
    name: 'NewVersionClose',
  },
  {
    comp: <ImIcon />,
    name: 'ImIcon',
  },
  {
    comp: <InfoCircle />,
    name: 'InfoCircle',
  },
  {
    comp: <WarningCircle />,
    name: 'WarningCircle',
  },
  {
    comp: <CreateJob />,
    name: 'CreateJob',
  },
  {
    comp: <ErrorCircle />,
    name: 'ErrorCircle',
  },
  {
    comp: <RecoverFolder />,
    name: 'RecoverFolder',
  },
  {
    comp: <Alarm />,
    name: 'Alarm',
  },
  {
    comp: <ArrowDown1 />,
    name: 'ArrowDown1',
  },
  {
    comp: <GreenDiscuss />,
    name: 'GreenDiscuss',
  },
  {
    comp: <IconWarnRed />,
    name: 'IconWarnRed',
  },
  {
    comp: <WithdrawSucc />,
    name: 'WithdrawSucc',
  },
  {
    comp: <NewSearch />,
    name: 'NewSearch',
  },
  {
    comp: <ToolbarComputer />,
    name: 'ToolbarComputer',
  },
  {
    comp: <IconWarn />,
    name: 'IconWarn',
  },
  {
    comp: <WebLogo />,
    name: 'WebLogo',
  },
  {
    comp: <AutoReplyWarn />,
    name: 'AutoReplyWarn',
  },
  {
    comp: <TranslateLoading />,
    name: 'TranslateLoading',
  },
  {
    comp: <IconMacMax />,
    name: 'IconMacMax',
  },
  {
    comp: <IconMacUnMax />,
    name: 'IconMacUnMax',
  },
  {
    comp: <IconMax />,
    name: 'IconMax',
  },
  {
    comp: <IconMinWhite />,
    name: 'IconMinWhite',
  },
  {
    comp: <ElectronIconClose />,
    name: 'ElectronIconClose',
  },
  {
    comp: <AboutClose />,
    name: 'AboutClose',
  },
  {
    comp: <IconMacClose />,
    name: 'IconMacClose',
  },
  {
    comp: <IconMacMin />,
    name: 'IconMacMin',
  },
  {
    comp: <IconCloseHover />,
    name: 'IconCloseHover',
  },
  {
    comp: <IconMaxWhite />,
    name: 'IconMaxWhite',
  },
  {
    comp: <IconMin />,
    name: 'IconMin',
  },
  {
    comp: <IconUnMax />,
    name: 'IconUnMax',
  },
  {
    comp: <IconUnMaxWhite />,
    name: 'IconUnMaxWhite',
  },
  {
    comp: <ElectronLogo />,
    name: 'ElectronLogo',
  },
  {
    comp: <Customer />,
    name: 'Customer',
  },
];

const Icons: React.FC = () => {
  return (
    <div className={styles.iconBox}>
      {iconList.map(i => {
        return (
          <div className={styles.iconItem}>
            <p className={styles.iconSvg}>{i.comp}</p>
            <Tooltip title={i.name}>
              <p className={styles.iconTxt}>{i.name}</p>
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
};

export default Icons;
