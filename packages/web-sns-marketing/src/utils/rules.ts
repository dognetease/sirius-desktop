import { SnsMarketingPlatform } from 'api';

export interface SnsMarketingPostRule {
  textMaxLength: number;
  emojiSupport: boolean;
  topicSupport: boolean;
  imageTypes: string[];
  imageMaxCount: number;
  imageMaxSize: number;
  // imageMaxDescLength: number; // 图片描述字符数
  // gifMaxCount: number;
  // gifMaxSize: number;
  videoTypes: string[];
  videoMaxSize: number;
  videoMinDuration: number; // 视频最短时长 (秒)
  videoMaxDuration: number; // 视频最长时长 (秒)
  videoMaxCount: number;
  // videoMaxTitleLength: number; // 视频标题字符数
  // videoMaxDescLength: number; // 视频描述字符数
  // linkCoverSupport: boolean; // 自定义链接封面
  // linkTitleSupport: boolean; // 自定义链接标题
}

export const SNS_MARKETING_POST_RULES: Record<SnsMarketingPlatform, SnsMarketingPostRule> = {
  FACEBOOK: {
    textMaxLength: 63206,
    emojiSupport: true,
    topicSupport: true,
    imageTypes: ['jpg', 'png', 'gif'],
    imageMaxCount: 10,
    imageMaxSize: 5 * 1024 * 1024,
    // imageMaxDescLength: 63206,
    // gifMaxCount: 1,
    // gifMaxSize: 8 * 1024 * 1024,
    videoTypes: ['mp4', 'mov'],
    videoMaxSize: 512 * 1024 * 1024,
    videoMinDuration: 1,
    videoMaxDuration: 20 * 60,
    videoMaxCount: 1,
    // videoMaxTitleLength: 255,
    // videoMaxDescLength: 63206,
    // linkCoverSupport: false,
    // linkTitleSupport: false,
  },
  LINKEDIN: {
    textMaxLength: 3000,
    emojiSupport: true,
    topicSupport: true,
    imageTypes: ['jpg', 'png', 'gif'],
    imageMaxCount: 9,
    imageMaxSize: 5 * 1024 * 1024,
    // imageMaxDescLength: 3000,
    // gifMaxCount: 9,
    // gifMaxSize: 5 * 1024 * 1024,
    videoTypes: ['mp4', 'mov'],
    videoMaxSize: 512 * 1024 * 1024,
    videoMinDuration: 3,
    videoMaxDuration: 10 * 60,
    videoMaxCount: 1,
    // videoMaxTitleLength: Infinity,
    // videoMaxDescLength: 3000,
    // linkCoverSupport: true,
    // linkTitleSupport: true,
  },
  INSTAGRAM: {
    textMaxLength: 2200,
    emojiSupport: true,
    topicSupport: true,
    imageTypes: ['jpg', 'png'],
    imageMaxCount: 10,
    imageMaxSize: 5 * 1024 * 1024,
    // imageMaxDescLength: 2200,
    // gifMaxCount: 0,
    // gifMaxSize: 0,
    videoTypes: ['mp4', 'mov'],
    videoMaxSize: 100 * 1024 * 1024,
    videoMinDuration: 3,
    videoMaxDuration: 60, // 视频帖和快拍：60秒, Reels：15分钟
    videoMaxCount: 1,
    // videoMaxTitleLength: 0,
    // videoMaxDescLength: 2200, // 视频帖和 Reels：2200, 快拍：0
    // linkCoverSupport: false,
    // linkTitleSupport: false,
  },
};

const platforms = Object.keys(SNS_MARKETING_POST_RULES) as SnsMarketingPlatform[];

export const POST_RULE = platforms.reduce<SnsMarketingPostRule>((accumulator, platform) => {
  const current = SNS_MARKETING_POST_RULES[platform];

  // 处理 ts 的 recude 默认值，避免类型错误
  if (accumulator === null) return current;

  if (current.textMaxLength < accumulator.textMaxLength) {
    accumulator.textMaxLength = current.textMaxLength;
  }

  if (!current.emojiSupport) {
    accumulator.emojiSupport = false;
  }

  if (!current.topicSupport) {
    accumulator.topicSupport = false;
  }

  accumulator.imageTypes = accumulator.imageTypes.filter(type => {
    return current.imageTypes.includes(type);
  });

  if (current.imageMaxCount < accumulator.imageMaxCount) {
    accumulator.imageMaxCount = current.imageMaxCount;
  }

  if (current.imageMaxSize < accumulator.imageMaxSize) {
    accumulator.imageMaxSize = current.imageMaxSize;
  }

  if (current.videoMaxSize < accumulator.videoMaxSize) {
    accumulator.videoMaxSize = current.videoMaxSize;
  }

  if (current.videoMaxCount < accumulator.videoMaxCount) {
    accumulator.videoMaxCount = current.videoMaxCount;
  }

  if (current.videoMinDuration < accumulator.videoMinDuration) {
    accumulator.videoMinDuration = current.videoMinDuration;
  }

  if (current.videoMaxDuration < accumulator.videoMaxDuration) {
    accumulator.videoMaxDuration = current.videoMaxDuration;
  }

  accumulator.videoTypes = accumulator.videoTypes.filter(type => {
    return current.videoTypes.includes(type);
  });

  return accumulator;
}, null as unknown as SnsMarketingPostRule);
