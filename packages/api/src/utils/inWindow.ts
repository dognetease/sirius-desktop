/**
 *  程序在window中运行，
 *  由于systemApi等api函数也需要使用此判定，估无法使用systemApi支持
 */
export const inWindowTool = () => typeof window !== 'undefined' && typeof window.document !== 'undefined' && typeof window.localStorage !== 'undefined';
