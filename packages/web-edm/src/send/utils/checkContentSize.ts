/**
 * 用来校验内容大小。通过返回true，不通过返回false
 */
export const checkContentSize = (content: string): boolean => {
  const blob = new Blob([content]);
  const targetSize = 8 * 1024 * 1024; // 目标大小8M
  // const targetSize = 100 * 1024; // 目标大小临时100k
  if (blob.size > targetSize) {
    return false;
  }
  return true;
};
