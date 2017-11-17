export default class Request {

  constructor() {}

  static get(path) {
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
}
