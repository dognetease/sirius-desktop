import { api } from '@/api/api';
import { SystemEvent } from '@/api/data/event';
import { storeOps } from '@/api/store/api_store';
import { pathNotInArrJudge } from '@/api/util';
import { inWindow } from '@/config';

const eventApi = api.getEventApi();

const LOG_PREFIX = '[mail store message]';

type RefreshTypes = 'refreshFromDb' | 'mailOp' | 'mailTag' | 'updateMailEntities';

const ALLOWED_PATHS = ['/', '/jump', '/index.html', '/readMailComb', '/readMail', '/marketingDataViewer', '/strangerMails'];

export function watchMailMessage() {
  if (!inWindow()) {
    return;
  }
  const notAllowed = pathNotInArrJudge(window.location, ALLOWED_PATHS);
  if (notAllowed) {
    return;
  }
  eventApi.registerSysEventObserver('mailStoreRefresh', {
    name: 'mailStoreRefreshWatcher',
    func(ev: SystemEvent<any>): void {
      console.log(LOG_PREFIX, ev);
      const refreshType = ev.eventStrData as RefreshTypes | undefined;
      if (refreshType === 'refreshFromDb') {
        if (pathNotInArrJudge(window.location, ['strangerMails', 'readMail', 'writeMail'])) {
          storeOps.mail.updateMailModelEntriesFromDb(ev);
        }
      } else if (refreshType === 'mailOp') {
        storeOps.mail.updateMailEntity(ev);
        // 17版本智能模式下线
        // setTimeout(() => {
        //   mailApi.mailOperationEmailListChange(ev).then();
        // });
      } else if (refreshType === 'mailTag') {
        storeOps.mail.updateMailTag({ ...ev.eventData, _account: ev?._account });
      } else if (refreshType === 'updateMailEntities') {
        storeOps.mail.updateMailEntities(ev.eventData);
      } else if (refreshType === 'resetMailWithDraft') {
        storeOps.mail.resetMailWithDraft(ev.eventData);
      }
    },
  });
}
