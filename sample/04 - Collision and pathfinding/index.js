import TileEngine from '../../src/engine';
import MapLoader from '../../src/map';

(new MapLoader()).load('./map.json').then((map) => {
    let tileEngine = new TileEngine(0, 0, map.height, map.width, {
      enableKeyboardInput: true,
      enableMouseInput: true
    });
    tileEngine.init(map);

    document.getElementById('resetButton').addEventListener('click', (e) => {
      let player = tileEngine.getCharacter('player');
      player.goTo(0, 0);
      player.on('once:movementComplete', () => player.setDirection(0));
    });
});
