'use strict';

const PhotoItemComp = class extends Component {
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
			context.fillStyle = "#202020";
			context.fillRect(0, 0, resizeCanvas.width, resizeCanvas.height);
			context.drawImage(thumbnail, 0, 0, resizeCanvas.width, resizeCanvas.height);
			const dataURL = resizeCanvas.toDataURL("image/jpeg");
			thumbnail = await (new Promise((resolve, reject) => {
				const img = new Image();
				img.addEventListener("load", e => { resolve(img); });
				img.addEventListener("error", e => { reject("this file is not image."); });
				img.src = dataURL;
			}));
		}
		
		return new PhotoItemComp(file, name, img, thumbnail);
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
		if (this.mouse.over) {
			this.context.fillStyle = "#4d4d4d";
			this.context.fillRect(0, 0, this.width, this.height);
		}

		// 選択状態の表示
		if (this.isSelected) {
			this.context.fillStyle = "#777777";
			this.context.fillRect(0, 0, this.width, this.height);
		}

		// 画像の表示
		this.context.drawImage(img, (this.width - width) * 0.5, this.height * 0.95 - height, width, height);
	}
};

const PhotoViewerComp = class extends ScrollComp {
	constructor(left, top, width, height) {
		const InnerComp = class extends Component {
			onSetup() {
				this.zoom = 1.0;            // 拡大率
				this.zoomSpeed = 0;         // 拡大速度(スムーズなアニメーションになるように計算するため)
				this.itemW = 200;           // リストアイテムのデフォルトの横幅
				this.itemH = 200;           // リストアイテムのデフォルトの縦幅
				this.itemW_ = this.itemW;   // = this.itemW * this.zoom
				this.itemH_ = this.itemH;   // = this.itemH * this.zoom
				this.listX = 0;             // リストの列数
				this.listW = 0;             // リストの横幅
				this.listH = 0;             // リストの縦幅
				this.photos = new Array();  // リストアイテムの配列

				// 矩形選択の範囲
				this.selectedArea = {
					isEnable: false,
					left: 0, top: 0, right: 0, bottom: 0,
					pivotX: 0, pivotY: 0,
					items: new Array()
				};

				// ショートカットなどの追加
				this.shortcut();
			}
			addChild(child) {
				super.addChild(child);
				if (child instanceof PhotoItemComp) {
					this.photos.push(child);
				}
				return child;
			}
			removeChild(child) {
				super.removeChild(child);
				if (child instanceof PhotoItemComp) {
					this.photos = this.photos.filter(c => (c !== child));
				}
				return child;
			}
			onUpdate() {
				// アイコンサイズの拡大縮小
				const zoom = 2.0 ** (this.zoomSpeed / 1200.0);
				const zoom_ = this.zoom;
				this.zoom *= zoom;
				this.zoom = Math.min(this.zoom, this.width / this.itemW, this.parent.height / this.itemH);
				this.zoom = Math.max(this.zoom, 0.4);
				this.itemW_ = this.itemW * this.zoom;
				this.itemH_ = this.itemH * this.zoom;

				// アイコンサイズの変更に伴い列数の再計算
				this.listX = Math.floor((this.width) / this.itemW_);
				this.listW = this.itemW_ * this.listX;

				// 今見ている部分を中心に拡大縮小する
				const beforeMiddle = this.top / (this.listH - this.parent.height);
				this.listH = Math.ceil(this.photos.length / this.listX) * this.itemH_;
				this.top = beforeMiddle * (this.listH - this.parent.height);
				this.top = Number.isNaN(this.top) ? 0 : this.top;

				// コンポーネントの高さの変更
				this.height = Math.ceil(this.photos.length / this.listX) * this.itemH_;
				this.height = Math.max(this.height, this.parent.height);

				// ドラッグによる矩形選択
				if (this.selectedArea.isEnable) {
					this.selectedArea.left   = Math.min(this.mouse.x, this.selectedArea.pivotX);
					this.selectedArea.top    = Math.min(this.mouse.y, this.selectedArea.pivotY);
					this.selectedArea.right  = Math.max(this.mouse.x, this.selectedArea.pivotX);
					this.selectedArea.bottom = Math.max(this.mouse.y, this.selectedArea.pivotY);
					this.selectedArea.items.forEach(c => { c.isSelected = this.key.Control && (!c.isSelected); });
					const items = new Array();
					this.photos.forEach(c => {
						if (
							(this.selectedArea.left < c.left + c.width) && (c.left <= this.selectedArea.right) &&
							(this.selectedArea.top < c.top + c.height) && (c.top <= this.selectedArea.bottom)
						) {
							items.push(c);
							c.isSelected = (!this.key.Control) || (!c.isSelected);
						}
					});
					this.selectedArea.items = items;
				}

				// すべての子コンポーネントの表示位置を計算
				this.photos.forEach((component, index) => {
					component.left = (this.width - this.listW) * 0.5 + (index % this.listX) * this.itemW_;
					component.top = Math.floor(index / this.listX) * this.itemH_;
					component.width = this.itemW_; component.height = this.itemH_;
					component.left += 4; component.top += 4;
					component.width -= 8; component.height -= 8;
					component.isVisible =
						(component.top + component.height + this.top > 0) &&
						(component.top + this.top < this.parent.height);
				});

				// 速度の減衰
				this.zoomSpeed *= 0.6;
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
				// 矩形選択の範囲を表示
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
			shortcut() {
				// 右クリックでコンテキストメニューの表示
				const menu = new ContextMenuComp(() => {
					const result = [];
					if (this.photos.some(c => c.isSelected)) result.push("delete");
					else result.push("__delete");
					return result;
				}, e => {
					if (e.text === "delete") {
						const selectedPhotos = this.photos.filter(c => c.isSelected);
						selectedPhotos.forEach(c => { this.removeChild(c); });
					}
				});
				this.parent.addChild(menu);

				// 他のアイコンをクリックすると選択全解除
				this.addEventListener("mousedown", e => {
					// 選択状態のアイコンの上で右クリックをした場合は除外
					const hit = this.getHitComponent(e);
					if ((e.which === 3) && (this.photos.some(c => (c === hit))) && (hit.isSelected)) return;
					// ctrlもしくはshiftが押されている場合も除外
					if (e.ctrlKey || e.shiftKey) return;
					this.photos.forEach(c => { c.isSelected = false; });
				});

				this.addEventListener("keydown", e => {
					// Escで選択全解除
					if (e.key === "Escape") { this.photos.forEach(c => { c.isSelected = false; }); }

					// Ctrl+Aで全選択
					if ((e.key === "a") && e.ctrlKey) {
						this.photos.forEach(c => { c.isSelected = true; });
					}

					// Deleteキーで選択されているものを削除
					if (e.key === "Delete") {
						const selectedPhotos = this.photos.filter(c => c.isSelected);
						selectedPhotos.forEach(c => { this.removeChild(c); });
					}
				});

				// Ctrl+スクロールで拡大縮小
				this.addEventListener("mousewheel", e => {
					if (e.ctrlKey) this.zoomSpeed += e.wheel;
				});

				// ドラッグで矩形選択
				this.addEventListener("mousedown", e => {
					if ((e.which === 1) || (e.which === 3)) {
						this.selectedArea.isEnable = true;
						this.selectedArea.pivotX = e.x;
						this.selectedArea.pivotY = e.y;
						this.selectedArea.items = new Array();
					}
				});
				this.addEventListener("mouseup", e => { this.selectedArea.isEnable = false; });

				// ファイルドロップで写真を読み込み
				this.addEventListener("openfiles", files => {
					for(let file of files) {
						let name = file.name;
						let number = 1;
						while(this.photos.some(p => (p.name === name))) {
							name = "(" + number + ") " + file.name;
							number += 1;
						}
						PhotoItemComp.create(file, name)
							.then(component => { this.addChild(component); })
							.catch(err => { console.error(err); });
					}
				});
			}
		};
		super(new InnerComp(), left, top, width, height);
	}
	onSetup() {
		super.onSetup();
		// アイコンのダブルクリック時にイベントリスナーを発火
		const inner = this.pageComp;
		this.addEventListener("dblclick", e => {
			if (inner.photos.some(c => (c === e.from))) this.dispatchEvent("open", e.from);
		});
	}
};
