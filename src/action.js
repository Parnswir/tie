export default class ActionExecutor {
  constructor() {
    this._actions = {};
    this.TYPE_POSITIONAL = "positional";

    this.registerAction("move", (options, engine, player) => {
      let character = engine.getCharacter(options.entity);
      if (character !== void 0) {
        character.goTo(options.target.x, options.target.y);
      }
    })
  }

  registerAction(type, execute, override=false) {
    if (override || !this._actions[type]) {
      this._actions[type] = execute;
    } else {
      console.warn("Action already registered: ", type);
    }
  }

  execute(options, engine, player) {
    let executor = this._actions[options.type];
    if (executor) {
      executor(options, engine, player);
    }
    if (options.next) {
      this.execute(options.next, engine, player);
    }
  }
}
