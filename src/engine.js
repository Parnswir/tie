import CanvasControl from './jsiso/canvas/Control';
import CanvasInput from './jsiso/canvas/Input';
import imgLoader from './jsiso/img/load';
import jsonLoader from './jsiso/json/load';
import pathfind from './jsiso/pathfind/pathfind';

import MapLoader from './map';
import Player from './player';
import ActionExecutor from './action';
import EventEmitting from './EventEmitter';
import RenderingPipeline from './pipeline';
import LayerSystem from './LayerSystem';

import TextOutput from './extensions/TextOutput';
import KeyboardInput from './extensions/KeyboardInput';
import MouseInput from './extensions/MouseInput';

import {appendHtml, computeOnce, merge} from './util';

const CONTAINER_NAME = 'container';

export default class TileEngine extends EventEmitting() {

  constructor(x, y, xrange, yrange, overrides) {
    super();

    this.overrides = Object.assign({}, overrides);
    this.prepareContainer();

    this.initializeActionExecutor();
    this.initializeRendering({x, y, xrange, yrange});
    this.initializeLayerSystem();

    this.reset();
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

  reset () {
    this.paused = false;
    this.players = [];
    this.playerMap = {};
    this.layerSystem.layers = [];
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

  initializeLayerSystem () {
    this.layerSystem = new LayerSystem(this.context);
  }

  initializeRendering (args) {
    this.context = CanvasControl.create("canvas", this.controlWidth, this.controlHeight, {}, CONTAINER_NAME, true);
    this.renderer = new RenderingPipeline(this, args);
    this.renderer.context = this.context;
    this.renderer.on('afterDraw', () => this.drawMessages());
  }

  initializeExtensions () {
    this.extensions = [];
    const player = 'player';
    let input = new CanvasInput(document, CanvasControl());
    if (this.overrides.enableMouseInput) {
      this.extensions.push(new MouseInput(input, this, player));
    }
    if (this.overrides.enableKeyboardInput) {
      this.extensions.push(new KeyboardInput(input, this, player));
    }
    if (this.overrides.enableTextOutput) {
      this.extensions.push(new TextOutput(this.parent, this));
    }
  }

  init (map) {
    this.actionExecutor.registerAction('changeMap', (options) => this.load(options.map, options.override));
    return this.load(map).then(() => {
      this.renderer.start();
      this.initializeExtensions();
    });
  }

  get actions () {
    return this.currentMap.actions || [];
  }

  interact (player, tile) {
    this.createEvent('interact', arguments);
    if (this.paused) {
      this.drawMessages();
    } else {
      if (!player.isMoving()) {
        this.actions
          .filter((action) => action.type !== this.actionExecutor.TYPE_POSITIONAL)
          .filter((action) => action.x === tile.x && action.y == tile.y)
          .forEach((action) => this.actionExecutor.execute(action, this, player));
      }
    }
  }

  pause () {
    this.createEvent('pause');
    this.paused = true;
    this.renderer.stop();
  }

  unpause () {
    if (this.paused) {
      this.createEvent('unpause');
      this.paused = false;
      this.renderer.start();
    }
  }

  clearText () {
    this.createEvent('clearText', arguments);
  }

  displayText () {
    this.createEvent('displayText', arguments);
  }

  drawMessages () {
    this.createEvent('drawMessages', arguments);
  }

  get mapLayers () {return this.layerSystem.layers}

  load (mapPath, options={}) {
    return MapLoader.load(mapPath).then((map) => {
      this.reset();
      this.currentMap = merge(map, options);
      this.layerSystem.init(this.currentMap);
      this.renderer.layers = this.mapLayers;
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
            playerOptions = this.refinePlayerOptions(playerOptions, playerImages);
            this.addPlayer(playerOptions, characterId);
          }));
        }
      }
      return Promise.all(promises);
    });
  }

  refinePlayerOptions (playerOptions, images) {
    return Object.assign(playerOptions, {
      files: images[0].files,
      layer: this.mapLayers[0],
      pathfindingLayer: this.mapLayers[playerOptions.pathfindingLayer] || this.layerSystem.createEmptyLayer(currentMap),
      tileWidth: this.currentMap.tileWidth,
      tileHeight: this.currentMap.tileHeight
    });
  }

  getCharacter (id) {
    return this.playerMap[id];
  }

  addPlayer (playerOptions, characterId) {
    let player = new Player(this.context, playerOptions, playerOptions.x, playerOptions.y, pathfind);
    player.on("changeTile", (p, tile) => {
      this.actions.filter((action) => action.type === this.actionExecutor.TYPE_POSITIONAL).forEach((action) => {
        if (action.x === tile.x && action.y === tile.y) {
          this.actionExecutor.execute(action, this, p);
        }
      })
    });
    this.players.push(player);
    this.playerMap[characterId] = player;
  }
}
