import test from 'ava';
import Player from '../src/player';
import Direction from '../src/direction';

test('constructor sets position', t => {
  const COUNT = 20;
  t.plan(COUNT);
  for (let i = 0; i < COUNT; i += 1) {
    const x = Math.floor(Math.random() * 2000);
    const y = Math.floor(Math.random() * 2000);
    const player = new Player({}, {}, x, y);
    t.deepEqual(player.tile, {x, y});
  }
});

test('#directionFrom works', t => {
  const player = new Player({}, {}, 5, 8);
  t.is(player.directionFrom(5, 9), Direction.DOWN);
  t.is(player.directionFrom(5, 3), Direction.UP);
  t.is(player.directionFrom(4, 8), Direction.LEFT);
  t.is(player.directionFrom(7, 8), Direction.RIGHT);
});

test('#getDirection works', t => {
  const player = new Player({}, {direction: Direction.DOWN});
  t.is(player.direction, Direction.DOWN);
});

test('#setDirection works', t => {
  const player = new Player({}, {direction: Direction.DOWN});
  player.direction = Direction.RIGHT;
  t.is(player.direction, Direction.RIGHT);
  player.direction = Direction.LEFT;
  t.is(player.direction, Direction.LEFT);
});

test('#setDirection sets only valid directions', t => {
  const player = new Player();
  player.direction = 6;
  t.is(player.direction, 2);
  player.direction = -1;
  t.is(player.direction, 3);
});

test('#setDirection emits an event announcing the new direction', t => {
  const player = new Player({}, {direction: Direction.DOWN});
  const DIRECTION = 3;
  player.on('setDirection', (instance, direction) => {
    t.is(instance, player);
    t.is(direction, DIRECTION);
    t.is(direction, instance.direction);
  });
  t.plan(3);
  player.direction = DIRECTION;
});

test('is not moving by default after creation', t => {
  t.false(new Player().isMoving);
});

test('#getTile works', t => {
  t.deepEqual(new Player({}, {}, 1, 2).tile, {x: 1, y:2});
});

test('#getLookedAtTile works', t => {
  t.deepEqual(new Player({}, {direction: Direction.DOWN}, 1, 1).getLookedAtTile(), {x: 1, y: 2});
  t.deepEqual(new Player({}, {direction: Direction.DOWN}, 3, 6).getLookedAtTile(), {x: 3, y: 7});
  t.deepEqual(new Player({}, {direction: Direction.UP}, 2, 5).getLookedAtTile(), {x: 2, y: 4});
  t.deepEqual(new Player({}, {direction: Direction.LEFT}, 1, 1).getLookedAtTile(), {x: 0, y: 1});
  t.deepEqual(new Player({}, {direction: Direction.RIGHT}, 8, 3).getLookedAtTile(), {x: 9, y: 3});
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

test('#target returns the current position if no path is set', t => {
  const player = new Player();
  t.deepEqual(player.target, player.pos);
});

test('#target returns the coordinates of the next path entry', t => {
  const TILEWIDTH = 32;
  const player = new Player({}, {
    tileWidth: TILEWIDTH,
    tileHeight: TILEWIDTH
  });
  const ITEM = {x: 4, y: 5};
  player.path = [ITEM];
  t.deepEqual(player.target, {
    x: ITEM.x * TILEWIDTH + TILEWIDTH / 2,
    y: ITEM.y * TILEWIDTH + TILEWIDTH / 2
  });
});

test('#setTarget replaces the current path with single element', t => {
  const FIRST = {x: 1, y: 2};
  const SECOND = {x: 5, y: 7};
  const THIRD = {x: 8, y: 1};
  const player = new Player();
  player.path = [FIRST, SECOND];
  t.deepEqual(player.path[0], FIRST);
  player.target = THIRD;
  t.is(player.path.length, 1);
  t.deepEqual(player.path[0], THIRD);
});

test('#inPosition returns true for both axis when not in motion', t => {
  const player = new Player();
  t.truthy(player.inPosition.x);
  t.truthy(player.inPosition.y);
});

test('#inPosition works for set targets', t => {
  const player = new Player({}, {}, 4, 5);
  player.target = {x: 3, y: 5};
  t.falsy(player.inPosition.x);
  t.truthy(player.inPosition.y);

  player.target = {x: 3, y: 7};
  t.falsy(player.inPosition.x);
  t.falsy(player.inPosition.y);

  player.target = {x: 4, y: 9};
  t.truthy(player.inPosition.x);
  t.falsy(player.inPosition.y);

  player.target = {x: 4, y: 5};
  t.truthy(player.inPosition.x);
  t.truthy(player.inPosition.y);
});
