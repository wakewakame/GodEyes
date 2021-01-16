'use strict';

const Component = class {
	constructor(left, top, width, height) {
		this.context = null;
		this.left = left ? left : 0;
		this.top = top ? top : 0;
		this.width = width ? width : 0;
		this.height = height ? height : 0;
		this.children = [];
		this.mouse = {
			x: 0, y: 0,
			px: 0, py: 0,
			lDragStartX: 0,
			lDragStartY: 0,
			rDragStartX: 0,
			rDragStartY: 0,
			mDragStartX: 0,
			mDragStartY: 0,
			lPressed: false, pLPressed: false,
			rPressed: false, pRPressed: false,
			mPressed: false, pMPressed: false,
			zDelta: 0
		};
	}
	addChild(child) {
		this.children.push(child);
		child.setup(this.context);
		return child;
	}
	setup(context) {
		this.context = context;
		this.onSetup();
	}
	draw() {
		this.context.save();
		this.context.translate(this.left, this.top);
		this.onDraw();
		this.children.forEach(child => { child.draw(); });
		this.context.restore();
	}
	resize(width, height) {
		this.width = width;
		this.height = height;
		this.onResize();
	}
	setMouse(x, y, lPressed, rPressed, mPressed, zDelta) {
		this.mouse.px = this.mouse.x; this.mouse.py = this.mouse.y;
		this.mouse.x = x - this.left; this.mouse.y = y - this.top;
		this.mouse.pLPressed = this.mouse.lPressed; this.mouse.pRPressed = this.mouse.rPressed; this.mouse.pMPressed = this.mouse.mPressed;
		this.mouse.lPressed = lPressed; this.mouse.rPressed = rPressed; this.mouse.mPressed = mPressed;
		const lClick = this.mouse.lPressed && (!this.mouse.pLPressed);
		const rClick = this.mouse.rPressed && (!this.mouse.pRPressed);
		const mClick = this.mouse.mPressed && (!this.mouse.pMPressed);
		if (lClick) { this.mouse.lDragStartX = this.mouse.x; this.mouse.lDragStartY = this.mouse.y; }
		if (rClick) { this.mouse.rDragStartX = this.mouse.x; this.mouse.rDragStartY = this.mouse.y; }
		if (mClick) { this.mouse.mDragStartX = this.mouse.x; this.mouse.mDragStartY = this.mouse.y; }
		this.mouse.zDelta += zDelta;

		let hitFrag = false, lDragFrag = false, rDragFrag = false, mDragFrag = false;
		for(let index = this.children.length - 1; index >= 0; index--) {
			const child = this.children[index];
			if ((!hitFrag) && child.isHit(this.mouse.x, this.mouse.y)) {
				child.setMouse(this.mouse.x, this.mouse.y, this.mouse.lPressed, this.mouse.rPressed, this.mouse.mPressed, zDelta);
				hitFrag = true;
				continue;
			};
			if ((!lDragFrag) && lPressed && child.isHit(this.mouse.lDragStartX, this.mouse.lDragStartY)) {
				child.setMouse(this.mouse.x, this.mouse.y, this.mouse.lPressed, this.mouse.rPressed, this.mouse.mPressed, zDelta);
				lDragFrag = true;
				continue;
			};
			if ((!rDragFrag) && rPressed && child.isHit(this.mouse.rDragStartX, this.mouse.rDragStartY)) {
				child.setMouse(this.mouse.x, this.mouse.y, this.mouse.lPressed, this.mouse.rPressed, this.mouse.mPressed, zDelta);
				rDragFrag = true;
				continue;
			};
			if ((!mDragFrag) && mPressed && child.isHit(this.mouse.mDragStartX, this.mouse.mDragStartY)) {
				child.setMouse(this.mouse.x, this.mouse.y, this.mouse.lPressed, this.mouse.rPressed, this.mouse.mPressed, zDelta);
				mDragFrag = true;
				continue;
			};
		}
	}
	isHit(x, y) {
		return (
			(this.left <= x) && (this.top <= y) &&
			(x < this.left + this.width) && (y < this.top + this.height)
		);
	}
	onSetup() {}
	onDraw() {}
	onResize() {}
};

const RootComponent = class extends Component {
	constructor(canvas) {
		super(0, 0, canvas.width, canvas.height);
		this.canvas = canvas;
		const context = this.canvas.getContext("2d");
		this.pMouse = { x: 0, y: 0, lPressed: false, rPressed: false, mPressed: false, zDelta: 0 };
		this.setEventListener();
		this.setup(context);
	}
	draw() {
		super.setMouse(this.pMouse.x, this.pMouse.y, this.pMouse.lPressed, this.pMouse.rPressed, this.pMouse.mPressed, this.pMouse.zDelta);
		super.draw();
	}
	resize(width, height) {
		this.canvas.width = width;
		this.canvas.height = height;
		super.resize(width, height);
		this.children.forEach(child => { child.resize(this.width, this.height); });
	}
	setEventListener() {
		this.canvas.addEventListener("mousemove", e => {
			this.pMouse.x = e.offsetX;
			this.pMouse.y = e.offsetY;
		});
		this.canvas.addEventListener("mousedown", e => {
			if (e.which === 1) this.pMouse.lPressed = true;
			if (e.which === 2) this.pMouse.mPressed = true;
			if (e.which === 3) this.pMouse.rPressed = true;
		});
		this.canvas.addEventListener("mouseup", e => {
			if (e.which === 1) this.pMouse.lPressed = false;
			if (e.which === 2) this.pMouse.mPressed = false;
			if (e.which === 3) this.pMouse.rPressed = false;
		});
		this.canvas.addEventListener("mousewheel", e => {
			this.pMouse.zDelta += e.wheelDelta;
		});
		this.canvas.oncontextmenu = () => { return false; };
	}
};

const MainComponent = class extends Component {
	onSetup() {
		const ChildA = class extends Component {
			onDraw() {
				this.context.fillStyle = "rgb(255, 0, 0)";
				this.context.fillRect(0, 0, this.width, this.height);
				this.context.fillStyle = "rgb(0, 0, 0)";
				this.context.fillRect(this.mouse.x + 40, this.mouse.y, 30, 30);
			}
		};
		const ChildB = class extends Component {
			onDraw() {
				this.context.fillStyle = "rgb(0, 255, 0)";
				this.context.fillRect(0, 0, this.width, this.height);
				this.context.fillStyle = "rgb(0, 0, 255)";
				this.context.fillRect(this.mouse.x, this.mouse.y + 40, 30, 30);
			}
		};
		this.addChild(new ChildA(100, 100, 500, 500)).addChild(new ChildB(100, 100, 300, 300));
	}
	onDraw() {
		this.context.fillStyle = "rgb(255, 255, 255)";
		this.context.fillRect(0, 0, this.width, this.height);
	}
};

document.addEventListener("DOMContentLoaded", e => {
	const canvas = document.getElementById("canvas");
	const rootComponent = new RootComponent(canvas);
	window.addEventListener("resize", e => {
		rootComponent.resize(window.innerWidth, window.innerHeight);
	});
	rootComponent.resize(window.innerWidth, window.innerHeight);
	rootComponent.addChild(new MainComponent(0, 0, rootComponent.width, rootComponent.height));
	const loop = () => { rootComponent.draw(); requestAnimationFrame(loop); };
	loop();
});
