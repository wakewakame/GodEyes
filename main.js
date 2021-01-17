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
		this.scroll = 0.0;
		this.itemW = 300;
		this.itemH = 200;
		this.zDelta = 0;
	}
	onDraw() {
		this.zDelta *= 0.6;
		this.zDelta += this.mouse.zDelta;

		this.context.fillStyle = "#202020";
		this.context.fillRect(0, 0, this.width, this.height);

		if (this.photos.length === 0) {
			this.context.fillStyle = "#fff";
			this.context.font = "48px sans-serif";
			this.context.textBaseline = "middle";
			this.context.textAlign = "center";
			this.context.fillText("Drop images here", this.width * 0.5, this.height * 0.5);
		}

		if (this.keyboard.ctrl) {
			this.zoom *= 2.0 ** (this.zDelta / 1200.0);
			this.zoom = Math.min(this.zoom, this.width / this.itemW, this.height / this.itemH);
			this.zoom = Math.max(this.zoom, 0.4);
		}
		else {
			this.scroll -= this.zDelta;
		}
		const itemW = this.itemW * this.zoom; const itemH = this.itemH * this.zoom;
		const icoW = itemW * 0.9; const icoH = itemH * 0.9;
		const listX = Math.floor(this.width / itemW);
		const listW = itemW * listX;
		this.scroll = Math.min(this.scroll, Math.ceil(this.photos.length / listX) * itemH - this.height);
		this.scroll = Math.max(this.scroll, 0);
		this.context.fillStyle = "#ffffff20";
		this.photos.forEach((photo, index) => {
			const img = photo.img;
			const x = (this.width - listW) * 0.5 + (index % listX) * itemW;
			const y = Math.floor(index / listX) * itemH - this.scroll;
			const scale = ((img.width / img.height) > (icoW / icoH)) ? (icoW / img.width) : (icoH / img.height);
			if (x + 4 <= this.mouse.x && this.mouse.x < x + itemW - 4 && y + 4 <= this.mouse.y && this.mouse.y < y + itemH - 4) {
				this.context.fillRect(x + 4, y + 4, itemW - 8, itemH - 8);
			}
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
