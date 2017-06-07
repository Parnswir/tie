export default function (input, engine, playerName) {
  input.keyboard(function(pressed, status) {
    let player = engine.getCharacter(playerName);
    if (status) {
      switch (pressed) {
        case 37: player.moveTo(player.getTile().x - 1, player.getTile().y); break;
        case 38: player.moveTo(player.getTile().x, player.getTile().y - 1); break;
        case 39: player.moveTo(player.getTile().x + 1, player.getTile().y); break;
        case 40: player.moveTo(player.getTile().x, player.getTile().y + 1); break;
        case 13: case 32: engine.interact(player, player.getLookedAtTile()); break;
      }
    }
  });
}
