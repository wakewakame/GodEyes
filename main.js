'use strict';

const ButtonComponent = class extends Component {
	constructor(label, left, top, width, height) {
		super(left, top, width, height);
		this.label = label;
	}
	onDraw() {
		this.context.fillStyle = "#000";
		this.context.fillRect(0, 0, this.width, this.height);
		this.context.fillStyle = "#fff";
		this.context.textBaseline = "middle";
		this.context.textAlign = "center";
		this.context.fonr = "48px sans-serif";
		this.context.fillText(this.label, this.width * 0.5, this.height * 0.5);
		if (this.mouse.lPressed && (!this.mouse.pLPressed)) {
			this.events.dispatchEvent(new CustomEvent("click"));
		}
	}
}

const MainComponent = class extends Component {
	onSetup() {
		this.viewer = this.addChild(new PhotoViewerComponent(20, 20, this.width - 40, this.height - 40));
		this.button = this.addChild(new ButtonComponent("click here", 0, 0, 1, 1));
		this.button.toInvisible();
		this.onResize();
		this.viewer.events.addEventListener("open", e => {
			this.viewer.toInvisible();
			this.button.toVisible();
			console.log("a");
		});
		this.button.events.addEventListener("click", e => {
			this.viewer.toVisible();
			this.button.toInvisible();
			console.log("b");
		});
	}
	onDraw() {
		this.context.fillStyle = "#fff";
		this.context.fillRect(0, 0, this.width, this.height);
	}
	onResize() {
		this.viewer.resize(this.width - 40, this.height - 40);
		this.button.left = this.width * 0.5 - 200;
		this.button.top = this.height * 0.5 - 100;
		this.button.resize(400, 200);
	}
};
