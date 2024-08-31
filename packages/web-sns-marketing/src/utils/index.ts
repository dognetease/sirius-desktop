import { mimeTypeToExts, getExtFromMimeType } from '@/components/Layout/SNS/mimeType';
import { SnsCalendarEvent, SnsMarketingMediaType, SnsMarketingPlatform, SnsPostCreateType, SnsPostStatus, SnsAccountInfoShort, SnsMarketingPost } from 'api';
import moment from 'moment';

export const getFileExt = (file: File) => {
  const mimeType = file.type as keyof typeof mimeTypeToExts;
  const ext = getExtFromMimeType(mimeType);

  if (ext === 'jpeg') return 'jpg';

  return ext;
};

export const getFileMediaType: (file: File) => SnsMarketingMediaType | null = file => {
  const ext = getFileExt(file);

  if (!ext) return null;

  if (['jpg', 'png', 'gif'].includes(ext)) {
    return SnsMarketingMediaType.IMAGE;
  }

  if (['mp4', 'mov'].includes(ext)) {
    return SnsMarketingMediaType.VIDEO;
  }

  return null;
};

export const getPostEditable = (postStatus: SnsPostStatus) =>
  [SnsPostStatus.FINISH_GENERATE, SnsPostStatus.FAILED_GENERATE, SnsPostStatus.WAITING, SnsPostStatus.PAUSE].includes(postStatus);

export const getPostCreatedByAi = (createType: SnsPostCreateType) =>
  [SnsPostCreateType.AI_INSTANT, SnsPostCreateType.AI_CRON, SnsPostCreateType.AI_TASK].includes(createType);

export const replacerLower = (match: string) => '_' + match.toLowerCase();

export const camelToPascal = (str: string) => str.replace(/[A-Z]/g, replacerLower);

export const encodeAccountsQuery = (accounts: SnsAccountInfoShort[]) => {
  const data = accounts.map(account => ({
    accountId: account.accountId,
    accountType: account.accountType,
    authorizeType: account.authorizeType,
    platform: account.platform,
  }));

  return encodeURIComponent(JSON.stringify(data));
};

export const decodeAccountsQuery = (accountsQuery: string) => {
  try {
    return JSON.parse(decodeURIComponent(accountsQuery)) as SnsAccountInfoShort[];
  } catch {
    return [];
  }
};

export const getNextCronTime = (time: number, minutes: number = 30) => {
  const incomeMoment = moment(time);
  const remainder = minutes - (incomeMoment.minutes() % minutes);
  const resultMoment = moment(incomeMoment).add(remainder, 'minutes').startOf('minute');

  return resultMoment.valueOf();
};

export interface SnsCalendarUiEvent {
  id: string;
  start: Date | number | string;
  title: string;
  extendedProps: SnsCalendarEvent;
}

export const transformToUiEvent = (events: SnsCalendarEvent[]): SnsCalendarUiEvent[] => {
  return events.map(item => ({
    id: item.postDbId,
    title: item.postContent,
    start: new Date(item.date),
    extendedProps: item,
  }));
};

export const getPlatformName = (platform: SnsMarketingPlatform) => {
  const map = {
    [SnsMarketingPlatform.FACEBOOK]: 'Facebook',
    [SnsMarketingPlatform.LINKEDIN]: 'LinkedIn',
    [SnsMarketingPlatform.INSTAGRAM]: 'Instagram',
  };
  return map[platform];
};

export const isEmpty = (obj: Record<string, any> | null | undefined) => {
  if (!obj) return true;
  const keys = Object.keys(obj);

  return keys.every(key => !obj[key]);
};

export const getPostsMapFromList = (list: SnsMarketingPost[]) =>
  list.reduce(
    (accumulator, item) => ({
      ...accumulator,
      [item.postDbId]: item,
    }),
    {} as Record<string, SnsMarketingPost>
  );
