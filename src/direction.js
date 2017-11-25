export default class Direction {

  static get DOWN () {return 0}
  static get UP () {return 1}
  static get LEFT () {return 2}
  static get RIGHT () {return 3}

  static from (A, B) {
    return 2 * (B.x != A.x) + (B.x > A.x) + (B.y < A.y);
  }

  static tileInDirection (position, direction, step=1) {
    return {
      x: position.x + step * (direction === this.RIGHT) - step * (direction === this.LEFT),
      y: position.y + step * (direction === this.DOWN) - step * (direction === this.UP)
    }
  }

}
