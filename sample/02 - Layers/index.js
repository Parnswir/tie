import TileEngine from '../../src/engine';
import MapLoader from '../../src/map';

(new MapLoader()).load('./map.json').then((map) => {
    let tileEngine = new TileEngine(0, 0, map.height, map.width);
    tileEngine.init(map);
});
