'use strict';

const DragComponent = class extends Component {
	constructor(left, top, width, height) {
		super(left, top, width, height);
		this.addEventListener("mousedown", e => {
			this.active();
		});
		this.addEventListener("mousemove", e => {
			if (this.mouse.lDrag) { this.left += e.movementX; this.top += e.movementY; }
		});
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
	isHit(p, i) { return ((p.x - this.left + this.radius) ** 2) + ((p.y - this.top + this.radius) ** 2) < (this.radius ** 2); }
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

const Button = class extends Component {
	constructor(text, left, top, width, height, font = {}, color = {}) {
		super(left, top, width, height);
		super.clip = true;
		this.text = text;
		this.color = {
			fill: (color.fill === undefined) ? "#2b2b2b" : color.fill,
			highlight: (color.highlight === undefined) ? "#414141" : color.highlight,
			stroke: (color.stroke === undefined) ? "#0000" : color.stroke
		};
		this.font = {
			font: (font.font === undefined) ? "12px sans-serif" : font.font,
			textBaseline: (font.textBaseline === undefined) ? "middle" : font.textBaseline,
			textAlign: (font.textAlign === undefined) ? "center" : font.textAlign,
			fill: (font.fill === undefined) ? "#fff" : font.fill
		};
	}
	onDraw() {
		this.context.fillStyle = this.mouse.over ? this.color.highlight : this.color.fill;
		this.context.strokeStyle = this.color.stroke;
		this.context.beginPath();
		this.context.rect(0, 0, this.width, this.height);
		this.context.fill();
		this.context.stroke();
		this.context.fillStyle = this.font.fill;
		this.context.textBaseline = this.font.textBaseline;
		this.context.textAlign = this.font.textAlign;
		this.context.font = this.font.font;
		const dist = 34;
		const x =
			this.font.textAlign === "center" ? this.width * 0.5 :
			this.font.textAlign === "start"  ? dist :
			this.font.textAlign === "left"   ? dist :
			this.width - dist;
		this.context.fillText(this.text, x, this.height * 0.5);
	}
};

const ContextMenu = class extends Component {
	static add(parent, getLists, callback) {
		let menu = null;
		const remove = () => { parent.removeChild(menu); menu = null; };
		parent.addEventListener("mousedown", e => {
			if (menu !== null) remove();
			if (e.which === 3) {
				menu = parent.addChild(new ContextMenu(parent.mouse.x, parent.mouse.y, getLists()));
				menu.addEventListener("select", e => { remove(); callback(e); });
			}
		});
	}
	constructor(left, top, texts, width = 290) {
		super(left - 0.5, top - 0.5, width, 1);
		super.hookMouse = true;
		this.texts = texts;
	}
	onSetup() {
		const h = 24;
		this.texts.forEach((text, index) => {
			const font = { fill: "#fff", textAlign: "left" };
			if (text.substring(0, 2) === "__") {
				text = text.substring(2);
				font.fill = "#858585";
			}
			const button = new Button(text, 2, index * h + 4, this.width - 4, h - 2, font);
			this.addChild(button);
		});
		this.height = this.texts.length * h + 6;
		this.children.forEach((c, index) => { c.addEventListener("mouseup", e => {
			if (e.which !== 1) return;
			if (this.texts[index].substring(0, 2) === "__") return;
			this.dispatchEvent("select", { text: this.texts[index], index: index });
		});});
	}
	onDraw() {
		this.context.fillStyle = "#2b2b2b";
		this.context.fillRect(0, 0, this.width, this.height);
	}
	onAfterDraw() {
		this.context.strokeStyle = "#a0a0a0";
		this.context.strokeRect(0, 0, this.width, this.height);
	}
};
