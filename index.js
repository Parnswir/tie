requirejs.config({
    baseUrl: "./bower_components/JsIso/"
});

require([
    'jsiso/img/load',
    'jsiso/json/load', 
    '../../engine'
  ],
  function(imgLoader, jsonLoader, TileEngine) {
    jsonLoader(['map.json']).then(function(maps) {
      let map = maps[0];

      let images = map.tilesets.map((tileset) => ({
          graphics: [tileset.image],
          spritesheet: {
            width: tileset.tileWidth,
            height: tileset.tileHeight,
            offsetX: tileset.offsetX || 0,
            offsetY: tileset.offsetY || 0,
            spacing: tileset.spacing || 0
          }
        }));

      imgLoader(images).then(function(imgResponse) {
        let tileEngine = new TileEngine(0, 0, map.height, map.width);

        let layers = map.layers.map((layer) => Object.assign(layer, {
        	graphics: imgResponse[layer.tileset].files,
          graphicsDictionary: imgResponse[layer.tileset].dictionary,
          zeroIsBlank: true,
          isometric: false,
          tileWidth: map.tileWidth,
          tileHeight: map.tileHeight
        }));

        tileEngine.init(layers);
      });
    });
  });
