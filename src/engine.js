import CanvasControl from './jsiso/canvas/Control';
import CanvasInput from './jsiso/canvas/Input';
import imgLoader from './jsiso/img/load';
import jsonLoader from './jsiso/json/load';
import TileField from './jsiso/tile/Field';
import pathfind from './jsiso/pathfind/pathfind';

import Player from './player';
import ActionExecutor from './action';

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

const ELEMENT_NAMES = {
  containerName: 'container',
  frameName: 'text-frame',
  messageName: 'text-message',
  indicatorName: 'text-indicator'
};

let appendHtml = (el, str) => {
  let div = document.createElement('div');
  div.innerHTML = str;
  while (div.children.length > 0) {
    el.appendChild(div.children[0]);
  }
}

let createElements = (container, names, outputEnabled=false) => {
  let elements = '<div id="' + names.containerName + '"></div>';
  if (outputEnabled) {
    elements += '\
      <div class="text-frame" id="' + names.frameName + '">\
        <span class="text-message" id="' + names.messageName + '"></span>\
        <span id="' + names.indicatorName + '">▼</span>\
      </div>';
  }
  appendHtml(container, elements);
}

export default function TileEngine (x, y, xrange, yrange, parent=document.body, overrides) {
  let self = this;
  overrides = Object.assign({}, overrides);

  let elementNames = Object.assign(ELEMENT_NAMES, overrides.customElementNames);
  if (!overrides.useCustomElements) {
    createElements(parent, elementNames, overrides.enableTextOutput);
  }
  const container = document.getElementById(elementNames.containerName);

  let textMessages = [];
  const textMessageFrame = document.getElementById(elementNames.frameName);
  const textMessage = document.getElementById(elementNames.messageName);
  const textIndicator = document.getElementById(elementNames.indicatorName)

  const controlWidth = container.clientWidth;
  const controlHeight = container.clientHeight;
  const context = CanvasControl.create("canvas", controlWidth, controlHeight, {}, elementNames.containerName, true);

  let backgroundLayers = [];
  let foregroundLayers = [];

  let paused = false;
  let mapLayers = [];
  let players = [];

  let actionExecutor = new ActionExecutor();
  actionExecutor.registerAction('toggleTile', (options, engine, player) => {
    let layers = mapLayers.filter((layer) => layer.zIndex === player.properties.zIndex);
    layers.forEach((layer) => {
      let currentTile = layer.getTile(options.target.x, options.target.y);
      let currentIndex = options.tiles.indexOf(currentTile);
      layer.setTile(options.target.x, options.target.y, options.tiles[(currentIndex + 1) % options.tiles.length]);
    })
  });

  let clearText = function () {};
  let displayText = function () {};
  let drawMessages = function () {};

  if (overrides.enableTextOutput) {
    textMessageFrame.onclick = () => {
      if (paused) {
        drawMessages();
      }
    };

    clearText = () => {
      textMessages = [];
      textMessageFrame.classList.remove("in");
      textMessage.innerHTML = "";
      textIndicator.classList.remove("in");
      if (paused) {
        unpause();
      }
    }

    displayText = (text) => {
      textMessages = textMessages.concat(text);
    }

    drawMessages = () => {
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
  }

  const input = new CanvasInput(document, CanvasControl());
  if (overrides.enableMouseInput) {
    input.mouse_action(function(coords) {
      if (paused) {
        drawMessages()
      } else {
        let player = players[0];
        let layer = player.properties.layer;
        let t = layer.applyMouseFocus(coords.x, coords.y);
        player.goTo(t.x, t.y);
        if (Math.abs(t.x - player.getTile().x) + Math.abs(t.y - player.getTile().y) === 1) {
          interact(player, t);
        }
      }
    });
  }

  if (overrides.enableKeyboardInput) {
    input.keyboard(function(pressed, status) {
      let player = players[0];
      if (status) {
        if (paused) {
          if ([13, 32].indexOf(pressed) >= 0) {
            drawMessages();
          }
        } else {
          switch (pressed) {
            case 37: player.moveTo(player.getTile().x - 1, player.getTile().y); break;
            case 38: player.moveTo(player.getTile().x, player.getTile().y - 1); break;
            case 39: player.moveTo(player.getTile().x + 1, player.getTile().y); break;
            case 40: player.moveTo(player.getTile().x, player.getTile().y + 1); break;
            case 13: case 32: interact(player, player.getLookedAtTile()); break;
          }
        }
      }
    });
  }

  let getActions = (player=null) => {
    let layers = mapLayers;
    if (player !== null) {
      layers = layers.filter((layer) => layer.zIndex === player.properties.zIndex);
    }
    let actions = [];
    layers.forEach((layer) => actions = actions.concat(layer.actions || []));
    return actions;
  }

  let interact = (player, tile) => {
    if (!player.isMoving()) {
      getActions(player)
        .filter((action) => action.type !== actionExecutor.TYPE_POSITIONAL)
        .filter((action) => action.x === tile.x && action.y == tile.y)
        .forEach((action) => actionExecutor.execute(action, self, player));
    }
  };

  let pause = () => {
    paused = true;
  }

  let unpause = () => {
    if (paused) {
      paused = false;
      draw();
    }
  }

  let drawLayer = (layer) => {
    for (let i = (layer.x || x); i < (layer.width || xrange); i++) {
      for (let j = (layer.y || y); j < (layer.height || yrange); j++) {
        layer.draw(i, j);
      }
    }
  }

  let setPlayerLighting = (tile) => {
    mapLayers.forEach((layer) => layer.setLight(tile.x, tile.y));
  }

  let previousTime = 0;
  let timeToDraw = (time) => !overrides.lockedFrameRate || (time - previousTime) >= 1000 / overrides.lockedFrameRate;

  let draw = (time) => {
    if (!timeToDraw(time)) {
      requestAnimationFrame(draw);
    } else {
      previousTime = time;
      context.clearRect(0, 0, controlWidth, controlHeight);
      let thingsToDraw = mapLayers.concat(players).sort((a, b) => a.zIndex > b.zIndex);
      for (let thing of thingsToDraw) {
        if (thing instanceof Player) {
          thing.draw();
          thing.move();
          setPlayerLighting(thing.getTile());
        } else {
          drawLayer(thing);
        }
      }
      drawMessages();
      if (!paused) {
        requestAnimationFrame(draw);
      }
    }
  }

  let initLayer = (layer) => {
    let mapLayer = new TileField(context, controlWidth, controlHeight);
    mapLayer.setup(layer);
    mapLayer.flip("horizontal");
    mapLayer.rotate("left");
    mapLayer.setLightmap(layer.lightmap);
    mapLayer = Object.assign(mapLayer, layer);
    return mapLayer;
  }

  let init = (map) => {
    let characters = map.characters || [];
    if (characters.length > 0) {
      let playerOptions = characters["player"];
      if (playerOptions) {
        imgLoader([{
          graphics: [playerOptions.sprites],
          spritesheet: {
            width: playerOptions.width,
            height: playerOptions.height
          }
        }]).then((playerImages) => {
          playerOptions.files = playerImages[0].files;
          playerOptions.layer = mapLayers[0];
          playerOptions.pathfindingLayer = mapLayers[playerOptions.pathfindingLayer];
          playerOptions.tileWidth = map.tileWidth;
          playerOptions.tileHeight = map.tileHeight;

          let player = new Player(context, playerOptions, playerOptions.x, playerOptions.y, pathfind);
          player.on("changeTile", (p, tile) => {
            getActions().filter((action) => action.type === actionExecutor.TYPE_POSITIONAL).forEach((action) => {
              if (action.x === tile.x && action.y === tile.y) {
                actionExecutor.execute(action, self, p);
              }
            })
          });
          players.push(player);
        });
      }
    }
    mapLayers = map.layers.map(initLayer);
    draw();
  }

  this.init = init;
  this.displayText = displayText;
  this.pause = pause;
  this.unpause = unpause;

  this.actionExecutor = actionExecutor;
}
