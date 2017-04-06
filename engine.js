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

  return function TileEngine(x, y, xrange, yrange, containerName="container", textOptions={}) {
    let paused = false;
    let mapLayers = [];
    let players = [];

    const container = document.getElementById(containerName);

    let textMessages = [];
    const textMessageFrame = document.getElementById(textOptions.textMessageFrameName || "text-frame");
    const textMessage = document.getElementById(textOptions.textMessageName || "text-message");
    const textIndicator = document.getElementById(textOptions.textIndicatorName || "text-indicator")

    const controlWidth = container.clientWidth;
    const controlHeight = container.clientHeight;
    const context = CanvasControl.create("canvas", controlWidth, controlHeight, {}, containerName, true);

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
        if (paused) {
          drawMessages();
        } else {
          if (pressed === 37) {
            player.moveTo(player.getTile().x - 1, player.getTile().y);
          }
          if (pressed === 39) {
            player.moveTo(player.getTile().x + 1, player.getTile().y);
          }
          if (pressed === 38) {
            player.moveTo(player.getTile().x, player.getTile().y - 1);
          }
          if (pressed === 40) {
            player.moveTo(player.getTile().x, player.getTile().y + 1);
          }
        }
      }
    });

    let pause = () => {
      paused = true;
    }

    let unpause = () => {
      paused = false;
      draw();
    }

    let clearText = () => {
      textMessages = [];
      textMessageFrame.classList.remove("in");
      textMessage.innerHTML = "";
      textIndicator.classList.remove("in");
      if (paused) {
        unpause();
      }
    }

    let displayText = (text) => {
      textMessages = textMessages.concat(text);
    }

    let drawMessages = () => {
      if (textMessages.length > 0) {
        pause();
        let text = textMessages.splice(0, 1)[0];
        textMessage.innerHTML = text;
        if (!("in" in textMessageFrame.classList)) {
          textMessageFrame.classList.add("in");
        }
        if (textMessages.length >= 1) {
          textIndicator.classList.add("in");
        } else {
          textIndicator.classList.remove("in");
        }
      } else {
        clearText();
      }
    }

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
      drawMessages();
      if (!paused) {
        requestAnimationFrame(draw);
      }
    }

    let initLayer = (layer) => {
      let mapLayer = new TileField(context, controlWidth, controlHeight);
      mapLayer.setup(layer);
      mapLayer.flip("horizontal");
      mapLayer.rotate("left");
      mapLayer.setLightmap(layer.lightmap);
      mapLayer.zIndex = layer.zIndex;
      mapLayer.visible = layer.visible;
      return mapLayer;
    }

    this.init = (map) => {
      const player = map.characters["player"];
      imgLoader([{
        graphics: [player.sprites],
        spritesheet: {
          width: player.width,
          height: player.height
        }
      }]).then((playerImages) => {
        mapLayers = map.layers.sort((a, b) => a.zIndex > b.zIndex).map(initLayer);
        backgroundLayers = mapLayers.filter((layer) => layer.zIndex < player.zIndex && layer.visible);
        foregroundLayers = mapLayers.filter((layer) => layer.zIndex >= player.zIndex && layer.visible);

        player.files = playerImages[0].files;
        player.layer = mapLayers[0];
        player.pathfindingLayer = mapLayers[player.pathfindingLayer];
        player.tileWidth = map.tileWidth;
        player.tileHeight = map.tileHeight;

        players.push(new Player(context, player, player.x, player.y, pathfind));

        draw()
        displayText(["Hello World!", "This is the second text."])
      });
    }
  }
});