define(() => {
	return function Action(options) {

		this.execute = function (engine, player) {
			switch (options.type) {
				case "text": engine.displayText(options.text.split("\n")); break;
			}
		}
	}
});