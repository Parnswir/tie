Run this example with webpack: `node_modules/.bin/webpack-dev-server --open`. Bundle this example: `webpack [-p]`.

## This Will Show You How to

* Add the actual mechanics to your game
* Use simple built-in actions
* Create custom actions in JavaScript

## Step by Step

Actions make your game more interactive by providing the player with the ability to change objects, trigger events, alter the map, and so on. This is where the game gets its mechanics.

### Simple Built-in Actions

There are some basic actions built-in:

| Name | Description |
|------|-------------|
| move | Moves a character |
| text | Displays text |
| toggleTile | Changes a tile to the next one of a given set of options |
| changeMap | Loads a new map file |

Actions are defined in the map file:

```json
  [...]
  "layers": [...],
  "actions": [
    {
      "x": 0, "y": 0,
      "type": "text",
      "text": "This is an action to explain actions.",

      "next": {
        "type": "text",
        "tiles": "This is a text that appears after the first one."
      }
    },
    {
      "x": 2, "y": 5,
      "type": "text",
      "text": "This is another action on a different tile."
    },
    [...]
  ],
  [...]
```

Actions defined on the root level of the actions array should have x- and y-coordinates. They are triggered by pressing the `activate` key (\[Return\] / \[Space\]) when facing the tile declared in the action object. If the `type` of the action is `positional`, it is triggered by characters standing on or moving over the tile. You can chain actions by using the `next` attribute.

### Custom Actions

You can easily create your own actions. All you need is a reference to the engine object in JavaScript:

```js
// index.js
  let executeAction = (options, engine, player) => {
    alert(`You found the secret custom action!\n${JSON.stringify(options, true, 2)}`);
  }

  tileEngine.actionExecutor.registerAction('my-custom-action', executeAction);
```

The ActionExecutor manages all actions after they have been registered.
The first parameter of the registerAction function is a string to be used to identify the action in the map file (== the `type` attribute).
The second parameter is a function that is invoked when the action triggers.
It gets called with the options of the action instance, a reference to the engine object and a reference to the character that is invoking the action.

Now you can reference the custom action in the map file:

```json
  [...]
  "actions": [
    {
      "type": "my-custom-action",
      "hint": "See index.js for implementation",
      "someProperty": "someValue"
    }
  ]
  [...]
```

![an alert showing the action object](screenshot.png)

Have a look into the [map file](map.json) to see all of the above examples in action.


## What to do next?

### Learn about advanced custom actions

_Blocking Actions_

The optional third parameter to `registerAction` is used to define a blocking action.
Normally, as soon as the action triggers, it calls the function given as callback and then proceeds to the next action, without waiting for the user-supplied code to finish.
Using a blocking action (`engine.actionExecutor.registerAction('my-custom-blocking-action', executeAction, true)`), the ActionExecutor will wait until the user's code calls a callback supplied as the fourth argument to `executeAction`:

```js
// index.js
  let waitAction = (options, engine, player, callback) => {
    setTimeout(callback, options.time || 1000);
  }

  tileEngine.actionExecutor.registerAction('wait', waitAction, true);
```

```json
  [...]
  "actions": [
    {
      "type": "move",
      "entity": "player",
      "target": {"x": 3, "y": 3},
      "next": {
        "type": "wait",
        "time": 3000,
        "next": {
          "type": "move",
          "entity": "player",
          "target": {"x": 2, "y": 1},
        }
      }
    }
  ]
  [...]
```

In this example, upon activation, the player character will move to (3,3), then wait for three seconds, and move to (2,1).

_Overwriting Actions_

By default, the ActionExecutor will not accept a redefinition of already-defined actions, e.g. `registerAction('text', someFunction)` will fail, as `text` is a pre-defined action.
However, it can be useful to override built-in actions, for example if you want to build a custom text output system.
Use the optional fourth parameter of `registerAction` to override a pre-defined action:

```js
// index.js
  let customTextAction = (options, engine, player, callback) => {
    alert('Simon says: ' + options.text);
  }

  tileEngine.actionExecutor.registerAction('text', customTextAction, false, true);
```

### Go to the next example

See all concepts from the previous tutorials working together in the [next example](../07%20-%20Putting%20it%20all%20together).

### Ready for your own adventure?

Go back to the [main page](../../README.md).
