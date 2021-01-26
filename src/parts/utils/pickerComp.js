'use strict';

const PickerComp = class extends DragComp {
	constructor(radius, color, enableX, enableY) {
		super(0, 0, radius * 2, radius * 2);
		this.radius = radius;
		this.color = (color === undefined) ? "#4d4d4d" : color;
		this.enableX = (enableX === undefined) ? true : enableX;
		this.enableY = (enableY === undefined) ? true : enableY;
		this.value = { x: 0, y: 0 };
		this.targetR = this.radius;
		this.currentR = this.radius;
	}
	onUpdate() {
		if (this.mouse.over && !this.mouse.lDrag) { this.targetR = this.radius * 2; }
		else { this.targetR = this.radius; }
		this.currentR += (this.targetR - this.currentR) * 0.5;

		if (this.enableX) {
			if (this.mouse.lDrag) {
				this.value.x = this.left / this.parent.width;
			}
			else {
				this.left = this.value.x * this.parent.width;
			}
			this.left = Math.max(Math.min(this.left, this.parent.width), 0);
			this.value.x = Math.max(Math.min(this.value.x, 1), 0);
		}
		else {
			this.left = this.parent.width * 0.5;
		}
		if (this.enableY) {
			if (this.mouse.lDrag) {
				this.value.y = this.top / this.parent.height;
			}
			else {
				this.top = this.value.y * this.parent.height;
			}
			this.top = Math.max(Math.min(this.top, this.parent.height), 0);
			this.value.y = Math.max(Math.min(this.value.y, 1), 0);
		}
		else {
			this.top = this.parent.height * 0.5;
		}
	}
	onDraw() {
		this.context.fillStyle = this.color;
		this.context.beginPath();
		this.context.arc(0, 0, this.currentR, 0, 2 * Math.PI);
		this.context.fill();
	}
	isHit(p, i) {
		return (p.x ** 2) + (p.y ** 2) < (this.currentR ** 2);
	}
};
