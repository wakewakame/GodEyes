'use strict';

const Test = class extends Component {
	constructor(color, left, top, width, height) {
		super(left, top, width, height);
		this.color = color;
		this.lDrag = false;
	}
	onSetup() {
		this.addEventListener("mousedown", e => {
			this.active();
			this.lDrag = true;
		});
		this.addEventListener("mouseup", e => {
			this.lDrag = false;
		});
		this.addEventListener("mousemove", e => {
			if (this.lDrag) { this.left += e.movementX; this.top += e.movementY; }
		});
	}
	onDraw() {
		this.context.fillStyle = this.color;
		this.context.fillRect(0, 0, this.width, this.height);
	}
};

const MainComponent = class extends Component {
	onSetup() {
		this.addChild(new Test("#F00", 10, 10, 200, 100));
		this.addChild(new Test("#00F", 20, 20, 200, 100));
	}
	onDraw() {
		this.context.fillStyle = "#FFF";
		this.context.fillRect(0, 0, this.width, this.height);
	}
};
