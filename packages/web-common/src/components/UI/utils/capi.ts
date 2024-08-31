import { inWindow } from './cenv';

export function testPathMatch(key: string, matchExactly?: boolean, location?: Location): boolean {
  if (!inWindow()) return false;
  const loc = location || window.location;
  const urlPath: string = loc.pathname.replace('/static/sirius-web', '').replace(/index\.html$/i, '');
  if (key === '/') {
    return urlPath === '/';
  }
  return matchExactly ? urlPath === key : urlPath.indexOf(key) >= 0;
}
