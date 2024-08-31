import { LAYOUT_HEADER_HEIGHT, LAYOUT_TAG_HEIGHT } from './constants';

let isDirect = (page: string): boolean =>
  [
    'message',
    'mailbox',
    'lxContact',
    'schedule',
    'disk',
    'setting',
    // 'globalSearch',
    'worktable',
    'apps',
  ].includes(page);

let isIndirect = (page: string): boolean => !isDirect(page);

const getMainContOffsetTopHeight = () => {
  return LAYOUT_HEADER_HEIGHT + LAYOUT_TAG_HEIGHT;
};

export { isDirect, isIndirect, getMainContOffsetTopHeight };
