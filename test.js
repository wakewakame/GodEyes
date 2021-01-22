'use strict';

const MainComponent = class extends Component {
	onSetup() {
		this.mouse = { x: 0, y: 0 };
		this.addEventListener("mousemove", e => { this.mouse = e; });
	}
	onDraw() {
		this.context.fillStyle = "#FFF";
		this.context.fillRect(0, 0, this.width, this.height);
		this.context.fillStyle = "#F00";
		this.context.fillRect(this.mouse.x, this.mouse.y, 20, 20);
		//console.log({ x: this.mouse.x, y: this.mouse.y });
	}
};
