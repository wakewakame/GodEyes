'use strict';

const ContextMenuComp = class extends Component {
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
					const button = new ButtonComp(text, 2, index * h + 4, this.width - 4, h - 2, font);
					this.addChild(button);
				});
				this.height = texts.length * h + 6;
				this.children.forEach((c, index) => { c.addEventListener("click", e => {
					if (texts[index].substring(0, 2) === "__") return;
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
