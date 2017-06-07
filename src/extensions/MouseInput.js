const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export default function MouseInput (input, engine, player) {
  input.mouse_action(function(coords) {
    let layer = player.properties.layer;
    let t = layer.applyMouseFocus(coords.x, coords.y);
    player.goTo(t.x, t.y);
    if (distance(t, player.getTile()) === 1 || engine.paused) {
      engine.interact(player, t);
    }
  });
}
