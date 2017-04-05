const PLAYER_Z_INDEX = 5;

requirejs.config({
    baseUrl: "./bower_components/JsIso/"
});

require([
    'jsiso/canvas/Control',
    'jsiso/canvas/Input',
    'jsiso/img/load',
    'jsiso/json/load',
    'jsiso/tile/Field',
    'jsiso/pathfind/pathfind',
    '../../player'
  ],
  function(CanvasControl, CanvasInput, imgLoader, jsonLoader, TileField, pathfind, Player) {

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

    function launch() {
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
    }

    function TileEngine(x, y, xrange, yrange) {

      let mapLayers = [];
      let players = [];

      const containerName = "container";
      const container = document.getElementById(containerName);

      const controlWidth = container.clientWidth;
      const controlHeight = container.clientHeight;
      const context = CanvasControl.create("canavas", controlWidth, controlHeight, {}, containerName, true);

      //CanvasControl.fullScreen();
      const input = new CanvasInput(document, CanvasControl());

      input.mouse_action(function(coords) {
        mapLayers.map(function(layer) {
          let t = layer.applyMouseFocus(coords.x, coords.y);
          players[0].goTo(t.x, t.y);
        });
      });

      input.keyboard(function(pressed, status) {
        let player = players[0];
        if (status) {
          if (pressed === 37) {
            player.goTo(player.getTile().x - 1, player.getTile().y);
          }
          if (pressed === 39) {
            player.goTo(player.getTile().x + 1, player.getTile().y);
          }
          if (pressed === 38) {
            player.goTo(player.getTile().x, player.getTile().y - 1);
          }
          if (pressed === 40) {
            player.goTo(player.getTile().x, player.getTile().y + 1);
          }
        }
      });

      function draw() {
        context.clearRect(0, 0, controlWidth, controlHeight);
        for (let i = y; i < yrange; i++) {
          for (let j = x; j < xrange; j++) {
            mapLayers.filter((layer) => layer.zIndex < PLAYER_Z_INDEX && layer.visible).forEach(function (layer) {
              layer.draw(i, j);
            });
          }
        }
        for (let player of players) {
          player.draw();
          player.move();
          mapLayers.forEach(function(layer) {
            layer.setLight(player.getTile().x, player.getTile().y);
          });
        }
        for (let i = y; i < yrange; i++) {
          for (let j = x; j < xrange; j++) {
            mapLayers.filter((layer) => layer.zIndex >= PLAYER_Z_INDEX && layer.visible).forEach(function (layer) {
              layer.draw(i, j);
            });
          }
        }
        requestAnimationFrame(draw);
      }

      return {
        init: function (layers) {
          imgLoader([{
            graphics: ["assets/player.png"],
            spritesheet: {
              width: 32,
              height: 32
            }
          }]).then(function(playerImages) {
            let playerOptions = {
              layer: mapLayers[0],
              pathfindingLayer: mapLayers[2],
              files: playerImages[0].files,
              tileWidth: 32,
              tileHeight: 32,
              movementFrameCount: 8,
              framesPerDirection: 4,
              speed: 2
            };
            players.push(new Player(context, playerOptions, 2, 3, pathfind));
          });

          layers = layers.sort((a, b) => a.zIndex > b.zIndex);
          for (let i = 0; i < 0 + layers.length; i++) {
            mapLayers[i] = new TileField(context, controlWidth, controlHeight);
            mapLayers[i].setup(layers[i]);
            mapLayers[i].flip("horizontal");
            mapLayers[i].rotate("left");
            mapLayers[i].setLightmap(layers[i].lightmap);
            mapLayers[i].zIndex = layers[i].zIndex;
            mapLayers[i].visible = layers[i].visible;
          }
          draw()
        }
      }

    }

    launch();
  });
