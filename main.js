'use strict';

const ButtonComponent = class extends Component {
	constructor(label, left, top, width, height) {
		super(left, top, width, height);
		this.img = null;
	}
	onDraw() {
		if (this.img !== null) {
			const scale =
				(this.img.width / this.img.height > this.width / this.height)
					? (this.width / this.img.width)
					: (this.height / this.img.height);
			const width = this.img.width * scale;
			const height = this.img.height * scale;
			const left = (this.width - width ) * 0.5;
			const top = (this.height - height) * 0.5;
			this.context.drawImage(this.img, left, top, width, height);
		}
	}
}

const MainComponent = class extends Component {
	onSetup() {
		this.viewer = this.addChild(new PhotoViewerComponent(20, 20, this.width - 40, this.height - 40));
		this.editor = null;
		this.viewer.addEventListener("open", e => {
			this.editor = this.addChild(new EditorComponent(e.img, 0, 0, this.width, this.height));
			this.viewer.isVisible = false;
			this.editor.addEventListener("exit", e => {
				this.removeChild(this.editor);
				this.editor = null;
				this.viewer.isVisible = true;
			});
		});
	}
	onDraw() {
		this.context.fillStyle = "#202020";
		this.context.fillRect(0, 0, this.width, this.height);
	}
	onResize() {
		this.viewer.resize(this.width - 40, this.height - 40);
		if (this.editor !== null) this.editor.resize(this.width, this.height);
	}
};
