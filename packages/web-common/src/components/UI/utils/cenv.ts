export function isWebWmEntry(): boolean {
  return !!process.env.IS_WM_ENTRY;
}

export function inEdm(): boolean {
  return process.env.BUILD_ISEDM;
}

export function isElectron(): boolean {
  return typeof window !== 'undefined' && typeof navigator === 'object' && navigator.userAgent.indexOf('Electron') >= 0;
}

export const inWindow = () => typeof window !== 'undefined' && typeof window.document !== 'undefined' && typeof window.localStorage !== 'undefined';
