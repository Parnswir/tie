import EventEmitting from './EventEmitter';

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

export default class RenderPipeline extends EventEmitting(null) {

  constructor (engine, {x, y, xrange, yrange}) {
    super();
    this.engine = engine;

    this._lastRenderTime = 0;
    this._stopped = true;
  }

  get context () {return this._context}
  set context (context) {
    this.createEvent('changeContext', {renderer: this, context});
    this._context = context;
  }

  get layers () {return this._layers || []}
  set layers (layers) {
    this.createEvent('changeLayers', {renderer: this, layers});
    this._layers = layers;
  }

  setPlayerLighting (tile) {
    this.layers.forEach((layer) => layer.setLight(tile.x, tile.y));
  }

  drawLayer (layer) {
    for (let i = 0; i < (layer.width || this.xrange); i++) {
      for (let j = 0; j < (layer.height || this.yrange); j++) {
        layer.draw(i, j, void 0, (layer.x || this.x), (layer.y || this.y));
      }
    }
  }

  drawPlayer (player) {
    player.draw(this.context);
    player.move(this.context);
    if (player.useLighting) {
      this.setPlayerLighting(player.getTile());
    }
  }

  timeToDraw (time) {
    return !this.engine.overrides.lockedFrameRate ||
      (time - this._lastRenderTime) >= 1000 / this.engine.overrides.lockedFrameRate;
  }

  draw (time) {
    if (!this.timeToDraw(time)) {
      requestAnimationFrame(this.draw.bind(this));
    } else {
      this.createEvent('beforeDraw', this);
      this._lastRenderTime = time;
      this.engine.context.clearRect(0, 0, this.engine.controlWidth, this.engine.controlHeight);
      let comparator = (a, b) => a.zIndex > b.zIndex;
      let thingsToDraw = this.layers.sort(comparator);
      let playersToDraw = this.engine.players.slice().sort(comparator);
      for (let thing of thingsToDraw) {
        while (playersToDraw.length > 0 && playersToDraw[0].zIndex < thing.zIndex) {
          this.drawPlayer(playersToDraw.shift());
        }
        if (thing.visible) {
          this.drawLayer(thing);
        }
      }
      playersToDraw.forEach(this.drawPlayer.bind(this));
      this.createEvent('afterDraw', this);
      if (this._stopped) {
        this.createEvent('stoppedRendering', this);
      } else {
        requestAnimationFrame(this.draw.bind(this));
      }
    }
  }

  start () {
    this.createEvent('startRendering', this);
    this._stopped = false;
    this.draw();
  }

  stop () {
    this.createEvent('stopRendering', this);
    this._stopped = true;
  }
}
