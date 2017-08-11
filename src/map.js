import imageLoader from './jsiso/img/load';
import JSONLoader from './JSONLoader'

export default class MapLoader {
  constructor() {}

  static load(path) {
    return JSONLoader.load(path)
      .then(function(maps) {
        let map = maps[0];

        let images = map.tilesets.map((tileset) => ({
            graphics: [tileset.image],
            spritesheet: {
              width: tileset.tileWidth,
              height: tileset.tileHeight,
              offsetX: tileset.offsetX || 0,
              offsetY: tileset.offsetY || 0,
              spacing: tileset.spacing || 0
            }
          }));

        return imageLoader(images)
          .then(function(imgResponse) {
            map.layers = map.layers.map((layer) => Object.assign(layer, {
              graphics: imgResponse[layer.tileset].files,
              graphicsDictionary: imgResponse[layer.tileset].dictionary,
              zeroIsBlank: true,
              isometric: false,
              tileWidth: map.tileWidth,
              tileHeight: map.tileHeight
            }));

            return map;
          });
      });
  }
}
