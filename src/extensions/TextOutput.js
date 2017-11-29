import {appendHtml, combine} from './../util';

const ELEMENT_NAMES = {
  frameName: 'text-frame',
  messageName: 'text-message',
  indicatorName: 'text-indicator'
};

let createElements = (container, names) => {
  const elements = '\
    <div class="text-frame" id="' + names.frameName + '">\
      <span class="text-message" id="' + names.messageName + '"></span>\
      <span id="' + names.indicatorName + '">▼</span>\
    </div>';
  appendHtml(container, elements);
}

export default class TextOutput {

  constructor(parent, engine) {
    let elementNames = Object.assign(ELEMENT_NAMES, engine.overrides.customElementNames);
    if (!engine.overrides.useCustomElements) {
      createElements(parent, elementNames);
    }

    this._textMessages = [];
    this.engine = engine;

    this.textMessageFrame = document.getElementById(elementNames.frameName);
    this.textMessage = document.getElementById(elementNames.messageName);
    this.textIndicator = document.getElementById(elementNames.indicatorName)

    this.textMessageFrame.onclick = () => engine.drawMessages();

    engine.clearText = combine(engine.clearText, this.clearText.bind(this));
    engine.displayText = combine(engine.displayText, this.displayText.bind(this));
    engine.drawMessages = combine(engine.drawMessages, this.drawMessages.bind(this));

    engine.actionExecutor.registerAction("text", (options, engine, player, callback) => {
      engine.displayText(options.text.split("\n"));
    }, false, true);
  }

  clearText () {
    this._textMessages = [];
    this.textMessageFrame.classList.remove("in");
    this.textMessage.innerHTML = "";
    this.textIndicator.classList.remove("in");
    this.engine.unpause();
  }

  displayText (text) {
    this._textMessages = this._textMessages.concat(text);
  }

  drawMessages () {
    if (this._textMessages.length > 0) {
      this.engine.pause();
      const text = this._textMessages.splice(0, 1)[0];
      this.textMessage.innerHTML = text;
      if (!("in" in this.textMessageFrame.classList)) {
        this.textMessageFrame.classList.add("in");
      }
      if (this._textMessages.length >= 1) {
        this.textIndicator.classList.add("in");
      } else {
        this.textIndicator.classList.remove("in");
      }
    } else {
      this.clearText();
    }
  }
}
