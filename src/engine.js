const merge = require('deepmerge');

import CanvasControl from './jsiso/canvas/Control';
import CanvasInput from './jsiso/canvas/Input';
import imgLoader from './jsiso/img/load';
import jsonLoader from './jsiso/json/load';
import TileField from './jsiso/tile/Field';
import pathfind from './jsiso/pathfind/pathfind';

import MapLoader from './map';
import Player from './player';
import ActionExecutor from './action';
import EventEmitting from './EventEmitter';

import TextOutput from './extensions/TextOutput';
import KeyboardInput from './extensions/KeyboardInput';
import MouseInput from './extensions/MouseInput';

import {appendHtml, computeOnce} from './util';

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

const CONTAINER_NAME = 'container';

export default class TileEngine extends EventEmitting(Object) {

  constructor(x, y, xrange, yrange, overrides) {
    super();

    let self = this;
    overrides = Object.assign({}, overrides);

    let parent = overrides.parent || document.body;
    if (!overrides.useCustomElements) {
      appendHtml(parent, '<div id="' + CONTAINER_NAME + '"></div>');
    }
    const container = document.getElementById(CONTAINER_NAME);

    const controlWidth = container.clientWidth;
    const controlHeight = container.clientHeight;
    const context = CanvasControl.create("canvas", controlWidth, controlHeight, {}, CONTAINER_NAME, true);
    const input = new CanvasInput(document, CanvasControl());

    let currentMap;

    let paused = false;
    let mapLayers = [];
    let players = [];
    let playerMap = {};

    let actionExecutor = new ActionExecutor();
    actionExecutor.registerAction('toggleTile', (options, engine, player) => {
      let layers = mapLayers.filter((layer) => layer.zIndex === player.properties.zIndex);
      layers.forEach((layer) => {
        let currentTile = layer.getTile(options.target.x, options.target.y);
        let currentIndex = options.tiles.indexOf(currentTile);
        layer.setTile(options.target.x, options.target.y, options.tiles[(currentIndex + 1) % options.tiles.length]);
      })
    });

    let getActions = () => currentMap.actions || [];

    let interact = (player, tile) => {
      this.createEvent('interact', arguments);
      if (paused) {
        this.drawMessages();
      } else {
        if (!player.isMoving()) {
          getActions()
            .filter((action) => action.type !== actionExecutor.TYPE_POSITIONAL)
            .filter((action) => action.x === tile.x && action.y == tile.y)
            .forEach((action) => actionExecutor.execute(action, self, player));
        }
      }
    };

    let pause = () => {
      this.createEvent('pause');
      paused = true;
    }

    let unpause = () => {
      if (paused) {
        this.createEvent('unpause');
        paused = false;
        draw();
      }
    }

    let getCharacter = (id) => playerMap[id];

    let setPlayerLighting = (tile) => {
      mapLayers.forEach((layer) => layer.setLight(tile.x, tile.y));
    }

    let drawLayer = (layer) => {
      for (let i = 0; i < (layer.width || xrange); i++) {
        for (let j = 0; j < (layer.height || yrange); j++) {
          layer.draw(i, j, void 0, (layer.x || x), (layer.y || y));
        }
      }
    }

    let drawPlayer = (player) => {
      player.draw();
      player.move();
      if (player.useLighting) {
        setPlayerLighting(player.getTile());
      }
    }

    let previousTime = 0;
    let timeToDraw = (time) => !overrides.lockedFrameRate || (time - previousTime) >= 1000 / overrides.lockedFrameRate;

    let draw = (time) => {
      if (!timeToDraw(time)) {
        requestAnimationFrame(draw);
      } else {
        previousTime = time;
        context.clearRect(0, 0, controlWidth, controlHeight);
        let comparator = (a, b) => a.zIndex > b.zIndex;
        let thingsToDraw = mapLayers.sort(comparator);
        let playersToDraw = players.slice().sort(comparator);
        for (let thing of thingsToDraw) {
          while (playersToDraw.length > 0 && playersToDraw[0].zIndex < thing.zIndex) {
            drawPlayer(playersToDraw.shift());
          }
          if (thing.visible) {
            drawLayer(thing);
          }
        }
        playersToDraw.forEach(drawPlayer);
        this.drawMessages();
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

    let createEmptyLayer = computeOnce((map) => {
      let layer = {
        width: map.width,
        height: map.height,
        layout: Array(map.width * map.height).fill(0)
      }
      return initLayer(layer);
    });

    this.reset = () => {
      paused = false;
      mapLayers = [];
      players = [];
      playerMap = {};
    }

    this.load = (mapPath, options={}) => {
      return MapLoader.load(mapPath).then((map) => {
        this.reset();
        currentMap = merge(map, options);
        mapLayers = currentMap.layers.map(initLayer);
        let promises = [];
        let characters = currentMap.characters || {};
        for (let characterId of Object.keys(characters)) {
          let playerOptions = characters[characterId];
          if (playerOptions) {
            promises.push(imgLoader([{
              graphics: [playerOptions.sprites],
              spritesheet: {
                width: playerOptions.width,
                height: playerOptions.height
              }
            }]).then((playerImages) => {
              playerOptions.files = playerImages[0].files;
              playerOptions.layer = mapLayers[0];
              playerOptions.pathfindingLayer = mapLayers[playerOptions.pathfindingLayer] || createEmptyLayer(currentMap);
              playerOptions.tileWidth = currentMap.tileWidth;
              playerOptions.tileHeight = currentMap.tileHeight;

              let player = new Player(context, playerOptions, playerOptions.x, playerOptions.y, pathfind);
              player.on("changeTile", (p, tile) => {
                getActions().filter((action) => action.type === actionExecutor.TYPE_POSITIONAL).forEach((action) => {
                  if (action.x === tile.x && action.y === tile.y) {
                    actionExecutor.execute(action, self, p);
                  }
                })
              });
              players.push(player);
              playerMap[characterId] = player;
            }));
          }
        }
        return Promise.all(promises);
      });
    }

    this.init = (map) => {
      this.actionExecutor.registerAction('changeMap', (options) => this.load(options.map, options.override));
      return this.load(map).then(() => {
        draw()

        const player = 'player';
        if (overrides.enableMouseInput) {
          MouseInput(input, self, player);
        }
        if (overrides.enableKeyboardInput) {
          KeyboardInput(input, self, player);
        }
        if (overrides.enableTextOutput) {
          TextOutput(parent, self, overrides);
        }
      })
      .catch(console.error);
    }

    this.pause = pause;
    this.unpause = unpause;
    this.paused = paused;
    this.getCharacter = getCharacter;
    this.interact = interact;

    this.actionExecutor = actionExecutor;
    this.currentMap = currentMap;

    this.clearText = () => {
      this.createEvent('clearText', arguments);
    }

    this.displayText = () => {
      this.createEvent('displayText', arguments);
    }

    this.drawMessages = () => {
      this.createEvent('drawMessages', arguments);
    }
  }
}
