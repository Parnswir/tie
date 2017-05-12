Run this example with webpack: `node_modules/.bin/webpack-dev-server --open`. Bundle this example: `webpack [-p]`.

## This Will Show You How to

* Use built-in actions

## Step by Step

Actions make your game more interactive by providing the player with the ability to change objects, trigger events, alter the map, and so on. This is where the game gets its mechanics.

There are some basic actions built-in:

| Name | Description |
|------|-------------|
| move | Moves a character |
| text | Displays text |
| toggleTile | Changes a tile to the next one of a given set of options |

You can easily [create your own actions](../07%20-%20Custom%20actions), too.

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

The [map](map.json) file in this example shows a few examples of actions.


## What to do next?

### Go to the next example

Create your own actions in the [next example](../05%20-%20Custom%20actions).

### Ready for your own adventure?

Go back to the [main page](../../README.md).
