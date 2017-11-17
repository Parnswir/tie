import test from 'ava';
import {combine, computeOnce, noop} from '../src/util';

test('#combine returns a function executing two functions and returning the result of the second', t => {
  let value = void 0;
  const a = (param) => value = param;
  const b = (param) => param * 2;
  const result = combine(a, b)(1);
  t.is(value, 1);
  t.is(result, 2);
});

test('#computeOnce returns a function that caches results of a computation', t => {
  let value = 0;
  const _fn = () => {value += 1; return value};
  const fn = computeOnce(_fn);
  const result = fn();
  t.is(result, 1);
  t.is(result, fn());
});

test('#noop does nothing, throws nothing, and returns undefined', t => {
  t.notThrows(noop);
  const value = noop();
  t.is(void 0, value);
});
