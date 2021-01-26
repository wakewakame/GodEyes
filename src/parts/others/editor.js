'use strict';

const LinePickerComp = class extends Component {
	constructor(color) {
		super(0, 0, 1, 1);
		this.color = color;
	}
	onSetup() {
		this.p1 = this.addChild(new PickerComp(5, this.color));
		this.p2 = this.addChild(new PickerComp(5, this.color));
		this.p1.value.x = Math.random();
		this.p1.value.y = Math.random();
		this.p2.value.x = Math.random();
		this.p2.value.y = Math.random();
	}
	onUpdate() {
		this.width = this.parent.width;
		this.height = this.parent.height;
	}
	onDraw() {
		this.context.strokeStyle = "#f02b7d";
		this.context.lineWidth = 1;
		this.context.beginPath();
		this.context.moveTo(this.p1.left, this.p1.top);
		this.context.lineTo(this.p2.left, this.p2.top);
		this.context.stroke();
	}
	isHit(p, i) {
		if (!this.isVisible) return false;
		const p1Hit = this.p1.isHit({ x: p.x - this.p1.left, y: p.y - this.p1.top });
		const p2Hit = this.p2.isHit({ x: p.x - this.p2.left, y: p.y - this.p2.top });
		return (p1Hit || p2Hit);
	}
};

const EditorComp = class extends Component {
	constructor(img, left, top, width, height) {
		super(left, top, width, height);
		this.img = img;
		this.addEventListener("dblclick", e => {
			this.dispatchEvent("exit", {});
		});
	}
	onSetup () {
		this.linePicker1 = this.addChild(new LinePickerComp("#f02b7d"));
		this.linePicker2 = this.addChild(new LinePickerComp("#f02b7d"));
		this.linePicker3 = this.addChild(new LinePickerComp("#f02b7d"));
		this.linePicker4 = this.addChild(new LinePickerComp("#f02b7d"));
	}
	onDraw() {
		this.context.drawImage(this.img, 0, 0, this.width, this.height);
		this.context.fillStyle = "#000000C0";
		this.context.fillRect(0, 0, this.width, this.height);
	}
};
