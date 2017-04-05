const PLAYER_Z_INDEX = 5;

requirejs.config({
    baseUrl: "./bower_components/JsIso/"
});

define([
    'jsiso/canvas/Control',
    'jsiso/canvas/Input',
    'jsiso/img/load',
    'jsiso/json/load',
    'jsiso/tile/Field',
    'jsiso/pathfind/pathfind',
    '../../player'
  ],
  (CanvasControl, CanvasInput, imgLoader, jsonLoader, TileField, pathfind, Player) => {

  let requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame  ||
    window.mozRequestAnimationFrame     ||
    window.oRequestAnimationFrame       ||
    window.msRequestAnimationFrame      ||
    function(callback, element) {
      window.setTimeout(callback, 1000 / 60);
    };
  })();

  return function TileEngine(x, y, xrange, yrange) {
    let mapLayers = [];
    let players = [];

    const containerName = "container";
    const container = document.getElementById(containerName);

    const controlWidth = container.clientWidth;
    const controlHeight = container.clientHeight;
    const context = CanvasControl.create("canavas", controlWidth, controlHeight, {}, containerName, true);

    let backgroundLayers = [];
    let foregroundLayers = [];

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

    let drawLayers = (layers) => {
      for (let i = y; i < yrange; i++) {
        for (let j = x; j < xrange; j++) {
          layers.forEach((layer) => layer.draw(i, j));
        }
      }
    }

    let setPlayerLighting = (tile) => {
      mapLayers.forEach((layer) => layer.setLight(tile.x, tile.y));
    }

    let draw = () => {
      context.clearRect(0, 0, controlWidth, controlHeight);
      drawLayers(backgroundLayers);
      for (let player of players) {
        player.draw();
        player.move();
        setPlayerLighting(player.getTile());
      }
      drawLayers(foregroundLayers);
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

        backgroundLayers = mapLayers.filter((layer) => layer.zIndex < PLAYER_Z_INDEX && layer.visible);
        foregroundLayers = mapLayers.filter((layer) => layer.zIndex >= PLAYER_Z_INDEX && layer.visible);

        draw()
      }
    }
  }
});