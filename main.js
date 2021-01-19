'use strict';

const ButtonComponent = class extends Component {
	constructor(label, left, top, width, height) {
		super(left, top, width, height);
		this.label = label;
		this.pLDrag = false;
	}
	onUpdate() {
		if (this.pLDrag && (!this.mouse.lDrag) && this.isHit(this.parent.mouse.x, this.parent.mouse.y)) {
			this.events.dispatchEvent(new CustomEvent("click"));
		}
		this.pLDrag = this.mouse.lDrag;
	}
	onDraw() {
		this.context.fillStyle = "#000";
		this.context.fillRect(0, 0, this.width, this.height);
		this.context.fillStyle = "#fff";
		this.context.textBaseline = "middle";
		this.context.textAlign = "center";
		this.context.fonr = "48px sans-serif";
		this.context.fillText(this.label, this.width * 0.5, this.height * 0.5);
	}
}

const MainComponent = class extends Component {
	onSetup() {
		this.viewer = this.addChild(new PhotoViewerComponent(20, 20, this.width - 40, this.height - 40));
		this.button = this.addChild(new ButtonComponent("click here", 0, 0, 1, 1));
		this.button.isVisible = false;
		this.onResize();
		this.viewer.events.addEventListener("open", e => {
			this.viewer.isVisible = false;
			this.button.isVisible = true;
			this.activeChild = this.button;
		});
		this.button.events.addEventListener("click", e => {
			this.viewer.isVisible = true;
			this.button.isVisible = false;
			this.activeChild = this.viewer;
		});
	}
	onDraw() {
		this.context.fillStyle = "#202020";
		this.context.fillRect(0, 0, this.width, this.height);
	}
	onResize() {
		this.viewer.resize(this.width - 40, this.height - 40);
		this.button.left = this.width * 0.5 - 200;
		this.button.top = this.height * 0.5 - 100;
		this.button.resize(400, 200);
	}
};
