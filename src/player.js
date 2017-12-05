import EventEmitting from './EventEmitter';
import Animated from './Animated';
import Direction from './direction';

export default class Player extends Animated(EventEmitting()) {

  constructor(context, properties={}, x=0, y=0, pathfind) {
    super(
      properties.movementFrameCount || 8,
      properties.framesPerDirection || 4
    );
    this.properties = properties;
    this.tile = {x, y};
    this.previousTile = this.tile;
    this.pos = {
      x: this.tile.x * this.properties.tileWidth + this.texture.width / 2,
      y: this.tile.y * this.properties.tileHeight + this.texture.height / 2
    }
    this.context = context;
    this.pathfind = pathfind;
  }

  get properties () {return this._properties}
  set properties (options) {
    options.tileWidth = options.tileWidth || 32;
    options.tileHeight = options.tileHeight || 32;
    options.speed = options.speed || 1;
    this._properties = options
  }

  get tile () {return this._tile}
  set tile ({x, y}) {
    this._tile = {x, y}
  }

  get pos () {return this._position}
  set pos (pos) {
    this._position = pos;
  }

  get direction () {
    return this.properties.direction || Direction.DOWN;
  }
  set direction (where) {
    this.properties.direction = (where + 4) % 4;
    this.createEvent("setDirection", this.properties.direction);
  }

  get path () {return this._path || []}
  set path (path) {
    this._path = path
  }

  get id () {return this._properties.id}
  set id (id) {
    this._properties.id = id;
  }

  get zIndex () {return this._properties.zIndex}
  set zIndex (zIndex) {
    this._properties.zIndex = zIndex;
  }

  get useLighting () {return this._properties.useLighting}
  set useLighting (useLighting) {
    this._properties.useLighting = useLighting;
  }

  get texture () {
    return (this.properties.files || [{
      width: this.properties.tileWidth,
      height: this.properties.tileHeight
    }])[0];
  }

  goTo (x, y) {
    this.createEvent("goTo", {x, y});
    let self = this;
    this.pathfind(this.properties.id, [this.tile.x, this.tile.y], [x, y], this.properties.pathfindingLayer.getLayout(), false, false)
      .then(function (data) {
        if (data.length > 0 && data[1] !== undefined) {
          self.path = data;
        }
      });
  }

  directionFrom (x, y) {
    return Direction.from(this.tile, {x, y});
  }

  moveTo (x, y) {
    let layout = this.properties.pathfindingLayer.getLayout();
    if (layout[x][y] === 0) {
      this.path = [{x, y}];
    } else {
      this.direction = this.directionFrom(x, y);
    }
  }

  get isMoving () {return this.path.length > 0};

  getLookedAtTile () {
    return Direction.tileInDirection(this.tile, this.direction);
  }

  draw () {
    let getFrameX = (offset) => this.pos.x - this.texture.width / 2 + offset.x;
    let getFrameY = (offset) => this.pos.y - this.texture.height / 2 + offset.y;
    let offset = this.properties.layer.getOffset();
    this.context.drawImage(this.getFrame(this.properties.files, this.direction), getFrameX(offset), getFrameY(offset));
  }

  get previousTile () {return this._previousTile}
  set previousTile (tile) {
    this._previousTile = tile;
  }

  get hadPath () {return this._hadPath || false}
  set hadPath (value) {
    this._hadPath = value;
  }

  get target () {
    if (this.path.length > 0) {
      const x = this.path[0].x * this.properties.tileWidth + this.texture.width / 2;
      const y = this.path[0].y * this.properties.tileHeight + this.texture.height / 2;
      return {x, y};
    } else {
      return this.pos;
    }
  }
  set target (target) {
    this.path = [target];
  }

  get inPosition () {
    return {
      x: this.target.x === this.pos.x,
      y: this.target.y === this.pos.y
    };
  }

  move () {
    const speed = this.properties.speed;
    if (this.path.length > 0) {
      this.hadPath = true;
      this.stepAnimation();

      if (this.inPosition.x && this.inPosition.y) {
        this.path.shift();
        this.createEvent("pathComplete", this.path);
      } else {
        if (!this.inPosition.x) {
          const modifier = (this.target.x - this.pos.x) / Math.abs(this.target.x - this.pos.x);
          this.direction = modifier > 0 ? Direction.RIGHT : Direction.LEFT;
          this.pos.x += modifier * speed;
        }
        if (!this.inPosition.y) {
          const modifier = (this.target.y - this.pos.y) / Math.abs(this.target.y - this.pos.y);
          this.direction = modifier > 0 ? Direction.DOWN : Direction.UP;
          this.pos.y += modifier * speed;
        }
      }
    } else {
      if (this.hadPath) {
        this.createEvent("movementComplete");
        this.hadPath = false;
      }
    }
    this.tile = this.properties.layer.getXYCoords(this.pos.x, this.pos.y);
    if (this.tile.x !== this.previousTile.x || this.tile.y !== this.previousTile.y) {
      this.createEvent("changeTile", this.tile);
      this.previousTile = this.tile;
    }
  }
}
