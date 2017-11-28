import TileField from './jsiso/tile/Field';

import EventEmitting from './EventEmitter';
import {computeOnce} from './util';

export default class LayerSystem extends EventEmitting() {

  constructor (context) {
    super();
    this.context = context;
    this.createEmptyLayer = computeOnce((map) => {
      let layer = {
        width: map.width,
        height: map.height,
        layout: Array(map.width * map.height).fill(0)
      }
      return this.initLayer(layer);
    });
  }

  get layers () {return this._layers || []}
  set layers (layers) {this._layers = layers}

  init (map) {
    this.layers = map.layers.map(this.initLayer.bind(this));
  }

  initLayer (layer) {
    let mapLayer = new TileField(this.context, this.context.width, this.context.height);
    mapLayer.setup(layer);
    mapLayer.flip("horizontal");
    mapLayer.rotate("left");
    mapLayer.setLightmap(layer.lightmap);
    mapLayer = Object.assign(mapLayer, layer);
    return mapLayer;
  }
}
