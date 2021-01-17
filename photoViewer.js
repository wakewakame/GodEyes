/*

Todo
	- サムネイルのアスペクト比を正す
	- リストが範囲外に描画されないようにclipする
	- 拡大時にスクロール位置がずれないようにする
	- スクロールバーの追加
	- 拡大縮小のバーを表示
	- 選択、矩形選択の機能を追加
	- Component(基底クラス)にイベントリスナー機能を追加
	- 写真のクリックイベントをイベントリスナーに追加

*/

'use strict';

const PhotoItemComponent = class extends Component {
	static async create(file, name) {
		// fileからimg要素の生成
		const url = URL.createObjectURL(file);
		const createImage = new Promise((resolve, reject) => {
			const img = new Image();
			img.addEventListener("load", e => { resolve(img); });
			img.addEventListener("error", e => { reject("this file is not image."); });
			img.src = url;
		}).finally(() => { URL.revokeObjectURL(url); });
		const img = await createImage;

		// 長辺が360px以下となるようなjpegのサムネイルを作成
		let thumbnail = img;
		const beforeLongSide = Math.max(thumbnail.width, thumbnail.height);
		const afterLongSide = 360;
		if (beforeLongSide > afterLongSide) {
			const resizeCanvas = document.createElement("canvas");
			resizeCanvas.width = thumbnail.width * afterLongSide / beforeLongSide;
			resizeCanvas.height = thumbnail.height * afterLongSide / beforeLongSide;
			const context = resizeCanvas.getContext("2d");
			context.drawImage(thumbnail, 0, 0, resizeCanvas.width, resizeCanvas.height);
			const dataURL = resizeCanvas.toDataURL("image/jpeg");
			thumbnail = await (new Promise((resolve, reject) => {
				const img = new Image();
				img.addEventListener("load", e => { resolve(img); });
				img.addEventListener("error", e => { reject("this file is not image."); });
				img.src = dataURL;
			}));
		}
		
		return new PhotoItemComponent(file, name, img, thumbnail);
	}
	constructor(file, name, img, thumbnail) {
		super(0, 0, 1, 1);
		this.file = file;
		this.name = name;
		this.img = img;
		this.thumbnail = thumbnail;
	}
	onDraw() {
		if (this.left + this.width < 0) return;
		if (this.top + this.height < 0) return;
		if (this.parent.width <= this.left) return;
		if (this.parent.height <= this.top) return;
		this.context.fillStyle = "#ffffff20";
		this.context.fillRect(0, 0, this.width, this.height);
		const img =
			(this.width > this.thumbnail.width * 1.5 && this.height > this.thumbnail.height * 1.5)
				? this.img
				: this.thumbnail;
		this.context.drawImage(img, 0, 0, this.width, this.height);
	}
};

const PhotoViewerComponent = class extends Component {
	onSetup() {
		this.zoom = 1.0;
		this.scroll = 0.0;
		this.itemW = 300;
		this.itemH = 200;
		this.zDelta = 0;
		this.clip = true;
		this.photos = new Array();
	}
	addChild(child) {
		super.addChild(child);
		if (child instanceof PhotoItemComponent) { this.photos.push(child); }
	}
	removeChild(child) {
		super.removeChild(child);
		if (child instanceof PhotoItemComponent) { this.photos = this.photos.filter(c => (c !== child)); }
	}
	onDraw() {
		// スクロールをスムーズにする
		this.zDelta *= 0.6;
		this.zDelta += this.mouse.zDelta;

		// 背景を塗りつぶす
		this.context.fillStyle = "#202020";
		this.context.fillRect(0, 0, this.width, this.height);

		// 写真が0枚なら"Drop images here"を表示
		if (this.photos.length === 0) {
			this.context.fillStyle = "#fff";
			this.context.font = "48px sans-serif";
			this.context.textBaseline = "middle";
			this.context.textAlign = "center";
			this.context.fillText("Drop images here", this.width * 0.5, this.height * 0.5);
		}

		// Ctrlが押された状態でのスクロールは拡大縮小
		if (this.keyboard.ctrl) {
			const zoom = 2.0 ** (this.zDelta / 1200.0);
			this.zoom *= zoom;
			this.zoom = Math.min(this.zoom, this.width / this.itemW, this.height / this.itemH);
			this.zoom = Math.max(this.zoom, 0.4);
		}

		// 通常のスクロール
		else {
			this.scroll -= this.zDelta;
		}

		// すべての子コンポーネントの表示位置を計算
		const itemW = this.itemW * this.zoom; const itemH = this.itemH * this.zoom;
		const listX = Math.floor(this.width / itemW);
		const listW = itemW * listX;
		this.scroll = Math.min(this.scroll, Math.ceil(this.photos.length / listX) * itemH - this.height);
		this.scroll = Math.max(this.scroll, 0);
		this.photos.forEach((component, index) => {
			component.left = (this.width - listW) * 0.5 + (index % listX) * itemW;
			component.top = Math.floor(index / listX) * itemH - this.scroll;
			component.width = itemW; component.height = itemH;
		});
	}
	drop(files, x, y) { this.onDrop(files); }
	onDrop(files) {
		for(let file of files) {
			let name = file.name;
			let number = 1;
			while(this.photos.some(p => (p.name === name))) {
				name = "(" + number + ") " + file.name;
				number += 1;
			}
			PhotoItemComponent.create(file, name)
				.then(component => { this.addChild(component); })
				.catch(err => { console.error(err); });
		}
	}
};
