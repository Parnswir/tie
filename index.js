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

      jsonLoader(['map.json']).then(function(jsonResponse) {

        var images = [
          {
            graphics: ["./assets/tilemaps/0.png"],
            spritesheet: {
              width: jsonResponse[0].tilesets[0].tilewidth, 
              height: jsonResponse[0].tilesets[0].tileheight, 
              offsetX: 0,
              offsetY: 0,
              spacing: 1
            }
          }
        ];

        imgLoader(images).then(function(imgResponse) {
          var tileEngine = new main(0, 0, jsonResponse[0].height, jsonResponse[0].width);

          tileEngine.init([{
              layout: jsonResponse[0].layers[0].data,
              graphics: imgResponse[0].files,
              graphicsDictionary: imgResponse[0].dictionary,
              tileWidth: 32,
              tileHeight: 32,
              width: jsonResponse[0].layers[0].width,
              height: jsonResponse[0].layers[0].height,
              zeroIsBlank: true,
              isometric: false,
              shadowDistance: {
                color: '0, 0, 33',
                distance: 7,
                darkness: 0.95
              },
              lightmap: []
            }]);
          });
        });
      }


      function main(x, y, xrange, yrange) {

        var mapLayers = [];

        var containerName = "container";
        var container = document.getElementById(containerName);

        var context = CanvasControl.create("canavas", container.clientWidth, container.clientHeight, {}, containerName, true);
        
        //CanvasControl.fullScreen();
        var input = new CanvasInput(document, CanvasControl());

        input.mouse_move(function(coords) {
          mapLayers.map(function(layer) {
            var t = layer.applyMouseFocus(coords.x, coords.y);
            layer.setLight(t.x, t.y);
          });
        });

        function draw() {
          context.clearRect(0, 0, CanvasControl().width, CanvasControl().height);
          for (var i = 0; i < 0 + yrange; i++) {
            for (var j = 0; j < 0 + xrange; j++) {
              mapLayers.map(function(layer) {
                layer.draw(i,j);
              });
            }
          }
          requestAnimationFrame(draw);
        }

        return {
          init: function(layers) {
            for (var i = 0; i < 0 + layers.length; i++) {
              mapLayers[i] = new TileField(context, CanvasControl().height, CanvasControl().width);
              mapLayers[i].setup(layers[i]);

              // -- Flip and rotate to match the Tiled draw method --
              mapLayers[i].flip("horizontal");
              mapLayers[i].rotate("left");
            };
            draw();
          }
        }  

      }

      launch();
    });