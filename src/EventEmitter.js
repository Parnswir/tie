let once = function (self, event, id, handler) {
  return function () {
    handler.apply(this.arguments);
    self.off(event, id);
  }
}

let EventEmitting = (superclass) => class extends superclass {

  constructor() {
    super(...arguments);

    let handlers = {};
    this.on = (event, handler) => {
      let id = Date.now();
      let element;
      if (event.startsWith('once:')) {
        event = event.replace('once:', '');
        element = {id, 'handler': once(this, event, id, handler)};
      } else {
        element = {id, handler};
      }
      if (!handlers[event]) {
        handlers[event] = [];
      }
      handlers[event].push(element);
      return id;
    };

    this.off = (event, id) => {
      let h = handlers[event] || [];
      if (id) {
        h = h.filter((e) => e.id === id);
      }
      h.forEach((element) => handlers[event].splice(h.indexOf(element), 1));
    };

    this.createEvent = (name, event) => {
      let h = handlers[name];
      if (h) {
        h.forEach((entry) => entry.handler(this, event));
      }
    }
  }
}

export default EventEmitting;
