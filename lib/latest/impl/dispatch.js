import { RingBuffer, ring } from './buffers';

const TASK_BATCH_SIZE = 1024;
const tasks = ring(32);
let running = false;
let queued = false;

export function queueDispatcher() {
  // See the implementation of setImmediate at babel-runtime/core-js/set-immediate
  // https://github.com/zloirock/core-js/blob/e482646353b489e200a5ecccca6af5c01f0b4ef2/library/modules/_task.js
  // Under the hood, it will use process.nextTick, MessageChannel, and fallback to setTimeout
  if (!(queued && running)) {
    queued = true;

    setTimeout(() => {
      let count = 0;

      running = true;
      queued = false;

      while (count < TASK_BATCH_SIZE) {
        const task = tasks.pop();

        if (task) {
          task();
          count += 1;
        } else {
          break;
        }
      }

      running = false;

      if (tasks.length > 0) {
        queueDispatcher();
      }
    });
  }
}

export function run(func) {
  tasks.unboundedUnshift(func);
  queueDispatcher();
}

export function queueDelay(func, delay) {
  setTimeout(func, delay);
}
