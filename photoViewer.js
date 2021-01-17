/*

Todo
	- ファイルドロップが一発で通らないバグの修正
	- スクロール時にファイルが選択されてしまうバグの修正
	- Ctrl+Aなどのショートカット処理を追加
	- デザインをいい感じにする
	- 拡大時にスクロール位置がずれないようにする
	- 拡大縮小のバーを表示
	- 選択、矩形選択の機能を追加
	- Component(基底クラス)にイベントリスナー機能を追加

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
		this.isSelected = false;
	}
	onDraw() {
		// 描画範囲外にいる要素は除外
		if (this.left + this.width < 0) return;
		if (this.top + this.height < 0) return;
		if (this.parent.width <= this.left) return;
		if (this.parent.height <= this.top) return;

		// ダブルクリック時にイベントリスナーを発火
		if (this.mouse.lDoubleClick) {
			this.events.dispatchEvent(new CustomEvent("open", { detail: this }));
		}

		// 表示する画像が一定サイズ以下であれば縮小版の画像を表示する(処理速度向上のため)
		const img =
			(this.width > this.thumbnail.width * 1.5 && this.height > this.thumbnail.height * 1.5)
				? this.img
				: this.thumbnail;

		// 表示スケールの計算
		let scale = ((img.width / img.height) > (this.width / this.height)) ? (this.width / img.width) : (this.height / img.height);
		scale *= 0.9;
		const width = img.width * scale;
		const height = img.height * scale;

		// ハイライトの表示
		if (this.isHit(this.parent.mouse.x, this.parent.mouse.y)) {
			this.context.fillStyle = "#ffffff20";
			this.context.fillRect(0, 0, this.width, this.height);
		}

		// 選択状態の表示
		this.isSelected |= (this.mouse.lPressed && (!this.mouse.pLPressed));
		if (this.isSelected) {
			this.context.fillStyle = "#ffffff60";
			this.context.fillRect(0, 0, this.width, this.height);
		}

		// 画像の表示
		this.context.drawImage(img, (this.width - width) * 0.5, (this.height - height) * 0.5, width, height);
	}
};

const PhotoViewerComponent = class extends Component {
	onSetup() {
		this.zoom = 1.0;
		this.scroll = 0.0;
		this.itemW = 200;
		this.itemH = 200;
		this.zDelta = 0;
		this.clip = true;
		this.photos = new Array();
		this.onOpen = function(e) {
			this.events.dispatchEvent(new CustomEvent("open", { detail: e.detail }));
		}.bind(this);
		const ScrollBar = class extends Component {
			constructor(width) { super(0, 0, width, 0); }
			onSetup() { this.pTop = this.top; }
			draw() { this.left = this.parent.width - this.width; super.draw(); }
			onDraw() {
				this.context.fillStyle = "#171717";
				this.context.fillRect(0, -this.top, this.width, this.parent.height);
				this.context.fillStyle = "#4d4d4d";
				this.context.fillRect(0, 0, this.width, this.height);
				const itemW = this.parent.itemW * this.parent.zoom;
				const itemH = this.parent.itemH * this.parent.zoom;
				const listX = Math.floor((this.parent.width - this.width) / itemW);
				const listW = itemW * listX;
				const listHeight = Math.ceil(this.parent.photos.length / listX) * itemH;
				if ((listHeight === 0) || (listHeight <= this.parent.height)) return;
				this.height = this.parent.height * this.parent.height / listHeight;
				if (this.mouse.lPressed) {
					if (!this.mouse.pLPressed) { this.pTop = this.top; }
					this.top = this.pTop + this.parent.mouse.y - this.parent.mouse.lDragStartY;
					this.top = Math.max(Math.min(this.top, this.parent.height - this.height), 0);
					this.parent.scroll = this.top * listHeight / this.parent.height;
				}
				else {
					this.top = this.parent.height * this.parent.scroll / listHeight;
				}
			};
		};
		this.scrollbar = this.addChild(new ScrollBar(16));
	}
	addChild(child) {
		super.addChild(child);
		if (child instanceof PhotoItemComponent) {
			this.photos.push(child);
			child.events.addEventListener("open", this.onOpen);
		}
		return child;
	}
	removeChild(child) {
		super.removeChild(child);
		if (child instanceof PhotoItemComponent) {
			this.photos = this.photos.filter(c => (c !== child));
			child.events.removeEventListener("open", this.onOpen);
		}
		return child;
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

		// ショートカットの処理
		this.shortcut();

		// すべての子コンポーネントの表示位置を計算
		const itemW = this.itemW * this.zoom; const itemH = this.itemH * this.zoom;
		const listX = Math.floor((this.width - this.scrollbar.width) / itemW);
		const listW = itemW * listX;
		this.scroll = Math.min(this.scroll, Math.ceil(this.photos.length / listX) * itemH - this.height);
		this.scroll = Math.max(this.scroll, 0);
		this.photos.forEach((component, index) => {
			component.left = ((this.width - this.scrollbar.width) - listW) * 0.5 + (index % listX) * itemW;
			component.top = Math.floor(index / listX) * itemH - this.scroll;
			component.width = itemW; component.height = itemH;
			component.left += 4; component.top += 4;
			component.width -= 8; component.height -= 8;
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
	shortcut() {
		// シフトキーを押しながらで複数選択できるようにする
		if ((!this.keyboard.shift) && this.mouse.lPressed && (!this.mouse.pLPressed)) {
			this.photos.forEach(c => { c.isSelected = false; });
		}

		/*
		// Ctrl+Aで全選択
		if (this.keyboard.ctrl && this.keyboard.press.has("a")) {
			this.photos.forEach(c => { c.isSelected = true; });
		}

		// Deleteキーで選択されているものを削除
		console.log(this.keyboard.press);
		*/
	}
};
