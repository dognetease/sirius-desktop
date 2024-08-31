/**
 * 重要数据的不对称加密算法
 * @param m
 * @param e
 * @param rand
 * @param con
 */
export declare const rsaEncrypt: (m: string, e: string, rand: string, con: string) => any;
export declare const envStage: string | Function | string[];
export declare const ignoreLoginPath: string[];
export declare const reLoginCodeList: {
    FA_SECURITY: number;
    FA_INVALID_SESSION: number;
    FA_UNAUTHORIZED: number;
    NS_411: number;
    NF_401: number;
    NF_403: number;
    'ERR.SESSIONNULL': number;
    EXP_AUTH_COOKIE_TIMEOUT: number;
};
export declare type WinType = 'main' | 'writeMail' | 'login' | 'feedback' | 'about' | 'capture' | 'update' | 'customer' | 'imgPreviewPage' | 'attachment_preview' | 'readMailComb' | 'strangerMails' | 'readMail' | 'doc' | 'share' | 'sheet' | 'unitable' | 'scheduleOpPage' | 'resources' | 'mail' | 'im' | 'disk' | 'contact' | 'schedule' | 'kf' | 'bkInit' | 'bkLogin' | 'bkStable' | 'readMailReadOnly' | 'readOnlyUniversal' | 'addAccount' | 'changePwd' | 'cluePreview' | 'openSeaPreview' | 'customerPreview' | 'opportunityPreview' | 'iframePreview' | 'subAccountBg' | 'marketingDataViewer' | 'personalWhatsapp' | 'writeMailAttachmentPage' | 'scheduleReminder' | 'downloadReminder' | 'advertisingReminder';
