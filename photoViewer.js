/*

Todo
	- 拡大縮小のバーを表示

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
	onUpdate() {
		// ダブルクリック時にイベントリスナーを発火
		if (this.mouse.lDoubleClick) {
			this.events.dispatchEvent(new CustomEvent("open", { detail: this }));
		}

	}
	onDraw() {
		// 描画範囲外にいる要素は除外
		if (this.left + this.width < 0) return;
		if (this.top + this.height < 0) return;
		if (this.parent.width <= this.left) return;
		if (this.parent.height <= this.top) return;

		// 表示する画像が一定サイズ以下であれば縮小版の画像を表示する(処理速度向上のため)
		const img =
			(this.width > this.thumbnail.width * 1.5 && this.height > this.thumbnail.height * 1.5)
				? this.img
				: this.thumbnail;

		// 表示スケールの計算
		let scale =
			((img.width / img.height) > (this.width / this.height))
				? (this.width / img.width)
				: (this.height / img.height);
		scale *= 0.9;
		const width = img.width * scale;
		const height = img.height * scale;

		// ハイライトの表示
		if (this.isHit(this.parent.mouse.x, this.parent.mouse.y)) {
			this.context.fillStyle = "#4d4d4d";
			this.context.fillRect(0, 0, this.width, this.height);
		}

		// 選択状態の表示
		if (this.mouse.lPressed && (!this.mouse.pLPressed)) {
			if (this.keyboard.ctrl) { this.isSelected = !this.isSelected; }
			else { this.isSelected |= true; }
		}
		if (this.isSelected) {
			this.context.fillStyle = "#777777";
			this.context.fillRect(0, 0, this.width, this.height);
		}

		// 画像の表示
		this.context.drawImage(img, (this.width - width) * 0.5, this.height * 0.95 - height, width, height);
	}
};

const PhotoViewerComponent = class extends Component {
	onSetup() {
		this.zoom = 1.0;           // 拡大率
		this.scroll = 0.0;         // スクロール座標
		this.itemW = 200;          // リストアイテムのデフォルトの横幅
		this.itemH = 200;          // リストアイテムのデフォルトの縦幅
		this.itemW_ = this.itemW;  // = this.itemW * this.zoom
		this.itemH_ = this.itemH;  // = this.itemH * this.zoom
		this.listX = 0;            // リストの列数
		this.listW = 0;            // リストのよこはば
		this.listH = 0;            // リストの縦幅
		this.zDelta = 0;           // マウスホイール(スムーズなアニメーションになるように計算するため)
		super.clip = true;         // 範囲外に描画されるものを隠す
		this.selectedArea = {
			isEnable: false,
			left: 0, top: 0, right: 0, bottom: 0,
			pivotX: 0, pivotY: 0, pivotScroll: 0,
			items: new Array()
		};
		this.photos = new Array();  // リストアイテムの配列
		this.onOpen = function(e) {
			this.events.dispatchEvent(new CustomEvent("open", { detail: e.detail }));
		}.bind(this);
		const ScrollBar = class extends Component {
			constructor() { super(0, 0, 17, 0); }
			onSetup() {
				this.dragStartY = 0;
				this.dragStartTop = 0;
				this.dragStartBottom = 0;
				this.barTop = 0;
				this.barHeight = 0;
			}
			onUpdate() {
				this.left = this.parent.width - this.width;
				this.height = this.parent.height;
				this.barHeight = this.height * this.height / this.parent.listH;
				if (this.mouse.lDrag) {
					if (!this.mouse.pLPressed) {
						this.dragStartY = this.mouse.y;
						this.dragStartTop = this.barTop;
						this.dragStartBottom = this.barTop + this.barHeight;
					}
					let barTop = 0;
					if ((this.dragStartTop <= this.dragStartY) && (this.dragStartY < this.dragStartBottom)) {
						barTop = this.dragStartTop + this.mouse.y - this.dragStartY;
					}
					else {
						barTop = this.mouse.y - this.barHeight * 0.5;
					}
					barTop = Math.max(barTop, 0);
					barTop = Math.min(barTop, this.height - this.barHeight);
					this.parent.scroll = this.parent.listH * barTop / this.height;
				}
				this.barTop = this.height * this.parent.scroll / this.parent.listH;
			}
			onDraw() {
				if ((this.parent.listH === 0) || (this.parent.listH <= this.parent.height)) return;
				this.context.fillStyle = "#171717";
				this.context.fillRect(0, 0, this.width, this.parent.height);
				this.context.fillStyle = "#4d4d4d";
				this.context.fillRect(1, 1 + this.barTop, this.width - 2, this.barHeight - 2);
			};
		};
		this.scrollbar = this.addChild(new ScrollBar());
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
	onUpdate() {
		// スクロールをスムーズにする
		this.zDelta *= 0.6;
		this.zDelta += this.mouse.zDelta;

		// Ctrlが押された状態でのスクロールは拡大縮小
		// 選択状態のときは拡大縮小はしない
		if (this.keyboard.ctrl && (!this.mouse.lDrag)) {
			// アイコンサイズの拡大縮小
			const zoom = 2.0 ** (this.zDelta / 1200.0);
			const zoom_ = this.zoom;
			this.zoom *= zoom;
			this.zoom = Math.min(this.zoom, this.width / this.itemW, this.height / this.itemH);
			this.zoom = Math.max(this.zoom, 0.4);
			this.itemW_ = this.itemW * this.zoom;
			this.itemH_ = this.itemH * this.zoom;

			// アイコンサイズの変更に伴い列数の再計算
			this.listX = Math.floor((this.width - this.scrollbar.width) / this.itemW_);
			this.listW = this.itemW_ * this.listX;

			// 今見ている部分を中心に拡大縮小する
			const beforeMiddle = this.scroll / (this.listH - this.height);
			this.listH = Math.ceil(this.photos.length / this.listX) * this.itemH_;
			this.scroll = beforeMiddle * (this.listH - this.height);
		}

		// 通常のスクロール
		else {
			this.scroll -= this.zDelta;
			this.listX = Math.floor((this.width - this.scrollbar.width) / this.itemW_);
			this.listW = this.itemW_ * this.listX;
			this.listH = Math.ceil(this.photos.length / this.listX) * this.itemH_;
		}

		// スクロールの上限チェック
		this.scroll = Math.min(this.scroll, Math.ceil(this.photos.length / this.listX) * this.itemH_ - this.height);
		this.scroll = Math.max(this.scroll, 0);

		// ドラッグで選択
		this.selectedArea.isEnable = false;
		if (this.mouse.lDrag && (!this.scrollbar.mouse.lDrag)) {
			if (!this.mouse.pLPressed) {
				this.selectedArea.pivotX = this.mouse.x;
				this.selectedArea.pivotY = this.mouse.y;
				this.selectedArea.pivotScroll = this.scroll;
				this.selectedArea.items = new Array();
			}
			this.selectedArea.pivotY -= this.scroll - this.selectedArea.pivotScroll;
			this.selectedArea.pivotScroll = this.scroll;
			this.selectedArea.left   = Math.min(this.mouse.x, this.selectedArea.pivotX);
			this.selectedArea.top    = Math.min(this.mouse.y, this.selectedArea.pivotY);
			this.selectedArea.right  = Math.max(this.mouse.x, this.selectedArea.pivotX);
			this.selectedArea.bottom = Math.max(this.mouse.y, this.selectedArea.pivotY);
			this.selectedArea.isEnable = true;
			const selected = this.photos.map(c => c.isSelected);
			this.selectedArea.items.forEach(c => { c.isSelected = false; });
			const items = new Array();
			this.photos.forEach(c => {
				if (
					(this.selectedArea.left < c.left + c.width) && (c.left <= this.selectedArea.right) &&
					(this.selectedArea.top < c.top + c.height) && (c.top <= this.selectedArea.bottom)
				) {
					items.push(c);
					c.isSelected = true;
				}
			});
			this.selectedArea.items = items;
		}

		// ショートカットの処理
		this.shortcut();

		// すべての子コンポーネントの表示位置を計算
		this.photos.forEach((component, index) => {
			component.left = ((this.width - this.scrollbar.width) - this.listW) * 0.5 + (index % this.listX) * this.itemW_;
			component.top = Math.floor(index / this.listX) * this.itemH_ - this.scroll;
			component.width = this.itemW_; component.height = this.itemH_;
			component.left += 4; component.top += 4;
			component.width -= 8; component.height -= 8;
		});
	}
	onDraw() {
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
	}
	onAfterDraw() {
		if (this.selectedArea.isEnable) {
			this.context.strokeStyle = "#0078d7ff";
			this.context.fillStyle = "#0065cb55";
			this.context.lineWidth = 1;
			this.context.beginPath();
			this.context.rect(
				this.selectedArea.left + 0.5,
				this.selectedArea.top + 0.5,
				this.selectedArea.right - this.selectedArea.left - 1.0,
				this.selectedArea.bottom - this.selectedArea.top - 1.0
			);
			this.context.fill();
			this.context.stroke();
		}
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
		// CtrlもしくはShiftを押していない状態でどこかをクリックすると選択全解除
		if ((!this.keyboard.ctrl && !this.keyboard.shift) && this.mouse.lPressed && (!this.mouse.pLPressed)) {
			this.photos.forEach(c => { c.isSelected = false; });
		}

		// Escで選択全解除
		if (this.keyboard.press.has("Escape")) { this.photos.forEach(c => { c.isSelected = false; }); }

		// Ctrl+Aで全選択
		if (this.keyboard.ctrl && this.keyboard.press.has("a")) {
			this.photos.forEach(c => { c.isSelected = true; });
		}

		// Deleteキーで選択されているものを削除
		if (this.keyboard.press.has("Delete")) {
			const selectedPhotos = this.photos.filter(c => c.isSelected);
			selectedPhotos.forEach(c => { this.removeChild(c); });
		}

		// 方向キーでスクロール
		this.zDelta += this.keyboard.up   ? 30.0 : 0.0;
		this.zDelta -= this.keyboard.down ? 30.0 : 0.0;
	}
};
