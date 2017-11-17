import EventEmitting from './EventEmitter';

export default class Player extends EventEmitting(Object) {

  constructor(context, properties={}, x=0, y=0, pathfind) {
    super();

    let options = properties;
    options.tileWidth = options.tileWidth || 32;
    options.tileHeight = options.tileHeight || 32;
    options.movementFrameCount = options.movementFrameCount || 8;
    options.framesPerDirection = options.framesPerDirection || 4;
    options.speed = options.speed || 1;

    this.properties = options;

    const texture = (options.files || [{width: options.tileWidth, height: options.tileHeight}])[0];
    let tile = {x, y};
    let pos = {
      x: tile.x * options.tileWidth + texture.width / 2,
      y: tile.y * options.tileHeight + texture.height / 2
    };

    let speed = options.speed;
    let direction = options.direction || 0;
    this.getDirection = () => direction;
    this.setDirection = (where) => {
      direction = where % 4;
      this.createEvent("setDirection", direction);
    }

    let path = [];
    this.getPath = () => path;

    let movementFrame = 0;
    let movementFrameTimer = Math.floor(Math.random() * options.movementFrameCount);

    let getFrame = () => options.files[options.framesPerDirection * direction + movementFrame];
    let getFrameX = (offset) => pos.x - texture.width / 2 + offset.x;
    let getFrameY = (offset) => pos.y - texture.height / 2 + offset.y;

    this.goTo = function (x, y) {
      this.createEvent("goTo", {x, y});
      pathfind(options.id, [tile.x, tile.y], [x, y], options.pathfindingLayer.getLayout(), false, false)
        .then(function (data) {
          if (data.length > 0 && data[1] !== undefined) {
            path = data;
          }
        });
    };

    this.moveTo = function (x, y) {
      let directionFrom = (x, y) => 2 * (x != tile.x) + (x > tile.x) + (y < tile.y);
      let layout = options.pathfindingLayer.getLayout();
      if (layout[x][y] === 0) {
        path = [{x, y}];
      } else {
        this.setDirection(directionFrom(x, y));
      }
    }

    this.isMoving = () => path.length > 0;
    this.getTile = () => tile;

    this.getLookedAtTile = function () {
      switch (direction) {
        case 0: return {x: tile.x, y: tile.y + 1};
        case 1: return {x: tile.x, y: tile.y - 1};
        case 2: return {x: tile.x - 1, y: tile.y};
        case 3: return {x: tile.x + 1, y: tile.y};
      }
    };

    this.draw = function () {
      let offset = options.layer.getOffset();
      context.drawImage(getFrame(), getFrameX(offset), getFrameY(offset));
    };

    let previousTile = tile;
    let hadPath = false;
    this.move = function () {
      if (path.length > 0) {
        hadPath = true;
        movementFrameTimer++;
        if (movementFrameTimer >= options.movementFrameCount - 1) {
          movementFrame = (movementFrame + 1) % options.framesPerDirection;
          movementFrameTimer = 0;
        }
        let tileWidth = options.tileWidth;
        let tileHeight = options.tileHeight;
        let frameWidth = texture.width;
        let frameHeight = texture.height;

        let targetX = path[0].x * tileWidth + frameWidth / 2;
        let targetY = path[0].y * tileHeight + frameHeight / 2;

        let inPosX = (targetX === pos.x);
        let inPosY = (targetY === pos.y);

        if (inPosX && inPosY) {
          path.shift();
          this.createEvent("pathComplete", path);
        } else {
          if (!inPosX) {
            let modifier = (targetX - pos.x) / Math.abs(targetX - pos.x);
            this.setDirection(modifier > 0 ? 3 : 2);
            pos.x += modifier * speed;
          }
          if (!inPosY) {
            let modifier = (targetY - pos.y) / Math.abs(targetY - pos.y);
            this.setDirection(modifier > 0 ? 0 : 1);
            pos.y += modifier * speed;
          }
        }
      } else {
        if (hadPath) {
          this.createEvent("movementComplete");
          hadPath = false;
        }
      }
      tile = options.layer.getXYCoords(pos.x, pos.y);
      if (tile.x !== previousTile.x || tile.y !== previousTile.y) {
        this.createEvent("changeTile", tile);
        previousTile = tile;
      }
    };

    this.id = options.id;
    this.zIndex = options.zIndex;
    this.useLighting = options.useLighting;
  }
}
