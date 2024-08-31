export function getTransText(key: string): string {
  try {
    // @ts-ignore
    return window?.getLocalLabel(key) || '';
  } catch (e) {
    return '';
  }
}
