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

export {appendHtml, combine};
