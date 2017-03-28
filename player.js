define(() => {
  return function Player(context, properties, x=0, y=0, pathfind) {
    let options = properties;
    options.tileWidth = options.tileWidth || 32;
    options.tileHeight = options.tileHeight || 32;
    options.movementFrameCount = options.movementFrameCount || 8;
    options.framesPerDirection = options.framesPerDirection || 4;
    options.speed = options.speed || 3;

    let tile = {x, y};
    let pos = {
      x: tile.x * options.tileWidth,
      y: tile.y * options.tileHeight
    };

    let direction = options.direction || 0;
    let speed = options.speed;
    let path = [];
    let movementFrame = Math.floor(Math.random() * options.framesPerDirection);
    let movementFrameTimer = Math.floor(Math.random() * options.movementFrameCount);
    let repositioned = 0;


    let getFrame = () => options.files[options.framesPerDirection * direction + movementFrame];
    let getFrameX = (offset) => pos.x - options.files[0].width / 2 + offset.x;
    let getFrameY = (offset) => pos.x - options.files[0].height / 2 + offset.y;

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

    this.move = function () {
      let inPosX = false;
      let inPosY = false;

      if (path.length > 0) {
        movementFrameTimer++;
        if (movementFrameTimer >= options.movementFrameCount - 1) {
          movementFrame = (movementFrame + 1) % 4;
          movementFrameTimer = 0;
        }
        if (path[0].y > tile.y) {
          pos.y += speed;
          direction = 0;
        }
        if (path[0].y < tile.y) {
          pos.y -= speed;
          direction = 1;
        }
        if (path[0].x < tile.x) {
          pos.x -= speed;
          direction = 2;
        }
        if (path[0].x > tile.x) {
          pos.x += speed;
          direction = 3;
        }

        if (path[0].x === tile.x && path[0].y === tile.y) {
          if (path.length === 1 && repositioned < 10) {
            repositioned++;
            if (pos.x - options.files[0].width / 2 < tile.x * options.tileWidth + options.tileWidth / 2) {
              pos.x += Math.floor((tile.x * options.tileWidth + options.tileWidth / 2 - pos.x) / 4);
            }
            else if (pos.x + options.files[0].width / 2 > tile.x * options.tileWidth + options.tileWidth / 2) {
              pos.x -= Math.floor((pos.x - tile.x * options.tileWidth + options.tileWidth / 2) / 4);
            }
            else {
              inPosX = true;
            }
            if (pos.y - options.files[0].height / 2 < tile.y * options.tileHeight + options.tileHeight / 2) {
              pos.y += Math.floor((tile.y * options.tileHeight + options.tileHeight / 2 - pos.y) / 4);
            }
            else if (pos.y + options.files[0].height / 2 > tile.y * options.tileHeight + options.tileHeight / 2) {
              pos.y -= Math.floor((pos.y - tile.y * options.tileHeight + options.tileHeight / 2) / 4);
            }
            else {
              inPosY = true;
            }
            if (inPosX && inPosY) {
              movementFrame = 0;
              repositioned = 0;
              path.shift();
            }
          } else {
            if (repositioned >= 10) {
              movementFrame = 0;
              repositioned = 0;
            }
            path.shift();
          }
        }
      }
      tile = options.layer.getXYCoords(pos.x, pos.y);
    };

    this.id = options.id
  }
});
