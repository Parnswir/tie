import test from 'ava';
import sinon from 'sinon';

import ActionExecutor from '../src/action';
import {noop} from '../src/util';

import * as util from '../src/util';

test('#registerAction works', t => {
  const ae = new ActionExecutor();
  const TYPE = 'test';
  t.deepEqual(ae._actions[TYPE], void 0);
  ae.registerAction(TYPE, noop);
  t.is(ae._actions[TYPE].executor, noop);
});

test('#registerAction accepts but ignores empty handlers', t => {
  const handler = sinon.spy(util, 'noop');
  const ae = new ActionExecutor();
  const TYPE = 'test';
  const [OPTIONS, ENGINE, PLAYER] = [{type: TYPE}, {b: 2}, {c: 3}];
  ae.registerAction(TYPE);
  ae.execute(OPTIONS, ENGINE, PLAYER);
  t.is(ae['_actions'][TYPE].executor, handler);
  t.truthy(handler.called);
});

test('#registerAction does not register an action twice if not forced', t => {
  const ae = new ActionExecutor();
  const TYPE = 'test';
  sinon.stub(console, 'warn');

  ae.registerAction(TYPE, noop);
  t.is(ae._actions[TYPE].executor, noop);
  ae.registerAction(TYPE, () => 'foobar');
  t.is(ae._actions[TYPE].executor, noop);
  ae.registerAction(TYPE, () => 'foobar', false, false);
  t.is(ae._actions[TYPE].executor, noop);
});

test('#registerAction overrides an action executor if forced', t => {
  const ae = new ActionExecutor();
  const TYPE = 'test';
  const foo = () => 'foobar';
  ae.registerAction(TYPE, noop);
  t.is(ae._actions[TYPE].executor, noop);
  ae.registerAction(TYPE, foo, false, true);
  t.is(ae._actions[TYPE].executor, foo);
});

test('#registerAction can register an action as blocking', t => {
  const ae = new ActionExecutor();
  const TYPE = 'test';
  const foo = () => 'foobar';
  ae.registerAction(TYPE, foo, true);
  t.is(ae._actions[TYPE].executor, foo);
  t.is(ae._actions[TYPE].blocking, true);
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

test.cb('#execute waits for blocking actions before executing the next action', t => {
  const ae = new ActionExecutor();
  const NEXT = {type: 'bar'};
  const [OPTIONS, ENGINE, PLAYER] = [{type: 'foo', next: NEXT}, {b: 2}, {c: 3}];
  let flag = false;
  const foo = (options, engine, player, callback) => {
    t.is(options, OPTIONS);
    t.is(engine, ENGINE);
    t.is(player, PLAYER);
    setTimeout(() => {
      flag = true;
      callback();
    }, 200);
  };
  const bar = (options, engine, player) => {
    t.true(flag);
    t.is(options, NEXT);
    t.is(engine, ENGINE);
    t.is(player, PLAYER);
    t.end();
  };
  t.plan(7);
  ae.registerAction(OPTIONS.type, foo, true);
  ae.registerAction(NEXT.type, bar);
  ae.execute(OPTIONS, ENGINE, PLAYER);
});
