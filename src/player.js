import EventEmitting from './EventEmitter';
import Direction from './direction';

export default class Player extends EventEmitting() {

  constructor(context, properties={}, x=0, y=0, pathfind) {
    super();
    this.properties = properties;
    this.tile = {x, y};
    this.previousTile = this.tile;
    this.pos = {
      x: this.tile.x * this.properties.tileWidth + this.texture.width / 2,
      y: this.tile.y * this.properties.tileHeight + this.texture.height / 2
    }
    this.context = context;
    this.pathfind = pathfind;

    this.movementFrame = 0;
    this.movementFrameCounter = Math.floor(Math.random() * this.properties.movementFrameCount);
  }

  get properties () {return this._properties}
  set properties (options) {
    options.tileWidth = options.tileWidth || 32;
    options.tileHeight = options.tileHeight || 32;
    options.movementFrameCount = options.movementFrameCount || 8;
    options.framesPerDirection = options.framesPerDirection || 4;
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
    let getFrame = () => this.properties.files[this.properties.framesPerDirection * this.direction + this.movementFrame];
    let getFrameX = (offset) => this.pos.x - this.texture.width / 2 + offset.x;
    let getFrameY = (offset) => this.pos.y - this.texture.height / 2 + offset.y;
    let offset = this.properties.layer.getOffset();
    this.context.drawImage(getFrame(), getFrameX(offset), getFrameY(offset));
  }

  get movementFrame () {return this._movementFrame}
  set movementFrame (frame) {
    this._movementFrame = frame % this.properties.framesPerDirection;
  }

  get movementFrameCounter () {return this._movementFrameCounter}
  set movementFrameCounter (frame) {
    this._movementFrameCounter = frame;
    if (this._movementFrameCounter >= this.properties.movementFrameCount - 1) {
      this.movementFrame += 1;
      this._movementFrameCounter = 0;
    }
  }

  get previousTile () {return this._previousTile}
  set previousTile (tile) {
    this._previousTile = tile;
  }

  get hadPath () {return this._hadPath || false}
  set hadPath (value) {
    this._hadPath = value;
  }

  move () {
    const speed = this.properties.speed;
    if (this.path.length > 0) {
      this.hadPath = true;
      this.movementFrameCounter += 1;

      const targetX = this.path[0].x * this.properties.tileWidth + this.texture.width / 2;
      const targetY = this.path[0].y * this.properties.tileHeight + this.texture.height / 2;

      const inPosX = (targetX === this.pos.x);
      const inPosY = (targetY === this.pos.y);

      if (inPosX && inPosY) {
        this.path.shift();
        this.createEvent("pathComplete", this.path);
      } else {
        if (!inPosX) {
          const modifier = (targetX - this.pos.x) / Math.abs(targetX - this.pos.x);
          this.direction = modifier > 0 ? 3 : 2;
          this.pos.x += modifier * speed;
        }
        if (!inPosY) {
          const modifier = (targetY - this.pos.y) / Math.abs(targetY - this.pos.y);
          this.direction = modifier > 0 ? 0 : 1;
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
