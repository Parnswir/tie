[![CircleCI](https://circleci.com/gh/Parnswir/tie.svg?style=svg)](https://circleci.com/gh/Parnswir/tie)

# TIE - A 2D Tile Engine Prototype

This is a prototype of a 2D tile engine based on [JSIso](http://jsiso.com/), which both reduces the headaches of JSIso and adds useful features.
Simple games can be created by supplying map files, complete with layers, z-order, collision detection, path-finding, lighting, and extensible scripting.

![Screenshot](/doc/TIE.jpg)


## Examples
Have a look at the [sample directory](sample/) for tutorials.


## Development
The engine is based on ES6 modules, so if that's your thing, import it directly!

You can also use [Webpack](http://webpack.js.org) to bundle it.
Have a look at the [Webpack config file](webpack.config.js) or the official Webpack [Getting Started Guide](http://webpack.js.org/guides/get-started/) for how this works and install the dev-dependencies.

Please open an issue on Github for suggestions or bugs.
If you would like to contribute, please send a pull-request.

I would appreciate a short message if you do something cool with this engine in your own project.
Please keep in mind that JSIso (i.e. everything in the `src/jsiso` directory) is licensed under the Apache License Version 2.0.
