import test from 'ava';
import EventEmitting from './../src/EventEmitter'

class EventEmitter extends EventEmitting(Object) {};
const newEventEmitter = () => new EventEmitter();

test('calls callback function once', t => {
  t.plan(1);
  const emitter = newEventEmitter();
  emitter.on('test', () => t.pass());
  emitter.createEvent('test');
});

test('calls callback function as often as there are events', t => {
  t.plan(42);
  const emitter = newEventEmitter();
  emitter.on('test', () => t.pass());
  for (let i = 41; i >= 0; i--) {
    emitter.createEvent('test');
  }
});

test('supplies an event object to the callback', t => {
  t.plan(2);
  const original = {'foo': 'bar', 'baz': 42};
  const emitter = newEventEmitter();
  emitter.on('test', (me, event) => {
    t.deepEqual(me, emitter);
    t.deepEqual(event, original);
  });
  emitter.createEvent('test', original);
});

test('handles events with "once:" prefix only once', t => {
  t.plan(1);
  const emitter = newEventEmitter();
  emitter.on('once:test', () => t.pass());
  emitter.createEvent('test');
  emitter.createEvent('test');
});

test('can unregister event handlers in bulk', t => {
  t.plan(1);
  const emitter = newEventEmitter();
  emitter.on('test', () => t.pass());
  emitter.createEvent('test');
  emitter.off('test');
  emitter.createEvent('test');
});

test('can unregister event handlers by id', t => {
  t.plan(1);
  const emitter = newEventEmitter();
  const id = emitter.on('test', () => t.pass());
  emitter.createEvent('test');
  emitter.off('test', id);
  emitter.createEvent('test');
});

test('does not affect other events when unregistering', t => {
  t.plan(3);
  const emitter = newEventEmitter();
  emitter.on('foo', () => t.pass());
  emitter.on('bar', () => t.pass());
  emitter.createEvent('foo');
  emitter.createEvent('bar');
  emitter.off('foo');
  emitter.createEvent('foo');
  emitter.createEvent('bar');
});
