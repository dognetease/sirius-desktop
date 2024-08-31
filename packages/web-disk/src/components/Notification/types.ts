export enum ContentItemType {
  Text = 0,
  Link = 1,
  Image = 2,
}

export enum FooterActionType {
  ACK = 0, // 知道了，直接关闭
  Link = 1, // 链接跳转
  Like = 2, // 点赞
}

export interface ContentText {
  type: ContentItemType.Text;
  text: string;
}

export interface ContentLink {
  type: ContentItemType.Link;
  text: string;
  href: string;
}

export interface ContentImage {
  type: ContentItemType.Image;
  src: string;
  alt?: string;
  href?: string;
}

export interface ContentItem {
  id: number;
  type: ContentItemType;
  src?: string;
  alt?: string;
  text?: string;
  href?: string;
}

export interface NotificationConfigV1 {
  version: 1;
  payload: {
    title: string;
    closable: boolean;
    priority?: number;
    contentItemList: ContentItem[];
    footerActionType: FooterActionType;
    footerButtonText: string;
    footerButtonHref?: string;
  };
}
