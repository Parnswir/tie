import TileEngine from '../../src/engine';

let tileEngine = new TileEngine(0, 0, 10, 10, {
  lockedFrameRate: false,
  enableKeyboardInput: true,
  enableMouseInput: true,
  enableTextOutput: true
});
tileEngine.init('./assets/maps/house.json');
