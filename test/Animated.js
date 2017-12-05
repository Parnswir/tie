import test from 'ava';

import Animated from '../src/Animated';

class AnimatedObject extends Animated() {};
const newAnimated = (animationFrameCount, framesPerDirection) => new AnimatedObject(animationFrameCount, framesPerDirection);

test('by default is not animated', t => {
  const animated = newAnimated();
  t.is(animated.animationFrame, 0);
  t.is(animated.animationFrameCounter, 0);
  animated.stepAnimation();
  t.is(animated.animationFrame, 0);
  t.is(animated.animationFrameCounter, 0);
});

test('cycles through animation frames every animationFrameCount frames', t => {
  const ANIMATION_FRAME_COUNT = 4;
  const animated = newAnimated(ANIMATION_FRAME_COUNT, 4);
  t.is(animated.animationFrame, 0);
  for (let i = 0; i < ANIMATION_FRAME_COUNT; i += 1) animated.stepAnimation();
  t.is(animated.animationFrame, 1);
  for (let i = 0; i < 2 * ANIMATION_FRAME_COUNT; i += 1) animated.stepAnimation();
  t.is(animated.animationFrame, 3);
});

test('allows only framesPerDirection frames', t => {
  const FRAMES_PER_DIRECTION = 3;
  const animated = newAnimated(1, FRAMES_PER_DIRECTION);
  animated.animationFrame = 1;
  t.is(animated.animationFrame, 1);
  animated.animationFrame = 7;
  t.is(animated.animationFrame, 7 % FRAMES_PER_DIRECTION);
});

test('#stepAnimation increases the animation frame counter', t => {
  const animated = newAnimated(4, 4);
  const initialCounter = animated.animationFrameCounter;
  animated.stepAnimation();
  t.is(animated.animationFrameCounter, (initialCounter + 1) % 4)
});
