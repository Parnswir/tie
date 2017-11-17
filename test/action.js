import test from 'ava';
import ActionExecutor from '../src/action';
import {noop} from '../src/util';

test('#registerAction works', t => {
  const ae = new ActionExecutor();
  const TYPE = 'test';
  t.deepEqual(ae._actions[TYPE], void 0);
  ae.registerAction(TYPE, noop);
  t.is(ae._actions[TYPE], noop);
});

test('#registerAction does not register an action twice if not forced', t => {
  const ae = new ActionExecutor();
  const TYPE = 'test';
  ae.registerAction(TYPE, noop);
  t.is(ae._actions[TYPE], noop);
  ae.registerAction(TYPE, () => 'foobar');
  t.is(ae._actions[TYPE], noop);
  ae.registerAction(TYPE, () => 'foobar', false);
  t.is(ae._actions[TYPE], noop);
});

test('#registerAction overrides an action executor if forced', t => {
  const ae = new ActionExecutor();
  const TYPE = 'test';
  const foo = () => 'foobar';
  ae.registerAction(TYPE, noop);
  t.is(ae._actions[TYPE], noop);
  ae.registerAction(TYPE, foo, true);
  t.is(ae._actions[TYPE], foo);
});

test('#execute runs the saved executor for the given action', t => {
  const ae = new ActionExecutor();
  const [OPTIONS, ENGINE, PLAYER] = [{type: 'test'}, {b: 2}, {c: 3}];
  const foo = (options, engine, player) => {
    t.is(options, OPTIONS);
    t.is(engine, ENGINE);
    t.is(player, PLAYER);
  };
  t.plan(3);
  ae.registerAction(OPTIONS.type, foo);
  ae.execute(OPTIONS, ENGINE, PLAYER);
  ae.execute({type: 'different'}, ENGINE, PLAYER);
});

test('#execute queues the next action if it exists', t => {
  const ae = new ActionExecutor();
  const NEXT = {type: 'bar'};
  const [OPTIONS, ENGINE, PLAYER] = [{type: 'foo', next: NEXT}, {b: 2}, {c: 3}];
  const foo = (options, engine, player) => {
    t.is(options, OPTIONS);
    t.is(engine, ENGINE);
    t.is(player, PLAYER);
  };
  const bar = (options, engine, player) => {
    t.is(options, NEXT);
    t.is(engine, ENGINE);
    t.is(player, PLAYER);
  };
  t.plan(6);
  ae.registerAction(OPTIONS.type, foo);
  ae.registerAction(NEXT.type, bar);
  ae.execute(OPTIONS, ENGINE, PLAYER);
});
