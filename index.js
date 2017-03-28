requirejs.config({
    baseUrl: "./bower_components/JsIso/"
});

require([
    'jsiso/canvas/Control',
    'jsiso/canvas/Input',
    'jsiso/img/load',
    'jsiso/json/load',
    'jsiso/tile/Field',
    'jsiso/pathfind/pathfind'
  ],
  function(CanvasControl, CanvasInput, imgLoader, jsonLoader, TileField, pathfind) {
    // -- FPS --------------------------------
    window.requestAnimFrame = (function() {
      return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame  ||
      window.mozRequestAnimationFrame     ||
      window.oRequestAnimationFrame       ||
      window.msRequestAnimationFrame      ||
      function(callback, element) {
        window.setTimeout(callback, 1000 / 60);
      };
    })();
    // ---------------------------------------

    function launch() {

      jsonLoader(['map.json']).then(function(map) {
        map = map[0];

        let images = map.tilesets.map((tileset) => ({
            graphics: [tileset.image],
            spritesheet: {
              width: tileset.tileWidth,
              height: tileset.tileHeight,
              offsetX: tileset.offsetX || 0,
              offsetY: tileset.offsetY || 0,
              spacing: tileset.spacing || 1
            }
          }));

        imgLoader(images).then(function(imgResponse) {
          let tileEngine = new TileEngine(0, 0, map.height, map.width);

          let layers = map.layers.map((layer) => ({
            layout: layer.data,
            graphics: imgResponse[layer.tileset].files,
            graphicsDictionary: imgResponse[layer.tileset].dictionary,
            tileWidth: map.tileWidth,
            tileHeight: map.tileHeight,
            width: layer.width,
            height: layer.height,
            zeroIsBlank: true,
            isometric: false,
            shadowDistance: {
              color: '0, 0, 33',
              distance: 7,
              darkness: 0.95
            },
            lightmap: []
          }));
          console.log(layers)

          tileEngine.init(layers);
        });
      });
    }


    function TileEngine(x, y, xrange, yrange) {

      let mapLayers = [];

      const containerName = "container";
      const container = document.getElementById(containerName);

      const context = CanvasControl.create("canavas", container.clientWidth, container.clientHeight, {}, containerName, true);

      //CanvasControl.fullScreen();
      const input = new CanvasInput(document, CanvasControl());

      input.mouse_move(function(coords) {
        mapLayers.map(function(layer) {
          let t = layer.applyMouseFocus(coords.x, coords.y);
          layer.setLight(t.x, t.y);
        });
      });

      function draw() {
        context.clearRect(0, 0, CanvasControl().width, CanvasControl().height);
        for (let i = 0; i < 0 + yrange; i++) {
          for (let j = 0; j < 0 + xrange; j++) {
            mapLayers.map(function (layer) {
              layer.draw(i,j);
            });
          }
        }
        requestAnimationFrame(draw);
      }

      return {
        init: function (layers) {
          for (let i = 0; i < 0 + layers.length; i++) {
            mapLayers[i] = new TileField(context, CanvasControl().height, CanvasControl().width);
            mapLayers[i].setup(layers[i]);
            mapLayers[i].flip("horizontal");
            mapLayers[i].rotate("left");
          }
          draw();
        }
      }

    }

    launch();
  });
