let appendHtml = (el, str) => {
  let div = document.createElement('div');
  div.innerHTML = str;
  while (div.children.length > 0) {
    el.appendChild(div.children[0]);
  }
}

let combine = function (a, b) {
  return function () {
    a.apply(this, arguments);
    return b.apply(this, arguments);
  }
}

let computeOnce = (fn) => {
  let instance = void 0;
  return function () {
    if (instance === void 0) {
      instance = fn.apply(this, arguments);
    }
    return instance;
  }
}

const noop = () => void 0;

export {appendHtml, combine, computeOnce, noop};
