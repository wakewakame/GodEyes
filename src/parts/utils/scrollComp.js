'use strict';

const ScrollComp = class extends Component {
	constructor(pageComponent, left, top, width, height) {
		super(left, top, width, height);
		this.isClip = true;
		this.pageComponent = pageComponent;
		this.scrollSpeed = 0;
	}
	onSetup() {
		this.addEventListener("mousewheel", e => {
			if (e.ctrlKey) return;
			this.scrollSpeed += e.wheel;
		});
		this.addChild(this.pageComponent);
		const ScrollBar = class extends Component {
			constructor() {
				super(0, 0, 17, 0);
				this.dragStartY = 0;
				this.dragStartTop = 0;
				this.dragStartBottom = 0;
				this.barTop = 0;
				this.barHeight = 0;
			}
			onSetup() {
				this.addEventListener("mousedown", e => {
					this.dragStartY = this.mouse.y;
					this.dragStartTop = this.barTop;
					this.dragStartBottom = this.barTop + this.barHeight;
				});
			}
			onUpdate() {
				const page = this.parent.pageComponent;
				this.left = this.parent.width - this.width;
				this.height = this.parent.height;
				this.barHeight = this.height * this.height / page.height;
				if (this.mouse.lDrag) {
					let barTop = 0;
					if ((this.dragStartTop <= this.dragStartY) && (this.dragStartY < this.dragStartBottom)) {
						barTop = this.dragStartTop + this.mouse.y - this.dragStartY;
					}
					else {
						barTop = this.mouse.y - this.barHeight * 0.5;
					}
					barTop = Math.max(barTop, 0);
					barTop = Math.min(barTop, this.height - this.barHeight);
					page.top = -page.height * barTop / this.height;
				}
				this.barTop = this.height * (-page.top) / page.height;
			}
			onDraw() {
				const page = this.parent.pageComponent;
				if ((page.height === 0) || (page.height <= this.parent.height)) return;
				this.context.fillStyle = "#171717";
				this.context.fillRect(0, 0, this.width, this.parent.height);
				this.context.fillStyle = "#4d4d4d";
				this.context.fillRect(1, 1 + this.barTop, this.width - 2, this.barHeight - 2);
			};
		};
		this.scrollbar = this.addChild(new ScrollBar());
	}
	onUpdate() {
		// 方向キーでスクロール
		this.scrollSpeed += this.key.ArrowUp   ? 10.0 : 0.0;
		this.scrollSpeed -= this.key.ArrowDown ? 10.0 : 0.0;

		// 通常のスクロール
		const top = this.pageComponent.top;
		this.pageComponent.top += this.scrollSpeed;

		// スクロールの上限チェック
		this.pageComponent.top = Math.max(this.pageComponent.top, this.height - this.pageComponent.height);
		this.pageComponent.top = Math.min(this.pageComponent.top, 0);

		this.pageComponent.mouse.y -= this.pageComponent.top - top;

		// スクロール速度の減衰
		this.scrollSpeed *= 0.6;
	}
	onResize() {
		this.pageComponent.left = 0;
		this.pageComponent.width = this.width - 17;
	}
};
