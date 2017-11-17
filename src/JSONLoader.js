import {merge} from './util';
import {getResource} from './request';

const _loadNested = async function (obj, maxDepth) {
  for (let property in obj) {
    if (obj.hasOwnProperty(property) && typeof(obj[property]) === 'object') {
      if (obj[property][JSONLoader.LOAD_PROPERTY()]) {
        let child = await _load(obj[property][JSONLoader.LOAD_PROPERTY()], maxDepth - 1);
        if (obj[property][JSONLoader.OVERRIDE_PROPERTY()]) {
          child = merge(child, obj[property][JSONLoader.OVERRIDE_PROPERTY()]);
        }
        obj[property] = child;
      } else {
        obj[property] = await _loadNested(obj[property], maxDepth);
      }
    }
  }
  return obj;
}

const _load = (path, maxDepth=JSONLoader.MAX_MERGE_DEPTH()) => {
  if (maxDepth <= 0) {
    throw 'Too many nested JSON merges!';
  }
  return getResource(path)
    .then((obj) => _loadNested(obj, maxDepth))
    .catch((error) => {throw `Could not load JSON file at ${path}.\n - ${error}`});
}

export default class JSONLoader {

  constructor() {}

  static LOAD_PROPERTY() {return '_load';}
  static OVERRIDE_PROPERTY() {return '_override';}
  static MAX_MERGE_DEPTH() {return 10;}

  static load(...paths) {
    let promises = [];
    for (let i = 0; i < paths.length; i++) {
      promises.push(_load(paths[i]));
    }
    return Promise.all(promises);
  }

};
