export default function ActionExecutor() {
  let actions = {};

  this.TYPE_POSITIONAL = "positional";

  this.registerAction = function (type, execute, override=false) {
    if (override || !actions[type]) {
      actions[type] = execute;
    } else {
      console.warn("Action already registered: ", type);
    }
  }

  this.execute = function (options, engine, player) {
    let executor = actions[options.type];
    if (executor) {
      executor(options, engine, player);
    }
    if (options.next) {
      this.execute(options.next, engine, player);
    }
  }

  this.registerAction("text", (options, engine, player) => engine.displayText(options.text.split("\n")), true);
  this.registerAction("move", (options, engine, player) => {
    let character = engine.getCharacter(options.entity);
    if (character !== void 0) {
      character.goTo(options.target.x, options.target.y);
    }
  })
}