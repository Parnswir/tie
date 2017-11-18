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

import {appendHtml, computeOnce, merge} from './util';

const requestAnimFrame = (function() {
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

export default class TileEngine extends EventEmitting(null) {

  constructor(x, y, xrange, yrange, overrides) {
    super();

    this.overrides = Object.assign({}, overrides);
    this.prepareContainer();

    this.context = CanvasControl.create("canvas", this.controlWidth, this.controlHeight, {}, CONTAINER_NAME, true);
    this.input = new CanvasInput(document, CanvasControl());

    this.currentMap = void 0;
    this.mapLayers = [];

    let paused = false;
    let players = [];
    let playerMap = {};

    this.initializeActionExecutor();

    let getActions = () => this.currentMap.actions || [];

    let interact = (player, tile) => {
      this.createEvent('interact', arguments);
      if (paused) {
        this.drawMessages();
      } else {
        if (!player.isMoving()) {
          getActions()
            .filter((action) => action.type !== this.actionExecutor.TYPE_POSITIONAL)
            .filter((action) => action.x === tile.x && action.y == tile.y)
            .forEach((action) => this.actionExecutor.execute(action, this, player));
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
      this.mapLayers.forEach((layer) => layer.setLight(tile.x, tile.y));
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
        this.context.clearRect(0, 0, this.controlWidth, this.controlHeight);
        let comparator = (a, b) => a.zIndex > b.zIndex;
        let thingsToDraw = this.mapLayers.sort(comparator);
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
      let mapLayer = new TileField(this.context, this.controlWidth, this.controlHeight);
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
      this.mapLayers = [];
      players = [];
      playerMap = {};
    }

    this.load = (mapPath, options={}) => {
      return MapLoader.load(mapPath).then((map) => {
        this.reset();
        this.currentMap = merge(map, options);
        this.mapLayers = this.currentMap.layers.map(initLayer);
        let promises = [];
        let characters = this.currentMap.characters || {};
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
              playerOptions.layer = this.mapLayers[0];
              playerOptions.pathfindingLayer = this.mapLayers[playerOptions.pathfindingLayer] || createEmptyLayer(currentMap);
              playerOptions.tileWidth = this.currentMap.tileWidth;
              playerOptions.tileHeight = this.currentMap.tileHeight;

              let player = new Player(this.context, playerOptions, playerOptions.x, playerOptions.y, pathfind);
              player.on("changeTile", (p, tile) => {
                getActions().filter((action) => action.type === this.actionExecutor.TYPE_POSITIONAL).forEach((action) => {
                  if (action.x === tile.x && action.y === tile.y) {
                    this.actionExecutor.execute(action, this, p);
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
          this.extensions.push(new MouseInput(this.input, this, player));
        }
        if (overrides.enableKeyboardInput) {
          this.extensions.push(new KeyboardInput(this.input, this, player));
        }
        if (overrides.enableTextOutput) {
          this.extensions.push(new TextOutput(this.parent, this, overrides));
        }
      })
      .catch(console.error);
    }

    this.pause = pause;
    this.unpause = unpause;
    this.paused = paused;
    this.getCharacter = getCharacter;
    this.interact = interact;

    this.extensions = [];

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

  prepareContainer () {
    this.parent = this.overrides.parent || document.body;
    if (!this.overrides.useCustomElements) {
      appendHtml(this.parent, '<div id="' + CONTAINER_NAME + '"></div>');
    }
    this.container = document.getElementById(CONTAINER_NAME);
    this.controlWidth = this.container.clientWidth;
    this.controlHeight = this.container.clientHeight;
  }

  initializeActionExecutor () {
    this.actionExecutor = new ActionExecutor();
    this.actionExecutor.registerAction('toggleTile', (options, engine, player) => {
      let layers = engine.mapLayers.filter((layer) => layer.zIndex === player.properties.zIndex);
      layers.forEach((layer) => {
        let currentTile = layer.getTile(options.target.x, options.target.y);
        let currentIndex = options.tiles.indexOf(currentTile);
        layer.setTile(options.target.x, options.target.y, options.tiles[(currentIndex + 1) % options.tiles.length]);
      })
    });
  }
}
