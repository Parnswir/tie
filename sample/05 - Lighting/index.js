import TileEngine from '../../src/engine';

let tileEngine = new TileEngine(0, 0, 15, 15, {
  enableKeyboardInput: true,
  enableMouseInput: true
});
tileEngine.init('./map.json');

// for integration tests:
window.tileEngine = tileEngine;
