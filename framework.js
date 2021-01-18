'use strict';

const Component = class {
	constructor(left, top, width, height) {
		this.context = null;
		this.left = left ? left : 0;
		this.top = top ? top : 0;
		this.width = width ? width : 0;
		this.height = height ? height : 0;
		this.isVisible = true;
		this.clip = false;
		this.parent = null;
		this.children = [];
		this.activeChild = null;
		this.events = new EventTarget();
		this.mouse = {
			x: 0, y: 0,
			px: 0, py: 0,
			lDragStartX: 0, lDragStartY: 0,
			rDragStartX: 0, rDragStartY: 0,
			mDragStartX: 0, mDragStartY: 0,
			lPressed: false, pLPressed: false,
			rPressed: false, pRPressed: false,
			mPressed: false, pMPressed: false,
			zDelta: 0,
			lDoubleClick: false
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
		this.activeChild = child;
		child.parent = this;
		child.setup(this.context);
		return child;
	}
	removeChild(child) {
		if (this.activeChild === child) {
			this.activeChild = null;
		}
		this.children = this.children.filter(c => (c !== child));
		child.parent = null;
		return child;
	}
	setup(context) {
		this.context = context;
		this.onSetup();
	}
	draw() {
		if (!this.isVisible) return;
		this.context.save();
		try {
			this.context.beginPath();
			this.context.translate(this.left, this.top);
			if (this.clip) {
				this.context.rect(0, 0, this.width, this.height);
				this.context.clip();
			}
			this.onDraw();
			this.children.forEach(child => { child.draw(); });
			this.onAfterDraw();
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
	setMouse(x, y, lPressed, rPressed, mPressed, zDelta, lDoubleClick) {
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
		this.mouse.lDoubleClick = lDoubleClick;

		let activateChildIndex = this.children.length - 1;
		if (lClick) { this.activeChild = null; }

		let hitFrag = false, lDragFrag = false, rDragFrag = false, mDragFrag = false;
		for(let index = this.children.length - 1; index >= 0; index--) {
			const child = this.children[index];
			if (!child.isVisible) continue;
			if ((!hitFrag) && child.isHit(this.mouse.x, this.mouse.y)) {
				child.setMouse(this.mouse.x, this.mouse.y, lPressed, rPressed, mPressed, zDelta, lDoubleClick);
				hitFrag = true;
				if (lClick) { activateChildIndex = index; this.activeChild = child; }
				continue;
			};
			if ((!lDragFrag) && lPressed && child.mouse.lPressed) {
				child.setMouse(this.mouse.x, this.mouse.y, lPressed, rPressed, mPressed, zDelta, lDoubleClick);
				lDragFrag = true;
				continue;
			};
			if ((!rDragFrag) && rPressed && child.mouse.rPressed) {
				child.setMouse(this.mouse.x, this.mouse.y, lPressed, rPressed, mPressed, zDelta, lDoubleClick);
				rDragFrag = true;
				continue;
			};
			if ((!mDragFrag) && mPressed && child.mouse.mPressed) {
				child.setMouse(this.mouse.x, this.mouse.y, lPressed, rPressed, mPressed, zDelta, lDoubleClick);
				mDragFrag = true;
				continue;
			};
			child.setMouse(child.mouse.x + child.left, child.mouse.y + child.top, false, false, false, 0, false);
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
		if (this.activeChild !== null && this.activeChild.isVisible) {
			this.activeChild.setKey(ctrl, shift, alt, press);
		}
	}
	toVisible() {
		this.isVisible = true;
	}
	toInvisible() {
		this.isVisible = false;
		this.setMouse(this.mouse.x, this.mouse.y, false, false, false, 0, false);
		this.setKey(false, false, false, new Set());
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
			if (!child.isVisible) continue;
			if (child.isHit(x, y)) {
				child.drop(files, x, y);
				return;
			}
		}
		this.onDrop(files);
	}
	onSetup() {}
	onDraw() {}
	onAfterDraw() {}
	onResize() {}
	onDrop(files) {}
};

const RootComponent = class extends Component {
	constructor(canvas) {
		super(0, 0, canvas.width, canvas.height);
		this.canvas = canvas;
		const context = this.canvas.getContext("2d");
		this.pMouse = { x: 0, y: 0, lPressed: false, rPressed: false, mPressed: false, zDelta: 0, lDoubleClick: false };
		this.pKeyboard = { ctrl: false, shift: false, alt: false, press: new Set() };
		this.setEventListener();
		this.setup(context);
	}
	draw() {
		super.setMouse(
			this.pMouse.x, this.pMouse.y,
			this.pMouse.lPressed, this.pMouse.rPressed, this.pMouse.mPressed,
			this.pMouse.zDelta, this.pMouse.lDoubleClick
		);
		this.pMouse.zDelta = 0;
		this.pMouse.lDoubleClick = false;
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
			if (e.key === "Control")    { this.pKeyboard.ctrl  = true; return; }
			if (e.key === "Shift")      { this.pKeyboard.shift = true; return; }
			if (e.key === "Alt")        { this.pKeyboard.alt   = true; return; }
			if (e.key === "Delete")     { this.pKeyboard.press.add(e.key); return; }
			if (e.key === "Escape")     { this.pKeyboard.press.add(e.key); return; }
			if (e.key === "Backspace")  { this.pKeyboard.press.add(e.key); return; }
			if (e.ctrlKey)              { this.pKeyboard.press.add(e.key); return; }
			if (e.altKey)               { this.pKeyboard.press.add(e.key); return; }
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
		this.canvas.addEventListener("pointerdown", e => { this.canvas.setPointerCapture(e.pointerId); });
		this.canvas.addEventListener("pointerup", e => { this.canvas.releasePointerCapture(e.pointerId); });
		this.canvas.addEventListener("dblclick", e => {
			this.pMouse.lDoubleClick = true;
		});
		const mousewheel = e => {
			if (e.ctrlKey) { e.preventDefault(); }
			this.pMouse.zDelta += e.wheelDelta ? e.wheelDelta : (-e.detail * 20.0);
		};
		this.canvas.addEventListener("mousewheel", mousewheel);
		this.canvas.addEventListener("DOMMouseScroll", mousewheel);
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
