import {noop} from 'util';

export default class ActionExecutor {
  constructor() {
    this._actions = {};
    this.TYPE_POSITIONAL = 'positional';

    this.registerAction('move', (options, engine, player, callback) => {
      let character = engine.getCharacter(options.entity);
      if (character !== void 0) {
        character.on('once:movementComplete', callback);
        character.goTo(options.target.x, options.target.y);
      }
    });

    this.registerAction(this.TYPE_POSITIONAL, () => {});
  }

  registerAction(type='default', execute=noop, blocking=false, override=false) {
    if (override || !this._actions[type]) {
      this._actions[type] = {blocking, executor: execute};
    } else {
      console.warn('Action already registered: ', type);
    }
  }

  execute(options, engine, player) {
    const {blocking, executor} = this._actions[options.type] || {blockking: false, executor: noop};
    if (executor) {
      if (options.next) {
        if (blocking) {
          executor(options, engine, player, this.execute.bind(this, options.next, engine, player));
        } else {
          executor(options, engine, player);
          this.execute(options.next, engine, player);
        }
      } else {
        executor(options, engine, player, noop);
      }
    } else {
      console.warn('Unknown action: ', options.type);
    }
  }
}
