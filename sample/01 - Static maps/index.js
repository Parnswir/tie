import TileEngine from '../../src/engine';

let tileEngine = new TileEngine(0, 0, map.height, map.width);
tileEngine.init('./map.json');
