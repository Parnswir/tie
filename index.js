requirejs.config({
    baseUrl: "./bower_components/JsIso/"
});

require([
    '../../engine', 
    '../../map'
  ],
  function(TileEngine, MapLoader) {
    (new MapLoader).load('map.json').then((map) => {
        let tileEngine = new TileEngine(0, 0, map.height, map.width);
        tileEngine.init(map.layers);
    });
  });
