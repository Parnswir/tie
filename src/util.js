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


// Source: https://gist.github.com/Salakar/1d7137de9cb8b704e48a
const merge = (target, source) => {
  const isObject = (item) => (item && typeof item === 'object' && !Array.isArray(item) && item !== null);

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        merge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    });
  }
  return target;
}

const noop = () => void 0;

export {appendHtml, combine, computeOnce, merge, noop};
