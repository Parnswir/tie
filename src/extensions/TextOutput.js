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

export default function TextOutput(parent, engine, overrides) {
  let textMessages = [];

  let elementNames = Object.assign(ELEMENT_NAMES, overrides.customElementNames);
  if (! overrides.useCustomElements) {
    createElements(parent, elementNames);
  }

  const textMessageFrame = document.getElementById(elementNames.frameName);
  const textMessage = document.getElementById(elementNames.messageName);
  const textIndicator = document.getElementById(elementNames.indicatorName)

  textMessageFrame.onclick = () => engine.drawMessages();

  engine.clearText = combine(engine.clearText, () => {
    textMessages = [];
    textMessageFrame.classList.remove("in");
    textMessage.innerHTML = "";
    textIndicator.classList.remove("in");
    engine.unpause();
  });

  engine.displayText = combine(engine.displayText, (text) => {
    textMessages = textMessages.concat(text);
  });

  engine.drawMessages = combine(engine.drawMessages, () => {
    if (textMessages.length > 0) {
      engine.pause();
      let text = textMessages.splice(0, 1)[0];
      textMessage.innerHTML = text;
      if (!("in" in textMessageFrame.classList)) {
        textMessageFrame.classList.add("in");
      }
      if (textMessages.length >= 1) {
        textIndicator.classList.add("in");
      } else {
        textIndicator.classList.remove("in");
      }
    } else {
      engine.clearText();
    }
  });

  engine.actionExecutor.registerAction("text", (options, engine, player) => engine.displayText(options.text.split("\n")), true);
}
