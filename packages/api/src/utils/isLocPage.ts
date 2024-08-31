import { inWindowTool } from './inWindow';

const inWindowLocal = inWindowTool();

export const getIsLoginPage = () => (inWindowLocal ? location && location.pathname.includes('/login') : false);

export const getIsJumpPage = () => (inWindowLocal ? location && location.pathname.includes('/jump') : false);
