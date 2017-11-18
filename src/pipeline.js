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

  constructor (engine) {
    super();
    this.engine = engine;

    this._lastRenderTime = 0;
    this._stopped = true;
  }

  setPlayerLighting (tile) {
    this.engine.mapLayers.forEach((layer) => layer.setLight(tile.x, tile.y));
  }

  drawLayer (layer) {
    for (let i = 0; i < (layer.width || this.engine.xrange); i++) {
      for (let j = 0; j < (layer.height || this.engine.yrange); j++) {
        layer.draw(i, j, void 0, (layer.x || this.engine.x), (layer.y || this.engine.y));
      }
    }
  }

  drawPlayer (player) {
    player.draw();
    player.move();
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
      requestAnimationFrame(this.draw);
    } else {
      this.createEvent('beforeDraw', this);
      this._lastRenderTime = time;
      this.engine.context.clearRect(0, 0, this.engine.controlWidth, this.engine.controlHeight);
      let comparator = (a, b) => a.zIndex > b.zIndex;
      let thingsToDraw = this.engine.mapLayers.sort(comparator);
      let playersToDraw = this.engine.players.slice().sort(comparator);
      for (let thing of thingsToDraw) {
        while (playersToDraw.length > 0 && playersToDraw[0].zIndex < thing.zIndex) {
          this.drawPlayer(playersToDraw.shift());
        }
        if (thing.visible) {
          this.drawLayer(thing);
        }
      }
      playersToDraw.forEach(this.drawPlayer);
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
