import TileEngine from '../../src/engine';

const tileEngine = new TileEngine(0, 0, 5, 5, {
  enableKeyboardInput: true,
  enableMouseInput: true
});
tileEngine.init('./map.json').then(() => {
  const player = tileEngine.getCharacter('player');
  const npc = tileEngine.getCharacter('example-npc');

  player.on('movementComplete', () => npc.goTo(player.tile.x, player.tile.y));
  npc.on('once:movementComplete', () => npc.direction = player.direction);

  document.getElementById('resetButton').addEventListener('click', (e) => {
    player.goTo(0, 0);
    player.on('once:movementComplete', () => player.direction = 0);
  });
});
