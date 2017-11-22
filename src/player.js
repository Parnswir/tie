import EventEmitting from './EventEmitter';

export default class Player extends EventEmitting() {

  constructor(context, properties={}, x=0, y=0, pathfind) {
    super();
    this.properties = properties;
    this.tile = {x, y};
    this.path = [];
    this.context = context;

    this.movementFrame = 0;
    this.movementFrameTimer = Math.floor(Math.random() * this.properties.movementFrameCount);

    let previousTile = this.tile;
    let hadPath = false;
    this.move = function () {
      let speed = this.properties.speed;
      if (this.path.length > 0) {
        hadPath = true;
        movementFrameTimer += 1;

        let tileWidth = this.properties.tileWidth;
        let tileHeight = this.properties.tileHeight;
        let frameWidth = this.texture.width;
        let frameHeight = this.texture.height;

        let targetX = this.path[0].x * tileWidth + frameWidth / 2;
        let targetY = this.path[0].y * tileHeight + frameHeight / 2;

        let inPosX = (targetX === this.pos.x);
        let inPosY = (targetY === this.pos.y);

        if (inPosX && inPosY) {
          this.path.shift();
          this.createEvent("pathComplete", this.path);
        } else {
          if (!inPosX) {
            let modifier = (targetX - this.pos.x) / Math.abs(targetX - this.pos.x);
            this.setDirection(modifier > 0 ? 3 : 2);
            this.pos.x += modifier * speed;
          }
          if (!inPosY) {
            let modifier = (targetY - this.pos.y) / Math.abs(targetY - this.pos.y);
            this.setDirection(modifier > 0 ? 0 : 1);
            this.pos.y += modifier * speed;
          }
        }
      } else {
        if (hadPath) {
          this.createEvent("movementComplete");
          hadPath = false;
        }
      }
      this.tile = this.properties.layer.getXYCoords(this.pos.x, this.pos.y);
      if (this.tile.x !== previousTile.x || this.tile.y !== previousTile.y) {
        this.createEvent("changeTile", this.tile);
        previousTile = this.tile;
      }
    };

    this.id = this.properties.id;
    this.zIndex = this.properties.zIndex;
    this.useLighting = this.properties.useLighting;
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

  get pos () {
    return {
      x: this.tile.x * this.properties.tileWidth + this.texture.width / 2,
      y: this.tile.y * this.properties.tileHeight + this.texture.height / 2
    }
  }

  get direction () {
    return this.properties.direction || 0;
  }
  set direction (where) {
    this.properties.direction = (where + 4) % 4;
    this.createEvent("setDirection", this.properties.direction);
  }

  get path () {return this._path}
  set path (path) {
    this._path = path
  }

  get texture () {
    return (this.properties.files || [{
      width: this.properties.tileWidth,
      height: this.properties.tileHeight
    }])[0];
  }

  goTo (x, y) {
    this.createEvent("goTo", {x, y});
    this.pathfind(this.properties.id, [this.tile.x, this.tile.y], [x, y], this.properties.pathfindingLayer.getLayout(), false, false)
      .then(function (data) {
        if (data.length > 0 && data[1] !== undefined) {
          this.path = data;
        }
      });
  }

  directionFrom (x, y) {
    return 2 * (x != this.tile.x) + (x > this.tile.x) + (y < this.tile.y);
  }

  moveTo (x, y) {
    let layout = this.properties.pathfindingLayer.getLayout();
    if (layout[x][y] === 0) {
      this.path = [{x, y}];
    } else {
      this.setDirection(this.directionFrom(x, y));
    }
  }

  get isMoving () {return this.path.length > 0};

  getLookedAtTile () {
    switch (this.direction) {
      case 0: return {x: this.tile.x, y: this.tile.y + 1};
      case 1: return {x: this.tile.x, y: this.tile.y - 1};
      case 2: return {x: this.tile.x - 1, y: this.tile.y};
      case 3: return {x: this.tile.x + 1, y: this.tile.y};
    }
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
}
