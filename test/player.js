import test from 'ava';
import Player from '../src/player'

test('#getDirection works', t => {
  const player = new Player({}, {direction: 0});
  t.is(player.getDirection(), 0);
});

test('#setDirection works', t => {
  const player = new Player({}, {direction: 0});
  player.setDirection(3);
  t.is(player.getDirection(), 3);
  player.setDirection(2);
  t.is(player.getDirection(), 2);
});

test('#setDirection sets only valid directions', t => {
  const player = new Player();
  player.setDirection(6);
  t.is(player.getDirection(), 2);
  player.setDirection(-1);
  t.is(player.getDirection(), 3);
});

test('#setDirection emits an event announcing the new direction', t => {
  const player = new Player({}, {direction: 0});
  const DIRECTION = 3;
  player.on('setDirection', (instance, direction) => {
    t.is(instance, player);
    t.is(direction, DIRECTION);
    t.is(direction, instance.getDirection());
  });
  t.plan(3);
  player.setDirection(DIRECTION);
});

test('is not moving by default after creation', t => {
  t.false(new Player().isMoving());
});

test('#getTile works', t => {
  t.deepEqual(new Player({}, {}, 1, 2).getTile(), {x: 1, y:2});
});

test('#getLookedAtTile works', t => {
  t.deepEqual(new Player({}, {direction: 0}, 1, 1).getLookedAtTile(), {x: 1, y: 2});
  t.deepEqual(new Player({}, {direction: 0}, 3, 6).getLookedAtTile(), {x: 3, y: 7});
  t.deepEqual(new Player({}, {direction: 1}, 2, 5).getLookedAtTile(), {x: 2, y: 4});
  t.deepEqual(new Player({}, {direction: 2}, 1, 1).getLookedAtTile(), {x: 0, y: 1});
  t.deepEqual(new Player({}, {direction: 3}, 8, 3).getLookedAtTile(), {x: 9, y: 3});
});

test('#draw calls drawImage method of context', t => {
  t.plan(1);
  const context = {drawImage: () => t.pass()};
  const options = {
    layer: {getOffset: () => {return {x: 1, y: 1}}},
    files: [{width: 1, height: 1}],
    framesPerDirection: 1};
  const player = new Player(context, options);
  player.draw();
});
