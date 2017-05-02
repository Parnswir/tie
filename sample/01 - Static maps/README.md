Run this example with webpack: `node_modules/.bin/webpack-dev-server --open`. Bundle this example: `webpack [-p]`.

## This Will Show You How to

* Initialize the engine
* Load a map with a simple layout
* Use a tileset

![screenshot](screenshot.jpg)

## Step by Step

Welcome to the first example! Here you will learn the basics. This "game" is not really playable. Instead it will demonstrate how to load maps, and how to think in tiles.

Let's start with creating an environment for our game:

```html
<!-- index.html -->
<html>
  <head>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <script src="index.js"></script>
  </body>
</html>
```

This looks really simple, but we won't need more for this example. The [stylesheet](style.css) only defines some background colors. The rest of the initialization will be handled in the script file:

```js
// index.js
import TileEngine from '../../src/engine'; // or wherever the engine directory is
import MapLoader from '../../src/map';

// Load the map and provide it to a new TileEngine instance:
(new MapLoader()).load('./map.json').then((map) => {
    let tileEngine = new TileEngine(
      // Engine viewport:
      0,          // start rendering at x=0
      0,          // start rendering at y=0
      map.width,  // render until x=map.width
      map.height  // render until y=map.height
    );

    tileEngine.init(map); // Rendering starts here
});
```
