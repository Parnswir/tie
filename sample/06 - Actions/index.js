import TileEngine from '../../src/engine';

let tileEngine = new TileEngine(0, 0, 5, 5, {
  enableKeyboardInput: true,
  enableMouseInput: true,
  enableTextOutput: true
});

let executeAction = (options, engine, player) => {
  alert(`You found the secret custom action!\n${JSON.stringify(options, true, 2)}`);
}

tileEngine.actionExecutor.registerAction('my-custom-action', executeAction);
tileEngine.init('./map.json');
