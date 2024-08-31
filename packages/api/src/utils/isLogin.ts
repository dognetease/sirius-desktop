import { inWindowTool } from './inWindow';
export const isLoginPage = inWindowTool() ? (location && location.pathname.includes('/login') ? true : false) : false;
