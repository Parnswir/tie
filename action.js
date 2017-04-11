define(() => {

  return function ActionExecutor() {
    let actions = {};
    
    this.registerAction = function (type, execute, override=false) {
      if (override || !actions[type]) {
        actions[type] = execute;
      } else {
        console.warn("Action already registered: ", type);
      }
    }

    this.execute = function (options, engine, player) {
      actions[options.type](options, engine, player);
      if (options.next) {
        this.execute(options.next, engine, player);
      }
    }

    this.registerAction("text", (options, engine, player) => engine.displayText(options.text.split("\n")), true);
    this.registerAction("move", (options, engine, player) => {
      if (options.entity === "player") {
        player.goTo(options.target.x, options.target.y);
      }
    })
  }
});