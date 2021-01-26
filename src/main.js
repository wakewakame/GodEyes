'use strict';

const MainComponent = class extends Component {
	onSetup() {
		this.viewer = this.addChild(new PhotoViewerComp(20, 20, this.width - 40, this.height - 40));
		this.editor = null;
		this.viewer.addEventListener("open", e => {
			this.editor = this.addChild(new EditorComp(e.img, 0, 0, this.width, this.height));
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
