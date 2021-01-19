'use strict';

const Test = class extends Component {
	constructor(color, left, top, width, height) {
		super(left, top, width, height);
		this.color = color;
	}
	onSetup() {
		this.dragStart = { x: 0, y: 0, left: 0, top: 0 };
	}
	onUpdate() {
		if (this.mouse.lDrag) {
			if (this.children.some(c => c.mouse.lDrag)) return;
			if (!this.mouse.pLPressed) {
				this.dragStart = { x: this.mouse.x, y: this.mouse.y, left: this.left, top: this.top };
			}
			const move_left = this.dragStart.left - this.left + this.mouse.x - this.dragStart.x;
			const move_top = this.dragStart.top - this.top + this.mouse.y - this.dragStart.y;
			this.left += move_left;
			this.top += move_top;
			this.dragStart.x -= move_left;
			this.dragStart.y -= move_top;
		}
	}
	onDraw() {
		this.context.fillStyle = this.color;
		this.context.fillRect(0, 0, this.width, this.height);
	}
	isHit(x, y) { return super.isHit(x, y) || this.children.some(c => c.isHit(x - this.left, y - this.top)) }
};

const MainComponent = class extends Component {
	onSetup() {
		this
			.addChild(new Test("#F00", 200, 100, 500, 500))
			.addChild(new Test("#00F", 30, 30, 300, 200));
		this
			.addChild(new Test("#0F0", 230, 130, 500, 500))
			.addChild(new Test("#00F", 30, 30, 300, 200));
	}
	onDraw() {
		this.context.fillStyle = "#FFF";
		this.context.fillRect(0, 0, this.width, this.height);
		//console.log({ x: this.mouse.x, y: this.mouse.y });
	}
};
