import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom renders dialog elements but does not implement their close method.
if (!HTMLDialogElement.prototype.close) {
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value() {
      this.removeAttribute('open');
    },
  });
}

if (!window.matchMedia) {
  window.matchMedia = (media) => ({
    media,
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });
}

afterEach(cleanup);
