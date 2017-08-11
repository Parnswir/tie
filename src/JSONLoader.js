const merge = require('deepmerge');

export default class JSONLoader {

  constructor() {}

  static load(...paths) {

    function _jsonPromise(path) {
       return new Promise(function(resolve, reject) {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", path, true);
        xmlhttp.send();
        xmlhttp.onload = function() {
          if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            resolve(JSON.parse(xmlhttp.responseText));
          }
          else {
            reject();
          }
        };
      });
    }

    function _load(path) {

      let _loadNested = async function (obj, maxDepth=10) {
        for (let property in obj) {
          if (obj.hasOwnProperty(property) && typeof(obj[property]) === 'object') {
            if (obj[property]['_load']) {
              maxDepth -= 1;
              let child = (await JSONLoader.load(obj[property]['_load']))[0];
              obj[property] = merge(child, obj[property]['_override'] || {});
            } else {
              obj[property] = await _loadNested(obj[property], maxDepth);
            }
          }
        }
        return obj;
      }
      return _jsonPromise(path)
        .then((obj) => _loadNested(obj))
        .catch((error) => {throw `Could not load map at ${path}.`});
    }

    let promises = [];
    for (let i = 0; i < paths.length; i++) {
      promises.push(_load(paths[i]));
    }
    return Promise.all(promises);
  }

};
