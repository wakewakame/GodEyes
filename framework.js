'use strict';

const CustomMouseEvent = class {
	constructor(e = {}, from = null) {
		this.globalX = ((e.globalX === undefined) ? 0 : e.globalX);
		this.globalY = ((e.globalY === undefined) ? 0 : e.globalY);
		this.x = this.globalX;
		this.y = this.globalY;
		this.movementX = (e.movementX === undefined) ? 0 : e.movementX;
		this.movementY = (e.movementY === undefined) ? 0 : e.movementY;
		this.altKey = (e.altKey === undefined) ? 0 : e.altKey;
		this.ctrlKey = (e.ctrlKey === undefined) ? 0 : e.ctrlKey;
		this.shiftKey = (e.shiftKey === undefined) ? 0 : e.shiftKey;
		this.which = (e.which === undefined) ? 0 : e.which;
		this.wheel = (e.wheel === undefined) ? 0 : e.wheel;
		this.from = from;
	}
	static fromMouseEvent(e, wheel = 0) {
		return new CustomMouseEvent({
			globalX: e.offsetX,
			globalY: e.offsetY,
			x: e.offsetX,
			y: e.offsetY,
			movementX: e.movementX,
			movementY: e.movementY,
			altKey: e.altKey,
			ctrlKey: e.ctrlKey,
			shiftKey: e.shiftKey,
			which: e.which,
			wheel: wheel,
		});
	}
	dispatchComponent(name, component, from = null) {
		const pivot = component.toGlobal({ x: 0, y: 0 });
		const mouseEvent = new CustomMouseEvent(this, (from === null) ? this.from : from);
		mouseEvent.x = mouseEvent.globalX - pivot.x;
		mouseEvent.y = mouseEvent.globalY - pivot.y;
		component.dispatchEvent(name, mouseEvent);
	}
};

const CustomKeyboardEvent = class {
	constructor(e, from = null) {
		this.key = e.key;
		this.altKey = e.altKey;
		this.ctrlKey = e.ctrlKey;
		this.shiftKey = e.shiftKey;
		this.from = from;
	}
	static fromKeyboardEvent(e) {
		return new CustomKeyboardEvent({
			key: e.key,
			altKey: e.altKey,
			ctrlKey: e.ctrlKey,
			shiftKey: e.shiftKey,
		});
	}
	dispatchComponent(name, component, from = null) {
		const keyEvent = new CustomKeyboardEvent(this, (from === null) ? this.from : from);
		component.dispatchEvent(name, keyEvent);
	}
};

const Component = class extends EventListener {
	constructor(left, top, width, height) {
		super();
		this.context = null;                // canvasの2d context
		this.left = left ? left : 0;        // コンポーネントのx座標(親コンポーネントの左上が原点)
		this.top = top ? top : 0;           // コンポーネントのy座標(親コンポーネントの左上が原点)
		this.width = width ? width : 0;     // コンポーネントの幅
		this.height = height ? height : 0;  // コンポーネントの高さ
		this.root = null;                   // ルートコンポーネント
		this.parent = null;                 // 親コンポーネント
		this.children = new Array();        // 子コンポーネント配列
		this.isVisible = true;              // コンポーネントの表示
		this.isFront = false;               // 同じ階層のコンポーネントの中で常に最前面に表示されるようにする
		this.isClip = false;                // コンポーネントの範囲外の描画は透過する

		// 親へのイベント転送
		this.addEventListener("mousemove", e => { if (this.parent !== this) e.dispatchComponent("mousemove", this.parent); });
		this.addEventListener("mousedown", e => { if (this.parent !== this) e.dispatchComponent("mousedown", this.parent); });
		this.addEventListener("mouseup", e => { if (this.parent !== this) e.dispatchComponent("mouseup", this.parent); });
		this.addEventListener("mousewheel", e => { if (this.parent !== this) e.dispatchComponent("mousewheel", this.parent); });
		this.addEventListener("dblclick", e => { if (this.parent !== this) e.dispatchComponent("dblclick", this.parent); });
		this.addEventListener("keydown", e => { if (this.parent !== this) e.dispatchComponent("keydown", this.parent); });
		this.addEventListener("keyup", e => { if (this.parent !== this) e.dispatchComponent("keyup", this.parent); });
		this.addEventListener("keypress", e => { if (this.parent !== this) e.dispatchComponent("keypress", this.parent); });

		// マウスイベント処理
		this.mouse = {
			x: 0, y: 0,
			lDrag: false, rDrag: false, mDrag: false,
			wheel: 0, over: false
		};
		this.addEventListener("mousedown", e => {
			this.mouse.x = e.x;
			this.mouse.y = e.y;
			if (e.which === 1) this.mouse.lDrag = true;
			if (e.which === 2) this.mouse.mDrag = true;
			if (e.which === 3) this.mouse.rDrag = true;
		});
		this.addEventListener("mouseup", e => {
			this.mouse.x = e.x;
			this.mouse.y = e.y;
			if (e.which === 1) this.mouse.lDrag = false;
			if (e.which === 2) this.mouse.mDrag = false;
			if (e.which === 3) this.mouse.rDrag = false;
		});
		this.addEventListener("mousemove", e => {
			this.mouse.x = e.x;
			this.mouse.y = e.y;
		});
		this.addEventListener("mousewheel", e => {
			this.mouse.x = e.x;
			this.mouse.y = e.y;
			this.mouse.wheel += e.wheel;
		});
		this.addEventListener("mouseenter", e => { this.mouse.over = true; });
		this.addEventListener("mouseleave", e => { this.mouse.over = false; });

		// キーイベント処理
		this.key = {
			Control: false, Alt: false, Shift: false,
			ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false
		};
		this.addEventListener("keydown", e => { if (Object.keys(this.key).some(k => (k === e.key))) { this.key[e.key] = true; } });
		this.addEventListener("keyup", e => { if (Object.keys(this.key).some(k => (k === e.key))) { this.key[e.key] = false; } });
	}
	addChild(child) {
		child.context = this.context;
		child.root = this.root;
		child.parent = this;
		this.children.push(child);
		child.onSetup();
		return child;
	}
	removeChild(child) {
		if (!this.children.some(c => (c === child))) return;
		child.context = null;
		child.root = null;
		child.parent = null;
		this.children = this.children.filter(c => (c !== child));
	}
	active(includeParent = true) {
		if (includeParent && (this.parent.parent !== this.parent)) { this.parent.active(true); }
		if (this === this.parent.children[this.parent.children.length - 1]) return;
		const thisIndex = this.parent.children.findIndex(c => (c === this));
		for(let i = thisIndex; i < this.parent.children.length - 1; i++) {
			const tmp = this.parent.children[i];
			this.parent.children[i] = this.parent.children[i + 1];
			this.parent.children[i + 1] = tmp;
		}
	}
	update() {
		this.children.filter(c => c.isFront).forEach(c => {
			const index = this.children.findIndex(c_ => (c_ === c));
			for(let i = index; i < this.children.length - 1; i++) {
				const tmp = this.children[i];
				this.children[i] = this.children[i + 1];
				this.children[i + 1] = tmp;
			}
		});

		this.onUpdate();
		this.children.slice().forEach(c => c.update());
	}
	draw() {
		if (!this.isVisible) return;

		this.context.save();
		try {
			this.context.beginPath();
			this.context.translate(this.left, this.top);
			if (this.isClip) {
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

		this.mouse.wheel = 0;
	}
	resize(width, height) {
		this.width = width;
		this.height = height;
		this.onResize();
		this.dispatchEvent("resize", { width: width, height: height });
	}
	isHit(localPosition, includeChild = true) {
		if (!this.isVisible) return false;
		const thisHit = (
			(0 <= localPosition.x) && (localPosition.x < this.width) &&
			(0 <= localPosition.y) && (localPosition.y < this.height)
		);
		if (thisHit) return true;
		return (
			includeChild &&
			this.children.some(c => c.isHit({ x: localPosition.x - c.left, y: localPosition.y - c.top }, true))
		);
	}
	getHitComponent(localPosition) {
		if (!this.isHit(localPosition)) return null;
		for(let index = this.children.length - 1; index >= 0; index--) {
			const child = this.children[index];
			const childPosition = { x: localPosition.x - child.left, y: localPosition.y - child.top };
			const result = child.getHitComponent(childPosition);
			if (result !== null) return result;
		}
		return this;
	}
	toGlobal(position) {
		if (this === this.root) return position;
		const result = { x: position.x + this.left, y: position.y + this.top };
		return this.parent.toGlobal(result);
	}
	onSetup() {}
	onUpdate() {}
	onDraw() {}
	onAfterDraw() {}
	onResize() {}
};

const RootComponent = class extends Component {
	constructor(canvas) {
		super(0, 0, canvas.width, canvas.height);
		this.canvas = canvas;
		this.context = this.canvas.getContext("2d");
		this.root = this;
		this.parent = this;
		this.lDragComponent = null;  // 右クリックでドラッグ中のコンポーネント
		this.rDragComponent = null;  // 左クリックでドラッグ中のコンポーネント
		this.mDragComponent = null;  // 中央クリックでドラッグ中のコンポーネント
		this.activeChild = null;     // 最後に左クリックされたコンポーネントの参照(ここにキーイベントを送る)
		this.hitComponent = null;    // カーソル直下にあるコンポーネントの参照
		this.onSetup();
	}
	resize(width, height) {
		this.canvas.width = width;
		this.canvas.height = height;
		super.resize(width, height);
	}
	getHitComponent(localPosition) {
		const result = super.getHitComponent(localPosition);
		return (result === null) ? this : result;
	}
	onSetup() {
		const dispatchMouseEvent = (name, e) => {
			const dragComponent = new Set(
				[this.lDragComponent, this.rDragComponent, this.mDragComponent].filter(c => (c !== null))
			);
			if (dragComponent.size > 0) {
				dragComponent.forEach(c => { e.dispatchComponent(name, c, c); });
				return;
			}
			const hitComponent = this.getHitComponent(e);
			e.dispatchComponent(name, hitComponent, hitComponent);
			if (this.hitComponent !== hitComponent) {
				if (this.hitComponent !== null) { this.hitComponent.dispatchEvent("mouseleave", undefined); }
				this.hitComponent = hitComponent;
				this.hitComponent.dispatchEvent("mouseenter", undefined);
			}
		};
		this.canvas.addEventListener("mousemove", e => {
			dispatchMouseEvent("mousemove", CustomMouseEvent.fromMouseEvent(e));
		});
		this.canvas.addEventListener("mousedown", e => {
			const mouseEvent = CustomMouseEvent.fromMouseEvent(e);
			if (mouseEvent.which === 1) { this.activeChild = this.lDragComponent = this.getHitComponent(mouseEvent); }
			if (mouseEvent.which === 2) { this.mDragComponent = this.getHitComponent(mouseEvent); }
			if (mouseEvent.which === 3) { this.rDragComponent = this.getHitComponent(mouseEvent); }
			dispatchMouseEvent("mousedown", mouseEvent);
		});
		this.canvas.addEventListener("mouseup", e => {
			const mouseEvent = CustomMouseEvent.fromMouseEvent(e);
			dispatchMouseEvent("mouseup", mouseEvent);
			if (mouseEvent.which === 1) { this.lDragComponent = null; }
			if (mouseEvent.which === 2) { this.mDragComponent = null; }
			if (mouseEvent.which === 3) { this.rDragComponent = null; }
		});
		this.canvas.addEventListener("dblclick", e => {
			dispatchMouseEvent("dblclick", CustomMouseEvent.fromMouseEvent(e));
		});
		const mousewheel = e => {
			if (e.ctrlKey) { e.preventDefault(); }
			const wheel = e.wheelDelta ? e.wheelDelta : (-e.detail * 20.0);
			dispatchMouseEvent("mousewheel", CustomMouseEvent.fromMouseEvent(e, wheel));
		};
		this.canvas.addEventListener("mousewheel", mousewheel);
		this.canvas.addEventListener("DOMMouseScroll", mousewheel);
		this.canvas.addEventListener("pointerdown", e => { this.canvas.setPointerCapture(e.pointerId); });
		this.canvas.addEventListener("pointerup", e => { this.canvas.releasePointerCapture(e.pointerId); });
		this.canvas.oncontextmenu = () => { return false; };
		this.canvas.addEventListener("keydown", e => {
			if (this.activeChild.parent === null) return;
			this.activeChild.dispatchEvent("keydown", new CustomKeyboardEvent(e));
		});
		this.canvas.addEventListener("keyup", e => {
			if (this.activeChild.parent === null) return;
			this.activeChild.dispatchEvent("keyup", new CustomKeyboardEvent(e));
		});
		this.canvas.addEventListener("keypress", e => {
			if (this.activeChild.parent === null) return;
			this.activeChild.dispatchEvent("keypress", new CustomKeyboardEvent(e));
		});
		document.addEventListener("dragover", e => { e.preventDefault(); });
		document.addEventListener("drop", e => {
			e.preventDefault();
			const files = e.dataTransfer.files;
			if (files.length === 0) return;
			const mouseEvent = CustomMouseEvent.fromMouseEvent(e);
			const hitComponent = this.getHitComponent(mouseEvent);
			hitComponent.dispatchEvent("openfiles", files);
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
	const mainComponent = rootComponent.addChild(new MainComponent(0, 0, rootComponent.width, rootComponent.height));
	rootComponent.addEventListener("resize", e => { mainComponent.resize(e.width, e.height); });
	const loop = () => { rootComponent.update(); rootComponent.draw(); requestAnimationFrame(loop); };
	loop();
});
