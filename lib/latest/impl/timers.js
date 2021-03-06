import { queueDelay } from './dispatch';
import { chan, Channel } from './channels';

export function timeout(msecs) {
  const ch = chan();
  queueDelay(() => ch.close(), msecs);
  return ch;
}
