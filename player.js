define(() => {
  return function Player(context, properties, x=0, y=0, pathfind) {
    let options = properties;
    options.tileWidth = options.tileWidth || 32;
    options.tileHeight = options.tileHeight || 32;
    options.movementFrameCount = options.movementFrameCount || 8;
    options.framesPerDirection = options.framesPerDirection || 4;
    options.speed = options.speed || 1;

    let tile = {x, y};
    let pos = {
      x: tile.x * options.tileWidth + options.files[0].width / 2,
      y: tile.y * options.tileHeight + options.files[0].width / 2
    };

    let direction = options.direction || 0;
    let speed = options.speed;
    let path = [];
    let movementFrame = Math.floor(Math.random() * options.framesPerDirection);
    let movementFrameTimer = Math.floor(Math.random() * options.movementFrameCount);

    let getFrame = () => options.files[options.framesPerDirection * direction + movementFrame];
    let getFrameX = (offset) => pos.x - options.files[0].width / 2 + offset.x;
    let getFrameY = (offset) => pos.y - options.files[0].height / 2 + offset.y;

    this.goTo = function (x, y) {
      pathfind(options.id, [tile.x, tile.y], [x, y], options.pathfindingLayer.getLayout(), false, false)
        .then(function (data) {
          if (data.length > 0 && data[1] !== undefined) {
            path = data;
          }
        });
    };

    this.getTile = function () {
      return tile;
    };

    this.draw = function () {
      let offset = options.layer.getOffset();
      context.drawImage(getFrame(), getFrameX(offset), getFrameY(offset));
    };

    this.getDirection = function () {
      return direction;
    };

    this.setDirection = function (where) {
      direction = where % 4;
    };

    this.move = function () {
      if (path.length > 0) {
        movementFrameTimer++;
        if (movementFrameTimer >= options.movementFrameCount - 1) {
          movementFrame = (movementFrame + 1) % 4;
          movementFrameTimer = 0;
        }
        let tileWidth = options.tileWidth;
        let tileHeight = options.tileHeight;
        let frameWidth = options.files[0].width;
        let frameHeight = options.files[0].height;

        let targetX = path[0].x * tileWidth + frameWidth / 2;
        let targetY = path[0].y * tileHeight + frameHeight / 2;

        let inPosX = (targetX === pos.x);
        let inPosY = (targetY === pos.y);

        if (inPosX && inPosY) {
          path.shift();
          movementFrame = 0;
        } else {
          if (!inPosX) {
            let modifier = (targetX - pos.x) / Math.abs(targetX - pos.x);
            direction = modifier > 0 ? 3 : 2;
            pos.x += modifier * speed;
          }
          if (!inPosY) {
            let modifier = (targetY - pos.y) / Math.abs(targetY - pos.y);
            direction = modifier > 0 ? 0 : 1;
            pos.y += modifier * speed;
          }
        }
      }
      tile = options.layer.getXYCoords(pos.x, pos.y);
    };

    this.id = options.id
  }
});
