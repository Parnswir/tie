const Animated = (superclass=null) => class extends superclass {

  constructor(properties = {}) {
    super(...arguments);

    this._framesPerDirection = properties.framesPerDirection || 1;
    this._animationFrameCount = properties.animationFrameCount || 1;

    this.animationFrame = 0;
    this.animationFrameCounter = Math.floor(Math.random() * this._animationFrameCount);
  }

  get animationFrame () {return this._animationFrame}
  set animationFrame (frame) {
    this._animationFrame = frame % this._framesPerDirection;
  }

  get animationFrameCounter () {return this._animationFrameCounter}
  set animationFrameCounter (frame) {
    this._animationFrameCounter = frame;
    if (this._animationFrameCounter > this._animationFrameCount - 1) {
      this.animationFrame += 1;
      this._animationFrameCounter = 0;
    }
  }

  stepAnimation () {
    this.animationFrameCounter += 1;
  }

  getFrame (frames, direction) {
    return frames[this._framesPerDirection * direction + this.animationFrame];
  }
}

export default Animated;
