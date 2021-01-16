'use strict';

const createPhoto = async (file, name) => {
	const url = URL.createObjectURL(file);
	const createImage = new Promise((resolve, reject) => {
		const img = new Image();
		img.addEventListener("load", e => { resolve(img); });
		img.addEventListener("error", e => { reject("this file is not image."); });
		img.src = url;
	}).finally(() => { URL.revokeObjectURL(url); });
	
	const photo = {
		name: name,
		file: file,
		img: await createImage
	};

	return photo;
};

const MainComponent = class extends Component {
	onSetup() {
		this.photos = new Array();
		this.zoom = 1.0;
		this.itemW = 300;
		this.itemH = 200;
	}
	onDraw() {
		this.context.fillStyle = "#202020";
		this.context.fillRect(0, 0, this.width, this.height);

		if (this.photos.length === 0) {
			this.context.fillStyle = "#fff";
			this.context.font = "48px sans-serif";
			this.context.textBaseline = "middle";
			this.context.textAlign = "center";
			this.context.fillText("Drop images here", this.width * 0.5, this.height * 0.5);
		}

		this.zoom *= 2.0 ** (this.mouse.zDelta / 1200.0);
		this.zoom = Math.min(this.zoom, this.width / this.itemW, this.height / this.itemH);
		this.zoom = Math.max(this.zoom, 0.2);
		const itemW = this.itemW * this.zoom; const itemH = this.itemH * this.zoom;
		const icoW = itemW - 12; const icoH = itemH - 12;
		const listX = Math.floor(this.width / itemW);
		const listW = itemW * listX;
		this.context.fillStyle = "#ffffff20";
		this.photos.forEach((photo, index) => {
			const img = photo.img;
			const x = (this.width - listW) * 0.5 + (index % listX) * itemW;
			const y = Math.floor(index / listX) * itemH;
			const scale = ((img.width / img.height) > (icoW / icoH)) ? (icoW / img.width) : (icoH / img.height);
			this.context.fillRect(x, y, itemW, itemH);
			this.context.save();
			this.context.translate(x, y);
			this.context.translate(itemW * 0.5, itemH * 0.5);
			this.context.scale(scale, scale);
			this.context.translate(-img.width * 0.5, -img.height * 0.5);
			this.context.drawImage(img, 0, 0, img.width, img.height);
			this.context.restore();
		});
	}
	onDrop(files) {
		for(let file of files) {
			let name = file.name;
			let number = 1;
			while(this.photos.some(p => (p.name === name))) {
				name = "(" + number + ") " + file.name;
				number += 1;
			}
			createPhoto(file, name)
				.then(photo => { this.photos.push(photo); })
				.catch(err => { console.error(err); });
		}
	}
};
