import {merge} from './util';
import {getResource} from './request';

export default class JSONLoader {

  constructor() {}

  static load(...paths) {

    function _load(path, maxDepth=10) {
      let _loadNested = async function (obj, maxDepth) {
        for (let property in obj) {
          if (obj.hasOwnProperty(property) && typeof(obj[property]) === 'object') {
            if (obj[property]['_load']) {
              let child = await _load(obj[property]['_load'], maxDepth - 1);
              if (obj[property]['_override']) {
                child = merge(child, obj[property]['_override']);
              }
              obj[property] = child;
            } else {
              obj[property] = await _loadNested(obj[property], maxDepth);
            }
          }
        }
        return obj;
      }
      if (maxDepth <= 0) {
        throw 'Too many nested JSON merges!';
      }
      return getResource(path)
        .then((obj) => _loadNested(obj, maxDepth))
        .catch((error) => {throw `Could not load JSON file at ${path}.\n - ${error}`});
    }

    let promises = [];
    for (let i = 0; i < paths.length; i++) {
      promises.push(_load(paths[i]));
    }
    return Promise.all(promises);
  }

};
