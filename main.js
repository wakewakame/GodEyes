'use strict';

const MainComponent = class extends Component {
	onSetup() {
		this.viewer = this.addChild(new PhotoViewerComponent(20, 20, this.width - 40, this.height - 40));
	}
	onDraw() {
		this.context.fillStyle = "#fff";
		this.context.fillRect(0, 0, this.width, this.height);
	}
	onResize() {
		this.viewer.resize(this.width - 40, this.height - 40);
	}
};
