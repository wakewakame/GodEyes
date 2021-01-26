'use strict';

const ButtonComp = class extends Component {
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
