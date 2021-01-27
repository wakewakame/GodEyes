'use strict';

const ListComp = class extends ScrollComp {
	constructor(left, top, width, height) {
		const InnerComp = class extends Component {
			onSetup() {
				this.items = new Array();  // リストアイテムの配列
			}
			onUpdate() {
				// すべての子コンポーネントの表示位置を計算
				let top = 0;
				this.items.forEach((c, index) => {
					c.left = 0;
					c.top = top;
					c.width = this.width;
					top += c.height;
					c.isVisible =
						(c.top + c.height + this.top > 0) &&
						(c.top + this.top < this.parent.height);
				});
				this.height = top;
			}
			onDraw() {
				// 背景を塗りつぶす
				this.context.fillStyle = "#202020";
				this.context.fillRect(0, 0, this.width, this.height);
			}
			addChild(child) {
				super.addChild(child);
				this.items.push(child);
				return child;
			}
			removeChild(child) {
				super.removeChild(child);
				this.items = this.items.filter(c => (c !== child));
				return child;
			}
		};
		super(new InnerComp(0, 0, width, height), left, top, width, height);
	}
	addListItem(child) {
		return this.pageComp.addChild(child);
	}
	removeListItem(child) {
		this.pageComp.removeChild(child);
	}
};
