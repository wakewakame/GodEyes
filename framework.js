'use strict';

const CustomMouseEvent = class {
	constructor(e = {}) {
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
	dispatchComponent(name, component) {
		const pivot = component.toGlobal({ x: 0, y: 0 });
		const mouseEvent = new CustomMouseEvent(this);
		mouseEvent.x = mouseEvent.globalX - pivot.x;
		mouseEvent.y = mouseEvent.globalY - pivot.y;
		component.dispatchEvent(name, mouseEvent);
	}
};

const CustomKeyboardEvent = class {
	constructor(e) {
		this.key = e.key;
		this.altKey = e.altKey;
		this.ctrlKey = e.ctrlKey;
		this.shiftKey = e.shiftKey;
	}
	static fromKeyboardEvent(e) {
		return new CustomKeyboardEvent({
			key: e.key,
			altKey: e.altKey,
			ctrlKey: e.ctrlKey,
			shiftKey: e.shiftKey,
		});
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
	}
	resize(width, height) {
		this.width = width;
		this.height = height;
		this.onResize();
		this.dispatchEvent("resize", { width: width, height: height });
	}
	isHit(localPosition, includeChild = true) {
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
		super.context = this.canvas.getContext("2d");
		super.root = this;
		super.parent = this;
		this.mouse = { x: 0, y: 0 };
		this.lDragComponent = null;  // 右クリックでドラッグ中のコンポーネント
		this.rDragComponent = null;  // 左クリックでドラッグ中のコンポーネント
		this.mDragComponent = null;  // 中央クリックでドラッグ中のコンポーネント
		this.activeChild = null;
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
			let flag = false;
			if (this.lDragComponent) { e.dispatchComponent(name, this.lDragComponent); flag = true; }
			if (this.rDragComponent) { e.dispatchComponent(name, this.rDragComponent); flag = true; }
			if (this.mDragComponent) { e.dispatchComponent(name, this.mDragComponent); flag = true; }
			if (!flag) { e.dispatchComponent(name, this.getHitComponent(this.mouse)); }
		};
		this.canvas.addEventListener("mousemove", e => {
			const mouseEvent = CustomMouseEvent.fromMouseEvent(e);
			this.mouse.x = mouseEvent.globalX;
			this.mouse.y = mouseEvent.globalY;
			dispatchMouseEvent("mousemove", mouseEvent);
		});
		this.canvas.addEventListener("mousedown", e => {
			const mouseEvent = CustomMouseEvent.fromMouseEvent(e);
			if (mouseEvent.which === 1) { this.activeChild = this.lDragComponent = this.getHitComponent(this.mouse); }
			if (mouseEvent.which === 2) { this.mDragComponent = this.getHitComponent(this.mouse); }
			if (mouseEvent.which === 3) { this.rDragComponent = this.getHitComponent(this.mouse); }
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
		this.canvas.addEventListener("keydown", e => {
			if (this.activeChild === null) return;
			this.activeChild.dispatchEvent("keydown", new CustomKeyboardEvent(e));
		});
		this.canvas.addEventListener("keyup", e => {
			if (this.activeChild === null) return;
			this.activeChild.dispatchEvent("keyup", new CustomKeyboardEvent(e));
		});
		this.canvas.addEventListener("keypress", e => {
			if (this.activeChild === null) return;
			this.activeChild.dispatchEvent("keypress", new CustomKeyboardEvent(e));
		});
		this.canvas.oncontextmenu = () => { return false; };
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
