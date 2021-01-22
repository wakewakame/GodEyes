'use strict';

const Component = class {
	constructor(left, top, width, height) {
		this.context = null;                // canvasの2d context
		this.left = left ? left : 0;        // コンポーネントのx座標(親コンポーネントの左上が原点)
		this.top = top ? top : 0;           // コンポーネントのy座標(親コンポーネントの左上が原点)
		this.width = width ? width : 0;     // コンポーネントの幅
		this.height = height ? height : 0;  // コンポーネントの高さ
		this.isVisible = true;              // コンポーネントを見えるようにする
		this.isFront = false;               // 同じ階層のコンポーネントのなかで常に手前に表示されるようにする
		this.hookMouse = false;             // 親コンポーネントにマウスイベントを渡さないようにする
		this.clip = false;                  // コンポーネントの範囲外の描画は透過する
		this.parent = null;                 // 親コンポーネントの参照
		this.children = [];                 // 子コンポーネントの配列
		this.activeChild = null;            // 最後に右クリックされた子コンポーネント(キーイベントの送信に使う)
		this.events = new EventTarget();    // 汎用イベントリスナー
		// 親から子へ伝わるマウスイベント
		this.mouse_ = {
			x: 0, y: 0,
			px: 0, py: 0,
			lDrag: false, rDrag: false, mDrag: false,
			pLDrag: false, pRDrag: false, pMDrag: false,
			lPressed: false, pLPressed: false,
			rPressed: false, pRPressed: false,
			mPressed: false, pMPressed: false,
			zDelta: 0,
			lDoubleClick: false,
			over: false
		};
		// 子から親へ伝わる(ように見える)マウスイベント
		this.mouse = Object.assign({}, this.mouse_);
		// キーイベント
		this.keyboard = {
			ctrl: false,
			shift: false,
			alt: false,
			left: false,
			right: false,
			up: false,
			down: false,
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
		child.events.dispatchEvent(new CustomEvent("remove", { detail: child }));
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

		this.children.filter(c => c.isFront).forEach(c => {
			const index = this.children.findIndex(c_ => (c_ === c));
			for(let i = index; i < this.children.length - 1; i++) {
				const tmp = this.children[i];
				this.children[i] = this.children[i + 1];
				this.children[i + 1] = tmp;
			}
		});

		this.events.dispatchEvent(new CustomEvent("update", { detail: this }));
		this.onUpdate();
		this.context.save();
		try {
			this.context.beginPath();
			this.context.translate(this.left, this.top);
			if (this.clip) {
				this.context.rect(0, 0, this.width, this.height);
				this.context.clip();
			}
			this.onDraw();
			this.children.slice().forEach(child => { child.draw(); });
			this.onAfterDraw();
		}
		finally {
			this.context.restore();
		}
		this.mouse_.lPressed = false; this.mouse_.pLPressed = false;
		this.mouse_.rPressed = false; this.mouse_.pRPressed = false;
		this.mouse_.mPressed = false; this.mouse_.pMPressed = false;
		this.mouse_.zDelta = 0;
		this.mouse_.lDoubleClick = false;
		this.mouse_.over = false;
		this.mouse = Object.assign({}, this.mouse_);
	}
	resize(width, height) {
		this.width = width;
		this.height = height;
		this.onResize();
	}
	setMouse(mouse, lDrag, rDrag, mDrag) {
		this.mouse_.x = mouse.x - this.left; this.mouse_.y = mouse.y - this.top;
		this.mouse_.px = mouse.px - this.left; this.mouse_.py = mouse.py - this.top;
		this.mouse_.pLPressed = mouse.pLPressed;
		this.mouse_.pRPressed = mouse.pRPressed;
		this.mouse_.pMPressed = mouse.pMPressed;
		this.mouse_.lPressed = mouse.lPressed;
		this.mouse_.rPressed = mouse.rPressed;
		this.mouse_.mPressed = mouse.mPressed;
		this.mouse_.pLDrag = this.mouse_.lDrag;
		this.mouse_.pRDrag = this.mouse_.rDrag;
		this.mouse_.pMDrag = this.mouse_.mDrag;
		this.mouse_.lDrag = lDrag;
		this.mouse_.rDrag = rDrag;
		this.mouse_.mDrag = mDrag;
		this.mouse_.zDelta = mouse.zDelta;
		this.mouse_.lDoubleClick = mouse.lDoubleClick;
		this.mouse_.over = (
			(0 <= this.mouse_.x) && (this.mouse_.x < this.width) &&
			(0 <= this.mouse_.y) && (this.mouse_.y < this.height)
		);
		const lClick = this.mouse_.lPressed && (!this.mouse_.pLPressed);
		const rClick = this.mouse_.rPressed && (!this.mouse_.pRPressed);
		const mClick = this.mouse_.mPressed && (!this.mouse_.pMPressed);
		const uLClick = (!this.mouse_.lPressed) && this.mouse_.pLPressed;
		const uRClick = (!this.mouse_.rPressed) && this.mouse_.pRPressed;
		const uMClick = (!this.mouse_.mPressed) && this.mouse_.pMPressed;

		let activateChildIndex = this.children.length - 1;
		if (lClick) { this.activeChild = null; }

		let hitFlag = false;
		const children = this.children.slice();
		let child = null;
		for(let index = children.length - 1; index >= 0; index--) {
			child = children[index];
			if (!child.isVisible) continue;
			if (child.mouse.lDrag || child.mouse.rDrag || child.mouse.mDrag) {
				child.setMouse(
					this.mouse_,
					(child.mouse.lDrag || lClick) && (!uLClick),
					(child.mouse.rDrag || rClick) && (!uRClick),
					(child.mouse.mDrag || mClick) && (!uMClick)
				);
				break;
			}
			if ((!hitFlag) && child.isHit(this.mouse_.x, this.mouse_.y)) {
				child.setMouse(
					this.mouse_,
					child.mouse.lDrag || lClick,
					child.mouse.rDrag || rClick,
					child.mouse.mDrag || mClick
				);
				hitFlag = true;
				if (lClick) { activateChildIndex = index; this.activeChild = child; }
				break;
			};
		}

		if ((child === null) || (!child.hookMouse)) { this.mouse = Object.assign({}, this.mouse_); }
		else { this.mouse.lDrag = false; this.mouse.rDrag = false; this.mouse.mDrag = false; }

		for(let i = activateChildIndex; i < this.children.length - 1; i++) {
			const tmp = this.children[i];
			this.children[i] = this.children[i + 1];
			this.children[i + 1] = tmp;
		}

		if (this.mouse.over) {
			if (this.mouse.pLDrag && (!this.mouse.lDrag)) {
				this.events.dispatchEvent(new CustomEvent("lclick", { detail: this }));
			}
			if (this.mouse.pRDrag && (!this.mouse.rDrag)) {
				this.events.dispatchEvent(new CustomEvent("rclick", { detail: this }));
			}
			if (this.mouse.pMDrag && (!this.mouse.mDrag)) {
				this.events.dispatchEvent(new CustomEvent("mclick", { detail: this }));
			}
		}
	}
	setKey(keyboard) {
		this.keyboard.ctrl  = keyboard.ctrl;
		this.keyboard.shift = keyboard.shift;
		this.keyboard.alt   = keyboard.alt;
		this.keyboard.left  = false;
		this.keyboard.right = false;
		this.keyboard.up    = false;
		this.keyboard.down  = false;
		this.keyboard.press = new Set();
		this.children.slice().forEach(c => {
			if (c.isVisible && (c !== this.activeChild)) c.setKey(this.keyboard);
		});
		this.keyboard.left  = keyboard.left;
		this.keyboard.right = keyboard.right;
		this.keyboard.up    = keyboard.up;
		this.keyboard.down  = keyboard.down;
		this.keyboard.press = new Set(keyboard.press);
		if (this.activeChild !== null && this.activeChild.isVisible) {
			this.activeChild.setKey(this.keyboard);
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
		const children = this.children.slice();
		for(let index = children.length - 1; index >= 0; index--) {
			const child = children[index];
			if (!child.isVisible) continue;
			if (child.isHit(x, y)) {
				child.drop(files, x, y);
				return;
			}
		}
		this.onDrop(files);
	}
	onSetup() {}
	onUpdate() {}
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
		this.pMouse = {
			x: 0, y: 0,
			px: 0, py: 0,
			lPressed: false, pLPressed: false,
			rPressed: false, pRPressed: false,
			mPressed: false, pMPressed: false,
			zDelta: 0,
			lDoubleClick: false
		};
		this.pKeyboard = {
			ctrl: false,
			shift: false,
			alt: false,
			left: false,
			right: false,
			up: false,
			down: false,
			press: new Set()
		};
		this.setEventListener();
		this.setup(context);
	}
	draw() {
		super.setMouse(
			this.pMouse, this.pMouse.lPressed, this.pMouse.rPressed, this.pMouse.mPressed
		);
		super.setKey(this.pKeyboard);
		super.draw();
		this.pMouse.px = this.pMouse.x;
		this.pMouse.py = this.pMouse.y;
		this.pMouse.pLPressed = this.pMouse.lPressed;
		this.pMouse.pRPressed = this.pMouse.rPressed;
		this.pMouse.pMPressed = this.pMouse.mPressed;
		this.pMouse.zDelta = 0;
		this.pMouse.lDoubleClick = false;
		this.pKeyboard.press.clear();
	}
	resize(width, height) {
		this.canvas.width = width;
		this.canvas.height = height;
		super.resize(width, height);
		this.children.slice().forEach(child => { child.resize(this.width, this.height); });
	}
	setEventListener() {
		this.canvas.addEventListener("keydown", e => {
			if (e.key === "Control")      { this.pKeyboard.ctrl  = true; return; }
			if (e.key === "Shift")        { this.pKeyboard.shift = true; return; }
			if (e.key === "Alt")          { this.pKeyboard.alt   = true; return; }
			if (e.key === "ArrowLeft")    { this.pKeyboard.left  = true; return; }
			if (e.key === "ArrowRight")   { this.pKeyboard.right = true; return; }
			if (e.key === "ArrowUp")      { this.pKeyboard.up    = true; return; }
			if (e.key === "ArrowDown")    { this.pKeyboard.down  = true; return; }
			if (e.key === "Delete")       { this.pKeyboard.press.add(e.key); return; }
			if (e.key === "Escape")       { this.pKeyboard.press.add(e.key); return; }
			if (e.key === "Backspace")    { this.pKeyboard.press.add(e.key); return; }
			if (e.ctrlKey)                { this.pKeyboard.press.add(e.key); return; }
			if (e.altKey)                 { this.pKeyboard.press.add(e.key); return; }
		});
		this.canvas.addEventListener("keyup", e => {
			if (e.key === "Control")     this.pKeyboard.ctrl  = false;
			if (e.key === "Shift")       this.pKeyboard.shift = false;
			if (e.key === "Alt")         this.pKeyboard.alt   = false;
			if (e.key === "ArrowLeft")   this.pKeyboard.left  = false;
			if (e.key === "ArrowRight")  this.pKeyboard.right = false;
			if (e.key === "ArrowUp")     this.pKeyboard.up    = false;
			if (e.key === "ArrowDown")   this.pKeyboard.down  = false;
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
