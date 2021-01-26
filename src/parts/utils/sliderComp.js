'use strict';

const SliderComp = class extends Component {
	constructor(left, top, length, isX, backColor, pickColor) {
		const width = 8;
		if (isX) super(left, top - width * 0.5, length, width);
		else     super(left - width * 0.5, top, width, length);
		this.isX = isX;
		this.backColor = (backColor === undefined) ? "#171717" : backColor;
		this.pickColor = pickColor;
	}
	onSetup() {
		this.picker = this.addChild(new PickerComp(12, this.pickColor, this.isX, !this.isX));
	}
	isHit(p, i) { return super.isHit(p, true); }
	onDraw() {
		this.context.fillStyle = this.backColor;
		this.context.beginPath();
		if (this.isX) {
			this.context.arc(this.height * 0.5, this.height * 0.5, this.height * 0.5, Math.PI * 0.5, -Math.PI * 0.5);
			this.context.arc(this.width - this.height * 0.5, this.height * 0.5, this.height * 0.5, -Math.PI * 0.5, Math.PI * 0.5);
		}
		else {
			this.context.arc(this.width * 0.5, this.width * 0.5, this.width * 0.5, 0, Math.PI);
			this.context.arc(this.width * 0.5, this.height - this.width * 0.5, this.width * 0.5, Math.PI, 0);
		}
		this.context.fill();
	}
};
