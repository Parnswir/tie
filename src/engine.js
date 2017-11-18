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
import RenderingPipeline from './pipeline';

import TextOutput from './extensions/TextOutput';
import KeyboardInput from './extensions/KeyboardInput';
import MouseInput from './extensions/MouseInput';

import {appendHtml, computeOnce, merge} from './util';

const CONTAINER_NAME = 'container';

export default class TileEngine extends EventEmitting(null) {

  constructor(x, y, xrange, yrange, overrides) {
    super();

    this.overrides = Object.assign({}, overrides);
    this.prepareContainer();


    this.reset();
    this.initializeActionExecutor();
    this.initializeRendering({x, y, xrange, yrange});
    this.input = new CanvasInput(document, CanvasControl());

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

    this.load = (mapPath, options={}) => {
      return MapLoader.load(mapPath).then((map) => {
        this.reset();
        this.currentMap = merge(map, options);
        this.mapLayers = this.currentMap.layers.map(initLayer);
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
              playerOptions.files = playerImages[0].files;
              playerOptions.layer = this.mapLayers[0];
              playerOptions.pathfindingLayer = this.mapLayers[playerOptions.pathfindingLayer] || createEmptyLayer(currentMap);
              playerOptions.tileWidth = this.currentMap.tileWidth;
              playerOptions.tileHeight = this.currentMap.tileHeight;

              let player = new Player(this.context, playerOptions, playerOptions.x, playerOptions.y, pathfind);
              player.on("changeTile", (p, tile) => {
                this.actions.filter((action) => action.type === this.actionExecutor.TYPE_POSITIONAL).forEach((action) => {
                  if (action.x === tile.x && action.y === tile.y) {
                    this.actionExecutor.execute(action, this, p);
                  }
                })
              });
              this.addPlayer(player, characterId);
            }));
          }
        }
        return Promise.all(promises);
      });
    }

    this.init = (map) => {
      this.actionExecutor.registerAction('changeMap', (options) => this.load(options.map, options.override));
      return this.load(map).then(() => {
        this.renderer.start()

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

  reset () {
    this.paused = false;
    this.mapLayers = [];
    this.players = [];
    this.playerMap = {};
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

  initializeRendering (args) {
    this.context = CanvasControl.create("canvas", this.controlWidth, this.controlHeight, {}, CONTAINER_NAME, true);
    this.renderer = new RenderingPipeline(this, args);
    this.renderer.context = this.context;
    this.renderer.on('afterDraw', () => this.drawMessages());
  }

  get actions () {
    return this.currentMap.actions || [];
  }

  getCharacter (id) {
    return this.playerMap[id];
  }

  addPlayer (player, characterId) {
    this.players.push(player);
    this.playerMap[characterId] = player;
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
}
