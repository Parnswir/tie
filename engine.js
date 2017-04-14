define([
    'jsiso/canvas/Control',
    'jsiso/canvas/Input',
    'jsiso/img/load',
    'jsiso/json/load',
    'jsiso/tile/Field',
    'jsiso/pathfind/pathfind',
    '../../player',
    '../../action'
  ],
  (CanvasControl, CanvasInput, imgLoader, jsonLoader, TileField, pathfind, Player, ActionExecutor) => {

  let requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame  ||
    window.mozRequestAnimationFrame     ||
    window.oRequestAnimationFrame       ||
    window.msRequestAnimationFrame      ||
    function(callback, element) {
      window.setTimeout(callback, 1000 / 60);
    };
  })();

  const ELEMENT_NAMES = {
    containerName: 'container',
    frameName: 'text-frame',
    messageName: 'text-message',
    indicatorName: 'text-indicator'
  };

  let appendHtml = (el, str) => {
    let div = document.createElement('div');
    div.innerHTML = str;
    while (div.children.length > 0) {
      el.appendChild(div.children[0]);
    }
  }

  let createElements = (container, names) => {
    let elements = '\
      <div id="' + names.containerName + '"></div>\
      <div class="text-frame" id="' + names.frameName + '">\
        <span class="text-message" id="' + names.messageName + '"></span>\
        <span id="' + names.indicatorName + '">▼</span>\
      </div>\
    ';
    appendHtml(container, elements);
  }

  return function TileEngine(x, y, xrange, yrange, parent=document.body, overrides) {
    let self = this;
    overrides = Object.assign({}, overrides);

    let elementNames = Object.assign(ELEMENT_NAMES, overrides.elementNames);
    createElements(parent, elementNames);
    const container = document.getElementById(elementNames.containerName);

    let textMessages = [];
    const textMessageFrame = document.getElementById(elementNames.frameName);
    const textMessage = document.getElementById(elementNames.messageName);
    const textIndicator = document.getElementById(elementNames.indicatorName)

    const controlWidth = container.clientWidth;
    const controlHeight = container.clientHeight;
    const context = CanvasControl.create("canvas", controlWidth, controlHeight, {}, elementNames.containerName, true);

    let backgroundLayers = [];
    let foregroundLayers = [];

    let paused = false;
    let mapLayers = [];
    let players = [];

    let actionExecutor = new ActionExecutor();
    actionExecutor.registerAction('toggleTile', (options, engine, player) => {
      let layers = mapLayers.filter((layer) => layer.zIndex === player.properties.zIndex);
      layers.forEach((layer) => {
        let currentTile = layer.getTile(options.target.x, options.target.y);
        let currentIndex = options.tiles.indexOf(currentTile);
        layer.setTile(options.target.x, options.target.y, options.tiles[(currentIndex + 1) % options.tiles.length]);
      })
      draw();
    });

    //CanvasControl.fullScreen();
    const input = new CanvasInput(document, CanvasControl());

    input.mouse_action(function(coords) {
      if (paused) {
        drawMessages()
      } else {
        let player = players[0];
        let layer = player.properties.layer;
        let t = layer.applyMouseFocus(coords.x, coords.y);
        player.goTo(t.x, t.y);
        if (Math.abs(t.x - player.getTile().x) + Math.abs(t.y - player.getTile().y) === 1) {
          interact(player, t);
        }
      }
    });

    textMessageFrame.onclick = () => {
      if (paused) {
        drawMessages();
      }
    };

    input.keyboard(function(pressed, status) {
      let player = players[0];
      if (status) {
        if (paused) {
          if ([13, 32].indexOf(pressed) >= 0) {
            drawMessages();
          }
        } else {
          switch (pressed) {
            case 37: player.moveTo(player.getTile().x - 1, player.getTile().y); break;
            case 38: player.moveTo(player.getTile().x, player.getTile().y - 1); break;
            case 39: player.moveTo(player.getTile().x + 1, player.getTile().y); break;
            case 40: player.moveTo(player.getTile().x, player.getTile().y + 1); break;
            case 13: case 32: interact(player, player.getLookedAtTile()); break;
          }
        }
      }
    });

    let getActions = (player=null) => {
      let layers = mapLayers;
      if (player !== null) {
        layers = layers.filter((layer) => layer.zIndex === player.properties.zIndex);
      }
      let actions = [];
      layers.forEach((layer) => actions = actions.concat(layer.actions || []));
      return actions;
    }

    let interact = (player, tile) => {
      if (!player.isMoving()) {
        getActions(player)
          .filter((action) => action.type !== actionExecutor.TYPE_POSITIONAL)
          .filter((action) => action.x === tile.x && action.y == tile.y)
          .forEach((action) => actionExecutor.execute(action, self, player));
      }
    };

    let pause = () => {
      paused = true;
    }

    let unpause = () => {
      paused = false;
      draw();
    }

    let clearText = () => {
      textMessages = [];
      textMessageFrame.classList.remove("in");
      textMessage.innerHTML = "";
      textIndicator.classList.remove("in");
      if (paused) {
        unpause();
      }
    }

    this.displayText = (text) => {
      textMessages = textMessages.concat(text);
    }

    let drawMessages = () => {
      if (textMessages.length > 0) {
        pause();
        let text = textMessages.splice(0, 1)[0];
        textMessage.innerHTML = text;
        if (!("in" in textMessageFrame.classList)) {
          textMessageFrame.classList.add("in");
        }
        if (textMessages.length >= 1) {
          textIndicator.classList.add("in");
        } else {
          textIndicator.classList.remove("in");
        }
      } else {
        clearText();
      }
    }

    let drawLayers = (layers) => {
      for (let i = y; i < yrange; i++) {
        for (let j = x; j < xrange; j++) {
          layers.forEach((layer) => layer.draw(i, j));
        }
      }
    }

    let setPlayerLighting = (tile) => {
      mapLayers.forEach((layer) => layer.setLight(tile.x, tile.y));
    }

    let previousTime = 0;
    let timeToDraw = (time) => !overrides.lockedFrameRate || (time - previousTime) >= 1000 / overrides.lockedFrameRate;

    let draw = (time) => {
      if (!timeToDraw(time)) {
        requestAnimationFrame(draw);
      } else {
        previousTime = time; 
        context.clearRect(0, 0, controlWidth, controlHeight);
        drawLayers(backgroundLayers);
        for (let player of players) {
          player.draw();
          player.move();
          setPlayerLighting(player.getTile());
        }
        drawLayers(foregroundLayers);
        drawMessages();
        if (!paused) {
          requestAnimationFrame(draw);
        }
      }
    }

    let initLayer = (layer) => {
      let mapLayer = new TileField(context, controlWidth, controlHeight);
      mapLayer.setup(layer);
      mapLayer.flip("horizontal");
      mapLayer.rotate("left");
      mapLayer.setLightmap(layer.lightmap);
      mapLayer = Object.assign(mapLayer, layer);
      return mapLayer;
    }

    this.init = (map) => {
      let playerOptions = map.characters["player"];
      imgLoader([{
        graphics: [playerOptions.sprites],
        spritesheet: {
          width: playerOptions.width,
          height: playerOptions.height
        }
      }]).then((playerImages) => {
        mapLayers = map.layers.sort((a, b) => a.zIndex > b.zIndex).map(initLayer);
        backgroundLayers = mapLayers.filter((layer) => layer.zIndex < playerOptions.zIndex && layer.visible);
        foregroundLayers = mapLayers.filter((layer) => layer.zIndex >= playerOptions.zIndex && layer.visible);

        playerOptions.files = playerImages[0].files;
        playerOptions.layer = mapLayers[0];
        playerOptions.pathfindingLayer = mapLayers[playerOptions.pathfindingLayer];
        playerOptions.tileWidth = map.tileWidth;
        playerOptions.tileHeight = map.tileHeight;

        let player = new Player(context, playerOptions, playerOptions.x, playerOptions.y, pathfind);
        player.on("changeTile", (p, tile) => {
          getActions().filter((action) => action.type === actionExecutor.TYPE_POSITIONAL).forEach((action) => {
            if (action.x === tile.x && action.y === tile.y) {
              actionExecutor.execute(action, self, p);
            }
          })
        });

        players.push(player);

        draw();
      });
    }
  }
});