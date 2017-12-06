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

test('#_completeMovement emits an event if a path was completed', t => {
  const player = new Player({}, {}, 3, 6);
  t.plan(2);
  player.on('movementComplete', () => t.pass());
  player._completeMovement(); // should not send event
  player.hadPath = true;
  player._completeMovement(); // should send event
  t.falsy(player.hadPath);
});

test('#_moveTowardsTarget moves the player by [speed] pixels into the direction of the target', t => {
  const SPEED = 3;
  const player = new Player({}, {speed: SPEED}, 3, 6);
  const startPos = player.pos;

  player.target = {x: 3, y: 7};
  player._moveTowardsTarget();

  t.is(player.pos.y, startPos.y + SPEED);
});

test('#_moveTowardsTarget lets the player look into the direction of the target', t => {
  const player = new Player({}, {}, 5, 3);
  player.direction = Direction.UP;

  player.target = {x: 3, y: 3};
  player._moveTowardsTarget();

  t.is(player.direction, Direction.LEFT);
});

test('#_moveInPath moves towards the first path element', t => {
  const player = new Player({}, {}, 5, 3);
  const startPos = player.pos;
  player.path = [{x: 5, y: 2}, {x: 4, y: 2}];
  player._moveInPath();
  t.is(player.pos.y, startPos.y - 1);
});

test('#_moveInPath emits an event if it´s path is finished', t => {
  const player = new Player({}, {}, 5, 3);
  const startPos = player.pos;
  t.plan(2);
  player.on('pathComplete', () => t.pass());
  player.path = [];
  player._moveInPath();
  t.deepEqual(player.pos, startPos);
});

test('#_moveInPath emits an event if it´s target is reached', t => {
  t.plan(3);
  const player = new Player({}, {}, 6, 7);
  const startPos = player.pos;
  const [FIRST, SECOND] = [player.tile, {x: 2, y: 6}];
  player.on('pathComplete', (p, newPath) => {
    t.is(p, player);
    t.deepEqual(newPath, [SECOND]);
  });
  player.path = [FIRST, SECOND];
  player._moveInPath();
  t.deepEqual(player.pos, startPos);
});

test('#updateTile changes the tile according to the new position', t => {
  const player = new Player({}, {
    layer: {
      getXYCoords: (x, y) => {
        return {x: Math.floor(x / 32), y: Math.floor(y / 32)}
      }
    }
  }, 6, 7);
  const startTile = player.tile;
  player.updateTile({x: player.pos.x + 32, y: player.pos.y});
  t.notDeepEqual(player.tile, startTile);
  t.deepEqual(player.tile, {x: 7, y: 7});
});

test('#updateTile emits an event when actually changing the tile', t => {
  const TILE = {x: 1, y: 2};
  const player = new Player({}, {
    layer: {
      getXYCoords: (x, y) => TILE
    }
  }, 6, 7);
  const startTile = player.tile;
  player.on('changeTile', (p, newTile) => {
    t.is(p, player);
    t.deepEqual(newTile, TILE);
  });
  t.plan(2);
  player.updateTile({x: 1, y: 1});
  player.updateTile({x: 1, y: 1});
});
