function acopy(src, srcStart, dest, destStart, len) {
  for (let count = 0; count < len; count += 1) {
    dest[destStart + count] = src[srcStart + count];
  }
}

export class RingBuffer {
  constructor(head, tail, length, arr) {
    this.head = head;
    this.tail = tail;
    this.length = length;
    this.arr = arr;
  }

  pop() {
    if (this.length !== 0) {
      const elem = this.arr[this.tail];

      this.arr[this.tail] = undefined;
      this.tail = (this.tail + 1) % this.arr.length;
      this.length -= 1;

      return elem;
    }

    return undefined;
  }

  unshift(element) {
    this.arr[this.head] = element;
    this.head = (this.head + 1) % this.arr.length;
    this.length += 1;
  }

  unboundedUnshift(element) {
    if (this.length + 1 === this.arr.length) {
      this.resize();
    }
    this.unshift(element);
  }

  resize() {
    const newArrSize = this.arr.length * 2;
    const newArr = new Array(newArrSize);

    if (this.tail < this.head) {
      acopy(this.arr, this.tail, newArr, 0, this.length);
      this.tail = 0;
      this.head = this.length;
      this.arr = newArr;
    } else if (this.tail > this.head) {
      acopy(this.arr, this.tail, newArr, 0, this.arr.length - this.tail);
      acopy(this.arr, 0, newArr, this.arr.length - this.tail, this.head);
      this.tail = 0;
      this.head = this.length;
      this.arr = newArr;
    } else if (this.tail === this.head) {
      this.tail = 0;
      this.head = 0;
      this.arr = newArr;
    }
  }

  cleanup(predicate) {
    for (let i = this.length; i > 0; i -= 1) {
      const value = this.pop();

      if (predicate(value)) {
        this.unshift(value);
      }
    }
  }
}

export function ring(n) {
  if (n <= 0) {
    throw new Error("Can't create a ring buffer of size 0");
  }

  return new RingBuffer(0, 0, 0, new Array(n));
}

/**
 * Returns a buffer that is considered "full" when it reaches size n,
 * but still accepts additional items, effectively allow overflowing.
 * The overflowing behavior is useful for supporting "expanding"
 * transducers, where we want to check if a buffer is full before
 * running the transduced step function, while still allowing a
 * transduced step to expand into multiple "essence" steps.
 */
export class FixedBuffer {
  constructor(buffer, n) {
    this.buffer = buffer;
    this.n = n;
  }

  isFull() {
    return this.buffer.length === this.n;
  }

  remove() {
    return this.buffer.pop();
  }

  add(item) {
    this.buffer.unboundedUnshift(item);
  }

  closeBuffer() {}

  count() {
    return this.buffer.length;
  }
}

export function fixed(n) {
  return new FixedBuffer(ring(n), n);
}

export class DroppingBuffer {
  constructor(buffer, n) {
    this.buffer = buffer;
    this.n = n;
  }

  isFull() {
    return false;
  }

  remove() {
    return this.buffer.pop();
  }

  add(item) {
    if (this.buffer.length !== this.n) {
      this.buffer.unshift(item);
    }
  }

  closeBuffer() {}

  count() {
    return this.buffer.length;
  }
}

export function dropping(n) {
  return new DroppingBuffer(ring(n), n);
}

export class SlidingBuffer {
  constructor(buffer, n) {
    this.buffer = buffer;
    this.n = n;
  }

  isFull() {
    return false;
  }

  remove() {
    return this.buffer.pop();
  }

  add(item) {
    if (this.buffer.length === this.n) {
      this.remove();
    }

    this.buffer.unshift(item);
  }

  closeBuffer() {}

  count() {
    return this.buffer.length;
  }
}

export function sliding(n) {
  return new SlidingBuffer(ring(n), n);
}

export class PromiseBuffer {
  constructor(value) {
    this.value = value;
  }

  isFull() {
    return false;
  }

  remove() {
    return this.value;
  }

  add(item) {
    if (PromiseBuffer.isUndelivered(this.value)) {
      this.value = item;
    }
  }

  closeBuffer() {
    if (PromiseBuffer.isUndelivered(this.value)) {
      this.value = null;
    }
  }

  count() {
    return PromiseBuffer.isUndelivered(this.value) ? 0 : 1;
  }
}

PromiseBuffer.NO_VALUE = '@@PromiseBuffer/NO_VALUE';

PromiseBuffer.isUndelivered = value => PromiseBuffer.NO_VALUE === value;

export function promise() {
  return new PromiseBuffer(PromiseBuffer.NO_VALUE);
}
