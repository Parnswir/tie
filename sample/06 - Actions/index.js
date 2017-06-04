import TileEngine from '../../src/engine';
import {MapLoader} from '../../src/map';

MapLoader.load('./map.json').then((map) => {
  let tileEngine = new TileEngine(0, 0, map.height, map.width, {
    enableKeyboardInput: true,
    enableMouseInput: true,
    enableTextOutput: true
  });

  let executeAction = (options, engine, player) => {
    alert(`You found the secret custom action!\n${JSON.stringify(options, true, 2)}`);
  }

  tileEngine.actionExecutor.registerAction('my-custom-action', executeAction);
  tileEngine.init(map);
});
