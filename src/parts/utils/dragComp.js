'use strict';

const DragComp = class extends Component {
	constructor(left, top, width, height) {
		super(left, top, width, height);
		this.dragStart = { x: 0, y: 0 };
		this.addEventListener("mousedown", e => {
			this.active();
			this.dragStart.x = e.x;
			this.dragStart.y = e.y;
		});
		this.addEventListener("mousemove", e => {
			if (e.from !== this) return;
			if (this.mouse.lDrag) {
				this.left += this.mouse.x - this.dragStart.x;
				this.top += this.mouse.y - this.dragStart.y;
			}
		});
	}
};
