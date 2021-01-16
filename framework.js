'use strict';

const Component = class {
	constructor(left, top, width, height) {
		this.context = null;
		this.left = left ? left : 0;
		this.top = top ? top : 0;
		this.width = width ? width : 0;
		this.height = height ? height : 0;
		this.children = [];
		this.activeChild = null;
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
		this.keyboard = {
			ctrl: false,
			shift: false,
			alt: false,
			press: new Set()
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
		try {
			this.context.translate(this.left, this.top);
			this.onDraw();
			this.children.forEach(child => { child.draw(); });
		}
		finally {
			this.context.restore();
		}
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
		this.mouse.zDelta = zDelta;

		let activateChildIndex = this.children.length - 1;
		if (lClick) { this.activeChild = null; }

		let hitFrag = false, lDragFrag = false, rDragFrag = false, mDragFrag = false;
		for(let index = this.children.length - 1; index >= 0; index--) {
			const child = this.children[index];
			if ((!hitFrag) && child.isHit(this.mouse.x, this.mouse.y)) {
				child.setMouse(this.mouse.x, this.mouse.y, this.mouse.lPressed, this.mouse.rPressed, this.mouse.mPressed, zDelta);
				hitFrag = true;
				if (lClick) { activateChildIndex = index; this.activeChild = child; }
				continue;
			};
			if ((!lDragFrag) && lPressed && child.isHit(this.mouse.lDragStartX, this.mouse.lDragStartY)) {
				child.setMouse(this.mouse.x, this.mouse.y, this.mouse.lPressed, this.mouse.rPressed, this.mouse.mPressed, zDelta);
				lDragFrag = true;
				console.log("swap");
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

		for(let i = activateChildIndex; i < this.children.length - 1; i++) {
			const tmp = this.children[i];
			this.children[i] = this.children[i + 1];
			this.children[i + 1] = tmp;
		}
	}
	setKey(ctrl, shift, alt, press) {
		this.keyboard.ctrl  = ctrl;
		this.keyboard.shift = shift;
		this.keyboard.alt   = alt;
		this.keyboard.press = new Set(press);
		if (this.activeChild !== null) {
			this.activeChild.setKey(ctrl, shift, alt, press);
		}
	}
	isHit(x, y) {
		return (
			(this.left <= x) && (this.top <= y) &&
			(x < this.left + this.width) && (y < this.top + this.height)
		);
	}
	drop(files, x, y) {
		x -= this.left; y -= this.top;
		for(let index = this.children.length - 1; index >= 0; index--) {
			const child = this.children[index];
			if (child.isHit(x, y)) {
				child.drop(files, x, y);
				return;
			}
		}
		this.onDrop(files);
	}
	onSetup() {}
	onDraw() {}
	onResize() {}
	onDrop(files) {}
};

const RootComponent = class extends Component {
	constructor(canvas) {
		super(0, 0, canvas.width, canvas.height);
		this.canvas = canvas;
		const context = this.canvas.getContext("2d");
		this.pMouse = { x: 0, y: 0, lPressed: false, rPressed: false, mPressed: false, zDelta: 0 };
		this.pKeyboard = { ctrl: false, shift: false, alt: false, press: new Set() };
		this.setEventListener();
		this.setup(context);
	}
	draw() {
		super.setMouse(this.pMouse.x, this.pMouse.y, this.pMouse.lPressed, this.pMouse.rPressed, this.pMouse.mPressed, this.pMouse.zDelta);
		this.pMouse.zDelta = 0;
		super.setKey(this.pKeyboard.ctrl, this.pKeyboard.shift, this.pKeyboard.alt, this.pKeyboard.press);
		this.pKeyboard.press.clear();
		super.draw();
	}
	resize(width, height) {
		this.canvas.width = width;
		this.canvas.height = height;
		super.resize(width, height);
		this.children.forEach(child => { child.resize(this.width, this.height); });
	}
	setEventListener() {
		this.canvas.addEventListener("keydown", e => {
			if (e.key === "Control") this.pKeyboard.ctrl  = true;
			if (e.key === "Shift")   this.pKeyboard.shift = true;
			if (e.key === "Alt")     this.pKeyboard.alt   = true;
		});
		this.canvas.addEventListener("keyup", e => {
			if (e.key === "Control") this.pKeyboard.ctrl  = false;
			if (e.key === "Shift")   this.pKeyboard.shift = false;
			if (e.key === "Alt")     this.pKeyboard.alt   = false;
		});
		this.canvas.addEventListener("keypress", e => {
			this.pKeyboard.press.add(e.key);
		});
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
			if (e.ctrlKey) { e.preventDefault(); }
			this.pMouse.zDelta += e.wheelDelta;
		});
		this.canvas.oncontextmenu = () => { return false; };
		document.addEventListener("dragover", e => { e.preventDefault(); });
		document.addEventListener("drop", e => {
			e.preventDefault();
			const files = e.dataTransfer.files;
			if (files.length === 0) return;
			this.drop(files, e.x, e.y);
		});
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