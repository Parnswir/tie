requirejs.config({
    baseUrl: "./bower_components/JsIso/"
});

require([
    '../../engine', 
    '../../map'
  ],
  (TileEngine, MapLoader) => {
    (new MapLoader).load('assets/maps/house.json').then((map) => {
        let tileEngine = new TileEngine(0, 0, map.height, map.width);
        tileEngine.init(map);
    });
  }
);
