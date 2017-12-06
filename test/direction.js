import test from 'ava';

import Direction from '../src/direction';

test('#from infers direction from object A to B', t => {
  const [A, B, C, D] = [
    {x: 1, y: 1},
    {x: 2, y: 1},
    {x: 1, y: 2},
    {x: 2, y: 5}
  ];

  t.is(Direction.from(A, B), Direction.RIGHT);
  t.is(Direction.from(B, A), Direction.LEFT);
  t.is(Direction.from(A, C), Direction.DOWN);
  t.is(Direction.from(C, A), Direction.UP);

  // movement on x-axis has priority over y-axis:
  t.is(Direction.from(C, D), Direction.RIGHT);
  t.is(Direction.from(D, B), Direction.UP);
});

test('#tileInDirection works for default step', t => {
  const [A, B, C, D] = [
    {x: 1, y: 1},
    {x: 2, y: 1},
    {x: 1, y: 2},
    {x: 2, y: 5}
  ];

  t.deepEqual(Direction.tileInDirection(A, Direction.RIGHT), B);
  t.deepEqual(Direction.tileInDirection(B, Direction.LEFT), A);
  t.deepEqual(Direction.tileInDirection(A, Direction.DOWN), C);
  t.deepEqual(Direction.tileInDirection(C, Direction.UP), A);
});

test('#tileInDirection works for specified step', t => {
  const P = {x: 5, y: 7};
  t.deepEqual(Direction.tileInDirection(P, Direction.RIGHT, 5), {x: P.x + 5, y: P.y});
  t.deepEqual(Direction.tileInDirection(P, Direction.LEFT, 3), {x: P.x - 3, y: P.y});
  t.deepEqual(Direction.tileInDirection(P, Direction.DOWN, 8), {x: P.x, y: P.y + 8});
  t.deepEqual(Direction.tileInDirection(P, Direction.UP, 6), {x: P.x, y: P.y - 6});
});

test('#getModifier determines on which axis a target is situated', t => {
  const P = {x: 5, y: 7};
  t.deepEqual(Direction.getModifier(P, P), {x: 0, y: 0});

  t.deepEqual(Direction.getModifier(P, {x: 5, y: 8}), {x: 0, y: 1});
  t.deepEqual(Direction.getModifier(P, {x: 9, y: 7}), {x: 1, y: 0});
  t.deepEqual(Direction.getModifier(P, {x: 5, y: 4}), {x: 0, y: -1});
  t.deepEqual(Direction.getModifier(P, {x: 1, y: 7}), {x: -1, y: 0});

  t.deepEqual(Direction.getModifier(P, {x: 6, y: 8}), {x: 1, y: 1});
  t.deepEqual(Direction.getModifier(P, {x: 2, y: 9}), {x: -1, y: 1});
  t.deepEqual(Direction.getModifier(P, {x: 6, y: 4}), {x: 1, y: -1});
  t.deepEqual(Direction.getModifier(P, {x: 3, y: 4}), {x: -1, y: -1});
});
