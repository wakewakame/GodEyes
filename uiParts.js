'use strict';

const DragComponent = class extends Component {
	setup(context) {
		this.dragStart = { x: 0, y: 0, left: 0, top: 0 };
		super.setup(context);
	}
	draw() {
		let left = this.left; let top = this.top;
		if (this.mouse.lDrag && (!this.children.some(c => c.mouse.lDrag))) {
			if (!this.mouse.pLPressed) {
				this.dragStart = { x: this.mouse.x, y: this.mouse.y, left: this.left, top: this.top };
			}
			this.left += this.dragStart.left - this.left + this.mouse.x - this.dragStart.x;
			this.top += this.dragStart.top - this.top + this.mouse.y - this.dragStart.y;
		}
		super.draw();
		this.dragStart.x -= this.left - left;
		this.dragStart.y -= this.top - top;
	}
};

const Picker = class extends DragComponent {
	constructor(radius, color, enableX, enableY) {
		super(0, 0, radius * 2, radius * 2);
		this.radius = radius;
		this.color = (color === undefined) ? "#4d4d4d" : color;
		this.enableX = (enableX === undefined) ? true : enableX;
		this.enableY = (enableY === undefined) ? true : enableY;
		this.value = { x: 0, y: 0 };
	}
	onUpdate() {
		if (this.enableX) {
			if (this.mouse.lDrag) {
				this.value.x = (this.left + this.radius) / this.parent.width;
			}
			else {
				this.left = this.value.x * this.parent.width - this.radius;
			}
			this.left = Math.max(Math.min(this.left, this.parent.width - this.radius), -this.radius);
			this.value.x = Math.max(Math.min(this.value.x, 1), 0);
		}
		else {
			this.left = this.parent.width * 0.5 - this.radius;
		}
		if (this.enableY) {
			if (this.mouse.lDrag) {
				this.value.y = (this.top + this.radius) / this.parent.height;
			}
			else {
				this.top = this.value.y * this.parent.height - this.radius;
			}
			this.top = Math.max(Math.min(this.top, this.parent.height - this.radius), -this.radius);
			this.value.y = Math.max(Math.min(this.value.y, 1), 0);
		}
		else {
			this.top = this.parent.height * 0.5 - this.radius;
		}
	}
	onDraw() {
		this.context.fillStyle = this.color;
		this.context.beginPath();
		this.context.arc(this.radius, this.radius, this.radius, 0, 2 * Math.PI);
		this.context.fill();
	}
	isHit(x, y) { return ((x - this.left - this.radius) ** 2) + ((y - this.top - this.radius) ** 2) < (this.radius ** 2); }
};

const Slider = class extends Component {
	constructor(left, top, length, isX, backColor, pickColor) {
		const width = 8;
		if (isX) super(left, top - width * 0.5, length, width);
		else     super(left - width * 0.5, top, width, length);
		this.isX = isX;
		this.backColor = (backColor === undefined) ? "#171717" : backColor;
		this.pickColor = pickColor;
	}
	onSetup() {
		this.picker = this.addChild(new Picker(12, this.pickColor, this.isX, !this.isX));
	}
	isHit(x, y) { return super.isHit(x, y) || this.picker.isHit(x - this.left, y - this.top); }
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
