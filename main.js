'use strict';

const Photo = class {
	constructor(file) {
		this.file = file;
		//this.image = ...;
		//this.camera = {...};
	}
};

const MainComponent = class extends Component {
	onSetup() {
		this.files = new Map();
	}
	onDraw() {
		this.context.fillStyle = "rgb(255, 255, 255)";
		this.context.fillRect(0, 0, this.width, this.height);
		this.context.font = "48px serif";
		this.context.fillStyle = "rgb(0, 0, 0)";
		let i = 0;
		this.files.forEach((value, key) => {
			i += 1;
			this.context.fillText(key, 100, i * 100);
		});
	}
	onDrop(files) {
		for(let file of files) {
			this.files.set(file.name, new Photo(file));
		}
	}
};
