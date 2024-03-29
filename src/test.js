'use strict';

const Test = class extends DragComp {
	constructor(color, left, top, width, height) {
		super(left, top, width, height);
		this.color = color;
	}
	onUpdate() {
		if (this.root.activeChild !== this) return;
		if (this.key.ArrowLeft)  this.left -= 3;
		if (this.key.ArrowRight) this.left += 3;
		if (this.key.ArrowUp)    this.top  -= 3;
		if (this.key.ArrowDown)  this.top  += 3;
	}
	onDraw() {
		this.context.fillStyle = this.color;
		this.context.fillRect(0, 0, this.width, this.height);
		if (!this.mouse.over) return;
		this.context.fillStyle = "#ffffff70";
		this.context.fillRect(0, 0, this.width, this.height);
	}
};

const MainComponent = class extends Component {
	onSetup() {
		this.addChild(new Test("#F00", 10, 10, 200, 100)).addChild(new Test("#0F0", 20, 30, 40, 40));
		this.addChild(new Test("#00F", 20, 20, 200, 100)).addChild(new Test("#0FF", 20, 30, 40, 40));
	}
	onDraw() {
		this.context.fillStyle = "#FFF";
		this.context.fillRect(0, 0, this.width, this.height);
	}
};
