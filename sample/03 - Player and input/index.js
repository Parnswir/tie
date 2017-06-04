import TileEngine from '../../src/engine';
import {MapLoader} from '../../src/map';

MapLoader.load('./map.json').then((map) => {
    let tileEngine = new TileEngine(0, 0, map.height, map.width, {
      enableKeyboardInput: true,
      enableMouseInput: true
    });
    tileEngine.init(map);
});
