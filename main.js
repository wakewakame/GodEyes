'use strict';

const MainComponent = class extends Component {
	onSetup() {
		this.addChild(new PhotoViewerComponent(0, 0, this.width, this.height));
	}
	onDraw() {
	}
};
