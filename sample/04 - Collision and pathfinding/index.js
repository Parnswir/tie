import TileEngine from '../../src/engine';

let tileEngine = new TileEngine(0, 0, 5, 5, {
  enableKeyboardInput: true,
  enableMouseInput: true
});
tileEngine.init('./map.json').then(() => {
  let player = tileEngine.getCharacter('player');
  let npc = tileEngine.getCharacter('example-npc');

  player.on('movementComplete', () => npc.goTo(player.getTile().x, player.getTile().y));
  npc.on('once:movementComplete', () => npc.setDirection(player.getDirection()));

  document.getElementById('resetButton').addEventListener('click', (e) => {
    player.goTo(0, 0);
    player.on('once:movementComplete', () => player.setDirection(0));
  });
});
