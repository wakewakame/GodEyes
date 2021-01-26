'use strict';

const DragComponent = class extends Component {
	constructor(left, top, width, height) {
		super(left, top, width, height);
		this.dragStart = { x: 0, y: 0 };
		this.addEventListener("mousedown", e => {
			this.active();
			this.dragStart.x = e.x;
			this.dragStart.y = e.y;
		});
		this.addEventListener("mousemove", e => {
			if (e.from !== this) return;
			if (this.mouse.lDrag) {
				this.left += this.mouse.x - this.dragStart.x;
				this.top += this.mouse.y - this.dragStart.y;
			}
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
		this.isClip = true;
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

const Scroll = class extends Component {
	constructor(pageComponent, left, top, width, height) {
		super(left, top, width, height);
		this.isClip = true;
		this.pageComponent = pageComponent;
		this.scrollSpeed = 0;
	}
	onSetup() {
		this.addEventListener("mousewheel", e => {
			if (e.ctrlKey) return;
			this.scrollSpeed += e.wheel;
		});
		this.addChild(this.pageComponent);
		const ScrollBar = class extends Component {
			constructor() {
				super(0, 0, 17, 0);
				this.dragStartY = 0;
				this.dragStartTop = 0;
				this.dragStartBottom = 0;
				this.barTop = 0;
				this.barHeight = 0;
			}
			onSetup() {
				this.addEventListener("mousedown", e => {
					this.dragStartY = this.mouse.y;
					this.dragStartTop = this.barTop;
					this.dragStartBottom = this.barTop + this.barHeight;
				});
			}
			onUpdate() {
				const page = this.parent.pageComponent;
				this.left = this.parent.width - this.width;
				this.height = this.parent.height;
				this.barHeight = this.height * this.height / page.height;
				if (this.mouse.lDrag) {
					let barTop = 0;
					if ((this.dragStartTop <= this.dragStartY) && (this.dragStartY < this.dragStartBottom)) {
						barTop = this.dragStartTop + this.mouse.y - this.dragStartY;
					}
					else {
						barTop = this.mouse.y - this.barHeight * 0.5;
					}
					barTop = Math.max(barTop, 0);
					barTop = Math.min(barTop, this.height - this.barHeight);
					page.top = -page.height * barTop / this.height;
				}
				this.barTop = this.height * (-page.top) / page.height;
			}
			onDraw() {
				const page = this.parent.pageComponent;
				if ((page.height === 0) || (page.height <= this.parent.height)) return;
				this.context.fillStyle = "#171717";
				this.context.fillRect(0, 0, this.width, this.parent.height);
				this.context.fillStyle = "#4d4d4d";
				this.context.fillRect(1, 1 + this.barTop, this.width - 2, this.barHeight - 2);
			};
		};
		this.scrollbar = this.addChild(new ScrollBar());
	}
	onUpdate() {
		// 方向キーでスクロール
		this.scrollSpeed += this.key.ArrowUp   ? 10.0 : 0.0;
		this.scrollSpeed -= this.key.ArrowDown ? 10.0 : 0.0;

		// 通常のスクロール
		const top = this.pageComponent.top;
		this.pageComponent.top += this.scrollSpeed;

		// スクロールの上限チェック
		this.pageComponent.top = Math.max(this.pageComponent.top, this.height - this.pageComponent.height);
		this.pageComponent.top = Math.min(this.pageComponent.top, 0);

		this.pageComponent.mouse.y -= this.pageComponent.top - top;

		// スクロール速度の減衰
		this.scrollSpeed *= 0.6;
	}
	onResize() {
		this.pageComponent.left = 0;
		this.pageComponent.width = this.width - 17;
	}
};

const ContextMenu = class extends Component {
	constructor(getMenuList, onSelect, left = 0, top = 0, width = 290) {
		super(left - 0.5, top - 0.5, width, 1);
		this.isVisible = false;
		this.isFront = true;
		this.getMenuList = getMenuList;
		this.onSelect = onSelect;
	}
	onSetup() {
		this.parent.addEventListener("mousedown", e => {
			if (this.isVisible && (!this.isHit({ x: e.x - this.left, y: e.y - this.top }))) {
				this.isVisible = false;
			}
		});
		this.parent.addEventListener("mouseup", e => {
			if (e.which === 3) {
				this.isVisible = true;
				this.left = e.x; this.top = e.y;
				this.children.slice().forEach(c => { this.removeChild(c); });
				const h = 24;
				const font = { fill: "#fff", textAlign: "left" };
				const texts = this.getMenuList();
				texts.forEach((text, index) => {
					if (text.substring(0, 2) === "__") {
						text = text.substring(2);
						font.fill = "#858585";
					}
					const button = new Button(text, 2, index * h + 4, this.width - 4, h - 2, font);
					this.addChild(button);
				});
				this.height = texts.length * h + 6;
				this.children.forEach((c, index) => { c.addEventListener("mouseup", e => {
					if (e.which !== 1) return;
					if (texts[index].substring(0, 2) === "__") return;
					if (!c.isHit(e)) return;
					this.isVisible = false;
					this.onSelect({ text: texts[index], index: index });
				});});
			}
		});
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
