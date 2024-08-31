import { storeMailOps } from '@/api/store/mail';
import { watchMailMessage } from '@/api/store/mail/message';
import { StoreMailOps } from '@/api/store/mail/types';
import { inWindow } from '@/config';

export const storeOps = {
  mail: { ...storeMailOps },
};

export type StoreOpTypes = keyof typeof storeOps;

export function storeOpRegister(type: 'mail', ops: StoreMailOps) {
  if (inWindow()) {
    if (!storeOps[type]) {
      console.error('Not Implement Store in API');
    }
    Object.assign(storeOps[type], ops);
    console.log('Store Register success', type, storeOps);
  }
}

export function startWatchMailMessage() {
  if (inWindow()) {
    // 处理跨窗口消息
    const messageWatchers = [watchMailMessage];
    messageWatchers.forEach(watcher => watcher());
  }
}
