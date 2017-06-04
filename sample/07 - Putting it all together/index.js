import TileEngine from '../../src/engine';
import {MapLoader} from '../../src/map';

MapLoader.load('./assets/maps/house.json').then((map) => {
    let tileEngine = new TileEngine(0, 0, map.height, map.width, {
      lockedFrameRate: false,
      enableKeyboardInput: true,
      enableMouseInput: true,
      enableTextOutput: true
    });
    tileEngine.init(map);
});
